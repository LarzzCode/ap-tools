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
    <div
      className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {tools.map((tool) => (
        <div key={tool.id}>
          <ToolCard
            tool={tool}
            isFavorite={isFavorite(tool.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ))}
    </div>
  )
}