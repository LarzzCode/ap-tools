import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  Download,
  Laptop,
  Monitor,
  Smartphone,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type DeviceFrameType = 'iphone' | 'macbook' | 'browser' | 'card'

interface BackdropPreset {
  id: string
  nameId: string
  nameEn: string
  colorStart: string
  colorEnd: string
  transparent?: boolean
}

const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: 'cupertino-sky',
    nameId: 'Biru Cupertino',
    nameEn: 'Cupertino Sky',
    colorStart: '#0284C7',
    colorEnd: '#38BDF8',
  },
  {
    id: 'titanium-dark',
    nameId: 'Titanium Gelap',
    nameEn: 'Titanium Midnight',
    colorStart: '#0F172A',
    colorEnd: '#334155',
  },
  {
    id: 'emerald-teal',
    nameId: 'Zamrud Segar',
    nameEn: 'Emerald Teal',
    colorStart: '#047857',
    colorEnd: '#14B8A6',
  },
  {
    id: 'warm-amber',
    nameId: 'Senja Amber',
    nameEn: 'Sunset Amber',
    colorStart: '#C2410C',
    colorEnd: '#F59E0B',
  },
  {
    id: 'studio-silver',
    nameId: 'Perak Studio',
    nameEn: 'Studio Silver',
    colorStart: '#E2E8F0',
    colorEnd: '#F8FAFC',
  },
  {
    id: 'transparent',
    nameId: 'Transparan (PNG)',
    nameEn: 'Transparent (PNG)',
    colorStart: 'transparent',
    colorEnd: 'transparent',
    transparent: true,
  },
]

