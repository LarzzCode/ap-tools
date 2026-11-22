import {
  BookOpen,
  CheckCircle2,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { useLanguage } from '../../hooks/useLanguage'
import type { Tool } from '../../types/tool'

interface ToolGuideProps {
  tool: Tool
}

export default function ToolGuide({ tool }: ToolGuideProps) {
  const { language, t } = useLanguage()

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
      className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
    >
      <div className="ios-card overflow-hidden p-6 sm:p-8">
        {/* Header & Overview */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3.5 py-1 text-xs font-semibold text-[var(--primary-text)]">
              <BookOpen size={13} />
              {t('Penjelasan & Panduan Lengkap', 'Detailed Guide & Documentation')}
            </div>

            <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              {t(`Mengenal ${title}`, `About ${title}`)}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {overview}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)]">
            <ShieldCheck size={16} className="text-[var(--success)]" />
            {tool.runtime === 'browser'
              ? t('100% Diproses di Browser', '100% In-Browser Processing')
              : t('Diproses di Perangkat Lokal', 'Local Device Processing')}
          </div>
        </div>

        {/* Steps & Tips Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Step-by-step instructions */}
          <div className="lg:col-span-7">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <ListChecks size={15} className="text-[var(--primary)]" />
              {t('Langkah-Langkah Penggunaan', 'How to Use Step by Step')}
            </h3>

            <ol className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white shadow-xs">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--text-primary)]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips & Benefits */}
          <div className="lg:col-span-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Sparkles size={15} className="text-[var(--primary)]" />
              {t('Tips & Keunggulan Privasi', 'Pro Tips & Privacy Benefits')}
            </h3>

            <ul className="mt-4 space-y-3">
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-[var(--success)]"
                  />
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
