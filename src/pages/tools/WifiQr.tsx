import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Download,
  FileText,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import { useLanguage } from '../../hooks/useLanguage'
import { canvasToBlob } from '../../lib/pasFoto'
import {
  exportWifiCardPdf,
  renderWifiCardCanvas,
  type WifiCardTheme,
  type WifiEncryption,
} from '../../lib/wifiQr'
import { downloadBlob } from '../../utils/download'

const THEMES: Array<{
  id: WifiCardTheme
  labelId: string
  labelEn: string
}> = [
  { id: 'ios-light', labelId: 'iOS Terang', labelEn: 'iOS Light' },
  { id: 'ios-dark', labelId: 'iOS Gelap', labelEn: 'iOS Dark' },
  { id: 'ocean-blue', labelId: 'Biru Cupertino', labelEn: 'Cupertino Blue' },
  { id: 'warm-cafe', labelId: 'Kafe Hangat', labelEn: 'Warm Cafe' },
]

export default function WifiQr() {
  const { t } = useLanguage()

  const [ssid, setSsid] = useState('Wi-Fi Rumah')
  const [password, setPassword] = useState('')
  const [encryption, setEncryption] = useState<WifiEncryption>('WPA')
  const [hidden, setHidden] = useState(false)
  const [showPasswordOnCard, setShowPasswordOnCard] = useState(true)
  const [title, setTitle] = useState('Akses Wi-Fi')
  const [subtitle, setSubtitle] = useState(
    'Scan kode QR dengan kamera HP untuk tersambung otomatis',
  )
  const [theme, setTheme] = useState<WifiCardTheme>('ios-light')

  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    renderWifiCardCanvas({
      ssid,
      password,
      encryption,
      hidden,
      showPasswordOnCard,
      title,
      subtitle,
      theme,
    })
      .then((canvas) => {
        if (!cancelled) {
          setPreviewDataUrl(canvas.toDataURL('image/png'))
        }
      })
      .catch(() => {
        if (!cancelled) setPreviewDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [
    ssid,
    password,
    encryption,
    hidden,
    showPasswordOnCard,
    title,
    subtitle,
    theme,
  ])

  async function handleExport(format: 'png' | 'pdf') {
    setIsExporting(true)
    setSuccess('')

    try {
      const canvas = await renderWifiCardCanvas({
        ssid,
        password,
        encryption,
        hidden,
        showPasswordOnCard,
        title,
        subtitle,
        theme,
      })

      const safeSsid =
        ssid.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'wifi-card'

      if (format === 'png') {
        const blob = await canvasToBlob(canvas, 'image/png')
        downloadBlob(blob, `wifi-qr-${safeSsid}.png`)
        setSuccess(
          t(
            'Kartu QR Wi-Fi PNG berhasil diunduh.',
            'Wi-Fi QR Card PNG downloaded.',
          ),
        )
      } else {
        const pdfBlob = await exportWifiCardPdf(canvas)
        downloadBlob(pdfBlob, `wifi-qr-${safeSsid}.pdf`)
        setSuccess(
          t(
            'Kartu QR Wi-Fi PDF siap cetak berhasil diunduh.',
            'Printable Wi-Fi QR Card PDF downloaded.',
          ),
        )
      }
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
        <ToolPageHeader toolId="wifi-qr" />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Controls */}
          <div className="space-y-5 lg:col-span-6">
            <section className="ios-card p-5 sm:p-6 space-y-4">
              <div>
                <label
                  htmlFor="wifi-ssid"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {t('Nama Jaringan Wi-Fi (SSID)', 'Wi-Fi Network Name (SSID)')}
                </label>
                <input
                  id="wifi-ssid"
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Misal: KopiKenangan_Free"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              {encryption !== 'nopass' && (
                <div>
                  <label
                    htmlFor="wifi-password"
                    className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    {t('Kata Sandi (Password Wi-Fi)', 'Wi-Fi Password')}
                  </label>
                  <input
                    id="wifi-password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('Masukkan kata sandi Wi-Fi...', 'Enter Wi-Fi password...')}
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('Tipe Keamanan', 'Security Type')}
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(
                    [
                      ['WPA', 'WPA / WPA2 / WPA3'],
                      ['WEP', 'WEP'],
                      ['nopass', t('Tanpa Password', 'Open / None')],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      id={`wifi-enc-${val}`}
                      type="button"
                      onClick={() => setEncryption(val)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        encryption === val
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 border-t border-[var(--border)] pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                  <input
                    id="wifi-show-pass"
                    type="checkbox"
                    checked={showPasswordOnCard}
                    onChange={(e) => setShowPasswordOnCard(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  {t(
                    'Tampilkan teks password di kartu',
                    'Print password text on card',
                  )}
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <input
                    id="wifi-hidden-net"
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  {t('Jaringan Tersembunyi (Hidden SSID)', 'Hidden Network')}
                </label>
              </div>

              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('Tema Desain Kartu', 'Card Theme')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((item) => (
                    <button
                      key={item.id}
                      id={`wifi-theme-${item.id}`}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        theme === item.id
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t(item.labelId, item.labelEn)}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="wifi-card-title"
                      className="text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      {t('Judul Kartu', 'Card Heading')}
                    </label>
                    <input
                      id="wifi-card-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wifi-card-sub"
                      className="text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      {t('Subjudul Petunjuk', 'Instruction Subtitle')}
                    </label>
                    <input
                      id="wifi-card-sub"
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Preview & Export */}
          <div className="lg:col-span-6">
            <div className="ios-card p-5 sm:p-6">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t('Pratinjau Kartu Wi-Fi', 'Wi-Fi Card Preview')}
              </h2>

              <div className="mt-4 flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                {previewDataUrl && (
                  <img
                    src={previewDataUrl}
                    alt="Wi-Fi QR Card preview"
                    className="max-h-[420px] rounded-2xl shadow-md"
                  />
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  id="wifi-download-png"
                  type="button"
                  disabled={isExporting || !ssid.trim()}
                  onClick={() => void handleExport('png')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  <Download size={16} />
                  {t('Unduh Kartu PNG', 'Download PNG Card')}
                </button>

                <button
                  id="wifi-download-pdf"
                  type="button"
                  disabled={isExporting || !ssid.trim()}
                  onClick={() => void handleExport('pdf')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
                >
                  <FileText size={16} />
                  {t('PDF Siap Cetak', 'Print PDF')}
                </button>
              </div>

              {success && (
                <p className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
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
