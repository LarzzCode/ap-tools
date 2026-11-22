import { Circle } from 'lucide-react'

import { useLanguage } from '../../hooks/useLanguage'
import type { ToolRuntime } from '../../types/tool'

interface RuntimeBadgeProps {
  runtime: ToolRuntime
}

export default function RuntimeBadge({
  runtime,
}: RuntimeBadgeProps) {
  const { t } = useLanguage()
  const isBrowser = runtime === 'browser'

  return (
    <div
      className="
        inline-flex items-center gap-1.5
        rounded-full border border-[var(--border)]
        bg-[var(--surface-soft)]
        px-2.5 py-1
        text-[11px] font-medium
        text-[var(--text-secondary)]
      "
    >
      <Circle
        size={7}
        fill={
          isBrowser
            ? 'var(--success)'
            : 'var(--warning)'
        }
        strokeWidth={0}
      />

      {isBrowser
        ? t('Instan di Browser', 'Runs in Browser')
        : t('Butuh Server • Hubungi Developer', 'Need Server • Contact Developer')}
    </div>
  )
}