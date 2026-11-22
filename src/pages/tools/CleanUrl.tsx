import { useEffect, useMemo, useState } from 'react'

import { motion } from 'motion/react'

import {
  Check,
  Copy,
  ExternalLink,
  Trash2,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import { generateQrCode } from '../../lib/qr'
import { cleanTrackingUrl } from '../../lib/urlCleaner'

export default function CleanUrl() {
  const [rawInput, setRawInput] = useState('')
  const [stripAllQuery, setStripAllQuery] = useState(false)
  const [stripHash, setStripHash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const result = useMemo(
    () =>
      cleanTrackingUrl(rawInput, {
        stripAllQuery,
        stripHash,
      }),
    [rawInput, stripAllQuery, stripHash],
  )

  useEffect(() => {
    if (!result.valid || !result.cleaned) {
      return
    }

    let cancelled = false
    generateQrCode(result.cleaned, { size: 320 })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [result.valid, result.cleaned])

  const visibleQrDataUrl =
    result.valid && result.cleaned ? qrDataUrl : ''

  async function handleCopy() {
    if (!result.valid || !result.cleaned) return
    await navigator.clipboard.writeText(result.cleaned)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="clean-url" />

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="clean-url-input"
              className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              Paste URL to Clean
            </label>
            {rawInput && (
              <button
                id="clean-url-clear-btn"
                type="button"
                onClick={() => setRawInput('')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-red-500"
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>

          <textarea
            id="clean-url-input"
            rows={3}
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value)
              setCopied(false)
            }}
            placeholder="https://www.instagram.com/reel/xyz/?igsh=abc123&utm_source=ig_web_copy_link"
            className="mt-2.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
          />

          <div className="mt-4 flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <input
                id="clean-url-strip-all"
                type="checkbox"
                checked={stripAllQuery}
                onChange={(e) => setStripAllQuery(e.target.checked)}
                className="rounded accent-[var(--primary)]"
              />
              Strip ALL query parameters (not just trackers)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <input
                id="clean-url-strip-hash"
                type="checkbox"
                checked={stripHash}
                onChange={(e) => setStripHash(e.target.checked)}
                className="rounded accent-[var(--primary)]"
              />
              Remove #hash fragment
            </label>
          </div>
        </section>

        {result.error && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {result.error}
          </p>
        )}

        {result.valid && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-8">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Cleaned Link
                </h2>
                <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--primary-text)]">
                  {result.removedParams.length}{' '}
                  {result.removedParams.length === 1 ? 'tracker' : 'trackers'}{' '}
                  removed
                </span>
              </div>

              <div className="mt-3 break-all rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)]">
                {result.cleaned}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  id="clean-url-copy-btn"
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)]"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied Clean Link' : 'Copy Clean Link'}
                </button>

                <a
                  href={result.cleaned}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              </div>

              {result.removedParams.length > 0 && (
                <div className="mt-6 border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Removed Parameters
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.removedParams.map((item, idx) => (
                      <span
                        key={`${item.key}-${idx}`}
                        className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 font-mono text-xs text-red-600 dark:text-red-400"
                      >
                        {item.key}={item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.keptParams.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Kept Functional Parameters
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.keptParams.map((item, idx) => (
                      <span
                        key={`${item.key}-${idx}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 font-mono text-xs text-[var(--text-secondary)]"
                      >
                        {item.key}={item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Clean QR Code
              </p>
              {visibleQrDataUrl && (
                <img
                  src={visibleQrDataUrl}
                  alt="Cleaned URL QR code"
                  className="mt-3 h-44 w-44 rounded-xl border border-[var(--border)] bg-white p-2"
                />
              )}
            </section>
          </div>
        )}
      </motion.div>
    </main>
  )
}
