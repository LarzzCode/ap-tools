import {
  BarChart3,
  CloudDownload,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'motion/react'

import { useLanguage } from '../hooks/useLanguage'

export default function Privacy() {
  const { t } = useLanguage()

  const sections = [
    {
      icon: HardDrive,
      title: t('Pemrosesan File Secara Lokal', 'Local File Processing'),
      content: (
        <>
          <p>
            {t(
              'Sebagian besar utilitas Ditya Tools memproses file Anda secara langsung di dalam browser perangkat Anda.',
              'Most Ditya Tools utilities process your files directly inside your browser whenever possible.',
            )}
          </p>
          <p className="mt-3">
            {t(
              'Ini mencakup Watermark KTP & Sensor Dokumen, Pas Foto, Kompresor Gambar, Pembersih EXIF, Gambar ke PDF, Gabung/Pisah/Atur PDF, Tanda Tangan PDF, Pembuat Invoice, dan Kartu QR Wi-Fi. Foto maupun dokumen Anda tidak pernah diunggah ke server Ditya Tools.',
              'This includes ID Card Watermark, Pas Foto, Image Compressor, EXIF Stripper, Image to PDF, PDF Merge/Split/Organizer, PDF Sign, Invoice Maker, and Wi-Fi QR Cards. Your files are not uploaded to any Ditya Tools server.',
            )}
          </p>
        </>
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Penghapus Latar AI di Perangkat', 'On-Device AI Background Removal'),
      content: (
        <>
          <p>
            {t(
              'Fitur Hapus Latar Foto menjalankan pemrosesan AI langsung pada perangkat Anda. Gambar yang Anda pilih diolah secara lokal dan tidak dikirim ke server kami.',
              'Remove Background performs AI processing directly on your device. Your selected image is processed locally and is not uploaded to Ditya Tools.',
            )}
          </p>
          <p className="mt-3">
            {t(
              'Model AI diunduh dari penyedia hosting model saat pertama kali dibutuhkan dan disimpan di cache browser agar pemakaian berikutnya lebih cepat.',
              'The AI models are downloaded once when needed and cached by your browser to make future runs faster.',
            )}
          </p>
        </>
      ),
    },
    {
      icon: CloudDownload,
      title: t('Alat Media & Pendamping Perangkat', 'Media Tools & Device Companion'),
      content: (
        <>
          <p>
            {t(
              'Beberapa fitur pengolahan video/audio menggunakan layanan pendamping yang berjalan di komputer Anda sendiri.',
              'Some media features connect to the companion service running on your own computer.',
            )}
          </p>
          <p className="mt-3">
            {t(
              'Website Ditya Tools tidak menyimpan video atau rekaman audio Anda di server publik.',
              'Ditya Tools does not use its hosted frontend as a storage server for your media files.',
            )}
          </p>
        </>
      ),
    },
    {
      icon: BarChart3,
      title: t('Analitik Penggunaan Umum', 'Privacy-Focused Web Analytics'),
      content: (
        <>
          <p>
            {t(
              'Ditya Tools menggunakan analitik web ramah privasi dari Vercel hanya untuk memahami kunjungan halaman secara umum.',
              'Ditya Tools uses privacy-focused web analytics provided by Vercel to understand general page visits.',
            )}
          </p>
          <p className="mt-3">
            {t(
              'Isi file gambar, KTP, PDF, password Wi-Fi, maupun data invoice yang Anda olah secara lokal tidak pernah dikirim ke sistem analitik.',
              'Contents of images, IDs, PDFs, Wi-Fi passwords, or invoices processed locally are never sent to analytics.',
            )}
          </p>
        </>
      ),
    },
    {
      icon: LockKeyhole,
      title: t('Tanpa Akun & Data Pribadi', 'No Accounts Required'),
      content: (
        <>
          <p>
            {t(
              'Ditya Tools tidak mewajibkan Anda membuat akun, login, atau memberikan alamat email maupun kata sandi untuk menggunakan fitur-fitur yang tersedia.',
              'Ditya Tools does not require you to create an account or submit your email or password to use its utilities.',
            )}
          </p>
        </>
      ),
    },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className="max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <ShieldCheck size={23} />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {t('Kebijakan Privasi', 'Privacy Policy')}
          </h1>

          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
            {t(
              'Ditya Tools dibangun dengan satu prinsip utama: proses sebanyak mungkin langsung di perangkat Anda sendiri sehingga dokumen sensitif tetap berada di tangan Anda.',
              'Ditya Tools is designed around a simple principle: process as much as possible on your own device so sensitive documents stay under your control.',
            )}
          </p>
        </section>

        <section className="ios-card mt-8 border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--primary)]">
              <LockKeyhole size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t('Dokumen Anda Tetap di Perangkat Anda', 'Your Files Stay on Your Device')}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                {t(
                  'Alat berbasis browser seperti Watermark KTP, Pas Foto, dan PDF bekerja di memori lokal browser Anda tanpa mengunggah file ke server.',
                  'Browser-based utilities like ID Card Watermark, Pas Foto, and PDF tools run in local browser memory without uploading your files.',
                )}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.3 }}
                className="ios-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {section.title}
                    </h2>

                    <div className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.section>
            )
          })}
        </div>
      </motion.div>
    </main>
  )
}