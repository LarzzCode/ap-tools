export type WhisperModelId =
  | 'onnx-community/whisper-tiny'
  | 'onnx-community/whisper-base'
  | 'onnx-community/whisper-small'

export type WhisperTask = 'transcribe' | 'translate'

export type SubtitleStyleMode = 'standard' | 'short'

export interface WhisperModelOption {
  id: WhisperModelId
  shortLabelId: string
  shortLabelEn: string
  sizeBadge: string
  descId: string
  descEn: string
}

export interface WhisperLanguageOption {
  code: string
  labelId: string
  labelEn: string
}

export interface RawWhisperChunk {
  timestamp: [number, number | null]
  text: string
}

export interface TranscriptSegment {
  id: string
  start: number
  end: number
  text: string
}

export interface DecodedMediaAudio {
  samples: Float32Array
  durationSec: number
  peaks: number[]
}

export const WHISPER_MODELS: WhisperModelOption[] = [
  {
    id: 'onnx-community/whisper-tiny',
    shortLabelId: 'Kilat (Tiny)',
    shortLabelEn: 'Fast (Tiny)',
    sizeBadge: '~40 MB',
    descId: 'Paling ringan & cepat, cocok untuk draf suara jernih atau HP',
    descEn: 'Fastest & lightest, suited for clear voice notes or mobile devices',
  },
  {
    id: 'onnx-community/whisper-base',
    shortLabelId: 'Seimbang (Base)',
    shortLabelEn: 'Balanced (Base)',
    sizeBadge: '~75 MB',
    descId: 'Rekomendasi utama — keseimbangan terbaik kecepatan & akurasi',
    descEn: 'Recommended — ideal balance of speed and multilingual accuracy',
  },
  {
    id: 'onnx-community/whisper-small',
    shortLabelId: 'Studio (Small)',
    shortLabelEn: 'Studio (Small)',
    sizeBadge: '~240 MB',
    descId: 'Akurasi tertinggi untuk istilah teknis, rapat, & aksen beragam',
    descEn: 'Highest accuracy for lectures, meetings, and varied accents',
  },
]

export const WHISPER_LANGUAGES: WhisperLanguageOption[] = [
  { code: 'indonesian', labelId: 'Bahasa Indonesia', labelEn: 'Indonesian' },
  { code: 'english', labelId: 'Bahasa Inggris (English)', labelEn: 'English' },
  { code: 'javanese', labelId: 'Bahasa Jawa', labelEn: 'Javanese' },
  { code: 'sundanese', labelId: 'Bahasa Sunda', labelEn: 'Sundanese' },
  { code: 'malay', labelId: 'Bahasa Melayu', labelEn: 'Malay' },
  { code: 'japanese', labelId: 'Bahasa Jepang (日本語)', labelEn: 'Japanese (日本語)' },
  { code: 'korean', labelId: 'Bahasa Korea (한국어)', labelEn: 'Korean (한국어)' },
  { code: 'chinese', labelId: 'Mandarin (中文)', labelEn: 'Mandarin Chinese (中文)' },
  { code: 'arabic', labelId: 'Bahasa Arab (العربية)', labelEn: 'Arabic (العربية)' },
  { code: 'spanish', labelId: 'Spanyol (Español)', labelEn: 'Spanish (Español)' },
  { code: 'french', labelId: 'Prancis (Français)', labelEn: 'French (Français)' },
  { code: 'german', labelId: 'Jerman (Deutsch)', labelEn: 'German (Deutsch)' },
]

export const TARGET_SAMPLE_RATE = 16000

export function supportsWhisperWebGpu(): boolean {
  if (typeof navigator === 'undefined') return false
  const hasGpu = 'gpu' in navigator
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(
    navigator.userAgent.toLowerCase(),
  )
  return hasGpu && !isMobile
}

export function computeWaveformPeaks(
  samples: Float32Array,
  barCount = 128,
): number[] {
  if (samples.length === 0 || barCount <= 0) {
    return Array.from({ length: Math.max(1, barCount) }, () => 0.08)
  }

  const blockSize = Math.max(1, Math.floor(samples.length / barCount))
  const rawPeaks: number[] = []
  let maxPeak = 0.001

  for (let i = 0; i < barCount; i++) {
    const start = i * blockSize
    const end =
      i === barCount - 1
        ? samples.length
        : Math.min(samples.length, start + blockSize)

    let sumSquares = 0
    let localMax = 0
    const count = Math.max(1, end - start)
    // Stride large blocks so peak computation stays sub-millisecond even on 1-hour files
    const step = Math.max(1, Math.floor(count / 256))
    let sampled = 0

    for (let j = start; j < end; j += step) {
      const abs = Math.abs(samples[j])
      if (abs > localMax) localMax = abs
      sumSquares += abs * abs
      sampled++
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, sampled))
    const blended = rms * 0.65 + localMax * 0.35
    if (blended > maxPeak) maxPeak = blended
    rawPeaks.push(blended)
  }

  return rawPeaks.map((val) => {
    const normalized = val / maxPeak
    return Math.max(0.07, Math.min(1, Math.pow(normalized, 0.82)))
  })
}

