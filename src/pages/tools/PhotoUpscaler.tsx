import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowLeftRight,
  Cpu,
  Download,
  ImagePlus,
  LoaderCircle,
  Maximize2,
  Square,
  Upload,
  X,
  Zap,
  ZoomIn,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  UPSCALE_ENGINES,
  computeSafeWorkingDimensions,
  runInstantDspUpscale,
  supportsUpscalerWebGpu,
  type UpscaleEngineId,
} from '../../lib/photoUpscaler'
import { consumePendingSmartFile } from '../../lib/smartFileStore'
import { downloadDataUrl } from '../../utils/download'
import { formatFileSize } from '../../utils/file'
import type {
  UpscalerWorkerRequest,
  UpscalerWorkerResponse,
} from '../../workers/upscalerWorker'

type UpscaleStage = 'idle' | 'loading-model' | 'upscaling'
type QualityCapPreset = 'balanced' | 'ultra'

function stripExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to decode image file.'))
    img.src = src
  })
}

export default function PhotoUpscaler() {
  const { language, t } = useLanguage()

  // Source image state
  const [sourceName, setSourceName] = useState<string>('')
  const [sourceSize, setSourceSize] = useState<number>(0)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [origDims, setOrigDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  })
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Engine settings
  const [engineId, setEngineId] = useState<UpscaleEngineId>('ai-realworld-4x')
  const [capPreset, setCapPreset] = useState<QualityCapPreset>('balanced')
  const [dspSharpness, setDspSharpness] = useState<number>(0.7)
  const [webGpuSupported] = useState<boolean>(() => supportsUpscalerWebGpu())
  const [useWebGpu, setUseWebGpu] = useState<boolean>(() =>
    supportsUpscalerWebGpu(),
  )

  // Processing progress state
  const [stage, setStage] = useState<UpscaleStage>('idle')
  const [activeDevice, setActiveDevice] = useState<'webgpu' | 'wasm'>('wasm')
  const [fallbackNotice, setFallbackNotice] = useState<boolean>(false)
  const [modelPercent, setModelPercent] = useState<number>(0)
  const [modelBytes, setModelBytes] = useState<{
    loaded: number
    total: number
  }>({ loaded: 0, total: 0 })
  const [tileStatus, setTileStatus] = useState<{
    current: number
    total: number
    percent: number
  }>({ current: 0, total: 0, percent: 0 })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Result state
  const [resultPngUrl, setResultPngUrl] = useState<string | null>(null)
  const [resultJpgUrl, setResultJpgUrl] = useState<string | null>(null)
  const [outDims, setOutDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  })
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  // Interactive Before/After split slider & zoom state
  const [splitPct, setSplitPct] = useState<number>(50)
  const [zoom2x, setZoom2x] = useState<boolean>(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSrcUrlRef = useRef<string | null>(null)
  const loadedImageRef = useRef<HTMLImageElement | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const jobCounterRef = useRef<number>(0)
  const compareBoxRef = useRef<HTMLDivElement>(null)
  const isDraggingSliderRef = useRef<boolean>(false)

  const selectedEngine = useMemo(
    () =>
      UPSCALE_ENGINES.find((item) => item.id === engineId) ??
      UPSCALE_ENGINES[0],
    [engineId],
  )

  const maxInputLongSide = useMemo(() => {
    if (selectedEngine.modelRepo === null) {
      return capPreset === 'ultra' ? 2400 : 1800
    }
    if (selectedEngine.scale === 4) {
      return capPreset === 'ultra' ? 768 : 512
    }
    return capPreset === 'ultra' ? 1024 : 720
  }, [selectedEngine, capPreset])

  const workingDims = useMemo(() => {
    if (origDims.w === 0 || origDims.h === 0) {
      return { width: 0, height: 0, wasDownscaledForSafety: false }
    }
    return computeSafeWorkingDimensions(
      origDims.w,
      origDims.h,
      maxInputLongSide,
    )
  }, [origDims, maxInputLongSide])

  const predictedOutDims = useMemo(
    () => ({
      w: workingDims.width * selectedEngine.scale,
      h: workingDims.height * selectedEngine.scale,
    }),
    [workingDims, selectedEngine.scale],
  )

  const loadSelectedFile = useCallback(
    async (file: File) => {
      setErrorMsg(null)
      setResultPngUrl(null)
      setResultJpgUrl(null)
      setElapsedMs(null)
      setSplitPct(50)

      if (activeSrcUrlRef.current) {
        URL.revokeObjectURL(activeSrcUrlRef.current)
        activeSrcUrlRef.current = null
      }

      const objUrl = URL.createObjectURL(file)
      activeSrcUrlRef.current = objUrl

      try {
        const img = await loadImageElement(objUrl)
        loadedImageRef.current = img
        setSourceName(file.name)
        setSourceSize(file.size)
        setSourceUrl(objUrl)
        setOrigDims({ w: img.naturalWidth, h: img.naturalHeight })
      } catch {
        URL.revokeObjectURL(objUrl)
        activeSrcUrlRef.current = null
        setErrorMsg(
          t(
            'File gambar tidak dapat dibaca. Gunakan JPG, PNG, atau WebP.',
            'Unable to decode image file. Please select a JPG, PNG, or WebP image.',
          ),
        )
      }
    },
    [t],
  )

  // Auto-load smart file from Home dropzone
  useEffect(() => {
    const smart = consumePendingSmartFile()
    if (!smart) return
    const timer = window.setTimeout(() => {
      void loadSelectedFile(smart)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadSelectedFile])

  useEffect(() => {
    return () => {
      if (activeSrcUrlRef.current) {
        URL.revokeObjectURL(activeSrcUrlRef.current)
      }
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  function ensureWorker(): Worker {
    if (workerRef.current) return workerRef.current

    const worker = new Worker(
      new URL('../../workers/upscalerWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (ev: MessageEvent<UpscalerWorkerResponse>) => {
      const msg = ev.data
      if (!msg || msg.jobId !== jobCounterRef.current) return

      if (msg.type === 'stage') {
        setStage(msg.stage)
        setActiveDevice(msg.device)
        if (msg.fallbackNotice) setFallbackNotice(true)
      } else if (msg.type === 'model-progress') {
        setActiveDevice(msg.device)
        setModelPercent(msg.overallPercent)
        setModelBytes({ loaded: msg.loadedBytes, total: msg.totalBytes })
      } else if (msg.type === 'tile-progress') {
        setTileStatus({
          current: msg.currentTile,
          total: msg.totalTiles,
          percent: msg.percent,
        })
      } else if (msg.type === 'result') {
        setActiveDevice(msg.device)
        setElapsedMs(msg.elapsedMs)

        const outCanvas = document.createElement('canvas')
        outCanvas.width = msg.outWidth
        outCanvas.height = msg.outHeight
        const ctx = outCanvas.getContext('2d')
        if (ctx) {
          const clamped = new Uint8ClampedArray(msg.rgbaBuffer)
          ctx.putImageData(
            new ImageData(clamped, msg.outWidth, msg.outHeight),
            0,
            0,
          )
          setResultPngUrl(outCanvas.toDataURL('image/png'))
          setResultJpgUrl(outCanvas.toDataURL('image/jpeg', 0.95))
          setOutDims({ w: msg.outWidth, h: msg.outHeight })
        }
        setStage('idle')
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
            'Terjadi kesalahan saat memproses AI Super-Resolution.',
            'An unexpected error occurred in the AI Super-Resolution worker.',
          ),
      )
    }

    workerRef.current = worker
    return worker
  }

  function handleRunUpscale() {
    const img = loadedImageRef.current
    if (!img || workingDims.width <= 0 || workingDims.height <= 0) return

    setErrorMsg(null)
    setFallbackNotice(false)
    setModelPercent(0)
    setModelBytes({ loaded: 0, total: 0 })
    setTileStatus({ current: 0, total: 0, percent: 0 })

    // Instant DSP Mode runs synchronously in <0.5s with zero download
    if (selectedEngine.modelRepo === null) {
      const t0 = performance.now()
      try {
        const outCanvas = runInstantDspUpscale(
          img,
          workingDims.width,
          workingDims.height,
          selectedEngine.scale,
          dspSharpness,
        )
        setResultPngUrl(outCanvas.toDataURL('image/png'))
        setResultJpgUrl(outCanvas.toDataURL('image/jpeg', 0.95))
        setOutDims({ w: outCanvas.width, h: outCanvas.height })
        setElapsedMs(Math.max(12, Math.round(performance.now() - t0)))
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'DSP Upscale failed.')
      }
      return
    }

    // Prepare working RGBA input canvas for neural Swin2SR worker
    const prepCanvas = document.createElement('canvas')
    prepCanvas.width = workingDims.width
    prepCanvas.height = workingDims.height
    const pCtx = prepCanvas.getContext('2d')
    if (!pCtx) {
      setErrorMsg('Canvas 2D context unavailable.')
      return
    }
    pCtx.imageSmoothingEnabled = true
    pCtx.imageSmoothingQuality = 'high'
    pCtx.drawImage(img, 0, 0, workingDims.width, workingDims.height)
    const imgData = pCtx.getImageData(
      0,
      0,
      workingDims.width,
      workingDims.height,
    )
    const bufferCopy = imgData.data.buffer.slice(0)

    const nextJob = jobCounterRef.current + 1
    jobCounterRef.current = nextJob
    setStage('loading-model')

    const worker = ensureWorker()
    const payload: UpscalerWorkerRequest = {
      type: 'upscale',
      jobId: nextJob,
      rgbaBuffer: bufferCopy,
      width: workingDims.width,
      height: workingDims.height,
      modelRepo: selectedEngine.modelRepo,
      scale: selectedEngine.scale,
      preferWebGpu: webGpuSupported && useWebGpu,
      tileSize: selectedEngine.scale === 4 ? 144 : 192,
      overlap: 16,
    }
    worker.postMessage(payload, [bufferCopy])
  }

  function handleCancelUpscale() {
    jobCounterRef.current += 1
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setStage('idle')
  }

  function handleClearImage() {
    if (activeSrcUrlRef.current) {
      URL.revokeObjectURL(activeSrcUrlRef.current)
      activeSrcUrlRef.current = null
    }
    loadedImageRef.current = null
    setSourceUrl(null)
    setSourceName('')
    setSourceSize(0)
    setOrigDims({ w: 0, h: 0 })
    setResultPngUrl(null)
    setResultJpgUrl(null)
    setOutDims({ w: 0, h: 0 })
    setElapsedMs(null)
    setErrorMsg(null)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void loadSelectedFile(f)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void loadSelectedFile(f)
  }

  function updateSplitFromPointer(clientX: number) {
    const el = compareBoxRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100
    setSplitPct(Math.max(2, Math.min(98, pct)))
  }

  function handleComparePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!resultPngUrl) return
    isDraggingSliderRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateSplitFromPointer(e.clientX)
  }

  function handleComparePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSliderRef.current) return
    updateSplitFromPointer(e.clientX)
  }

  function handleComparePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSliderRef.current) return
    isDraggingSliderRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const isBusy = stage !== 'idle'
  const baseFileName = stripExt(sourceName || 'foto')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="photo-upscaler" />

      <input
        id="upscaler-file-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: ENGINE CONTROLS */}
        <section className="space-y-5 lg:col-span-5">
          <div className="ios-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t('1. Pilih Mesin Penajam Foto', '1. Super-Resolution Engine')}
              </h2>

              {webGpuSupported && selectedEngine.modelRepo !== null && (
                <button
                  id="upscaler-webgpu-toggle"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setUseWebGpu((v) => !v)}
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

            <div className="mt-3.5 space-y-2">
              {UPSCALE_ENGINES.map((eng) => {
                const active = eng.id === engineId
                return (
                  <button
                    key={eng.id}
                    id={`upscaler-engine-${eng.id}`}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setEngineId(eng.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-[var(--primary-border)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          active
                            ? 'text-[var(--primary)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {language === 'id' ? eng.labelId : eng.labelEn}
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-secondary)]">
                        {eng.badgeSize}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
                      {language === 'id' ? eng.descId : eng.descEn}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Resolution Cap / Sharpness Tuning */}
            {selectedEngine.modelRepo !== null ? (
              <div className="mt-4">
                <span className="block text-xs font-semibold text-[var(--text-secondary)]">
                  {t('Batas Resolusi Kerja AI', 'AI Working Resolution Preset')}
                </span>
                <div className="ios-segmented mt-1.5 grid grid-cols-2 gap-1">
                  <button
                    id="upscaler-cap-balanced"
                    type="button"
                    disabled={isBusy}
                    onClick={() => setCapPreset('balanced')}
                    className={`rounded-full py-1.5 text-xs font-bold transition ${
                      capPreset === 'balanced'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Seimbang Cepat', 'Fast Balanced')}
                  </button>
                  <button
                    id="upscaler-cap-ultra"
                    type="button"
                    disabled={isBusy}
                    onClick={() => setCapPreset('ultra')}
                    className={`rounded-full py-1.5 text-xs font-bold transition ${
                      capPreset === 'ultra'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Detail Maksimum', 'Max Detail')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="upscaler-dsp-sharpness"
                    className="font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Kekuatan Penajam Tepi', 'Edge Sharpening')}
                  </label>
                  <span className="font-mono font-bold tabular-nums text-[var(--primary)]">
                    {Math.round(dspSharpness * 100)}%
                  </span>
                </div>
                <input
                  id="upscaler-dsp-sharpness"
                  type="range"
                  min={0}
                  max={1.2}
                  step={0.05}
                  value={dspSharpness}
                  onChange={(e) => setDspSharpness(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--primary)]"
                />
              </div>
            )}

            {/* Dimension Summary Pill */}
            {sourceUrl && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">
                    {t('Ukuran Asli:', 'Original Size:')}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
                    {origDims.w} × {origDims.h} px
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">
                    {t('Target Hasil HD:', 'Target Output:')}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[var(--primary)]">
                    {predictedOutDims.w} × {predictedOutDims.h} px (
                    {selectedEngine.scale}×)
                  </span>
                </div>
                {workingDims.wasDownscaledForSafety && (
                  <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-muted)]">
                    {t(
                      'Input disesuaikan otomatis agar memori GPU/browser tetap stabil tanpa crash.',
                      'Input is smartly bounded so browser memory stays fast and crash-free.',
                    )}
                  </p>
                )}
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-3.5 py-2.5 text-xs leading-5 text-[var(--error)]"
              >
                {errorMsg}
              </div>
            )}

            {/* Live Progress Bar for Model Download & Overlapping Tile Rendering */}
            {isBusy && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)]">
                    <LoaderCircle size={14} className="animate-spin" />
                    {stage === 'loading-model'
                      ? t(
                          'Mengunduh Model AI ke Cache...',
                          'Caching Swin2SR Model...',
                        )
                      : t(
                          `Merender Blok AI (${tileStatus.current}/${Math.max(1, tileStatus.total)})...`,
                          `Rendering AI Tiles (${tileStatus.current}/${Math.max(1, tileStatus.total)})...`,
                        )}
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--text-muted)]">
                    {activeDevice}
                  </span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--segmented-bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-200"
                    style={{
                      width: `${Math.max(
                        5,
                        stage === 'loading-model'
                          ? modelPercent
                          : tileStatus.percent,
                      )}%`,
                    }}
                  />
                </div>

                {stage === 'loading-model' && modelBytes.total > 0 && (
                  <p className="mt-1.5 text-right font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                    {formatFileSize(modelBytes.loaded)} /{' '}
                    {formatFileSize(modelBytes.total)}
                  </p>
                )}

                {fallbackNotice && (
                  <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    {t(
                      'Beralih otomatis ke mode WASM yang kompatibel.',
                      'Automatically switched to compatible WASM execution.',
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Run / Cancel Button */}
            <div className="mt-4">
              {isBusy ? (
                <button
                  id="upscaler-cancel-btn"
                  type="button"
                  onClick={handleCancelUpscale}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--error)] transition hover:bg-[var(--error)]/10"
                >
                  <Square size={14} fill="currentColor" />
                  {t('Batalkan Proses', 'Cancel Upscaling')}
                </button>
              ) : (
                <button
                  id="upscaler-start-btn"
                  type="button"
                  disabled={!sourceUrl}
                  onClick={handleRunUpscale}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Maximize2 size={16} />
                  {resultPngUrl
                    ? t('Proses Ulang Foto', 'Re-Run Super-Resolution')
                    : t(
                        `Pertajam & Perbesar ${selectedEngine.scale}×`,
                        `Upscale & Restore ${selectedEngine.scale}×`,
                      )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: DROPZONE & BEFORE / AFTER INTERACTIVE SPLIT STAGE */}
        <section className="ios-card flex min-h-[460px] flex-col overflow-hidden lg:col-span-7">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-[var(--text-primary)]">
                {sourceName ||
                  t(
                    'Kanvas Perbandingan Before / After',
                    'Before / After Comparison Stage',
                  )}
              </h2>
              {sourceSize > 0 && (
                <p className="text-[11px] tabular-nums text-[var(--text-muted)]">
                  {formatFileSize(sourceSize)}
                  {outDims.w > 0
                    ? ` • Hasil ${outDims.w} × ${outDims.h} px`
                    : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {resultPngUrl && (
                <button
                  id="upscaler-zoom-toggle-btn"
                  type="button"
                  onClick={() => setZoom2x((z) => !z)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                    zoom2x
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  <ZoomIn size={13} />
                  {zoom2x ? '200% Zoom' : '100% Fit'}
                </button>
              )}

              {sourceUrl && (
                <button
                  id="upscaler-replace-btn"
                  type="button"
                  disabled={isBusy}
                  onClick={handleClearImage}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--error)] disabled:opacity-50"
                >
                  <X size={13} />
                  {t('Ganti', 'Clear')}
                </button>
              )}
            </div>
          </div>

          {/* Stage Body */}
          <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-5">
            {!sourceUrl ? (
              <div
                id="upscaler-dropzone"
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
                className={`flex w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <ImagePlus size={22} />
                </div>
                <p className="mt-3.5 text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Pilih atau tarik foto buram / gambar pecah ke sini',
                    'Choose or drop a blurry / low-res photo here',
                  )}
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                  {t(
                    'Cocok untuk foto kenangan resolusi kecil, kiriman gambar WhatsApp yang pecah, logo, atau ilustrasi — 100% privat di perangkat.',
                    'Great for compressed WhatsApp photos, old portraits, logos, and screenshots — processed 100% locally.',
                  )}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs">
                  <Upload size={14} />
                  {t('Pilih Foto', 'Select Photo')}
                </span>
              </div>
            ) : !resultPngUrl ? (
              <div className="flex w-full flex-col items-center">
                <div className="relative max-h-[420px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
                  <img
                    src={sourceUrl}
                    alt={sourceName}
                    className="max-h-[400px] w-auto rounded-xl object-contain"
                  />
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {t(
                    'Klik tombol "Pertajam & Perbesar" di panel kiri untuk melihat tirai perbandingan Before vs After.',
                    'Click "Upscale & Restore" on the left to generate the interactive Before vs After comparison.',
                  )}
                </p>
              </div>
            ) : (
              <div className="w-full">
                <div className="overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
                  <div
                    id="upscaler-compare-stage"
                    ref={compareBoxRef}
                    onPointerDown={handleComparePointerDown}
                    onPointerMove={handleComparePointerMove}
                    onPointerUp={handleComparePointerUp}
                    onPointerCancel={handleComparePointerUp}
                    className={`relative mx-auto cursor-ew-resize overflow-hidden rounded-xl select-none touch-none ${
                      zoom2x ? 'w-[180%]' : 'w-full max-w-xl'
                    }`}
                  >
                    {/* Base Layer: Upscaled HD Result (After) */}
                    <img
                      src={resultPngUrl}
                      alt="Upscaled HD result"
                      draggable={false}
                      className="block h-auto w-full object-contain"
                    />

                    {/* Clipped Top Layer: Original Blurry Input (Before) */}
                    <img
                      src={sourceUrl}
                      alt="Original input"
                      draggable={false}
                      style={{
                        clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                        imageRendering: 'pixelated',
                      }}
                      className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                    />

                    {/* Labels */}
                    <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t('Asli', 'Before')}
                    </span>
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      {t(`Tajam ${selectedEngine.scale}×`, `After ${selectedEngine.scale}×`)}
                    </span>

                    {/* Curtain Divider Handle */}
                    <div
                      style={{ left: `${splitPct}%` }}
                      className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-md"
                    >
                      <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#1c1c1e] shadow-md">
                        <ArrowLeftRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-center text-[11px] text-[var(--text-muted)]">
                  {t(
                    'Geser garis pembagi ke kiri/kanan untuk membandingkan ketajaman detail piksel.',
                    'Drag the split handle left or right to inspect pixel restoration.',
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Export Footer */}
          {resultPngUrl && resultJpgUrl && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                {elapsedMs !== null && (
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--success)]">
                    <Cpu size={13} />
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
                <span className="font-mono tabular-nums text-[var(--text-muted)]">
                  {outDims.w} × {outDims.h} px
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="upscaler-download-png-btn"
                  type="button"
                  onClick={() =>
                    downloadDataUrl(
                      resultPngUrl,
                      `${baseFileName}-${selectedEngine.scale}x-hd.png`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)]"
                >
                  <Download size={14} />
                  {t('Unduh PNG HD', 'Download PNG HD')}
                </button>

                <button
                  id="upscaler-download-jpg-btn"
                  type="button"
                  onClick={() =>
                    downloadDataUrl(
                      resultJpgUrl,
                      `${baseFileName}-${selectedEngine.scale}x-hd.jpg`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                >
                  <Download size={14} />
                  JPG 95%
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
