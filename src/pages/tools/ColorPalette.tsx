import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Copy,
  Download,
  Palette,
  Pipette,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  createColorInfo,
  extractDominantPalette,
  renderPaletteCardDataUrl,
  type ColorInfo,
} from '../../lib/colorPalette'
import { downloadDataUrl } from '../../utils/download'

export default function ColorPalette() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadedImageRef = useRef<HTMLImageElement | null>(null)

  const [fileName, setFileName] = useState('')
  const [palette, setPalette] = useState<ColorInfo[]>([])
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null)
  const [cursorMarker, setCursorMarker] = useState<{
    xPercent: number
    yPercent: number
  } | null>(null)
  const [copiedValue, setCopiedValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  function handleSelectImage(file: File) {
    setError('')
    if (
      !file.type.startsWith('image/') &&
      !/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)
    ) {
      setError(
        t('Pilih file gambar yang valid.', 'Please select a valid image file.'),
      )
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      loadedImageRef.current = img
      setFileName(file.name)
      setCursorMarker(null)

      // Draw image to interactive picker canvas
      const canvas = canvasRef.current
      if (canvas) {
        const maxDim = 900
        const scale = Math.min(
          1,
          maxDim / Math.max(1, img.naturalWidth, img.naturalHeight),
        )
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      const extracted = extractDominantPalette(img, 8)
      setPalette(extracted)
      if (extracted.length > 0) {
        setSelectedColor(extracted[0])
      }
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      setError(
        t('Gagal membaca file gambar.', 'Failed to decode the selected image.'),
      )
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) handleSelectImage(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleSelectImage(file)
  }

  function handleCanvasPick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const relX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const relY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))

    const pixelX = Math.min(
      canvas.width - 1,
      Math.max(0, Math.floor(relX * canvas.width)),
    )
    const pixelY = Math.min(
      canvas.height - 1,
      Math.max(0, Math.floor(relY * canvas.height)),
    )

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data
    const picked = createColorInfo(pixel[0], pixel[1], pixel[2])
    setSelectedColor(picked)
    setCursorMarker({ xPercent: relX * 100, yPercent: relY * 100 })
  }

  async function handleCopyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      window.setTimeout(() => {
        setCopiedValue((prev) => (prev === value ? '' : prev))
      }, 1600)
    } catch {
      // Fallback ignored
    }
  }

  function handleCopyCssVariables() {
    if (palette.length === 0) return
    const cssLines = [
      ':root {',
      ...palette.map((c, idx) => `  --palette-${idx + 1}: ${c.hex};`),
      '}',
    ].join('\n')
    void handleCopyText(cssLines)
  }

  function handleDownloadPaletteCard() {
    if (!loadedImageRef.current || palette.length === 0) return
    const dataUrl = renderPaletteCardDataUrl(loadedImageRef.current, palette)
    if (dataUrl) {
      downloadDataUrl(dataUrl, 'ditya-tools-color-palette.png')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="color-palette" />

        <input
          id="color-palette-input"
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: Image & Interactive Eyedropper */}
          <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {t(
                      'Kanvas Foto & Pipet Warna (Eyedropper)',
                      'Photo Canvas & Color Eyedropper',
                    )}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {fileName
                      ? t(
                          'Ketuk titik mana saja pada foto untuk mengambil kode warnanya',
                          'Click or tap anywhere on the image to sample that exact pixel color',
                        )
                      : t(
                          'Unggah foto poster, referensi desain, atau logo',
                          'Upload a photo, poster, design reference, or logo',
                        )}
                  </p>
                </div>

                {fileName && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:border-[var(--primary-border)]"
                  >
                    <Upload size={13} />
                    {t('Ganti Foto', 'Change Photo')}
                  </button>
                )}
              </div>

              {/* Dropzone when empty, interactive canvas when loaded */}
              {!fileName ? (
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
                  className={`mt-4 flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Palette size={24} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                    {t(
                      'Pilih atau Tarik Foto ke Sini',
                      'Select or Drop an Image Here',
                    )}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
                    {t(
                      'Otomatis mengekstrak 8 warna dominan dan mengaktifkan pipet ambil warna dari titik foto.',
                      'Automatically extracts 8 dominant colors and enables click-to-sample eyedropper.',
                    )}
                  </p>
                </div>
              ) : null}

              <div
                className={`mt-4 flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 ${
                  fileName ? 'block' : 'hidden'
                }`}
              >
                <div className="relative inline-block max-w-full">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasPick}
                    className="max-h-[420px] max-w-full cursor-crosshair rounded-xl object-contain shadow-xs"
                  />
                  {cursorMarker && selectedColor && (
                    <span
                      style={{
                        left: `${cursorMarker.xPercent}%`,
                        top: `${cursorMarker.yPercent}%`,
                        backgroundColor: selectedColor.hex,
                      }}
                      className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-2 ring-slate-900/40"
                    />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--error)]">
                {error}
              </p>
            )}
          </section>

          {/* Right: Active Color Inspector + Dominant Palette */}
          <section className="space-y-5">
            {/* Active / Picked Color Card */}
            <div className="ios-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Pipette size={16} className="text-[var(--primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Detail Warna Terpilih', 'Selected Color Inspector')}
                </h2>
              </div>

              {selectedColor ? (
                <div className="mt-4 space-y-3">
                  <div
                    style={{ backgroundColor: selectedColor.hex }}
                    className="flex h-24 items-end justify-between rounded-2xl border border-black/10 p-4 shadow-inner"
                  >
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs font-bold backdrop-blur-md ${
                        selectedColor.isLight
                          ? 'bg-black/15 text-slate-950'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {selectedColor.hex}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        selectedColor.isLight ? 'text-slate-900' : 'text-white/90'
                      }`}
                    >
                      {t('Ketuk kode di bawah untuk salin', 'Tap format below to copy')}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ['HEX', selectedColor.hex],
                        ['RGB', selectedColor.rgbCss],
                        ['HSL', selectedColor.hslCss],
                      ] as const
                    ).map(([label, val]) => {
                      const isCopied = copiedValue === val
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => void handleCopyText(val)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-left transition hover:border-[var(--primary-border)]"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                              {label}
                            </p>
                            <p className="truncate font-mono text-xs font-bold text-[var(--text-primary)]">
                              {val}
                            </p>
                          </div>
                          {isCopied ? (
                            <Check
                              size={14}
                              className="shrink-0 text-[var(--success)]"
                            />
                          ) : (
                            <Copy
                              size={13}
                              className="shrink-0 text-[var(--text-muted)]"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {t(
                    'Unggah gambar terlebih dahulu untuk melihat detail kode warna HEX, RGB, dan HSL.',
                    'Upload an image first to inspect HEX, RGB, and HSL color codes.',
                  )}
                </p>
              )}
            </div>

            {/* Dominant Palette Grid */}
            <div className="ios-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {t('Palet Warna Dominan', 'Dominant Color Palette')}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t(
                      'Ketuk kotak warna untuk menyalin kode HEX secara langsung',
                      'Tap any swatch to select and copy its HEX code immediately',
                    )}
                  </p>
                </div>

                {palette.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyCssVariables}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-[11px] font-bold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                  >
                    <Copy size={12} />
                    {t('Salin CSS', 'Copy CSS')}
                  </button>
                )}
              </div>

              {palette.length > 0 ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {palette.map((color) => {
                      const isCopied = copiedValue === color.hex
                      const isSelected = selectedColor?.hex === color.hex
                      return (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color)
                            void handleCopyText(color.hex)
                          }}
                          className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                            isSelected
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30'
                              : 'border-[var(--border)] hover:border-[var(--primary-border)]'
                          }`}
                        >
                          <div
                            style={{ backgroundColor: color.hex }}
                            className="flex h-16 w-full items-center justify-center"
                          >
                            {isCopied && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                <Check size={11} />
                                {t('Tersalin', 'Copied')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between bg-[var(--surface-soft)] px-2.5 py-2">
                            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                              {color.hex}
                            </span>
                            <Copy
                              size={12}
                              className="text-[var(--text-muted)] group-hover:text-[var(--primary)]"
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    id="color-palette-download-card-btn"
                    type="button"
                    onClick={handleDownloadPaletteCard}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95 sm:text-sm"
                  >
                    <Download size={16} />
                    {t(
                      'Unduh Kartu Palet Warna + Foto (PNG)',
                      'Download Photo + Color Palette Card (PNG)',
                    )}
                  </button>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-xs text-[var(--text-muted)]">
                  {t(
                    '8 warna dominan akan tampil otomatis di sini begitu foto dipilih.',
                    '8 dominant harmonious colors will appear here once an image is selected.',
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  )
}
