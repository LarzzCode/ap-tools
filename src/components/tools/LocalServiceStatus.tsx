import { motion } from 'motion/react'

import {
  CircleAlert,
  LoaderCircle,
  RefreshCcw,
  Wifi,
} from 'lucide-react'

import type { LocalServiceHealth } from '../../lib/localService'
import type {
  LocalServiceStatus as LocalServiceStatusValue,
} from '../../hooks/useLocalService'

interface LocalServiceStatusProps {
  status: LocalServiceStatusValue
  health: LocalServiceHealth | null
  onRetry: () => void | Promise<void>
}

export default function LocalServiceStatus({
  status,
  health,
  onRetry,
}: LocalServiceStatusProps) {
  if (status === 'checking') {
    return (
      <div
        className="
          flex items-center gap-3
          rounded-xl
          border border-[var(--border)]
          bg-[var(--surface-soft)]
          px-4 py-3
        "
      >
        <LoaderCircle
          size={17}
          className="
            animate-spin
            text-[var(--text-muted)]
          "
        />

        <div>
          <p
            className="
              text-sm font-medium
              text-[var(--text-primary)]
            "
          >
            Checking local service...
          </p>

          <p
            className="
              mt-0.5 text-xs
              text-[var(--text-muted)]
            "
          >
            Looking for Ditya Tools on this device.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 4,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          flex items-center gap-3
          rounded-xl
          border border-green-500/20
          bg-green-500/5
          px-4 py-3
        "
      >
        <div
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            bg-green-500/10
            text-green-500
          "
        >
          <Wifi size={17} />
        </div>

        <div>
          <p
            className="
              text-sm font-medium
              text-[var(--text-primary)]
            "
          >
            Local service connected
          </p>

          <p
            className="
              mt-0.5 text-xs
              text-[var(--text-muted)]
            "
          >
            Version {health?.version ?? 'unknown'}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 4,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-xl
        border border-amber-500/20
        bg-amber-500/5
        p-4
      "
    >
      <div className="flex gap-3">
        <div
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg
            bg-amber-500/10
            text-amber-500
          "
        >
          <CircleAlert size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              text-sm font-medium
              text-[var(--text-primary)]
            "
          >
            Local service is offline
          </p>

          <p
            className="
              mt-1 text-xs leading-5
              text-[var(--text-muted)]
            "
          >
            Start Ditya Tools Local Service before
            using media tools.
          </p>

          <button
            type="button"
            onClick={() => {
              void onRetry()
            }}
            className="
              mt-3 inline-flex
              items-center gap-2
              rounded-lg
              border border-[var(--border)]
              px-3 py-2
              text-xs font-medium
              text-[var(--text-secondary)]
              transition
              hover:border-[var(--primary-border)]
              hover:bg-[var(--primary-soft)]
              hover:text-[var(--primary-text)]
            "
          >
            <RefreshCcw size={14} />

            Check again
          </button>
        </div>
      </div>
    </motion.div>
  )
}