import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from 'react'
import {
  Download,
  Frame,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type TwibbonRatio = '1:1' | '4:5' | '9:16'
type BuiltinTemplate = 'custom' | 'modern-ribbon' | 'circle-badge' | 'red-white'

const RATIO_DIMENSIONS: Record<
  TwibbonRatio,
  { width: number; height: number; labelId: string; labelEn: string }
> = {
  '1:1': {
    width: 1080,
    height: 1080,
    labelId: '1:1 Persegi (1080×1080)',
    labelEn: '1:1 Square (1080×1080)',
  },
  '4:5': {
    width: 1080,
    height: 1350,
    labelId: '4:5 IG Feed (1080×1350)',
    labelEn: '4:5 IG Feed (1080×1350)',
  },
  '9:16': {
    width: 1080,
    height: 1920,
    labelId: '9:16 Story (1080×1920)',
    labelEn: '9:16 Story (1080×1920)',
  },
}

function drawBuiltinFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  template: Exclude<BuiltinTemplate, 'custom'>,
  title: string,
  subtitle: string,
  accentColor: string,
) {
  ctx.save()

  if (template === 'modern-ribbon') {
    // Outer frame border
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 36
    ctx.strokeRect(18, 18, width - 36, height - 36)

    // Bottom gradient banner
    const bannerH = 230
    const grad = ctx.createLinearGradient(0, height - bannerH, width, height)
    grad.addColorStop(0, accentColor)
    grad.addColorStop(1, '#0F172A')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(48, height - bannerH - 36, width - 96, bannerH, 32)
    ctx.fill()

    // White accent border
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.font = 'bold 44px Inter, system-ui, sans-serif'
    ctx.fillText(
      (title || 'NAMA ACARA / KOMUNITAS').slice(0, 32),
      width / 2,
      height - bannerH + 62,
    )

    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font = '600 28px Inter, system-ui, sans-serif'
    ctx.fillText(
      (subtitle || 'Siap Sukseskan & Berkontribusi!').slice(0, 46),
      width / 2,
      height - bannerH + 118,
    )
  } else if (template === 'circle-badge') {
    // Mask everything outside central circle with accent ring
    const centerX = width / 2
    const centerY = height * 0.44
    const radius = Math.min(width, height) * 0.36

    ctx.fillStyle = '#0F172A'
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
    ctx.fill()

    // Glowing ring around circle
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 22
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 14, 0, Math.PI * 2)
    ctx.stroke()

    // Bottom title
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.font = 'bold 46px Inter, system-ui, sans-serif'
    ctx.fillText(
      (title || 'PESERTA RESMI').slice(0, 30),
      width / 2,
      height - 145,
    )

    ctx.fillStyle = accentColor
    ctx.font = 'bold 30px Inter, system-ui, sans-serif'
    ctx.fillText(
      (subtitle || 'Ditya Tools Studio').slice(0, 44),
      width / 2,
      height - 92,
    )
  } else if (template === 'red-white') {
    // Red & White Celebration Frame
    ctx.fillStyle = '#DC2626'
    ctx.fillRect(0, 0, width, 44)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 44, width, 16)

    // Bottom red & white ribbon
    const ribbonY = height - 220
    ctx.fillStyle = '#DC2626'
    ctx.beginPath()
    ctx.roundRect(44, ribbonY, width - 88, 176, 28)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.font = 'bold 44px Inter, system-ui, sans-serif'
    ctx.fillText(
      (title || 'DIRGAHAYU INDONESIA').slice(0, 32),
      width / 2,
      ribbonY + 78,
    )

    ctx.fillStyle = '#FEE2E2'
    ctx.font = '600 28px Inter, system-ui, sans-serif'
    ctx.fillText(
      (subtitle || 'Bangga Berkarya untuk Negeri').slice(0, 46),
      width / 2,
      ribbonY + 130,
    )
  }

  ctx.restore()
}

