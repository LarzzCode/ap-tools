import { useMemo, useState } from 'react'

import { motion } from 'motion/react'

import { Search, SearchX, X } from 'lucide-react'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import type { ToolCategory, ToolRuntime } from '../types/tool'

type CategoryFilter = 'all' | ToolCategory
type RuntimeFilter = 'all' | ToolRuntime

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Image' },
  { id: 'pdf', label: 'PDF' },
  { id: 'text', label: 'Text' },
  { id: 'links', label: 'Links' },
  { id: 'media', label: 'Media' },
]

export default function AllTools() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [runtime, setRuntime] = useState<RuntimeFilter>('all')

  const { isFavorite, toggleFavorite } = useFavorites()

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tools.filter((tool) => {
      if (category !== 'all' && tool.category !== category) {
        return false
      }
      if (runtime !== 'all' && tool.runtime !== runtime) {
        return false
      }
      if (!query) return true

      const searchable = [
        tool.name,
        tool.description,
        tool.category,
        ...tool.keywords,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [searchQuery, category, runtime])

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary-text)]">
            Directory
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            All Tools
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            Browse all {tools.length} utilities across image, PDF, text, links, and local media processing.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 focus-within:border-[var(--primary-border)]">
              <Search size={18} className="shrink-0 text-[var(--text-muted)]" />
              <input
                id="all-tools-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by tool name or keyword..."
                aria-label="Filter tools"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear filter"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
              {(
                [
                  ['all', 'All runtimes'],
                  ['browser', 'Browser'],
                  ['local-service', 'Local service'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  id={`all-tools-runtime-${value}`}
                  type="button"
                  onClick={() => setRuntime(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    runtime === value
                      ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                id={`all-tools-category-${tab.id}`}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  category === tab.id
                    ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {filteredTools.length > 0 ? (
            <ToolGrid
              tools={filteredTools}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-text)]">
                <SearchX size={22} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                No matching tools
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
                Try clearing your search or switching category filters.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  )
}