import type {
  AutomaticSpeechRecognitionOutput,
  AutomaticSpeechRecognitionPipeline,
  ProgressInfo,
} from '@huggingface/transformers'

import type {
  RawWhisperChunk,
  SubtitleStyleMode,
  WhisperModelId,
  WhisperTask,
} from '../lib/audioTranscriber'

export interface TranscribeWorkerRequest {
  type: 'transcribe'
  jobId: number
  audio: Float32Array
  modelId: WhisperModelId
  language: string
  task: WhisperTask
  styleMode: SubtitleStyleMode
  preferWebGpu: boolean
}

export type TranscribeWorkerResponse =
  | {
      type: 'stage'
      jobId: number
      stage: 'loading-model' | 'transcribing'
      device: 'webgpu' | 'wasm'
      fallbackNotice?: boolean
    }
  | {
      type: 'model-progress'
      jobId: number
      file: string
      overallPercent: number
      loadedBytes: number
      totalBytes: number
      device: 'webgpu' | 'wasm'
    }
  | {
      type: 'stream-text'
      jobId: number
      liveText: string
    }
  | {
      type: 'result'
      jobId: number
      text: string
      chunks: RawWhisperChunk[]
      device: 'webgpu' | 'wasm'
      elapsedMs: number
    }
  | {
      type: 'error'
      jobId: number
      message: string
    }

interface DedicatedWorkerScopeLike {
  postMessage: (message: TranscribeWorkerResponse) => void
  onmessage: ((event: MessageEvent<TranscribeWorkerRequest>) => void) | null
}

const workerScope = self as unknown as DedicatedWorkerScopeLike

let cachedKey: string | null = null
let cachedPipeline: AutomaticSpeechRecognitionPipeline | null = null

async function loadPipeline(
  modelId: WhisperModelId,
  device: 'webgpu' | 'wasm',
  jobId: number,
): Promise<AutomaticSpeechRecognitionPipeline> {
  const key = `${modelId}::${device}`
  if (cachedPipeline && cachedKey === key) {
    return cachedPipeline
  }

  if (cachedPipeline) {
    try {
      await cachedPipeline.dispose()
    } catch {
      // Ignore disposal errors when switching models
    }
    cachedPipeline = null
    cachedKey = null
  }

  const { pipeline } = await import('@huggingface/transformers')

  const fileProgressMap = new Map<
    string,
    { loaded: number; total: number }
  >()

  const handleProgress = (info: ProgressInfo) => {
    if (info.status === 'progress') {
      const fileKey = info.file || 'model.onnx'
      const loaded = typeof info.loaded === 'number' ? info.loaded : 0
      const total = typeof info.total === 'number' ? info.total : 0

      if (total > 0) {
        fileProgressMap.set(fileKey, { loaded, total })
      }

      let sumLoaded = 0
      let sumTotal = 0
      for (const entry of fileProgressMap.values()) {
        sumLoaded += entry.loaded
        sumTotal += entry.total
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
        file: fileKey.split('/').pop() ?? fileKey,
        overallPercent,
        loadedBytes: sumLoaded,
        totalBytes: sumTotal,
        device,
      })
    }
  }

  const instance = await pipeline('automatic-speech-recognition', modelId, {
    device,
    dtype:
      device === 'webgpu'
        ? {
            encoder_model: 'fp32',
            decoder_model_merged: 'q4',
          }
        : 'q8',
    progress_callback: handleProgress,
  })

  cachedKey = key
  cachedPipeline = instance
  return instance
}

async function runTranscriptionOnDevice(
  req: TranscribeWorkerRequest,
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

  const transcriber = await loadPipeline(req.modelId, device, req.jobId)

  workerScope.postMessage({
    type: 'stage',
    jobId: req.jobId,
    stage: 'transcribing',
    device,
    fallbackNotice,
  })

  const { WhisperTextStreamer } = await import('@huggingface/transformers')

  let accumulatedStream = ''

  const streamer = new WhisperTextStreamer(
    transcriber.tokenizer as ConstructorParameters<
      typeof WhisperTextStreamer
    >[0],
    {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (tokenText: string) => {
        accumulatedStream += tokenText
        workerScope.postMessage({
          type: 'stream-text',
          jobId: req.jobId,
          liveText: accumulatedStream.trim(),
        })
      },
    },
  )

  const startedAt = performance.now()

  const rawResult = await transcriber(req.audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: req.language,
    task: req.task,
    return_timestamps: req.styleMode === 'short' ? 'word' : true,
    streamer,
  })

  const elapsedMs = Math.round(performance.now() - startedAt)

  const singleOutput: AutomaticSpeechRecognitionOutput = Array.isArray(
    rawResult,
  )
    ? rawResult[0]
    : rawResult

  const chunks: RawWhisperChunk[] = (singleOutput?.chunks ?? []).map((c) => ({
    timestamp: [
      c.timestamp?.[0] ?? 0,
      typeof c.timestamp?.[1] === 'number' ? c.timestamp[1] : null,
    ],
    text: c.text ?? '',
  }))

  workerScope.postMessage({
    type: 'result',
    jobId: req.jobId,
    text: singleOutput?.text ?? accumulatedStream,
    chunks,
    device,
    elapsedMs,
  })
}

workerScope.onmessage = async (
  event: MessageEvent<TranscribeWorkerRequest>,
) => {
  const req = event.data
  if (!req || req.type !== 'transcribe') return

  const initialDevice: 'webgpu' | 'wasm' = req.preferWebGpu
    ? 'webgpu'
    : 'wasm'

  try {
    await runTranscriptionOnDevice(req, initialDevice, false)
  } catch (err) {
    if (initialDevice === 'webgpu') {
      // Cleanly fall back to WASM quantized inference if WebGPU fails
      cachedPipeline = null
      cachedKey = null
      try {
        await runTranscriptionOnDevice(req, 'wasm', true)
        return
      } catch (wasmErr) {
        workerScope.postMessage({
          type: 'error',
          jobId: req.jobId,
          message:
            wasmErr instanceof Error
              ? wasmErr.message
              : 'Failed to run Whisper transcription in browser.',
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
          : 'Failed to run Whisper transcription in browser.',
    })
  }
}
