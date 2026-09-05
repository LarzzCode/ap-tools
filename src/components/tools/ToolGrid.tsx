import { motion } from 'motion/react'

import type { Tool } from '../../types/tool'
import ToolCard from './ToolCard'


interface ToolGridProps {
  tools: Tool[]
  isFavorite: (toolId: string) => boolean
  onToggleFavorite: (toolId: string) => void
}

export default function ToolGrid({
  tools,
  isFavorite,
  onToggleFavorite,
}: ToolGridProps) {
  return (
    <motion.div
      layout
      className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {tools.map((tool, index) => (
        <motion.div
          key={tool.id}
          layout
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: index * 0.05,
          }}
        >
          <ToolCard
            tool={tool}
            isFavorite={isFavorite(tool.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}