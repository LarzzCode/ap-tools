import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
} from 'pdf-lib'

export interface OrganizedPageItem {
  id: string
  originalIndex: number // 0-based index in source PDF
  pageNumber: number // 1-based original number
  width: number
  height: number
  rotationDelta: number // 0, 90, 180, 270
  excluded: boolean
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'top-right'

export type PageNumberFormat =
  | 'simple'
  | 'id-of-total'
  | 'en-of-total'

export interface OrganizePdfOptions {
  pages: OrganizedPageItem[]
  addPageNumbers: boolean
  numberPosition: PageNumberPosition
  numberFormat: PageNumberFormat
  startNumber: number
}

export async function inspectPdfPages(
  file: File,
): Promise<OrganizedPageItem[]> {
  const bytes = await file.arrayBuffer()
  const pdf = await PDFDocument.load(bytes)
  const pages = pdf.getPages()

  if (pages.length === 0) {
    throw new Error('Dokumen PDF ini tidak memiliki halaman.')
  }

  return pages.map((page, index) => {
    const { width, height } = page.getSize()
    return {
      id: `page-${index + 1}`,
      originalIndex: index,
      pageNumber: index + 1,
      width: Math.round(width),
      height: Math.round(height),
      rotationDelta: 0,
      excluded: false,
    }
  })
}

function formatPageNumberLabel(
  current: number,
  total: number,
  format: PageNumberFormat,
): string {
  switch (format) {
    case 'id-of-total':
      return `Halaman ${current} dari ${total}`
    case 'en-of-total':
      return `Page ${current} of ${total}`
    default:
      return `${current}`
  }
}

export async function exportOrganizedPdf(
  file: File,
  options: OrganizePdfOptions,
): Promise<Blob> {
  const activePages = options.pages.filter((page) => !page.excluded)

  if (activePages.length === 0) {
    throw new Error(
      'Minimal harus ada 1 halaman yang dipertahankan untuk membuat PDF.',
    )
  }

  const sourceBytes = await file.arrayBuffer()
  const sourcePdf = await PDFDocument.load(sourceBytes)
  const outputPdf = await PDFDocument.create()

  const indicesToCopy = activePages.map((p) => p.originalIndex)
  const copiedPages = await outputPdf.copyPages(sourcePdf, indicesToCopy)

  const font = options.addPageNumbers
    ? await outputPdf.embedFont(StandardFonts.Helvetica)
    : null

  const totalOut = copiedPages.length

  copiedPages.forEach((page, outIdx) => {
    const config = activePages[outIdx]
    const currentRotation = page.getRotation().angle
    const nextRotation = (currentRotation + config.rotationDelta + 360) % 360
    page.setRotation(degrees(nextRotation))

    if (options.addPageNumbers && font) {
      const { width, height } = page.getSize()
      const displayNum = options.startNumber + outIdx
      const label = formatPageNumberLabel(
        displayNum,
        totalOut + (options.startNumber - 1),
        options.numberFormat,
      )
      const fontSize = 10
      const textWidth = font.widthOfTextAtSize(label, fontSize)

      let x = (width - textWidth) / 2
      let y = 22

      if (options.numberPosition === 'bottom-right') {
        x = Math.max(24, width - textWidth - 28)
        y = 22
      } else if (options.numberPosition === 'top-right') {
        x = Math.max(24, width - textWidth - 28)
        y = Math.max(24, height - 28)
      }

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.28, 0.32, 0.38),
      })
    }

    outputPdf.addPage(page)
  })

  const saved = await outputPdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
