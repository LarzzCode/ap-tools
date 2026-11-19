import { PDFDocument } from 'pdf-lib'

export interface PasFotoPreset {
  id: string
  label: string
  description: string
  widthMm: number
  heightMm: number
}

export const PAS_FOTO_PRESETS: PasFotoPreset[] = [
  {
    id: '2x3',
    label: '2 × 3 cm',
    description: 'Kartu pelajar, ijazah kecil',
    widthMm: 20,
    heightMm: 30,
  },
  {
    id: '3x4',
    label: '3 × 4 cm',
    description: 'Lamaran kerja, SKCK, administrasi',
    widthMm: 30,
    heightMm: 40,
  },
  {
    id: '4x6',
    label: '4 × 6 cm',
    description: 'Paspor RI, CPNS, dokumen resmi',
    widthMm: 40,
    heightMm: 60,
  },
  {
    id: 'visa-eu',
    label: '3.5 × 4.5 cm',
    description: 'Standar Schengen / Visa',
    widthMm: 35,
    heightMm: 45,
  },
  {
    id: 'us-passport',
    label: '5.1 × 5.1 cm (2×2 in)',
    description: 'US Visa / Square ID',
    widthMm: 51,
    heightMm: 51,
  },
]

export type SheetPaperSize = '4r' | 'a4'

export const SHEET_PAPERS: Record<
  SheetPaperSize,
  { label: string; widthMm: number; heightMm: number }
> = {
  '4r': {
    label: '4R Photo Paper (10.2 × 15.2 cm)',
    widthMm: 102,
    heightMm: 152,
  },
  a4: {
    label: 'A4 Sheet (21.0 × 29.7 cm)',
    widthMm: 210,
    heightMm: 297,
  },
}

export interface CropTransform {
  zoom: number
  offsetX: number // -1 to 1 normalized pan
  offsetY: number // -1 to 1 normalized pan
  backgroundColor: string | null // null = transparent (if PNG input) or untouched
}

const DPI = 300
const MM_PER_INCH = 25.4

export function mmToPixels(mm: number, dpi = DPI): number {
  return Math.round((mm / MM_PER_INCH) * dpi)
}

export function mmToPdfPoints(mm: number): number {
  return (mm / MM_PER_INCH) * 72
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to load image.'))
    img.src = url
  })
}

export function renderCroppedPhotoCanvas(
  image: HTMLImageElement,
  preset: PasFotoPreset,
  transform: CropTransform,
): HTMLCanvasElement {
  const targetWidth = mmToPixels(preset.widthMm)
  const targetHeight = mmToPixels(preset.heightMm)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.')
  }

  if (transform.backgroundColor) {
    ctx.fillStyle = transform.backgroundColor
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  const baseScale = Math.max(
    targetWidth / image.naturalWidth,
    targetHeight / image.naturalHeight,
  )

  const scale = baseScale * transform.zoom
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale

  const maxPanX = Math.max(0, (drawWidth - targetWidth) / 2)
  const maxPanY = Math.max(0, (drawHeight - targetHeight) / 2)

  const drawX =
    (targetWidth - drawWidth) / 2 + transform.offsetX * maxPanX
  const drawY =
    (targetHeight - drawHeight) / 2 + transform.offsetY * maxPanY

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  return canvas
}

export function computeSheetGrid(
  paper: SheetPaperSize,
  preset: PasFotoPreset,
  gapMm = 3,
  marginMm = 6,
) {
  const spec = SHEET_PAPERS[paper]
  const usableW = spec.widthMm - marginMm * 2
  const usableH = spec.heightMm - marginMm * 2

  const cols = Math.max(
    1,
    Math.floor((usableW + gapMm) / (preset.widthMm + gapMm)),
  )
  const rows = Math.max(
    1,
    Math.floor((usableH + gapMm) / (preset.heightMm + gapMm)),
  )

  return {
    cols,
    rows,
    totalCount: cols * rows,
    paperWidthMm: spec.widthMm,
    paperHeightMm: spec.heightMm,
  }
}

export function renderPrintSheetCanvas(
  singlePhotoCanvas: HTMLCanvasElement,
  paper: SheetPaperSize,
  preset: PasFotoPreset,
  options: {
    gapMm?: number
    cutMarks?: boolean
    maxCopies?: number
  } = {},
): HTMLCanvasElement {
  const gapMm = options.gapMm ?? 3
  const cutMarks = options.cutMarks ?? true

  const spec = SHEET_PAPERS[paper]
  const sheetWidth = mmToPixels(spec.widthMm)
  const sheetHeight = mmToPixels(spec.heightMm)

  const photoW = mmToPixels(preset.widthMm)
  const photoH = mmToPixels(preset.heightMm)
  const gapPx = mmToPixels(gapMm)

  const { cols, rows, totalCount } = computeSheetGrid(
    paper,
    preset,
    gapMm,
    6,
  )

  const copies = Math.min(totalCount, options.maxCopies ?? totalCount)

  const gridWidth = cols * photoW + (cols - 1) * gapPx
  const gridHeight = rows * photoH + (rows - 1) * gapPx

  const startX = Math.round((sheetWidth - gridWidth) / 2)
  const startY = Math.round((sheetHeight - gridHeight) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = sheetWidth
  canvas.height = sheetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheetWidth, sheetHeight)

  let drawn = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (drawn >= copies) break

      const x = startX + col * (photoW + gapPx)
      const y = startY + row * (photoH + gapPx)

      ctx.drawImage(singlePhotoCanvas, x, y, photoW, photoH)

      if (cutMarks) {
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, photoW, photoH)
      }

      drawn++
    }
  }

  return canvas
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png',
  quality = 0.95,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export image.'))
          return
        }
        resolve(blob)
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality,
    )
  })
}

export async function exportPrintSheetPdf(
  sheetCanvas: HTMLCanvasElement,
  paper: SheetPaperSize,
): Promise<Blob> {
  const spec = SHEET_PAPERS[paper]
  const jpgBlob = await canvasToBlob(sheetCanvas, 'image/jpeg', 0.96)
  const jpgBytes = await jpgBlob.arrayBuffer()

  const pdf = await PDFDocument.create()
  const pageWidth = mmToPdfPoints(spec.widthMm)
  const pageHeight = mmToPdfPoints(spec.heightMm)

  const page = pdf.addPage([pageWidth, pageHeight])
  const embedded = await pdf.embedJpg(jpgBytes)

  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  })

  const bytes = await pdf.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
