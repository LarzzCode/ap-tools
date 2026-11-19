import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
} from 'pdf-lib'

export interface PdfSignSummary {
  pageCount: number
  firstPageWidth: number
  firstPageHeight: number
}

export async function inspectPdfForSign(file: File): Promise<PdfSignSummary> {
  const bytes = await file.arrayBuffer()
  const pdf = await PDFDocument.load(bytes)
  const pageCount = pdf.getPageCount()

  if (pageCount === 0) {
    throw new Error('This PDF has no pages.')
  }

  const firstPage = pdf.getPage(0)
  const { width, height } = firstPage.getSize()

  return {
    pageCount,
    firstPageWidth: width,
    firstPageHeight: height,
  }
}

export interface SignaturePlacementOptions {
  signaturePngBytes: ArrayBuffer
  targetPages: 'first' | 'last' | 'all' | number[]
  xPercent: number // 0..100 center X
  yPercent: number // 0..100 center Y from top
  widthPercent: number // 8..60 relative to page width
}

export async function embedSignatureInPdf(
  file: File,
  options: SignaturePlacementOptions,
): Promise<Blob> {
  const pdfBytes = await file.arrayBuffer()
  const pdf = await PDFDocument.load(pdfBytes)
  const totalPages = pdf.getPageCount()

  const signatureImage = await pdf.embedPng(options.signaturePngBytes)
  const aspectRatio = signatureImage.height / signatureImage.width

  let pageIndexes: number[]
  if (options.targetPages === 'first') {
    pageIndexes = [0]
  } else if (options.targetPages === 'last') {
    pageIndexes = [totalPages - 1]
  } else if (options.targetPages === 'all') {
    pageIndexes = Array.from({ length: totalPages }, (_, i) => i)
  } else {
    pageIndexes = options.targetPages
      .map((n) => n - 1)
      .filter((idx) => idx >= 0 && idx < totalPages)
  }

  for (const pageIndex of pageIndexes) {
    const page = pdf.getPage(pageIndex)
    const { width, height } = page.getSize()

    const sigWidth = (width * options.widthPercent) / 100
    const sigHeight = sigWidth * aspectRatio

    const centerX = (width * options.xPercent) / 100
    const centerYFromBottom = height - (height * options.yPercent) / 100

    const x = Math.max(8, Math.min(width - sigWidth - 8, centerX - sigWidth / 2))
    const y = Math.max(
      8,
      Math.min(height - sigHeight - 8, centerYFromBottom - sigHeight / 2),
    )

    page.drawImage(signatureImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    })
  }

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}

export interface WatermarkOptions {
  text: string
  opacity: number // 0.05..0.6
  fontSize: number // 18..96
  angleDegrees: number
  colorHex: string
  placement: 'diagonal' | 'footer'
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return [0.3, 0.3, 0.35]

  const r = parseInt(cleaned.slice(0, 2), 16) / 255
  const g = parseInt(cleaned.slice(2, 4), 16) / 255
  const b = parseInt(cleaned.slice(4, 6), 16) / 255

  return [
    Number.isNaN(r) ? 0.3 : r,
    Number.isNaN(g) ? 0.3 : g,
    Number.isNaN(b) ? 0.35 : b,
  ]
}

export async function addWatermarkToPdf(
  file: File,
  options: WatermarkOptions,
): Promise<Blob> {
  const cleanText = options.text.trim()
  if (!cleanText) {
    throw new Error('Watermark text cannot be empty.')
  }

  const pdfBytes = await file.arrayBuffer()
  const pdf = await PDFDocument.load(pdfBytes)
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const [r, g, b] = hexToRgbTuple(options.colorHex)

  const pages = pdf.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(cleanText, options.fontSize)

    if (options.placement === 'footer') {
      page.drawText(cleanText, {
        x: Math.max(20, (width - textWidth) / 2),
        y: 24,
        size: options.fontSize,
        font,
        color: rgb(r, g, b),
        opacity: options.opacity,
      })
    } else {
      const radians = (options.angleDegrees * Math.PI) / 180
      const x = width / 2 - (textWidth / 2) * Math.cos(radians)
      const y = height / 2 - (textWidth / 2) * Math.sin(radians)

      page.drawText(cleanText, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(r, g, b),
        opacity: options.opacity,
        rotate: degrees(options.angleDegrees),
      })
    }
  }

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
