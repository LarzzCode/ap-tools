import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type PdfImageFormat = 'jpeg' | 'png' | 'webp'
export type PdfImageScale = 'standard' | 'hd' | 'ultra'

export interface RenderedPdfPage {
  pageNumber: number
  dataUrl: string
  blob: Blob
  width: number
  height: number
  sizeBytes: number
  fileName: string
}

const SCALE_MAP: Record<PdfImageScale, number> = {
  standard: 1.5,
  hd: 2.0,
  ultra: 2.75,
}

const MIME_MAP: Record<PdfImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const EXT_MAP: Record<PdfImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

export function parsePageSelection(
  rangeInput: string,
  totalPages: number,
): number[] {
  const trimmed = rangeInput.trim()
  if (!trimmed) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1)
  }

  const selected = new Set<number>()
  const parts = trimmed.split(',')

  for (const rawPart of parts) {
    const part = rawPart.trim()
    if (!part) continue

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim())
      const start = Number.parseInt(startStr, 10)
      const end = Number.parseInt(endStr, 10)
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const low = Math.max(1, Math.min(start, end))
        const high = Math.min(totalPages, Math.max(start, end))
        for (let p = low; p <= high; p++) {
          selected.add(p)
        }
      }
    } else {
      const num = Number.parseInt(part, 10)
      if (Number.isFinite(num) && num >= 1 && num <= totalPages) {
        selected.add(num)
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b)
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to encode page canvas into image blob.'))
        }
      },
      mimeType,
      quality,
    )
  })
}

export async function inspectPdfPageCount(file: File): Promise<number> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const pdfDoc = await loadingTask.promise
  return pdfDoc.numPages
}

export async function convertPdfToImages(
  file: File,
  options: {
    format: PdfImageFormat
    scale: PdfImageScale
    pageRange?: string
    quality?: number
  },
  onProgress?: (current: number, total: number) => void,
): Promise<RenderedPdfPage[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const pdfDoc = await loadingTask.promise
  const totalPages = pdfDoc.numPages

  const targetPages = parsePageSelection(options.pageRange ?? '', totalPages)
  if (targetPages.length === 0) {
    throw new Error('Tidak ada nomor halaman valid yang dipilih.')
  }

  const scaleFactor = SCALE_MAP[options.scale]
  const mimeType = MIME_MAP[options.format]
  const ext = EXT_MAP[options.format]
  const baseName = file.name.replace(/\.pdf$/i, '') || 'dokumen'
  const quality = options.format === 'png' ? undefined : (options.quality ?? 0.9)

  const results: RenderedPdfPage[] = []

  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i]
    onProgress?.(i + 1, targetPages.length)

    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: scaleFactor })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D context tidak tersedia di browser ini.')
    }

    // Fill solid white background so transparent PDFs look clean in JPEG/PNG
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise

    const blob = await canvasToBlob(canvas, mimeType, quality)
    const dataUrl = canvas.toDataURL(mimeType, quality)

    results.push({
      pageNumber: pageNum,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: blob.size,
      fileName: `${baseName}-halaman-${pageNum}.${ext}`,
    })
  }

  return results
}
