import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Download,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  generateAtsCvPdf,
  type CvEducationItem,
  type CvExperienceItem,
} from '../../lib/cvMaker'
import { downloadBlob } from '../../utils/download'

export default function CvMaker() {
  const { t } = useLanguage()

  const [fullName, setFullName] = useState('Andi Pratama')
  const [headline, setHeadline] = useState('Software Engineer & Web Developer')
  const [phone, setPhone] = useState('0812-3456-7890')
  const [email, setEmail] = useState('andipratama@email.com')
  const [location, setLocation] = useState('Jakarta, Indonesia')
  const [portfolio, setPortfolio] = useState('linkedin.com/in/andipratama')

  const [summary, setSummary] = useState(
    'Lulusan Teknik Informatika dengan pengalaman membangun aplikasi web modern menggunakan React, TypeScript, dan Python. Terbiasa bekerja dalam tim lintas fungsi dan berfokus pada performa serta kemudahan pengguna.',
  )

  const [experiences, setExperiences] = useState<CvExperienceItem[]>([
    {
      id: 'exp-1',
      role: 'Frontend Developer Intern',
      company: 'PT Teknologi Digital Nusantara',
      period: 'Jan 2026 - Sekarang',
      bullets:
        'Mengembangkan 10+ komponen antarmuka responsif menggunakan React dan Tailwind CSS.\nMeningkatkan kecepatan waktu muat halaman utama hingga 35%.',
    },
  ])

  const [educations, setEducations] = useState<CvEducationItem[]>([
    {
      id: 'edu-1',
      degree: 'S1 Teknik Informatika',
      school: 'Universitas Indonesia',
      period: '2022 - 2026',
      gpa: '3.82 / 4.00',
    },
  ])

  const [skills, setSkills] = useState(
    'TypeScript, React, Next.js, Node.js, Python, SQL, Git, UI/UX Design',
  )
  const [certifications, setCertifications] = useState(
    'Bahasa Indonesia (Native), Bahasa Inggris (TOEFL 570), AWS Cloud Practitioner',
  )

  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState('')

  function addExperience() {
    setExperiences((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: '',
        company: '',
        period: '',
        bullets: '',
      },
    ])
  }

  function updateExperience(
    id: string,
    patch: Partial<Omit<CvExperienceItem, 'id'>>,
  ) {
    setExperiences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function removeExperience(id: string) {
    if (experiences.length <= 1) return
    setExperiences((prev) => prev.filter((item) => item.id !== id))
  }

  function addEducation() {
    setEducations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        degree: '',
        school: '',
        period: '',
        gpa: '',
      },
    ])
  }

  function updateEducation(
    id: string,
    patch: Partial<Omit<CvEducationItem, 'id'>>,
  ) {
    setEducations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function removeEducation(id: string) {
    if (educations.length <= 1) return
    setEducations((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleDownloadPdf() {
    setIsExporting(true)
    setSuccess('')

    try {
      const pdfBlob = await generateAtsCvPdf({
        fullName,
        headline,
        phone,
        email,
        location,
        portfolio,
        summary,
        experiences,
        educations,
        skills,
        certifications,
      })

      const safeName =
        fullName.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'Resume'
      downloadBlob(pdfBlob, `CV-ATS-${safeName}.pdf`)
      setSuccess(
        t(
          'CV ATS-Friendly PDF berhasil dibuat dan diunduh.',
          'ATS-Friendly CV PDF generated and downloaded.',
        ),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="cv-maker" />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Form Editor */}
          <div className="space-y-5 lg:col-span-7">
            <section className="ios-card p-5 sm:p-6 space-y-5">
              {/* Personal Info */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {t('1. Informasi Pribadi & Kontak', '1. Personal & Contact Info')}
                </h2>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Nama Lengkap', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Headline / Posisi', 'Headline / Target Role')}
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Nomor HP / WhatsApp', 'Phone Number')}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Email
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Domisili / Kota', 'City / Location')}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      LinkedIn / Portofolio
                    </label>
                    <input
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-[var(--border)] pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {t('2. Ringkasan Profil (Summary)', '2. Professional Summary')}
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--text-primary)] outline-none"
                />
              </div>

              {/* Experience */}
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {t(
                      '3. Pengalaman Kerja / Organisasi',
                      '3. Work & Leadership Experience',
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                  >
                    <Plus size={13} />
                    {t('Tambah', 'Add')}
                  </button>
                </div>

                {experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {t(`Pengalaman #${idx + 1}`, `Experience #${idx + 1}`)}
                      </span>
                      <button
                        type="button"
                        disabled={experiences.length <= 1}
                        onClick={() => removeExperience(exp.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--error)] disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) =>
                          updateExperience(exp.id, { role: e.target.value })
                        }
                        placeholder={t('Posisi / Jabatan', 'Role Title')}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, { company: e.target.value })
                        }
                        placeholder={t('Perusahaan / Instansi', 'Company / Org')}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) =>
                          updateExperience(exp.id, { period: e.target.value })
                        }
                        placeholder={t('Periode (2024 - 2026)', 'Period')}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                    </div>

                    <textarea
                      rows={3}
                      value={exp.bullets}
                      onChange={(e) =>
                        updateExperience(exp.id, { bullets: e.target.value })
                      }
                      placeholder={t(
                        'Poin pencapaian (pisahkan tiap poin dengan baris baru / Enter)...',
                        'Achievement bullets (one bullet point per line)...',
                      )}
                      className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs leading-5 text-[var(--text-primary)] outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {t('4. Pendidikan', '4. Education')}
                  </span>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                  >
                    <Plus size={13} />
                    {t('Tambah', 'Add')}
                  </button>
                </div>

                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                  >
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) =>
                        updateEducation(edu.id, { school: e.target.value })
                      }
                      placeholder={t('Kampus / Sekolah', 'University / School')}
                      className="col-span-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none sm:col-span-4"
                    />
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(edu.id, { degree: e.target.value })
                      }
                      placeholder={t('Jurusan / Gelar', 'Degree / Major')}
                      className="col-span-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none sm:col-span-4"
                    />
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) =>
                        updateEducation(edu.id, { period: e.target.value })
                      }
                      placeholder={t('Tahun', 'Years')}
                      className="col-span-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) =>
                        updateEducation(edu.id, { gpa: e.target.value })
                      }
                      placeholder="IPK"
                      className="col-span-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none sm:col-span-1"
                    />
                    <button
                      type="button"
                      disabled={educations.length <= 1}
                      onClick={() => removeEducation(edu.id)}
                      className="col-span-2 flex justify-center text-[var(--text-muted)] hover:text-[var(--error)] disabled:opacity-30 sm:col-span-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Skills & Certifications */}
              <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {t('5. Keahlian (Skills)', '5. Technical & Soft Skills')}
                  </label>
                  <textarea
                    rows={2}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="mt-1.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {t('6. Bahasa & Sertifikasi', '6. Languages & Certifications')}
                  </label>
                  <textarea
                    rows={2}
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    className="mt-1.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Live ATS Preview & Export */}
          <div className="lg:col-span-5">
            <div className="ios-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Pratinjau Struktur ATS', 'ATS Structure Preview')}
                </h2>
                <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-bold text-[var(--success)]">
                  100% Selectable Text PDF
                </span>
              </div>

              {/* Paper Sheet Preview */}
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-slate-900 shadow-xs">
                <div className="text-center">
                  <h3 className="text-base font-bold tracking-tight">
                    {fullName || 'NAMA LENGKAP'}
                  </h3>
                  {headline && (
                    <p className="text-xs text-slate-600">{headline}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-500">
                    {[phone, email, location, portfolio]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>

                {summary && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Ringkasan Profesional
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">
                      {summary}
                    </p>
                  </div>
                )}

                <div className="mt-3 border-t border-slate-200 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Pengalaman
                  </p>
                  <div className="mt-1 space-y-2">
                    {experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{exp.role || 'Posisi'}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {exp.period}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {exp.company}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Pendidikan & Keahlian
                  </p>
                  {educations.map((edu) => (
                    <p key={edu.id} className="mt-1 text-[11px] text-slate-700">
                      <strong>{edu.school}</strong> — {edu.degree}{' '}
                      {edu.gpa ? `(${edu.gpa})` : ''}
                    </p>
                  ))}
                  {skills && (
                    <p className="mt-1.5 text-[10px] text-slate-600">
                      <strong>Skills:</strong> {skills}
                    </p>
                  )}
                </div>
              </div>

              <button
                id="cv-download-pdf-btn"
                type="button"
                disabled={isExporting}
                onClick={() => void handleDownloadPdf()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isExporting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {t('Unduh CV ATS-Friendly (PDF)', 'Download ATS CV (PDF)')}
              </button>

              {success && (
                <p className="inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                  <Check size={15} />
                  {success}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
