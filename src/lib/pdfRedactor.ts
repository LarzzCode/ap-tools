import { PDFDocument } from 'pdf-lib'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type RedactionStyle = 'blackout' | 'whiteout' | 'classified'
export type RedactionFlattenMode = 'full-raster' | 'hybrid-selective'
export type SensitivePatternKind =
  | 'nik'
  | 'phone'
  | 'email'
  | 'rupiah'
  | 'custom'

export interface RedactionBox {
  id: string
  pageNumber: number // 1-indexed
  /** Normalized 0..1 coordinates from top-left of rendered viewport */
  x: number
  y: number
  w: number
  h: number
  label?: string
  source?: SensitivePatternKind | 'manual'
}

export interface PdfForensicMetadataEntry {
  key: string
  value: string
}

export interface PdfForensicInspection {
  pageCount: number
  metadataEntries: PdfForensicMetadataEntry[]
  totalTextItems: number
}

export interface RedactionExportResult {
  blob: Blob
  redactedPageCount: number
  totalPages: number
  metadataClearedCount: number
  verifiedZeroSelectableCharsOnRedactedPages: boolean
}

export const PATTERN_REGEX_MAP: Record<
  Exclude<SensitivePatternKind, 'custom'>,
  RegExp
> = {
  nik: /\b\d{16}\b/g,
  phone: /(?:\+62|62|0)8[1-9][0-9\s.-]{6,13}\b/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  rupiah: /Rp\.?\s*[0-9]+(?:[.,][0-9]{3})+(?:,[0-9]{1,2})?/gi,
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to rasterize PDF page canvas.'))
          return
        }
        blob.arrayBuffer().then(resolve, reject)
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function inspectPdfForensics(
  file: File,
): Promise<PdfForensicInspection> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const rawBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(rawBuffer.slice(0)),
  })
  const pdfDoc = await loadingTask.promise

  const metadataEntries: PdfForensicMetadataEntry[] = []

  try {
    const meta = await pdfDoc.getMetadata()
    const infoObj = (meta?.info ?? {}) as Record<string, unknown>
    const watchedKeys = [
      'Title',
      'Author',
      'Subject',
      'Keywords',
      'Creator',
      'Producer',
      'CreationDate',
      'ModDate',
    ]

    for (const k of watchedKeys) {
      const val = infoObj[k]
      if (typeof val === 'string' && val.trim().length > 0) {
        metadataEntries.push({ key: k, value: val.trim() })
      }
    }

    if (meta?.metadata) {
      const xmpPairs = Array.from(meta.metadata as Iterable<unknown>)
      if (xmpPairs.length > 0) {
        metadataEntries.push({
          key: 'XMP Stream',
          value: `${xmpPairs.length} properti XML tertanam`,
        })
      }
    }
  } catch {
    // Ignore malformed metadata streams
  }

  let totalTextItems = 0
  const maxInspectPages = Math.min(pdfDoc.numPages, 40)
  for (let p = 1; p <= maxInspectPages; p++) {
    const page = await pdfDoc.getPage(p)
    const content = await page.getTextContent()
    totalTextItems += content.items.length
  }

  const pageCount = pdfDoc.numPages
  await pdfDoc.cleanup()
  await loadingTask.destroy()

  return {
    pageCount,
    metadataEntries,
    totalTextItems,
  }
}

export async function renderSinglePdfPageToDataUrl(
  file: File,
  pageNumber: number,
  scale = 1.65,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const rawBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(rawBuffer),
  })
  const pdfDoc = await loadingTask.promise

  try {
    const clampedPage = Math.max(1, Math.min(pdfDoc.numPages, pageNumber))
    const page = await pdfDoc.getPage(clampedPage)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D is unavailable.')
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    }
  } finally {
    await pdfDoc.cleanup()
    await loadingTask.destroy()
  }
}

