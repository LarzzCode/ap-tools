import {
  AtSign,
  Cpu,
  ExternalLink,
  Gauge,
  Globe,
  HardDrive,
  Heart,
  Mail,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'

import { useLanguage } from '../hooks/useLanguage'

export default function About() {
  const { t } = useLanguage()

  const principles = [
    {
      icon: Zap,
      title: t('Buka. Pakai. Selesai.', 'Open. Use. Done.'),
      description: t(
        'Dirancang untuk menyelesaikan tugas cepat tanpa langkah berbelit, tanpa pendaftaran akun, dan tanpa gangguan iklan.',
        'Built for quick tasks without unnecessary steps, accounts, or ad clutter.',
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Privasi Nomor Satu', 'Privacy First'),
      description: t(
        'Alat gambar, KTP, PDF, invoice, dan QR memproses file langsung di dalam browser perangkat Anda tanpa diunggah ke server.',
        'Image, ID card, PDF, invoice, and QR utilities process files locally in your browser without uploading them to a server.',
      ),
    },
    {
      icon: Gauge,
      title: t('Ringan & Responsif', 'Fast & Responsive'),
      description: t(
        'Setiap halaman alat dimuat sesuai kebutuhan (lazy-loaded) sehingga tetap gesit baik di Android, iOS, maupun laptop.',
        'Tools load only what they need so the experience stays snappy on Android, iOS, and desktop.',
      ),
    },
    {
      icon: Wrench,
      title: t('Panduan Jelas Saat Dibutuhkan', 'Clear On-Demand Guides'),
      description: t(
        'Tampilan tetap bersih saat dibuka, lengkap dengan panduan langkah demi langkah yang bisa dibuka kapan saja.',
        'Clean interface on open, with detailed step-by-step instructions available in one tap.',
      ),
    },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Hero */}
        <section className="max-w-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <Sparkles size={23} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {t('Tentang Ditya Tools', 'About Ditya Tools')}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {t(
              'Ditya Tools adalah kumpulan utilitas harian yang berfokus pada kemudahan penggunaan dan perlindungan privasi untuk mengolah foto, pelindung scan KTP, pas foto, dokumen PDF, invoice, tautan, serta media.',
              'Ditya Tools is a collection of focused utilities for everyday image, ID protection, PDF, invoice, link, and media tasks.',
            )}
          </p>
        </section>

        {/* Creator Profile Card — Gilar Wahiditya */}
        <section className="ios-card mt-8 overflow-hidden p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--primary)] text-white shadow-sm">
                <UserRound size={26} />
              </div>

              <div>
                <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                  {t('PEMBUAT & PENGEMBANG', 'CREATOR & DEVELOPER')}
                </span>
                <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Gilar Wahiditya
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                  {t(
                    'Membangun Ditya Tools agar teman-teman dan pengguna di Indonesia punya tempat utilitas digital yang bersih, cepat, gratis, dan aman tanpa takut data pribadinya disalahgunakan.',
                    'Building Ditya Tools so everyone has access to a clean, fast, free, and privacy-respecting digital utility toolbox.',
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
              <a
                href="https://portogilar.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
              >
                <Globe size={14} />
                portogilar.vercel.app
                <ExternalLink size={12} />
              </a>

              <a
                href="https://instagram.com/gilarwdy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
              >
                <AtSign size={14} />
                gilarwdy
                <ExternalLink size={12} />
              </a>

              <a
                href="mailto:wahidityagilar6@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
              >
                <Mail size={14} />
                Email
              </a>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
            <span>
              {t(
                'Punya request tool baru atau masukan buat Gilar?',
                'Have a tool request or feedback for Gilar?',
              )}
            </span>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)] hover:underline"
            >
              <MessageSquareHeart size={14} />
              {t('Kirim Saran & Feedback →', 'Send Feedback →')}
            </Link>
          </div>
        </section>

        {/* Principles */}
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {t('Prinsip Utama', 'Core Principles')}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <motion.article
                  key={principle.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.3 }}
                  className="ios-card p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon size={19} />
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-[var(--text-primary)]">
                    {principle.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                    {principle.description}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="ios-card mt-10 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <HardDrive size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {t('Pemrosesan Langsung di Browser', 'Browser-First Processing')}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                {t(
                  'Watermark KTP, Hapus Latar AI, Pas Foto, Kompresor Gambar, serta seluruh alat PDF & QR bekerja 100% di dalam browser perangkat Anda tanpa mengunggah file ke server.',
                  'ID Card Watermark, AI Background Removal, Pas Foto, Image Compressor, and all PDF & QR tools work 100% inside your browser without uploading files.',
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-4 border-t border-[var(--border)] pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Cpu size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {t('Pendamping Perangkat untuk Media', 'Device Companion for Heavy Media')}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                {t(
                  'Fitur pengolahan video dan audio berukuran besar dapat terhubung dengan layanan pendamping di komputer pribadi Anda.',
                  'Heavy video and audio utilities connect to the companion service on your personal computer.',
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 border-t border-[var(--border)] pt-6">
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
            <Heart size={15} className="shrink-0 text-[var(--primary)]" />
            <span>
              {t(
                'Dibuat dengan penuh perhatian oleh Gilar Wahiditya.',
                'Crafted with care by Gilar Wahiditya.',
              )}
            </span>
          </div>
        </section>
      </motion.div>
    </main>
  )
}