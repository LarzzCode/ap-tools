import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { generateQrCode } from '../../lib/qr'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router'

import { downloadDataUrl } from '../../utils/download'
import {
  createWhatsAppLink,
  normalizeIndonesianPhoneNumber,
} from '../../utils/whatsapp'

export default function WhatsAppLink() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const whatsappLink = useMemo(() => {
    return createWhatsAppLink(
      phoneNumber,
      message,
    )
  }, [phoneNumber, message])

  const normalizedPhone = useMemo(() => {
    return normalizeIndonesianPhoneNumber(
      phoneNumber,
    )
  }, [phoneNumber])

  useEffect(() => {
    if (!whatsappLink) {
      setQrDataUrl('')
      return
    }

    let cancelled = false

    async function generateQr() {
      try {
        
        const dataUrl = await generateQrCode(whatsappLink,)

        if (!cancelled) {
          setQrDataUrl(dataUrl)
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl('')
        }
      }
    }

    generateQr()

    return () => {
      cancelled = true
    }
  }, [whatsappLink])

  async function handleCopy() {
    if (!whatsappLink) return

    try {
      await navigator.clipboard.writeText(
        whatsappLink,
      )

      setCopied(true)
      setError('')

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setError(
        'Unable to copy the link. Please copy it manually.',
      )
    }
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return

    downloadDataUrl(
      qrDataUrl,
      'ditya-tools-whatsapp-qr.png',
    )
  }

  return (
    <main
      className="
        mx-auto max-w-6xl
        px-4 py-10
        sm:px-6 sm:py-14
        lg:px-8
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Back */}

        <Link
          to="/"
          className="
            inline-flex items-center gap-2
            text-sm font-medium
            text-[var(--text-secondary)]
            transition
            hover:text-[var(--primary-text)]
          "
        >
          <ArrowLeft size={16} />

          All tools
        </Link>

        {/* Header */}

        <div className="mt-8 max-w-2xl">
          <div
            className="
              mb-5 flex h-12 w-12
              items-center justify-center
              rounded-2xl
              border border-[var(--primary-border)]
              bg-[var(--primary-soft)]
              text-[var(--primary-text)]
            "
          >
            <MessageCircle size={24} />
          </div>

          <h1
            className="
              text-3xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            WhatsApp Link Generator
          </h1>

          <p
            className="
              mt-3 text-base leading-7
              text-[var(--text-secondary)]
            "
          >
            Create a WhatsApp chat link with an
            optional pre-filled message.
          </p>

          <div
            className="
              mt-4 inline-flex items-center gap-2
              text-sm
              text-[var(--text-muted)]
            "
          >
            <ShieldCheck
              size={15}
              className="text-[var(--success)]"
            />

            Everything is generated in your browser.
          </div>
        </div>

        {/* Workspace */}

        <div
          className="
            mt-10 grid gap-6
            lg:grid-cols-[1fr_420px]
          "
        >
          {/* Form */}

          <section
            className="
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              p-5
              sm:p-6
            "
          >
            <h2
              className="
                text-lg font-semibold
                text-[var(--text-primary)]
              "
            >
              Create your WhatsApp link
            </h2>

            {/* Phone */}

            <div className="mt-6">
              <label
                htmlFor="phone-number"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Phone number
              </label>

              <div
                className="
                  mt-3 flex
                  rounded-xl
                  border border-[var(--border)]
                  bg-[var(--background)]
                  transition
                  focus-within:border-[var(--primary-border)]
                  focus-within:ring-4
                  focus-within:ring-sky-100/50
                  dark:focus-within:ring-sky-900/20
                "
              >
                <div
                  className="
                    flex items-center
                    border-r border-[var(--border)]
                    px-4
                    text-sm font-medium
                    text-[var(--text-secondary)]
                  "
                >
                  🇮🇩 +62
                </div>

                <input
                  id="phone-number"
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  placeholder="812 3456 7890"
                  className="
                    min-w-0 flex-1
                    bg-transparent
                    px-4 py-3
                    text-sm
                    text-[var(--text-primary)]
                    outline-none
                    placeholder:text-[var(--text-muted)]
                  "
                />
              </div>

              <p
                className="
                  mt-2 text-xs leading-5
                  text-[var(--text-muted)]
                "
              >
                You can enter 0812..., 812..., or
                62812... — we'll normalize it for you.
              </p>
            </div>

            {/* Message */}

            <div className="mt-6">
              <label
                htmlFor="whatsapp-message"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Pre-filled message
              </label>

              <textarea
                id="whatsapp-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Halo, saya ingin bertanya..."
                rows={6}
                className="
                  mt-3 w-full resize-none
                  rounded-xl
                  border border-[var(--border)]
                  bg-[var(--background)]
                  px-4 py-3
                  text-sm leading-6
                  text-[var(--text-primary)]
                  outline-none
                  transition
                  placeholder:text-[var(--text-muted)]
                  focus:border-[var(--primary-border)]
                  focus:ring-4
                  focus:ring-sky-100/50
                  dark:focus:ring-sky-900/20
                "
              />

              <div
                className="
                  mt-2 text-right
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                {message.length} characters
              </div>
            </div>

            {/* Normalized */}

            {normalizedPhone && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  mt-6
                  rounded-xl
                  border border-[var(--border)]
                  bg-[var(--surface-soft)]
                  p-4
                "
              >
                <p
                  className="
                    text-xs font-medium
                    uppercase tracking-wide
                    text-[var(--text-muted)]
                  "
                >
                  Normalized number
                </p>

                <p
                  className="
                    mt-1 font-mono text-sm
                    text-[var(--text-primary)]
                  "
                >
                  +{normalizedPhone}
                </p>
              </motion.div>
            )}

            {error && (
              <p
                className="
                  mt-5 text-sm
                  text-[var(--error)]
                "
              >
                {error}
              </p>
            )}
          </section>

          {/* Result */}

          <section
            className="
              flex min-h-[480px]
              flex-col
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              p-5
              sm:p-6
            "
          >
            <div>
              <p
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Your link
              </p>

              <p
                className="
                  mt-1 text-sm
                  text-[var(--text-muted)]
                "
              >
                Ready to copy, open, or turn into QR.
              </p>
            </div>

            <div
              className="
                flex flex-1 flex-col
                justify-center
                py-8
              "
            >
              {whatsappLink ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="space-y-5"
                >
                  {/* QR */}

                  {qrDataUrl && (
                    <div
                      className="
                        mx-auto w-fit
                        rounded-2xl
                        border border-[var(--border)]
                        bg-white
                        p-4
                        shadow-sm
                      "
                    >
                      <img
                        src={qrDataUrl}
                        alt="WhatsApp QR code"
                        className="
                          h-44 w-44
                          object-contain
                        "
                      />
                    </div>
                  )}

                  {/* Link */}

                  <div
                    className="
                      rounded-xl
                      border border-[var(--border)]
                      bg-[var(--background)]
                      p-4
                    "
                  >
                    <p
                      className="
                        break-all font-mono
                        text-xs leading-5
                        text-[var(--text-secondary)]
                      "
                    >
                      {whatsappLink}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div
                    className="
                      mx-auto flex h-16 w-16
                      items-center justify-center
                      rounded-2xl
                      bg-[var(--primary-soft)]
                      text-[var(--primary-text)]
                    "
                  >
                    <QrCode size={28} />
                  </div>

                  <p
                    className="
                      mt-4 text-sm font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    Your WhatsApp link will appear here
                  </p>

                  <p
                    className="
                      mt-2 text-sm
                      text-[var(--text-muted)]
                    "
                  >
                    Enter a phone number to begin.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}

            <div className="grid gap-2">
              <motion.button
                type="button"
                onClick={handleCopy}
                disabled={!whatsappLink}
                whileTap={
                  whatsappLink
                    ? { scale: 0.97 }
                    : undefined
                }
                className="
                  flex w-full
                  items-center justify-center gap-2
                  rounded-xl
                  bg-[var(--primary-300)]
                  px-4 py-3
                  text-sm font-semibold
                  text-sky-950
                  transition
                  hover:bg-[var(--primary)]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {copied ? (
                  <>
                    <Check size={17} />

                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={17} />

                    Copy Link
                  </>
                )}
              </motion.button>

              <a
                href={whatsappLink || undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!whatsappLink}
                className={`
                  flex w-full
                  items-center justify-center gap-2
                  rounded-xl
                  border border-[var(--border)]
                  px-4 py-3
                  text-sm font-medium
                  transition
                  ${
                    whatsappLink
                      ? 'text-[var(--text-primary)] hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]'
                      : 'pointer-events-none opacity-40'
                  }
                `}
              >
                <ExternalLink size={17} />

                Open WhatsApp
              </a>

              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="
                  flex w-full
                  items-center justify-center gap-2
                  rounded-xl
                  border border-[var(--border)]
                  px-4 py-3
                  text-sm font-medium
                  text-[var(--text-secondary)]
                  transition
                  hover:border-[var(--primary-border)]
                  hover:bg-[var(--primary-soft)]
                  hover:text-[var(--text-primary)]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <Download size={17} />

                Download QR
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  )
}