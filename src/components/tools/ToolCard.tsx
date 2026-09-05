import { ArrowUpRight, Star } from 'lucide-react'
import { Link } from 'react-router'

import type { Tool } from '../../types/tool'
import RuntimeBadge from './RuntimeBadge'
import ToolIcon from './ToolIcon'
import { motion } from 'motion/react'

interface ToolCardProps {
  tool: Tool
  isFavorite: boolean
  onToggleFavorite: (toolId: string) => void
}

export default function ToolCard({
  tool,
  isFavorite,
  onToggleFavorite,
}: ToolCardProps) {
  return (
    <motion.article
      whileHover={{
        y: -4,
      }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
      }}
      className="
        group relative
        rounded-2xl
        border border-[var(--border)]
        bg-[var(--surface)]
        p-5
        transition-colors duration-200
        hover:border-[var(--primary-border)]
        hover:shadow-lg
        hover:shadow-sky-500/5
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-xl
            border border-[var(--primary-border)]
            bg-[var(--primary-soft)]
            text-[var(--primary-text)]
          "
        >
          <ToolIcon toolId={tool.id} />
        </div>

        <motion.button
          type="button"
          onClick={() => onToggleFavorite(tool.id)}
          whileTap={{
            scale: 0.82,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 22,
          }}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${tool.name} from favorites`
              : `Add ${tool.name} to favorites`
          }
          className={`
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            transition-colors
            ${
              isFavorite
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)]'
            }
          `}
        >
          <motion.div
            animate={{
              rotate: isFavorite ? 72 : 0,
              scale: isFavorite ? 1.08 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 22,
            }}
          >
            <Star
              size={17}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </motion.div>
        </motion.button>
      </div>

      <Link
        to={tool.path}
        className="mt-5 block"
      >
        <div className="flex items-center gap-2">
          <h3
            className="
              text-base font-semibold
              text-[var(--text-primary)]
            "
          >
            {tool.name}
          </h3>

          <ArrowUpRight
            size={15}
            className="
              text-[var(--text-muted)]
              opacity-0
              transition
              group-hover:translate-x-0.5
              group-hover:-translate-y-0.5
              group-hover:opacity-100
            "
          />
        </div>

        <p
          className="
            mt-2 min-h-10
            text-sm leading-5
            text-[var(--text-secondary)]
          "
        >
          {tool.description}
        </p>
      </Link>

      <div className="mt-5">
        <RuntimeBadge runtime={tool.runtime} />
      </div>
    </motion.article>
  )
}