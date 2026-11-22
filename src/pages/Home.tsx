import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Search,
  SearchX,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import type { Tool } from '../types/tool'

function getDailyRandomTools(allTools: Tool[], count = 3): Tool[] {
  const now = new Date()
  let seed =
    now.getFullYear() * 10000 +
    (now.getMonth() + 1) * 100 +
    now.getDate()

  const nextRand = () => {
    // Simple deterministic LCG seeded by YYYYMMDD
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const copy = [...allTools]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }

  return copy.slice(0, count)
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const { t } = useLanguage()
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites()

  const dailyTools = useMemo(() => getDailyRandomTools(tools, 3), [])

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) => favoriteIds.includes(tool.id))
  }, [favoriteIds])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return tools.filter((tool) => {
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
  }, [searchQuery])

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
        </motion.div>
      </section>

      {isSearching ? (
        /* Search Results Mode */
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-secondary)]">
              {t(
                `${searchResults.length} hasil untuk "${searchQuery}"`,
                `${searchResults.length} results for "${searchQuery}"`,
              )}
            </h2>
          </div>

          {searchResults.length > 0 ? (
            <ToolGrid
              tools={searchResults}
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
      ) : (
        /* Default Home View: Favorites + 3 Daily Random Tools + Link to All Tools */
        <div className="mx-auto max-w-7xl space-y-10 px-4 pb-20 sm:px-6 lg:px-8">
          {/* Favorites Section */}
          <AnimatePresence>
            {favoriteTools.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-3.5 flex items-center gap-2">
                  <Star
                    size={16}
                    fill="currentColor"
                    className="text-[var(--primary)]"
                  />
                  <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                    {t('Alat Favorit Anda', 'Your Favorites')}
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

          {/* 3 Daily Random Tools */}
          <section>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--primary)]" />
                <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                  {t('3 Alat Pilihan Hari Ini', "Today's 3 Featured Tools")}
                </h2>
              </div>

              <span className="text-xs text-[var(--text-muted)]">
                {t('Berganti otomatis setiap hari', 'Refreshes daily')}
              </span>
            </div>

            <ToolGrid
              tools={dailyTools}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />

            {/* Link to All Tools Menu below the 3 tools */}
            <div className="mt-8 text-center">
              <Link
                id="home-go-all-tools"
                to="/tools"
                className="ios-card inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]/40"
              >
                <span>
                  {t(
                    `Lihat Seluruh ${tools.length} Alat di Menu Semua Alat`,
                    `Explore All ${tools.length} Utilities in All Tools`,
                  )}
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}