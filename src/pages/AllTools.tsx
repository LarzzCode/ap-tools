import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Search, SearchX, X } from 'lucide-react'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import type { ToolCategory, ToolRuntime } from '../types/tool'

type CategoryFilter = 'all' | ToolCategory
type RuntimeFilter = 'all' | ToolRuntime

const CATEGORY_TABS: Array<{
  id: CategoryFilter
  labelId: string
  labelEn: string
}> = [
  { id: 'all', labelId: 'Semua', labelEn: 'All' },
  { id: 'image', labelId: 'Gambar & KTP', labelEn: 'Image & ID' },
  { id: 'pdf', labelId: 'PDF & Invoice', labelEn: 'PDF & Invoice' },
  { id: 'links', labelId: 'QR & Wi-Fi', labelEn: 'QR & Wi-Fi' },
  { id: 'text', labelId: 'Teks', labelEn: 'Text' },
  { id: 'media', labelId: 'Media', labelEn: 'Media' },
]

export default function AllTools() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [runtime, setRuntime] = useState<RuntimeFilter>('all')

  const { language, t } = useLanguage()
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
        tool.nameId,
        tool.description,
        tool.descriptionId,
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
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            {t('DIREKTORI LENGKAP', 'DIRECTORY')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {t('Semua Alat Utilitas', 'All Utilities')}
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
            {t(
              `Jelajahi ${tools.length} alat untuk foto, pelindung KTP, dokumen PDF, pembuatan invoice, kartu QR Wi-Fi, pembersih teks, dan konversi media.`,
              `Browse all ${tools.length} utilities across ID protection, photos, PDFs, invoices, Wi-Fi QR cards, text cleanup, and media processing.`,
            )}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="ios-card flex flex-1 items-center gap-3 px-4 py-3 focus-within:border-[var(--primary-border)]">
              <Search size={18} className="shrink-0 text-[var(--text-muted)]" />
              <input
                id="all-tools-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'Cari nama alat atau kata kunci...',
                  'Filter by tool name or keyword...',
                )}
                aria-label={t('Cari alat', 'Filter tools')}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('Bersihkan pencarian', 'Clear filter')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="-mx-4 flex overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
              <div className="ios-segmented inline-flex shrink-0 flex-nowrap">
                {(
                  [
                    ['all', t('Semua Mode', 'All Modes')],
                    ['browser', t('Instan Browser', 'Browser')],
                    ['local-service', t('Pendamping', 'Companion')],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    id={`all-tools-runtime-${value}`}
                    type="button"
                    onClick={() => setRuntime(value)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      runtime === value
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="-mx-4 flex overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <div className="ios-segmented inline-flex shrink-0 flex-nowrap gap-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  id={`all-tools-category-${tab.id}`}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    category === tab.id
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {language === 'id' ? tab.labelId : tab.labelEn}
                </button>
              ))}
            </div>
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
            <div className="ios-card px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <SearchX size={22} />
              </div>
              <h2 className="mt-4 text-base font-bold text-[var(--text-primary)]">
                {t('Tidak ada alat yang cocok', 'No matching tools')}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
                {t(
                  'Coba hapus kata kunci pencarian atau pilih kategori lain.',
                  'Try clearing your search or switching category filters.',
                )}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  )
}