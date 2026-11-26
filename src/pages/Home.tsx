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
  ShieldCheck,
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
import { setPendingSmartFile } from '../lib/smartFileStore'
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
      'pdf-redactor',
      'pdf-compressor',
      'pdf-to-image',
      'pdf-merge',
      'pdf-split',
      'pdf-organizer',
      'pdf-sign',
      'p2p-wormhole',
    ]
    return tools.filter((t) => ids.includes(t.id))
  }

  if (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp)$/i.test(name)
  ) {
    const ids = [
      'photo-upscaler',
      'ktp-watermark',
      'privacy-blur-brush',
      'document-scanner',
      'signature-extractor',
      'remove-background',
      'pas-foto',
      'carousel-splitter',
      'photo-collage',
      'live-photobooth',
      'twibbon-maker',
      'device-mockup',
      'image-compressor',
      'aspect-cropper',
      'image-stitcher',
      'color-palette',
      'image-to-pdf',
      'image-privacy',
      'qr-scanner',
      'p2p-wormhole',
    ]
    return tools.filter((t) => ids.includes(t.id))
  }

  if (
    type.startsWith('video/') ||
    type.startsWith('audio/') ||
    /\.(mp4|mkv|mov|webm|mp3|wav|m4a|ogg|opus|flac)$/i.test(name)
  ) {
    return tools.filter(
      (t) =>
        t.id === 'audio-transcriber' ||
        t.id === 'voice-changer' ||
        t.id === 'media-converter',
    )
  }

  if (type.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) {
    return tools.filter(
      (t) =>
        t.id === 'spin-wheel' ||
        t.id === 'text-utilities' ||
        t.id === 'teleprompter',
    )
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
      setPendingSmartFile(selected)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) {
      setSmartFile(dropped)
      setPendingSmartFile(dropped)
    }
  }

  return (
    <main>
      {/* Prominent iOS Hero Spotlight — Designed to be the primary visual focal point on mobile & desktop */}
      <section className="relative flex min-h-[70dvh] flex-col justify-center overflow-hidden px-4 pt-6 pb-8 sm:min-h-0 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-6 -z-10 h-64 w-80 -translate-x-1/2 rounded-full bg-[var(--primary)]/15 blur-3xl sm:w-[28rem]"
        />

        <div className="mx-auto w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--primary-border)] bg-[var(--surface)] p-6 text-center shadow-md sm:p-10">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
              <ShieldCheck size={14} />
              {t(
                '100% PRIVAT DI BROWSER • TANPA IKLAN',
                '100% PRIVATE IN-BROWSER • ZERO ADS',
              )}
            </p>

            <h1 className="mt-2.5 text-[2rem] leading-[1.15] font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              {t('Alat Harian Anda,', 'Your Everyday Tools,')}{' '}
              <span className="block text-[var(--primary)] sm:inline">
                {t('Cepat & Privat.', 'Fast & Private.')}
              </span>
            </h1>

            <p className="mx-auto mt-3.5 max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base sm:leading-7">
              {t(
                `Kumpulan ${tools.length} alat praktis untuk proteksi KTP, edit foto, kompres & rapikan PDF, buat CV ATS, hingga kartu QR — langsung siap pakai tanpa perlu login.`,
                `A collection of ${tools.length} practical utilities for ID protection, photo editing, PDF compression, ATS resumes, and QR cards — ready instantly without login.`,
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

            {/* Option 3: Smart File Drop inside the Hero Spotlight */}
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
                  className={`flex cursor-pointer flex-col items-center justify-between gap-3 rounded-2xl border-2 border-dashed bg-[var(--surface-soft)] px-4 py-4 text-center transition sm:flex-row sm:px-5 sm:text-left ${
                    isDragging
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] sm:text-sm">
                      {t(
                        'Punya foto, KTP, atau dokumen PDF?',
                        'Have a photo, ID card, or PDF file?',
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)] sm:text-xs">
                      {t(
                        'Pilih file di sini — otomatis kami pilihkan & muat alat yang cocok.',
                        'Pick any file here — we’ll suggest & auto-load the right tool.',
                      )}
                    </p>
                  </div>

                  <span className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs sm:w-auto sm:rounded-full sm:py-2">
                    <Upload size={14} />
                    {t('Pilih File Otomatis', 'Choose File')}
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--primary-border)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[var(--primary)]">
                        {t('File Siap Dibawa:', 'File Ready to Load:')}{' '}
                        {smartFile.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {formatFileSize(smartFile.size)} •{' '}
                        {t(
                          'Ketuk alat di bawah, file ini otomatis langsung masuk',
                          'Tap any tool below to auto-load this file inside it',
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSmartFile(null)
                        setPendingSmartFile(null)
                      }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content below Hero: Favorites + 3 Daily Random Tools */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 pt-2 pb-20 sm:px-6 lg:px-8">
        {/* Favorites Section */}
        <AnimatePresence>
          {favoriteTools.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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