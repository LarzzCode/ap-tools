import { ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'

import { useLanguage } from '../../hooks/useLanguage'
import type { Tool, ToolCategory } from '../../types/tool'
import RuntimeBadge from './RuntimeBadge'
import ToolIcon from './ToolIcon'

interface ToolCardProps {
  tool: Tool
  isFavorite: boolean
  onToggleFavorite: (toolId: string) => void
}

const CATEGORY_LABELS: Record<ToolCategory, { id: string; en: string }> = {
  image: { id: 'Gambar & Foto', en: 'Image & Photo' },
  pdf: { id: 'Dokumen PDF', en: 'PDF Document' },
  links: { id: 'QR & Tautan', en: 'QR & Links' },
  text: { id: 'Teks', en: 'Text' },
  media: { id: 'Video & Audio', en: 'Video & Audio' },
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
  const categoryLabel =
    language === 'id'
      ? CATEGORY_LABELS[tool.category].id
      : CATEGORY_LABELS[tool.category].en

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 30,
      }}
      className="
        ios-card
        group relative flex h-full flex-col justify-between
        p-5 sm:p-6
        hover:border-[var(--primary-border)]
      "
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-[15px]
                border border-[var(--primary-border)]
                bg-[var(--primary-soft)]
                text-[var(--primary)]
                shadow-xs
              "
            >
              <ToolIcon toolId={tool.id} size={22} />
            </div>

            <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              {categoryLabel}
            </span>
          </div>

          <motion.button
            type="button"
            onClick={() => onToggleFavorite(tool.id)}
            whileTap={{ scale: 0.85 }}
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
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-full
              transition-colors
              ${
                isFavorite
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <Star
              size={17}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </motion.button>
        </div>

        <Link
          to={tool.path}
          className="mt-4 block"
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              className="
                text-base font-bold tracking-tight
                text-[var(--text-primary)]
                group-hover:text-[var(--primary)]
                transition-colors
              "
            >
              {displayName}
            </h3>

            <ChevronRight
              size={17}
              className="
                shrink-0 text-[var(--text-muted)]
                transition-transform
                group-hover:translate-x-0.5
                group-hover:text-[var(--primary)]
              "
            />
          </div>

          <p
            className="
              mt-2.5
              text-sm leading-6
              text-[var(--text-secondary)]
            "
          >
            {displayDescription}
          </p>
        </Link>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3.5">
        <RuntimeBadge runtime={tool.runtime} />

        <Link
          to={tool.path}
          className="text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          {t('Buka Alat', 'Open Tool')}
        </Link>
      </div>
    </motion.article>
  )
}