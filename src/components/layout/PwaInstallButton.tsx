import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Share, Smartphone, X } from 'lucide-react'

import { useLanguage } from '../../hooks/useLanguage'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const isStandaloneMedia = window.matchMedia(
    '(display-mode: standalone)',
  ).matches
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(isStandaloneMedia || nav.standalone)
}

export default function PwaInstallButton() {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(() =>
    checkIsStandalone(),
  )
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowGuideModal(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (isInstalled) {
    return null
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null)
        }
        return
      } catch {
        // Fallback to guide modal
      }
    }
    setShowGuideModal(true)
  }

  return (
    <>
      <button
        id="pwa-install-btn"
        type="button"
        onClick={() => void handleInstallClick()}
        title={t('Pasang Aplikasi di HP/Desktop', 'Install App to Home Screen')}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-2.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
      >
        <Download size={13} />
        <span className="hidden md:inline">
          {t('Pasang App', 'Install App')}
        </span>
      </button>

      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 backdrop-blur-xs sm:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="ios-card w-full max-w-md p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {t(
                        'Pasang Ditya Tools di Layar Utama',
                        'Add Ditya Tools to Home Screen',
                      )}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t(
                        'Akses penuh layaknya aplikasi native tanpa bar browser',
                        'Launch full-screen like a native app anytime',
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* iOS Instructions */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                  <p className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Share size={14} className="text-[var(--primary)]" />
                    {t('iPhone & iPad (Safari)', 'iPhone & iPad (Safari)')}
                  </p>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-[var(--text-secondary)]">
                    <li>
                      {t(
                        'Ketuk ikon Bagikan (Share) di bagian bawah browser Safari.',
                        'Tap the Share icon at the bottom of Safari.',
                      )}
                    </li>
                    <li>
                      {t(
                        'Geser ke bawah lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).',
                        'Scroll down and tap "Add to Home Screen".',
                      )}
                    </li>
                  </ol>
                </div>

                {/* Android / Chrome Instructions */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                  <p className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Download size={14} className="text-[var(--primary)]" />
                    {t('Android & Desktop (Chrome)', 'Android & Desktop (Chrome)')}
                  </p>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-[var(--text-secondary)]">
                    <li>
                      {t(
                        'Ketuk ikon menu titik tiga (⋮) di pojok kanan atas browser.',
                        'Tap the three-dot menu (⋮) in the top-right corner.',
                      )}
                    </li>
                    <li>
                      {t(
                        'Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".',
                        'Select "Install App" or "Add to Home screen".',
                      )}
                    </li>
                  </ol>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="mt-4 w-full rounded-xl bg-[var(--primary)] py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
              >
                {t('Siap, Mengerti', 'Got It')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