export async function scanPdfForSensitiveBoxes(
  file: File,
  options: {
    kinds: Exclude<SensitivePatternKind, 'custom'>[]
    customKeyword?: string
  },
): Promise<RedactionBox[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const rawBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(rawBuffer),
  })
  const pdfDoc = await loadingTask.promise

  const discovered: RedactionBox[] = []
  const customTrimmed = (options.customKeyword ?? '').trim()
  const customRegex =
    customTrimmed.length >= 2
      ? new RegExp(escapeRegExp(customTrimmed), 'gi')
      : null

  try {
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      const pageW = Math.max(1, viewport.width)
      const pageH = Math.max(1, viewport.height)
      const textContent = await page.getTextContent()

      for (const rawItem of textContent.items) {
        if (!('str' in rawItem) || !rawItem.str) continue
        const str = rawItem.str
        const transform = rawItem.transform as number[]
        const itemWidthPdf = Math.max(4, rawItem.width || 12)
        const fontHeightPdf = Math.max(
          8,
          Math.hypot(transform[2] || 0, transform[3] || 10),
          rawItem.height || 0,
        )

        const pdfX = transform[4]
        const pdfY = transform[5]

        // Convert bottom-left baseline PDF coordinates into top-left viewport coordinates
        const [vx1, vy1] = viewport.convertToViewportPoint(
          pdfX,
          pdfY - fontHeightPdf * 0.22,
        ) as [number, number]
        const [vx2, vy2] = viewport.convertToViewportPoint(
          pdfX + itemWidthPdf,
          pdfY + fontHeightPdf * 0.92,
        ) as [number, number]

        const boxLeft = Math.min(vx1, vx2)
        const boxTop = Math.min(vy1, vy2)
        const boxWidth = Math.abs(vx2 - vx1)
        const boxHeight = Math.abs(vy2 - vy1)

        const addSubstringMatch = (
          matchIndex: number,
          matchLength: number,
          sourceKind: SensitivePatternKind,
          matchedLabel: string,
        ) => {
          const totalLen = Math.max(1, str.length)
          const startRatio = Math.max(0, matchIndex / totalLen)
          const lenRatio = Math.min(1 - startRatio, matchLength / totalLen)

          const padX = 2.5
          const padY = 1.5
          const subX = Math.max(0, boxLeft + boxWidth * startRatio - padX)
          const subW = Math.min(
            pageW - subX,
            Math.max(8, boxWidth * lenRatio + padX * 2),
          )
          const subY = Math.max(0, boxTop - padY)
          const subH = Math.min(pageH - subY, Math.max(8, boxHeight + padY * 2))

          discovered.push({
            id: `auto-${pageNum}-${discovered.length + 1}-${Date.now()}`,
            pageNumber: pageNum,
            x: Number((subX / pageW).toFixed(4)),
            y: Number((subY / pageH).toFixed(4)),
            w: Number((subW / pageW).toFixed(4)),
            h: Number((subH / pageH).toFixed(4)),
            label: matchedLabel,
            source: sourceKind,
          })
        }

        for (const kind of options.kinds) {
          const rx = new RegExp(
            PATTERN_REGEX_MAP[kind].source,
            PATTERN_REGEX_MAP[kind].flags,
          )
          let match: RegExpExecArray | null = rx.exec(str)
          while (match !== null) {
            addSubstringMatch(match.index, match[0].length, kind, kind.toUpperCase())
            match = rx.exec(str)
          }
        }

        if (customRegex) {
          customRegex.lastIndex = 0
          let cMatch: RegExpExecArray | null = customRegex.exec(str)
          while (cMatch !== null) {
            addSubstringMatch(
              cMatch.index,
              cMatch[0].length,
              'custom',
              customTrimmed,
            )
            cMatch = customRegex.exec(str)
          }
        }
      }
    }
  } finally {
    await pdfDoc.cleanup()
    await loadingTask.destroy()
  }

  return discovered
}

export function paintRedactionBoxesOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  boxes: RedactionBox[],
  style: RedactionStyle,
  stampText = 'REDACTED',
): void {
  for (const box of boxes) {
    const rx = Math.round(box.x * canvasWidth)
    const ry = Math.round(box.y * canvasHeight)
    const rw = Math.max(2, Math.round(box.w * canvasWidth))
    const rh = Math.max(2, Math.round(box.h * canvasHeight))

    // Overwrite pixel buffer destructively
    ctx.clearRect(rx, ry, rw, rh)

    if (style === 'whiteout') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(rx, ry, rw, rh)
    } else {
      ctx.fillStyle = '#000000'
      ctx.fillRect(rx, ry, rw, rh)

      if (style === 'classified' && rw >= 48 && rh >= 14) {
        const fontSize = Math.max(9, Math.min(18, Math.floor(rh * 0.52)))
        ctx.save()
        ctx.beginPath()
        ctx.rect(rx + 2, ry + 1, rw - 4, rh - 2)
        ctx.clip()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(stampText, rx + rw / 2, ry + rh / 2 + 0.5)
        ctx.restore()
      }
    }
  }
}

