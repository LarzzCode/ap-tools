import {
  Home,
  LayoutGrid,
  MessageSquareHeart,
  Sparkles,
} from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { useLanguage } from '../../hooks/useLanguage'
import ThemeToggle from '../ui/ThemeToggle'
import PwaInstallButton from './PwaInstallButton'

export default function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <>
      <header
        className="
          ios-glass
          sticky top-0 z-50
          border-b border-[var(--border)]
        "
      >
        <div
          className="
            mx-auto flex h-14 max-w-7xl
            items-center justify-between
            px-4 sm:h-16 sm:px-6 lg:px-8
          "
        >
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
          >
            <img
              src="/favicon.svg"
              alt="Ditya Tools"
              className="h-8 w-8 shrink-0 rounded-[10px] shadow-xs sm:h-9 sm:w-9"
            />

            <div className="flex min-w-0 flex-col">
              <span
                className="
                  truncate text-sm font-bold tracking-tight
                  text-[var(--text-primary)] sm:text-base
                "
              >
                Ditya Tools
              </span>
              <span className="hidden text-[11px] text-[var(--text-muted)] md:inline">
                {t('Utilitas Harian Privat', 'Private Everyday Utilities')}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Segmented Navigation */}
            <nav
              aria-label={t('Navigasi utama', 'Main navigation')}
              className="ios-segmented hidden items-center gap-0.5 sm:flex"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `
                    rounded-full px-3.5 py-1.5
                    text-xs font-semibold
                    transition
                    ${
                      isActive
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `
                }
              >
                {t('Beranda', 'Home')}
              </NavLink>

              <NavLink
                to="/tools"
                end
                className={({ isActive }) =>
                  `
                    rounded-full px-3.5 py-1.5
                    text-xs font-semibold
                    transition
                    ${
                      isActive
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `
                }
              >
                {t('Semua Alat', 'Tools')}
              </NavLink>

              <NavLink
                to="/feedback"
                className={({ isActive }) =>
                  `
                    rounded-full px-3.5 py-1.5
                    text-xs font-semibold
                    transition
                    ${
                      isActive
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `
                }
              >
                {t('Saran', 'Feedback')}
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `
                    rounded-full px-3.5 py-1.5
                    text-xs font-semibold
                    transition
                    ${
                      isActive
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `
                }
              >
                {t('Tentang', 'About')}
              </NavLink>
            </nav>

            <PwaInstallButton />

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

      {/* Native iOS Mobile Bottom Tab Bar (Android & iOS) */}
      <nav
        aria-label={t('Navigasi bawah mobile', 'Mobile bottom navigation')}
        className="
          ios-glass
          fixed inset-x-0 bottom-0 z-50
          border-t border-[var(--border)]
          pb-[env(safe-area-inset-bottom)]
          sm:hidden
        "
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-4 items-center px-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)]'
              }`
            }
          >
            <Home size={19} strokeWidth={2.1} />
            <span>{t('Beranda', 'Home')}</span>
          </NavLink>

          <NavLink
            to="/tools"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)]'
              }`
            }
          >
            <LayoutGrid size={19} strokeWidth={2.1} />
            <span>{t('Semua Alat', 'Tools')}</span>
          </NavLink>

          <NavLink
            to="/feedback"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)]'
              }`
            }
          >
            <MessageSquareHeart size={19} strokeWidth={2.1} />
            <span>{t('Saran', 'Feedback')}</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)]'
              }`
            }
          >
            <Sparkles size={19} strokeWidth={2.1} />
            <span>{t('Tentang', 'About')}</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}