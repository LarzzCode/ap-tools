import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { tools } from '../data/tools'
import { useLanguage } from './useLanguage'

interface PageMeta {
  title: string
  description: string
}

export function usePageMeta() {
  const location = useLocation()
  const { language, t } = useLanguage()

  useEffect(() => {
    const matchedTool = tools.find((tool) => tool.path === location.pathname)

    let meta: PageMeta

    if (matchedTool) {
      const toolTitle =
        language === 'id' ? matchedTool.nameId : matchedTool.name
      const toolDesc =
        language === 'id' ? matchedTool.descriptionId : matchedTool.description
      meta = {
        title: `${toolTitle} — Ditya Tools`,
        description: toolDesc,
      }
    } else if (location.pathname === '/') {
      meta = {
        title: t(
          'Ditya Tools — Utilitas Harian Cepat & Privat',
          'Ditya Tools — Fast & Private Everyday Utilities',
        ),
        description: t(
          'Kumpulan alat online praktis dan ramah privasi untuk Watermark KTP, Pas Foto, PDF, Invoice, Kartu QR Wi-Fi, dan media tanpa iklan.',
          'Simple, privacy-focused utilities for ID watermarks, Pas Foto, PDFs, invoices, Wi-Fi QR cards, and everyday tasks.',
        ),
      }
    } else if (location.pathname === '/tools') {
      meta = {
        title: t('Semua Alat — Ditya Tools', 'All Tools — Ditya Tools'),
        description: t(
          'Jelajahi seluruh alat utilitas gratis dan privat di Ditya Tools.',
          'Browse all privacy-first utilities available in Ditya Tools.',
        ),
      }
    } else if (location.pathname === '/feedback') {
      meta = {
        title: t('Kirim Saran & Masukan — Ditya Tools', 'Send Feedback — Ditya Tools'),
        description: t(
          'Kirimkan saran alat baru, masukan tampilan, atau laporan kendala langsung ke Gilar Wahiditya.',
          'Send new tool ideas, UI feedback, or bug reports directly to Gilar Wahiditya.',
        ),
      }
    } else if (location.pathname === '/about') {
      meta = {
        title: t('Tentang — Ditya Tools', 'About — Ditya Tools'),
        description: t(
          'Kenali prinsip kemudahan dan perlindungan privasi di balik Ditya Tools.',
          'Learn about Ditya Tools and the principles behind its utilities.',
        ),
      }
    } else if (location.pathname === '/privacy') {
      meta = {
        title: t('Kebijakan Privasi — Ditya Tools', 'Privacy — Ditya Tools'),
        description: t(
          'Pelajari bagaimana Ditya Tools memproses file secara lokal di perangkat Anda.',
          'Learn how Ditya Tools handles local file processing and privacy.',
        ),
      }
    } else {
      meta = {
        title: t(
          'Halaman Tidak Ditemukan — Ditya Tools',
          'Page Not Found — Ditya Tools',
        ),
        description: t(
          'Halaman yang Anda minta tidak ditemukan di Ditya Tools.',
          'The requested page could not be found on Ditya Tools.',
        ),
      }
    }

    document.title = meta.title

    let descEl = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    if (!descEl) {
      descEl = document.createElement('meta')
      descEl.name = 'description'
      document.head.appendChild(descEl)
    }
    descEl.content = meta.description
  }, [location.pathname, language, t])
}