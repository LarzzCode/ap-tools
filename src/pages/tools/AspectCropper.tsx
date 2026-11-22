import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Crop,
  Download,
  Maximize2,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  ASPECT_PRESETS,
  renderAspectCropCanvas,
  type FitMode,
} from '../../lib/aspectCropper'
import { canvasToBlob, loadImageFromUrl } from '../../lib/pasFoto'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 25 * 1024 * 1024

export default function AspectCropper() {
  const { language, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)

  const [presetId, setPresetId] = useState('ig-portrait')
  const [fitMode, setFitMode] = useState<FitMode>('cover')
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [backgroundColor, setBackgroundColor] = useState('#0f172a')

  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const preset = useMemo(
    () =>
      ASPECT_PRESETS.find((item) => item.id === presetId) ?? ASPECT_PRESETS[0],
    [presetId],
  )

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const previewDataUrl = useMemo(() => {
    if (!loadedImage) return ''
    const canvas = renderAspectCropCanvas(loadedImage, {
      preset,
      fitMode,
      zoom,
      offsetX,
      offsetY,
      backgroundColor,
    })
    return canvas.toDataURL('image/jpeg', 0.9)
  }, [loadedImage, preset, fitMode, zoom, offsetX, offsetY, backgroundColor])

  async function handleFile(selected: File) {
    setError('')
    setSuccess('')

    if (!SUPPORTED_TYPES.includes(selected.type)) {
      setError(
        t(
          'Pilih gambar berformat JPG, PNG, atau WebP.',
          'Please select a JPG, PNG, or WebP image.',
        ),
      )
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError(
        t('Ukuran file maksimal 25 MB.', 'Maximum file size is 25 MB.'),
      )
      return
    }

    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    const nextUrl = URL.createObjectURL(selected)

    try {
      const img = await loadImageFromUrl(nextUrl)
      setFile(selected)
      setSourceUrl(nextUrl)
      setLoadedImage(img)
      setZoom(1)
      setOffsetX(0)
      setOffsetY(0)
    } catch {
      URL.revokeObjectURL(nextUrl)
      setError(
        t('Gagal membaca file gambar ini.', 'Unable to read this image file.'),
      )
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) void handleFile(selected)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void handleFile(dropped)
  }

  function clearAll() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setFile(null)
    setSourceUrl('')
    setLoadedImage(null)
    setError('')
    setSuccess('')
  }

  async function handleExport(format: 'jpg' | 'png') {
    if (!loadedImage) return
    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const canvas = renderAspectCropCanvas(loadedImage, {
        preset,
        fitMode,
        zoom,
        offsetX,
        offsetY,
        backgroundColor,
      })
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvas, mime, 0.94)
      const stem = file ? file.name.replace(/\.[^/.]+$/, '') : 'cropped'
      downloadBlob(blob, `${stem}-${preset.id}.${format}`)
      setSuccess(
        t(
          `Foto ${preset.targetWidth}×${preset.targetHeight}px berhasil diunduh.`,
          `Cropped ${preset.targetWidth}×${preset.targetHeight}px image downloaded.`,
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Gagal mengekspor gambar.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="aspect-cropper" />

        <input
          id="aspect-cropper-file-input"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {!loadedImage ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            className={`ios-card mt-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'hover:border-[var(--primary-border)]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Upload size={22} />
            </div>
            <p className="mt-4 text-base font-bold text-[var(--text-primary)]">
              {t(
                'Pilih atau tarik foto ke sini untuk dipotong',
                'Drop a photo here or click to crop',
              )}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {t(
                'Rasio IG Feed 4:5, Story/Reels 9:16, 1:1, Thumbnail YouTube 16:9, & Banner',
                'IG Feed 4:5, Story/Reels 9:16, Square 1:1, YouTube 16:9, & Header Banner',
              )}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* Controls */}
            <div className="space-y-5 lg:col-span-5">
              <section className="ios-card p-5 space-y-5">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {file?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {file ? formatFileSize(file.size) : ''} •{' '}
                      {loadedImage.naturalWidth}×{loadedImage.naturalHeight}px
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--error)]"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Aspect Presets */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Pilih Rasio Ukuran', 'Select Aspect Ratio')}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ASPECT_PRESETS.map((item) => (
                      <button
                        key={item.id}
                        id={`aspect-preset-${item.id}`}
                        type="button"
                        onClick={() => setPresetId(item.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          preset.id === item.id
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {language === 'id' ? item.labelId : item.labelEn}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {language === 'id' ? item.hintId : item.hintEn}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fit Mode */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Mode Pemotongan', 'Framing Mode')}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFitMode('cover')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        fitMode === 'cover'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Crop size={14} />
                      {t('Penuhi Bingkai (Crop)', 'Fill Frame (Crop)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitMode('contain')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        fitMode === 'contain'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Maximize2 size={14} />
                      {t('Muat Utuh (Fit)', 'Fit Whole Photo')}
                    </button>
                  </div>
                </div>

                {/* Zoom & Pan */}
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {t('Posisi & Zoom', 'Position & Zoom')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1)
                        setOffsetX(0)
                        setOffsetY(0)
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                      <label htmlFor="aspect-zoom">Zoom</label>
                      <span>{zoom.toFixed(2)}×</span>
                    </div>
                    <input
                      id="aspect-zoom"
                      type="range"
                      min={1}
                      max={2.8}
                      step={0.02}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="mt-1 w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="aspect-pan-x">
                          {t('Geser Kiri/Kanan', 'Horizontal')}
                        </label>
                        <span>{Math.round(offsetX * 100)}%</span>
                      </div>
                      <input
                        id="aspect-pan-x"
                        type="range"
                        min={-1}
                        max={1}
                        step={0.02}
                        value={offsetX}
                        onChange={(e) => setOffsetX(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="aspect-pan-y">
                          {t('Geser Atas/Bawah', 'Vertical')}
                        </label>
                        <span>{Math.round(offsetY * 100)}%</span>
                      </div>
                      <input
                        id="aspect-pan-y"
                        type="range"
                        min={-1}
                        max={1}
                        step={0.02}
                        value={offsetY}
                        onChange={(e) => setOffsetY(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>
                  </div>

                  {fitMode === 'contain' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">
                        {t('Warna Latar Bingkai', 'Frame Background Color')}
                      </span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-7 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Preview & Export */}
            <div className="lg:col-span-7">
              <div className="ios-card p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {t('Pratinjau Hasil', 'Output Preview')} ({preset.targetWidth}×
                    {preset.targetHeight}px)
                  </h2>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    {t('Ganti Foto', 'Change Photo')}
                  </button>
                </div>

                <div className="mt-4 flex min-h-[340px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  {previewDataUrl && (
                    <img
                      src={previewDataUrl}
                      alt="Aspect crop preview"
                      className="max-h-[440px] max-w-full rounded-xl object-contain shadow-sm"
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    id="aspect-download-jpg"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('jpg')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  >
                    <Download size={16} />
                    {t('Unduh JPG', 'Download JPG')}
                  </button>

                  <button
                    id="aspect-download-png"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('png')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
                  >
                    <Download size={16} />
                    PNG
                  </button>
                </div>

                {error && (
                  <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-[var(--error)]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                    <Check size={15} />
                    {success}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  )
}
