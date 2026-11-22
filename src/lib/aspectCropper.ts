export interface AspectPreset {
  id: string
  labelId: string
  labelEn: string
  hintId: string
  hintEn: string
  widthRatio: number
  heightRatio: number
  targetWidth: number
  targetHeight: number
}

export const ASPECT_PRESETS: AspectPreset[] = [
  {
    id: 'ig-portrait',
    labelId: '4:5 IG Feed',
    labelEn: '4:5 IG Portrait',
    hintId: 'Postingan Instagram (1080×1350)',
    hintEn: 'Instagram Feed Post (1080×1350)',
    widthRatio: 4,
    heightRatio: 5,
    targetWidth: 1080,
    targetHeight: 1350,
  },
  {
    id: 'story-9-16',
    labelId: '9:16 Story / Reels',
    labelEn: '9:16 Story / Reels',
    hintId: 'IG Story, Reels, TikTok (1080×1920)',
    hintEn: 'IG Story, Reels, TikTok (1080×1920)',
    widthRatio: 9,
    heightRatio: 16,
    targetWidth: 1080,
    targetHeight: 1920,
  },
  {
    id: 'square-1-1',
    labelId: '1:1 Persegi',
    labelEn: '1:1 Square',
    hintId: 'Foto Profil, Katalog Produk (1080×1080)',
    hintEn: 'Profile Avatar, Product Grid (1080×1080)',
    widthRatio: 1,
    heightRatio: 1,
    targetWidth: 1080,
    targetHeight: 1080,
  },
  {
    id: 'yt-16-9',
    labelId: '16:9 YouTube / Slide',
    labelEn: '16:9 YouTube / Slide',
    hintId: 'Thumbnail YouTube, Presentasi (1920×1080)',
    hintEn: 'YouTube Thumbnail, Widescreen (1920×1080)',
    widthRatio: 16,
    heightRatio: 9,
    targetWidth: 1920,
    targetHeight: 1080,
  },
  {
    id: 'banner-3-1',
    labelId: '3:1 Header Banner',
    labelEn: '3:1 Header Banner',
    hintId: 'Sampul X / Twitter, Toko Online (1500×500)',
    hintEn: 'X / Twitter Header, Store Banner (1500×500)',
    widthRatio: 3,
    heightRatio: 1,
    targetWidth: 1500,
    targetHeight: 500,
  },
  {
    id: 'classic-4-3',
    labelId: '4:3 Foto Klasik',
    labelEn: '4:3 Classic Photo',
    hintId: 'Dokumentasi & Artikel (1600×1200)',
    hintEn: 'Standard Photo & Blog (1600×1200)',
    widthRatio: 4,
    heightRatio: 3,
    targetWidth: 1600,
    targetHeight: 1200,
  },
]

export type FitMode = 'cover' | 'contain'

export interface AspectCropOptions {
  preset: AspectPreset
  fitMode: FitMode
  zoom: number
  offsetX: number // -1 to 1
  offsetY: number // -1 to 1
  backgroundColor: string
}

export function renderAspectCropCanvas(
  image: HTMLImageElement,
  options: AspectCropOptions,
): HTMLCanvasElement {
  const { targetWidth, targetHeight } = options.preset

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser tidak mendukung HTML5 Canvas.')
  }

  ctx.fillStyle = options.backgroundColor
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  const baseScale =
    options.fitMode === 'cover'
      ? Math.max(
          targetWidth / image.naturalWidth,
          targetHeight / image.naturalHeight,
        )
      : Math.min(
          targetWidth / image.naturalWidth,
          targetHeight / image.naturalHeight,
        )

  const scale = baseScale * options.zoom
  const drawW = image.naturalWidth * scale
  const drawH = image.naturalHeight * scale

  const maxPanX = Math.max(0, Math.abs(drawW - targetWidth) / 2)
  const maxPanY = Math.max(0, Math.abs(drawH - targetHeight) / 2)

  const drawX = (targetWidth - drawW) / 2 + options.offsetX * maxPanX
  const drawY = (targetHeight - drawH) / 2 + options.offsetY * maxPanY

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, drawX, drawY, drawW, drawH)

  return canvas
}