export async function extractMono16kAudio(
  fileOrBlob: Blob,
): Promise<DecodedMediaAudio> {
  const arrayBuffer = await fileOrBlob.arrayBuffer()

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext

  const audioCtx = new AudioCtx()

  let decodedBuffer: AudioBuffer
  try {
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    await audioCtx.close().catch(() => undefined)
  }

  const durationSec = decodedBuffer.duration
  const targetLength = Math.max(
    1,
    Math.ceil(durationSec * TARGET_SAMPLE_RATE),
  )

  const offlineCtx = new OfflineAudioContext(
    1,
    targetLength,
    TARGET_SAMPLE_RATE,
  )

  // Downmix stereo/multi-channel cleanly to mono before resampling
  const monoSourceBuffer = offlineCtx.createBuffer(
    1,
    decodedBuffer.length,
    decodedBuffer.sampleRate,
  )
  const monoData = monoSourceBuffer.getChannelData(0)
  const numChannels = decodedBuffer.numberOfChannels

  if (numChannels === 1) {
    monoData.set(decodedBuffer.getChannelData(0))
  } else {
    const scale = 1 / numChannels
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = decodedBuffer.getChannelData(ch)
      for (let i = 0; i < decodedBuffer.length; i++) {
        monoData[i] += channelData[i] * scale
      }
    }
  }

  const source = offlineCtx.createBufferSource()
  source.buffer = monoSourceBuffer
  source.connect(offlineCtx.destination)
  source.start(0)

  const rendered = await offlineCtx.startRendering()
  const samples = new Float32Array(rendered.getChannelData(0))
  const peaks = computeWaveformPeaks(samples, 132)

  return {
    samples,
    durationSec,
    peaks,
  }
}

export function groupWordChunksIntoShortCues(
  wordChunks: RawWhisperChunk[],
  totalDurationSec: number,
  maxWordsPerCue = 4,
  maxDurationSec = 2.4,
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  let bucketWords: string[] = []
  let cueStart = 0
  let cueEnd = 0

  const flushBucket = () => {
    const joined = bucketWords.join(' ').replace(/\s+/g, ' ').trim()
    if (!joined) {
      bucketWords = []
      return
    }
    const safeStart = Math.max(0, cueStart)
    const minEnd = safeStart + 0.35
    const safeEnd = Math.max(
      minEnd,
      Math.min(
        totalDurationSec > 0 ? totalDurationSec : cueEnd + 0.5,
        cueEnd > safeStart ? cueEnd : safeStart + 1.2,
      ),
    )
    segments.push({
      id: `seg-${segments.length + 1}`,
      start: Number(safeStart.toFixed(2)),
      end: Number(safeEnd.toFixed(2)),
      text: joined,
    })
    bucketWords = []
  }

  for (let i = 0; i < wordChunks.length; i++) {
    const raw = wordChunks[i]
    const word = raw.text.trim()
    if (!word) continue

    const wStart = Number.isFinite(raw.timestamp?.[0]) ? raw.timestamp[0] : cueEnd
    const rawEnd = raw.timestamp?.[1]
    const wEnd =
      rawEnd !== null && Number.isFinite(rawEnd) && rawEnd > wStart
        ? rawEnd
        : Math.min(
            totalDurationSec > 0 ? totalDurationSec : wStart + 0.45,
            wStart + 0.45,
          )

    if (bucketWords.length === 0) {
      cueStart = wStart
      cueEnd = wEnd
      bucketWords.push(word)
    } else {
      const gapFromPrev = wStart - cueEnd
      const projectedDuration = wEnd - cueStart

      if (
        gapFromPrev > 0.65 ||
        projectedDuration > maxDurationSec ||
        bucketWords.length >= maxWordsPerCue
      ) {
        flushBucket()
        cueStart = wStart
        cueEnd = wEnd
        bucketWords.push(word)
      } else {
        cueEnd = wEnd
        bucketWords.push(word)
      }
    }

    if (/[.!?]$/.test(word) || (bucketWords.length >= 3 && /[,;:]$/.test(word))) {
      flushBucket()
    }
  }

  flushBucket()
  return segments
}

