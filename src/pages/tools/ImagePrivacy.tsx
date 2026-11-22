import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import { motion } from 'motion/react'

import {
  Check,
  Download,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import {
  inspectImageMetadata,
  stripImageMetadataAndConvert,
  type MetadataReport,
  type PrivacyOutputFormat,
} from '../../lib/exifStripper'

import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const FORMAT_LABELS: Record<PrivacyOutputFormat, { label: string; ext: string }> = {
  'image/jpeg': { label: 'JPG', ext: 'jpg' },
  'image/png': { label: 'PNG', ext: 'png' },
  'image/webp': { label: 'WebP', ext: 'webp' },
}

export default function ImagePrivacy() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [report, setReport] = useState<MetadataReport | null>(null)

  const [outputFormat, setOutputFormat] =
    useState<PrivacyOutputFormat>('image/jpeg')
  const [quality, setQuality] = useState(90)
  const [maxWidth, setMaxWidth] = useState<string>('')

  const [cleanBlob, setCleanBlob] = useState<Blob | null>(null)
  const [cleanDimensions, setCleanDimensions] = useState<{
    width: number
    height: number
  } | null>(null)

  const [isInspecting, setIsInspecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFile(selected: File) {
    setError('')
    setCleanBlob(null)
    setCleanDimensions(null)

    if (!SUPPORTED_TYPES.includes(selected.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Maximum file size is 25 MB.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const nextUrl = URL.createObjectURL(selected)

    setIsInspecting(true)
    try {
      const metadata = await inspectImageMetadata(selected)
      setFile(selected)
      setPreviewUrl(nextUrl)
      setReport(metadata)

      if (
        selected.type === 'image/png' ||
        selected.type === 'image/webp' ||
        selected.type === 'image/jpeg'
      ) {
        setOutputFormat(selected.type)
      }
    } catch (caught) {
      URL.revokeObjectURL(nextUrl)
      setError(
        caught instanceof Error ? caught.message : 'Unable to inspect image.',
      )
    } finally {
      setIsInspecting(false)
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

  async function handleStripAndExport() {
    if (!file) return
    setIsProcessing(true)
    setError('')

    try {
      const parsedWidth = maxWidth.trim() ? Number(maxWidth.trim()) : null
      if (parsedWidth !== null && (!Number.isFinite(parsedWidth) || parsedWidth < 16)) {
        throw new Error('Max width must be at least 16 pixels.')
      }

      const result = await stripImageMetadataAndConvert(file, {
        outputFormat,
        quality: quality / 100,
        maxWidth: parsedWidth,
      })

      setCleanBlob(result.blob)
      setCleanDimensions({ width: result.width, height: result.height })
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to clean image.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDownload() {
    if (!cleanBlob || !file) return
    const stem = file.name.replace(/\.[^/.]+$/, '')
    const ext = FORMAT_LABELS[outputFormat].ext
    downloadBlob(cleanBlob, `${stem}-clean.${ext}`)
  }

  function resetAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl('')
    setReport(null)
    setCleanBlob(null)
    setCleanDimensions(null)
    setError('')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="image-privacy" />

        <input
          id="image-privacy-file-input"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {!file || !report ? (
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
              {isInspecting ? (
                <LoaderCircle size={22} className="animate-spin" />
              ) : (
                <Upload size={22} />
              )}
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              Drop an image here or click to inspect metadata
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              JPG, PNG, or WebP • Max 25 MB
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Metadata & Options */}
            <div className="space-y-6 lg:col-span-6">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatFileSize(file.size)} • {report.width}×{report.height}px
                    </p>
                  </div>
                  <button
                    id="image-privacy-clear-btn"
                    type="button"
                    onClick={resetAll}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Metadata inspection report */}
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    report.markers.length > 0
                      ? 'border-amber-500/25 bg-amber-500/5'
                      : 'border-green-500/25 bg-green-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {report.markers.length > 0 ? (
                      <ShieldAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                    ) : (
                      <ShieldCheck
                        size={18}
                        className="mt-0.5 shrink-0 text-green-500"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {report.markers.length > 0
                          ? `${report.markers.length} metadata segment(s) detected`
                          : 'No EXIF / XMP / PNG text metadata headers detected'}
                      </p>
                      {report.markers.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                          {report.markers.map((marker) => (
                            <li key={marker}>• {marker}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          You can still re-encode, resize, or convert formats below.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="mt-5 space-y-4 border-t border-[var(--border)] pt-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Output Format
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(Object.keys(FORMAT_LABELS) as PrivacyOutputFormat[]).map(
                        (fmt) => (
                          <button
                            key={fmt}
                            id={`image-privacy-format-${FORMAT_LABELS[fmt].ext}`}
                            type="button"
                            onClick={() => {
                              setOutputFormat(fmt)
                              setCleanBlob(null)
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              outputFormat === fmt
                                ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                                : 'border-[var(--border)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {FORMAT_LABELS[fmt].label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {outputFormat !== 'image/png' && (
                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="image-privacy-quality">Quality</label>
                        <span>{quality}%</span>
                      </div>
                      <input
                        id="image-privacy-quality"
                        type="range"
                        min={40}
                        max={100}
                        value={quality}
                        onChange={(e) => {
                          setQuality(Number(e.target.value))
                          setCleanBlob(null)
                        }}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="image-privacy-max-width"
                      className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                    >
                      Optional Max Width (px)
                    </label>
                    <input
                      id="image-privacy-max-width"
                      type="number"
                      min={16}
                      max={10000}
                      value={maxWidth}
                      onChange={(e) => {
                        setMaxWidth(e.target.value)
                        setCleanBlob(null)
                      }}
                      placeholder={`Keep original (${report.width}px)`}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                    />
                  </div>

                  <button
                    id="image-privacy-process-btn"
                    type="button"
                    disabled={isProcessing}
                    onClick={() => void handleStripAndExport()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                  >
                    {isProcessing && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}
                    Strip Metadata & Convert
                  </button>
                </div>
              </section>
            </div>

            {/* Preview & Result */}
            <div className="space-y-4 lg:col-span-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Preview
                </h2>

                <div className="mt-4 flex min-h-[280px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="max-h-72 max-w-full rounded-lg object-contain"
                  />
                </div>

                {cleanBlob && cleanDimensions && (
                  <div className="mt-5 space-y-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                      <Check size={16} />
                      Clean file ready (all EXIF & metadata stripped)
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Output: {cleanDimensions.width}×{cleanDimensions.height}px •{' '}
                      {formatFileSize(cleanBlob.size)} (was{' '}
                      {formatFileSize(file.size)})
                    </p>

                    <button
                      id="image-privacy-download-btn"
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)]"
                    >
                      <Download size={16} />
                      Download Clean {FORMAT_LABELS[outputFormat].label}
                    </button>
                  </div>
                )}

                {error && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {error}
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
