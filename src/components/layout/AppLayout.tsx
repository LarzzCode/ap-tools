import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigationType,
} from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { recordRecentToolId } from '../../hooks/useRecentTools'
import {
  consumePendingSmartFile,
  getPendingSmartFile,
} from '../../lib/smartFileStore'
import ToolGuide from '../tools/ToolGuide'
import Header from './Header'

const SCROLL_STORAGE_PREFIX = 'ditya-scroll:'

export default function AppLayout() {
  usePageMeta()

  const location = useLocation()
  const navigationType = useNavigationType()
  const { t } = useLanguage()
  const [autoLoadedFileName, setAutoLoadedFileName] = useState('')

  const activeTool = useMemo(() => {
    return tools.find((tool) => tool.path === location.pathname) ?? null
  }, [location.pathname])

  // Feature #12: Record recently visited tool IDs automatically
  useEffect(() => {
    if (activeTool) {
      recordRecentToolId(activeTool.id)
    }
  }, [activeTool])

  // Feature #9: Auto-Carry pending file from Home Smart File Drop into the opened tool
  useEffect(() => {
    if (!activeTool) return
    const pending = getPendingSmartFile()
    if (!pending) return

    let attempts = 0
    let timerId: number | undefined

    const tryInjectFile = () => {
      attempts += 1
      const fileInput = document.querySelector<HTMLInputElement>(
        'main input[type="file"]',
      )

      if (fileInput) {
        const file = consumePendingSmartFile()
        if (!file) return

        try {
          const dt = new DataTransfer()
          dt.items.add(file)
          fileInput.files = dt.files
          fileInput.dispatchEvent(new Event('change', { bubbles: true }))
          setAutoLoadedFileName(file.name)
        } catch {
          // Ignore if browser restricts programmatic FileList
        }
        return
      }

      if (activeTool.id === 'text-utilities') {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          'main textarea',
        )
        if (textarea) {
          const file = consumePendingSmartFile()
          if (!file) return
          void file.text().then((content) => {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value',
            )?.set
            setter?.call(textarea, content)
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            setAutoLoadedFileName(file.name)
          })
          return
        }
      }

      if (attempts < 15) {
        timerId = window.setTimeout(tryInjectFile, 70)
      }
    }

    timerId = window.setTimeout(tryInjectFile, 50)
    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
      }
    }
  }, [activeTool])

  useEffect(() => {
    if (!autoLoadedFileName) return
    const id = window.setTimeout(() => {
      setAutoLoadedFileName('')
    }, 3400)
    return () => window.clearTimeout(id)
  }, [autoLoadedFileName])

  // Record live scroll position on every page so returning via Back restores exact scroll
  useEffect(() => {
    const key = `${SCROLL_STORAGE_PREFIX}${location.pathname}`

    const handleScroll = () => {
      window.sessionStorage.setItem(key, String(window.scrollY))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])

  // Restore scroll position on POP (Back button) or when returning to catalog pages
  useEffect(() => {
    const key = `${SCROLL_STORAGE_PREFIX}${location.pathname}`
    const saved = window.sessionStorage.getItem(key)
    const isCatalogPage =
      location.pathname === '/' || location.pathname === '/tools'

    if (
      (navigationType === 'POP' || isCatalogPage) &&
      saved !== null
    ) {
      const targetY = Number(saved)
      if (Number.isFinite(targetY) && targetY > 0) {
        const frame = window.requestAnimationFrame(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
        })
        return () => window.cancelAnimationFrame(frame)
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname, navigationType])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col bg-[var(--background)] pb-16 sm:pb-0">
        <Header />

        <AnimatePresence>
          {autoLoadedFileName && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed left-1/2 top-16 z-50 -translate-x-1/2 px-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--primary)] shadow-md">
                <CheckCircle2 size={14} className="shrink-0 text-[var(--success)]" />
                <span className="max-w-[260px] truncate sm:max-w-xs">
                  {t(
                    `File "${autoLoadedFileName}" otomatis dimuat`,
                    `"${autoLoadedFileName}" automatically loaded`,
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1">
          <Outlet />
          {activeTool && <ToolGuide tool={activeTool} />}
        </div>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)]/70 py-7">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-[var(--text-muted)] sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <img
                src="/favicon.svg"
                alt="Ditya Tools"
                className="h-5 w-5 rounded-md"
              />
              <span className="font-bold text-[var(--text-primary)]">
                Ditya Tools
              </span>
              <span>•</span>
              <span>
                {t('Oleh', 'By')}{' '}
                <a
                  href="https://portogilar.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--primary)] hover:underline"
                >
                  Gilar Wahiditya
                </a>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-[var(--text-secondary)]">
              <Link
                to="/tools"
                className="transition hover:text-[var(--primary)]"
              >
                {t('Semua Alat', 'All Tools')}
              </Link>
              <Link
                to="/feedback"
                className="transition hover:text-[var(--primary)]"
              >
                {t('Kirim Saran', 'Feedback')}
              </Link>
              <Link
                to="/about"
                className="transition hover:text-[var(--primary)]"
              >
                {t('Tentang', 'About')}
              </Link>
              <Link
                to="/privacy"
                className="transition hover:text-[var(--primary)]"
              >
                {t('Privasi', 'Privacy')}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}