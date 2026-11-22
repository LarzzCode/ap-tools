import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Mail,
  MessageSquareHeart,
  Send,
  Sparkles,
} from 'lucide-react'

import { tools } from '../data/tools'
import { useLanguage } from '../hooks/useLanguage'

const TARGET_EMAIL = 'wahidityagilar6@gmail.com'

type FeedbackCategory = 'feature' | 'ui' | 'bug' | 'other'

function openMailtoLink(url: string) {
  window.open(url, '_self')
}

export default function Feedback() {
  const { language, t } = useLanguage()

  const [category, setCategory] = useState<FeedbackCategory>('feature')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [relatedTool, setRelatedTool] = useState('general')
  const [message, setMessage] = useState('')

  const [isSending, setIsSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const categories: Array<{
    id: FeedbackCategory
    labelId: string
    labelEn: string
  }> = [
    { id: 'feature', labelId: 'Usul Alat Baru', labelEn: 'New Tool Idea' },
    { id: 'ui', labelId: 'Masukan Tampilan', labelEn: 'Design / UX' },
    { id: 'bug', labelId: 'Lapor Kendala / Bug', labelEn: 'Bug Report' },
    { id: 'other', labelId: 'Lainnya', labelEn: 'Other' },
  ]

  function getCategoryLabel(cat: FeedbackCategory) {
    const found = categories.find((item) => item.id === cat)
    if (!found) return 'Feedback'
    return language === 'id' ? found.labelId : found.labelEn
  }

  function getToolLabel(toolId: string) {
    if (toolId === 'general') {
      return t('Umum / Seluruh Website', 'General / Entire Website')
    }
    const found = tools.find((item) => item.id === toolId)
    if (!found) return toolId
    return language === 'id' ? found.nameId : found.name
  }

  function buildMailtoHref() {
    const subject = `[Ditya Tools - ${getCategoryLabel(category)}] ${
      senderName.trim() ? `dari ${senderName.trim()}` : 'Masukan Pengguna'
    }`
    const bodyLines = [
      `Kategori: ${getCategoryLabel(category)}`,
      `Alat Terkait: ${getToolLabel(relatedTool)}`,
      `Nama: ${senderName.trim() || '-'}`,
      `Kontak/Email: ${senderEmail.trim() || '-'}`,
      '',
      'Pesan / Saran:',
      message.trim(),
    ]
    return `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`
  }

  function buildGmailWebHref() {
    const subject = `[Ditya Tools - ${getCategoryLabel(category)}] ${
      senderName.trim() ? `dari ${senderName.trim()}` : 'Masukan Pengguna'
    }`
    const bodyLines = [
      `Kategori: ${getCategoryLabel(category)}`,
      `Alat Terkait: ${getToolLabel(relatedTool)}`,
      `Nama: ${senderName.trim() || '-'}`,
      `Kontak/Email: ${senderEmail.trim() || '-'}`,
      '',
      'Pesan / Saran:',
      message.trim(),
    ]
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      TARGET_EMAIL,
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyLines.join('\n'),
    )}`
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!message.trim()) {
      setError(
        t(
          'Tuliskan saran atau masukan Anda terlebih dahulu.',
          'Please write your suggestion or feedback first.',
        ),
      )
      return
    }

    setIsSending(true)
    setError('')

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${TARGET_EMAIL}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            _subject: `[Ditya Tools] ${getCategoryLabel(category)} — ${
              senderName.trim() || 'Pengguna'
            }`,
            kategori: getCategoryLabel(category),
            alat_terkait: getToolLabel(relatedTool),
            nama: senderName.trim() || 'Anonim',
            email_pengirim: senderEmail.trim() || '-',
            pesan: message.trim(),
          }),
        },
      )

      if (response.ok) {
        setSubmitted(true)
        setMessage('')
      } else {
        openMailtoLink(buildMailtoHref())
        setSubmitted(true)
      }
    } catch {
      openMailtoLink(buildMailtoHref())
      setSubmitted(true)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-xs">
            <MessageSquareHeart size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {t('Kirim Saran & Masukan', 'Send Feedback & Ideas')}
            </h1>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              {t(
                'Punya ide alat baru yang ingin ditambahkan atau menemukan kendala? Kirimkan langsung ke Gilar Wahiditya.',
                'Have a new utility idea or spotted an issue? Send your feedback directly to Gilar Wahiditya.',
              )}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="ios-card mt-6 p-5 sm:p-7 space-y-5">
          {/* Category Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Kategori Masukan', 'Feedback Category')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`feedback-cat-${cat.id}`}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                    category === cat.id
                      ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  {language === 'id' ? cat.labelId : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="feedback-name"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {t('Nama Anda (Opsional)', 'Your Name (Optional)')}
              </label>
              <input
                id="feedback-name"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder={t('Misal: Budi', 'e.g. Alex')}
                className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="feedback-email"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {t('Email / Kontak (Opsional)', 'Email / Contact (Optional)')}
              </label>
              <input
                id="feedback-email"
                type="text"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder={t('Untuk balasan jika perlu', 'If you want a reply')}
                className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Related Tool */}
          <div>
            <label
              htmlFor="feedback-tool"
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              {t('Alat yang Dimaksud', 'Related Tool')}
            </label>
            <select
              id="feedback-tool"
              value={relatedTool}
              onChange={(e) => setRelatedTool(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="general">
                {t('Umum / Usul Alat Baru', 'General / New Tool Request')}
              </option>
              {tools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {language === 'id' ? tool.nameId : tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="feedback-message"
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              {t('Pesan / Saran Anda', 'Your Suggestion or Feedback')}
            </label>
            <textarea
              id="feedback-message"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setSubmitted(false)
              }}
              placeholder={t(
                'Ceritakan fitur yang kamu butuhkan, ide perbaikan, atau kendala yang kamu alami...',
                'Describe the feature you would love to see, improvements, or any issue you noticed...',
              )}
              className="mt-1.5 w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-sm leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-[var(--error)]">
              {error}
            </p>
          )}

          {submitted && (
            <div className="flex items-start gap-3 rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-xs leading-5 text-[var(--text-primary)]">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-[var(--success)]"
              />
              <div>
                <p className="font-bold">
                  {t(
                    'Terima kasih! Masukan Anda telah diteruskan ke email Gilar.',
                    'Thank you! Your feedback has been forwarded to Gilar’s email.',
                  )}
                </p>
                <p className="mt-0.5 text-[var(--text-secondary)]">
                  {t(
                    'Anda juga dapat mengirim langsung lewat aplikasi Email atau Gmail menggunakan tombol di bawah.',
                    'You can also send directly via your Email app or Gmail using the buttons below.',
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <button
              id="feedback-submit-btn"
              type="submit"
              disabled={isSending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {isSending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {t('Kirim Masukan Sekarang', 'Send Feedback Now')}
            </button>

            <a
              id="feedback-mailto-btn"
              href={buildMailtoHref()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
            >
              <Mail size={15} />
              {t('Lewat Aplikasi Email', 'Open Email App')}
            </a>

            <a
              id="feedback-gmail-btn"
              href={buildGmailWebHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
            >
              Gmail
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--primary)]" />
              {t('Tujuan Email:', 'Recipient:')}
            </span>
            <a
              href={`mailto:${TARGET_EMAIL}`}
              className="font-mono font-semibold text-[var(--primary)] hover:underline"
            >
              {TARGET_EMAIL}
            </a>
          </div>
        </form>
      </motion.div>
    </main>
  )
}
