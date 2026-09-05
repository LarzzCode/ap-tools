import {
  GripVertical,
  Trash2,
} from 'lucide-react'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { PdfImageItem } from '../../types/imagePdf'
import { formatFileSize } from '../../utils/file'

interface SortableImageCardProps {
  item: PdfImageItem
  index: number
  onRemove: (id: string) => void
}

export default function SortableImageCard({
  item,
  index,
  onRemove,
}: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  })

  const style = {
    transform:
      CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`
        overflow-hidden rounded-2xl
        border
        bg-[var(--surface)]
        transition-shadow
        ${
          isDragging
            ? 'border-[var(--primary)] shadow-xl'
            : 'border-[var(--border)]'
        }
      `}
    >
      <div
        className="
          relative aspect-[4/3]
          overflow-hidden
          bg-[var(--surface-soft)]
        "
      >
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="
            h-full w-full
            object-contain
          "
        />

        <div
          className="
            absolute left-3 top-3
            rounded-lg
            bg-slate-950/75
            px-2 py-1
            text-xs font-semibold
            text-white
            backdrop-blur
          "
        >
          {index + 1}
        </div>
      </div>

      <div
        className="
          flex items-center gap-3
          border-t border-[var(--border)]
          p-3
        "
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.file.name}`}
          className="
            flex h-9 w-9
            shrink-0 touch-none
            items-center justify-center
            rounded-lg
            text-[var(--text-muted)]
            transition
            hover:bg-[var(--primary-soft)]
            hover:text-[var(--primary-text)]
            active:cursor-grabbing
          "
        >
          <GripVertical size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className="
              truncate text-sm font-medium
              text-[var(--text-primary)]
            "
          >
            {item.file.name}
          </p>

          <p
            className="
              mt-1 text-xs
              text-[var(--text-muted)]
            "
          >
            {formatFileSize(item.file.size)}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onRemove(item.id)
          }
          aria-label={`Remove ${item.file.name}`}
          className="
            flex h-9 w-9
            shrink-0 items-center justify-center
            rounded-lg
            text-[var(--text-muted)]
            transition
            hover:bg-red-500/10
            hover:text-[var(--error)]
          "
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}