import { useMemo, useState } from 'react'
import { Clock, Search, SearchX, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import ToolGrid from '../components/tools/ToolGrid'
import ToolIcon from '../components/tools/ToolIcon'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import { useRecentTools } from '../hooks/useRecentTools'
import {
  isToolNew,
  type Tool,
  type ToolCategory,
  type ToolRuntime,
} from '../types/tool'

type CategoryFilter = 'all' | ToolCategory
type RuntimeFilter = 'all' | ToolRuntime

const VALID_CATEGORIES = new Set<CategoryFilter>([
  'all',
  'image',
  'pdf',
  'links',
  'text',
  'media',
])

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [runtime, setRuntime] = useState<RuntimeFilter>('all')

  const rawCategoryParam = (searchParams.get('category') ?? 'all') as CategoryFilter
  const category: CategoryFilter = VALID_CATEGORIES.has(rawCategoryParam)
    ? rawCategoryParam
    : 'all'

  function setCategory(nextCategory: CategoryFilter) {
    if (nextCategory === 'all') {
      searchParams.delete('category')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ category: nextCategory }, { replace: true })
    }

    if (typeof window !== 'undefined' && window.scrollY > 260) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }

  const { language, t } = useLanguage()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { recentIds, clearRecentTools } = useRecentTools()

  const recentTools = useMemo(() => {
    return recentIds
      .map((id) => tools.find((tool) => tool.id === id))
      .filter((item): item is Tool => Boolean(item))
  }, [recentIds])

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
    .sort((a, b) => {
      const aNew = isToolNew(a, tools) ? 1 : 0
      const bNew = isToolNew(b, tools) ? 1 : 0
      return bNew - aNew
    })
  }, [searchQuery, category, runtime])

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div>
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

        {/* Feature #12: Recently Used Tools Bar */}
        {recentTools.length > 0 && (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
                <Clock size={14} className="text-[var(--primary)]" />
                <span>{t('Terakhir Dipakai', 'Recently Used')}</span>
              </div>

              <button
                type="button"
                onClick={clearRecentTools}
                className="text-[11px] font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                {t('Bersihkan', 'Clear')}
              </button>
            </div>

            <div className="mt-2.5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 no-scrollbar">
              {recentTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                >
                  <span className="text-[var(--primary)]">
                    <ToolIcon toolId={tool.id} size={14} />
                  </span>
                  <span>{language === 'id' ? tool.nameId : tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

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
                    ['local-service', t('Butuh Server', 'Need Server')],
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
        </div>

        {/* Sticky iOS Category Filter Bar — stays reachable even when scrolled deep down */}
        <div className="sticky top-14 z-30 -mx-4 mt-3 bg-[var(--background)]/88 px-4 py-2.5 backdrop-blur-md sm:top-16 sm:mx-0 sm:px-0">
          <div className="flex overflow-x-auto no-scrollbar">
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

        <div className="mt-6">
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
      </div>
    </main>
  )
}