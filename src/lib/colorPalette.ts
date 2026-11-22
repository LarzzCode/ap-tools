export interface ColorInfo {
  r: number
  g: number
  b: number
  hex: string
  rgbCss: string
  hslCss: string
  isLight: boolean
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function rgbToHslString(r: number, g: number, b: number): string {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
        break
    }
    h /= 6
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

export function createColorInfo(r: number, g: number, b: number): ColorInfo {
  const cr = clampByte(r)
  const cg = clampByte(g)
  const cb = clampByte(b)
  // Perceived luminance
  const luminance = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255

  return {
    r: cr,
    g: cg,
    b: cb,
    hex: rgbToHex(cr, cg, cb),
    rgbCss: `rgb(${cr}, ${cg}, ${cb})`,
    hslCss: rgbToHslString(cr, cg, cb),
    isLight: luminance > 0.62,
  }
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(dr * dr * 2 + dg * dg * 4 + db * db * 3)
}

export function extractDominantPalette(
  image: HTMLImageElement,
  maxColors = 8,
): ColorInfo[] {
  const sampleSize = 110
  const canvas = document.createElement('canvas')
  const ratio = image.naturalHeight / Math.max(1, image.naturalWidth)
  canvas.width = sampleSize
  canvas.height = Math.max(1, Math.round(sampleSize * ratio))

  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Quantize RGB into 16x16x16 buckets and accumulate average RGB per bucket
  const buckets = new Map<
    string,
    { count: number; sumR: number; sumG: number; sumB: number }
  >()

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const qr = r >> 4
    const qg = g >> 4
    const qb = b >> 4
    const key = `${qr}-${qg}-${qb}`

    const existing = buckets.get(key)
    if (existing) {
      existing.count += 1
      existing.sumR += r
      existing.sumG += g
      existing.sumB += b
    } else {
      buckets.set(key, { count: 1, sumR: r, sumG: g, sumB: b })
    }
  }

  const sortedClusters = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .map((cluster) => ({
      r: Math.round(cluster.sumR / cluster.count),
      g: Math.round(cluster.sumG / cluster.count),
      b: Math.round(cluster.sumB / cluster.count),
      count: cluster.count,
    }))

  const chosen: Array<{ r: number; g: number; b: number }> = []
  let minDistance = 85

  while (chosen.length < maxColors && minDistance >= 20) {
    for (const candidate of sortedClusters) {
      if (chosen.length >= maxColors) break
      const tooClose = chosen.some(
        (existing) => colorDistance(existing, candidate) < minDistance,
      )
      if (!tooClose) {
        chosen.push(candidate)
      }
    }
    minDistance -= 22
  }

  return chosen.map((c) => createColorInfo(c.r, c.g, c.b))
}

export function renderPaletteCardDataUrl(
  image: HTMLImageElement,
  palette: ColorInfo[],
): string {
  const width = 1080
  const imageAreaHeight = 620
  const swatchSectionHeight = 320
  const height = imageAreaHeight + swatchSectionHeight

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Clean background
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(0, 0, width, height)

  // Draw cover-fitted image in top frame with margin
  const pad = 40
  const frameW = width - pad * 2
  const frameH = imageAreaHeight - pad
  const imgRatio = image.naturalWidth / Math.max(1, image.naturalHeight)
  const frameRatio = frameW / frameH

  let drawW = frameW
  let drawH = frameH
  if (imgRatio > frameRatio) {
    drawH = frameW / imgRatio
  } else {
    drawW = frameH * imgRatio
  }

  const drawX = pad + (frameW - drawW) / 2
  const drawY = pad + (frameH - drawH) / 2

  ctx.fillStyle = '#E2E8F0'
  ctx.beginPath()
  ctx.roundRect(pad, pad, frameW, frameH, 24)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(pad, pad, frameW, frameH, 24)
  ctx.clip()
  ctx.drawImage(image, drawX, drawY, drawW, drawH)
  ctx.restore()

  // Draw palette swatches row
  const count = Math.max(1, palette.length)
  const gap = 14
  const totalWidth = width - pad * 2
  const swatchW = (totalWidth - gap * (count - 1)) / count
  const swatchY = imageAreaHeight + 24
  const swatchH = 180

  palette.forEach((color, index) => {
    const x = pad + index * (swatchW + gap)

    ctx.fillStyle = color.hex
    ctx.beginPath()
    ctx.roundRect(x, swatchY, swatchW, swatchH, 18)
    ctx.fill()

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.1)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 18px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(color.hex, x + swatchW / 2, swatchY + swatchH + 32)
  })

  // Footer attribution
  ctx.fillStyle = '#64748B'
  ctx.font = '600 16px Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('Ditya Tools • Color Palette Studio', width - pad, height - 24)

  return canvas.toDataURL('image/png')
}
