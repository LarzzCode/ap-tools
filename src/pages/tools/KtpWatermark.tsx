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
  Download,
  EyeOff,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import { useLanguage } from '../../hooks/useLanguage'
import {
  loadKtpImage,
  renderWatermarkedKtpCanvas,
  type RedactionBox,
  type WatermarkPattern,
} from '../../lib/ktpWatermark'
import { canvasToBlob } from '../../lib/pasFoto'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const COLOR_PRESETS = [
  { labelId: 'Merah', labelEn: 'Red', hex: '#e11d48' },
  { labelId: 'Biru iOS', labelEn: 'iOS Blue', hex: '#007aff' },
  { labelId: 'Hitam', labelEn: 'Black', hex: '#0f172a' },
  { labelId: 'Putih', labelEn: 'White', hex: '#ffffff' },
]

export default function KtpWatermark() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const todayFormatted = useMemo(() => {
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }, [])

  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)

  const [watermarkText, setWatermarkText] = useState(
    'HANYA UNTUK VERIFIKASI BANK',
  )
  const [includeDate, setIncludeDate] = useState(true)
  const [dateString, setDateString] = useState(todayFormatted)
  const [pattern, setPattern] = useState<WatermarkPattern>('tiled')
  const [colorHex, setColorHex] = useState('#e11d48')
  const [opacity, setOpacity] = useState(0.32)
  const [fontSizeScale, setFontSizeScale] = useState(1)
  const [angleDegrees, setAngleDegrees] = useState(-24)

  const [redactions, setRedactions] = useState<RedactionBox[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const previewDataUrl = useMemo(() => {
    if (!loadedImage) return ''
    const canvas = renderWatermarkedKtpCanvas(loadedImage, {
      text: watermarkText,
      includeDate,
      dateString,
      pattern,
      colorHex,
      opacity,
      fontSizeScale,
      angleDegrees,
      redactions,
    })
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [
    loadedImage,
    watermarkText,
    includeDate,
    dateString,
    pattern,
    colorHex,
    opacity,
    fontSizeScale,
    angleDegrees,
    redactions,
  ])

  async function handleFile(selected: File) {
    setError('')
    setSuccess('')

    if (!SUPPORTED_TYPES.includes(selected.type)) {
      setError(
        t(
          'Pilih foto berformat JPG, PNG, atau WebP.',
          'Please select a JPG, PNG, or WebP image.',
        ),
      )
      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(
        t('Ukuran file maksimal adalah 20 MB.', 'Maximum file size is 20 MB.'),
      )
      return
    }

    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    const nextUrl = URL.createObjectURL(selected)

    try {
      const img = await loadKtpImage(nextUrl)
      setFile(selected)
      setSourceUrl(nextUrl)
      setLoadedImage(img)
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

  function addRedactionPreset(preset: 'nik' | 'signature') {
    const newBox: RedactionBox =
      preset === 'nik'
        ? {
            id: crypto.randomUUID(),
            label: t('Sensor NIK / Nomor', 'Redact ID Number'),
            xPercent: 26,
            yPercent: 18,
            widthPercent: 48,
            heightPercent: 8,
            mode: 'pixelate',
          }
        : {
            id: crypto.randomUUID(),
            label: t('Sensor Tanda Tangan', 'Redact Signature'),
            xPercent: 72,
            yPercent: 72,
            widthPercent: 20,
            heightPercent: 15,
            mode: 'pixelate',
          }
    setRedactions((prev) => [...prev, newBox])
  }

  function updateRedaction(
    id: string,
    patch: Partial<Omit<RedactionBox, 'id'>>,
  ) {
    setRedactions((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...patch } : box)),
    )
  }

  function removeRedaction(id: string) {
    setRedactions((prev) => prev.filter((box) => box.id !== id))
  }

  function clearAll() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setFile(null)
    setSourceUrl('')
    setLoadedImage(null)
    setRedactions([])
    setError('')
    setSuccess('')
  }

  async function handleExport(format: 'jpg' | 'png') {
    if (!loadedImage) return
    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const canvas = renderWatermarkedKtpCanvas(loadedImage, {
        text: watermarkText,
        includeDate,
        dateString,
        pattern,
        colorHex,
        opacity,
        fontSizeScale,
        angleDegrees,
        redactions,
      })

      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvas, mime, 0.95)
      const stem = file ? file.name.replace(/\.[^/.]+$/, '') : 'ktp'
      downloadBlob(blob, `${stem}-watermarked.${format}`)
      setSuccess(
        t(
          'Dokumen ber-watermark berhasil diunduh ke perangkat Anda.',
          'Watermarked ID document downloaded to your device.',
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
        <ToolPageHeader toolId="ktp-watermark" />

        <input
          id="ktp-watermark-file-input"
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
                'Pilih atau tarik foto KTP / dokumen identitas ke sini',
                'Drop your ID card photo here or click to select',
              )}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              JPG, PNG, WebP • Maks 20 MB •{' '}
              {t('Diproses offline di perangkat Anda', 'Processed offline on your device')}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* Controls */}
            <div className="space-y-5 lg:col-span-5">
              <section className="ios-card p-5 space-y-5">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
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
                    id="ktp-clear-btn"
                    type="button"
                    onClick={clearAll}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--error)]"
                    aria-label={t('Hapus foto', 'Remove image')}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Text & Quick Presets */}
                <div>
                  <label
                    htmlFor="ktp-watermark-text"
                    className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    {t('Teks Tujuan Verifikasi', 'Verification Purpose Text')}
                  </label>
                  <input
                    id="ktp-watermark-text"
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="VERIFIKASI BANK BCA"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      'HANYA UNTUK VERIFIKASI BANK',
                      'LAMARAN KERJA',
                      'VERIFIKASI PAJAK / NPWP',
                      'SEWA MENYEWA',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWatermarkText(preset)}
                        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Stamp */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <input
                      id="ktp-include-date"
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="rounded accent-[var(--primary)]"
                    />
                    {t('Sertakan Tanggal', 'Include Date')}
                  </label>

                  {includeDate && (
                    <input
                      id="ktp-date-input"
                      type="text"
                      value={dateString}
                      onChange={(e) => setDateString(e.target.value)}
                      className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-center text-xs font-semibold text-[var(--text-primary)] outline-none"
                    />
                  )}
                </div>

                {/* Pattern */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Pola Watermark', 'Watermark Pattern')}
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ['tiled', t('Menyilang Penuh', 'Tiled Grid')],
                        ['diagonal-banner', t('Pita Tengah', 'Banner')],
                        ['center-stamp', t('Stempel Kotak', 'Stamp Box')],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        id={`ktp-pattern-${id}`}
                        type="button"
                        onClick={() => setPattern(id)}
                        className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                          pattern === id
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color & Sliders */}
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {t('Warna Teks', 'Text Color')}
                    </span>
                    <div className="flex items-center gap-2">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColorHex(c.hex)}
                          className={`h-6 w-6 rounded-full border-2 transition ${
                            colorHex === c.hex
                              ? 'scale-110 border-[var(--primary)]'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          aria-label={c.labelId}
                        />
                      ))}
                      <input
                        id="ktp-custom-color"
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="ktp-opacity">
                          {t('Transparansi', 'Opacity')}
                        </label>
                        <span>{Math.round(opacity * 100)}%</span>
                      </div>
                      <input
                        id="ktp-opacity"
                        type="range"
                        min={0.12}
                        max={0.85}
                        step={0.02}
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="ktp-size">
                          {t('Ukuran', 'Size')}
                        </label>
                        <span>{fontSizeScale.toFixed(1)}×</span>
                      </div>
                      <input
                        id="ktp-size"
                        type="range"
                        min={0.6}
                        max={1.8}
                        step={0.1}
                        value={fontSizeScale}
                        onChange={(e) => setFontSizeScale(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="ktp-angle">
                          {t('Sudut', 'Angle')}
                        </label>
                        <span>{angleDegrees}°</span>
                      </div>
                      <input
                        id="ktp-angle"
                        type="range"
                        min={-45}
                        max={45}
                        value={angleDegrees}
                        onChange={(e) => setAngleDegrees(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Redaction / Blur Zones */}
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <EyeOff size={13} />
                      {t('Sensor Area Sensitif (NIK / TTD)', 'Redact Sensitive Areas')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      id="ktp-add-redact-nik"
                      type="button"
                      onClick={() => addRedactionPreset('nik')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-border)]"
                    >
                      <Plus size={13} />
                      {t('Sensor NIK', 'Blur ID Number')}
                    </button>
                    <button
                      id="ktp-add-redact-sig"
                      type="button"
                      onClick={() => addRedactionPreset('signature')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-border)]"
                    >
                      <Plus size={13} />
                      {t('Sensor Tanda Tangan', 'Blur Signature')}
                    </button>
                  </div>

                  {redactions.map((box) => (
                    <div
                      key={box.id}
                      className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)]">
                          {box.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={box.mode}
                            onChange={(e) =>
                              updateRedaction(box.id, {
                                mode: e.target.value as 'pixelate' | 'solid',
                              })
                            }
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px]"
                          >
                            <option value="pixelate">
                              {t('Mozaik Blur', 'Pixelate')}
                            </option>
                            <option value="solid">
                              {t('Blok Hitam', 'Solid Block')}
                            </option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeRedaction(box.id)}
                            className="text-[var(--text-muted)] hover:text-[var(--error)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Posisi X ({box.xPercent}%)
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={box.xPercent}
                            onChange={(e) =>
                              updateRedaction(box.id, {
                                xPercent: Number(e.target.value),
                              })
                            }
                            className="w-full accent-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Posisi Y ({box.yPercent}%)
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={box.yPercent}
                            onChange={(e) =>
                              updateRedaction(box.id, {
                                yPercent: Number(e.target.value),
                              })
                            }
                            className="w-full accent-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Lebar ({box.widthPercent}%)
                          </span>
                          <input
                            type="range"
                            min={5}
                            max={80}
                            value={box.widthPercent}
                            onChange={(e) =>
                              updateRedaction(box.id, {
                                widthPercent: Number(e.target.value),
                              })
                            }
                            className="w-full accent-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Tinggi ({box.heightPercent}%)
                          </span>
                          <input
                            type="range"
                            min={3}
                            max={40}
                            value={box.heightPercent}
                            onChange={(e) =>
                              updateRedaction(box.id, {
                                heightPercent: Number(e.target.value),
                              })
                            }
                            className="w-full accent-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Live Preview & Export */}
            <div className="lg:col-span-7">
              <div className="ios-card p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {t('Pratinjau Dokumen Terlindungi', 'Protected Document Preview')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    {t('Ganti Foto', 'Change Photo')}
                  </button>
                </div>

                <div className="mt-4 flex min-h-[340px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  {previewDataUrl && (
                    <img
                      src={previewDataUrl}
                      alt="Watermarked ID card preview"
                      className="max-h-[440px] max-w-full rounded-xl object-contain shadow-sm"
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    id="ktp-download-jpg"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('jpg')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  >
                    <Download size={16} />
                    {t('Unduh JPG Terlindungi', 'Download Protected JPG')}
                  </button>

                  <button
                    id="ktp-download-png"
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
                  <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-[var(--error)]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-sm text-[var(--success)]">
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
