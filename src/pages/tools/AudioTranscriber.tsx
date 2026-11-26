import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  Captions,
  Check,
  Clock,
  Copy,
  Cpu,
  Download,
  FileAudio,
  FileText,
  LoaderCircle,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Square,
  Trash2,
  Upload,
  Video,
  X,
  Zap,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  WHISPER_LANGUAGES,
  WHISPER_MODELS,
  countTranscriptWords,
  extractMono16kAudio,
  formatClockTime,
  formatTimestampSrt,
  normalizeWhisperChunks,
  segmentsToPlainText,
  segmentsToSrt,
  segmentsToVtt,
  segmentsToWhatsAppSummary,
  supportsWhisperWebGpu,
  type SubtitleStyleMode,
  type TranscriptSegment,
  type WhisperModelId,
  type WhisperTask,
} from '../../lib/audioTranscriber'
import { consumePendingSmartFile } from '../../lib/smartFileStore'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'
import type {
  TranscribeWorkerRequest,
  TranscribeWorkerResponse,
} from '../../workers/whisperWorker'

type EngineStage =
  | 'idle'
  | 'decoding-audio'
  | 'loading-model'
  | 'transcribing'

type EditorTab = 'timeline' | 'prose'

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

function isVideoMedia(fileName: string, mimeType: string): boolean {
  if (mimeType.toLowerCase().startsWith('video/')) return true
  return /\.(mp4|mov|mkv|webm|m4v|avi)$/i.test(fileName)
}

