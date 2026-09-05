import { Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
       whileTap={{
        scale: 0.88,
        rotate: 12,
      }}
      aria-label={
        isDark
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      className="
        flex h-10 w-10 items-center justify-center
        rounded-xl
        border border-[var(--border)]
        bg-[var(--surface)]
        text-[var(--text-secondary)]
        transition
        hover:border-[var(--primary-border)]
        hover:bg-[var(--primary-soft)]
        hover:text-[var(--primary-text)]
      "
    >
      <motion.div
        key={theme}
        initial={{
          opacity: 0,
          rotate: -45,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: 1,
        }}
      >
        {isDark ? (
          <Sun size={18} />
        ) : (
          <Moon size={18} />
        )}
      </motion.div>
    </motion.button>
  )
}