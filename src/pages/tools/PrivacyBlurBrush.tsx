import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from 'react'
import {
  Brush,
  Download,
  EyeOff,
  RotateCcw,
  Undo2,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type BrushSensorMode = 'pixelate' | 'blur' | 'blackout'

interface BrushPoint {
  x: number
  y: number
}

interface BrushStroke {
  mode: BrushSensorMode
  radius: number
  intensity: number
  points: BrushPoint[]
}

function buildPixelatedCanvas(
  source: HTMLImageElement,
  width: number,
  height: number,
  blockSize: number,
): HTMLCanvasElement {
  const step = Math.max(4, Math.round(blockSize))
  const smallW = Math.max(1, Math.floor(width / step))
  const smallH = Math.max(1, Math.floor(height / step))

  const tiny = document.createElement('canvas')
  tiny.width = smallW
  tiny.height = smallH
  const tCtx = tiny.getContext('2d')
  tCtx?.drawImage(source, 0, 0, smallW, smallH)

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const oCtx = out.getContext('2d')
  if (oCtx) {
    oCtx.imageSmoothingEnabled = false
    oCtx.drawImage(tiny, 0, 0, smallW, smallH, 0, 0, width, height)
  }
  return out
}

function buildBlurredCanvas(
  source: HTMLImageElement,
  width: number,
  height: number,
  blurPx: number,
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')
  if (ctx) {
    ctx.filter = `blur(${Math.max(4, blurPx)}px)`
    // Draw slightly expanded so edges don't fade transparent
    ctx.drawImage(source, -12, -12, width + 24, height + 24)
    ctx.filter = 'none'
  }
  return out
}

export default function PrivacyBlurBrush() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null)
  const [brushMode, setBrushMode] = useState<BrushSensorMode>('pixelate')
  const [brushRadius, setBrushRadius] = useState(34)
  const [intensity, setIntensity] = useState(18)
  const [strokes, setStrokes] = useState<BrushStroke[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const activeStrokeRef = useRef<BrushStroke | null>(null)

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
      setStrokes([])
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

  // Render original image + all strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImg) return

    const maxDim = 1280
    const scale = Math.min(
      1,
      maxDim / Math.max(1, sourceImg.naturalWidth, sourceImg.naturalHeight),
    )
    const w = Math.max(1, Math.round(sourceImg.naturalWidth * scale))
    const h = Math.max(1, Math.round(sourceImg.naturalHeight * scale))

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Base original image
    ctx.drawImage(sourceImg, 0, 0, w, h)

    if (strokes.length === 0) return

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue

      // Create stroke mask canvas
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = w
      maskCanvas.height = h
      const mCtx = maskCanvas.getContext('2d')
      if (!mCtx) continue

      mCtx.lineCap = 'round'
      mCtx.lineJoin = 'round'
      mCtx.lineWidth = stroke.radius * 2
      mCtx.strokeStyle = '#000000'
      mCtx.fillStyle = '#000000'

      if (stroke.points.length === 1) {
        mCtx.beginPath()
        mCtx.arc(
          stroke.points[0].x,
          stroke.points[0].y,
          stroke.radius,
          0,
          Math.PI * 2,
        )
        mCtx.fill()
      } else {
        mCtx.beginPath()
        mCtx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          mCtx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        mCtx.stroke()
      }

      if (stroke.mode === 'blackout') {
        ctx.drawImage(maskCanvas, 0, 0)
      } else {
        const effectCanvas =
          stroke.mode === 'pixelate'
            ? buildPixelatedCanvas(sourceImg, w, h, stroke.intensity)
            : buildBlurredCanvas(sourceImg, w, h, stroke.intensity)

        mCtx.globalCompositeOperation = 'source-in'
        mCtx.drawImage(effectCanvas, 0, 0)
        ctx.drawImage(maskCanvas, 0, 0)
      }
    }
  }, [sourceImg, strokes])

  function getCanvasCoords(
    e: PointerEvent<HTMLCanvasElement>,
  ): BrushPoint | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!sourceImg) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = getCanvasCoords(e)
    if (!pt) return

    const newStroke: BrushStroke = {
      mode: brushMode,
      radius: brushRadius,
      intensity,
      points: [pt],
    }
    activeStrokeRef.current = newStroke
    setStrokes((prev) => [...prev, newStroke])
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!activeStrokeRef.current) return
    const pt = getCanvasCoords(e)
    if (!pt) return

    setStrokes((prev) => {
      if (prev.length === 0) return prev
      const copy = [...prev]
      const last = copy[copy.length - 1]
      copy[copy.length - 1] = {
        ...last,
        points: [...last.points, pt],
      }
      activeStrokeRef.current = copy[copy.length - 1]
      return copy
    })
  }

  function handlePointerUp() {
    activeStrokeRef.current = null
  }

  function handleUndo() {
    setStrokes((prev) => prev.slice(0, -1))
  }

  function handleDownload(format: 'png' | 'jpeg') {
    const canvas = canvasRef.current
    if (!canvas || !sourceImg) return
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? 0.94 : undefined)
    downloadDataUrl(
      dataUrl,
      `ditya-tools-sensor-foto.${format === 'png' ? 'png' : 'jpg'}`,
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="privacy-blur-brush" />

      <input
        id="privacy-blur-brush-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Left: Brush Controls */}
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
                ? t('Ganti Foto / Screenshot', 'Replace Image')
                : t('Pilih Foto atau Screenshot', 'Select Photo or Screenshot')}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Usap kuas pada wajah, plat nomor, atau nama chat untuk menyensor',
                'Brush over faces, license plates, or private text to censor',
              )}
            </p>
          </div>

          {/* Brush Effect Mode */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Brush size={13} className="text-[var(--primary)]" />
              {t('Gaya Kuas Sensor', 'Censor Brush Style')}
            </label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(
                [
                  ['pixelate', t('Mozaik TV', 'Pixelate')],
                  ['blur', t('Blur Halus', 'Soft Blur')],
                  ['blackout', t('Stabilo Hitam', 'Blackout')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBrushMode(id)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                    brushMode === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Brush Size & Intensity Sliders */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Ukuran Kuas Sensor', 'Brush Size')}</span>
                <span className="text-[var(--primary)]">{brushRadius}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={90}
                step={2}
                value={brushRadius}
                onChange={(e) => setBrushRadius(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--primary)]"
              />
            </div>

            {brushMode !== 'blackout' && (
              <div>
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>
                    {t('Tingkat Kerapatan Sensor', 'Blur / Pixelate Strength')}
                  </span>
                  <span className="text-[var(--primary)]">{intensity}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={36}
                  step={2}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--primary)]"
                />
              </div>
            )}
          </div>

          {/* Undo & Clear Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={strokes.length === 0}
              onClick={handleUndo}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] disabled:opacity-40"
            >
              <Undo2 size={14} />
              {t('Undo Goresan', 'Undo Stroke')}
            </button>

            <button
              type="button"
              disabled={strokes.length === 0}
              onClick={() => setStrokes([])}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--text-secondary)] transition hover:text-[var(--error)] disabled:opacity-40"
            >
              <RotateCcw size={14} />
              {t('Bersihkan Semua', 'Clear All')}
            </button>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="blur-brush-download-jpg-btn"
              type="button"
              disabled={!sourceImg}
              onClick={() => handleDownload('jpeg')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-3 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-40"
            >
              <Download size={15} />
              {t('Unduh JPG', 'Download JPG')}
            </button>

            <button
              id="blur-brush-download-png-btn"
              type="button"
              disabled={!sourceImg}
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] transition hover:opacity-90 disabled:opacity-40"
            >
              <Download size={15} />
              {t('Unduh PNG HD', 'Download PNG')}
            </button>
          </div>
        </section>

        {/* Right: Interactive Brush Canvas */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t(
                  'Kanvas Kuas Sensor Interaktif',
                  'Interactive Censor Brush Canvas',
                )}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t(
                  'Usap jari atau geser mouse langsung di atas bagian foto yang ingin diburamkan.',
                  'Swipe your finger or drag your mouse directly over the areas you want to blur or pixelate.',
                )}
              </p>
            </div>
            <EyeOff size={18} className="text-[var(--primary)]" />
          </div>

          <div className="my-5 flex min-h-[380px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            {sourceImg ? (
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="max-h-[490px] max-w-full cursor-crosshair touch-none rounded-xl object-contain shadow-md"
              />
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <EyeOff size={26} />
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Unggah foto untuk mulai menyensor dengan kuas',
                    'Upload a photo to start censoring with the brush',
                  )}
                </p>
                <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                  {t(
                    'Cocok untuk menyensor wajah anak/orang lewat, plat nomor kendaraan, resi paket, atau nomor HP di screenshot chat.',
                    'Great for blurring faces, license plates, shipping labels, or phone numbers in chat screenshots.',
                  )}
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              'Sensor bersifat permanen pada file yang diunduh & diproses 100% lokal di browser Anda.',
              'Redactions are permanently baked into the exported image & processed 100% locally.',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
