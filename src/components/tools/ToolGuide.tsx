import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ListChecks,
  Sparkles,
} from 'lucide-react'

import { useLanguage } from '../../hooks/useLanguage'
import type { Tool } from '../../types/tool'

interface ToolGuideProps {
  tool: Tool
}

export default function ToolGuide({ tool }: ToolGuideProps) {
  const { language, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const title = language === 'id' ? tool.nameId : tool.name
  const overview =
    language === 'id' ? tool.guide.overviewId : tool.guide.overviewEn
  const steps =
    language === 'id' ? tool.guide.stepsId : tool.guide.stepsEn
  const tips =
    language === 'id' ? tool.guide.tipsId : tool.guide.tipsEn

  return (
    <section
      aria-label={t(`Panduan lengkap ${title}`, `Complete guide for ${title}`)}
      className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8"
    >
      <div className="ios-card overflow-hidden">
        <button
          id="tool-guide-accordion-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--surface-soft)]/60 sm:px-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <BookOpen size={17} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {t(
                  `Pelajari Cara Kerja & Panduan ${title}`,
                  `Learn How ${title} Works & Full Guide`,
                )}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {t(
                  'Ketuk untuk melihat penjelasan fungsi, langkah pemakaian, dan tips privasi',
                  'Tap to view detailed explanation, step-by-step instructions, and privacy tips',
                )}
              </p>
            </div>
          </div>

          <ChevronDown
            size={18}
            className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--primary)]' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-[var(--border)] px-5 py-6 sm:px-6">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {overview}
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <ListChecks size={15} className="text-[var(--primary)]" />
                      {t('Langkah Penggunaan', 'Step-by-Step Instructions')}
                    </h3>

                    <ol className="mt-3 space-y-2.5">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                            {index + 1}
                          </span>
                          <p className="text-xs leading-5 text-[var(--text-primary)] sm:text-sm">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="lg:col-span-5">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <Sparkles size={15} className="text-[var(--primary)]" />
                      {t('Tips & Keunggulan Privasi', 'Pro Tips & Privacy')}
                    </h3>

                    <ul className="mt-3 space-y-2.5">
                      {tips.map((tip, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--success)]"
                          />
                          <p className="text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                            {tip}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
