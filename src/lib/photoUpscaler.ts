export type UpscaleEngineId =
  | 'ai-realworld-4x'
  | 'ai-light-2x'
  | 'instant-dsp-2x'

export type UpscalerModelRepo =
  | 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr'
  | 'Xenova/swin2SR-lightweight-x2-64'

export interface UpscaleEngineOption {
  id: UpscaleEngineId
  scale: 2 | 4
  modelRepo: UpscalerModelRepo | null
  badgeSize: string
  labelId: string
  labelEn: string
  descId: string
  descEn: string
}

export interface TilePlanRect {
  x: number
  y: number
  w: number
  h: number
}

export const UPSCALE_ENGINES: UpscaleEngineOption[] = [
  {
    id: 'ai-realworld-4x',
    scale: 4,
    modelRepo: 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr',
    badgeSize: '~21 MB AI',
    labelId: 'AI Anti-Pecah WA (4×)',
    labelEn: 'AI Real-World Restore (4×)',
    descId:
      'Jaringan saraf Swin2SR BSRGAN untuk membersihkan artefak kompresi WhatsApp, bintik JPEG, & foto buram 4× lipat.',
    descEn:
      'Swin2SR BSRGAN neural network trained to remove heavy JPEG/WhatsApp artifacts, noise, and blur at 4×.',
  },
  {
    id: 'ai-light-2x',
    scale: 2,
    modelRepo: 'Xenova/swin2SR-lightweight-x2-64',
    badgeSize: '~7 MB AI',
    labelId: 'AI Tajam Cepat (2×)',
    labelEn: 'AI Lightweight Crisp (2×)',
    descId:
      'Model AI ringan ~7 MB untuk memperjelas logo, ilustrasi, screenshot, dan potret hingga 2× resolusi.',
    descEn:
      'Compact ~7 MB neural super-resolution for logos, UI screenshots, anime, and portraits at 2×.',
  },
  {
    id: 'instant-dsp-2x',
    scale: 2,
    modelRepo: null,
    badgeSize: '0 MB · Instan',
    labelId: 'DSP Penajam Kilat (2×)',
    labelEn: 'Instant Edge-Crisp DSP (2×)',
    descId:
      'Interpolasi bertingkat + Unsharp Mask penajam tepi instan <1 detik tanpa mengunduh model AI (cocok untuk foto resolusi besar).',
    descEn:
      'Sub-second multi-pass interpolation + luminance unsharp masking with zero model download.',
  },
]

export function supportsUpscalerWebGpu(): boolean {
  if (typeof navigator === 'undefined') return false
  const hasGpu = 'gpu' in navigator
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(
    navigator.userAgent.toLowerCase(),
  )
  return hasGpu && !isMobile
}

export function computeOverlappingTiles(
  width: number,
  height: number,
  tileSize = 160,
  overlap = 16,
): TilePlanRect[] {
  const safeTile = Math.max(32, tileSize)
  const safeOverlap = Math.max(0, Math.min(Math.floor(safeTile / 3), overlap))
  const stride = safeTile - safeOverlap

  const buildAxisStarts = (total: number): Array<{ pos: number; len: number }> => {
    if (total <= safeTile) {
      return [{ pos: 0, len: total }]
    }
    const axis: Array<{ pos: number; len: number }> = []
    let cursor = 0
    while (cursor < total) {
      const len = Math.min(safeTile, total - cursor)
      if (len < safeTile && total > safeTile) {
        const shiftedPos = Math.max(0, total - safeTile)
        if (axis.length === 0 || axis[axis.length - 1].pos !== shiftedPos) {
          axis.push({ pos: shiftedPos, len: safeTile })
        }
        break
      }
      axis.push({ pos: cursor, len })
      if (cursor + len >= total) break
      cursor += stride
    }
    return axis
  }

  const xs = buildAxisStarts(width)
  const ys = buildAxisStarts(height)
  const rects: TilePlanRect[] = []

  for (const ySeg of ys) {
    for (const xSeg of xs) {
      rects.push({
        x: xSeg.pos,
        y: ySeg.pos,
        w: xSeg.len,
        h: ySeg.len,
      })
    }
  }

  return rects
}

export function computeSafeWorkingDimensions(
  origWidth: number,
  origHeight: number,
  maxLongSide: number,
): { width: number; height: number; wasDownscaledForSafety: boolean } {
  const longest = Math.max(origWidth, origHeight)
  if (longest <= maxLongSide) {
    return {
      width: origWidth,
      height: origHeight,
      wasDownscaledForSafety: false,
    }
  }
  const ratio = maxLongSide / longest
  return {
    width: Math.max(16, Math.round(origWidth * ratio)),
    height: Math.max(16, Math.round(origHeight * ratio)),
    wasDownscaledForSafety: true,
  }
}

/**
 * High-quality multi-step canvas upscale + luminance-preserving Unsharp Mask
 * so edges become crisp without introducing color halos.
 */
export function runInstantDspUpscale(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  srcWidth: number,
  srcHeight: number,
  scale: 2 | 4,
  sharpenStrength = 0.65,
): HTMLCanvasElement {
  // Multi-pass 2x stepping preserves smoother diagonal edges than a single 4x jump
  let currentCanvas = document.createElement('canvas')
  currentCanvas.width = srcWidth
  currentCanvas.height = srcHeight
  const initCtx = currentCanvas.getContext('2d')
  if (!initCtx) {
    throw new Error('Canvas 2D context unavailable.')
  }
  initCtx.drawImage(sourceImg, 0, 0, srcWidth, srcHeight)

  const passes = scale === 4 ? 2 : 1
  for (let p = 0; p < passes; p++) {
    const nextCanvas = document.createElement('canvas')
    nextCanvas.width = currentCanvas.width * 2
    nextCanvas.height = currentCanvas.height * 2
    const nCtx = nextCanvas.getContext('2d')
    if (!nCtx) throw new Error('Canvas 2D context unavailable.')
    nCtx.imageSmoothingEnabled = true
    nCtx.imageSmoothingQuality = 'high'
    nCtx.drawImage(currentCanvas, 0, 0, nextCanvas.width, nextCanvas.height)
    currentCanvas = nextCanvas
  }

  if (sharpenStrength <= 0.02) {
    return currentCanvas
  }

  const w = currentCanvas.width
  const h = currentCanvas.height
  const ctx = currentCanvas.getContext('2d')
  if (!ctx) return currentCanvas

  const imgData = ctx.getImageData(0, 0, w, h)
  const src = imgData.data
  const out = new Uint8ClampedArray(src.length)
  out.set(src)

  const amount = Math.min(1.6, Math.max(0, sharpenStrength * 1.15))

  // 3x3 cross unsharp kernel on RGB channels while preserving original Alpha
  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w * 4
    const upOffset = (y - 1) * w * 4
    const downOffset = (y + 1) * w * 4

    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x * 4
      const leftIdx = idx - 4
      const rightIdx = idx + 4
      const upIdx = upOffset + x * 4
      const downIdx = downOffset + x * 4

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c]
        const blur =
          (src[leftIdx + c] +
            src[rightIdx + c] +
            src[upIdx + c] +
            src[downIdx + c]) *
          0.25
        const diff = center - blur
        // Soft threshold avoids amplifying flat JPEG mosquito noise
        if (Math.abs(diff) > 2.5) {
          out[idx + c] = Math.max(0, Math.min(255, Math.round(center + diff * amount)))
        }
      }
    }
  }

  ctx.putImageData(new ImageData(out, w, h), 0, 0)
  return currentCanvas
}
