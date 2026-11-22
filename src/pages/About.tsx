import {
  Cpu,
  Gauge,
  HardDrive,
  Heart,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'

import { useLanguage } from '../hooks/useLanguage'

export default function About() {
  const { t } = useLanguage()

  const principles = [
    {
      icon: Zap,
      title: t('Buka. Pakai. Selesai.', 'Open. Use. Done.'),
      description: t(
        'Ditya Tools dirancang untuk menyelesaikan tugas cepat tanpa langkah berbelit, tanpa pendaftaran akun, dan tanpa gangguan iklan.',
        'Ditya Tools is built for quick tasks without unnecessary steps, accounts, or ad clutter.',
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
      title: t('Ringan & Cepat', 'Fast by Default'),
      description: t(
        'Setiap halaman alat dimuat sesuai kebutuhan (lazy-loaded) sehingga tetap gesit baik di smartphone maupun laptop.',
        'Tools load only what they need so the experience stays snappy on both phones and desktops.',
      ),
    },
    {
      icon: Wrench,
      title: t('Penjelasan Lengkap & Mudah Dipahami', 'Clear Guides on Every Tool'),
      description: t(
        'Setiap alat dilengkapi penjelasan fungsi yang detail, langkah penggunaan bertahap, serta tips privasi.',
        'Every utility includes an in-depth explanation, step-by-step instructions, and practical privacy tips.',
      ),
    },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className="max-w-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <Sparkles size={23} />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {t('Tentang Ditya Tools', 'About Ditya Tools')}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {t(
              'Ditya Tools adalah kumpulan utilitas harian yang berfokus pada kemudahan penggunaan dan perlindungan privasi untuk mengolah foto, pelindung scan KTP, pas foto, dokumen PDF, invoice, tautan, serta media.',
              'Ditya Tools is a collection of focused utilities for everyday image, ID protection, PDF, invoice, link, and media tasks.',
            )}
          </p>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {t(
              'Tujuannya sederhana: menghilangkan hambatan yang tidak perlu dan memastikan setiap alat langsung bermanfaat sejak pertama kali dibuka.',
              'The goal is simple: remove unnecessary friction and make each tool useful from the moment you open it.',
            )}
          </p>
        </section>

        {/* Principles */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {t('Prinsip Utama Kami', 'Built Around Simple Principles')}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <motion.article
                  key={principle.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.3 }}
                  className="ios-card p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon size={19} />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">
                    {principle.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {principle.description}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="ios-card mt-12 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <HardDrive size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t('Pemrosesan Langsung di Browser', 'Browser-First Processing')}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {t(
                  'Sebagian besar fitur Ditya Tools — termasuk Watermark KTP, Hapus Latar AI, Pas Foto, Kompresor Gambar, serta seluruh alat PDF & QR — bekerja 100% di dalam browser Anda. File dokumen Anda tidak pernah dikirim ke server pemrosesan eksternal.',
                  'Most Ditya Tools features — including ID Card Watermark, AI Background Removal, Pas Foto, Image Compressor, and all PDF & QR tools — perform their work 100% inside your browser. Your working files stay on your device.',
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-4 border-t border-[var(--border)] pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Cpu size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t('Pendamping Perangkat untuk Media Berat', 'Device Companion for Heavy Media')}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {t(
                  'Fitur pengolahan video dan audio berukuran besar dapat terhubung dengan layanan pendamping di komputer pribadi Anda sehingga pemrosesan media tetap kencang dan bebas batas ukuran unggahan cloud.',
                  'Features that process heavy video and audio streams connect to the companion service on your personal computer so media processing stays fast without cloud upload limits.',
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Current Toolkit */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {t('Katalog Alat Saat Ini', 'Current Toolkit')}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="ios-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {t('Gambar & KTP', 'Image & ID')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                {t('Watermark KTP & Sensor', 'ID Card Watermark')}
                <br />
                {t('Hapus Latar Foto AI', 'Remove Background')}
                <br />
                {t('Pas Foto & Cetak 4R/A4', 'Pas Foto & Print Sheet')}
                <br />
                {t('Kompres Gambar', 'Image Compressor')}
                <br />
                {t('Pembersih EXIF', 'EXIF Stripper')}
              </p>
            </div>

            <div className="ios-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {t('PDF & Invoice', 'PDF & Invoice')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                {t('Gambar ke PDF', 'Image to PDF')}
                <br />
                {t('Gabung PDF', 'PDF Merge')}
                <br />
                {t('Pisah Halaman PDF', 'PDF Split')}
                <br />
                {t('Atur & Putar PDF', 'PDF Page Organizer')}
                <br />
                {t('Tanda Tangan PDF', 'PDF Sign & Watermark')}
                <br />
                {t('Invoice & Kwitansi PDF', 'Invoice & Receipt PDF')}
              </p>
            </div>

            <div className="ios-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {t('QR & Tautan', 'QR & Links')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                {t('Kartu QR Wi-Fi', 'Wi-Fi QR Card')}
                <br />
                {t('Pembuat Kode QR', 'QR Generator')}
                <br />
                {t('Pemindai Kode QR', 'QR Scanner')}
                <br />
                {t('Link Chat WhatsApp', 'WhatsApp Link')}
                <br />
                {t('Pembersih Link Pelacak', 'Clean URL Stripper')}
              </p>
            </div>

            <div className="ios-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {t('Teks', 'Text')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                {t('Perapi Teks PDF & Huruf', 'Text Cleaner & Case')}
              </p>
            </div>

            <div className="ios-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {t('Media', 'Media')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                {t('Pengunduh YouTube', 'YouTube Downloader')}
                <br />
                {t('Pemotong Video/Audio', 'Media Clipper & Converter')}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-[var(--border)] pt-8">
          <div className="flex items-start gap-3">
            <Heart
              size={18}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
            />
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              {t(
                'Ditya Tools terus dikembangkan untuk menghadirkan utilitas yang bersih, ramah pengguna, dan menghormati privasi Anda.',
                'Ditya Tools continues to evolve around clean, user-friendly utilities that respect your privacy.',
              )}
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  )
}