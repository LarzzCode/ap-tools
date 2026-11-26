import type {
  ImageToImagePipeline,
  ProgressInfo,
} from '@huggingface/transformers'

import {
  computeOverlappingTiles,
  type UpscalerModelRepo,
} from '../lib/photoUpscaler'

export interface UpscalerWorkerRequest {
  type: 'upscale'
  jobId: number
  rgbaBuffer: ArrayBuffer
  width: number
  height: number
  modelRepo: UpscalerModelRepo
  scale: 2 | 4
  preferWebGpu: boolean
  tileSize: number
  overlap: number
}

export type UpscalerWorkerResponse =
  | {
      type: 'stage'
      jobId: number
      stage: 'loading-model' | 'upscaling'
      device: 'webgpu' | 'wasm'
      fallbackNotice?: boolean
    }
  | {
      type: 'model-progress'
      jobId: number
      overallPercent: number
      loadedBytes: number
      totalBytes: number
      device: 'webgpu' | 'wasm'
    }
  | {
      type: 'tile-progress'
      jobId: number
      currentTile: number
      totalTiles: number
      percent: number
    }
  | {
      type: 'result'
      jobId: number
      rgbaBuffer: ArrayBuffer
      outWidth: number
      outHeight: number
      device: 'webgpu' | 'wasm'
      elapsedMs: number
    }
  | {
      type: 'error'
      jobId: number
      message: string
    }

interface DedicatedWorkerScopeLike {
  postMessage: (
    message: UpscalerWorkerResponse,
    transfer?: Transferable[],
  ) => void
  onmessage: ((event: MessageEvent<UpscalerWorkerRequest>) => void) | null
}

const workerScope = self as unknown as DedicatedWorkerScopeLike

let cachedKey: string | null = null
let cachedPipeline: ImageToImagePipeline | null = null

async function getPipeline(
  modelRepo: UpscalerModelRepo,
  device: 'webgpu' | 'wasm',
  jobId: number,
): Promise<ImageToImagePipeline> {
  const key = `${modelRepo}::${device}`
  if (cachedPipeline && cachedKey === key) {
    return cachedPipeline
  }

  if (cachedPipeline) {
    try {
      await cachedPipeline.dispose()
    } catch {
      // Ignore disposal warnings
    }
    cachedPipeline = null
    cachedKey = null
  }

  const { pipeline } = await import('@huggingface/transformers')
  const progressMap = new Map<string, { loaded: number; total: number }>()

  const onProgress = (info: ProgressInfo) => {
    if (info.status === 'progress') {
      const fKey = info.file || 'model.onnx'
      const loaded = typeof info.loaded === 'number' ? info.loaded : 0
      const total = typeof info.total === 'number' ? info.total : 0
      if (total > 0) {
        progressMap.set(fKey, { loaded, total })
      }
      let sumLoaded = 0
      let sumTotal = 0
      for (const item of progressMap.values()) {
        sumLoaded += item.loaded
        sumTotal += item.total
      }
      const overallPercent =
        sumTotal > 0
          ? Math.min(99, Math.round((sumLoaded / sumTotal) * 100))
          : typeof info.progress === 'number'
            ? Math.min(99, Math.round(info.progress))
            : 0

      workerScope.postMessage({
        type: 'model-progress',
        jobId,
        overallPercent,
        loadedBytes: sumLoaded,
        totalBytes: sumTotal,
        device,
      })
    }
  }

  const instance = await pipeline('image-to-image', modelRepo, {
    device,
    dtype: device === 'webgpu' ? 'fp32' : 'q8',
    progress_callback: onProgress,
  })

  cachedKey = key
  cachedPipeline = instance
  return instance
}

function featherWeight1D(
  posInTile: number,
  tileLen: number,
  featherPx: number,
  touchesStartBorder: boolean,
  touchesEndBorder: boolean,
): number {
  if (featherPx <= 0) return 1
  let w = 1
  if (!touchesStartBorder && posInTile < featherPx) {
    w = Math.min(w, (posInTile + 0.5) / featherPx)
  }
  if (!touchesEndBorder && tileLen - 1 - posInTile < featherPx) {
    w = Math.min(w, (tileLen - 0.5 - posInTile) / featherPx)
  }
  return Math.max(0.04, w)
}

