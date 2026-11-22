export type StitchDirection = 'vertical' | 'horizontal'

export interface StitchImageItem {
  id: string
  file: File
  previewUrl: string
  width: number
  height: number
}

export interface StitchOptions {
  direction: StitchDirection
  normalizeSize: boolean
  gapPx: number
  paddingPx: number
  backgroundColor: string
}

export function loadImageElementFromUrl(
  url: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat gambar.'))
    img.src = url
  })
}

export async function renderStitchedCanvas(
  items: StitchImageItem[],
  options: StitchOptions,
): Promise<HTMLCanvasElement> {
  if (items.length === 0) {
    throw new Error('Pilih minimal 1 gambar untuk digabungkan.')
  }

  const images = await Promise.all(
    items.map((item) => loadImageElementFromUrl(item.previewUrl)),
  )

  const gap = Math.max(0, options.gapPx)
  const pad = Math.max(0, options.paddingPx)

  if (options.direction === 'vertical') {
    const targetWidth = options.normalizeSize
      ? Math.min(
          1600,
          Math.max(...images.map((img) => img.naturalWidth)),
        )
      : Math.max(...images.map((img) => img.naturalWidth))

    const scaledDimensions = images.map((img) => {
      if (!options.normalizeSize) {
        return { w: img.naturalWidth, h: img.naturalHeight }
      }
      const scale = targetWidth / img.naturalWidth
      return {
        w: targetWidth,
        h: Math.round(img.naturalHeight * scale),
      }
    })

    const totalHeight =
      scaledDimensions.reduce((sum, d) => sum + d.h, 0) +
      gap * Math.max(0, images.length - 1) +
      pad * 2
    const canvasWidth = targetWidth + pad * 2

    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = totalHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Browser tidak mendukung HTML5 Canvas.')
    }

    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, canvasWidth, totalHeight)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    let currentY = pad
    images.forEach((img, idx) => {
      const { w, h } = scaledDimensions[idx]
      const x = pad + Math.round((targetWidth - w) / 2)
      ctx.drawImage(img, x, currentY, w, h)
      currentY += h + gap
    })

    return canvas
  } else {
    const targetHeight = options.normalizeSize
      ? Math.min(
          1400,
          Math.max(...images.map((img) => img.naturalHeight)),
        )
      : Math.max(...images.map((img) => img.naturalHeight))

    const scaledDimensions = images.map((img) => {
      if (!options.normalizeSize) {
        return { w: img.naturalWidth, h: img.naturalHeight }
      }
      const scale = targetHeight / img.naturalHeight
      return {
        w: Math.round(img.naturalWidth * scale),
        h: targetHeight,
      }
    })

    const totalWidth =
      scaledDimensions.reduce((sum, d) => sum + d.w, 0) +
      gap * Math.max(0, images.length - 1) +
      pad * 2
    const canvasHeight = targetHeight + pad * 2

    const canvas = document.createElement('canvas')
    canvas.width = totalWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Browser tidak mendukung HTML5 Canvas.')
    }

    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, totalWidth, canvasHeight)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    let currentX = pad
    images.forEach((img, idx) => {
      const { w, h } = scaledDimensions[idx]
      const y = pad + Math.round((targetHeight - h) / 2)
      ctx.drawImage(img, currentX, y, w, h)
      currentX += w + gap
    })

    return canvas
  }
}
