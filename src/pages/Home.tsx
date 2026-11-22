import { useMemo, useState } from 'react'
import {
  Lock,
  Search,
  SearchX,
  Sparkles,
  Star,
  X,
  Zap,
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
      {/* iOS Spotlight Hero Section */}
      <section className="relative overflow-hidden px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-96 -translate-x-1/2 rounded-full bg-[var(--primary)]/12 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            {t('Alat harian Anda,', 'Your everyday tools,')}{' '}
            <span className="text-[var(--primary)]">
              {t('cepat & privat.', 'fast & private.')}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            {t(
              'Kumpulan utilitas praktis untuk mengolah foto, watermark KTP, pas foto, dokumen PDF, invoice, hingga kartu QR Wi-Fi langsung di perangkat Anda. Tanpa iklan, tanpa daftar akun.',
              'Practical utilities for ID photo watermarks, pas foto print sheets, PDF documents, invoices, and Wi-Fi QR cards right on your device. No ads, no accounts.',
            )}
          </p>

          {/* iOS Spotlight Search Bar */}
          <div className="ios-card mx-auto mt-8 flex max-w-2xl items-center gap-3 px-5 py-3.5 focus-within:border-[var(--primary-border)]">
            <Search
              size={19}
              className="shrink-0 text-[var(--text-muted)]"
            />

            <input
              id="home-spotlight-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t(
                'Cari alat (misal: Watermark KTP, Pas Foto, Gabung PDF, QR Wi-Fi)...',
                'Search tools (e.g. ID Watermark, Pas Foto, PDF Merge, Wi-Fi QR)...',
              )}
              aria-label={t('Cari alat', 'Search tools')}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:text-base"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('Hapus pencarian', 'Clear search')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* iOS Feature Highlights */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
              <Lock size={12} className="text-[var(--success)]" />
              {t('Privasi Aman di Perangkat', 'Private on Your Device')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
              <Zap size={12} className="text-[var(--primary)]" />
              {t('Tanpa Iklan Selamanya', 'No Ads Ever')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
              <Sparkles size={12} className="text-[var(--primary)]" />
              {t('Langsung Pakai Tanpa Login', 'Instant Use, No Login')}
            </span>
          </div>
        </motion.div>
      </section>

      {/* Favorites Section */}
      <AnimatePresence>
        {!isSearching && favoriteTools.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Star
                  size={18}
                  fill="currentColor"
                  className="text-[var(--primary)]"
                />

                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {t('Alat Favorit Anda', 'Your Favorites')}
                </h2>
              </div>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t(
                  'Akses cepat ke alat yang paling sering Anda gunakan.',
                  'Quick access to your most-used utilities.',
                )}
              </p>
            </div>

            <ToolGrid
              tools={favoriteTools}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Toolbox */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isSearching
                ? t('HASIL PENCARIAN', 'SEARCH RESULTS')
                : t('KATALOG ALAT', 'TOOLBOX')}
            </p>

            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {isSearching
                ? t(
                    `Hasil untuk "${searchQuery}"`,
                    `Results for "${searchQuery}"`,
                  )
                : t(
                    'Pilih alat dan selesaikan tugas Anda.',
                    'Pick a tool and get it done.',
                  )}
            </h2>

            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {isSearching
                ? t(
                    `${filteredTools.length} alat ditemukan.`,
                    `${filteredTools.length} ${
                      filteredTools.length === 1 ? 'tool' : 'tools'
                    } found.`,
                  )
                : t(
                    `${tools.length} utilitas lengkap dengan panduan langkah demi langkah di setiap halaman.`,
                    `${tools.length} utilities with detailed step-by-step guides on every page.`,
                  )}
            </p>
          </div>

          {!isSearching && (
            <div className="ios-segmented flex flex-wrap gap-1 self-start">
              {HOME_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  id={`home-category-${category.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === category.id
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {language === 'id' ? category.labelId : category.labelEn}
                </button>
              ))}
            </div>
          )}
        </div>

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

            <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">
              {t('Alat tidak ditemukan', 'No tools found')}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {t(
                `Kami tidak menemukan alat yang cocok dengan "${searchQuery}". Coba kata kunci lain.`,
                `We couldn't find a tool matching "${searchQuery}". Try another keyword.`,
              )}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}