import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Star,
  Upload,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'

import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../hooks/useLanguage'
import type { Tool } from '../types/tool'
import { formatFileSize } from '../utils/file'

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

function getRecommendedToolsForFile(file: File): Tool[] {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const ids = [
      'pdf-compressor',
      'pdf-merge',
      'pdf-split',
      'pdf-organizer',
      'pdf-sign',
    ]
    return tools.filter((t) => ids.includes(t.id))
  }

  if (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp)$/i.test(name)
  ) {
    const ids = [
      'ktp-watermark',
      'remove-background',
      'pas-foto',
      'image-compressor',
      'aspect-cropper',
      'image-stitcher',
      'image-to-pdf',
      'image-privacy',
      'qr-scanner',
    ]
    return tools.filter((t) => ids.includes(t.id))
  }

  if (
    type.startsWith('video/') ||
    type.startsWith('audio/') ||
    /\.(mp4|mkv|mov|webm|mp3|wav|m4a)$/i.test(name)
  ) {
    return tools.filter((t) => t.id === 'media-converter')
  }

  if (type.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) {
    return tools.filter((t) => t.id === 'text-utilities')
  }

  return tools.slice(0, 6)
}

export default function Home() {
  const { language, t } = useLanguage()
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [smartFile, setSmartFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const dailyTools = useMemo(() => getDailyRandomTools(tools, 3), [])

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) => favoriteIds.includes(tool.id))
  }, [favoriteIds])

  const matchingTools = useMemo(() => {
    if (!smartFile) return []
    return getRecommendedToolsForFile(smartFile)
  }, [smartFile])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) {
      setSmartFile(selected)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) {
      setSmartFile(dropped)
    }
  }

  return (
    <main>
      {/* Clean iOS Hero with Option 3: Smart File Drop */}
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
              'Pilih file Anda di bawah atau langsung gunakan alat pilihan hari ini — tanpa iklan, tanpa login.',
              'Drop a file below or pick a featured utility — no ads, no login.',
            )}
          </p>

          <input
            id="home-smart-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,video/*,audio/*,text/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Option 3: Smart File Dropzone */}
          <div className="mx-auto mt-6 max-w-xl text-left">
            {!smartFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={`ios-card flex cursor-pointer items-center justify-between gap-4 border-2 border-dashed px-5 py-4 transition ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'hover:border-[var(--primary-border)]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {t(
                      'Punya foto, KTP, atau dokumen PDF?',
                      'Have a photo, ID card, or PDF file?',
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {t(
                      'Ketuk atau tarik file ke sini — otomatis kami pilihkan alat yang cocok.',
                      'Tap or drop any file here — we’ll suggest the exact tools for it.',
                    )}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs">
                  <Upload size={14} />
                  {t('Pilih File', 'Choose File')}
                </span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="ios-card p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[var(--primary)]">
                      {t('File Terdeteksi:', 'Detected File:')} {smartFile.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatFileSize(smartFile.size)} •{' '}
                      {t(
                        `${matchingTools.length} alat cocok untuk file ini`,
                        `${matchingTools.length} matching utilities`,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSmartFile(null)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label="Clear file"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {matchingTools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                    >
                      <span className="truncate">
                        {language === 'id' ? tool.nameId : tool.name}
                      </span>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-[var(--text-muted)]"
                      />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
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