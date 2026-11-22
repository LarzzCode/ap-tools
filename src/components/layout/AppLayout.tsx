import { useEffect, useMemo } from 'react'
import { MotionConfig } from 'motion/react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigationType,
} from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import ToolGuide from '../tools/ToolGuide'
import Header from './Header'

const SCROLL_STORAGE_PREFIX = 'ditya-scroll:'

export default function AppLayout() {
  usePageMeta()

  const location = useLocation()
  const navigationType = useNavigationType()
  const { t } = useLanguage()

  const activeTool = useMemo(() => {
    return tools.find((tool) => tool.path === location.pathname) ?? null
  }, [location.pathname])

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