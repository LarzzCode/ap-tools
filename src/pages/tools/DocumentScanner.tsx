import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  Download,
  FileText,
  RotateCw,
  ScanText,
  Sparkles,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadBlob, downloadDataUrl } from '../../utils/download'

type ScanFilterMode = 'magic-color' | 'bw-crisp' | 'grayscale' | 'original'

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export default function DocumentScanner() {
  const { language, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null)
  const [filterMode, setFilterMode] = useState<ScanFilterMode>('magic-color')
  const [paperWhitePoint, setPaperWhitePoint] = useState(185)
  const [contrastBoost, setContrastBoost] = useState(1.45)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  function handleSelectImage(file: File) {
    if (
      !file.type.startsWith('image/') &&
      !/\.(jpg|jpeg|png|webp)$/i.test(file.name)
    ) {
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSourceImg(img)
      setRotation(0)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleSelectImage(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleSelectImage(file)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImg) return

    const maxDim = 1600
    const scale = Math.min(
      1,
      maxDim / Math.max(1, sourceImg.naturalWidth, sourceImg.naturalHeight),
    )
    const baseW = Math.max(1, Math.round(sourceImg.naturalWidth * scale))
    const baseH = Math.max(1, Math.round(sourceImg.naturalHeight * scale))

    const isSideways = rotation % 180 !== 0
    canvas.width = isSideways ? baseH : baseW
    canvas.height = isSideways ? baseW : baseH

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(sourceImg, -baseW / 2, -baseH / 2, baseW, baseH)
    ctx.restore()

    if (filterMode === 'original') return

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data
    const whiteRef = Math.max(100, paperWhitePoint)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (filterMode === 'bw-crisp') {
        // High-contrast black & white document whitening
        if (lum >= whiteRef) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        } else {
          const norm = lum / whiteRef
          const curved = Math.pow(norm, contrastBoost * 1.45) * 255
          const v = curved < 95 ? clampByte(curved * 0.45) : clampByte(curved)
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v
        }
      } else if (filterMode === 'magic-color') {
        // Whitens paper background while keeping colored stamps/signatures vivid
        if (lum >= whiteRef) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        } else {
          const scaleFactor = 255 / whiteRef
          const nr = Math.min(255, r * scaleFactor)
          const ng = Math.min(255, g * scaleFactor)
          const nb = Math.min(255, b * scaleFactor)

          const applyContrast = (ch: number) =>
            clampByte(((ch / 255 - 0.5) * contrastBoost + 0.5) * 255)

          data[i] = applyContrast(nr)
          data[i + 1] = applyContrast(ng)
          data[i + 2] = applyContrast(nb)
        }
      } else if (filterMode === 'grayscale') {
        const scaled = Math.min(255, (lum / whiteRef) * 255)
        const v = clampByte(((scaled / 255 - 0.5) * contrastBoost + 0.5) * 255)
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
      }
    }

    ctx.putImageData(imgData, 0, 0)
  }, [sourceImg, filterMode, paperWhitePoint, contrastBoost, rotation])

  function handleDownloadJpg() {
    if (!canvasRef.current || !sourceImg) return
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92)
    downloadDataUrl(dataUrl, 'ditya-tools-scan-dokumen.jpg')
  }

  async function handleDownloadPdf() {
    if (!canvasRef.current || !sourceImg) return
    setIsExportingPdf(true)
    try {
      const jpgDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9)
      const jpgBytes = await fetch(jpgDataUrl).then((res) => res.arrayBuffer())

      const pdfDoc = await PDFDocument.create()
      const embeddedJpg = await pdfDoc.embedJpg(jpgBytes)

      const isLandscape = canvasRef.current.width > canvasRef.current.height
      const pageW = isLandscape ? 841.89 : 595.28 // A4 points
      const pageH = isLandscape ? 595.28 : 841.89
      const page = pdfDoc.addPage([pageW, pageH])

      const margin = 24
      const availW = pageW - margin * 2
      const availH = pageH - margin * 2
      const fitScale = Math.min(
        availW / canvasRef.current.width,
        availH / canvasRef.current.height,
      )
      const drawW = canvasRef.current.width * fitScale
      const drawH = canvasRef.current.height * fitScale

      page.drawImage(embeddedJpg, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
      downloadBlob(blob, 'ditya-tools-scan-dokumen-a4.pdf')
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="document-scanner" />

      <input
        id="document-scanner-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Controls Panel */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
            }`}
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Upload size={19} />
            </div>
            <p className="mt-2.5 text-xs font-bold text-[var(--text-primary)] sm:text-sm">
              {sourceImg
                ? t('Ganti Foto Kertas / Dokumen', 'Replace Document Photo')
                : t('Pilih atau Foto Kertas Dokumen', 'Select or Snap Document Photo')}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Ubah foto kertas yang redup/berbayang menjadi hasil scan putih bersih',
                'Turn shadowy paper photos into crisp, snow-white document scans',
              )}
            </p>
          </div>

          {/* Scan Filter Mode */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Sparkles size={13} className="text-[var(--primary)]" />
              {t('Mode Efek Scan Dokumen', 'Document Scan Filter')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['magic-color', t('Magic Color (Cerah)', 'Magic Color')],
                  ['bw-crisp', t('Hitam Putih Tajam', 'B&W Crisp Text')],
                  ['grayscale', t('Abu-abu Resmi', 'Clean Grayscale')],
                  ['original', t('Foto Asli', 'Original Photo')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterMode(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    filterMode === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filterMode !== 'original' && (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>
                    {t('Pemutih Kertas & Hapus Bayangan', 'Paper Whitening Level')}
                  </span>
                  <span className="text-[var(--primary)]">
                    {Math.round(((255 - paperWhitePoint) / 145) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={115}
                  max={245}
                  step={2}
                  value={paperWhitePoint}
                  onChange={(e) => setPaperWhitePoint(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--primary)]"
                />
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {t(
                    'Geser ke kiri untuk memutihkan bayangan kertas yang gelap.',
                    'Slide left to erase darker shadows on the paper.',
                  )}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>{t('Ketajaman Teks / Tinta', 'Text Contrast Boost')}</span>
                  <span className="text-[var(--primary)]">
                    {Math.round(contrastBoost * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.4}
                  step={0.05}
                  value={contrastBoost}
                  onChange={(e) => setContrastBoost(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* Rotate 90 deg */}
          <button
            type="button"
            disabled={!sourceImg}
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] disabled:opacity-40"
          >
            <RotateCw size={14} className="text-[var(--primary)]" />
            {t('Putar Kertas 90°', 'Rotate Page 90°')} ({rotation}°)
          </button>

          {/* Export PDF & JPG */}
          <div className="grid gap-2 pt-1">
            <button
              id="doc-scanner-download-pdf-btn"
              type="button"
              disabled={!sourceImg || isExportingPdf}
              onClick={() => void handleDownloadPdf()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-40 sm:text-sm"
            >
              <FileText size={16} />
              {t(
                'Simpan Hasil Scan sebagai PDF A4',
                'Download Scanned Document as A4 PDF',
              )}
            </button>

            <button
              id="doc-scanner-download-jpg-btn"
              type="button"
              disabled={!sourceImg}
              onClick={handleDownloadJpg}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-2.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90 disabled:opacity-40"
            >
              <Download size={15} />
              {t('Unduh sebagai Gambar JPG HD', 'Download as Crisp JPG Image')}
            </button>
          </div>
        </section>

        {/* Preview Panel */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {t(
                'Pratinjau Dokumen Hasil Scan (Tanpa Watermark)',
                'Scanned Document Preview (No Watermark)',
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {t(
                'Mode Magic Color menjaga warna stempel & tanda tangan tetap hidup sambil memutihkan kertas.',
                'Magic Color whitens the paper background while keeping colored stamps and signatures vibrant.',
              )}
            </p>
          </div>

          <div className="my-5 flex min-h-[380px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            {sourceImg ? (
              <canvas
                ref={canvasRef}
                className="max-h-[480px] max-w-full rounded-lg bg-white object-contain shadow-md"
              />
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <ScanText size={26} />
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                  {language === 'id'
                    ? 'Belum ada foto kertas yang dipindai'
                    : 'No document photo loaded yet'}
                </p>
                <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                  {t(
                    'Unggah foto tugas, surat, ijazah, atau kwitansi untuk diputihkan seperti mesin scanner.',
                    'Upload a photo of a letter, assignment, or receipt to enhance it like a flatbed scanner.',
                  )}
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              '100% Tanpa Watermark Aplikasi • Diproses Lokal di Browser Anda',
              '100% Watermark-Free • Processed Locally Inside Your Browser',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
