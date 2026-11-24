import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  ArrowDown,
  ArrowUp,
  Download,
  LayoutGrid,
  Plus,
  Trash2,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type CollageLayout =
  | 'polaroid'
  | 'photostrip'
  | 'side-by-side'
  | 'grid-2x2'
  | 'grid-3x3'

interface LoadedPhotoItem {
  id: string
  name: string
  img: HTMLImageElement
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.clip()

  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight)
  const boxRatio = w / Math.max(1, h)
  let drawW = w
  let drawH = h

  if (imgRatio > boxRatio) {
    drawW = h * imgRatio
  } else {
    drawH = w / imgRatio
  }

  const drawX = x + (w - drawW) / 2
  const drawY = y + (h - drawH) / 2
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.restore()
}

export default function PhotoCollage() {
  const { language, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [photos, setPhotos] = useState<LoadedPhotoItem[]>([])
  const [layout, setLayout] = useState<CollageLayout>('polaroid')
  const [frameColor, setFrameColor] = useState('#FFFFFF')
  const [gap, setGap] = useState(24)
  const [cornerRadius, setCornerRadius] = useState(18)
  const [caption, setCaption] = useState('Good Times & Memories')
  const [dateLabel, setDateLabel] = useState(() =>
    new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  )
  const [isDragging, setIsDragging] = useState(false)

  function handleAddFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(
      (f) =>
        f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name),
    )
    if (files.length === 0) return

    files.slice(0, 9).forEach((file) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setPhotos((prev) => {
          const next = [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              img,
            },
          ].slice(0, 9)

          if (prev.length === 0 && files.length === 1) {
            setLayout('polaroid')
          } else if (prev.length + files.length === 2) {
            setLayout('side-by-side')
          } else if (prev.length + files.length === 3) {
            setLayout('photostrip')
          } else if (prev.length + files.length >= 4) {
            setLayout('grid-2x2')
          }
          return next
        })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => URL.revokeObjectURL(url)
      img.src = url
    })
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files)
      e.target.value = ''
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  function movePhoto(index: number, delta: -1 | 1) {
    setPhotos((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[target]
      copy[target] = temp
      return copy
    })
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDarkFrame =
      frameColor.toLowerCase() === '#0f172a' ||
      frameColor.toLowerCase() === '#1e293b'
    const textColor = isDarkFrame ? '#F8FAFC' : '#0F172A'
    const subTextColor = isDarkFrame ? '#94A3B8' : '#64748B'
    const emptySlotBg = isDarkFrame ? '#1E293B' : '#E2E8F0'

    const hasCaption = Boolean(caption.trim() || dateLabel.trim())
    const footerH = hasCaption ? 140 : 48

    let width = 1080
    let height = 1080 + (hasCaption ? 100 : 0)

    if (layout === 'polaroid') {
      width = 1000
      height = 1220
    } else if (layout === 'photostrip') {
      width = 680
      height = 1760
    } else if (layout === 'side-by-side') {
      width = 1200
      height = 900
    }

    canvas.width = width
    canvas.height = height

    // Fill frame background
    ctx.fillStyle = frameColor
    ctx.fillRect(0, 0, width, height)

    const drawSlot = (
      slotIndex: number,
      x: number,
      y: number,
      w: number,
      h: number,
    ) => {
      const item = photos[slotIndex]
      if (item) {
        drawCoverImage(ctx, item.img, x, y, w, h, cornerRadius)
      } else {
        ctx.fillStyle = emptySlotBg
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, cornerRadius)
        ctx.fill()

        ctx.fillStyle = subTextColor
        ctx.textAlign = 'center'
        ctx.font = 'bold 24px Inter, system-ui, sans-serif'
        ctx.fillText(
          language === 'id' ? `Foto #${slotIndex + 1}` : `Photo #${slotIndex + 1}`,
          x + w / 2,
          y + h / 2 + 8,
        )
      }
    }

    const outerPad = Math.max(36, gap + 20)

    if (layout === 'polaroid') {
      const boxW = width - 120
      const boxH = height - 300
      drawSlot(0, 60, 60, boxW, boxH)
    } else if (layout === 'photostrip') {
      const slotCount = Math.min(4, Math.max(3, photos.length || 3))
      const topPad = 56
      const availH = height - topPad - 190 - gap * (slotCount - 1)
      const slotH = availH / slotCount
      const slotW = width - 112

      for (let i = 0; i < slotCount; i++) {
        drawSlot(i, 56, topPad + i * (slotH + gap), slotW, slotH)
      }
    } else if (layout === 'side-by-side') {
      const availW = width - outerPad * 2 - gap
      const slotW = availW / 2
      const slotH = height - outerPad - footerH
      drawSlot(0, outerPad, outerPad, slotW, slotH)
      drawSlot(1, outerPad + slotW + gap, outerPad, slotW, slotH)
    } else if (layout === 'grid-2x2') {
      const cols = 2
      const rows = 2
      const availW = width - outerPad * 2 - gap
      const availH = height - outerPad - footerH - gap
      const slotW = availW / cols
      const slotH = availH / rows

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          drawSlot(
            idx,
            outerPad + c * (slotW + gap),
            outerPad + r * (slotH + gap),
            slotW,
            slotH,
          )
        }
      }
    } else {
      // grid-3x3 (or 3x2 if <= 6 photos)
      const cols = 3
      const rows = photos.length > 6 ? 3 : 2
      const availW = width - outerPad * 2 - gap * (cols - 1)
      const availH = height - outerPad - footerH - gap * (rows - 1)
      const slotW = availW / cols
      const slotH = availH / rows

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          drawSlot(
            idx,
            outerPad + c * (slotW + gap),
            outerPad + r * (slotH + gap),
            slotW,
            slotH,
          )
        }
      }
    }

    // Draw Footer Caption & Date
    if (hasCaption) {
      ctx.textAlign = 'center'
      if (caption.trim()) {
        ctx.fillStyle = textColor
        ctx.font = 'bold 34px Inter, system-ui, sans-serif'
        ctx.fillText(caption.trim().slice(0, 42), width / 2, height - 86)
      }
      if (dateLabel.trim()) {
        ctx.fillStyle = subTextColor
        ctx.font = '600 22px Inter, system-ui, sans-serif'
        ctx.fillText(dateLabel.trim().slice(0, 36), width / 2, height - 44)
      }
    }
  }, [photos, layout, frameColor, gap, cornerRadius, caption, dateLabel, language])

  function handleDownload(format: 'png' | 'jpeg') {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? 0.94 : undefined)
    downloadDataUrl(
      dataUrl,
      `ditya-tools-kolase-${layout}.${format === 'png' ? 'png' : 'jpg'}`,
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="photo-collage" />

      <input
        id="photo-collage-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls Panel */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          {/* Add Photos Dropzone */}
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
              <Plus size={20} />
            </div>
            <p className="mt-2 text-xs font-bold text-[var(--text-primary)] sm:text-sm">
              {t(
                `Tambah Foto Kolase (${photos.length}/9)`,
                `Add Collage Photos (${photos.length}/9)`,
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Bisa pilih beberapa foto sekaligus dari galeri',
                'Select multiple photos at once from your device',
              )}
            </p>
          </div>

          {/* Photo Sequence Reorder List */}
          {photos.length > 0 && (
            <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
              {photos.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs"
                >
                  <span className="truncate font-semibold text-[var(--text-primary)]">
                    #{idx + 1} • {item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePhoto(idx, -1)}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === photos.length - 1}
                      onClick={() => movePhoto(idx, 1)}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(item.id)}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Layout Style Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Gaya Bingkai & Tata Letak', 'Frame & Layout Style')}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['polaroid', t('Kartu Polaroid', 'Polaroid Card')],
                  ['photostrip', t('Strip Photobox', 'Photobooth Strip')],
                  ['side-by-side', t('2 Foto Sejajar', '2 Side-by-Side')],
                  ['grid-2x2', t('Grid 4 Foto (2×2)', '4-Photo Grid (2×2)')],
                  ['grid-3x3', t('Grid 6–9 Foto', '6–9 Photo Grid')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLayout(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    layout === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Color Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Warna Kertas Bingkai', 'Frame Paper Color')}
            </label>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(
                [
                  ['#FFFFFF', t('Putih', 'White')],
                  ['#FEFCE8', t('Krem', 'Cream')],
                  ['#0F172A', t('Hitam', 'Dark')],
                  ['#E0F2FE', t('Langit', 'Sky')],
                ] as const
              ).map(([hex, label]) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setFrameColor(hex)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                    frameColor === hex
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: hex }}
                    className="h-3.5 w-3.5 rounded-full border border-black/20"
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Caption & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                {t('Tulisan Caption Bawah', 'Bottom Caption')}
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Momen Terbaik"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                {t('Label Tanggal', 'Date Label')}
              </label>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="23 Nov 2026"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>
          </div>

          {/* Gap & Corner Radius */}
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                <span>{t('Jarak (Gap)', 'Gap')}</span>
                <span>{gap}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={48}
                step={2}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                <span>{t('Sudut Foto', 'Corners')}</span>
                <span>{cornerRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={44}
                step={2}
                value={cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="collage-download-png-btn"
              type="button"
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-3 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              <Download size={15} />
              {t('Unduh PNG HD', 'Download PNG')}
            </button>
            <button
              id="collage-download-jpg-btn"
              type="button"
              onClick={() => handleDownload('jpeg')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
            >
              <Download size={15} />
              {t('Unduh JPG', 'Download JPG')}
            </button>
          </div>
        </section>

        {/* Live Collage Preview */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t(
                  'Pratinjau Kolase & Polaroid Studio',
                  'Collage & Polaroid Studio Preview',
                )}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t(
                  'Setiap foto otomatis dipotong proporsional (center-crop) tanpa terlihat gepeng.',
                  'Each photo is automatically center-cropped proportionally without stretching.',
                )}
              </p>
            </div>
            <LayoutGrid size={18} className="text-[var(--primary)]" />
          </div>

          <div className="my-5 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <canvas
              ref={canvasRef}
              className="max-h-[520px] max-w-full rounded-xl object-contain shadow-md"
            />
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              'Kualitas Resolusi Penuh • Tanpa Watermark • 100% Lokal di Browser',
              'Full Resolution Quality • Zero Watermark • 100% Local in Your Browser',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
