import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Cpu,
  HelpCircle,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import ToolIcon from './ToolIcon'

interface ToolPageHeaderProps {
  toolId: string
}

export default function ToolPageHeader({ toolId }: ToolPageHeaderProps) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'steps' | 'about' | 'tips'>('steps')

  const tool = tools.find((item) => item.id === toolId)

  if (!tool) {
    return null
  }

  function handleBack() {
    const historyIdx =
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number'
        ? window.history.state.idx
        : 0

    if (historyIdx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const title = language === 'id' ? tool.nameId : tool.name
  const description =
    language === 'id' ? tool.descriptionId : tool.description
  const overview =
    language === 'id' ? tool.guide.overviewId : tool.guide.overviewEn
  const steps =
    language === 'id' ? tool.guide.stepsId : tool.guide.stepsEn
  const tips =
    language === 'id' ? tool.guide.tipsId : tool.guide.tipsEn
  const isBrowser = tool.runtime === 'browser'

  return (
    <div>
      {/* Top iOS navigation row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          id="tool-header-back-btn"
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--primary)] shadow-2xs transition hover:opacity-85 sm:text-sm"
        >
          <ArrowLeft size={16} />
          {t('Kembali', 'Back')}
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
            {isBrowser ? (
              <>
                <ShieldCheck size={13} className="text-[var(--success)]" />
                {t('100% Lokal', '100% Local')}
              </>
            ) : (
              <>
                <Cpu size={13} className="text-[var(--primary)]" />
                {t('Pendamping', 'Companion')}
              </>
            )}
          </span>

          <button
            id="tool-header-guide-btn"
            type="button"
            onClick={() => setIsGuideOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isGuideOpen
                ? 'border-[var(--primary-border)] bg-[var(--primary)] text-white'
                : 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-90'
            }`}
          >
            <HelpCircle size={13} />
            {t('Cara Pakai', 'How to Use')}
          </button>
        </div>
      </div>

      {/* Compact iOS Title Row */}
      <div className="mt-4 flex items-start gap-3.5 sm:mt-5 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-2xs sm:h-13 sm:w-13">
          <ToolIcon toolId={tool.id} size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h1>

          <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>
      </div>

      {/* Progressive Disclosure: Expandable iOS Info Sheet */}
      <AnimatePresence>
        {isGuideOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ios-card mt-4 p-4 sm:mt-5 sm:p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div className="ios-segmented no-scrollbar flex overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('steps')}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      activeTab === 'steps'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Langkah Pakai', 'Steps')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      activeTab === 'about'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Tentang Alat', 'About Tool')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tips')}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      activeTab === 'tips'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Tips & Privasi', 'Tips & Privacy')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Close guide"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-3.5">
                {activeTab === 'steps' && (
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-xs leading-5 text-[var(--text-primary)]">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {activeTab === 'about' && (
                  <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                    <BookOpen
                      size={17}
                      className="mt-0.5 shrink-0 text-[var(--primary)]"
                    />
                    <p className="text-xs leading-6 text-[var(--text-secondary)] sm:text-sm">
                      {overview}
                    </p>
                  </div>
                )}

                {activeTab === 'tips' && (
                  <ul className="space-y-2">
                    {tips.map((tip, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                      >
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 text-[var(--success)]"
                        />
                        <span className="text-xs leading-5 text-[var(--text-secondary)]">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
