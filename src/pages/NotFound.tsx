import { ArrowLeft, Home, SearchX } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'

import { useLanguage } from '../hooks/useLanguage'

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="ios-card max-w-lg p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <SearchX size={28} />
        </div>

        <p className="mt-5 text-sm font-bold text-[var(--primary)]">404</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {t('Halaman tidak ditemukan', 'Tool not found')}
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {t(
            'Halaman atau alat yang Anda cari tidak ditemukan atau telah dipindahkan.',
            "The page you're looking for doesn't exist or has moved.",
          )}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            <Home size={16} />
            {t('Kembali ke Beranda', 'Back to Home')}
          </Link>

          <Link
            to="/tools"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
          >
            <ArrowLeft size={16} />
            {t('Lihat Semua Alat', 'Browse Tools')}
          </Link>
        </div>
      </motion.div>
    </main>
  )
}