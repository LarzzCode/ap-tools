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
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileLock2,
  LoaderCircle,
  ScanSearch,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  buildForensicRedactedPdf,
  inspectPdfForensics,
  renderSinglePdfPageToDataUrl,
  scanPdfForSensitiveBoxes,
  type PdfForensicInspection,
  type RedactionBox,
  type RedactionExportResult,
  type RedactionFlattenMode,
  type RedactionStyle,
  type SensitivePatternKind,
} from '../../lib/pdfRedactor'
import { consumePendingSmartFile } from '../../lib/smartFileStore'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

interface DraftRect {
  startX: number
  startY: number
  currX: number
  currY: number
}

function stripPdfExt(name: string): string {
  return name.replace(/\.pdf$/i, '') || 'dokumen'
}

export default function PdfRedactor() {
  const { language, t } = useLanguage()

  // PDF file & forensic inspection state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [inspection, setInspection] = useState<PdfForensicInspection | null>(
    null,
  )
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false)
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false)

  // Redaction boxes across all pages
  const [boxes, setBoxes] = useState<RedactionBox[]>([])
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null)

  // Auto-scanner controls
  const [scanNik, setScanNik] = useState<boolean>(true)
  const [scanPhone, setScanPhone] = useState<boolean>(true)
  const [scanEmail, setScanEmail] = useState<boolean>(true)
  const [scanRupiah, setScanRupiah] = useState<boolean>(false)
  const [customKeyword, setCustomKeyword] = useState<string>('')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanFeedback, setScanFeedback] = useState<string | null>(null)

  // Forensic burn configuration
  const [style, setStyle] = useState<RedactionStyle>('blackout')
  const [flattenMode, setFlattenMode] =
    useState<RedactionFlattenMode>('full-raster')
  const [dpiScale, setDpiScale] = useState<number>(2.0)
  const [stampText, setStampText] = useState<string>(() =>
    language === 'id' ? 'RAHASIA' : 'REDACTED',
  )

  // Export & verification state
  const [isBurning, setIsBurning] = useState<boolean>(false)
  const [burnProgress, setBurnProgress] = useState<{
    current: number
    total: number
  }>({ current: 0, total: 0 })
  const [exportReport, setExportReport] =
    useState<RedactionExportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stageOverlayRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef<boolean>(false)

  const totalPages = inspection?.pageCount ?? 0

  const currentPageBoxes = useMemo(
    () => boxes.filter((b) => b.pageNumber === currentPage),
    [boxes, currentPage],
  )

  const redactedPagesSummary = useMemo(() => {
    const counts = new Map<number, number>()
    for (const b of boxes) {
      counts.set(b.pageNumber, (counts.get(b.pageNumber) ?? 0) + 1)
    }
    return counts
  }, [boxes])

  const loadPdfDocument = useCallback(
    async (file: File) => {
      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        setErrorMsg(
          t(
            'Harap pilih dokumen berformat .PDF.',
            'Please select a valid .PDF document.',
          ),
        )
        return
      }

      setErrorMsg(null)
      setScanFeedback(null)
      setExportReport(null)
      setBoxes([])
      setCurrentPage(1)
      setIsLoadingPage(true)

      try {
        const audit = await inspectPdfForensics(file)
        const firstPreview = await renderSinglePdfPageToDataUrl(file, 1, 1.65)
        setPdfFile(file)
        setInspection(audit)
        setPagePreviewUrl(firstPreview.dataUrl)
      } catch {
        setPdfFile(null)
        setInspection(null)
        setPagePreviewUrl(null)
        setErrorMsg(
          t(
            'Gagal membuka dokumen PDF. Pastikan file tidak rusak atau terkunci password.',
            'Unable to open this PDF. Make sure it is not corrupted or password-locked.',
          ),
        )
      } finally {
        setIsLoadingPage(false)
      }
    },
    [t],
  )

  // Consume smart file from Homepage dropzone
  useEffect(() => {
    const pending = consumePendingSmartFile()
    if (!pending) return
    if (
      pending.type === 'application/pdf' ||
      pending.name.toLowerCase().endsWith('.pdf')
    ) {
      const timer = window.setTimeout(() => {
        void loadPdfDocument(pending)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [loadPdfDocument])

  async function goToPage(nextPage: number) {
    if (!pdfFile || !inspection) return
    const clamped = Math.max(1, Math.min(inspection.pageCount, nextPage))
    if (clamped === currentPage && pagePreviewUrl) return

    setCurrentPage(clamped)
    setIsLoadingPage(true)
    try {
      const rendered = await renderSinglePdfPageToDataUrl(
        pdfFile,
        clamped,
        1.65,
      )
      setPagePreviewUrl(rendered.dataUrl)
    } catch {
      setErrorMsg(
        t('Gagal merender halaman PDF.', 'Failed to render PDF page.'),
      )
    } finally {
      setIsLoadingPage(false)
    }
  }

  async function handleAutoScanSensitive() {
    if (!pdfFile) return

    const kinds: Exclude<SensitivePatternKind, 'custom'>[] = []
    if (scanNik) kinds.push('nik')
    if (scanPhone) kinds.push('phone')
    if (scanEmail) kinds.push('email')
    if (scanRupiah) kinds.push('rupiah')

    if (kinds.length === 0 && customKeyword.trim().length < 2) {
      setScanFeedback(
        t(
          'Centang minimal satu kategori pola atau isi kata kunci minimal 2 huruf.',
          'Check at least one pattern category or enter a keyword (min 2 chars).',
        ),
      )
      return
    }

    setIsScanning(true)
    setScanFeedback(null)
    setExportReport(null)

    try {
      const found = await scanPdfForSensitiveBoxes(pdfFile, {
        kinds,
        customKeyword,
      })

      if (found.length === 0) {
        setScanFeedback(
          t(
            'Tidak ditemukan teks sensitif yang cocok (jika PDF hasil scan gambar, gambar kotak sensor langsung di kanvas).',
            'No matching text tokens found (for scanned image PDFs, drag directly on the page canvas to redact).',
          ),
        )
      } else {
        setBoxes((prev) => [...prev, ...found])
        setScanFeedback(
          t(
            `Berhasil menandai ${found.length} titik data sensitif secara otomatis!`,
            `Automatically marked ${found.length} sensitive text occurrences!`,
          ),
        )
        // Jump to first matched page if current page had none
        const firstHitPage = found[0].pageNumber
        if (firstHitPage !== currentPage) {
          await goToPage(firstHitPage)
        }
      }
    } catch {
      setErrorMsg(
        t(
          'Gagal memindai lapisan teks PDF.',
          'Failed to scan PDF text layer.',
        ),
      )
    } finally {
      setIsScanning(false)
    }
  }

  function getNormalizedPointerCoords(clientX: number, clientY: number) {
    const el = stageOverlayRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const x = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)),
    )
    const y = Math.max(
      0,
      Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)),
    )
    return { x, y }
  }

  function handleStagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pdfFile || isBurning || isLoadingPage) return
    // Ignore clicks on delete buttons inside existing redaction boxes
    if ((e.target as HTMLElement).closest('button')) return

    isDrawingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = getNormalizedPointerCoords(e.clientX, e.clientY)
    setDraftRect({
      startX: pt.x,
      startY: pt.y,
      currX: pt.x,
      currY: pt.y,
    })
  }

  function handleStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDrawingRef.current) return
    const pt = getNormalizedPointerCoords(e.clientX, e.clientY)
    setDraftRect((prev) =>
      prev ? { ...prev, currX: pt.x, currY: pt.y } : null,
    )
  }

  function handleStagePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (draftRect) {
      const left = Math.min(draftRect.startX, draftRect.currX)
      const top = Math.min(draftRect.startY, draftRect.currY)
      const width = Math.abs(draftRect.currX - draftRect.startX)
      const height = Math.abs(draftRect.currY - draftRect.startY)

      if (width >= 0.008 && height >= 0.006) {
        const newBox: RedactionBox = {
          id: `manual-${currentPage}-${Date.now()}`,
          pageNumber: currentPage,
          x: Number(left.toFixed(4)),
          y: Number(top.toFixed(4)),
          w: Number(width.toFixed(4)),
          h: Number(height.toFixed(4)),
          source: 'manual',
        }
        setBoxes((prev) => [...prev, newBox])
        setExportReport(null)
      }
    }

    setDraftRect(null)
  }

  function handleDeleteBox(id: string) {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
    setExportReport(null)
  }

  function handleUndoLastBox() {
    setBoxes((prev) => prev.slice(0, -1))
    setExportReport(null)
  }

  function handleClearPageBoxes() {
    setBoxes((prev) => prev.filter((b) => b.pageNumber !== currentPage))
    setExportReport(null)
  }

  async function handleBurnAndDownload() {
    if (!pdfFile) return

    setErrorMsg(null)
    setIsBurning(true)
    setBurnProgress({ current: 0, total: totalPages })

    try {
      const result = await buildForensicRedactedPdf(
        pdfFile,
        boxes,
        {
          style,
          flattenMode,
          dpiScale,
          stampText: stampText.trim() || 'REDACTED',
        },
        (curr, tot) => {
          setBurnProgress({ current: curr, total: tot })
        },
      )

      setExportReport(result)
      const outName = `${stripPdfExt(pdfFile.name)}-forensic-redacted.pdf`
      downloadBlob(result.blob, outName)
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t(
              'Gagal membakar sensor forensik ke PDF.',
              'Failed to build forensically sanitized PDF.',
            ),
      )
    } finally {
      setIsBurning(false)
    }
  }

  function handleResetDocument() {
    setPdfFile(null)
    setInspection(null)
    setPagePreviewUrl(null)
    setBoxes([])
    setExportReport(null)
    setScanFeedback(null)
    setErrorMsg(null)
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (picked) void loadPdfDocument(picked)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingFile(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) void loadPdfDocument(dropped)
  }

  const activeDraftNormalized = useMemo(() => {
    if (!draftRect) return null
    return {
      left: Math.min(draftRect.startX, draftRect.currX) * 100,
      top: Math.min(draftRect.startY, draftRect.currY) * 100,
      width: Math.abs(draftRect.currX - draftRect.startX) * 100,
      height: Math.abs(draftRect.currY - draftRect.startY) * 100,
    }
  }, [draftRect])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="pdf-redactor" />

      <input
        id="pdf-redactor-file-input"
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!pdfFile ? (
        <div
          id="pdf-redactor-dropzone"
          onDragOver={(e) => {
            e.preventDefault()
            setIsDraggingFile(true)
          }}
          onDragLeave={() => setIsDraggingFile(false)}
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
          className={`ios-card mt-6 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition ${
            isDraggingFile
              ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
              : 'border-[var(--border)] hover:border-[var(--primary-border)]'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <FileLock2 size={26} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {t(
              'Pilih atau Tarik Dokumen PDF Rahasia',
              'Choose or Drop a Confidential PDF Document',
            )}
          </h2>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
            {t(
              'Hancurkan lapisan teks di balik kotak sensor secara permanen (anti copy-paste balik) sekaligus sapu bersih metadata penulis tersembunyi — 100% di browser.',
              'Permanently destroy underlying selectable text streams beneath redacted regions and purge hidden author/XMP metadata — 100% in-browser.',
            )}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-sm">
            <Upload size={15} />
            {t('Muat Dokumen PDF', 'Load PDF Document')}
          </span>

          {errorMsg && (
            <p className="mt-4 text-xs font-semibold text-[var(--error)]">
              {errorMsg}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* LEFT COLUMN: FORENSIC AUDIT, PII SCANNER & BURN SETTINGS */}
          <section className="space-y-5 lg:col-span-5">
            {/* 1. Metadata Leak Audit Card */}
            <div className="ios-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  {t('1. Audit Kebocoran Metadata', '1. Metadata Leak Audit')}
                </h2>
                <button
                  id="pdf-redactor-replace-btn"
                  type="button"
                  disabled={isBurning}
                  onClick={handleResetDocument}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--error)]"
                >
                  <X size={13} />
                  {t('Ganti PDF', 'Replace')}
                </button>
              </div>

              <p className="mt-1 truncate text-xs font-semibold text-[var(--primary)]">
                {pdfFile.name} ({formatFileSize(pdfFile.size)} • {totalPages}{' '}
                {t('hlm', 'pages')})
              </p>

              {inspection && inspection.metadataEntries.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--warning)]">
                    <AlertTriangle size={14} />
                    {t(
                      `${inspection.metadataEntries.length} Metadata Tersembunyi Terdeteksi (Akan Dihapus)`,
                      `${inspection.metadataEntries.length} Hidden Metadata Fields Found (Will Be Purged)`,
                    )}
                  </p>
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[11px] text-[var(--text-secondary)]">
                    {inspection.metadataEntries.map((entry) => (
                      <li key={entry.key} className="truncate">
                        <strong className="text-[var(--text-primary)]">
                          {entry.key}:
                        </strong>{' '}
                        {entry.value}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-secondary)]">
                  <ShieldCheck size={15} className="text-[var(--success)]" />
                  {t(
                    'Kontainer baru tetap akan disterilkan dari XMP & riwayat revisi.',
                    'Output container will be freshly rebuilt with sterile metadata.',
                  )}
                </div>
              )}
            </div>

            {/* 2. Smart Auto-Detect Sensitive Text */}
            <div className="ios-card p-4 sm:p-5">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t(
                  '2. Deteksi Otomatis Data Sensitif',
                  '2. Auto-Detect Sensitive Text',
                )}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                {t(
                  'Pindai seluruh halaman sekaligus untuk memblokir pola identitas atau kata rahasia.',
                  'Scan all pages to automatically box PII patterns or secret names.',
                )}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 font-medium text-[var(--text-primary)]">
                  <input
                    id="pdf-scan-nik"
                    type="checkbox"
                    checked={scanNik}
                    onChange={(e) => setScanNik(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  NIK (16 Digit)
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 font-medium text-[var(--text-primary)]">
                  <input
                    id="pdf-scan-phone"
                    type="checkbox"
                    checked={scanPhone}
                    onChange={(e) => setScanPhone(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  {t('No. HP / WA', 'ID Phone')}
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 font-medium text-[var(--text-primary)]">
                  <input
                    id="pdf-scan-email"
                    type="checkbox"
                    checked={scanEmail}
                    onChange={(e) => setScanEmail(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  Email
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 font-medium text-[var(--text-primary)]">
                  <input
                    id="pdf-scan-rupiah"
                    type="checkbox"
                    checked={scanRupiah}
                    onChange={(e) => setScanRupiah(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  Nominal Rp
                </label>
              </div>

              <div className="mt-3">
                <input
                  id="pdf-scan-custom-keyword"
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder={t(
                    'Kata rahasia opsional (misal: nama klien / no. rekening)...',
                    'Optional secret phrase (e.g., client name / account #)...',
                  )}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                />
              </div>

              <button
                id="pdf-scan-run-btn"
                type="button"
                disabled={isScanning || isBurning}
                onClick={() => void handleAutoScanSensitive()}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-2.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90 disabled:opacity-50"
              >
                {isScanning ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <ScanSearch size={15} />
                )}
                {t(
                  'Pindai & Tandai Seluruh Halaman',
                  'Scan & Mark Across All Pages',
                )}
              </button>

              {scanFeedback && (
                <p className="mt-2 text-[11px] leading-4 font-medium text-[var(--text-secondary)]">
                  {scanFeedback}
                </p>
              )}
            </div>

            {/* 3. Forensic Destruction Settings & Execute */}
            <div className="ios-card p-4 sm:p-5">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t(
                  '3. Gaya Sensor & Pembakaran Piksel',
                  '3. Redaction Style & Pixel Burn',
                )}
              </h2>

              <div className="mt-3">
                <span className="block text-xs font-semibold text-[var(--text-secondary)]">
                  {t('Tampilan Kotak Sensor', 'Redaction Appearance')}
                </span>
                <div className="ios-segmented mt-1.5 grid grid-cols-3 gap-1">
                  {(
                    [
                      ['blackout', t('Hitam Pekat', 'Solid Black')],
                      ['classified', t('Stempel Teks', 'Stamped')],
                      ['whiteout', t('Putih Kertas', 'Whiteout')],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      id={`pdf-style-${val}`}
                      type="button"
                      onClick={() => setStyle(val)}
                      className={`rounded-full py-1.5 text-xs font-bold transition ${
                        style === val
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {style === 'classified' && (
                <div className="mt-3">
                  <label
                    htmlFor="pdf-stamp-text-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Teks Stempel Sensor', 'Stamp Label')}
                  </label>
                  <input
                    id="pdf-stamp-text-input"
                    type="text"
                    maxLength={24}
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 font-mono text-xs font-bold uppercase text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}

              <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pdf-flatten-mode-select"
                    className="block text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Mode Keamanan', 'Destruction Mode')}
                  </label>
                  <select
                    id="pdf-flatten-mode-select"
                    value={flattenMode}
                    onChange={(e) =>
                      setFlattenMode(e.target.value as RedactionFlattenMode)
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="full-raster">
                      {t('Kunci Semua Halaman (Maks)', 'Full Raster Lock (Max)')}
                    </option>
                    <option value="hybrid-selective">
                      {t('Hibrida (Hlm Tersensor)', 'Hybrid (Redacted Pages)')}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pdf-dpi-select"
                    className="block text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Ketajaman Cetak', 'Raster Resolution')}
                  </label>
                  <select
                    id="pdf-dpi-select"
                    value={dpiScale}
                    onChange={(e) => setDpiScale(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value={1.6}>
                      {t('Ringkas (120 DPI)', 'Compact (120 DPI)')}
                    </option>
                    <option value={2.0}>
                      {t('Tajam Standar (150 DPI)', 'Crisp Standard (150 DPI)')}
                    </option>
                    <option value={2.5}>
                      {t('Cetak HD (200 DPI)', 'Print HD (200 DPI)')}
                    </option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-3.5 py-2.5 text-xs text-[var(--error)]"
                >
                  {errorMsg}
                </div>
              )}

              {exportReport && (
                <div className="mt-4 rounded-2xl border border-[var(--success)]/35 bg-[var(--success)]/10 p-3.5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--success)]">
                    <CheckCircle2 size={15} />
                    {t(
                      'Verifikasi Forensik Lulus & Terunduh!',
                      'Forensic Sanitization Verified & Downloaded!',
                    )}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
                    {exportReport.verifiedZeroSelectableCharsOnRedactedPages
                      ? t(
                          `Terbukti 0 karakter teks tersisa di balik ${exportReport.redactedPageCount} halaman tersensor • ${exportReport.metadataClearedCount} metadata dihapus.`,
                          `Verified 0 selectable text tokens remain on ${exportReport.redactedPageCount} redacted page(s) • ${exportReport.metadataClearedCount} metadata fields wiped.`,
                        )
                      : t(
                          'Dokumen telah dibersihkan dan disimpan.',
                          'Document sanitized and exported.',
                        )}
                  </p>
                </div>
              )}

              <button
                id="pdf-redactor-export-btn"
                type="button"
                disabled={isBurning}
                onClick={() => void handleBurnAndDownload()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isBurning ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    {t(
                      `Membakar Halaman ${burnProgress.current}/${burnProgress.total}...`,
                      `Sanitizing Page ${burnProgress.current}/${burnProgress.total}...`,
                    )}
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    {t(
                      `Bakar Permanen & Unduh PDF (${boxes.length} Sensor)`,
                      `Burn Permanently & Download PDF (${boxes.length} Redactions)`,
                    )}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN: INTERACTIVE PDF CANVAS REDACTION STAGE */}
          <section className="ios-card flex flex-col overflow-hidden lg:col-span-7">
            {/* Top Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-1.5">
                <button
                  id="pdf-prev-page-btn"
                  type="button"
                  disabled={currentPage <= 1 || isLoadingPage || isBurning}
                  onClick={() => void goToPage(currentPage - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-primary)] transition hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-2 font-mono text-xs font-bold tabular-nums text-[var(--text-primary)]">
                  {t('Halaman', 'Page')} {currentPage} / {totalPages}
                </span>

                <button
                  id="pdf-next-page-btn"
                  type="button"
                  disabled={
                    currentPage >= totalPages || isLoadingPage || isBurning
                  }
                  onClick={() => void goToPage(currentPage + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-primary)] transition hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="pdf-undo-box-btn"
                  type="button"
                  disabled={boxes.length === 0 || isBurning}
                  onClick={handleUndoLastBox}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--primary)] disabled:opacity-40"
                >
                  <Undo2 size={13} />
                  Undo
                </button>

                <button
                  id="pdf-clear-page-boxes-btn"
                  type="button"
                  disabled={currentPageBoxes.length === 0 || isBurning}
                  onClick={handleClearPageBoxes}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--error)] disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  {t('Bersihkan Hlm', 'Clear Page')}
                </button>
              </div>
            </div>

            {/* Quick Page Jump Strip when multi-page */}
            {totalPages > 1 && (
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pNum) => {
                    const count = redactedPagesSummary.get(pNum) ?? 0
                    const isCurr = pNum === currentPage
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => void goToPage(pNum)}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold transition ${
                          isCurr
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--primary)]'
                        }`}
                      >
                        #{pNum}
                        {count > 0 && (
                          <span
                            className={`rounded-full px-1 text-[9px] ${
                              isCurr
                                ? 'bg-white/25 text-white'
                                : 'bg-[var(--error)]/15 text-[var(--error)]'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  },
                )}
              </div>
            )}

            {/* Drag-to-Redact Page Canvas Viewport */}
            <div className="flex flex-1 flex-col items-center justify-center bg-[var(--surface-soft)]/50 p-4 sm:p-5">
              <p className="mb-2.5 text-center text-[11px] font-medium text-[var(--text-secondary)]">
                {t(
                  'Tarik kursor atau jari di atas teks, tanda tangan, atau angka pada halaman untuk menggambar kotak sensor.',
                  'Drag across any text, signature, or figure on the page below to draw a permanent redaction block.',
                )}
              </p>

              {isLoadingPage || !pagePreviewUrl ? (
                <div className="flex h-96 w-full items-center justify-center">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-[var(--primary)]"
                  />
                </div>
              ) : (
                <div className="max-w-full overflow-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
                  <div
                    id="pdf-redactor-canvas-stage"
                    ref={stageOverlayRef}
                    onPointerDown={handleStagePointerDown}
                    onPointerMove={handleStagePointerMove}
                    onPointerUp={handleStagePointerUp}
                    onPointerCancel={handleStagePointerUp}
                    className="relative mx-auto cursor-crosshair select-none touch-none"
                  >
                    <img
                      src={pagePreviewUrl}
                      alt={`PDF Page ${currentPage}`}
                      draggable={false}
                      className="block max-h-[640px] w-auto object-contain"
                    />

                    {/* Existing Redaction Boxes on Current Page */}
                    {currentPageBoxes.map((box) => (
                      <div
                        key={box.id}
                        style={{
                          left: `${box.x * 100}%`,
                          top: `${box.y * 100}%`,
                          width: `${box.w * 100}%`,
                          height: `${box.h * 100}%`,
                        }}
                        className={`group absolute flex items-center justify-center ${
                          style === 'whiteout'
                            ? 'border border-dashed border-[var(--error)] bg-white'
                            : 'bg-black text-white'
                        }`}
                      >
                        {style === 'classified' && (
                          <span className="pointer-events-none truncate px-1 font-mono text-[9px] font-bold tracking-wider text-white">
                            {stampText || 'REDACTED'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            handleDeleteBox(box.id)
                          }}
                          title={t('Hapus sensor ini', 'Remove this redaction')}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--error)] text-white opacity-90 shadow-xs transition hover:scale-110"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                    {/* Live Rubber-Band Selection Box while dragging */}
                    {activeDraftNormalized && (
                      <div
                        style={{
                          left: `${activeDraftNormalized.left}%`,
                          top: `${activeDraftNormalized.top}%`,
                          width: `${activeDraftNormalized.width}%`,
                          height: `${activeDraftNormalized.height}%`,
                        }}
                        className="pointer-events-none absolute border-2 border-[var(--error)] bg-black/55"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
