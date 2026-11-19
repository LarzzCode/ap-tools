import { useState } from 'react'

import { motion } from 'motion/react'

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  LoaderCircle,
  RefreshCcw,
  Terminal,
  Wifi,
} from 'lucide-react'

import type { LocalServiceHealth } from '../../lib/localService'
import type { LocalServiceStatus as LocalServiceStatusValue } from '../../hooks/useLocalService'

interface LocalServiceStatusProps {
  status: LocalServiceStatusValue
  health: LocalServiceHealth | null
  onRetry: () => void | Promise<void>
}

const WINDOWS_CMD =
  'cd backend && python -m venv .venv && .\\.venv\\Scripts\\pip install -r requirements.txt && .\\.venv\\Scripts\\uvicorn app.main:app --reload --host 127.0.0.1 --port 8787'

const UNIX_CMD =
  'cd backend && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt && ./.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8787'

export default function LocalServiceStatus({
  status,
  health,
  onRetry,
}: LocalServiceStatusProps) {
  const [showGuide, setShowGuide] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyCommand(id: string, command: string) {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // Ignore clipboard failures
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <LoaderCircle
          size={17}
          className="animate-spin text-[var(--text-muted)]"
        />

        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Checking local service...
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Looking for Ditya Tools on this device (127.0.0.1:8787).
          </p>
        </div>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
          <Wifi size={17} />
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Local service connected
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Version {health?.version ?? 'unknown'}
            {health?.capabilities?.ffmpeg !== undefined &&
              ` • FFmpeg ${health.capabilities.ffmpeg ? 'ready' : 'not found'}`}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <CircleAlert size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Local service is offline
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Start Ditya Tools Local Service on <code className="font-mono">127.0.0.1:8787</code> before using media tools.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void onRetry()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)]"
            >
              <RefreshCcw size={14} />
              Check again
            </button>

            <button
              id="local-service-toggle-guide"
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary-text)]"
            >
              <Terminal size={14} />
              How to start
              {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showGuide && (
            <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">
                    Windows (PowerShell)
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyCommand('win', WINDOWS_CMD)}
                    className="inline-flex items-center gap-1 text-[var(--primary-text)] hover:underline"
                  >
                    {copiedId === 'win' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === 'win' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--surface-soft)] p-2.5 font-mono text-[11px] text-[var(--text-secondary)]">
                  {WINDOWS_CMD}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">
                    macOS / Linux
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyCommand('unix', UNIX_CMD)}
                    className="inline-flex items-center gap-1 text-[var(--primary-text)] hover:underline"
                  >
                    {copiedId === 'unix' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === 'unix' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--surface-soft)] p-2.5 font-mono text-[11px] text-[var(--text-secondary)]">
                  {UNIX_CMD}
                </pre>
              </div>

              <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                Tip: If you already set up the virtual environment on Windows, just run <code className="font-mono">npm run backend</code> from the project root. Make sure <code className="font-mono">ffmpeg</code> is installed on your PATH.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}