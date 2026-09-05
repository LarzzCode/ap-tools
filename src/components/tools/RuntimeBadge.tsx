import { Circle } from 'lucide-react'

import type { ToolRuntime } from '../../types/tool'

interface RuntimeBadgeProps {
  runtime: ToolRuntime
}

export default function RuntimeBadge({
  runtime,
}: RuntimeBadgeProps) {
  const isBrowser = runtime === 'browser'

  return (
    <div
      className="
        inline-flex items-center gap-1.5
        text-xs font-medium
        text-[var(--text-muted)]
      "
    >
      <Circle
        size={7}
        fill={
          isBrowser
            ? 'var(--success)'
            : 'var(--accent)'
        }
        strokeWidth={0}
      />

      {isBrowser
        ? 'Runs in browser'
        : 'Local service'}
    </div>
  )
}