export default function TwibbonMaker() {
  const { language, t } = useLanguage()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const frameInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null)
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null)
  const [ratio, setRatio] = useState<TwibbonRatio>('1:1')
  const [template, setTemplate] = useState<BuiltinTemplate>('custom')

  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [rotation, setRotation] = useState(0)

  const [titleText, setTitleText] = useState('PANITIA & PESERTA EVENT')
  const [subtitleText, setSubtitleText] = useState('Siap Mensukseskan Acara!')
  const [accentColor, setAccentColor] = useState('#007AFF')

  const dragStateRef = useRef<{
    active: boolean
    startX: number
    startY: number
    initialOffsetX: number
    initialOffsetY: number
  }>({
    active: false,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  })

  function handleLoadImage(
    file: File,
    onLoaded: (img: HTMLImageElement) => void,
  ) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      onLoaded(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    handleLoadImage(file, (img) => {
      setPhotoImg(img)
      setZoom(1)
      setOffsetX(0)
      setOffsetY(0)
      setRotation(0)
    })
  }

  function handleFrameChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    handleLoadImage(file, (img) => {
      setFrameImg(img)
      setTemplate('custom')
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width, height } = RATIO_DIMENSIONS[ratio]
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Checkerboard / neutral backdrop
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, width, height)

    // Layer 1: User Photo
    if (photoImg) {
      ctx.save()
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY)
      ctx.rotate((rotation * Math.PI) / 180)

      // Cover scale by default
      const baseScale = Math.max(
        width / Math.max(1, photoImg.naturalWidth),
        height / Math.max(1, photoImg.naturalHeight),
      )
      const finalScale = baseScale * zoom
      const drawW = photoImg.naturalWidth * finalScale
      const drawH = photoImg.naturalHeight * finalScale

      ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()
    } else {
      ctx.fillStyle = '#1E293B'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#94A3B8'
      ctx.textAlign = 'center'
      ctx.font = 'bold 34px Inter, system-ui, sans-serif'
      ctx.fillText(
        language === 'id'
          ? 'Unggah Foto Profil Anda'
          : 'Upload Your Profile Photo',
        width / 2,
        height / 2,
      )
    }

    // Layer 2: Custom Transparent PNG Frame OR Built-in Procedural Frame
    if (template === 'custom') {
      if (frameImg) {
        ctx.drawImage(frameImg, 0, 0, width, height)
      }
    } else {
      drawBuiltinFrame(
        ctx,
        width,
        height,
        template,
        titleText,
        subtitleText,
        accentColor,
      )
    }
  }, [
    photoImg,
    frameImg,
    ratio,
    template,
    zoom,
    offsetX,
    offsetY,
    rotation,
    titleText,
    subtitleText,
    accentColor,
    language,
  ])

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!photoImg) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: offsetX,
      initialOffsetY: offsetY,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!dragStateRef.current.active || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / Math.max(1, rect.width)
    const scaleY = canvasRef.current.height / Math.max(1, rect.height)

    const dx = (e.clientX - dragStateRef.current.startX) * scaleX
    const dy = (e.clientY - dragStateRef.current.startY) * scaleY

    setOffsetX(Math.round(dragStateRef.current.initialOffsetX + dx))
    setOffsetY(Math.round(dragStateRef.current.initialOffsetY + dy))
  }

  function handlePointerUp() {
    dragStateRef.current.active = false
  }

  function handleDownload(format: 'png' | 'jpeg') {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? 0.94 : undefined)
    downloadDataUrl(
      dataUrl,
      `ditya-tools-twibbon.${format === 'png' ? 'png' : 'jpg'}`,
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="twibbon-maker" />

      {/* First file input is user photo so Smart File Drop auto-loads into user photo */}
      <input
        id="twibbon-photo-input"
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />
      <input
        id="twibbon-frame-input"
        ref={frameInputRef}
        type="file"
        accept="image/png,image/webp"
        onChange={handleFrameChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls Panel */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          {/* Step 1: Upload Photo & Frame */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--primary-border)] bg-[var(--primary-soft)] p-3.5 text-center transition hover:opacity-90"
            >
              <ImagePlus size={20} className="text-[var(--primary)]" />
              <span className="text-xs font-bold text-[var(--primary)]">
                {photoImg
                  ? t('Ganti Foto Diri', 'Change Photo')
                  : t('1. Pilih Foto Diri', '1. Pick Your Photo')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => frameInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-center transition hover:border-[var(--primary-border)]"
            >
              <Upload size={20} className="text-[var(--text-secondary)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {frameImg
                  ? t('Ganti Frame PNG', 'Change PNG Frame')
                  : t('2. Upload Frame PNG', '2. Upload PNG Frame')}
              </span>
            </button>
          </div>

          {/* Built-in Frame Templates or Custom PNG */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Sparkles size={13} className="text-[var(--primary)]" />
              {t('Mode Bingkai Twibbon', 'Twibbon Frame Mode')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['custom', t('Frame PNG Sendiri', 'Custom PNG Frame')],
                  ['modern-ribbon', t('Pita Event Modern', 'Modern Event Banner')],
                  ['circle-badge', t('Lencana Lingkaran', 'Circle Badge')],
                  ['red-white', t('Merah Putih', 'Red & White')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTemplate(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    template === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {template !== 'custom' && (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                  {t('Judul Acara / Kampus / Organisasi', 'Event / Organization Title')}
                </label>
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                  {t('Subjudul / Slogan', 'Subtitle / Slogan')}
                </label>
                <input
                  type="text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                />
              </div>
              {template !== 'red-white' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {t('Warna Aksen Bingkai', 'Frame Accent Color')}
                  </span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-7 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Ukuran Kanvas Output', 'Output Canvas Size')}
            </label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(['1:1', '4:5', '9:16'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatio(r)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    ratio === r
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Transform Sliders */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {t('Atur Posisi & Zoom Foto', 'Adjust Photo Zoom & Position')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoom(1)
                  setOffsetX(0)
                  setOffsetY(0)
                  setRotation(0)
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
                min={0.4}
                max={3}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                <span>{t('Putar (Rotasi)', 'Rotation')}</span>
                <span>{rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="twibbon-download-png-btn"
              type="button"
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-3 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              <Download size={15} />
              {t('Unduh PNG HD', 'Download PNG')}
            </button>
            <button
              id="twibbon-download-jpg-btn"
              type="button"
              onClick={() => handleDownload('jpeg')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
            >
              <Download size={15} />
              {t('Unduh JPG Hemat', 'Download JPG')}
            </button>
          </div>
        </section>

        {/* Live Interactive Canvas Preview */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t(
                  'Pratinjau Kanvas Interaktif (Tanpa Watermark)',
                  'Interactive Canvas Preview (No Watermark)',
                )}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t(
                  'Tips: Geser foto langsung dengan jari atau mouse di dalam kanvas di bawah',
                  'Tip: Drag your photo directly with your finger or mouse inside the canvas below',
                )}
              </p>
            </div>
            <Frame size={18} className="text-[var(--primary)]" />
          </div>

          <div className="my-5 flex flex-1 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="max-h-[480px] max-w-full cursor-grab touch-none rounded-2xl shadow-md active:cursor-grabbing"
            />
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              '100% Tanpa Watermark Aplikasi & Tanpa Upload ke Server',
              '100% Watermark-Free & Processed Locally in Your Browser',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
