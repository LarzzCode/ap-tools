import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Download,
  FileDown,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  compressPdfDocument,
  type PdfCompressResult,
  type PdfCompressionLevel,
} from '../../lib/pdfCompressor'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

export default function PdfCompressor() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<PdfCompressionLevel>('balanced')
  const [result, setResult] = useState<PdfCompressResult | null>(null)
  const [progressText, setProgressText] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState('')

  function handleSelectPdf(selected: File) {
    setError('')
    setResult(null)

    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
      setError(
        t('Pilih dokumen berformat PDF.', 'Please select a valid PDF document.'),
      )
      return
    }

    setFile(selected)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) handleSelectPdf(selected)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) handleSelectPdf(dropped)
  }

  async function handleCompress() {
    if (!file) return
    setIsCompressing(true)
    setError('')
    setResult(null)

    try {
      const compressed = await compressPdfDocument(
        file,
        level,
        (currentPage, totalPages) => {
          setProgressText(
            t(
              `Mengompres halaman ${currentPage} dari ${totalPages}...`,
              `Compressing page ${currentPage} of ${totalPages}...`,
            ),
          )
        },
      )
      setResult(compressed)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('Gagal mengompres file PDF.', 'Failed to compress PDF file.'),
      )
    } finally {
      setIsCompressing(false)
      setProgressText('')
    }
  }

  function handleDownload() {
    if (!result || !file) return
    const stem = file.name.replace(/\.pdf$/i, '')
    downloadBlob(result.blob, `${stem}-compressed.pdf`)
  }

  const savedPercent =
    result && result.originalSize > 0
      ? Math.max(
          0,
          Math.round(
            ((result.originalSize - result.compressedSize) /
              result.originalSize) *
              100,
          ),
        )
      : 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="pdf-compressor" />

        <input
          id="pdf-compressor-file-input"
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

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
                'Pilih atau tarik dokumen PDF yang ingin diperkecil ukurannya',
                'Drop a PDF file here or click to compress',
              )}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {t(
                'Cocok untuk berkas scan ijazah, KTP, sertifikat, & lampiran lamaran kerja',
                'Ideal for scanned certificates, IDs, transcripts, & job application attachments',
              )}
            </p>
          </div>
        ) : (
          <section className="ios-card mt-8 p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t('Ukuran Asli:', 'Original Size:')} {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setResult(null)
                  setError('')
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--error)]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Compression Levels */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t('Tingkat Kompresi PDF', 'Compression Mode')}
              </label>

              <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    [
                      'balanced',
                      t('Seimbang (Direkomendasikan)', 'Balanced (Recommended)'),
                      t(
                        'Kecilkan PDF scan secara signifikan dengan teks tetap tajam (~140 DPI).',
                        'Shrink scanned PDFs significantly while keeping text sharp (~140 DPI).',
                      ),
                    ],
                    [
                      'compact',
                      t('Ekstra Kecil (Maksimal)', 'Maximum Compression'),
                      t(
                        'Ukuran paling ringan untuk portal upload ketat (< 300–500 KB).',
                        'Smallest file size for strict upload portals (< 300–500 KB).',
                      ),
                    ],
                    [
                      'structure',
                      t('Optimasi Struktur & Metadata', 'Lossless Structure & Metadata'),
                      t(
                        'Pertahankan teks vektor asli & bersihkan metadata/objek sampah.',
                        'Preserve selectable vector text while stripping metadata & unused objects.',
                      ),
                    ],
                  ] as const
                ).map(([id, title, desc]) => (
                  <button
                    key={id}
                    id={`pdf-compress-level-${id}`}
                    type="button"
                    onClick={() => {
                      setLevel(id)
                      setResult(null)
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      level === id
                        ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="text-xs font-bold">{title}</div>
                    <div className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="pdf-compress-run-btn"
              type="button"
              disabled={isCompressing}
              onClick={() => void handleCompress()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {isCompressing ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              {isCompressing
                ? progressText || t('Sedang Mengompres...', 'Compressing...')
                : t('Kompres PDF Sekarang', 'Compress PDF Now')}
            </button>

            {error && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-[var(--error)]">
                {error}
              </p>
            )}

            {result && (
              <div className="space-y-4 rounded-2xl border border-green-500/25 bg-green-500/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--success)]">
                    <Check size={17} />
                    {t('Kompresi PDF Selesai!', 'PDF Compression Complete!')}
                  </div>

                  {savedPercent > 0 && (
                    <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-[var(--success)]">
                      {t(`Hemat ${savedPercent}%`, `Saved ${savedPercent}%`)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {t('Ukuran Sebelum', 'Before')}
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
                      {formatFileSize(result.originalSize)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {t('Ukuran Sesudah', 'After')}
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-[var(--primary)]">
                      {formatFileSize(result.compressedSize)}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:col-span-1">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {t('Jumlah Halaman', 'Pages')}
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
                      {result.pageCount} {t('Halaman', 'Pages')}
                    </p>
                  </div>
                </div>

                <button
                  id="pdf-compress-download-btn"
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
                >
                  <Download size={16} />
                  {t('Unduh PDF Hasil Kompresi', 'Download Compressed PDF')}
                </button>
              </div>
            )}
          </section>
        )}
      </motion.div>
    </main>
  )
}
