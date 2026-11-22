import { useMemo } from 'react'
import { MotionConfig } from 'motion/react'
import { Link, Outlet, useLocation } from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import ToolGuide from '../tools/ToolGuide'
import Header from './Header'

export default function AppLayout() {
  usePageMeta()

  const location = useLocation()
  const { t } = useLanguage()

  const activeTool = useMemo(() => {
    return tools.find((tool) => tool.path === location.pathname) ?? null
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Header />

        <div className="flex-1">
          <Outlet />
          {activeTool && <ToolGuide tool={activeTool} />}
        </div>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)]/70 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.svg"
                alt="Ditya Tools"
                className="h-6 w-6 rounded-lg"
              />
              <span className="font-semibold text-[var(--text-primary)]">
                Ditya Tools
              </span>
              <span>•</span>
              <span>
                {t(
                  'Tanpa iklan. Tanpa akun. Privasi terjaga.',
                  'No ads. No account. Private by design.',
                )}
              </span>
            </div>

            <div className="flex items-center gap-5 font-medium text-[var(--text-secondary)]">
              <Link
                to="/tools"
                className="transition hover:text-[var(--primary)]"
              >
                {t('Semua Alat', 'All Tools')}
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
                {t('Kebijakan Privasi', 'Privacy Policy')}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}