export async function buildForensicRedactedPdf(
  file: File,
  boxes: RedactionBox[],
  options: {
    style: RedactionStyle
    flattenMode: RedactionFlattenMode
    dpiScale: number
    stampText?: string
  },
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<RedactionExportResult> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const rawBuffer = await file.arrayBuffer()
  const inspection = await inspectPdfForensics(file)

  const srcLoadingTask = pdfjs.getDocument({
    data: new Uint8Array(rawBuffer.slice(0)),
  })
  const srcPdfJs = await srcLoadingTask.promise

  const srcPdfLib =
    options.flattenMode === 'hybrid-selective'
      ? await PDFDocument.load(rawBuffer.slice(0), { ignoreEncryption: true })
      : null

  // Brand-new sterile PDF container with zero inherited XMP, JS, or revision history
  const cleanPdf = await PDFDocument.create()
  cleanPdf.setTitle('')
  cleanPdf.setAuthor('')
  cleanPdf.setSubject('')
  cleanPdf.setKeywords([])
  cleanPdf.setProducer('')
  cleanPdf.setCreator('')

  const boxesByPage = new Map<number, RedactionBox[]>()
  for (const b of boxes) {
    const list = boxesByPage.get(b.pageNumber) ?? []
    list.push(b)
    boxesByPage.set(b.pageNumber, list)
  }

  const totalPages = srcPdfJs.numPages
  const redactedPageNumbers: number[] = []

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(pageNum, totalPages)
      const pageBoxes = boxesByPage.get(pageNum) ?? []
      const hasRedactions = pageBoxes.length > 0
      if (hasRedactions) {
        redactedPageNumbers.push(pageNum)
      }

      const shouldRasterize =
        options.flattenMode === 'full-raster' || hasRedactions

      if (!shouldRasterize && srcPdfLib) {
        const [copiedPage] = await cleanPdf.copyPages(srcPdfLib, [pageNum - 1])
        cleanPdf.addPage(copiedPage)
        continue
      }

      const page = await srcPdfJs.getPage(pageNum)
      const baseViewport = page.getViewport({ scale: 1.0 })
      const renderViewport = page.getViewport({ scale: options.dpiScale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(renderViewport.width))
      canvas.height = Math.max(1, Math.floor(renderViewport.height))

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable for forensic burn.')
      }

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvas,
        canvasContext: ctx,
        viewport: renderViewport,
      }).promise

      if (pageBoxes.length > 0) {
        paintRedactionBoxesOnCanvas(
          ctx,
          canvas.width,
          canvas.height,
          pageBoxes,
          options.style,
          options.stampText ?? 'REDACTED',
        )
      }

      const jpgBytes = await canvasToJpegBytes(canvas, 0.92)
      const embeddedImg = await cleanPdf.embedJpg(jpgBytes)

      const outPage = cleanPdf.addPage([
        baseViewport.width,
        baseViewport.height,
      ])
      outPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      })
    }
  } finally {
    await srcPdfJs.cleanup()
    await srcLoadingTask.destroy()
  }

  const savedBytes = await cleanPdf.save({ useObjectStreams: true })

  // Forensic self-check: confirm 0 selectable text tokens exist on every redacted page
  let verifiedZero = true
  if (redactedPageNumbers.length > 0) {
    const verifyTask = pdfjs.getDocument({
      data: new Uint8Array(savedBytes.buffer.slice(0)),
    })
    const verifyDoc = await verifyTask.promise
    try {
      for (const pNum of redactedPageNumbers) {
        const vPage = await verifyDoc.getPage(pNum)
        const vText = await vPage.getTextContent()
        if (vText.items.length > 0) {
          verifiedZero = false
          break
        }
      }
    } finally {
      await verifyDoc.cleanup()
      await verifyTask.destroy()
    }
  }

  return {
    blob: new Blob([savedBytes as BlobPart], { type: 'application/pdf' }),
    redactedPageCount: redactedPageNumbers.length,
    totalPages,
    metadataClearedCount: inspection.metadataEntries.length,
    verifiedZeroSelectableCharsOnRedactedPages: verifiedZero,
  }
}
