import { useMemo, useState } from 'react'
import {
  Search,
  SearchX,
  Star,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import type { ToolCategory } from '../types/tool'

const HOME_CATEGORIES: Array<{
  id: 'all' | ToolCategory
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | ToolCategory
  >('all')

  const { language, t } = useLanguage()
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites()

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tools.filter((tool) => {
      if (
        !query &&
        selectedCategory !== 'all' &&
        tool.category !== selectedCategory
      ) {
        return false
      }

      if (!query) {
        return true
      }

      const searchableText = [
        tool.name,
        tool.nameId,
        tool.description,
        tool.descriptionId,
        tool.category,
        ...tool.keywords,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [searchQuery, selectedCategory])

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) => favoriteIds.includes(tool.id))
  }, [favoriteIds])

  const isSearching = searchQuery.trim().length > 0

  return (
    <main>
      {/* Clean, Airy iOS Spotlight Header */}
      <section className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6 sm:pt-12 sm:pb-10 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-80 -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {t('Alat Harian Anda,', 'Your Everyday Tools,')}{' '}
            <span className="text-[var(--primary)]">
              {t('Cepat & Privat.', 'Fast & Private.')}
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            {t(
              'Pilih alat dan proses langsung di perangkat Anda — tanpa iklan, tanpa login.',
              'Pick a utility and process directly on your device — no ads, no login.',
            )}
          </p>

          {/* iOS Spotlight Search Bar */}
          <div className="ios-card mx-auto mt-6 flex max-w-xl items-center gap-3 px-4 py-3 focus-within:border-[var(--primary-border)]">
            <Search
              size={18}
              className="shrink-0 text-[var(--text-muted)]"
            />

            <input
              id="home-spotlight-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t(
                'Cari alat (Watermark KTP, Pas Foto, PDF, QR Wi-Fi)...',
                'Search tools (ID Watermark, Pas Foto, PDF, Wi-Fi QR)...',
              )}
              aria-label={t('Cari alat', 'Search tools')}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('Hapus pencarian', 'Clear search')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* iOS Segmented Category Filter (Swipeable single row on mobile) */}
          {!isSearching && (
            <div className="-mx-4 mt-5 flex justify-start overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:justify-center sm:px-0">
              <div className="ios-segmented inline-flex shrink-0 flex-nowrap gap-1">
                {HOME_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    id={`home-category-${category.id}`}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === category.id
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {language === 'id' ? category.labelId : category.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Favorites Section */}
      <AnimatePresence>
        {!isSearching && favoriteTools.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"
          >
            <div className="mb-3.5 flex items-center gap-2">
              <Star
                size={16}
                fill="currentColor"
                className="text-[var(--primary)]"
              />
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                {t('Favorit', 'Favorites')}
              </h2>
            </div>

            <ToolGrid
              tools={favoriteTools}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Toolbox Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {isSearching && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-secondary)]">
              {t(
                `${filteredTools.length} hasil untuk "${searchQuery}"`,
                `${filteredTools.length} results for "${searchQuery}"`,
              )}
            </h2>
          </div>
        )}

        {filteredTools.length > 0 ? (
          <ToolGrid
            tools={filteredTools}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="ios-card px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <SearchX size={20} />
            </div>

            <h3 className="mt-3 text-sm font-bold text-[var(--text-primary)]">
              {t('Alat tidak ditemukan', 'No tools found')}
            </h3>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
              {t(
                `Tidak ada yang cocok dengan "${searchQuery}".`,
                `No match for "${searchQuery}".`,
              )}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}