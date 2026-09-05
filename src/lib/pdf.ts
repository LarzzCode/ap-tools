import {
  PDFDocument,
  type PDFImage,
} from 'pdf-lib'

export type PdfOrientation =
  | 'portrait'
  | 'landscape'

export type PdfMargin =
  | 'none'
  | 'small'
  | 'normal'

interface GenerateImagePdfOptions {
  orientation: PdfOrientation
  margin: PdfMargin
}

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

const marginMap: Record<PdfMargin, number> = {
  none: 0,
  small: 24,
  normal: 48,
}

function loadImage(
  file: File,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl =
      URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)

      reject(
        new Error(
          `Unable to load ${file.name}.`,
        ),
      )
    }

    image.src = objectUrl
  })
}

async function convertToPng(
  file: File,
): Promise<ArrayBuffer> {
  const image = await loadImage(file)

  const canvas =
    document.createElement('canvas')

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas is not supported in this browser.',
    )
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob = await new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(
              new Error(
                'Unable to convert image.',
              ),
            )
            return
          }

          resolve(result)
        },
        'image/png',
      )
    },
  )

  return blob.arrayBuffer()
}

async function embedImage(
  pdf: PDFDocument,
  file: File,
): Promise<PDFImage> {
  if (file.type === 'image/jpeg') {
    return pdf.embedJpg(
      await file.arrayBuffer(),
    )
  }

  if (file.type === 'image/png') {
    return pdf.embedPng(
      await file.arrayBuffer(),
    )
  }

  if (file.type === 'image/webp') {
    const pngBytes =
      await convertToPng(file)

    return pdf.embedPng(pngBytes)
  }

  throw new Error(
    `Unsupported image type: ${file.type}`,
  )
}

export async function generateImagePdf(
  files: File[],
  options: GenerateImagePdfOptions,
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error(
      'At least one image is required.',
    )
  }

  const pdf = await PDFDocument.create()

  const isPortrait =
    options.orientation === 'portrait'

  const pageWidth = isPortrait
    ? A4_WIDTH
    : A4_HEIGHT

  const pageHeight = isPortrait
    ? A4_HEIGHT
    : A4_WIDTH

  const margin = marginMap[options.margin]

  const availableWidth =
    pageWidth - margin * 2

  const availableHeight =
    pageHeight - margin * 2

  for (const file of files) {
    const embeddedImage =
      await embedImage(pdf, file)

    const scale = Math.min(
      availableWidth / embeddedImage.width,
      availableHeight / embeddedImage.height,
    )

    const imageWidth =
      embeddedImage.width * scale

    const imageHeight =
      embeddedImage.height * scale

    const x =
      (pageWidth - imageWidth) / 2

    const y =
      (pageHeight - imageHeight) / 2

    const page = pdf.addPage([
      pageWidth,
      pageHeight,
    ])

    page.drawImage(embeddedImage, {
      x,
      y,
      width: imageWidth,
      height: imageHeight,
    })
  }

  const bytes = await pdf.save()

  return new Blob(
    [bytes as BlobPart],
    {
      type: 'application/pdf',
    },
  )
}