async function executeTiledUpscale(
  req: UpscalerWorkerRequest,
  device: 'webgpu' | 'wasm',
  fallbackNotice = false,
): Promise<void> {
  workerScope.postMessage({
    type: 'stage',
    jobId: req.jobId,
    stage: 'loading-model',
    device,
    fallbackNotice,
  })

  const upscaler = await getPipeline(req.modelRepo, device, req.jobId)
  const { RawImage } = await import('@huggingface/transformers')

  workerScope.postMessage({
    type: 'stage',
    jobId: req.jobId,
    stage: 'upscaling',
    device,
    fallbackNotice,
  })

  const startedAt = performance.now()
  const srcRgba = new Uint8ClampedArray(req.rgbaBuffer)
  const inW = req.width
  const inH = req.height
  const scale = req.scale
  const outW = inW * scale
  const outH = inH * scale

  const tiles = computeOverlappingTiles(inW, inH, req.tileSize, req.overlap)
  const totalPixelsOut = outW * outH

  const accumR = new Float32Array(totalPixelsOut)
  const accumG = new Float32Array(totalPixelsOut)
  const accumB = new Float32Array(totalPixelsOut)
  const accumW = new Float32Array(totalPixelsOut)

  const outFeatherPx = req.overlap * scale

  for (let tIdx = 0; tIdx < tiles.length; tIdx++) {
    const tile = tiles[tIdx]
    workerScope.postMessage({
      type: 'tile-progress',
      jobId: req.jobId,
      currentTile: tIdx + 1,
      totalTiles: tiles.length,
      percent: Math.round(((tIdx) / tiles.length) * 100),
    })

    // Extract 3-channel RGB buffer for this tile
    const tileRgb = new Uint8Array(tile.w * tile.h * 3)
    let dstPtr = 0
    for (let ty = 0; ty < tile.h; ty++) {
      const srcRowStart = ((tile.y + ty) * inW + tile.x) * 4
      for (let tx = 0; tx < tile.w; tx++) {
        const sIdx = srcRowStart + tx * 4
        tileRgb[dstPtr++] = srcRgba[sIdx]
        tileRgb[dstPtr++] = srcRgba[sIdx + 1]
        tileRgb[dstPtr++] = srcRgba[sIdx + 2]
      }
    }

    const rawTile = new RawImage(tileRgb, tile.w, tile.h, 3)
    const srOutput = await upscaler(rawTile)
    const srImg = Array.isArray(srOutput) ? srOutput[0] : srOutput
    const srRgb = srImg.rgb()

    const validOutTileW = Math.min(srRgb.width, tile.w * scale)
    const validOutTileH = Math.min(srRgb.height, tile.h * scale)
    const outStartX = tile.x * scale
    const outStartY = tile.y * scale

    const touchesLeft = tile.x === 0
    const touchesTop = tile.y === 0
    const touchesRight = tile.x + tile.w >= inW
    const touchesBottom = tile.y + tile.h >= inH

    const srData = srRgb.data

    for (let oy = 0; oy < validOutTileH; oy++) {
      const globalY = outStartY + oy
      if (globalY >= outH) break
      const wy = featherWeight1D(
        oy,
        validOutTileH,
        outFeatherPx,
        touchesTop,
        touchesBottom,
      )
      const srRowOffset = oy * srRgb.width * 3
      const globalRowOffset = globalY * outW

      for (let ox = 0; ox < validOutTileW; ox++) {
        const globalX = outStartX + ox
        if (globalX >= outW) break
        const wx = featherWeight1D(
          ox,
          validOutTileW,
          outFeatherPx,
          touchesLeft,
          touchesRight,
        )
        const weight = wx * wy
        const sPtr = srRowOffset + ox * 3
        const gIdx = globalRowOffset + globalX

        accumR[gIdx] += srData[sPtr] * weight
        accumG[gIdx] += srData[sPtr + 1] * weight
        accumB[gIdx] += srData[sPtr + 2] * weight
        accumW[gIdx] += weight
      }
    }

    workerScope.postMessage({
      type: 'tile-progress',
      jobId: req.jobId,
      currentTile: tIdx + 1,
      totalTiles: tiles.length,
      percent: Math.round(((tIdx + 1) / tiles.length) * 100),
    })
  }

  // Normalize feathered RGB + bilinearly sample original Alpha channel
  const outRgba = new Uint8ClampedArray(totalPixelsOut * 4)
  for (let y = 0; y < outH; y++) {
    const srcY = Math.min(inH - 1, Math.floor(y / scale))
    const rowOff = y * outW
    const srcAlphaRow = srcY * inW
    for (let x = 0; x < outW; x++) {
      const idx = rowOff + x
      const w = accumW[idx] || 1
      const outPtr = idx * 4
      outRgba[outPtr] = Math.round(accumR[idx] / w)
      outRgba[outPtr + 1] = Math.round(accumG[idx] / w)
      outRgba[outPtr + 2] = Math.round(accumB[idx] / w)
      const srcX = Math.min(inW - 1, Math.floor(x / scale))
      outRgba[outPtr + 3] = srcRgba[(srcAlphaRow + srcX) * 4 + 3]
    }
  }

  const elapsedMs = Math.round(performance.now() - startedAt)

  workerScope.postMessage(
    {
      type: 'result',
      jobId: req.jobId,
      rgbaBuffer: outRgba.buffer,
      outWidth: outW,
      outHeight: outH,
      device,
      elapsedMs,
    },
    [outRgba.buffer],
  )
}

workerScope.onmessage = async (
  event: MessageEvent<UpscalerWorkerRequest>,
) => {
  const req = event.data
  if (!req || req.type !== 'upscale') return

  const initialDevice: 'webgpu' | 'wasm' = req.preferWebGpu
    ? 'webgpu'
    : 'wasm'

  try {
    await executeTiledUpscale(req, initialDevice, false)
  } catch (err) {
    if (initialDevice === 'webgpu') {
      cachedPipeline = null
      cachedKey = null
      try {
        await executeTiledUpscale(req, 'wasm', true)
        return
      } catch (wasmErr) {
        workerScope.postMessage({
          type: 'error',
          jobId: req.jobId,
          message:
            wasmErr instanceof Error
              ? wasmErr.message
              : 'Failed to run Swin2SR super-resolution in browser.',
        })
        return
      }
    }

    workerScope.postMessage({
      type: 'error',
      jobId: req.jobId,
      message:
        err instanceof Error
          ? err.message
          : 'Failed to run Swin2SR super-resolution in browser.',
    })
  }
}
