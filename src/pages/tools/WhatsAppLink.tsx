import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  QrCode,
  Sparkles,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { generateQrCode } from '../../lib/qr'
import { downloadDataUrl } from '../../utils/download'
import {
  createWhatsAppLink,
  normalizeIndonesianPhoneNumber,
} from '../../utils/whatsapp'

interface MessageTemplate {
  id: string
  labelId: string
  labelEn: string
  textId: string
  textEn: string
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'order',
    labelId: 'Order Produk',
    labelEn: 'Product Order',
    textId:
      'Halo Kak, saya ingin memesan:\n• Produk: \n• Jumlah: \n• Alamat: \n\nMohon info ketersediaan stok ya, terima kasih!',
    textEn:
      'Hi! I would like to order:\n• Item: \n• Quantity: \n• Delivery Address: \n\nPlease let me know availability. Thank you!',
  },
  {
    id: 'ask',
    labelId: 'Tanya Admin / CS',
    labelEn: 'General Inquiry',
    textId: 'Halo Admin, saya ingin bertanya mengenai informasi layanan/produk...',
    textEn: 'Hello! I would like to ask for more information regarding...',
  },
  {
    id: 'payment',
    labelId: 'Konfirmasi Bayar',
    labelEn: 'Payment Confirm',
    textId:
      'Halo Kak, saya ingin konfirmasi pembayaran untuk pesanan atas nama:\n• Nama: \n• Nominal: Rp',
    textEn:
      'Hello, I am confirming my payment for the order under:\n• Name: \n• Amount: ',
  },
  {
    id: 'event',
    labelId: 'Daftar Event / Kampus',
    labelEn: 'Event Registration',
    textId:
      'Halo Kak Panitia, saya ingin mendaftar kegiatan:\n• Nama Lengkap: \n• Asal / Instansi: ',
    textEn:
      'Hi Organizer, I would like to register for the event:\n• Full Name: \n• Organization: ',
  },
]

async function renderWhatsAppCardPng(options: {
  displayName: string
  formattedPhone: string
  qrDataUrl: string
  subtitle: string
  scanHint: string
}): Promise<string> {
  const width = 840
  const height = 1040
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return options.qrDataUrl

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#059669')
  grad.addColorStop(1, '#10B981')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Inner white iOS card
  const cardX = 56
  const cardY = 64
  const cardW = width - cardX * 2
  const cardH = height - cardY * 2

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardW, cardH, 40)
  ctx.fill()

  // Top green pill badge
  ctx.fillStyle = '#ECFDF5'
  ctx.beginPath()
  ctx.roundRect(width / 2 - 140, cardY + 46, 280, 44, 22)
  ctx.fill()

  ctx.fillStyle = '#059669'
  ctx.font = 'bold 19px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('WHATSAPP DIRECT CHAT', width / 2, cardY + 74)

  // Title / Display Name
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 38px Inter, system-ui, sans-serif'
  const title = options.displayName.trim() || 'Chat via WhatsApp'
  ctx.fillText(title.slice(0, 28), width / 2, cardY + 148)

  // Phone number
  ctx.fillStyle = '#475569'
  ctx.font = '600 24px Inter, system-ui, sans-serif'
  ctx.fillText(options.formattedPhone, width / 2, cardY + 188)

  // QR Box frame
  const qrBoxSize = 460
  const qrBoxX = (width - qrBoxSize) / 2
  const qrBoxY = cardY + 230

  ctx.fillStyle = '#F8FAFC'
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32)
  ctx.fill()
  ctx.stroke()

  // Draw QR Image
  const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = options.qrDataUrl
  })

  const qrPad = 36
  ctx.drawImage(
    qrImage,
    qrBoxX + qrPad,
    qrBoxY + qrPad,
    qrBoxSize - qrPad * 2,
    qrBoxSize - qrPad * 2,
  )

  // Bottom instruction text
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 24px Inter, system-ui, sans-serif'
  ctx.fillText(options.scanHint, width / 2, qrBoxY + qrBoxSize + 64)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 19px Inter, system-ui, sans-serif'
  ctx.fillText(options.subtitle, width / 2, qrBoxY + qrBoxSize + 100)

  return canvas.toDataURL('image/png')
}