export function normalizeWhisperChunks(
  rawChunks: RawWhisperChunk[] | undefined,
  fallbackText: string,
  totalDurationSec: number,
  styleMode: SubtitleStyleMode,
): TranscriptSegment[] {
  if (!rawChunks || rawChunks.length === 0) {
    const clean = fallbackText.trim()
    if (!clean) return []
    return [
      {
        id: 'seg-1',
        start: 0,
        end: Number(Math.max(1, totalDurationSec).toFixed(2)),
        text: clean,
      },
    ]
  }

  if (styleMode === 'short') {
    return groupWordChunksIntoShortCues(rawChunks, totalDurationSec)
  }

  const normalized: TranscriptSegment[] = []

  for (let i = 0; i < rawChunks.length; i++) {
    const item = rawChunks[i]
    const cleanText = item.text.replace(/\s+/g, ' ').trim()
    if (!cleanText) continue

    const rawStart = Number.isFinite(item.timestamp?.[0])
      ? Math.max(0, item.timestamp[0])
      : normalized.length > 0
        ? normalized[normalized.length - 1].end
        : 0

    const nextStart =
      i + 1 < rawChunks.length && Number.isFinite(rawChunks[i + 1].timestamp?.[0])
        ? rawChunks[i + 1].timestamp[0]
        : null

    const rawEndCandidate = item.timestamp?.[1]
    let resolvedEnd: number

    if (
      rawEndCandidate !== null &&
      Number.isFinite(rawEndCandidate) &&
      rawEndCandidate > rawStart
    ) {
      resolvedEnd = rawEndCandidate
    } else if (nextStart !== null && nextStart > rawStart) {
      resolvedEnd = nextStart
    } else if (totalDurationSec > rawStart) {
      resolvedEnd = totalDurationSec
    } else {
      resolvedEnd = rawStart + Math.max(1.5, cleanText.split(' ').length * 0.38)
    }

    if (totalDurationSec > 0 && resolvedEnd > totalDurationSec + 0.5) {
      resolvedEnd = totalDurationSec
    }

    if (resolvedEnd <= rawStart) {
      resolvedEnd = rawStart + 0.8
    }

    normalized.push({
      id: `seg-${normalized.length + 1}`,
      start: Number(rawStart.toFixed(2)),
      end: Number(resolvedEnd.toFixed(2)),
      text: cleanText,
    })
  }

  return normalized
}

export function formatTimestampSrt(seconds: number): string {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const totalMs = Math.round(clamped * 1000)
  const ms = totalMs % 1000
  const totalSeconds = Math.floor(totalMs / 1000)
  const secs = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const mins = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)

  const hh = String(hours).padStart(2, '0')
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const mmm = String(ms).padStart(3, '0')

  return `${hh}:${mm}:${ss},${mmm}`
}

export function formatTimestampVtt(seconds: number): string {
  return formatTimestampSrt(seconds).replace(',', '.')
}

export function formatClockTime(seconds: number, includeTenths = false): string {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const hours = Math.floor(clamped / 3600)
  const mins = Math.floor((clamped % 3600) / 60)
  const secs = Math.floor(clamped % 60)
  const tenths = Math.floor((clamped - Math.floor(clamped)) * 10)

  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const base = hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`

  return includeTenths ? `${base}.${tenths}` : base
}

export function segmentsToSrt(segments: TranscriptSegment[]): string {
  return segments
    .filter((s) => s.text.trim().length > 0)
    .map((seg, idx) => {
      const startStr = formatTimestampSrt(seg.start)
      const endStr = formatTimestampSrt(Math.max(seg.start + 0.2, seg.end))
      return `${idx + 1}\n${startStr} --> ${endStr}\n${seg.text.trim()}`
    })
    .join('\n\n')
    .concat(segments.length > 0 ? '\n' : '')
}

export function segmentsToVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .filter((s) => s.text.trim().length > 0)
    .map((seg) => {
      const startStr = formatTimestampVtt(seg.start)
      const endStr = formatTimestampVtt(Math.max(seg.start + 0.2, seg.end))
      return `${startStr} --> ${endStr}\n${seg.text.trim()}`
    })
    .join('\n\n')

  return body ? `WEBVTT\n\n${body}\n` : 'WEBVTT\n'
}

export function segmentsToPlainText(
  segments: TranscriptSegment[],
  includeTimestamps = false,
): string {
  const nonEmpty = segments.filter((s) => s.text.trim().length > 0)
  if (nonEmpty.length === 0) return ''

  if (includeTimestamps) {
    return nonEmpty
      .map(
        (s) =>
          `[${formatClockTime(s.start)} - ${formatClockTime(s.end)}] ${s.text.trim()}`,
      )
      .join('\n')
  }

  return nonEmpty
    .map((s) => s.text.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function segmentsToWhatsAppSummary(
  segments: TranscriptSegment[],
  sourceTitle: string,
  durationSec: number,
  isIndonesian = true,
): string {
  const header = isIndonesian
    ? `*TRANSKRIP AUDIO / VIDEO*\n📄 File: ${sourceTitle}\n⏱️ Durasi: ${formatClockTime(durationSec)}`
    : `*AUDIO / VIDEO TRANSCRIPT*\n📄 File: ${sourceTitle}\n⏱️ Duration: ${formatClockTime(durationSec)}`

  const lines = segments
    .filter((s) => s.text.trim().length > 0)
    .map((s) => `• \`${formatClockTime(s.start)}\` ${s.text.trim()}`)
    .join('\n')

  const footer = isIndonesian
    ? `\n\n_Ditranskrip lokal dengan Ditya Tools (Whisper AI)_`
    : `\n\n_Transcribed locally with Ditya Tools (Whisper AI)_`

  return `${header}\n\n${lines}${footer}`
}

export function countTranscriptWords(segments: TranscriptSegment[]): number {
  const text = segments.map((s) => s.text.trim()).join(' ').trim()
  if (!text) return 0
  return text.split(/\s+/).length
}
