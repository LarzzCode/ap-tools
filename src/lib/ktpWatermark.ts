export type WatermarkPattern = 'tiled' | 'diagonal-banner' | 'center-stamp'
export type RedactionMode = 'pixelate' | 'solid'

export interface RedactionBox {
  id: string
  label: string
  xPercent: number // 0..90
  yPercent: number // 0..90
  widthPercent: number // 5..80
  heightPercent: number // 3..40
  mode: RedactionMode
}

export interface KtpWatermarkOptions {
  text: string
  includeDate: boolean
  dateString: string
  pattern: WatermarkPattern
  colorHex: string
  opacity: number // 0.1..0.85
  fontSizeScale: number // 0.6..1.8
  angleDegrees: number // -60..60
  redactions: RedactionBox[]
}

export function loadKtpImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat gambar dokumen.'))
    img.src = url
  })
}

function applyPixelateRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const safeX = Math.max(0, Math.floor(x))
  const safeY = Math.max(0, Math.floor(y))
  const safeW = Math.max(4, Math.min(ctx.canvas.width - safeX, Math.floor(w)))
  const safeH = Math.max(4, Math.min(ctx.canvas.height - safeY, Math.floor(h)))

  const blockSize = Math.max(8, Math.round(Math.min(safeW, safeH) / 4))
  const imageData = ctx.getImageData(safeX, safeY, safeW, safeH)
  const data = imageData.data

  for (let by = 0; by < safeH; by += blockSize) {
    for (let bx = 0; bx < safeW; bx += blockSize) {
      const sampleX = Math.min(safeW - 1, bx + Math.floor(blockSize / 2))
      const sampleY = Math.min(safeH - 1, by + Math.floor(blockSize / 2))
      const idx = (sampleY * safeW + sampleX) * 4

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(
        safeX + bx,
        safeY + by,
        Math.min(blockSize, safeW - bx),
        Math.min(blockSize, safeH - by),
      )
    }
  }
}

export function renderWatermarkedKtpCanvas(
  image: HTMLImageElement,
  options: KtpWatermarkOptions,
): HTMLCanvasElement {
  const width = image.naturalWidth
  const height = image.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser tidak mendukung HTML5 Canvas.')
  }

  // 1. Draw base ID image
  ctx.drawImage(image, 0, 0, width, height)

  // 2. Apply redaction / blur zones first (so watermark sits on top)
  for (const box of options.redactions) {
    const rx = (box.xPercent / 100) * width
    const ry = (box.yPercent / 100) * height
    const rw = (box.widthPercent / 100) * width
    const rh = (box.heightPercent / 100) * height

    if (box.mode === 'solid') {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(rx, ry, rw, rh)
    } else {
      applyPixelateRegion(ctx, rx, ry, rw, rh)
    }
  }

  // 3. Compose watermark label
  const baseLabel = options.text.trim() || 'HANYA UNTUK VERIFIKASI'
  const fullText = options.includeDate
    ? `${baseLabel} • ${options.dateString}`
    : baseLabel

  const diagonal = Math.hypot(width, height)
  const baseFontSize = Math.max(16, Math.round(diagonal * 0.028 * options.fontSizeScale))

  ctx.save()
  ctx.globalAlpha = options.opacity
  ctx.fillStyle = options.colorHex
  ctx.strokeStyle =
    options.colorHex.toLowerCase() === '#ffffff'
      ? 'rgba(0,0,0,0.45)'
      : 'rgba(255,255,255,0.45)'
  ctx.lineWidth = Math.max(1.5, baseFontSize * 0.08)
  ctx.font = `700 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const angleRad = (options.angleDegrees * Math.PI) / 180

  if (options.pattern === 'tiled') {
    ctx.translate(width / 2, height / 2)
    ctx.rotate(angleRad)

    const metrics = ctx.measureText(fullText)
    const stepX = Math.max(metrics.width + baseFontSize * 2.4, diagonal * 0.35)
    const stepY = Math.max(baseFontSize * 3.4, diagonal * 0.14)

    let rowIndex = 0
    for (let y = -diagonal; y <= diagonal; y += stepY) {
      const rowOffset = rowIndex % 2 === 0 ? 0 : stepX / 2
      for (let x = -diagonal; x <= diagonal; x += stepX) {
        ctx.strokeText(fullText, x + rowOffset, y)
        ctx.fillText(fullText, x + rowOffset, y)
      }
      rowIndex++
    }
  } else if (options.pattern === 'diagonal-banner') {
    ctx.translate(width / 2, height / 2)
    ctx.rotate(angleRad)

    const bannerFontSize = Math.round(baseFontSize * 1.25)
    ctx.font = `800 ${bannerFontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`

    const padY = bannerFontSize * 0.85
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.fillRect(-diagonal, -padY, diagonal * 2, padY * 2)

    ctx.fillStyle = options.colorHex
    ctx.strokeText(fullText, 0, 0)
    ctx.fillText(fullText, 0, 0)
  } else {
    // Center stamp with border box
    const stampFontSize = Math.round(baseFontSize * 1.1)
    ctx.font = `800 ${stampFontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
    const textWidth = ctx.measureText(fullText).width
    const boxW = textWidth + stampFontSize * 2
    const boxH = stampFontSize * 2.3
    const cx = width / 2
    const cy = height * 0.54

    ctx.strokeStyle = options.colorHex
    ctx.lineWidth = Math.max(3, stampFontSize * 0.14)
    ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH)
    ctx.fillText(fullText, cx, cy)
  }

  ctx.restore()
  return canvas
}
