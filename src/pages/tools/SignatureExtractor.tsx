import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from 'react'
import {
  Download,
  Eraser,
  PenTool,
  RotateCcw,
  Scissors,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type InkColorPreset = 'black' | 'blue' | 'navy' | 'original'

const INK_RGB: Record<
  Exclude<InkColorPreset, 'original'>,
  { r: number; g: number; b: number; hex: string }
> = {
  black: { r: 15, g: 23, b: 42, hex: '#0F172A' },
  blue: { r: 29, g: 78, b: 216, hex: '#1D4ED8' },
  navy: { r: 30, g: 58, b: 138, hex: '#1E3A8A' },
}

function cropTransparentBounds(source: HTMLCanvasElement, pad = 20): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) return source

  const { width, height } = source
  const { data } = ctx.getImageData(0, 0, width, height)

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 18) {
        found = true
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (!found) return source

  const cropX = Math.max(0, minX - pad)
  const cropY = Math.max(0, minY - pad)
  const cropW = Math.min(width - cropX, maxX - minX + 1 + pad * 2)
  const cropH = Math.min(height - cropY, maxY - minY + 1 + pad * 2)

  const out = document.createElement('canvas')
  out.width = Math.max(1, cropW)
  out.height = Math.max(1, cropH)
  const outCtx = out.getContext('2d')
  outCtx?.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  return out
}

