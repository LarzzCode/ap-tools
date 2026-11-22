import { useMemo } from 'react'
import {
  ArrowRight,
  FileText,
  Film,
  Images,
  QrCode,
  Sparkles,
  Star,
  Type,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import type { Tool, ToolCategory } from '../types/tool'

function getDailyRandomTools(allTools: Tool[], count = 3): Tool[] {
  const now = new Date()
  let seed =
    now.getFullYear() * 10000 +
    (now.getMonth() + 1) * 100 +
    now.getDate()

  const nextRand = () => {
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

const CATEGORY_DOCK: Array<{
  id: ToolCategory
  labelId: string
  labelEn: string
  icon: typeof Images
  iconBg: string
  iconText: string
}> = [
  {
    id: 'image',
    labelId: 'Gambar & KTP',
    labelEn: 'Image & ID',
    icon: Images,
    iconBg: 'bg-sky-500/14 dark:bg-sky-400/20',
    iconText: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'pdf',
    labelId: 'PDF & Invoice',
    labelEn: 'PDF & Invoice',
    icon: FileText,
    iconBg: 'bg-blue-600/14 dark:bg-blue-400/20',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'links',
    labelId: 'QR & Wi-Fi',
    labelEn: 'QR & Wi-Fi',
    icon: QrCode,
    iconBg: 'bg-emerald-500/14 dark:bg-emerald-400/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'text',
    labelId: 'Teks',
    labelEn: 'Text',
    icon: Type,
    iconBg: 'bg-amber-500/15 dark:bg-amber-400/20',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'media',
    labelId: 'Media',
    labelEn: 'Media',
    icon: Film,
    iconBg: 'bg-rose-500/14 dark:bg-rose-400/20',
    iconText: 'text-rose-600 dark:text-rose-400',
  },
]

export default function Home() {
  const { language, t } = useLanguage()
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites()

  const dailyTools = useMemo(() => getDailyRandomTools(tools, 3), [])

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) => favoriteIds.includes(tool.id))
  }, [favoriteIds])

  const categoryCounts = useMemo(() => {
    const counts: Record<ToolCategory, number> = {
      image: 0,
      pdf: 0,
      links: 0,
      text: 0,
      media: 0,
    }
    for (const tool of tools) {
      counts[tool.category]++
    }
    return counts
  }, [])

  return (
    <main>
      {/* Clean iOS Hero with Category Dock */}
      <section className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6 sm:pt-12 sm:pb-10 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-80 -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {t('Alat Harian Anda,', 'Your Everyday Tools,')}{' '}
            <span className="text-[var(--primary)]">
              {t('Cepat & Privat.', 'Fast & Private.')}
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            {t(
              'Pilih kategori atau alat di bawah dan proses langsung di perangkat Anda — tanpa iklan, tanpa login.',
              'Pick a category or tool below and process directly on your device — no ads, no login.',
            )}
          </p>

          {/* Option 1: iOS Category Squircle Dock */}
          <div className="mx-auto mt-7 max-w-2xl">
            <div className="ios-card grid grid-cols-5 gap-1.5 p-2.5 sm:gap-3 sm:p-4">
              {CATEGORY_DOCK.map((cat) => {
                const Icon = cat.icon
                const count = categoryCounts[cat.id]

                return (
                  <Link
                    key={cat.id}
                    id={`home-dock-${cat.id}`}
                    to={`/tools?category=${cat.id}`}
                    className="group flex flex-col items-center rounded-2xl p-2 transition hover:bg-[var(--surface-soft)] active:scale-95"
                  >
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center rounded-[16px] ${cat.iconBg} ${cat.iconText} shadow-2xs transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-14 sm:w-14 sm:rounded-[18px]`}
                    >
                      <Icon size={23} strokeWidth={1.9} />
                      <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--surface)] px-1 text-[10px] font-bold text-[var(--text-secondary)] shadow-xs">
                        {count}
                      </span>
                    </div>

                    <span className="mt-2 line-clamp-1 text-center text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] sm:text-xs">
                      {language === 'id' ? cat.labelId : cat.labelEn}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content: Favorites + 3 Daily Random Tools + Link to All Tools */}
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
    </main>
  )
}