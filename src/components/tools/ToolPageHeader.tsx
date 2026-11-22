import { ArrowLeft, Cpu, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { tools } from '../../data/tools'
import { useLanguage } from '../../hooks/useLanguage'
import ToolIcon from './ToolIcon'

interface ToolPageHeaderProps {
  toolId: string
}

export default function ToolPageHeader({ toolId }: ToolPageHeaderProps) {
  const { language, t } = useLanguage()
  const tool = tools.find((item) => item.id === toolId)

  if (!tool) {
    return null
  }

  const title = language === 'id' ? tool.nameId : tool.name
  const description =
    language === 'id' ? tool.descriptionId : tool.description
  const overview =
    language === 'id' ? tool.guide.overviewId : tool.guide.overviewEn
  const isBrowser = tool.runtime === 'browser'

  return (
    <div>
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:opacity-80"
      >
        <ArrowLeft size={16} />
        {t('Semua Alat', 'All Tools')}
      </Link>

      <div className="mt-6 max-w-3xl">
        <div className="flex h-13 w-13 items-center justify-center rounded-[18px] border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-xs">
          <ToolIcon toolId={tool.id} size={24} />
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {title}
        </h1>

        <p className="mt-3 text-base font-medium leading-7 text-[var(--text-primary)]">
          {description}
        </p>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {overview}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-2xs">
          {isBrowser ? (
            <>
              <ShieldCheck size={14} className="text-[var(--success)]" />
              {t(
                '100% Diproses di Browser — File tidak pernah keluar dari perangkat Anda',
                '100% In-Browser — Files never leave your device',
              )}
            </>
          ) : (
            <>
              <Cpu size={14} className="text-[var(--primary)]" />
              {t(
                'Diproses melalui Pendamping Perangkat Anda',
                'Processed through your Device Companion',
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