export default function SignatureExtractor() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<'photo' | 'draw'>('photo')
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null)
  const [threshold, setThreshold] = useState(168)
  const [inkBoost, setInkBoost] = useState(1.45)
  const [inkColor, setInkColor] = useState<InkColorPreset>('blue')
  const [autoTrim, setAutoTrim] = useState(true)
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [isDragging, setIsDragging] = useState(false)

  const drawStateRef = useRef<{
    drawing: boolean
    lastX: number
    lastY: number
  }>({ drawing: false, lastX: 0, lastY: 0 })

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
      setMode('photo')
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

  // Process uploaded photo to remove paper background and keep transparent signature ink
  useEffect(() => {
    if (mode !== 'photo' || !sourceImg || !outputCanvasRef.current) return

    const maxDim = 1200
    const scale = Math.min(
      1,
      maxDim / Math.max(1, sourceImg.naturalWidth, sourceImg.naturalHeight),
    )
    const w = Math.max(1, Math.round(sourceImg.naturalWidth * scale))
    const h = Math.max(1, Math.round(sourceImg.naturalHeight * scale))

    const workCanvas = document.createElement('canvas')
    workCanvas.width = w
    workCanvas.height = h
    const workCtx = workCanvas.getContext('2d')
    if (!workCtx) return

    workCtx.drawImage(sourceImg, 0, 0, w, h)
    const imgData = workCtx.getImageData(0, 0, w, h)
    const data = imgData.data

    const targetRgb = inkColor === 'original' ? null : INK_RGB[inkColor]
    const softBand = 32

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a < 10) continue

      // Perceived luminance (paper is bright, ink is dark or saturated blue/black)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (lum >= threshold) {
        // Paper background -> fully transparent
        data[i + 3] = 0
      } else {
        // Ink pixel -> calculate smooth anti-aliased alpha
        const darkness = (threshold - lum) / Math.max(1, softBand)
        const boostedAlpha = Math.min(
          255,
          Math.round(Math.pow(Math.min(1, darkness), 1 / inkBoost) * 255),
        )

        if (targetRgb) {
          data[i] = targetRgb.r
          data[i + 1] = targetRgb.g
          data[i + 2] = targetRgb.b
        }
        data[i + 3] = boostedAlpha
      }
    }

    workCtx.putImageData(imgData, 0, 0)

    const finalCanvas = autoTrim
      ? cropTransparentBounds(workCanvas, 24)
      : workCanvas

    const out = outputCanvasRef.current
    out.width = finalCanvas.width
    out.height = finalCanvas.height
    const outCtx = out.getContext('2d')
    outCtx?.clearRect(0, 0, out.width, out.height)
    outCtx?.drawImage(finalCanvas, 0, 0)
  }, [mode, sourceImg, threshold, inkBoost, inkColor, autoTrim])

  function clearDrawPad() {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }

  function handleDrawPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    drawStateRef.current = { drawing: true, lastX: x, lastY: y }
  }

  function handleDrawPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawStateRef.current.drawing || !drawCanvasRef.current) return
    const canvas = drawCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    const colorHex =
      inkColor === 'original' ? '#1D4ED8' : INK_RGB[inkColor].hex

    ctx.strokeStyle = colorHex
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(drawStateRef.current.lastX, drawStateRef.current.lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    drawStateRef.current.lastX = x
    drawStateRef.current.lastY = y
  }

  function handleDrawPointerUp() {
    drawStateRef.current.drawing = false
  }

  function handleDownloadPng() {
    if (mode === 'photo') {
      if (!outputCanvasRef.current || !sourceImg) return
      const dataUrl = outputCanvasRef.current.toDataURL('image/png')
      downloadDataUrl(dataUrl, 'ditya-tools-tanda-tangan-transparan.png')
    } else {
      if (!drawCanvasRef.current) return
      const exported = autoTrim
        ? cropTransparentBounds(drawCanvasRef.current, 24)
        : drawCanvasRef.current
      const dataUrl = exported.toDataURL('image/png')
      downloadDataUrl(dataUrl, 'ditya-tools-tanda-tangan-transparan.png')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="signature-extractor" />

      <input
        id="signature-photo-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Mode Switcher */}
      <div className="mt-6 flex">
        <div className="ios-segmented inline-flex">
          <button
            type="button"
            onClick={() => setMode('photo')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              mode === 'photo'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Eraser size={14} />
            {t('Ekstrak dari Foto Kertas', 'Extract from Paper Photo')}
          </button>

          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              mode === 'draw'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <PenTool size={14} />
            {t('Tulis Tanda Tangan di Layar', 'Draw Signature on Screen')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Controls Panel */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          {mode === 'photo' ? (
            <>
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
                    ? t('Ganti Foto Tanda Tangan', 'Replace Signature Photo')
                    : t(
                        'Pilih Foto Tanda Tangan di Kertas',
                        'Upload Photo of Signature on Paper',
                      )}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {t(
                    'Foto tanda tangan pulpen di kertas putih akan otomatis dihapus latar kertasnya',
                    'Automatically removes paper background and leaves clean ink',
                  )}
                </p>
              </div>

              {/* Paper Threshold Slider */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <span>
                      {t('Pembersih Bayangan Kertas', 'Paper Removal Threshold')}
                    </span>
                    <span className="text-[var(--primary)]">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={235}
                    step={2}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="mt-1.5 w-full accent-[var(--primary)]"
                  />
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {t(
                      'Turunkan jika bercak kertas masih terlihat, naikkan jika garis tanda tangan terputus.',
                      'Lower if paper shadows remain; raise if thin ink lines disappear.',
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <span>
                      {t('Ketebalan & Ketajaman Tinta', 'Ink Boldness Boost')}
                    </span>
                    <span className="text-[var(--primary)]">
                      {Math.round(inkBoost * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2.4}
                    step={0.05}
                    value={inkBoost}
                    onChange={(e) => setInkBoost(Number(e.target.value))}
                    className="mt-1.5 w-full accent-[var(--primary)]"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Ketebalan Pena', 'Pen Stroke Width')}</span>
                <span className="text-[var(--primary)]">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--primary)]"
              />
              <button
                type="button"
                onClick={clearDrawPad}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2 text-xs font-bold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                <RotateCcw size={13} />
                {t('Bersihkan Kanvas', 'Clear Signature Pad')}
              </button>
            </div>
          )}

          {/* Ink Color Recoloring */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Warna Tinta Tanda Tangan', 'Signature Ink Color')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['blue', t('Biru Pulpen Resmi', 'Ballpoint Blue')],
                  ['black', t('Hitam Pekat', 'Jet Black')],
                  ['navy', t('Biru Tua Navy', 'Deep Navy')],
                  ['original', t('Warna Foto Asli', 'Original Ink')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setInkColor(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    inkColor === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Crop Toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Scissors size={14} className="text-[var(--primary)]" />
              {t(
                'Potong Otomatis Area Kosong (Auto-Trim)',
                'Auto-Trim Empty Margins',
              )}
            </span>
            <input
              type="checkbox"
              checked={autoTrim}
              onChange={(e) => setAutoTrim(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
          </label>

          <button
            id="signature-download-btn"
            type="button"
            disabled={mode === 'photo' && !sourceImg}
            onClick={handleDownloadPng}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            {t(
              'Unduh Tanda Tangan Transparan (PNG)',
              'Download Transparent Signature (PNG)',
            )}
          </button>
        </section>

        {/* Right: Transparent Checkerboard Preview */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {mode === 'photo'
                ? t(
                    'Hasil Tanda Tangan PNG Transparan',
                    'Transparent PNG Signature Output',
                  )
                : t(
                    'Goreskan Tanda Tangan di Kanvas Bawah',
                    'Draw Your Signature on the Pad Below',
                  )}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {t(
                'Kotak-kotak abu menandakan latar belakang sudah 100% transparan dan siap ditempel ke Word / PDF.',
                'The checkerboard pattern indicates a 100% transparent background ready for Word or PDF documents.',
              )}
            </p>
          </div>

          <div
            style={{
              backgroundImage:
                'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)',
              backgroundSize: '20px 20px',
            }}
            className="my-5 flex min-h-[340px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] p-4"
          >
            {mode === 'photo' ? (
              sourceImg ? (
                <canvas
                  ref={outputCanvasRef}
                  className="max-h-[380px] max-w-full object-contain"
                />
              ) : (
                <div className="rounded-2xl bg-white/90 px-6 py-8 text-center shadow-xs backdrop-blur-xs">
                  <Eraser
                    size={28}
                    className="mx-auto text-[var(--primary)]"
                  />
                  <p className="mt-2.5 text-sm font-bold text-slate-900">
                    {t(
                      'Belum ada foto tanda tangan',
                      'No signature photo selected yet',
                    )}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-slate-600">
                    {t(
                      'Tulis tanda tangan di kertas putih, foto dengan HP, lalu unggah di sebelah kiri.',
                      'Sign on a piece of white paper, snap a photo, and upload it on the left.',
                    )}
                  </p>
                </div>
              )
            ) : (
              <canvas
                ref={drawCanvasRef}
                width={900}
                height={420}
                onPointerDown={handleDrawPointerDown}
                onPointerMove={handleDrawPointerMove}
                onPointerUp={handleDrawPointerUp}
                onPointerCancel={handleDrawPointerUp}
                className="h-[320px] w-full cursor-crosshair touch-none rounded-xl"
              />
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              '100% Aman: Tanda tangan Anda diproses lokal di browser dan tidak pernah disimpan di server mana pun.',
              '100% Private: Your signature is processed locally in your browser and never uploaded to any server.',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
