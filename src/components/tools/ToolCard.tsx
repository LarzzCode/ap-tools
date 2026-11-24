import { ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import { isToolNew, type Tool, type ToolCategory } from '../../types/tool'
import ToolIcon from './ToolIcon'

interface ToolCardProps {
  tool: Tool
  isFavorite: boolean
  onToggleFavorite: (toolId: string) => void
}

const CATEGORY_STYLES: Record<
  ToolCategory,
  {
    labelId: string
    labelEn: string
    iconBg: string
    iconText: string
  }
> = {
  image: {
    labelId: 'Gambar',
    labelEn: 'Image',
    iconBg: 'bg-sky-500/12 dark:bg-sky-400/18',
    iconText: 'text-sky-600 dark:text-sky-400',
  },
  pdf: {
    labelId: 'PDF',
    labelEn: 'PDF',
    iconBg: 'bg-blue-600/12 dark:bg-blue-400/18',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  links: {
    labelId: 'QR & Link',
    labelEn: 'QR & Link',
    iconBg: 'bg-emerald-500/12 dark:bg-emerald-400/18',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  },
  text: {
    labelId: 'Teks',
    labelEn: 'Text',
    iconBg: 'bg-amber-500/14 dark:bg-amber-400/18',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
  media: {
    labelId: 'Media',
    labelEn: 'Media',
    iconBg: 'bg-rose-500/12 dark:bg-rose-400/18',
    iconText: 'text-rose-600 dark:text-rose-400',
  },
}

export default function ToolCard({
  tool,
  isFavorite,
  onToggleFavorite,
}: ToolCardProps) {
  const { language, t } = useLanguage()

  const displayName = language === 'id' ? tool.nameId : tool.name
  const displayDescription =
    language === 'id' ? tool.descriptionId : tool.description
  const style = CATEGORY_STYLES[tool.category]
  const categoryLabel = language === 'id' ? style.labelId : style.labelEn
  const isBrowser = tool.runtime === 'browser'
  const showNewBadge = isToolNew(tool, tools)

  return (
    <article
      className="
        ios-card
        group relative flex h-full flex-col justify-between
        p-4 sm:p-5
        transition duration-150
        hover:-translate-y-0.5 hover:border-[var(--primary-border)]
        active:scale-[0.985]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          to={tool.path}
          className="flex min-w-0 flex-1 items-start gap-3.5 after:absolute after:inset-0 after:rounded-[20px] after:content-['']"
        >
          <div
            className={`
              flex h-12 w-12 shrink-0
              items-center justify-center
              rounded-[15px]
              ${style.iconBg}
              ${style.iconText}
              transition-transform duration-150
              group-hover:scale-105
            `}
          >
            <ToolIcon toolId={tool.id} size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3
                className="
                  truncate text-[15px] font-bold tracking-tight
                  text-[var(--text-primary)]
                  transition-colors
                  group-hover:text-[var(--primary)]
                "
              >
                {displayName}
              </h3>

              {showNewBadge && (
                <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                  NEW
                </span>
              )}

              <ChevronRight
                size={15}
                className="
                  shrink-0 text-[var(--text-muted)]
                  opacity-60 transition
                  group-hover:translate-x-0.5
                  group-hover:text-[var(--primary)]
                  group-hover:opacity-100
                "
              />
            </div>

            <p
              className="
                mt-1 line-clamp-2
                text-xs leading-5
                text-[var(--text-secondary)]
              "
            >
              {displayDescription}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(tool.id)
          }}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? t(
                  `Hapus ${displayName} dari favorit`,
                  `Remove ${displayName} from favorites`,
                )
              : t(
                  `Simpan ${displayName} ke favorit`,
                  `Add ${displayName} to favorites`,
                )
          }
          className={`
            relative z-10 flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-full
            transition
            active:scale-90
            ${
              isFavorite
                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]'
            }
          `}
        >
          <Star
            size={15}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-[var(--border)]/60 pt-2.5 text-[11px] font-medium text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isBrowser ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
            }`}
          />
          {isBrowser
            ? t('Instan di Browser', 'In-Browser')
            : t('Butuh Server • Hubungi Dev', 'Need Server • Contact Dev')}
        </span>

        <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
          {categoryLabel}
        </span>
      </div>
    </article>
  )
}