import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FileText,
  Hash,
  LoaderCircle,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import { useLanguage } from '../../hooks/useLanguage'
import {
  exportOrganizedPdf,
  inspectPdfPages,
  type OrganizedPageItem,
  type PageNumberFormat,
  type PageNumberPosition,
} from '../../lib/pdfOrganizer'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

export default function PdfOrganizer() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<OrganizedPageItem[]>([])
  const [addPageNumbers, setAddPageNumbers] = useState(false)
  const [numberPosition, setNumberPosition] =
    useState<PageNumberPosition>('bottom-center')
  const [numberFormat, setNumberFormat] =
    useState<PageNumberFormat>('id-of-total')
  const [startNumber, setStartNumber] = useState(1)

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePdfFile(selected: File) {
    setError('')
    setSuccess('')

    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
      setError(
        t('Pilih dokumen berformat PDF.', 'Please select a valid PDF document.'),
      )
      return
    }

    try {
      const inspected = await inspectPdfPages(selected)
      setFile(selected)
      setPages(inspected)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('Gagal membaca file PDF.', 'Unable to read PDF file.'),
      )
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) void handlePdfFile(selected)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void handlePdfFile(dropped)
  }

  function rotatePage(id: string, delta: number) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === id
          ? {
              ...page,
              rotationDelta: (page.rotationDelta + delta + 360) % 360,
            }
          : page,
      ),
    )
    setSuccess('')
  }

  function rotateAll(delta: number) {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        rotationDelta: (page.rotationDelta + delta + 360) % 360,
      })),
    )
    setSuccess('')
  }

  function toggleExcludePage(id: string) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === id ? { ...page, excluded: !page.excluded } : page,
      ),
    )
    setSuccess('')
  }

  function movePage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= pages.length) return
    setPages((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })
    setSuccess('')
  }

  function restoreAllPages() {
    setPages((prev) =>
      prev.map((p) => ({ ...p, excluded: false, rotationDelta: 0 })),
    )
    setSuccess('')
  }

  async function handleExport() {
    if (!file) return
    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const outBlob = await exportOrganizedPdf(file, {
        pages,
        addPageNumbers,
        numberPosition,
        numberFormat,
        startNumber,
      })
      const stem = file.name.replace(/\.pdf$/i, '')
      downloadBlob(outBlob, `${stem}-organized.pdf`)
      setSuccess(
        t(
          'Dokumen PDF yang telah dirapikan berhasil diunduh.',
          'Organized PDF document downloaded.',
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('Gagal mengekspor PDF.', 'Failed to export PDF.'),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const keptCount = pages.filter((p) => !p.excluded).length

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="pdf-organizer" />

        <input
          id="pdf-organizer-file-input"
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
                'Pilih atau tarik dokumen PDF ke sini',
                'Drop a PDF document here or click to select',
              )}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {t(
                'Putar halaman, ubah urutan, hapus halaman, & beri nomor halaman',
                'Rotate pages, reorder sequence, remove pages, & add page numbers',
              )}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* Page Grid List */}
            <div className="space-y-4 lg:col-span-8">
              <div className="ios-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatFileSize(file.size)} • {keptCount} / {pages.length}{' '}
                      {t('halaman aktif', 'active pages')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="pdf-org-rotate-all-cw"
                      type="button"
                      onClick={() => rotateAll(90)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-border)]"
                    >
                      <RotateCw size={13} />
                      {t('Putar Semua +90°', 'Rotate All +90°')}
                    </button>

                    <button
                      id="pdf-org-restore-all"
                      type="button"
                      onClick={restoreAllPages}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)]"
                    >
                      <Undo2 size={13} />
                      {t('Reset', 'Reset')}
                    </button>

                    <button
                      id="pdf-org-clear-file"
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPages([])
                        setError('')
                        setSuccess('')
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--error)]"
                      aria-label="Remove PDF"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Pages List */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                        page.excluded
                          ? 'border-dashed border-red-500/30 bg-red-500/5 opacity-60'
                          : 'border-[var(--border)] bg-[var(--surface-soft)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--primary-border)] bg-[var(--surface)] text-xs font-bold text-[var(--primary)] shadow-2xs transition-transform"
                          style={{
                            transform: `rotate(${page.rotationDelta}deg)`,
                          }}
                        >
                          <FileText size={16} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {t(`Halaman Asli #${page.pageNumber}`, `Original Page #${page.pageNumber}`)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {page.excluded
                              ? t('Dihapus dari output', 'Excluded from output')
                              : `${t('Urutan', 'Order')} #${index + 1}${
                                  page.rotationDelta
                                    ? ` • Putar ${page.rotationDelta}°`
                                    : ''
                                }`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => movePage(index, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] disabled:opacity-30"
                          title={t('Geser naik', 'Move earlier')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === pages.length - 1}
                          onClick={() => movePage(index, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] disabled:opacity-30"
                          title={t('Geser turun', 'Move later')}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotatePage(page.id, -90)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                          title="-90°"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotatePage(page.id, 90)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                          title="+90°"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExcludePage(page.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                            page.excluded
                              ? 'border-red-500/40 bg-red-500/15 text-[var(--error)]'
                              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--error)]'
                          }`}
                          title={
                            page.excluded
                              ? t('Kembalikan halaman', 'Restore page')
                              : t('Hapus halaman', 'Remove page')
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Numbering & Export Options */}
            <div className="space-y-4 lg:col-span-4">
              <section className="ios-card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <Hash size={16} className="text-[var(--primary)]" />
                    {t('Penomoran Halaman', 'Page Numbering')}
                  </span>

                  <input
                    id="pdf-org-toggle-numbers"
                    type="checkbox"
                    checked={addPageNumbers}
                    onChange={(e) => setAddPageNumbers(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--primary)]"
                  />
                </div>

                {addPageNumbers && (
                  <div className="space-y-4 border-t border-[var(--border)] pt-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {t('Format Nomor', 'Number Format')}
                      </label>
                      <div className="mt-2 grid grid-cols-1 gap-1.5">
                        {(
                          [
                            ['id-of-total', 'Halaman 1 dari N'],
                            ['en-of-total', 'Page 1 of N'],
                            ['simple', '1, 2, 3...'],
                          ] as const
                        ).map(([fmt, label]) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setNumberFormat(fmt)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              numberFormat === fmt
                                ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {t('Posisi Nomor', 'Position')}
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {(
                          [
                            ['bottom-center', t('Bawah Tengah', 'Bottom Center')],
                            ['bottom-right', t('Bawah Kanan', 'Bottom Right')],
                            ['top-right', t('Atas Kanan', 'Top Right')],
                          ] as const
                        ).map(([pos, label]) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setNumberPosition(pos)}
                            className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition ${
                              numberPosition === pos
                                ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="pdf-org-start-num"
                        className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                      >
                        {t('Mulai dari Nomor', 'Start Number')}
                      </label>
                      <input
                        id="pdf-org-start-num"
                        type="number"
                        min={1}
                        max={9999}
                        value={startNumber}
                        onChange={(e) =>
                          setStartNumber(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  id="pdf-org-export-btn"
                  type="button"
                  disabled={isProcessing || keptCount === 0}
                  onClick={() => void handleExport()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {t(
                    `Simpan & Unduh PDF (${keptCount} Hal)`,
                    `Save & Download PDF (${keptCount} Pages)`,
                  )}
                </button>

                {error && (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-[var(--error)]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                    <Check size={15} />
                    {success}
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  )
}
