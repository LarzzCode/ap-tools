import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  Building2,
  Contact,
  Download,
  Globe,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Sparkles,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { generateQrCode } from '../../lib/qr'
import { downloadBlob, downloadDataUrl } from '../../utils/download'

interface VCardFields {
  fullName: string
  jobTitle: string
  organization: string
  phone: string
  email: string
  website: string
  city: string
  instagram: string
}

function buildVCardPayload(fields: VCardFields): string {
  const name = fields.fullName.trim()
  const phone = fields.phone.trim()
  if (!name && !phone) return ''

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name || 'Kontak Baru'}`,
    `N:${name || 'Kontak Baru'};;;;`,
  ]

  if (fields.organization.trim()) {
    lines.push(`ORG:${fields.organization.trim()}`)
  }
  if (fields.jobTitle.trim()) {
    lines.push(`TITLE:${fields.jobTitle.trim()}`)
  }
  if (phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${phone}`)
  }
  if (fields.email.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${fields.email.trim()}`)
  }
  if (fields.website.trim()) {
    const rawUrl = fields.website.trim()
    const normalizedUrl = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`
    lines.push(`URL:${normalizedUrl}`)
  }
  if (fields.city.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${fields.city.trim()};;;;`)
  }
  if (fields.instagram.trim()) {
    lines.push(`NOTE:Instagram: ${fields.instagram.trim()}`)
  }

  lines.push('END:VCARD')
  return lines.join('\n')
}

async function renderBusinessCardPng(
  fields: VCardFields,
  qrDataUrl: string,
  scanLabel: string,
): Promise<string> {
  const width = 1080
  const height = 640
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return qrDataUrl

  // Sleek dark slate & cobalt gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#0F172A')
  grad.addColorStop(0.55, '#1E293B')
  grad.addColorStop(1, '#0F172A')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, 36)
  ctx.fill()

  // Top-left blue glow accent
  ctx.fillStyle = 'rgba(56, 189, 248, 0.14)'
  ctx.beginPath()
  ctx.arc(140, 90, 260, 0, Math.PI * 2)
  ctx.fill()

  // Left text column
  const padX = 68
  ctx.textAlign = 'left'

  if (fields.organization.trim()) {
    ctx.fillStyle = '#38BDF8'
    ctx.font = 'bold 22px Inter, system-ui, sans-serif'
    ctx.fillText(
      fields.organization.trim().toUpperCase().slice(0, 34),
      padX,
      96,
    )
  }

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 46px Inter, system-ui, sans-serif'
  ctx.fillText(
    (fields.fullName.trim() || 'Nama Lengkap').slice(0, 26),
    padX,
    162,
  )

  if (fields.jobTitle.trim()) {
    ctx.fillStyle = '#94A3B8'
    ctx.font = '600 25px Inter, system-ui, sans-serif'
    ctx.fillText(fields.jobTitle.trim().slice(0, 38), padX, 204)
  }

  // Divider line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padX, 246)
  ctx.lineTo(620, 246)
  ctx.stroke()

  // Contact Details List
  const details: string[] = []
  if (fields.phone.trim()) details.push(`Tel / WA: ${fields.phone.trim()}`)
  if (fields.email.trim()) details.push(`Email: ${fields.email.trim()}`)
  if (fields.website.trim()) details.push(`Web: ${fields.website.trim()}`)
  if (fields.instagram.trim()) details.push(`IG: ${fields.instagram.trim()}`)
  if (fields.city.trim()) details.push(`Lokasi: ${fields.city.trim()}`)

  ctx.fillStyle = '#E2E8F0'
  ctx.font = '500 23px Inter, system-ui, sans-serif'
  details.slice(0, 5).forEach((item, index) => {
    ctx.fillText(item.slice(0, 40), padX, 304 + index * 52)
  })

  // Right QR Code Card
  const qrBoxSize = 350
  const qrBoxX = width - qrBoxSize - 68
  const qrBoxY = 110

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28)
  ctx.fill()

  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = qrDataUrl
  })

  const qrPad = 24
  ctx.drawImage(
    qrImg,
    qrBoxX + qrPad,
    qrBoxY + qrPad,
    qrBoxSize - qrPad * 2,
    qrBoxSize - qrPad * 2,
  )

  ctx.fillStyle = '#38BDF8'
  ctx.font = 'bold 20px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    scanLabel,
    qrBoxX + qrBoxSize / 2,
    qrBoxY + qrBoxSize + 44,
  )

  return canvas.toDataURL('image/png')
}

export default function VCardQr() {
  const { t } = useLanguage()

  const [fields, setFields] = useState<VCardFields>({
    fullName: '',
    jobTitle: '',
    organization: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    instagram: '',
  })

  const [qrDataUrl, setQrDataUrl] = useState('')

  const vcardString = useMemo(() => buildVCardPayload(fields), [fields])

  useEffect(() => {
    if (!vcardString) {
      return
    }

    let cancelled = false
    generateQrCode(vcardString, { size: 640 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [vcardString])

  function updateField<K extends keyof VCardFields>(
    key: K,
    value: VCardFields[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleFillSample() {
    setFields({
      fullName: 'Gilar Wahiditya',
      jobTitle: 'Software Engineer & Web Developer',
      organization: 'Ditya Studio',
      phone: '+6281234567890',
      email: 'wahidityagilar6@gmail.com',
      website: 'portogilar.vercel.app',
      city: 'Indonesia',
      instagram: '@gilarwdy',
    })
  }

  async function handleDownloadBusinessCard() {
    if (!vcardString || !qrDataUrl) return
    const cardPng = await renderBusinessCardPng(
      fields,
      qrDataUrl,
      t('SCAN UNTUK SIMPAN KONTAK', 'SCAN TO SAVE CONTACT'),
    )
    downloadDataUrl(cardPng, 'ditya-tools-kartu-nama-digital.png')
  }

  function handleDownloadVcf() {
    if (!vcardString) return
    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' })
    const safeName =
      fields.fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') || 'kontak'
    downloadBlob(blob, `${safeName}.vcf`)
  }

  const activeQr = vcardString ? qrDataUrl : ''

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="vcard-qr" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_420px]">
        {/* Contact Details Form */}
        <section className="ios-card space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {t('Data Kartu Nama Digital (vCard)', 'Digital Contact Details')}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {t(
                  'Saat kode QR di-scan kamera HP, kontak otomatis siap disimpan ke Buku Telepon.',
                  'Scanning the QR with any phone camera prompts an instant Add to Contacts sheet.',
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
            >
              <Sparkles size={13} />
              {t('Isi Contoh', 'Fill Sample')}
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Nama Lengkap *', 'Full Name *')}
              </label>
              <input
                type="text"
                value={fields.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Gilar Wahiditya"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Nomor HP / WhatsApp *', 'Phone / WhatsApp *')}
              </label>
              <input
                type="tel"
                value={fields.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+62 812 3456 7890"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Jabatan / Profesi / Jurusan', 'Role / Job Title')}
              </label>
              <input
                type="text"
                value={fields.jobTitle}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                placeholder={t(
                  'Contoh: Web Developer / Mahasiswa',
                  'e.g., Product Designer / Founder',
                )}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Perusahaan / Kampus / Instansi', 'Company / Campus')}
              </label>
              <input
                type="text"
                value={fields.organization}
                onChange={(e) => updateField('organization', e.target.value)}
                placeholder={t('Contoh: PT Maju Jaya', 'e.g., Acme Studio')}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                Email
              </label>
              <input
                type="email"
                value={fields.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Website / Portofolio', 'Website / Portfolio')}
              </label>
              <input
                type="text"
                value={fields.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="portogilar.vercel.app"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                Instagram / Sosmed
              </label>
              <input
                type="text"
                value={fields.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                placeholder="@username"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Kota / Domisili', 'City / Location')}
              </label>
              <input
                type="text"
                value={fields.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Jakarta, Indonesia"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>
          </div>
        </section>

        {/* Live Card Preview & Export */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Kartu Nama & QR Kontak', 'Digital Business Card & QR')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t(
                    'Siap di-scan langsung dari layar HP atau dicetak.',
                    'Ready to scan right from your phone screen or print.',
                  )}
                </p>
              </div>
              <Contact size={18} className="text-[var(--primary)]" />
            </div>

            {activeQr ? (
              <div className="my-5 space-y-4">
                {/* Executive Card Preview */}
                <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-md">
                  {fields.organization.trim() && (
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      <Building2 size={12} />
                      {fields.organization}
                    </p>
                  )}
                  <h3 className="mt-1 text-lg font-bold">
                    {fields.fullName.trim() || t('Nama Kontak', 'Contact Name')}
                  </h3>
                  {fields.jobTitle.trim() && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Briefcase size={12} />
                      {fields.jobTitle}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-700/80 pt-4">
                    <div className="min-w-0 space-y-1.5 text-xs text-slate-300">
                      {fields.phone.trim() && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="shrink-0 text-sky-400" />
                          <span className="truncate">{fields.phone}</span>
                        </p>
                      )}
                      {fields.email.trim() && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="shrink-0 text-sky-400" />
                          <span className="truncate">{fields.email}</span>
                        </p>
                      )}
                      {fields.website.trim() && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Globe size={12} className="shrink-0 text-sky-400" />
                          <span className="truncate">{fields.website}</span>
                        </p>
                      )}
                      {fields.city.trim() && (
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin size={12} className="shrink-0 text-sky-400" />
                          <span className="truncate">{fields.city}</span>
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm">
                      <img
                        src={activeQr}
                        alt="vCard QR Code"
                        className="h-28 w-28 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <QrCode size={26} />
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Isi Nama atau Nomor HP untuk membuat QR Kontak',
                    'Enter a Name or Phone Number to generate vCard QR',
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <button
              id="vcard-download-card-btn"
              type="button"
              disabled={!activeQr}
              onClick={() => void handleDownloadBusinessCard()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} />
              {t(
                'Unduh Kartu Nama Digital + QR (PNG)',
                'Download Business Card + QR (PNG)',
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!activeQr}
                onClick={() =>
                  downloadDataUrl(activeQr, 'ditya-tools-vcard-qr.png')
                }
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] disabled:opacity-40"
              >
                <QrCode size={14} />
                {t('Unduh QR Saja', 'QR Only PNG')}
              </button>

              <button
                type="button"
                disabled={!vcardString}
                onClick={handleDownloadVcf}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] disabled:opacity-40"
              >
                <Contact size={14} />
                {t('File Kontak .VCF', 'Export .VCF')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
