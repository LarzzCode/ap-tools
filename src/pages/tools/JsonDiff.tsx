import { useMemo, useState } from 'react'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Braces,
  Check,
  Copy,
  GitCompareArrows,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

import { Link } from 'react-router'

import {
  computeLineDiff,
  formatJsonText,
} from '../../lib/textTools'

type ActiveMode = 'json' | 'diff'

export default function JsonDiff() {
  const [mode, setMode] = useState<ActiveMode>('json')

  // JSON state
  const [jsonInput, setJsonInput] = useState('')
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2)
  const [minify, setMinify] = useState(false)
  const [sortKeys, setSortKeys] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  // Diff state
  const [originalText, setOriginalText] = useState('')
  const [modifiedText, setModifiedText] = useState('')

  const jsonResult = useMemo(
    () =>
      formatJsonText(jsonInput, {
        indent,
        minify,
        sortKeys,
      }),
    [jsonInput, indent, minify, sortKeys],
  )

  const diffLines = useMemo(() => {
    if (!originalText && !modifiedText) return []
    return computeLineDiff(originalText, modifiedText)
  }, [originalText, modifiedText])

  const diffSummary = useMemo(() => {
    let added = 0
    let removed = 0
    for (const line of diffLines) {
      if (line.type === 'added') added++
      if (line.type === 'removed') removed++
    }
    return { added, removed }
  }, [diffLines])

  async function handleCopyJson() {
    if (!jsonResult.valid) return
    await navigator.clipboard.writeText(jsonResult.formatted)
    setCopiedJson(true)
    window.setTimeout(() => setCopiedJson(false), 1800)
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
            <Braces size={22} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            JSON Formatter & Text Diff
          </h1>

          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            Validate, pretty-print, sort, or minify JSON payloads, and compare two snippets line by line without sending sensitive data online.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            Processed locally in your browser
          </div>
        </div>

        {/* Mode switch */}
        <div className="mt-8 inline-flex rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            id="json-diff-tab-json"
            type="button"
            onClick={() => setMode('json')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'json'
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Braces size={15} />
            JSON Formatter
          </button>
          <button
            id="json-diff-tab-diff"
            type="button"
            onClick={() => setMode('diff')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'diff'
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <GitCompareArrows size={15} />
            Text Diff
          </button>
        </div>

        {mode === 'json' ? (
          <div className="mt-6 space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {([2, 4, 'tab'] as const).map((option) => (
                  <button
                    key={String(option)}
                    id={`json-indent-${String(option)}`}
                    type="button"
                    onClick={() => {
                      setIndent(option)
                      setMinify(false)
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      !minify && indent === option
                        ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {option === 'tab' ? 'Tab indent' : `${option} spaces`}
                  </button>
                ))}

                <button
                  id="json-minify-toggle"
                  type="button"
                  onClick={() => setMinify((prev) => !prev)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    minify
                      ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Minify
                </button>

                <button
                  id="json-sort-keys-toggle"
                  type="button"
                  onClick={() => setSortKeys((prev) => !prev)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    sortKeys
                      ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Sort keys
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="json-copy-output-btn"
                  type="button"
                  disabled={!jsonResult.valid}
                  onClick={() => void handleCopyJson()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
                >
                  {copiedJson ? <Check size={14} /> : <Copy size={14} />}
                  {copiedJson ? 'Copied' : 'Copy Result'}
                </button>
                <button
                  id="json-clear-btn"
                  type="button"
                  disabled={!jsonInput}
                  onClick={() => setJsonInput('')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label
                  htmlFor="json-input-area"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  Raw JSON Input
                </label>
                <textarea
                  id="json-input-area"
                  rows={16}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"name":"Ditya Tools","private":true}'
                  className="mt-2.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Formatted Output
                  </span>
                  {jsonInput.trim() && jsonResult.valid && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Valid JSON ({jsonResult.keyCount} fields/items)
                    </span>
                  )}
                </div>

                {jsonResult.error ? (
                  <div className="mt-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-600 dark:text-red-400">
                    {jsonResult.error}
                  </div>
                ) : (
                  <pre className="mt-2.5 h-[394px] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)]">
                    {jsonResult.formatted || 'Formatted JSON will appear here.'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label
                  htmlFor="diff-original-area"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  Original Text
                </label>
                <textarea
                  id="diff-original-area"
                  rows={10}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste original version..."
                  className="mt-2.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label
                  htmlFor="diff-modified-area"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  Modified Text
                </label>
                <textarea
                  id="diff-modified-area"
                  rows={10}
                  value={modifiedText}
                  onChange={(e) => setModifiedText(e.target.value)}
                  placeholder="Paste modified version..."
                  className="mt-2.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 font-mono text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
              </div>
            </div>

            {diffLines.length > 0 && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Line Comparison
                  </h2>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-green-600 dark:text-green-400">
                      +{diffSummary.added} added
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      -{diffSummary.removed} removed
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-auto rounded-xl border border-[var(--border)] font-mono text-xs">
                  {diffLines.map((line, index) => (
                    <div
                      key={`${index}-${line.type}`}
                      className={`flex items-start gap-3 border-b border-[var(--border)] px-3 py-1.5 last:border-b-0 ${
                        line.type === 'added'
                          ? 'bg-green-500/10 text-green-800 dark:text-green-300'
                          : line.type === 'removed'
                            ? 'bg-red-500/10 text-red-800 dark:text-red-300'
                            : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-right text-[var(--text-muted)] select-none">
                        {line.leftLine ?? ''}
                      </span>
                      <span className="w-8 shrink-0 text-right text-[var(--text-muted)] select-none">
                        {line.rightLine ?? ''}
                      </span>
                      <span className="w-4 shrink-0 font-bold select-none">
                        {line.type === 'added'
                          ? '+'
                          : line.type === 'removed'
                            ? '-'
                            : ' '}
                      </span>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                        {line.text || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>
    </main>
  )
}
