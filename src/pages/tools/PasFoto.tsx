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
  ArrowLeft,
  Check,
  Download,
  FileText,
  Grid2x2,
  IdCard,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react'

import { Link } from 'react-router'

import {
  PAS_FOTO_PRESETS,
  SHEET_PAPERS,
  canvasToBlob,
  computeSheetGrid,
  exportPrintSheetPdf,
  loadImageFromUrl,
  renderCroppedPhotoCanvas,
  renderPrintSheetCanvas,
  type SheetPaperSize,
} from '../../lib/pasFoto'

import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const BG_OPTIONS = [
  { id: 'original', label: 'Original', color: null },
  { id: 'red', label: 'Red', color: '#D32F2F' },
  { id: 'blue', label: 'Blue', color: '#1565C0' },
  { id: 'white', label: 'White', color: '#FFFFFF' },
] as const

export default function PasFoto() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)

  const [presetId, setPresetId] = useState<string>('3x4')
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(-0.15)
  const [bgOption, setBgOption] = useState<string>('original')
  const [customBg, setCustomBg] = useState('#D32F2F')

  const [exportMode, setExportMode] = useState<'single' | 'sheet'>('sheet')
  const [paperSize, setPaperSize] = useState<SheetPaperSize>('4r')
  const [cutMarks, setCutMarks] = useState(true)
  const [copiesCount, setCopiesCount] = useState<number>(8)

  const [isExporting, setIsExporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const preset = useMemo(
    () =>
      PAS_FOTO_PRESETS.find((item) => item.id === presetId) ??
      PAS_FOTO_PRESETS[1],
    [presetId],
  )

  const sheetGrid = useMemo(
    () => computeSheetGrid(paperSize, preset),
    [paperSize, preset],
  )

  const effectiveCopies = Math.min(copiesCount, sheetGrid.totalCount)

  const activeBackgroundColor = useMemo(() => {
    if (bgOption === 'custom') return customBg
    const found = BG_OPTIONS.find((item) => item.id === bgOption)
    return found?.color ?? null
  }, [bgOption, customBg])

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const previewDataUrl = useMemo(() => {
    if (!loadedImage) {
      return ''
    }

    const single = renderCroppedPhotoCanvas(loadedImage, preset, {
      zoom,
      offsetX,
      offsetY,
      backgroundColor: activeBackgroundColor,
    })

    if (exportMode === 'single') {
      return single.toDataURL('image/png')
    }

    const sheet = renderPrintSheetCanvas(single, paperSize, preset, {
      cutMarks,
      maxCopies: effectiveCopies,
    })
    return sheet.toDataURL('image/jpeg', 0.9)
  }, [
    loadedImage,
    preset,
    zoom,
    offsetX,
    offsetY,
    activeBackgroundColor,
    exportMode,
    paperSize,
    cutMarks,
    effectiveCopies,
  ])

  async function handleFile(selected: File) {
    setError('')
    setSuccess('')

    if (!SUPPORTED_TYPES.includes(selected.type)) {
      setError('Choose a JPG, PNG, or WebP photo.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Maximum photo size is 20 MB.')
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
      setOffsetY(-0.15)
    } catch {
      URL.revokeObjectURL(nextUrl)
      setError('Could not read this image file.')
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (selected) void handleFile(selected)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void handleFile(dropped)
  }

  function resetPosition() {
    setZoom(1)
    setOffsetX(0)
    setOffsetY(-0.15)
  }

  function clearAll() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setFile(null)
    setSourceUrl('')
    setLoadedImage(null)
    setError('')
    setSuccess('')
  }

  async function handleExport(format: 'jpg' | 'png' | 'pdf') {
    if (!loadedImage) return
    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const single = renderCroppedPhotoCanvas(loadedImage, preset, {
        zoom,
        offsetX,
        offsetY,
        backgroundColor: activeBackgroundColor,
      })

      const baseName = file
        ? file.name.replace(/\.[^/.]+$/, '')
        : 'pas-foto'

      if (exportMode === 'single') {
        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        const blob = await canvasToBlob(single, mime, 0.96)
        downloadBlob(blob, `${baseName}-${preset.id}.${format === 'png' ? 'png' : 'jpg'}`)
        setSuccess(`Exported single ${preset.label} photo (300 DPI).`)
        return
      }

      const sheet = renderPrintSheetCanvas(single, paperSize, preset, {
        cutMarks,
        maxCopies: effectiveCopies,
      })

      if (format === 'pdf') {
        const pdfBlob = await exportPrintSheetPdf(sheet, paperSize)
        downloadBlob(pdfBlob, `${baseName}-${preset.id}-${paperSize}.pdf`)
        setSuccess(`Exported ready-to-print ${paperSize.toUpperCase()} PDF sheet.`)
      } else {
        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        const blob = await canvasToBlob(sheet, mime, 0.96)
        downloadBlob(blob, `${baseName}-${preset.id}-${paperSize}.${format}`)
        setSuccess(`Exported ${paperSize.toUpperCase()} print sheet (${effectiveCopies} photos).`)
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Export failed.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary-text)]"
        >
          <ArrowLeft size={16} />
          All tools
        </Link>

        <div className="mt-8 max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]">
            <IdCard size={22} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Pas Foto & Print Sheet
          </h1>

          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            Crop ID photos to standard 2×3, 3×4, 4×6 cm, or visa ratios at 300 DPI and arrange them onto a ready-to-print 4R or A4 sheet.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            Processed locally in your browser
          </div>
        </div>

        <input
          id="pas-foto-file-input"
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
            className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)] hover:bg-[var(--surface-soft)]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-text)]">
              <Upload size={22} />
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              Drop a portrait photo here or click to upload
            </p>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Tip: Use <Link to="/tools/remove-background" onClick={(e) => e.stopPropagation()} className="font-medium text-[var(--primary-text)] underline">Remove Background</Link> first if you need a transparent cutout.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              JPG, PNG, or WebP • Max 20 MB
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Controls */}
            <div className="space-y-6 lg:col-span-5">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {file?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {file ? formatFileSize(file.size) : ''} • {loadedImage.naturalWidth}×{loadedImage.naturalHeight}px
                    </p>
                  </div>
                  <button
                    id="pas-foto-clear-btn"
                    type="button"
                    onClick={clearAll}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    aria-label="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Size presets */}
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Photo Size
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PAS_FOTO_PRESETS.map((item) => (
                      <button
                        key={item.id}
                        id={`pas-foto-preset-${item.id}`}
                        type="button"
                        onClick={() => setPresetId(item.id)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          preset.id === item.id
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)] hover:border-[var(--primary-border)]'
                        }`}
                      >
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {item.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framing controls */}
                <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      <ZoomIn size={13} />
                      Framing
                    </span>
                    <button
                      id="pas-foto-reset-frame"
                      type="button"
                      onClick={resetPosition}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary-text)] hover:underline"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                      <label htmlFor="pas-foto-zoom">Zoom</label>
                      <span>{zoom.toFixed(2)}×</span>
                    </div>
                    <input
                      id="pas-foto-zoom"
                      type="range"
                      min={1}
                      max={2.6}
                      step={0.02}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="mt-1 w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="pas-foto-offset-x">Horizontal</label>
                        <span>{Math.round(offsetX * 100)}%</span>
                      </div>
                      <input
                        id="pas-foto-offset-x"
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
                        <label htmlFor="pas-foto-offset-y">Vertical</label>
                        <span>{Math.round(offsetY * 100)}%</span>
                      </div>
                      <input
                        id="pas-foto-offset-y"
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
                </div>

                {/* Background fill */}
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Background Fill (for transparent PNG cutouts)
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {BG_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        id={`pas-foto-bg-${opt.id}`}
                        type="button"
                        onClick={() => setBgOption(opt.id)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                          bgOption === opt.id
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                        }`}
                      >
                        {opt.color && (
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        {opt.label}
                      </button>
                    ))}
                    <label
                      htmlFor="pas-foto-bg-custom-picker"
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        bgOption === 'custom'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <input
                        id="pas-foto-bg-custom-picker"
                        type="color"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value)
                          setBgOption('custom')
                        }}
                        className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                      />
                      Custom
                    </label>
                  </div>
                </div>

                {/* Output mode */}
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Output Layout
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      id="pas-foto-mode-sheet"
                      type="button"
                      onClick={() => setExportMode('sheet')}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        exportMode === 'sheet'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Grid2x2 size={16} />
                      Print Sheet
                    </button>
                    <button
                      id="pas-foto-mode-single"
                      type="button"
                      onClick={() => setExportMode('single')}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        exportMode === 'single'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <IdCard size={16} />
                      Single Photo
                    </button>
                  </div>

                  {exportMode === 'sheet' && (
                    <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(SHEET_PAPERS) as SheetPaperSize[]).map(
                          (key) => (
                            <button
                              key={key}
                              id={`pas-foto-paper-${key}`}
                              type="button"
                              onClick={() => setPaperSize(key)}
                              className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                                paperSize === key
                                  ? 'border-[var(--primary-border)] bg-[var(--surface)] text-[var(--primary-text)]'
                                  : 'border-transparent text-[var(--text-secondary)]'
                              }`}
                            >
                              {key.toUpperCase()} ({SHEET_PAPERS[key].widthMm / 10}×
                              {SHEET_PAPERS[key].heightMm / 10} cm)
                            </button>
                          ),
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                          <label htmlFor="pas-foto-copies">
                            Photos on sheet
                          </label>
                          <span>
                            {effectiveCopies} / {sheetGrid.totalCount} max
                          </span>
                        </div>
                        <input
                          id="pas-foto-copies"
                          type="range"
                          min={1}
                          max={sheetGrid.totalCount}
                          value={effectiveCopies}
                          onChange={(e) =>
                            setCopiesCount(Number(e.target.value))
                          }
                          className="mt-1 w-full accent-[var(--primary)]"
                        />
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                        <input
                          id="pas-foto-cut-marks"
                          type="checkbox"
                          checked={cutMarks}
                          onChange={(e) => setCutMarks(e.target.checked)}
                          className="rounded accent-[var(--primary)]"
                        />
                        Include subtle cut border lines
                      </label>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Preview & Export */}
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    {exportMode === 'sheet'
                      ? `${paperSize.toUpperCase()} Print Preview (${effectiveCopies} × ${preset.label})`
                      : `Single Preview (${preset.label} • 300 DPI)`}
                  </h2>

                  <button
                    id="pas-foto-replace-btn"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-medium text-[var(--primary-text)] hover:underline"
                  >
                    Change photo
                  </button>
                </div>

                <div className="mt-4 flex min-h-[360px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-6">
                  {previewDataUrl && (
                    <img
                      src={previewDataUrl}
                      alt="Pas foto preview"
                      className="max-h-[460px] max-w-full rounded-lg border border-[var(--border)] shadow-sm"
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    id="pas-foto-download-jpg"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('jpg')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                  >
                    <Download size={16} />
                    Download JPG
                  </button>

                  <button
                    id="pas-foto-download-png"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('png')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]"
                  >
                    <Download size={16} />
                    PNG
                  </button>

                  {exportMode === 'sheet' && (
                    <button
                      id="pas-foto-download-pdf"
                      type="button"
                      disabled={isExporting}
                      onClick={() => void handleExport('pdf')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]"
                    >
                      <FileText size={16} />
                      Print PDF
                    </button>
                  )}
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 inline-flex w-full items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
                    <Check size={16} />
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
