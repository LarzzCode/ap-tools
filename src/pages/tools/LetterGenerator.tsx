import {
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Download,
  Eraser,
  LoaderCircle,
  RefreshCcw,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  buildLetterBodyTemplate,
  generateOfficialLetterPdf,
  type OfficialLetterKind,
} from '../../lib/letterGenerator'
import { downloadBlob } from '../../utils/download'

export default function LetterGenerator() {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

  const todayFormatted = useMemo(() => {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]
    const now = new Date()
    return `Jakarta, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  }, [])

  const [kind, setKind] = useState<OfficialLetterKind>('lamaran')
  const [cityAndDate, setCityAndDate] = useState(todayFormatted)
  const [subject, setSubject] = useState('Lamaran Pekerjaan — Staff Administrasi')
  const [recipientName, setRecipientName] = useState('HRD Manager')
  const recipientTitle = ''
  const [recipientCompany, setRecipientCompany] = useState('PT Maju Jaya Abadi')

  const [senderName, setSenderName] = useState('Budi Santoso')
  const [senderRoleOrInfo, setSenderRoleOrInfo] = useState(
    'S1 Manajemen, berpengalaman 1 tahun di bidang administrasi perkantoran',
  )
  const [senderContact, setSenderContact] = useState('0812-3456-7890')
  const [targetPositionOrReason, setTargetPositionOrReason] =
    useState('Staff Administrasi')
  const [attachmentsList, setAttachmentsList] = useState(
    '1. Curriculum Vitae (CV)\n2. Scan Ijazah & Transkrip Nilai\n3. Scan KTP & Pas Foto\n4. Sertifikat Pendukung',
  )

  const [customBody, setCustomBody] = useState<string | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState('')

  const generatedTemplateBody = useMemo(
    () =>
      buildLetterBodyTemplate({
        kind,
        cityAndDate,
        subject,
        recipientName,
        recipientTitle,
        recipientCompany,
        senderName,
        senderRoleOrInfo,
        senderContact,
        targetPositionOrReason,
        attachmentsList,
      }),
    [
      kind,
      cityAndDate,
      subject,
      recipientName,
      recipientTitle,
      recipientCompany,
      senderName,
      senderRoleOrInfo,
      senderContact,
      targetPositionOrReason,
      attachmentsList,
    ],
  )

  const activeBodyText = customBody ?? generatedTemplateBody

  function switchKind(nextKind: OfficialLetterKind) {
    setKind(nextKind)
    setCustomBody(null)
    if (nextKind === 'lamaran') {
      setSubject('Lamaran Pekerjaan')
      setTargetPositionOrReason('Staff Administrasi')
    } else if (nextKind === 'resign') {
      setSubject('Permohonan Pengunduran Diri')
      setTargetPositionOrReason('31 Desember 2026')
    } else if (nextKind === 'izin') {
      setSubject('Permohonan Izin Tidak Masuk Kerja / Kuliah')
      setTargetPositionOrReason('kondisi kesehatan yang membutuhkan istirahat')
    } else {
      setSubject('Surat Pernyataan')
      setTargetPositionOrReason(
        'seluruh dokumen dan informasi yang saya sampaikan adalah benar serta dapat dipertanggungjawabkan',
      )
    }
  }

  function getCanvasCoords(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    canvas.setPointerCapture(event.pointerId)
    const { x, y } = getCanvasCoords(event)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 3.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
    setHasSignature(true)
  }

  function drawMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasCoords(event)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDrawing() {
    isDrawingRef.current = false
  }

  function clearSignature() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleExportPdf() {
    setIsExporting(true)
    setSuccess('')

    try {
      let sigBytes: ArrayBuffer | null = null
      if (hasSignature && canvasRef.current) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current?.toBlob((b) => resolve(b), 'image/png'),
        )
        if (blob) {
          sigBytes = await blob.arrayBuffer()
        }
      }

      const pdfBlob = await generateOfficialLetterPdf({
        kind,
        cityAndDate,
        subject,
        recipientName,
        recipientTitle,
        recipientCompany,
        senderName,
        senderContact,
        bodyText: activeBodyText,
        signaturePngBytes: sigBytes,
      })

      const safeSender =
        senderName.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'Surat'
      downloadBlob(pdfBlob, `Surat-${kind}-${safeSender}.pdf`)
      setSuccess(
        t(
          'Dokumen Surat Resmi PDF berhasil diunduh.',
          'Official Letter PDF downloaded.',
        ),
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
        <ToolPageHeader toolId="letter-generator" />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Form Controls */}
          <div className="space-y-5 lg:col-span-6">
            <section className="ios-card p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('Pilih Jenis Surat Resmi', 'Select Letter Template')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      ['lamaran', t('Surat Lamaran Kerja', 'Job Application')],
                      ['resign', t('Surat Resign Kerja', 'Resignation Letter')],
                      ['izin', t('Surat Izin Kerja/Kuliah', 'Leave / Sick Note')],
                      ['pernyataan', t('Surat Pernyataan', 'Declaration Letter')],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      id={`letter-kind-${id}`}
                      type="button"
                      onClick={() => switchKind(id)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        kind === id
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('Kota & Tanggal Surat', 'City & Date')}
                  </label>
                  <input
                    type="text"
                    value={cityAndDate}
                    onChange={(e) => {
                      setCityAndDate(e.target.value)
                      setCustomBody(null)
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('Perihal Surat', 'Subject')}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {kind !== 'pernyataan' && (
                <div className="grid gap-3 border-t border-[var(--border)] pt-3.5 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Tujuan (Yth.)', 'Recipient Name / Role')}
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value)
                        setCustomBody(null)
                      }}
                      placeholder="HRD Manager"
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Perusahaan / Instansi Tujuan', 'Company / Institution')}
                    </label>
                    <input
                      type="text"
                      value={recipientCompany}
                      onChange={(e) => {
                        setRecipientCompany(e.target.value)
                        setCustomBody(null)
                      }}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 border-t border-[var(--border)] pt-3.5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('Nama Lengkap Anda', 'Your Full Name')}
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => {
                      setSenderName(e.target.value)
                      setCustomBody(null)
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('Kontak (No HP / Email)', 'Phone / Email')}
                  </label>
                  <input
                    type="text"
                    value={senderContact}
                    onChange={(e) => {
                      setSenderContact(e.target.value)
                      setCustomBody(null)
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t(
                    'Latar Belakang / Jabatan Anda Saat Ini',
                    'Your Background / Current Role',
                  )}
                </label>
                <input
                  type="text"
                  value={senderRoleOrInfo}
                  onChange={(e) => {
                    setSenderRoleOrInfo(e.target.value)
                    setCustomBody(null)
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  {kind === 'lamaran'
                    ? t('Posisi yang Dilamar', 'Target Position')
                    : kind === 'resign'
                      ? t('Tanggal Efektif Terakhir Bekerja', 'Effective Last Working Date')
                      : kind === 'izin'
                        ? t('Alasan Izin / Sakit', 'Reason for Leave')
                        : t('Isi Pernyataan', 'Declaration Statement')}
                </label>
                <input
                  type="text"
                  value={targetPositionOrReason}
                  onChange={(e) => {
                    setTargetPositionOrReason(e.target.value)
                    setCustomBody(null)
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              {kind === 'lamaran' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('Daftar Lampiran Berkas', 'Attached Documents List')}
                  </label>
                  <textarea
                    rows={3}
                    value={attachmentsList}
                    onChange={(e) => {
                      setAttachmentsList(e.target.value)
                      setCustomBody(null)
                    }}
                    className="mt-1 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              )}

              {/* Optional Signature Pad */}
              <div className="border-t border-[var(--border)] pt-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t(
                      'Tanda Tangan Digital (Opsional)',
                      'Digital Signature (Optional)',
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    <Eraser size={12} />
                    {t('Bersihkan', 'Clear')}
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={460}
                  height={130}
                  onPointerDown={startDrawing}
                  onPointerMove={drawMove}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  className="w-full touch-none rounded-xl border border-[var(--border)] bg-white"
                />
              </div>
            </section>
          </div>

          {/* Editable Full Letter Body & PDF Export */}
          <div className="lg:col-span-6">
            <div className="ios-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Isi Surat (Bisa Diedit Langsung)',
                    'Letter Body (Freely Editable)',
                  )}
                </h2>
                {customBody !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomBody(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <RefreshCcw size={12} />
                    {t('Reset ke Template', 'Reset to Template')}
                  </button>
                )}
              </div>

              <textarea
                rows={16}
                value={activeBodyText}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 font-serif text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary)] sm:text-sm"
              />

              <button
                id="letter-download-pdf-btn"
                type="button"
                disabled={isExporting}
                onClick={() => void handleExportPdf()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isExporting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {t('Unduh Surat Resmi (PDF A4)', 'Download Official Letter (A4 PDF)')}
              </button>

              {success && (
                <p className="inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                  <Check size={15} />
                  {success}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