export default function DeviceMockup() {
  const { language, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null)
  const [deviceType, setDeviceType] = useState<DeviceFrameType>('browser')
  const [backdropId, setBackdropId] = useState<string>('cupertino-sky')
  const [padding, setPadding] = useState(88)
  const [shadowBlur, setShadowBlur] = useState(48)
  const [browserUrl, setBrowserUrl] = useState('ditya-tools.vercel.app')
  const [isDragging, setIsDragging] = useState(false)

  function handleLoadFile(file: File) {
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
      // Automatically pick iPhone frame if portrait image, or Browser/MacBook if landscape
      if (img.naturalHeight > img.naturalWidth * 1.25) {
        setDeviceType('iphone')
      } else {
        setDeviceType('browser')
      }
      URL.revokeObjectURL(url)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleLoadFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleLoadFile(file)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Normalize screen dimensions based on sourceImg or demo placeholder
    const rawW = sourceImg ? sourceImg.naturalWidth : 1280
    const rawH = sourceImg ? sourceImg.naturalHeight : 800
    const maxScreenDim = 1100
    const scale = Math.min(1, maxScreenDim / Math.max(1, rawW, rawH))

    let screenW = Math.max(320, Math.round(rawW * scale))
    let screenH = Math.max(240, Math.round(rawH * scale))

    if (!sourceImg && deviceType === 'iphone') {
      screenW = 460
      screenH = 960
    }

    // Calculate frame dimensions around screen
    let frameW = screenW
    let frameH = screenH
    if (deviceType === 'iphone') {
      frameW = screenW + 44
      frameH = screenH + 44
    } else if (deviceType === 'macbook') {
      frameW = screenW + 140
      frameH = screenH + 92
    } else if (deviceType === 'browser') {
      frameW = screenW
      frameH = screenH + 54
    }

    const totalW = frameW + padding * 2
    const totalH = frameH + padding * 2
    canvas.width = totalW
    canvas.height = totalH

    ctx.clearRect(0, 0, totalW, totalH)

    // Draw Background
    const preset =
      BACKDROP_PRESETS.find((p) => p.id === backdropId) ?? BACKDROP_PRESETS[0]

    if (!preset.transparent) {
      const grad = ctx.createLinearGradient(0, 0, totalW, totalH)
      grad.addColorStop(0, preset.colorStart)
      grad.addColorStop(1, preset.colorEnd)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, totalW, totalH)
    }

    const drawPlaceholderScreen = (
      x: number,
      y: number,
      w: number,
      h: number,
    ) => {
      ctx.fillStyle = '#F8FAFC'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#0F172A'
      ctx.textAlign = 'center'
      ctx.font = 'bold 28px Inter, system-ui, sans-serif'
      ctx.fillText(
        language === 'id'
          ? 'Pratinjau Mockup Screenshot'
          : 'Screenshot Mockup Preview',
        x + w / 2,
        y + h / 2 - 12,
      )
      ctx.fillStyle = '#64748B'
      ctx.font = '500 18px Inter, system-ui, sans-serif'
      ctx.fillText(
        language === 'id'
          ? 'Unggah screenshot aplikasi atau web Anda di sebelah kiri'
          : 'Upload your app or website screenshot on the left',
        x + w / 2,
        y + h / 2 + 24,
      )
    }

    const frameX = padding
    const frameY = padding

    if (deviceType === 'browser') {
      const headerH = 54
      const radius = 20

      // Drop shadow
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.42)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetY = Math.round(shadowBlur * 0.35)
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameW, frameH, radius)
      ctx.fill()
      ctx.restore()

      // Clip entire browser window
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameW, frameH, radius)
      ctx.clip()

      // macOS Window Top Bar
      ctx.fillStyle = '#1E293B'
      ctx.fillRect(frameX, frameY, frameW, headerH)

      // Traffic lights (Red, Yellow, Green)
      const lights = ['#EF4444', '#F59E0B', '#10B981']
      lights.forEach((col, idx) => {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(frameX + 26 + idx * 22, frameY + headerH / 2, 6.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // URL Bar Pill
      const pillW = Math.min(420, frameW * 0.52)
      const pillH = 30
      const pillX = frameX + (frameW - pillW) / 2
      const pillY = frameY + (headerH - pillH) / 2
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillW, pillH, 10)
      ctx.fill()

      ctx.fillStyle = '#94A3B8'
      ctx.font = '600 14px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        (browserUrl.trim() || 'ditya-tools.vercel.app').slice(0, 42),
        frameX + frameW / 2,
        frameY + headerH / 2 + 5,
      )

      // Screenshot content
      if (sourceImg) {
        ctx.drawImage(sourceImg, frameX, frameY + headerH, screenW, screenH)
      } else {
        drawPlaceholderScreen(frameX, frameY + headerH, screenW, screenH)
      }
      ctx.restore()

      // Subtle glass border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameW, frameH, radius)
      ctx.stroke()
    } else if (deviceType === 'iphone') {
      const outerRadius = 56
      const innerRadius = 42
      const bezel = 22

      // Outer Titanium Body + Shadow
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.48)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetY = Math.round(shadowBlur * 0.35)
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameW, frameH, outerRadius)
      ctx.fill()
      ctx.restore()

      // Metallic rim stroke
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameW, frameH, outerRadius)
      ctx.stroke()

      // Inner Screen Clip
      const sx = frameX + bezel
      const sy = frameY + bezel
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(sx, sy, screenW, screenH, innerRadius)
      ctx.clip()

      if (sourceImg) {
        ctx.drawImage(sourceImg, sx, sy, screenW, screenH)
      } else {
        drawPlaceholderScreen(sx, sy, screenW, screenH)
      }

      // Dynamic Island Pill
      const islandW = Math.min(132, screenW * 0.32)
      const islandH = 28
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.roundRect(
        sx + (screenW - islandW) / 2,
        sy + 14,
        islandW,
        islandH,
        14,
      )
      ctx.fill()

      // Bottom iOS Home Indicator Bar
      const homeW = Math.min(140, screenW * 0.36)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)'
      ctx.beginPath()
      ctx.roundRect(
        sx + (screenW - homeW) / 2,
        sy + screenH - 14,
        homeW,
        5,
        3,
      )
      ctx.fill()

      ctx.restore()
    } else if (deviceType === 'macbook') {
      const lidBezel = 24
      const lidW = screenW + lidBezel * 2
      const lidH = screenH + lidBezel * 2
      const lidX = frameX + (frameW - lidW) / 2
      const lidY = frameY

      // Laptop Lid with Shadow
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.45)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetY = Math.round(shadowBlur * 0.35)
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.roundRect(lidX, lidY, lidW, lidH, [24, 24, 6, 6])
      ctx.fill()
      ctx.restore()

      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(lidX, lidY, lidW, lidH, [24, 24, 6, 6])
      ctx.stroke()

      // Screen Content
      const sx = lidX + lidBezel
      const sy = lidY + lidBezel
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(sx, sy, screenW, screenH, 8)
      ctx.clip()
      if (sourceImg) {
        ctx.drawImage(sourceImg, sx, sy, screenW, screenH)
      } else {
        drawPlaceholderScreen(sx, sy, screenW, screenH)
      }
      ctx.restore()

      // Top camera notch
      const notchW = 110
      const notchH = 14
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.roundRect(sx + (screenW - notchW) / 2, sy, notchW, notchH, [0, 0, 8, 8])
      ctx.fill()

      // Aluminum Base Deck
      const baseY = lidY + lidH - 2
      const baseH = 34
      const baseGrad = ctx.createLinearGradient(frameX, baseY, frameX + frameW, baseY)
      baseGrad.addColorStop(0, '#64748B')
      baseGrad.addColorStop(0.15, '#CBD5E1')
      baseGrad.addColorStop(0.5, '#E2E8F0')
      baseGrad.addColorStop(0.85, '#CBD5E1')
      baseGrad.addColorStop(1, '#64748B')

      ctx.fillStyle = baseGrad
      ctx.beginPath()
      ctx.roundRect(frameX, baseY, frameW, baseH, [4, 4, 22, 22])
      ctx.fill()

      // Center thumb notch on base
      ctx.fillStyle = '#94A3B8'
      ctx.beginPath()
      ctx.roundRect(frameX + frameW / 2 - 56, baseY, 112, 10, [0, 0, 8, 8])
      ctx.fill()
    } else {
      // Clean Floating Card
      const radius = 24
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.38)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetY = Math.round(shadowBlur * 0.35)
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, screenW, screenH, radius)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, screenW, screenH, radius)
      ctx.clip()
      if (sourceImg) {
        ctx.drawImage(sourceImg, frameX, frameY, screenW, screenH)
      } else {
        drawPlaceholderScreen(frameX, frameY, screenW, screenH)
      }
      ctx.restore()
    }
  }, [sourceImg, deviceType, backdropId, padding, shadowBlur, browserUrl, language])

  function handleDownload(format: 'png' | 'jpeg') {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? 0.94 : undefined)
    downloadDataUrl(
      dataUrl,
      `ditya-tools-mockup-${deviceType}.${format === 'png' ? 'png' : 'jpg'}`,
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="device-mockup" />

      <input
        id="device-mockup-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Controls Panel */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          {/* Upload Screenshot */}
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
                ? t('Ganti Gambar Screenshot', 'Change Screenshot Image')
                : t('Pilih atau Tarik Screenshot', 'Select or Drop Screenshot')}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Mendukung tangkapan layar HP, aplikasi, atau website',
                'Supports mobile, desktop app, or web screenshots',
              )}
            </p>
          </div>

          {/* Device Frame Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Pilih Bingkai Perangkat', 'Device Frame Style')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['browser', t('Browser macOS', 'macOS Browser'), Monitor],
                  ['iphone', t('iPhone 16 Pro', 'iPhone 16 Pro'), Smartphone],
                  ['macbook', t('MacBook Pro', 'MacBook Pro'), Laptop],
                  ['card', t('Kartu 3D Clean', 'Floating Card'), Monitor],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeviceType(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    deviceType === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {deviceType === 'browser' && (
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t('Teks Bar Alamat URL Browser', 'Browser Address Bar URL')}
              </label>
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                placeholder="portogilar.vercel.app"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>
          )}

          {/* Background Theme Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Tema Latar Belakang', 'Backdrop Studio Theme')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {BACKDROP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setBackdropId(preset.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-bold transition ${
                    backdropId === preset.id
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span
                    style={{
                      background: preset.transparent
                        ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                        : `linear-gradient(135deg, ${preset.colorStart}, ${preset.colorEnd})`,
                    }}
                    className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                  />
                  <span className="truncate">
                    {language === 'id' ? preset.nameId : preset.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Padding & Shadow Sliders */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Jarak Tepi Latar (Padding)', 'Outer Margin')}</span>
                <span className="text-[var(--primary)]">{padding}px</span>
              </div>
              <input
                type="range"
                min={28}
                max={160}
                step={4}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Kedalaman Bayangan (3D Shadow)', 'Drop Shadow Depth')}</span>
                <span className="text-[var(--primary)]">{shadowBlur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={4}
                value={shadowBlur}
                onChange={(e) => setShadowBlur(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="mockup-download-png-btn"
              type="button"
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-3 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              <Download size={15} />
              {t('Unduh PNG HD', 'Download PNG')}
            </button>
            <button
              id="mockup-download-jpg-btn"
              type="button"
              onClick={() => handleDownload('jpeg')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
            >
              <Download size={15} />
              {t('Unduh JPG', 'Download JPG')}
            </button>
          </div>
        </section>

        {/* Live Canvas Preview */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {t('Pratinjau Studio Mockup', 'Live Mockup Studio Preview')}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {t(
                'Cocok untuk presentasi portofolio web, tugas kuliah IT/UI, atau postingan sosmed.',
                'Ideal for web portfolios, UI/UX showcases, pitch decks, and social media posts.',
              )}
            </p>
          </div>

          <div className="my-5 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <canvas
              ref={canvasRef}
              className="max-h-[490px] max-w-full rounded-xl object-contain shadow-sm"
            />
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              'Resolusi penuh sesuai gambar asli • Tanpa watermark • 100% lokal di browser',
              'Full native resolution • Zero watermark • 100% local in-browser rendering',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
