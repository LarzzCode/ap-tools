import { motion } from 'motion/react'
import { Link } from 'react-router'
import {
  Compass,
  LoaderCircle,
  MessageSquareHeart,
  RefreshCcw,
  Server,
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
      <div className="ios-card flex items-center gap-3 px-4 py-3">
        <LoaderCircle
          size={17}
          className="animate-spin text-[var(--primary)]"
        />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          {t(
            'Memeriksa koneksi jalur server media...',
            'Checking media server connection...',
          )}
        </p>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card flex items-center gap-3 border-green-500/25 bg-green-500/5 px-4 py-3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/15 text-[var(--success)]">
          <Wifi size={16} />
        </div>
        <p className="text-xs font-semibold text-[var(--text-primary)]">
          {t('Server Media Aktif & Siap Digunakan', 'Media Server Active & Ready')} • v
          {health?.version ?? '0.2.0'}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="ios-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Server size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {t(
                'Fitur Eksklusif Berbasis Server • Hubungi Developer',
                'Dedicated Server Feature • Contact Developer',
              )}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
              {t(
                'Alat ini membutuhkan akses server khusus untuk mengolah video & audio berkecepatan tinggi. Hubungi developer untuk request akses server, atau nikmati alat instan browser lainnya!',
                'This tool uses a dedicated server engine for high-speed video & audio processing. Contact the developer to request server access, or enjoy our instant browser utilities!',
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap shrink-0 items-center gap-2">
          <Link
            to="/feedback"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
          >
            <MessageSquareHeart size={13} />
            {t('Hubungi Developer', 'Contact Developer')}
          </Link>

          <button
            type="button"
            onClick={() => {
              void onRetry()
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
          >
            <RefreshCcw size={13} />
            {t('Cek Koneksi', 'Check Server')}
          </button>

          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)]"
          >
            <Compass size={13} />
            {t('Alat Instan', 'Instant Tools')}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}