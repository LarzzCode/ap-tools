import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { generateQrCode } from '../../lib/qr'
import {
  ArrowLeft,
  Download,
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  Type,
} from 'lucide-react'
import { Link } from 'react-router'

import { downloadDataUrl } from '../../utils/download'

type QrType = 'url' | 'text'

const qrSizes = [256, 512, 1024]

export default function QrGenerator() {
  const [type, setType] = useState<QrType>('url')
  const [value, setValue] = useState('')
  const [size, setSize] = useState(512)

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const content = value.trim()

    if (!content) {
      setQrDataUrl('')
      setError('')
      return
    }

    let cancelled = false

    async function generateQr() {
      try {
        setError('')

      const dataUrl = await generateQrCode(content, {
        size,
      })

        if (!cancelled) {
          setQrDataUrl(dataUrl)
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl('')
          setError(
            'We could not generate this QR code. Try different content.',
          )
        }
      }
    }

    generateQr()

    return () => {
      cancelled = true
    }
  }, [value, size])

  function switchType(nextType: QrType) {
    setType(nextType)
    setValue('')
    setQrDataUrl('')
    setError('')
  }

  function handleDownload() {
    if (!qrDataUrl) return

    downloadDataUrl(
      qrDataUrl,
      `ditya-tools-qr-${size}.png`,
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
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

        {/* Heading */}

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
            <QrCode size={24} />
          </div>

          <h1
            className="
              text-3xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            QR Code Generator
          </h1>

          <p
            className="
              mt-3 text-base leading-7
              text-[var(--text-secondary)]
            "
          >
            Turn a link or text into a QR code
            instantly.
          </p>

          <div
            className="
              mt-4 inline-flex items-center gap-2
              text-sm text-[var(--text-muted)]
            "
          >
            <ShieldCheck
              size={15}
              className="text-[var(--success)]"
            />

            Generated directly in your browser.
          </div>
        </div>

        {/* Main workspace */}

        <div
          className="
            mt-10 grid gap-6
            lg:grid-cols-[1fr_420px]
          "
        >
          {/* Settings */}

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
              Create your QR code
            </h2>

            {/* Type */}

            <div className="mt-6">
              <label
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Content type
              </label>

              <div
                className="
                  mt-3 grid grid-cols-2 gap-2
                  rounded-xl
                  bg-[var(--surface-soft)]
                  p-1
                "
              >
                <button
                  type="button"
                  onClick={() => switchType('url')}
                  className={`
                    flex items-center justify-center gap-2
                    rounded-lg px-4 py-2.5
                    text-sm font-medium
                    transition
                    ${
                      type === 'url'
                        ? 'bg-[var(--surface)] text-[var(--primary-text)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <LinkIcon size={16} />

                  URL
                </button>

                <button
                  type="button"
                  onClick={() => switchType('text')}
                  className={`
                    flex items-center justify-center gap-2
                    rounded-lg px-4 py-2.5
                    text-sm font-medium
                    transition
                    ${
                      type === 'text'
                        ? 'bg-[var(--surface)] text-[var(--primary-text)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Type size={16} />

                  Text
                </button>
              </div>
            </div>

            {/* Content */}

            <div className="mt-6">
              <label
                htmlFor="qr-content"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                {type === 'url'
                  ? 'Website URL'
                  : 'Text'}
              </label>

              {type === 'url' ? (
                <input
                  id="qr-content"
                  type="url"
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value)
                  }
                  placeholder="https://example.com"
                  className="
                    mt-3 w-full
                    rounded-xl
                    border border-[var(--border)]
                    bg-[var(--background)]
                    px-4 py-3
                    text-sm
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
              ) : (
                <textarea
                  id="qr-content"
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value)
                  }
                  placeholder="Type something..."
                  rows={5}
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
              )}
            </div>

            {/* Size */}

            <div className="mt-6">
              <label
                htmlFor="qr-size"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Image size
              </label>

              <select
                id="qr-size"
                value={size}
                onChange={(event) =>
                  setSize(Number(event.target.value))
                }
                className="
                  mt-3 w-full
                  rounded-xl
                  border border-[var(--border)]
                  bg-[var(--background)]
                  px-4 py-3
                  text-sm
                  text-[var(--text-primary)]
                  outline-none
                  transition
                  focus:border-[var(--primary-border)]
                  focus:ring-4
                  focus:ring-sky-100/50
                  dark:focus:ring-sky-900/20
                "
              >
                {qrSizes.map((qrSize) => (
                  <option
                    key={qrSize}
                    value={qrSize}
                  >
                    {qrSize} × {qrSize} px
                  </option>
                ))}
              </select>
            </div>

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

          {/* Preview */}

          <section
            className="
              flex min-h-[440px]
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
                Preview
              </p>

              <p
                className="
                  mt-1 text-sm
                  text-[var(--text-muted)]
                "
              >
                Updates automatically as you type.
              </p>
            </div>

            <div
              className="
                flex flex-1
                items-center justify-center
                py-8
              "
            >
              {qrDataUrl ? (
                <motion.div
                  key={qrDataUrl}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="
                    rounded-2xl
                    border border-[var(--border)]
                    bg-white
                    p-5
                    shadow-sm
                  "
                >
                  <img
                    src={qrDataUrl}
                    alt="Generated QR code preview"
                    className="
                      h-56 w-56
                      object-contain
                    "
                  />
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
                    Your QR code will appear here
                  </p>

                  <p
                    className="
                      mt-2 text-sm
                      text-[var(--text-muted)]
                    "
                  >
                    Enter a URL or some text to begin.
                  </p>
                </div>
              )}
            </div>

            <motion.button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              whileTap={
                qrDataUrl
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
              <Download size={17} />

              Download PNG
            </motion.button>
          </section>
        </div>
      </motion.div>
    </main>
  )
}