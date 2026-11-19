import {
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
  Film,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react'

import { Link } from 'react-router'

import LocalServiceStatus from '../../components/tools/LocalServiceStatus'
import { useLocalService } from '../../hooks/useLocalService'
import {
  convertLocalMedia,
  getLocalDownloadUrl,
  type LocalConvertFormat,
  type LocalConvertPreset,
} from '../../lib/localService'
import { formatFileSize } from '../../utils/file'

const OUTPUT_FORMATS: Array<{
  id: LocalConvertFormat
  label: string
  hint: string
}> = [
  { id: 'mp4', label: 'MP4 Video', hint: 'H.264 + AAC' },
  { id: 'webm', label: 'WebM Video', hint: 'VP9 + Opus' },
  { id: 'mp3', label: 'MP3 Audio', hint: 'Extract / convert' },
  { id: 'm4a', label: 'M4A Audio', hint: 'AAC audio' },
  { id: 'wav', label: 'WAV Audio', hint: 'Uncompressed' },
  { id: 'gif', label: 'GIF Clip', hint: 'Animated loop' },
]

const PRESETS: Array<{
  id: LocalConvertPreset
  label: string
  desc: string
}> = [
  { id: 'original', label: 'High Quality', desc: 'Minimal compression' },
  { id: 'balanced', label: 'Balanced', desc: 'Good size & clarity' },
  { id: 'compact', label: 'Compact', desc: 'Smaller for chat/upload' },
]

export default function MediaConverter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, health, checkConnection } = useLocalService()

  const [file, setFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<LocalConvertFormat>('mp4')
  const [preset, setPreset] = useState<LocalConvertPreset>('balanced')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const ffmpegReady = health?.capabilities?.ffmpeg !== false
  const isVideoFormat = outputFormat === 'mp4' || outputFormat === 'webm'

  function handleFile(selected: File) {
    setError('')
    setSuccess('')
    if (
      !selected.type.startsWith('video/') &&
      !selected.type.startsWith('audio/')
    ) {
      setError('Select a video or audio file.')
      return
    }
    setFile(selected)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) handleFile(selected)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) handleFile(dropped)
  }

  async function handleConvert() {
    if (!file) return
    if (status !== 'connected') {
      setError('Start Ditya Tools Local Service first.')
      return
    }

    setIsConverting(true)
    setError('')
    setSuccess('')

    try {
      const prepared = await convertLocalMedia({
        file,
        outputFormat,
        preset,
        startTime,
        endTime,
      })

      const downloadUrl = getLocalDownloadUrl(prepared.download_url)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = prepared.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(`Converted and saved: ${prepared.filename}`)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to convert media file.',
      )
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
            <Film size={22} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Local Media Clipper & Converter
          </h1>

          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            Trim, compress, convert, or extract audio from video/audio files using FFmpeg via your Local Service — without uploading large files online.
          </p>
        </div>

        <div className="mt-8">
          <LocalServiceStatus
            status={status}
            health={health}
            onRetry={checkConnection}
          />
        </div>

        {status === 'connected' && !ffmpegReady && (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Local service is connected, but <strong>FFmpeg</strong> was not detected on your PATH. Install FFmpeg to use media conversion.
          </p>
        )}

        <input
          id="media-converter-file-input"
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          onChange={handleInputChange}
          className="hidden"
        />

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          {!file ? (
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
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
                isDragging
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-text)]">
                <Upload size={22} />
              </div>
              <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                Drop a video or audio file here, or click to select
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                MP4, MKV, MOV, WebM, MP3, WAV, M4A
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  id="media-converter-clear-file"
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setError('')
                    setSuccess('')
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-500"
                  aria-label="Remove media file"
                >
                  <X size={15} />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Output Format
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {OUTPUT_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      id={`media-format-${fmt.id}`}
                      type="button"
                      onClick={() => setOutputFormat(fmt.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        outputFormat === fmt.id
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="text-sm font-semibold">{fmt.label}</div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {fmt.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isVideoFormat && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Compression Preset
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {PRESETS.map((item) => (
                      <button
                        key={item.id}
                        id={`media-preset-${item.id}`}
                        type="button"
                        onClick={() => setPreset(item.id)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          preset === item.id
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="media-trim-start"
                    className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                  >
                    Optional Trim Start (MM:SS or seconds)
                  </label>
                  <input
                    id="media-trim-start"
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 00:15"
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="media-trim-end"
                    className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                  >
                    Optional Trim End (MM:SS or seconds)
                  </label>
                  <input
                    id="media-trim-end"
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 01:05"
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                  />
                </div>
              </div>

              <button
                id="media-convert-btn"
                type="button"
                disabled={isConverting || status !== 'connected' || !ffmpegReady}
                onClick={() => void handleConvert()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isConverting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isConverting ? 'Converting via Local Service...' : 'Convert & Save'}
              </button>
            </div>
          )}

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
        </section>
      </motion.div>
    </main>
  )
}
