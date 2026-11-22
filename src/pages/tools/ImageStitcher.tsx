import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { motion } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Columns2,
  Download,
  Plus,
  Rows2,
  Trash2,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  loadImageElementFromUrl,
  renderStitchedCanvas,
  type StitchDirection,
  type StitchImageItem,
} from '../../lib/imageStitcher'
import { canvasToBlob } from '../../lib/pasFoto'
import { downloadBlob } from '../../utils/download'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 15

export default function ImageStitcher() {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const urlsRef = useRef<Set<string>>(new Set())

  const [items, setItems] = useState<StitchImageItem[]>([])
  const [direction, setDirection] = useState<StitchDirection>('vertical')
  const [normalizeSize, setNormalizeSize] = useState(true)
  const [gapPx, setGapPx] = useState(0)
  const [paddingPx, setPaddingPx] = useState(0)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const trackedUrls = urlsRef.current
    return () => {
      trackedUrls.forEach((url) => URL.revokeObjectURL(url))
      trackedUrls.clear()
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      return
    }

    let cancelled = false

    renderStitchedCanvas(items, {
      direction,
      normalizeSize,
      gapPx,
      paddingPx,
      backgroundColor,
    })
      .then((canvas) => {
        if (!cancelled) {
          setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9))
        }
      })
      .catch(() => {
        if (!cancelled) setPreviewDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [items, direction, normalizeSize, gapPx, paddingPx, backgroundColor])

  async function addFiles(fileList: FileList | File[]) {
    setError('')
    setSuccess('')

    const files = Array.from(fileList).filter((file) =>
      SUPPORTED_TYPES.includes(file.type),
    )

    if (files.length === 0) {
      setError(
        t(
          'Pilih gambar berformat JPG, PNG, atau WebP.',
          'Please select JPG, PNG, or WebP images.',
        ),
      )
      return
    }

    const available = MAX_IMAGES - items.length
    if (available <= 0) {
      setError(
        t(
          `Maksimal ${MAX_IMAGES} gambar dalam satu gabungan.`,
          `Maximum ${MAX_IMAGES} images allowed.`,
        ),
      )
      return
    }

    const toProcess = files.slice(0, available)
    const loadedItems: StitchImageItem[] = []

    for (const file of toProcess) {
      const url = URL.createObjectURL(file)
      urlsRef.current.add(url)
      try {
        const img = await loadImageElementFromUrl(url)
        loadedItems.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: url,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      } catch {
        URL.revokeObjectURL(url)
        urlsRef.current.delete(url)
      }
    }

    setItems((prev) => [...prev, ...loadedItems])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void addFiles(event.target.files)
    }
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files) {
      void addFiles(event.dataTransfer.files)
    }
  }

  function moveItem(index: number, delta: -1 | 1) {
    const nextIdx = index + delta
    if (nextIdx < 0 || nextIdx >= items.length) return
    setItems((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(index, 1)
      copy.splice(nextIdx, 0, moved)
      return copy
    })
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
        urlsRef.current.delete(target.previewUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  function clearAll() {
    items.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl)
      urlsRef.current.delete(item.previewUrl)
    })
    setItems([])
    setPreviewDataUrl('')
    setError('')
    setSuccess('')
  }

  async function handleExport(format: 'png' | 'jpg') {
    if (items.length === 0) return
    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const canvas = await renderStitchedCanvas(items, {
        direction,
        normalizeSize,
        gapPx,
        paddingPx,
        backgroundColor,
      })

      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvas, mime, 0.94)
      downloadBlob(blob, `ditya-stitched-${direction}.${format}`)
      setSuccess(
        t(
          'Gambar gabungan berhasil diunduh ke perangkat Anda.',
          'Stitched image downloaded to your device.',
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('Gagal menggabungkan gambar.', 'Failed to stitch images.'),
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
        <ToolPageHeader toolId="image-stitcher" />

        <input
          id="stitcher-file-input"
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {items.length === 0 ? (
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
            className={`ios-card mt-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'hover:border-[var(--primary-border)]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Upload size={22} />
            </div>
            <p className="mt-4 text-base font-bold text-[var(--text-primary)]">
              {t(
                'Pilih beberapa screenshot atau tarik gambar ke sini',
                'Select multiple screenshots or drop images here',
              )}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {t(
                'Gabung chat panjang, bukti transfer, atau foto berdampingan (Maks 15 gambar)',
                'Merge long chats, receipts, or side-by-side photos (Max 15 images)',
              )}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* Controls & Image List */}
            <div className="space-y-5 lg:col-span-5">
              <section className="ios-card p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {items.length} {t('Gambar Dipilih', 'Images Selected')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      id="stitcher-add-more"
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                    >
                      <Plus size={13} />
                      {t('Tambah', 'Add')}
                    </button>
                    <button
                      id="stitcher-clear-all"
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--error)]"
                    >
                      <Trash2 size={13} />
                      {t('Hapus Semua', 'Clear')}
                    </button>
                  </div>
                </div>

                {/* Direction */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Arah Penggabungan', 'Stitch Direction')}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      id="stitcher-dir-vertical"
                      type="button"
                      onClick={() => setDirection('vertical')}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        direction === 'vertical'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Rows2 size={15} />
                      {t('Vertikal (Ke Bawah)', 'Vertical (Top-Down)')}
                    </button>
                    <button
                      id="stitcher-dir-horizontal"
                      type="button"
                      onClick={() => setDirection('horizontal')}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        direction === 'horizontal'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Columns2 size={15} />
                      {t('Horizontal (Menyamping)', 'Horizontal (Side-by-Side)')}
                    </button>
                  </div>
                </div>

                {/* Spacing & Normalize */}
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <input
                      id="stitcher-normalize"
                      type="checkbox"
                      checked={normalizeSize}
                      onChange={(e) => setNormalizeSize(e.target.checked)}
                      className="rounded accent-[var(--primary)]"
                    />
                    {direction === 'vertical'
                      ? t(
                          'Samakan lebar seluruh gambar otomatis',
                          'Match width across all images automatically',
                        )
                      : t(
                          'Samakan tinggi seluruh gambar otomatis',
                          'Match height across all images automatically',
                        )}
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="stitcher-gap">
                          {t('Jarak Antar Gambar', 'Gap')}
                        </label>
                        <span>{gapPx}px</span>
                      </div>
                      <input
                        id="stitcher-gap"
                        type="range"
                        min={0}
                        max={48}
                        step={4}
                        value={gapPx}
                        onChange={(e) => setGapPx(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <label htmlFor="stitcher-pad">
                          {t('Tepi Bingkai (Padding)', 'Outer Padding')}
                        </label>
                        <span>{paddingPx}px</span>
                      </div>
                      <input
                        id="stitcher-pad"
                        type="range"
                        min={0}
                        max={48}
                        step={4}
                        value={paddingPx}
                        onChange={(e) => setPaddingPx(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('Warna Latar Sela', 'Gap Background Color')}
                    </span>
                    <input
                      id="stitcher-bg-color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
                    />
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="space-y-2 border-t border-[var(--border)] pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Urutan Gambar', 'Image Sequence')}
                  </span>

                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                              #{idx + 1} • {item.file.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {item.width}×{item.height}px
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItem(idx, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => moveItem(idx, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] disabled:opacity-30"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--error)]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Preview & Export */}
            <div className="lg:col-span-7">
              <div className="ios-card p-5 sm:p-6">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Pratinjau Gabungan Gambar', 'Stitched Image Preview')}
                </h2>

                <div className="mt-4 flex max-h-[520px] min-h-[320px] items-center justify-center overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  {previewDataUrl && (
                    <img
                      src={previewDataUrl}
                      alt="Stitched preview"
                      className="max-h-[480px] max-w-full rounded-lg object-contain shadow-sm"
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    id="stitcher-download-jpg"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('jpg')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  >
                    <Download size={16} />
                    {t('Unduh JPG Gabungan', 'Download Stitched JPG')}
                  </button>

                  <button
                    id="stitcher-download-png"
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleExport('png')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
                  >
                    <Download size={16} />
                    PNG
                  </button>
                </div>

                {error && (
                  <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-[var(--error)]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                    <Check size={15} />
                    {success}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  )
}
