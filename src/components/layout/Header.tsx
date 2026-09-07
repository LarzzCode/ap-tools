import { Boxes } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import ThemeToggle from '../ui/ThemeToggle'

export default function Header() {
  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-[var(--border)]
        bg-[color:var(--background)]
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
          <div
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl
              bg-[var(--primary-soft-strong)]
              text-[var(--primary-strong)]
            "
          >
            <Boxes size={19} />
          </div>

          <span
            className="
              text-base font-semibold tracking-tight
              text-[var(--text-primary)]
            "
          >
            Ditya Tools
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/tools"
              className={({ isActive }) =>
                `
                  rounded-xl px-4 py-2
                  text-sm font-medium
                  transition
                  ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
                  }
                `
              }
            >
              Tools
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `
                  rounded-xl px-4 py-2
                  text-sm font-medium
                  transition
                  ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
                  }
                `
              }
            >
              About
            </NavLink>
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}