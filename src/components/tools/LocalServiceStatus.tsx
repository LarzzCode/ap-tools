import { motion } from 'motion/react'
import { Link } from 'react-router'

import {
  Compass,
  Laptop,
  LoaderCircle,
  RefreshCcw,
  Wifi,
} from 'lucide-react'

import type { LocalServiceStatus as LocalServiceStatusValue } from '../../hooks/useLocalService'
import { useLanguage } from '../../hooks/useLanguage'
import type { LocalServiceHealth } from '../../lib/localService'

interface LocalServiceStatusProps {
  status: LocalServiceStatusValue
  health: LocalServiceHealth | null
  onRetry: () => void | Promise<void>
}

export default function LocalServiceStatus({
  status,
  health,
  onRetry,
}: LocalServiceStatusProps) {
  const { t } = useLanguage()

  if (status === 'checking') {
    return (
      <div className="ios-card flex items-center gap-3.5 px-5 py-4">
        <LoaderCircle
          size={19}
          className="animate-spin text-[var(--primary)]"
        />

        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t(
              'Memeriksa Pendamping Perangkat...',
              'Checking Device Companion...',
            )}
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t(
              'Menghubungkan ke layanan media di perangkat Anda.',
              'Connecting to the media companion on your device.',
            )}
          </p>
        </div>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card flex items-center gap-3.5 border-green-500/25 bg-green-500/5 px-5 py-4"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/15 text-[var(--success)]">
          <Wifi size={18} />
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t(
              'Pendamping Perangkat Terhubung',
              'Device Companion Connected',
            )}
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t('Siap memproses media', 'Ready for media tasks')} • v
            {health?.version ?? '0.2.0'}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="ios-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Laptop size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {t('Khusus Pendamping Desktop', 'Desktop Companion Feature')}
          </div>

          <p className="mt-2 text-base font-bold text-[var(--text-primary)]">
            {t(
              'Pendamping Perangkat Belum Terhubung',
              'Device Companion Is Not Connected Right Now',
            )}
          </p>

          <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
            {t(
              'Alat media ini memproses video dan audio berukuran besar langsung di komputer pribadi agar tetap cepat dan menjaga privasi Anda. Jika Anda sedang membuka web ini dari smartphone atau pendamping perangkat sedang tidak aktif, Anda tetap dapat menggunakan seluruh alat gambar, PDF, QR, dan teks lainnya secara instan di browser.',
              'This media utility processes large video and audio files through your desktop companion so everything stays fast and private. If you are browsing on a phone or the companion is currently inactive, you can still use all of our image, PDF, QR, and text tools right in your browser.',
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                void onRetry()
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
            >
              <RefreshCcw size={14} />
              {t('Coba Hubungkan Ulang', 'Try Reconnecting')}
            </button>

            <Link
              to="/tools"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
            >
              <Compass size={14} />
              {t('Jelajahi Alat Instan Browser', 'Explore Instant Browser Tools')}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}