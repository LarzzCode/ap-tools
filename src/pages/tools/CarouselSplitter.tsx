import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  CheckCircle2,
  Columns3,
  Download,
  RotateCcw,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type SlideRatio = '4:5' | '1:1'
type FitMode = 'cover' | 'contain'

interface GeneratedSlide {
  index: number
  dataUrl: string
  width: number
  height: number
}

export default function CarouselSplitter() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null)
  const [slideCount, setSlideCount] = useState<number>(3)
  const [ratio, setRatio] = useState<SlideRatio>('4:5')
  const [fitMode, setFitMode] = useState<FitMode>('cover')
  const bgColor = '#0F172A'

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [showSwipeBadge, setShowSwipeBadge] = useState(true)

  const [isDragging, setIsDragging] = useState(false)

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
      setZoom(1)
      setPanX(0)
      setPanY(0)
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

  const { masterCanvas, slides } = useMemo(() => {
    const slideW = 1080
    const slideH = ratio === '4:5' ? 1350 : 1080
    const totalW = slideW * slideCount
    const totalH = slideH

    const master = document.createElement('canvas')
    master.width = totalW
    master.height = totalH
    const mCtx = master.getContext('2d')
    if (!mCtx) {
      return { masterCanvas: master, slides: [] as GeneratedSlide[] }
    }

    mCtx.fillStyle = bgColor
    mCtx.fillRect(0, 0, totalW, totalH)

    if (sourceImg) {
      const imgW = Math.max(1, sourceImg.naturalWidth)
      const imgH = Math.max(1, sourceImg.naturalHeight)
      const baseScale =
        fitMode === 'cover'
          ? Math.max(totalW / imgW, totalH / imgH)
          : Math.min(totalW / imgW, totalH / imgH)

      const finalScale = baseScale * zoom
      const drawW = imgW * finalScale
      const drawH = imgH * finalScale
      const drawX = (totalW - drawW) / 2 + panX
      const drawY = (totalH - drawH) / 2 + panY

      mCtx.drawImage(sourceImg, drawX, drawY, drawW, drawH)
    }

    const nextSlides: GeneratedSlide[] = []
    if (sourceImg) {
      for (let i = 0; i < slideCount; i++) {
        const sCanvas = document.createElement('canvas')
        sCanvas.width = slideW
        sCanvas.height = slideH
        const sCtx = sCanvas.getContext('2d')
        if (!sCtx) continue

        sCtx.drawImage(
          master,
          i * slideW,
          0,
          slideW,
          slideH,
          0,
          0,
          slideW,
          slideH,
        )

        if (showSwipeBadge && i < slideCount - 1) {
          const pillW = 136
          const pillH = 44
          const px = slideW - pillW - 36
          const py = slideH - pillH - 36

          sCtx.fillStyle = 'rgba(15, 23, 42, 0.65)'
          sCtx.beginPath()
          sCtx.roundRect(px, py, pillW, pillH, 22)
          sCtx.fill()

          sCtx.fillStyle = '#FFFFFF'
          sCtx.font = 'bold 20px Inter, system-ui, sans-serif'
          sCtx.textAlign = 'center'
          sCtx.fillText('Geser →', px + pillW / 2, py + 28)
        }

        nextSlides.push({
          index: i + 1,
          dataUrl: sCanvas.toDataURL('image/jpeg', 0.94),
          width: slideW,
          height: slideH,
        })
      }
    }

    return { masterCanvas: master, slides: nextSlides }
  }, [
    sourceImg,
    slideCount,
    ratio,
    fitMode,
    bgColor,
    zoom,
    panX,
    panY,
    showSwipeBadge,
  ])

  useEffect(() => {
    const preview = previewCanvasRef.current
    if (!preview) return
    const previewScale = 0.25
    preview.width = Math.round(masterCanvas.width * previewScale)
    preview.height = Math.round(masterCanvas.height * previewScale)
    const pCtx = preview.getContext('2d')
    if (!pCtx) return

    pCtx.drawImage(masterCanvas, 0, 0, preview.width, preview.height)

    const scaledSlideW = 1080 * previewScale
    pCtx.save()
    pCtx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
    pCtx.lineWidth = 2
    pCtx.setLineDash([8, 6])

    for (let i = 1; i < slideCount; i++) {
      const seamX = Math.round(i * scaledSlideW)
      pCtx.beginPath()
      pCtx.moveTo(seamX, 0)
      pCtx.lineTo(seamX, preview.height)
      pCtx.stroke()
    }
    pCtx.restore()
  }, [masterCanvas, slideCount])

  function handleDownloadAll() {
    slides.forEach((slide, idx) => {
      window.setTimeout(() => {
        downloadDataUrl(
          slide.dataUrl,
          `ditya-tools-carousel-slide-${slide.index}.jpg`,
        )
      }, idx * 180)
    })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="carousel-splitter" />

      <input
        id="carousel-splitter-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Left: Controls */}
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
                ? t('Ganti Foto Panorama / Desain', 'Change Panorama Photo')
                : t('Pilih Foto Lebar / Panorama', 'Select Wide / Panorama Image')}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Otomatis dipotong presisi menjadi 2–5 slide Carousel Instagram yang menyambung',
                'Automatically slices into 2–5 seamless swipeable Instagram Carousel slides',
              )}
            </p>
          </div>

          {/* Number of Slides */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Jumlah Potongan Slide', 'Number of Carousel Slides')}
            </label>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSlideCount(cnt)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    slideCount === cnt
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {cnt} Slide
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio per Slide */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Rasio per Slide Instagram', 'Slide Aspect Ratio')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['4:5', t('4:5 Feed Potret (1080×1350)', '4:5 IG Portrait')],
                  ['1:1', t('1:1 Persegi (1080×1080)', '1:1 IG Square')],
                ] as const
              ).map(([r, label]) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatio(r)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    ratio === r
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Fit Mode */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Mode Pemuatan Gambar', 'Image Fit Mode')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['cover', t('Penuhi Slide (Cover)', 'Fill Slides (Cover)')],
                  ['contain', t('Muat Utuh (Fit)', 'Fit Whole Image')],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFitMode(m)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    fitMode === m
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom & Pan */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {t('Atur Zoom & Geser Posisi', 'Adjust Zoom & Pan')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoom(1)
                  setPanX(0)
                  setPanY(0)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline"
              >
                <RotateCcw size={12} />
                {t('Reset', 'Reset')}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.8}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>{t('Geser X', 'Pan X')}</span>
                  <span>{panX}px</span>
                </div>
                <input
                  type="range"
                  min={-900}
                  max={900}
                  step={10}
                  value={panX}
                  onChange={(e) => setPanX(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>{t('Geser Y', 'Pan Y')}</span>
                  <span>{panY}px</span>
                </div>
                <input
                  type="range"
                  min={-600}
                  max={600}
                  step={10}
                  value={panY}
                  onChange={(e) => setPanY(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {t('Tampilkan Label "Geser →" di Sudut', 'Show "Swipe →" Pill Badge')}
            </span>
            <input
              type="checkbox"
              checked={showSwipeBadge}
              onChange={(e) => setShowSwipeBadge(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
          </label>

          <button
            id="carousel-download-all-btn"
            type="button"
            disabled={slides.length === 0}
            onClick={handleDownloadAll}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-40"
          >
            <Download size={16} />
            {t(
              `Unduh Semua (${slideCount} Slide JPG)`,
              `Download All (${slideCount} Slides JPG)`,
            )}
          </button>
        </section>

        {/* Right: Seam Preview + Individual Slides */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Pratinjau Garis Potong Panorama & Hasil Slide',
                    'Panorama Seam Preview & Individual Slides',
                  )}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t(
                    'Garis putus-putus biru menunjukkan batas potongan antar-slide saat digeser di Instagram.',
                    'Blue dashed lines indicate where each Instagram slide seamlessly connects to the next.',
                  )}
                </p>
              </div>
              <Columns3 size={18} className="text-[var(--primary)]" />
            </div>

            {/* Full Panorama Seam Preview */}
            <div className="mt-4 flex items-center justify-center overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <canvas
                ref={previewCanvasRef}
                className="max-h-56 max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>

            {/* Individual Sliced Slides */}
            {slides.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slides.map((slide) => (
                  <div
                    key={slide.index}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                          <CheckCircle2 size={12} />
                          Slide #{slide.index}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {slide.width}×{slide.height}
                        </span>
                      </div>
                      <img
                        src={slide.dataUrl}
                        alt={`Slide ${slide.index}`}
                        className="w-full rounded-lg object-contain"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        downloadDataUrl(
                          slide.dataUrl,
                          `ditya-tools-carousel-slide-${slide.index}.jpg`,
                        )
                      }
                      className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--surface)] py-2 text-xs font-bold text-[var(--primary)] shadow-2xs transition hover:bg-[var(--primary)] hover:text-white"
                    >
                      <Download size={13} />
                      {t(`Unduh Slide ${slide.index}`, `Download #${slide.index}`)}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-8 text-center text-xs text-[var(--text-muted)]">
                {t(
                  'Unggah foto lebar atau desain di sebelah kiri untuk melihat hasil potongan tiap slide.',
                  'Upload a wide photo or banner on the left to preview and download each individual slide.',
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
