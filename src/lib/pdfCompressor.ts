import { PDFDocument } from 'pdf-lib'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type PdfCompressionLevel =
  | 'balanced'
  | 'compact'
  | 'structure'

export interface PdfCompressResult {
  blob: Blob
  pageCount: number
  originalSize: number
  compressedSize: number
}

const LEVEL_SETTINGS: Record<
  Exclude<PdfCompressionLevel, 'structure'>,
  { scale: number; jpegQuality: number }
> = {
  balanced: {
    scale: 1.5, // ~108-144 DPI clarity
    jpegQuality: 0.72,
  },
  compact: {
    scale: 1.15, // ~85-110 DPI maximum size reduction
    jpegQuality: 0.54,
  },
}

function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengompres halaman PDF.'))
          return
        }
        blob.arrayBuffer().then(resolve).catch(reject)
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function compressPdfDocument(
  file: File,
  level: PdfCompressionLevel,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<PdfCompressResult> {
  const sourceBuffer = await file.arrayBuffer()

  if (level === 'structure') {
    const sourcePdf = await PDFDocument.load(sourceBuffer)
    const pageCount = sourcePdf.getPageCount()
    if (pageCount === 0) {
      throw new Error('Dokumen PDF ini tidak memiliki halaman.')
    }

    const cleanPdf = await PDFDocument.create()
    const indices = Array.from({ length: pageCount }, (_, i) => i)
    const copied = await cleanPdf.copyPages(sourcePdf, indices)
    copied.forEach((p, idx) => {
      cleanPdf.addPage(p)
      onProgress?.(idx + 1, pageCount)
    })

    cleanPdf.setTitle('')
    cleanPdf.setAuthor('')
    cleanPdf.setSubject('')
    cleanPdf.setKeywords([])
    cleanPdf.setProducer('')
    cleanPdf.setCreator('')

    const saved = await cleanPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    })

    const blob = new Blob([saved as BlobPart], { type: 'application/pdf' })
    return {
      blob,
      pageCount,
      originalSize: file.size,
      compressedSize: blob.size,
    }
  }

  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(sourceBuffer),
  })
  const pdfDoc = await loadingTask.promise
  const totalPages = pdfDoc.numPages

  if (totalPages === 0) {
    throw new Error('Dokumen PDF ini tidak memiliki halaman.')
  }

  const { scale, jpegQuality } = LEVEL_SETTINGS[level]
  const outPdf = await PDFDocument.create()

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages)

    const page = await pdfDoc.getPage(pageNum)
    const baseViewport = page.getViewport({ scale: 1 })
    const renderViewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(renderViewport.width))
    canvas.height = Math.max(1, Math.floor(renderViewport.height))

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Browser tidak mendukung HTML5 Canvas.')
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport: renderViewport,
    }).promise

    const jpegBytes = await canvasToJpegBytes(canvas, jpegQuality)
    const embeddedJpg = await outPdf.embedJpg(jpegBytes)

    const pdfPage = outPdf.addPage([
      baseViewport.width,
      baseViewport.height,
    ])
    pdfPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    })
  }

  const savedBytes = await outPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  })
  const outBlob = new Blob([savedBytes as BlobPart], {
    type: 'application/pdf',
  })

  return {
    blob: outBlob,
    pageCount: totalPages,
    originalSize: file.size,
    compressedSize: outBlob.size,
  }
}