export default function WhatsAppLink() {
  const { language, t } = useLanguage()

  const [contactName, setContactName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')

  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const whatsappLink = useMemo(() => {
    return createWhatsAppLink(phoneNumber, message)
  }, [phoneNumber, message])

  const qrDataUrl = whatsappLink ? generatedQrDataUrl : ''

  const normalizedPhone = useMemo(() => {
    return normalizeIndonesianPhoneNumber(phoneNumber)
  }, [phoneNumber])

  useEffect(() => {
    if (!whatsappLink) {
      return
    }

    let cancelled = false

    async function generateQr() {
      try {
        const dataUrl = await generateQrCode(whatsappLink)
        if (!cancelled) {
          setGeneratedQrDataUrl(dataUrl)
        }
      } catch {
        if (!cancelled) {
          setGeneratedQrDataUrl('')
        }
      }
    }

    void generateQr()

    return () => {
      cancelled = true
    }
  }, [whatsappLink])

  async function handleCopy() {
    if (!whatsappLink) return

    try {
      await navigator.clipboard.writeText(whatsappLink)
      setCopied(true)
      setError('')

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setError(
        t(
          'Gagal menyalin tautan otomatis. Silakan salin manual.',
          'Unable to copy the link automatically. Please copy it manually.',
        ),
      )
    }
  }

  function handleDownloadQrOnly() {
    if (!qrDataUrl) return
    downloadDataUrl(qrDataUrl, 'ditya-tools-whatsapp-qr.png')
  }

  async function handleDownloadWaCard() {
    if (!qrDataUrl || !normalizedPhone) return
    const cardUrl = await renderWhatsAppCardPng({
      displayName:
        contactName.trim() ||
        t('Hubungi Kami di WhatsApp', 'Chat with Us on WhatsApp'),
      formattedPhone: `+${normalizedPhone}`,
      qrDataUrl,
      scanHint: t(
        'Scan Kamera HP untuk Chat Tanpa Simpan Nomor',
        'Scan with Phone Camera to Chat Instantly',
      ),
      subtitle: t(
        'Tidak perlu simpan kontak terlebih dahulu',
        'No need to save phone contact first',
      ),
    })
    downloadDataUrl(cardUrl, 'ditya-tools-kartu-qr-whatsapp.png')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="whatsapp-link" />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_420px]">
          {/* Form */}
          <section className="ios-card space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {t(
                  'Buat Link wa.me & Kartu QR WhatsApp',
                  'Create wa.me Link & WhatsApp QR Card',
                )}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {t(
                  'Masukkan nomor tujuan (08... atau 628...) dan pilih template pesan pembuka otomatis.',
                  'Enter a destination phone number and pick a pre-filled greeting message.',
                )}
              </p>
            </div>

            {/* Optional Store / Contact Name for Card */}
            <div>
              <label
                htmlFor="wa-contact-name"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {t(
                  'Nama Toko / Kontak (Opsional untuk Kartu QR)',
                  'Store / Contact Name (Optional for QR Card)',
                )}
              </label>
              <input
                id="wa-contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t(
                  'Contoh: Admin Toko Berkah / Panitia Kampus',
                  'e.g., Customer Support / Event Desk',
                )}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="phone-number"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {t('Nomor WhatsApp Tujuan', 'WhatsApp Phone Number')}
                </label>
                {normalizedPhone && (
                  <span className="font-mono text-xs font-bold text-[var(--primary)]">
                    +{normalizedPhone}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex rounded-xl border border-[var(--border)] bg-[var(--background)] transition focus-within:border-[var(--primary-border)]">
                <div className="flex items-center border-r border-[var(--border)] px-3.5 text-xs font-bold text-[var(--text-secondary)]">
                  🇮🇩 +62
                </div>

                <input
                  id="phone-number"
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="0812 3456 7890"
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>

              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                {t(
                  'Bisa diketik 0812..., 812..., atau 62812... — otomatis diubah ke standar internasional.',
                  'Enter 0812..., 812..., or 62812... — automatically formatted to international standard.',
                )}
              </p>
            </div>

            {/* Message + Quick Presets */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="whatsapp-message"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {t('Template Pesan Otomatis', 'Pre-filled Message')}
                </label>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]">
                  <Sparkles size={12} />
                  {t('Preset Cepat:', 'Quick Presets:')}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {MESSAGE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() =>
                      setMessage(language === 'id' ? tpl.textId : tpl.textEn)
                    }
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                  >
                    {language === 'id' ? tpl.labelId : tpl.labelEn}
                  </button>
                ))}
              </div>

              <textarea
                id="whatsapp-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t(
                  'Halo Kak, saya ingin bertanya mengenai...',
                  'Hello, I would like to ask about...',
                )}
                rows={5}
                className="mt-2.5 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-border)]"
              />

              <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>
                  {t(
                    'Tips: Gunakan *teks* untuk huruf tebal di WhatsApp',
                    'Tip: Wrap words in *asterisks* for bold text in WhatsApp',
                  )}
                </span>
                <span>
                  {message.length} {t('karakter', 'chars')}
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--error)]">
                {error}
              </p>
            )}
          </section>

          {/* Preview & Download Card */}
          <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {t('Kartu QR & Tautan Siap Pakai', 'Ready Link & QR Card')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t(
                      'Salin link bio, buka chat, atau unduh kartu QR.',
                      'Copy link for social bio, test chat, or download QR card.',
                    )}
                  </p>
                </div>
                <MessageCircle size={18} className="text-emerald-500" />
              </div>

              <div className="py-5">
                {whatsappLink ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {/* Live Card Preview */}
                    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-4 text-center">
                      <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        WhatsApp Direct
                      </span>
                      <p className="mt-1.5 text-base font-bold text-[var(--text-primary)]">
                        {contactName.trim() ||
                          t('Chat Tanpa Simpan Nomor', 'Direct WhatsApp Chat')}
                      </p>
                      <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                        +{normalizedPhone}
                      </p>

                      {qrDataUrl && (
                        <div className="mx-auto mt-3 w-fit rounded-2xl border border-[var(--border)] bg-white p-3.5 shadow-xs">
                          <img
                            src={qrDataUrl}
                            alt="WhatsApp QR code"
                            className="h-40 w-40 object-contain"
                          />
                        </div>
                      )}

                      {message.trim() && (
                        <div className="mt-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] shadow-2xs">
                          <span className="block text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                            {t('Pesan Otomatis:', 'Pre-filled Message:')}
                          </span>
                          <p className="mt-0.5 line-clamp-2 whitespace-pre-line">
                            {message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* URL Box */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                      <p className="break-all font-mono text-xs leading-5 text-[var(--text-secondary)]">
                        {whatsappLink}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      <QrCode size={26} />
                    </div>

                    <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                      {t(
                        'Link & Kartu QR akan muncul di sini',
                        'Your WhatsApp link & QR will appear here',
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {t(
                        'Ketik nomor WhatsApp tujuan di sebelah kiri untuk mulai.',
                        'Enter a destination WhatsApp phone number on the left to start.',
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="wa-copy-link-btn"
                  type="button"
                  onClick={handleCopy}
                  disabled={!whatsappLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <Check size={15} />
                      {t('Tersalin!', 'Copied!')}
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      {t('Salin Link', 'Copy Link')}
                    </>
                  )}
                </button>

                <a
                  id="wa-open-chat-link"
                  href={whatsappLink || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!whatsappLink}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-xs font-bold transition ${
                    whatsappLink
                      ? 'text-emerald-600 hover:border-emerald-500/40 dark:text-emerald-400'
                      : 'pointer-events-none opacity-40'
                  }`}
                >
                  <ExternalLink size={15} />
                  {t('Buka Chat WA', 'Open WhatsApp')}
                </a>
              </div>

              <button
                id="wa-download-card-btn"
                type="button"
                onClick={() => void handleDownloadWaCard()}
                disabled={!qrDataUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-2.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={15} />
                {t(
                  'Unduh Kartu QR WhatsApp Siap Cetak (PNG)',
                  'Download Printable WhatsApp QR Card (PNG)',
                )}
              </button>

              <button
                id="wa-download-qr-only-btn"
                type="button"
                onClick={handleDownloadQrOnly}
                disabled={!qrDataUrl}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <QrCode size={13} />
                {t('Unduh Gambar QR Saja', 'Download Plain QR Image Only')}
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  )
}