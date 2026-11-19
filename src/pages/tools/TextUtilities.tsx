import { useMemo, useState } from 'react'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Replace,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react'

import { Link } from 'react-router'

import {
  collapseExtraSpaces,
  deduplicateLines,
  getTextStats,
  removeEmptyLines,
  sortLines,
  transformTextCase,
  unwrapPdfLineBreaks,
  type CaseTransformKind,
} from '../../lib/textTools'

import { downloadBlob } from '../../utils/download'

const CASE_ACTIONS: Array<{ id: CaseTransformKind; label: string }> = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'lower', label: 'lowercase' },
  { id: 'title', label: 'Title Case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
]

export default function TextUtilities() {
  const [text, setText] = useState('')
  const [findQuery, setFindQuery] = useState('')
  const [replaceValue, setReplaceValue] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => getTextStats(text), [text])

  function applyTransform(nextText: string) {
    setText(nextText)
    setCopied(false)
  }

  function handleFindReplace() {
    if (!findQuery) return
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(escaped, flags)
    applyTransform(text.replace(regex, replaceValue))
  }

  async function handleCopy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function handleDownloadTxt() {
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, 'ditya-tools-text.txt')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary-text)]"
        >
          <ArrowLeft size={16} />
          All tools
        </Link>

        <div className="mt-8 max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]">
            <Type size={22} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Text Cleaner & Case Tools
          </h1>

          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            Clean messy PDF copy-pastes, normalize spacing, transform letter casing, deduplicate lines, and count words or characters.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            Runs offline in your browser
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Words', stats.words],
            ['Characters', stats.characters],
            ['No Spaces', stats.charactersNoSpaces],
            ['Lines', stats.lines],
            ['Paragraphs', stats.paragraphs],
            ['Read Time', stats.readingMinutes ? `${stats.readingMinutes} min` : '0 min'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="text-xs text-[var(--text-muted)]">{label}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Editor */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="text-utilities-input"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  Workspace
                </label>
                <div className="flex items-center gap-2">
                  <button
                    id="text-utilities-copy-btn"
                    type="button"
                    disabled={!text}
                    onClick={() => void handleCopy()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    id="text-utilities-download-btn"
                    type="button"
                    disabled={!text}
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                  >
                    <Download size={14} />
                    .txt
                  </button>
                  <button
                    id="text-utilities-clear-btn"
                    type="button"
                    disabled={!text}
                    onClick={() => applyTransform('')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                id="text-utilities-input"
                rows={14}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text here..."
                className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 lg:col-span-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <Sparkles size={13} />
                Cleanup Actions
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  id="text-clean-unwrap-pdf"
                  type="button"
                  disabled={!text}
                  onClick={() => applyTransform(unwrapPdfLineBreaks(text))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-left text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                >
                  Fix PDF line breaks (unwrap sentences)
                </button>
                <button
                  id="text-clean-spaces"
                  type="button"
                  disabled={!text}
                  onClick={() => applyTransform(collapseExtraSpaces(text))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-left text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                >
                  Trim & collapse extra spaces
                </button>
                <button
                  id="text-clean-empty-lines"
                  type="button"
                  disabled={!text}
                  onClick={() => applyTransform(removeEmptyLines(text))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-left text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                >
                  Remove blank lines
                </button>
                <button
                  id="text-clean-dedupe"
                  type="button"
                  disabled={!text}
                  onClick={() => applyTransform(deduplicateLines(text))}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-left text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                >
                  Remove duplicate lines
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="text-clean-sort-az"
                    type="button"
                    disabled={!text}
                    onClick={() => applyTransform(sortLines(text, false))}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                  >
                    Sort A → Z
                  </button>
                  <button
                    id="text-clean-sort-za"
                    type="button"
                    disabled={!text}
                    onClick={() => applyTransform(sortLines(text, true))}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                  >
                    Sort Z → A
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Case Converter
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {CASE_ACTIONS.map((item) => (
                  <button
                    key={item.id}
                    id={`text-case-${item.id}`}
                    type="button"
                    disabled={!text}
                    onClick={() =>
                      applyTransform(transformTextCase(text, item.id))
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <Replace size={13} />
                Find & Replace
              </h2>
              <div className="mt-3 space-y-2.5">
                <input
                  id="text-find-input"
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Find..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
                <input
                  id="text-replace-input"
                  type="text"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input
                    id="text-find-case-sensitive"
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  Match case
                </label>
                <button
                  id="text-replace-apply-btn"
                  type="button"
                  disabled={!text || !findQuery}
                  onClick={handleFindReplace}
                  className="w-full rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
                >
                  Replace All
                </button>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
