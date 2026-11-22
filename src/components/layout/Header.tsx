import { Link, NavLink } from 'react-router'

import { useLanguage } from '../../hooks/useLanguage'
import ThemeToggle from '../ui/ThemeToggle'

export default function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header
      className="
        ios-glass
        sticky top-0 z-50
        border-b border-[var(--border)]
      "
    >
      <div
        className="
          mx-auto flex h-16 max-w-7xl
          items-center justify-between
          px-4 sm:px-6 lg:px-8
        "
      >
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src="/favicon.svg"
            alt="Ditya Tools"
            className="h-9 w-9 rounded-[11px] shadow-xs"
          />

          <div className="flex flex-col">
            <span
              className="
                text-base font-semibold tracking-tight
                text-[var(--text-primary)]
              "
            >
              Ditya Tools
            </span>
            <span className="hidden text-[11px] text-[var(--text-muted)] sm:inline">
              {t('Utilitas Harian Privat', 'Private Everyday Utilities')}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <nav
            aria-label={t('Navigasi utama', 'Main navigation')}
            className="ios-segmented flex items-center gap-0.5"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `
                  rounded-full px-3 py-1.5
                  text-xs font-semibold sm:text-sm
                  transition
                  ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `
              }
            >
              {t('Beranda', 'Home')}
            </NavLink>

            <NavLink
              to="/tools"
              className={({ isActive }) =>
                `
                  rounded-full px-3 py-1.5
                  text-xs font-semibold sm:text-sm
                  transition
                  ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `
              }
            >
              {t('Semua Alat', 'Tools')}
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `
                  hidden rounded-full px-3 py-1.5
                  text-xs font-semibold sm:inline-block sm:text-sm
                  transition
                  ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `
              }
            >
              {t('Tentang', 'About')}
            </NavLink>
          </nav>

          {/* iOS Segmented Language Switcher */}
          <div
            role="group"
            aria-label={t('Pilih bahasa', 'Select language')}
            className="ios-segmented flex items-center"
          >
            <button
              id="lang-switch-id"
              type="button"
              onClick={() => setLanguage('id')}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                language === 'id'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              ID
            </button>
            <button
              id="lang-switch-en"
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                language === 'en'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              EN
            </button>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}