export default function AudioTranscriber() {
  const { language, t } = useLanguage()

  // Media source state
  const [sourceName, setSourceName] = useState<string>('')
  const [sourceSize, setSourceSize] = useState<number>(0)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState<boolean>(false)
  const [showVideoCaptions, setShowVideoCaptions] = useState<boolean>(true)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Decoded 16kHz audio & waveform peaks
  const [audioSamples, setAudioSamples] = useState<Float32Array | null>(null)
  const [durationSec, setDurationSec] = useState<number>(0)
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([])

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [playbackRate, setPlaybackRate] = useState<number>(1)

  // Live microphone recording state
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingSec, setRecordingSec] = useState<number>(0)
  const [micLevel, setMicLevel] = useState<number>(0)

  // Whisper AI configuration
  const [modelId, setModelId] = useState<WhisperModelId>(
    'onnx-community/whisper-base',
  )
  const [spokenLang, setSpokenLang] = useState<string>(() =>
    language === 'id' ? 'indonesian' : 'english',
  )
  const [task, setTask] = useState<WhisperTask>('transcribe')
  const [styleMode, setStyleMode] = useState<SubtitleStyleMode>('standard')
  const [webGpuSupported] = useState<boolean>(() => supportsWhisperWebGpu())
  const [useWebGpu, setUseWebGpu] = useState<boolean>(() =>
    supportsWhisperWebGpu(),
  )

  // Worker & transcription progress state
  const [stage, setStage] = useState<EngineStage>('idle')
  const [activeDevice, setActiveDevice] = useState<'webgpu' | 'wasm'>('wasm')
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false)
  const [modelPercent, setModelPercent] = useState<number>(0)
  const [modelFileLabel, setModelFileLabel] = useState<string>('')
  const [modelBytes, setModelBytes] = useState<{
    loaded: number
    total: number
  }>({ loaded: 0, total: 0 })
  const [liveStreamText, setLiveStreamText] = useState<string>('')
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Transcript output & editor state
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [editorTab, setEditorTab] = useState<EditorTab>('timeline')
  const [includeProseTimestamps, setIncludeProseTimestamps] =
    useState<boolean>(false)
  const [autoFollowPlayback, setAutoFollowPlayback] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [copiedAction, setCopiedAction] = useState<'text' | 'wa' | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaElRef = useRef<HTMLMediaElement | null>(null)
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const jobCounterRef = useRef<number>(0)
  const activeMediaUrlRef = useRef<string | null>(null)
  const cueListContainerRef = useRef<HTMLDivElement>(null)
  const cueRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micAudioCtxRef = useRef<AudioContext | null>(null)
  const micRafRef = useRef<number | null>(null)
  const recordTimerRef = useRef<number | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const selectedModelMeta = useMemo(
    () => WHISPER_MODELS.find((m) => m.id === modelId) ?? WHISPER_MODELS[1],
    [modelId],
  )

  const activeCue = useMemo(() => {
    if (segments.length === 0) return null
    return (
      segments.find(
        (seg) => currentTime >= seg.start && currentTime <= seg.end + 0.08,
      ) ?? null
    )
  }, [segments, currentTime])

  const filteredSegments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return segments
    return segments.filter((seg) => seg.text.toLowerCase().includes(q))
  }, [segments, searchQuery])

  const wordCount = useMemo(() => countTranscriptWords(segments), [segments])

  const wordsPerMinute = useMemo(() => {
    if (wordCount === 0 || durationSec < 3) return 0
    return Math.round((wordCount / durationSec) * 60)
  }, [wordCount, durationSec])

  const proseContent = useMemo(
    () => segmentsToPlainText(segments, includeProseTimestamps),
    [segments, includeProseTimestamps],
  )

  const cleanupRecordingResources = useCallback(() => {
    if (micRafRef.current !== null) {
      cancelAnimationFrame(micRafRef.current)
      micRafRef.current = null
    }
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }
    if (micAudioCtxRef.current) {
      void micAudioCtxRef.current.close().catch(() => undefined)
      micAudioCtxRef.current = null
    }
  }, [])

  const loadMediaBlob = useCallback(
    async (blob: Blob, displayName: string, mimeHint?: string) => {
      setErrorMsg(null)
      setStage('decoding-audio')
      setIsPlaying(false)
      setCurrentTime(0)
      setLiveStreamText('')
      setElapsedMs(null)

      if (activeMediaUrlRef.current) {
        URL.revokeObjectURL(activeMediaUrlRef.current)
        activeMediaUrlRef.current = null
      }

      const nextUrl = URL.createObjectURL(blob)
      activeMediaUrlRef.current = nextUrl
      const videoDetected = isVideoMedia(
        displayName,
        mimeHint ?? blob.type ?? '',
      )

      setSourceName(displayName)
      setSourceSize(blob.size)
      setMediaUrl(nextUrl)
      setIsVideo(videoDetected)

      try {
        const decoded = await extractMono16kAudio(blob)
        setAudioSamples(decoded.samples)
        setDurationSec(decoded.durationSec)
        setWaveformPeaks(decoded.peaks)
        setStage('idle')
      } catch {
        setAudioSamples(null)
        setWaveformPeaks([])
        setDurationSec(0)
        setStage('idle')
        setErrorMsg(
          t(
            'Format audio/video tidak dapat didekode oleh browser ini. Coba file MP3, WAV, M4A, OGG, MP4, atau WebM.',
            'This audio/video codec could not be decoded by your browser. Please try MP3, WAV, M4A, OGG, MP4, or WebM.',
          ),
        )
      }
    },
    [t],
  )

  // Consume smart file from Homepage dropzone if present
  useEffect(() => {
    const pending = consumePendingSmartFile()
    if (!pending) return
    const timer = window.setTimeout(() => {
      void loadMediaBlob(pending, pending.name, pending.type)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadMediaBlob])

  // Cleanup URLs, mic, and worker on unmount
  useEffect(() => {
    return () => {
      cleanupRecordingResources()
      if (activeMediaUrlRef.current) {
        URL.revokeObjectURL(activeMediaUrlRef.current)
      }
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [cleanupRecordingResources])

  // Auto-scroll active subtitle row inside timeline container during playback
  useEffect(() => {
    if (!autoFollowPlayback || !isPlaying || !activeCue) return
    const rowEl = cueRowRefs.current.get(activeCue.id)
    const containerEl = cueListContainerRef.current
    if (!rowEl || !containerEl) return

    const containerRect = containerEl.getBoundingClientRect()
    const rowRect = rowEl.getBoundingClientRect()
    const outOfView =
      rowRect.top < containerRect.top + 28 ||
      rowRect.bottom > containerRect.bottom - 28

    if (outOfView) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCue, autoFollowPlayback, isPlaying])

  // Draw crisp High-DPI waveform scrubber
  useEffect(() => {
    const canvas = waveformCanvasRef.current
    if (!canvas || waveformPeaks.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(240, Math.floor(rect.width))
    const height = Math.max(56, Math.floor(rect.height))

    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const isDark = document.documentElement.classList.contains('dark')
    const primaryColor = isDark ? '#0a84ff' : '#007aff'
    const unplayedColor = isDark
      ? 'rgba(235, 235, 245, 0.22)'
      : 'rgba(60, 60, 67, 0.20)'
    const cueHighlightBg = isDark
      ? 'rgba(10, 132, 255, 0.16)'
      : 'rgba(0, 122, 255, 0.10)'

    // Highlight active subtitle segment region on waveform
    if (activeCue && durationSec > 0) {
      const startX = (activeCue.start / durationSec) * width
      const endX = Math.max(
        startX + 3,
        (Math.min(durationSec, activeCue.end) / durationSec) * width,
      )
      ctx.fillStyle = cueHighlightBg
      ctx.beginPath()
      ctx.roundRect(startX, 4, endX - startX, height - 8, 6)
      ctx.fill()
    }

    const count = waveformPeaks.length
    const step = width / count
    const barWidth = Math.max(2, Math.min(4.5, step * 0.62))
    const progressRatio =
      durationSec > 0 ? Math.min(1, Math.max(0, currentTime / durationSec)) : 0
    const playheadX = progressRatio * width
    const centerY = height / 2
    const maxBarHeight = height - 14

    for (let i = 0; i < count; i++) {
      const x = i * step + (step - barWidth) / 2
      const barH = Math.max(4, waveformPeaks[i] * maxBarHeight)
      const y = centerY - barH / 2

      ctx.fillStyle = x + barWidth * 0.5 <= playheadX ? primaryColor : unplayedColor
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barH, barWidth / 2)
      ctx.fill()
    }

    // Playhead indicator needle
    if (durationSec > 0) {
      ctx.fillStyle = primaryColor
      ctx.fillRect(
        Math.max(0, Math.min(width - 2, playheadX - 1)),
        2,
        2,
        height - 4,
      )
    }

    ctx.restore()
  }, [waveformPeaks, currentTime, durationSec, activeCue])

  function ensureWorker(): Worker {
    if (workerRef.current) return workerRef.current

    const worker = new Worker(
      new URL('../../workers/whisperWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<TranscribeWorkerResponse>) => {
      const msg = event.data
      if (!msg || msg.jobId !== jobCounterRef.current) return

      if (msg.type === 'stage') {
        setStage(msg.stage)
        setActiveDevice(msg.device)
        if (msg.fallbackNotice) {
          setFallbackUsed(true)
        }
      } else if (msg.type === 'model-progress') {
        setActiveDevice(msg.device)
        setModelPercent(msg.overallPercent)
        setModelFileLabel(msg.file)
        setModelBytes({ loaded: msg.loadedBytes, total: msg.totalBytes })
      } else if (msg.type === 'stream-text') {
        setLiveStreamText(msg.liveText)
      } else if (msg.type === 'result') {
        setActiveDevice(msg.device)
        setElapsedMs(msg.elapsedMs)
        setLiveStreamText('')
        setStage('idle')

        const currentDur = mediaElRef.current?.duration || durationSec
        const normalized = normalizeWhisperChunks(
          msg.chunks,
          msg.text,
          Number.isFinite(currentDur) ? currentDur : durationSec,
          styleMode,
        )
        setSegments(normalized)
      } else if (msg.type === 'error') {
        setStage('idle')
        setErrorMsg(msg.message)
      }
    }

    worker.onerror = (err) => {
      setStage('idle')
      setErrorMsg(
        err.message ||
          t(
            'Terjadi kendala pada pekerja AI di browser.',
            'An unexpected worker error occurred in the browser.',
          ),
      )
    }

    workerRef.current = worker
    return worker
  }

  function handleStartTranscription() {
    if (!audioSamples || audioSamples.length === 0) return

    setErrorMsg(null)
    setFallbackUsed(false)
    setModelPercent(0)
    setModelFileLabel('')
    setModelBytes({ loaded: 0, total: 0 })
    setLiveStreamText('')
    setElapsedMs(null)
    setStage('loading-model')

    const nextJobId = jobCounterRef.current + 1
    jobCounterRef.current = nextJobId

    const worker = ensureWorker()
    // Send a copy so audioSamples stays intact in UI memory for re-runs with different models/languages
    const samplesCopy = new Float32Array(audioSamples)

    const payload: TranscribeWorkerRequest = {
      type: 'transcribe',
      jobId: nextJobId,
      audio: samplesCopy,
      modelId,
      language: spokenLang,
      task,
      styleMode,
      preferWebGpu: webGpuSupported && useWebGpu,
    }

    worker.postMessage(payload, [samplesCopy.buffer])
  }

  function handleCancelTranscription() {
    jobCounterRef.current += 1
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setStage('idle')
    setLiveStreamText('')
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (picked) {
      void loadMediaBlob(picked, picked.name, picked.type)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) {
      void loadMediaBlob(dropped, dropped.name, dropped.type)
    }
  }

  async function handleStartMicRecording() {
    if (isRecording) return
    setErrorMsg(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      micStreamRef.current = stream
      recordedChunksRef.current = []

      // Setup live RMS level meter
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const audioCtx = new AudioCtx()
      micAudioCtxRef.current = audioCtx
      const sourceNode = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      sourceNode.connect(analyser)
      const timeData = new Uint8Array(analyser.fftSize)

      const updateMeter = () => {
        analyser.getByteTimeDomainData(timeData)
        let sumSq = 0
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128
          sumSq += norm * norm
        }
        const rms = Math.sqrt(sumSq / timeData.length)
        setMicLevel(Math.min(1, rms * 3.8))
        micRafRef.current = requestAnimationFrame(updateMeter)
      }
      micRafRef.current = requestAnimationFrame(updateMeter)

      const mimeCandidate = MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus',
      )
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = mimeCandidate
        ? new MediaRecorder(stream, { mimeType: mimeCandidate })
        : new MediaRecorder(stream)

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data)
        }
      }

      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'audio/webm'
        const ext = finalType.includes('mp4') ? 'm4a' : 'webm'
        const recordedBlob = new Blob(recordedChunksRef.current, {
          type: finalType,
        })
        cleanupRecordingResources()
        setIsRecording(false)
        setMicLevel(0)

        if (recordedBlob.size > 0) {
          const stamp = new Date()
            .toTimeString()
            .slice(0, 8)
            .replace(/:/g, '-')
          void loadMediaBlob(
            recordedBlob,
            `rekaman-suara-${stamp}.${ext}`,
            finalType,
          )
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(250)
      setRecordingSec(0)
      setIsRecording(true)

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSec((prev) => prev + 1)
      }, 1000)
    } catch {
      cleanupRecordingResources()
      setIsRecording(false)
      setErrorMsg(
        t(
          'Akses mikrofon ditolak atau tidak ditemukan. Izinkan akses mikrofon pada browser Anda.',
          'Microphone permission was denied or unavailable. Please allow microphone access in your browser.',
        ),
      )
    }
  }

  function handleStopMicRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
    } else {
      cleanupRecordingResources()
      setIsRecording(false)
    }
  }

  function handleClearMedia() {
    if (mediaElRef.current) {
      mediaElRef.current.pause()
    }
    if (activeMediaUrlRef.current) {
      URL.revokeObjectURL(activeMediaUrlRef.current)
      activeMediaUrlRef.current = null
    }
    setMediaUrl(null)
    setSourceName('')
    setSourceSize(0)
    setAudioSamples(null)
    setWaveformPeaks([])
    setDurationSec(0)
    setCurrentTime(0)
    setIsPlaying(false)
    setErrorMsg(null)
  }

  function togglePlayPause() {
    const el = mediaElRef.current
    if (!el) return
    if (el.paused) {
      void el.play().catch(() => undefined)
    } else {
      el.pause()
    }
  }

  function seekTo(seconds: number, autoPlay = false) {
    const el = mediaElRef.current
    if (!el || durationSec <= 0) return
    const target = Math.max(0, Math.min(durationSec, seconds))
    el.currentTime = target
    setCurrentTime(target)
    if (autoPlay && el.paused) {
      void el.play().catch(() => undefined)
    }
  }

  function handleWaveformClick(event: ReactMouseEvent<HTMLCanvasElement>) {
    if (durationSec <= 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / Math.max(1, rect.width)
    seekTo(ratio * durationSec)
  }

  function handleCyclePlaybackRate() {
    const idx = PLAYBACK_RATES.indexOf(
      playbackRate as (typeof PLAYBACK_RATES)[number],
    )
    const nextRate = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length]
    setPlaybackRate(nextRate)
    if (mediaElRef.current) {
      mediaElRef.current.playbackRate = nextRate
    }
  }

  function handleUpdateSegmentText(id: string, nextText: string) {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, text: nextText } : seg)),
    )
  }

  function handleDeleteSegment(id: string) {
    setSegments((prev) => prev.filter((seg) => seg.id !== id))
  }

  function handleAddSegmentAfter(index: number) {
    setSegments((prev) => {
      const refSeg = prev[index]
      const nextSeg = prev[index + 1]
      const start = refSeg ? Number(refSeg.end.toFixed(2)) : 0
      const end = nextSeg
        ? Number(Math.max(start + 0.5, nextSeg.start).toFixed(2))
        : Number(Math.min(durationSec || start + 2.5, start + 2.5).toFixed(2))

      const created: TranscriptSegment = {
        id: `seg-custom-${Date.now()}`,
        start,
        end,
        text: '',
      }
      const copy = [...prev]
      copy.splice(index + 1, 0, created)
      return copy
    })
  }

  async function handleCopyText(mode: 'text' | 'wa') {
    if (segments.length === 0) return
    const content =
      mode === 'wa'
        ? segmentsToWhatsAppSummary(
            segments,
            sourceName || 'audio',
            durationSec,
            language === 'id',
          )
        : segmentsToPlainText(segments, includeProseTimestamps)

    await navigator.clipboard.writeText(content)
    setCopiedAction(mode)
    window.setTimeout(() => {
      setCopiedAction((prev) => (prev === mode ? null : prev))
    }, 2000)
  }

  function handleExportFile(format: 'srt' | 'vtt' | 'txt' | 'json') {
    if (segments.length === 0) return
    const base = stripExtension(sourceName || 'transkrip-audio')

    if (format === 'srt') {
      const srt = segmentsToSrt(segments)
      downloadBlob(
        new Blob([srt], { type: 'application/x-subrip;charset=utf-8' }),
        `${base}.srt`,
      )
      return
    }

    if (format === 'vtt') {
      const vtt = segmentsToVtt(segments)
      downloadBlob(
        new Blob([vtt], { type: 'text/vtt;charset=utf-8' }),
        `${base}.vtt`,
      )
      return
    }

    if (format === 'txt') {
      const txt = segmentsToPlainText(segments, includeProseTimestamps)
      downloadBlob(
        new Blob([txt], { type: 'text/plain;charset=utf-8' }),
        `${base}.txt`,
      )
      return
    }

    const jsonPayload = JSON.stringify(
      {
        source: sourceName || 'audio',
        durationSec: Number(durationSec.toFixed(2)),
        model: modelId,
        language: spokenLang,
        task,
        segments,
      },
      null,
      2,
    )
    downloadBlob(
      new Blob([jsonPayload], { type: 'application/json;charset=utf-8' }),
      `${base}.json`,
    )
  }

  const isBusy =
    stage === 'decoding-audio' ||
    stage === 'loading-model' ||
    stage === 'transcribing'

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="audio-transcriber" />

      <input
        id="whisper-file-input"
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.opus,.flac,.mp4,.mov,.webm,.mkv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: MEDIA SOURCE, WAVEFORM PLAYER & WHISPER ENGINE */}
        <section className="space-y-5 lg:col-span-5">
          {/* 1. Media Source & Waveform Deck */}
          <div className="ios-card overflow-hidden p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t('1. Sumber Suara atau Video', '1. Audio or Video Source')}
              </h2>

              {mediaUrl && (
                <button
                  id="whisper-clear-media-btn"
                  type="button"
                  onClick={handleClearMedia}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--error)] disabled:opacity-50"
                >
                  <X size={13} />
                  {t('Ganti File', 'Replace')}
                </button>
              )}
            </div>

            {!mediaUrl ? (
              <div className="mt-3.5 space-y-3">
                {!isRecording ? (
                  <div
                    id="whisper-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
                      isDragging
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Upload size={20} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                      {t(
                        'Pilih atau tarik file Audio / Video',
                        'Choose or drop an Audio / Video file',
                      )}
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
                      {t(
                        'Mendukung MP3, WAV, M4A, Voice Note WA (.ogg/.opus), MP4, MOV, & WebM — diproses 100% di browser.',
                        'Supports MP3, WAV, M4A, WhatsApp Voice Notes (.ogg/.opus), MP4, MOV, & WebM — 100% local.',
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--error)]">
                        <span className="rec-dot-pulse h-2.5 w-2.5 rounded-full bg-[var(--error)]" />
                        {t('Merekam Mikrofon...', 'Recording Microphone...')}
                      </span>
                      <span className="font-mono text-sm font-bold tabular-nums text-[var(--text-primary)]">
                        {formatClockTime(recordingSec)}
                      </span>
                    </div>

                    {/* Live input level meter */}
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--segmented-bg)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-75"
                        style={{
                          width: `${Math.max(6, Math.round(micLevel * 100))}%`,
                        }}
                      />
                    </div>

                    <button
                      id="whisper-stop-record-btn"
                      type="button"
                      onClick={handleStopMicRecording}
                      className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--error)] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:opacity-90"
                    >
                      <Square size={14} fill="currentColor" />
                      {t(
                        'Selesai & Gunakan Rekaman',
                        'Stop & Use Recording',
                      )}
                    </button>
                  </div>
                )}

                {!isRecording && (
                  <button
                    id="whisper-start-record-btn"
                    type="button"
                    onClick={() => void handleStartMicRecording()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                  >
                    <Mic size={15} className="text-[var(--primary)]" />
                    {t(
                      'Atau Rekam Suara Langsung dari Mikrofon',
                      'Or Record Voice Directly from Microphone',
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-3.5 space-y-3.5">
                {/* Loaded File Metadata Strip */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      {isVideo ? <Video size={17} /> : <FileAudio size={17} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                        {sourceName}
                      </p>
                      <p className="text-[11px] tabular-nums text-[var(--text-muted)]">
                        {formatFileSize(sourceSize)}
                        {durationSec > 0
                          ? ` • ${formatClockTime(durationSec)}`
                          : ''}
                        {' • 16 kHz Mono PCM'}
                      </p>
                    </div>
                  </div>

                  {isVideo && segments.length > 0 && (
                    <button
                      id="whisper-toggle-video-cc-btn"
                      type="button"
                      onClick={() => setShowVideoCaptions((v) => !v)}
                      title={t(
                        'Tampilkan pratinjau subtitle di atas video',
                        'Toggle live subtitle overlay on video',
                      )}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                        showVideoCaptions
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Captions size={13} />
                      CC
                    </button>
                  )}
                </div>

                {/* Video Frame + Live Burned-In Caption Overlay (for Video files) */}
                {isVideo ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-black">
                    <video
                      ref={(el) => {
                        mediaElRef.current = el
                      }}
                      src={mediaUrl}
                      playsInline
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.playbackRate = playbackRate
                      }}
                      onClick={togglePlayPause}
                      className="aspect-video max-h-60 w-full cursor-pointer object-contain"
                    />

                    {showVideoCaptions && activeCue && (
                      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                        <span className="max-w-[92%] rounded-lg bg-black/80 px-3 py-1.5 text-center text-xs font-semibold leading-5 text-white shadow-md sm:text-sm">
                          {activeCue.text}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <audio
                    ref={(el) => {
                      mediaElRef.current = el
                    }}
                    src={mediaUrl}
                    onTimeUpdate={(e) =>
                      setCurrentTime(e.currentTarget.currentTime)
                    }
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = playbackRate
                    }}
                    className="hidden"
                  />
                )}

                {/* Interactive Waveform Scrubber */}
                <div className="waveform-stage-surface rounded-2xl border border-[var(--border)] p-3">
                  {stage === 'decoding-audio' ? (
                    <div className="flex h-16 items-center justify-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                      <LoaderCircle
                        size={16}
                        className="animate-spin text-[var(--primary)]"
                      />
                      {t(
                        'Mengekstrak gelombang suara 16 kHz...',
                        'Extracting 16 kHz audio waveform...',
                      )}
                    </div>
                  ) : (
                    <>
                      <canvas
                        id="whisper-waveform-canvas"
                        ref={waveformCanvasRef}
                        onClick={handleWaveformClick}
                        className="h-16 w-full cursor-pointer"
                        title={t(
                          'Klik pada gelombang untuk melompat ke detik tersebut',
                          'Click anywhere on the waveform to seek',
                        )}
                      />

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--border)]/70 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            id="whisper-seek-back-btn"
                            type="button"
                            onClick={() => seekTo(currentTime - 5)}
                            aria-label={t('Mundur 5 detik', 'Back 5 seconds')}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] shadow-2xs transition hover:text-[var(--primary)]"
                          >
                            <RotateCcw size={14} />
                          </button>

                          <button
                            id="whisper-play-pause-btn"
                            type="button"
                            onClick={togglePlayPause}
                            aria-label={
                              isPlaying
                                ? t('Jeda', 'Pause')
                                : t('Putar', 'Play')
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
                          >
                            {isPlaying ? (
                              <Pause size={15} fill="currentColor" />
                            ) : (
                              <Play
                                size={15}
                                fill="currentColor"
                                className="translate-x-0.5"
                              />
                            )}
                          </button>

                          <button
                            id="whisper-seek-forward-btn"
                            type="button"
                            onClick={() => seekTo(currentTime + 5)}
                            aria-label={t('Maju 5 detik', 'Forward 5 seconds')}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] shadow-2xs transition hover:text-[var(--primary)]"
                          >
                            <RotateCw size={14} />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                          {formatClockTime(currentTime, true)}{' '}
                          <span className="text-[var(--text-muted)]">/</span>{' '}
                          {formatClockTime(durationSec, true)}
                        </span>

                        <button
                          id="whisper-playback-rate-btn"
                          type="button"
                          onClick={handleCyclePlaybackRate}
                          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                        >
                          {playbackRate}×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Whisper AI Engine Configuration */}
          <div className="ios-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t('2. Pengaturan Mesin Whisper AI', '2. Whisper AI Engine')}
              </h2>

              {webGpuSupported && (
                <button
                  id="whisper-webgpu-toggle"
                  type="button"
                  onClick={() => setUseWebGpu((v) => !v)}
                  disabled={isBusy}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                    useWebGpu
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'bg-[var(--surface-soft)] text-[var(--text-muted)]'
                  }`}
                >
                  <Zap size={12} />
                  {useWebGpu ? 'WebGPU' : 'WASM CPU'}
                </button>
              )}
            </div>

            {/* Model Tier Picker */}
            <div className="mt-3.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                {t('Ukuran Model AI', 'AI Model Tier')}
              </label>
              <div className="ios-segmented mt-1.5 grid grid-cols-3 gap-1">
                {WHISPER_MODELS.map((m) => {
                  const selected = m.id === modelId
                  return (
                    <button
                      key={m.id}
                      id={`whisper-model-${m.id.split('-').pop()}`}
                      type="button"
                      disabled={isBusy}
                      onClick={() => setModelId(m.id)}
                      className={`rounded-full px-2 py-1.5 text-center text-xs font-semibold transition ${
                        selected
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="block truncate">
                        {language === 'id' ? m.shortLabelId : m.shortLabelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-secondary)]">
                  {selectedModelMeta.sizeBadge}
                </span>{' '}
                —{' '}
                {language === 'id'
                  ? selectedModelMeta.descId
                  : selectedModelMeta.descEn}
              </p>
            </div>

            {/* Language & Task Row */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="whisper-language-select"
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {t('Bahasa di Dalam Audio', 'Spoken Language')}
                </label>
                <select
                  id="whisper-language-select"
                  value={spokenLang}
                  disabled={isBusy}
                  onChange={(e) => setSpokenLang(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                >
                  {WHISPER_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {language === 'id' ? lang.labelId : lang.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="whisper-task-select"
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {t('Mode Keluaran', 'Output Task')}
                </label>
                <select
                  id="whisper-task-select"
                  value={task}
                  disabled={isBusy}
                  onChange={(e) => setTask(e.target.value as WhisperTask)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="transcribe">
                    {t('Transkrip Sesuai Asli', 'Transcribe Original')}
                  </option>
                  <option value="translate">
                    {t('Terjemahkan ke Inggris', 'Translate to English')}
                  </option>
                </select>
              </div>
            </div>

            {/* Subtitle Density Style */}
            <div className="mt-4">
              <span className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t('Gaya Pemotongan Subtitle', 'Subtitle Pacing')}
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  id="whisper-style-standard-btn"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStyleMode('standard')}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    styleMode === 'standard'
                      ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="block text-xs font-bold">
                    {t('Kalimat Standar', 'Standard Sentences')}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {t('YouTube, Kuliah, Rapat', 'YouTube, Lectures, Meetings')}
                  </span>
                </button>

                <button
                  id="whisper-style-short-btn"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStyleMode('short')}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    styleMode === 'short'
                      ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="block text-xs font-bold">
                    {t('Pendek · 4 Kata', 'Short · 4 Words')}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {t('CapCut, Reels, TikTok', 'CapCut, Reels, Shorts')}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-3.5 py-2.5 text-xs leading-5 text-[var(--error)]"
              >
                {errorMsg}
              </div>
            )}

            {/* Progress Console during Model Download / Active Inference */}
            {(stage === 'loading-model' || stage === 'transcribing') && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)]">
                    <LoaderCircle size={14} className="animate-spin" />
                    {stage === 'loading-model'
                      ? t(
                          'Menyiapkan Model AI ke Cache Browser...',
                          'Caching AI Model in Browser...',
                        )
                      : t(
                          'Menyalin Suara ke Teks...',
                          'Transcribing Audio Locally...',
                        )}
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--text-muted)]">
                    {activeDevice}
                  </span>
                </div>

                {stage === 'loading-model' && (
                  <div className="mt-2.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--segmented-bg)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-200"
                        style={{ width: `${Math.max(4, modelPercent)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-[var(--text-muted)]">
                      <span className="truncate">
                        {modelFileLabel ||
                          t(
                            'Diunduh sekali saja, selanjutnya instan',
                            'Downloaded once, cached for offline reuse',
                          )}
                      </span>
                      <span>
                        {modelBytes.total > 0
                          ? `${formatFileSize(modelBytes.loaded)} / ${formatFileSize(modelBytes.total)} (${modelPercent}%)`
                          : `${modelPercent}%`}
                      </span>
                    </div>
                  </div>
                )}

                {fallbackUsed && (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {t(
                      'WebGPU tidak tersedia untuk model ini; otomatis beralih ke mode WASM yang stabil.',
                      'WebGPU was unavailable for this session; automatically switched to stable WASM mode.',
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Primary Execute / Cancel Button */}
            <div className="mt-4 flex gap-2">
              {stage === 'loading-model' || stage === 'transcribing' ? (
                <button
                  id="whisper-cancel-btn"
                  type="button"
                  onClick={handleCancelTranscription}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--error)] transition hover:bg-[var(--error)]/10"
                >
                  <Square size={15} fill="currentColor" />
                  {t('Batalkan Proses', 'Cancel Transcription')}
                </button>
              ) : (
                <button
                  id="whisper-transcribe-btn"
                  type="button"
                  disabled={!audioSamples || stage === 'decoding-audio'}
                  onClick={handleStartTranscription}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Captions size={18} />
                  {segments.length > 0
                    ? t('Transkrip Ulang Audio', 'Re-Transcribe Audio')
                    : t('Mulai Transkripsi Lokal', 'Start Local Transcription')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE TIMELINE SUBTITLE & PROSE WORKSPACE */}
        <section className="ios-card flex min-h-[480px] flex-col overflow-hidden lg:col-span-7">
          {/* Workspace Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
            <div className="ios-segmented inline-flex">
              <button
                id="whisper-tab-timeline"
                type="button"
                onClick={() => setEditorTab('timeline')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  editorTab === 'timeline'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Clock size={13} />
                {t('Timeline Subtitle', 'Subtitle Timeline')}
                {segments.length > 0 && (
                  <span className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.2 text-[10px] tabular-nums text-[var(--primary)]">
                    {segments.length}
                  </span>
                )}
              </button>

              <button
                id="whisper-tab-prose"
                type="button"
                onClick={() => setEditorTab('prose')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  editorTab === 'prose'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <FileText size={13} />
                {t('Teks Paragraf', 'Full Text')}
              </button>
            </div>

            {segments.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium tabular-nums text-[var(--text-muted)]">
                <span>
                  <strong className="text-[var(--text-primary)]">
                    {wordCount}
                  </strong>{' '}
                  {t('kata', 'words')}
                </span>
                {wordsPerMinute > 0 && (
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      {wordsPerMinute}
                    </strong>{' '}
                    WPM
                  </span>
                )}
                {elapsedMs !== null && (
                  <span className="inline-flex items-center gap-1 text-[var(--success)]">
                    <Cpu size={12} />
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search & Sync Subbar when segments exist */}
          {segments.length > 0 && editorTab === 'timeline' && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-2.5 sm:px-5">
              <div className="relative min-w-[180px] flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  id="whisper-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'Cari kata atau kalimat di subtitle...',
                    'Filter cues by keyword...',
                  )}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-8 pr-7 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] select-none">
                <input
                  id="whisper-autofollow-checkbox"
                  type="checkbox"
                  checked={autoFollowPlayback}
                  onChange={(e) => setAutoFollowPlayback(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                />
                {t('Ikuti Suara', 'Auto-Follow')}
              </label>
            </div>
          )}

          {segments.length > 0 && editorTab === 'prose' && (
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-2.5 sm:px-5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-secondary)] select-none">
                <input
                  id="whisper-prose-timestamps-checkbox"
                  type="checkbox"
                  checked={includeProseTimestamps}
                  onChange={(e) => setIncludeProseTimestamps(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                />
                {t(
                  'Sertakan penanda waktu [MM:SS] per baris',
                  'Include [MM:SS] timestamps per line',
                )}
              </label>

              <span className="text-[11px] text-[var(--text-muted)]">
                {t(
                  'Edit per kalimat di tab Timeline Subtitle',
                  'Edit individual cues in Subtitle Timeline',
                )}
              </span>
            </div>
          )}

          {/* Main Workspace Body */}
          <div
            ref={cueListContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5"
            style={{ maxHeight: '540px' }}
          >
            {/* Live Streaming Transcript Preview while Whisper is running */}
            {stage === 'transcribing' && (
              <div className="mb-4 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                  {t(
                    'Aliran Teks Langsung (Live Stream)',
                    'Live Recognition Stream',
                  )}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text-primary)]">
                  {liveStreamText ||
                    t(
                      'Menganalisis potongan gelombang suara pertama...',
                      'Analyzing first 30-second audio window...',
                    )}
                </p>
              </div>
            )}

            {segments.length === 0 && stage !== 'transcribing' ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-4 text-center">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--text-muted)]">
                  <Captions size={24} />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Belum Ada Transkrip atau Subtitle',
                    'No Transcript Yet',
                  )}
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                  {t(
                    'Unggah rekaman kuliah, rapat, podcast, Voice Note WhatsApp, atau video konten di sebelah kiri, lalu klik "Mulai Transkripsi Lokal".',
                    'Load a lecture, meeting recording, WhatsApp voice note, or video clip on the left, then click "Start Local Transcription".',
                  )}
                </p>
              </div>
            ) : editorTab === 'timeline' ? (
              <div className="space-y-2.5">
                {filteredSegments.map((seg, idx) => {
                  const isActive = activeCue?.id === seg.id
                  return (
                    <div
                      key={seg.id}
                      ref={(el) => {
                        if (el) {
                          cueRowRefs.current.set(seg.id, el)
                        } else {
                          cueRowRefs.current.delete(seg.id)
                        }
                      }}
                      data-active={isActive ? 'true' : 'false'}
                      className="transcript-cue-row group rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
                            #{idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => seekTo(seg.start, true)}
                            title={t(
                              'Klik untuk memutar bagian kalimat ini',
                              'Click to jump & play from this timestamp',
                            )}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-[var(--primary)] shadow-2xs transition hover:bg-[var(--primary)] hover:text-white"
                          >
                            <Play size={10} fill="currentColor" />
                            {formatTimestampSrt(seg.start).replace(',', '.')} →{' '}
                            {formatTimestampSrt(seg.end).replace(',', '.')}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 opacity-75 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleAddSegmentAfter(idx)}
                            title={t(
                              'Sisipkan baris subtitle di bawah',
                              'Insert cue below',
                            )}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--primary)]"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSegment(seg.id)}
                            title={t('Hapus baris ini', 'Delete cue')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--error)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={seg.text}
                        rows={Math.max(1, Math.ceil(seg.text.length / 68))}
                        onChange={(e) =>
                          handleUpdateSegmentText(seg.id, e.target.value)
                        }
                        placeholder={t(
                          'Ketik teks subtitle di sini...',
                          'Type subtitle text here...',
                        )}
                        className="mt-2 w-full resize-y rounded-xl border border-transparent bg-[var(--surface)] px-3 py-2 text-xs leading-5 text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] sm:text-sm"
                      />
                    </div>
                  )
                })}

                {segments.length > 0 && filteredSegments.length === 0 && (
                  <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                    {t(
                      'Tidak ada baris subtitle yang cocok dengan kata pencarian.',
                      'No subtitle cues match your search filter.',
                    )}
                  </p>
                )}
              </div>
            ) : (
              <textarea
                id="whisper-prose-output"
                readOnly
                value={proseContent}
                rows={16}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-7 text-[var(--text-primary)] outline-none"
              />
            )}
          </div>

          {/* Export Action Footer */}
          <div className="border-t border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="whisper-export-srt-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => handleExportFile('srt')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
                >
                  <Download size={14} />
                  {t('Unduh .SRT', 'Download .SRT')}
                </button>

                <button
                  id="whisper-export-vtt-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => handleExportFile('vtt')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <Download size={13} />
                  .VTT
                </button>

                <button
                  id="whisper-export-txt-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => handleExportFile('txt')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <Download size={13} />
                  .TXT
                </button>

                <button
                  id="whisper-export-json-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => handleExportFile('json')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <Download size={13} />
                  .JSON
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="whisper-copy-text-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => void handleCopyText('text')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-40"
                >
                  {copiedAction === 'text' ? (
                    <Check size={14} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copiedAction === 'text'
                    ? t('Tersalin!', 'Copied!')
                    : t('Salin Teks', 'Copy Text')}
                </button>

                <button
                  id="whisper-copy-wa-btn"
                  type="button"
                  disabled={segments.length === 0}
                  onClick={() => void handleCopyText('wa')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-40"
                >
                  {copiedAction === 'wa' ? (
                    <Check size={14} className="text-[var(--success)]" />
                  ) : (
                    <MessageCircle size={14} />
                  )}
                  {copiedAction === 'wa'
                    ? t('Siap Tempel WA!', 'Copied for WA!')
                    : t('Format WA', 'Copy WA')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
