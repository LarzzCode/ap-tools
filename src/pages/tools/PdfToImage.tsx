import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Download,
  FileImage,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  convertPdfToImages,
  inspectPdfPageCount,
  type PdfImageFormat,
  type PdfImageScale,
  type RenderedPdfPage,
} from '../../lib/pdfToImage'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const SCALE_OPTIONS: Array<{
  id: PdfImageScale
  labelId: string
  labelEn: string
  descId: string
  descEn: string
}> = [
  {
    id: 'standard',
    labelId: 'Standar (Cepat)',
    labelEn: 'Standard (Fast)',
    descId: 'Cocok untuk kirim cepat ke chat WhatsApp',
    descEn: 'Best for quick sharing in WhatsApp chats',
  },
  {
    id: 'hd',
    labelId: 'HD Tajam (Direkomendasikan)',
    labelEn: 'HD Crisp (Recommended)',
    descId: 'Teks dokumen sangat jelas untuk upload portal',
    descEn: 'Razor-sharp document text for portal uploads',
  },
  {
    id: 'ultra',
    labelId: 'Ultra HD (Cetak / Zoom)',
    labelEn: 'Ultra HD (Print / Detail)',
    descId: 'Resolusi ekstra tinggi untuk sertifikat & desain',
    descEn: 'Maximum resolution for certificates & fine print',
  },
]

export default function PdfToImage() {
  const { language, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [format, setFormat] = useState<PdfImageFormat>('jpeg')
  const [scale, setScale] = useState<PdfImageScale>('hd')
  const [pageRange, setPageRange] = useState('')
  const [pages, setPages] = useState<RenderedPdfPage[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState('')

  async function handleSelectPdf(selected: File) {
    setError('')
    setPages([])

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

    try {
      const count = await inspectPdfPageCount(selected)
      setTotalPages(count)
    } catch {
      setTotalPages(0)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) {
      void handleSelectPdf(selected)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) {
      void handleSelectPdf(dropped)
    }
  }

  async function handleConvert() {
    if (!file) return
    setIsConverting(true)
    setError('')
    setPages([])

    try {
      const rendered = await convertPdfToImages(
        file,
        {
          format,
          scale,
          pageRange,
        },
        (current, total) => {
          setProgressText(
            t(
              `Merender halaman ${current} dari ${total}...`,
              `Rendering page ${current} of ${total}...`,
            ),
          )
        },
      )
      setPages(rendered)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              'Gagal mengubah halaman PDF menjadi gambar.',
              'Failed to convert PDF pages to images.',
            ),
      )
    } finally {
      setIsConverting(false)
      setProgressText('')
    }
  }

  function handleDownloadAll() {
    pages.forEach((page, idx) => {
      window.setTimeout(() => {
        downloadBlob(page.blob, page.fileName)
      }, idx * 180)
    })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="pdf-to-image" />

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Controls Panel */}
          <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
            <input
              id="pdf-to-image-input"
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleInputChange}
              className="hidden"
            />

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
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition ${
                isDragging
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
              }`}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Upload size={20} />
              </div>

              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                {file
                  ? t('Ganti Dokumen PDF', 'Replace PDF Document')
                  : t('Pilih atau Tarik File PDF', 'Select or Drop PDF File')}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {t(
                  'Ubah halaman PDF menjadi gambar JPG, PNG, atau WebP',
                  'Export PDF pages into crisp JPG, PNG, or WebP images',
                )}
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {formatFileSize(file.size)}
                    {totalPages > 0
                      ? ` • ${totalPages} ${t('halaman', 'pages')}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setTotalPages(0)
                    setPages([])
                  }}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                  aria-label="Remove PDF"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Image Format Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t('Format Gambar', 'Image Format')}
              </label>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['jpeg', 'JPG'],
                    ['png', 'PNG'],
                    ['webp', 'WebP'],
                  ] as const
                ).map(([fmt, label]) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      format === fmt
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Scale */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t('Kualitas & Ketajaman', 'Resolution Quality')}
              </label>
              <div className="mt-2 space-y-2">
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setScale(opt.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      scale === opt.id
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        scale === opt.id
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {language === 'id' ? opt.labelId : opt.labelEn}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {language === 'id' ? opt.descId : opt.descEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Page Range */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="pdf-to-image-range"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {t('Halaman yang Diambil', 'Pages to Convert')}
                </label>
                {pageRange && (
                  <button
                    type="button"
                    onClick={() => setPageRange('')}
                    className="text-[11px] font-semibold text-[var(--primary)] hover:underline"
                  >
                    {t('Semua Halaman', 'All Pages')}
                  </button>
                )}
              </div>
              <input
                id="pdf-to-image-range"
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder={t(
                  'Kosongkan = Semua, atau ketik: 1, 3-5',
                  'Leave empty for All, or type: 1, 3-5',
                )}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <button
              id="pdf-to-image-convert-btn"
              type="button"
              disabled={!file || isConverting}
              onClick={handleConvert}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isConverting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  {progressText || t('Memproses...', 'Converting...')}
                </>
              ) : (
                <>
                  <FileImage size={17} />
                  {t('Ubah PDF ke Gambar', 'Convert PDF to Images')}
                </>
              )}
            </button>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--error)]">
                {error}
              </p>
            )}
          </section>

          {/* Output Gallery */}
          <section className="ios-card flex min-h-[420px] flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Hasil Gambar Halaman PDF', 'Converted PDF Pages')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {pages.length > 0
                    ? t(
                        `${pages.length} halaman berhasil diubah ke ${format.toUpperCase()}`,
                        `${pages.length} pages converted to ${format.toUpperCase()}`,
                      )
                    : t(
                        'Unggah PDF lalu klik tombol konversi untuk melihat hasil gambar tiap halaman.',
                        'Upload a PDF and click convert to preview and download each page as an image.',
                      )}
                </p>
              </div>

              {pages.length > 1 && (
                <button
                  id="pdf-to-image-download-all-btn"
                  type="button"
                  onClick={handleDownloadAll}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                >
                  <Download size={14} />
                  {t(
                    `Unduh Semua (${pages.length} Gambar)`,
                    `Download All (${pages.length} Images)`,
                  )}
                </button>
              )}
            </div>

            <div className="mt-5 flex-1">
              {pages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pages.map((page) => (
                    <div
                      key={page.pageNumber}
                      className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                            <CheckCircle2 size={12} />
                            {t(
                              `Halaman ${page.pageNumber}`,
                              `Page ${page.pageNumber}`,
                            )}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {page.width}×{page.height}px •{' '}
                            {formatFileSize(page.sizeBytes)}
                          </span>
                        </div>

                        <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2">
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          downloadBlob(page.blob, page.fileName)
                        }
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 py-2.5 text-xs font-bold text-[var(--primary)] shadow-2xs transition hover:bg-[var(--primary)] hover:text-white"
                      >
                        <Download size={14} />
                        {t(
                          `Unduh Halaman ${page.pageNumber} (.${format === 'jpeg' ? 'jpg' : format})`,
                          `Download Page ${page.pageNumber} (.${format === 'jpeg' ? 'jpg' : format})`,
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <FileImage size={26} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                    {t(
                      'Belum ada halaman PDF yang dirender',
                      'No PDF pages rendered yet',
                    )}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
                    {t(
                      'Setiap halaman dokumen PDF Anda akan diubah menjadi gambar tajam langsung di dalam browser tanpa upload ke server.',
                      'Every page of your PDF document is rendered into a high-resolution image locally inside your browser.',
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  )
}
