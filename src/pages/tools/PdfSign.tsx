import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from 'react'

import { motion } from 'motion/react'

import {
  Check,
  Download,
  Eraser,
  FileSignature,
  LoaderCircle,
  Stamp,
  Upload,
  X,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import {
  addWatermarkToPdf,
  embedSignatureInPdf,
  inspectPdfForSign,
  type PdfSignSummary,
} from '../../lib/pdfSign'

import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

type ToolMode = 'signature' | 'watermark'
type SignatureSource = 'draw' | 'upload'
type TargetPagesMode = 'first' | 'last' | 'all'

const PEN_COLORS = [
  { label: 'Black', value: '#0f172a' },
  { label: 'Navy', value: '#1e3a8a' },
  { label: 'Blue', value: '#0284c7' },
]

export default function PdfSign() {
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const sigUploadRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfInfo, setPdfInfo] = useState<PdfSignSummary | null>(null)
  const [mode, setMode] = useState<ToolMode>('signature')

  // Signature state
  const [sigSource, setSigSource] = useState<SignatureSource>('draw')
  const [penColor, setPenColor] = useState('#0f172a')
  const [penWidth, setPenWidth] = useState(3)
  const [hasStroke, setHasStroke] = useState(false)
  const [uploadedSigFile, setUploadedSigFile] = useState<File | null>(null)
  const [uploadedSigPreview, setUploadedSigPreview] = useState('')
  const [targetPages, setTargetPages] = useState<TargetPagesMode>('last')
  const [xPercent, setXPercent] = useState(74)
  const [yPercent, setYPercent] = useState(80)
  const [widthPercent, setWidthPercent] = useState(24)

  // Watermark state
  const [wmText, setWmText] = useState('CONFIDENTIAL')
  const [wmPlacement, setWmPlacement] = useState<'diagonal' | 'footer'>('diagonal')
  const [wmOpacity, setWmOpacity] = useState(0.22)
  const [wmFontSize, setWmFontSize] = useState(48)
  const [wmAngle, setWmAngle] = useState(35)
  const [wmColor, setWmColor] = useState('#334155')

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    return () => {
      if (uploadedSigPreview) URL.revokeObjectURL(uploadedSigPreview)
    }
  }, [uploadedSigPreview])

  async function handlePdfFile(file: File) {
    setError('')
    setSuccess('')

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document.')
      return
    }

    try {
      const info = await inspectPdfForSign(file)
      setPdfFile(file)
      setPdfInfo(info)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to read this PDF file.',
      )
    }
  }

  function handlePdfInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (selected) void handlePdfFile(selected)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void handlePdfFile(dropped)
  }

  function getCanvasCoords(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    canvas.setPointerCapture(event.pointerId)
    const { x, y } = getCanvasCoords(event)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth * 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
    setHasStroke(true)
  }

  function drawMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasCoords(event)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDrawing() {
    isDrawingRef.current = false
  }

  function clearSignaturePad() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  function handleSigUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.type !== 'image/png') {
      setError('Upload a transparent PNG image for your signature.')
      return
    }

    if (uploadedSigPreview) URL.revokeObjectURL(uploadedSigPreview)
    setUploadedSigFile(file)
    setUploadedSigPreview(URL.createObjectURL(file))
    setError('')
  }

  async function getSignaturePngBytes(): Promise<ArrayBuffer> {
    if (sigSource === 'upload') {
      if (!uploadedSigFile) {
        throw new Error('Upload a signature PNG image first.')
      }
      return uploadedSigFile.arrayBuffer()
    }

    const canvas = canvasRef.current
    if (!canvas || !hasStroke) {
      throw new Error('Draw your signature on the pad first.')
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Failed to capture signature.'))
          return
        }
        resolve(result)
      }, 'image/png')
    })

    return blob.arrayBuffer()
  }

  async function handleExportPdf() {
    if (!pdfFile) return
    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const baseName = pdfFile.name.replace(/\.pdf$/i, '')

      if (mode === 'signature') {
        const signaturePngBytes = await getSignaturePngBytes()
        const outBlob = await embedSignatureInPdf(pdfFile, {
          signaturePngBytes,
          targetPages,
          xPercent,
          yPercent,
          widthPercent,
        })
        downloadBlob(outBlob, `${baseName}-signed.pdf`)
        setSuccess('Signed PDF downloaded.')
      } else {
        const outBlob = await addWatermarkToPdf(pdfFile, {
          text: wmText,
          opacity: wmOpacity,
          fontSize: wmFontSize,
          angleDegrees: wmAngle,
          colorHex: wmColor,
          placement: wmPlacement,
        })
        downloadBlob(outBlob, `${baseName}-watermarked.pdf`)
        setSuccess('Watermarked PDF downloaded.')
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to process PDF.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="pdf-sign" />

        <input
          id="pdf-sign-file-input"
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          onChange={handlePdfInput}
          className="hidden"
        />

        <input
          id="pdf-sign-image-input"
          ref={sigUploadRef}
          type="file"
          accept="image/png"
          onChange={handleSigUpload}
          className="hidden"
        />

        {!pdfFile || !pdfInfo ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => pdfInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pdfInputRef.current?.click()
              }
            }}
            className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)] hover:bg-[var(--surface-soft)]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-text)]">
              <Upload size={22} />
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              Drop a PDF document here or click to browse
            </p>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Contracts, application forms, invoices, or drafts stay strictly on your device.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-6">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {pdfFile.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatFileSize(pdfFile.size)} • {pdfInfo.pageCount}{' '}
                      {pdfInfo.pageCount === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                  <button
                    id="pdf-sign-clear-pdf"
                    type="button"
                    onClick={() => {
                      setPdfFile(null)
                      setPdfInfo(null)
                      setSuccess('')
                      setError('')
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    aria-label="Remove PDF"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Mode switcher */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    id="pdf-sign-mode-signature"
                    type="button"
                    onClick={() => setMode('signature')}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      mode === 'signature'
                        ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <FileSignature size={16} />
                    Signature
                  </button>
                  <button
                    id="pdf-sign-mode-watermark"
                    type="button"
                    onClick={() => setMode('watermark')}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      mode === 'watermark'
                        ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Stamp size={16} />
                    Watermark
                  </button>
                </div>

                {mode === 'signature' ? (
                  <div className="mt-5 space-y-5">
                    <div className="flex gap-2">
                      <button
                        id="pdf-sign-src-draw"
                        type="button"
                        onClick={() => setSigSource('draw')}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          sigSource === 'draw'
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Draw signature
                      </button>
                      <button
                        id="pdf-sign-src-upload"
                        type="button"
                        onClick={() => setSigSource('upload')}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          sigSource === 'upload'
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Upload PNG
                      </button>
                    </div>

                    {sigSource === 'draw' ? (
                      <div>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {PEN_COLORS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => setPenColor(color.value)}
                                className={`h-6 w-6 rounded-full border-2 transition ${
                                  penColor === color.value
                                    ? 'border-[var(--primary)] scale-110'
                                    : 'border-slate-300'
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`Pen color ${color.label}`}
                              />
                            ))}
                            <input
                              id="pdf-sign-pen-width"
                              type="range"
                              min={1}
                              max={6}
                              value={penWidth}
                              onChange={(e) => setPenWidth(Number(e.target.value))}
                              className="ml-2 w-20 accent-[var(--primary)]"
                              aria-label="Pen thickness"
                            />
                          </div>

                          <button
                            id="pdf-sign-clear-pad"
                            type="button"
                            onClick={clearSignaturePad}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
                          >
                            <Eraser size={13} />
                            Clear
                          </button>
                        </div>

                        <canvas
                          id="pdf-sign-canvas"
                          ref={canvasRef}
                          width={560}
                          height={200}
                          onPointerDown={startDrawing}
                          onPointerMove={drawMove}
                          onPointerUp={stopDrawing}
                          onPointerCancel={stopDrawing}
                          className="w-full touch-none rounded-xl border border-[var(--border)] bg-white"
                        />
                        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                          Sign above with mouse, trackpad, or touch. Exported with transparent background.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-center">
                        {uploadedSigPreview ? (
                          <div className="space-y-3">
                            <img
                              src={uploadedSigPreview}
                              alt="Uploaded signature"
                              className="mx-auto max-h-28 rounded bg-white p-2"
                            />
                            <button
                              type="button"
                              onClick={() => sigUploadRef.current?.click()}
                              className="text-xs font-medium text-[var(--primary-text)] hover:underline"
                            >
                              Choose another PNG
                            </button>
                          </div>
                        ) : (
                          <button
                            id="pdf-sign-upload-png-btn"
                            type="button"
                            onClick={() => sigUploadRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--primary-border)]"
                          >
                            <Upload size={14} />
                            Choose transparent PNG
                          </button>
                        )}
                      </div>
                    )}

                    {/* Target pages & position */}
                    <div className="space-y-3 border-t border-[var(--border)] pt-4">
                      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Apply to Page(s)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ['first', 'First page'],
                            ['last', 'Last page'],
                            ['all', 'All pages'],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            id={`pdf-sign-page-${value}`}
                            type="button"
                            onClick={() => setTargetPages(value)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                              targetPages === value
                                ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                                : 'border-[var(--border)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                        <div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <label htmlFor="pdf-sign-x">X Pos</label>
                            <span>{xPercent}%</span>
                          </div>
                          <input
                            id="pdf-sign-x"
                            type="range"
                            min={12}
                            max={88}
                            value={xPercent}
                            onChange={(e) => setXPercent(Number(e.target.value))}
                            className="mt-1 w-full accent-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <label htmlFor="pdf-sign-y">Y Pos</label>
                            <span>{yPercent}%</span>
                          </div>
                          <input
                            id="pdf-sign-y"
                            type="range"
                            min={10}
                            max={92}
                            value={yPercent}
                            onChange={(e) => setYPercent(Number(e.target.value))}
                            className="mt-1 w-full accent-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <label htmlFor="pdf-sign-size">Width</label>
                            <span>{widthPercent}%</span>
                          </div>
                          <input
                            id="pdf-sign-size"
                            type="range"
                            min={10}
                            max={50}
                            value={widthPercent}
                            onChange={(e) =>
                              setWidthPercent(Number(e.target.value))
                            }
                            className="mt-1 w-full accent-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="pdf-wm-text"
                        className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                      >
                        Watermark Text
                      </label>
                      <input
                        id="pdf-wm-text"
                        type="text"
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        placeholder="CONFIDENTIAL"
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="pdf-wm-diagonal"
                        type="button"
                        onClick={() => setWmPlacement('diagonal')}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                          wmPlacement === 'diagonal'
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Diagonal Stamp
                      </button>
                      <button
                        id="pdf-wm-footer"
                        type="button"
                        onClick={() => setWmPlacement('footer')}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                          wmPlacement === 'footer'
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Bottom Footer
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                          <label htmlFor="pdf-wm-opacity">Opacity</label>
                          <span>{Math.round(wmOpacity * 100)}%</span>
                        </div>
                        <input
                          id="pdf-wm-opacity"
                          type="range"
                          min={0.08}
                          max={0.6}
                          step={0.02}
                          value={wmOpacity}
                          onChange={(e) => setWmOpacity(Number(e.target.value))}
                          className="mt-1 w-full accent-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                          <label htmlFor="pdf-wm-size">Font Size</label>
                          <span>{wmFontSize}pt</span>
                        </div>
                        <input
                          id="pdf-wm-size"
                          type="range"
                          min={12}
                          max={84}
                          value={wmFontSize}
                          onChange={(e) => setWmFontSize(Number(e.target.value))}
                          className="mt-1 w-full accent-[var(--primary)]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      {wmPlacement === 'diagonal' && (
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <label htmlFor="pdf-wm-angle">Angle</label>
                            <span>{wmAngle}°</span>
                          </div>
                          <input
                            id="pdf-wm-angle"
                            type="range"
                            min={-60}
                            max={60}
                            value={wmAngle}
                            onChange={(e) => setWmAngle(Number(e.target.value))}
                            className="mt-1 w-full accent-[var(--primary)]"
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="pdf-wm-color"
                          className="block text-xs text-[var(--text-secondary)]"
                        >
                          Color
                        </label>
                        <input
                          id="pdf-wm-color"
                          type="color"
                          value={wmColor}
                          onChange={(e) => setWmColor(e.target.value)}
                          className="mt-1 h-8 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right column: Placement guide preview + Export */}
            <div className="space-y-4 lg:col-span-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Page Placement Preview
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Approximate placement relative to page dimensions.
                </p>

                <div className="mt-4 flex justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-6">
                  <div
                    className="relative overflow-hidden rounded border border-slate-300 bg-white shadow-sm"
                    style={{
                      width: 240,
                      aspectRatio: `${pdfInfo.firstPageWidth} / ${pdfInfo.firstPageHeight}`,
                    }}
                  >
                    {/* Subtle mock lines representing document content */}
                    <div className="space-y-2 p-5 opacity-25">
                      <div className="h-2.5 w-2/3 rounded bg-slate-400" />
                      <div className="h-2 w-full rounded bg-slate-300" />
                      <div className="h-2 w-5/6 rounded bg-slate-300" />
                      <div className="h-2 w-4/5 rounded bg-slate-300" />
                      <div className="mt-4 h-2 w-full rounded bg-slate-300" />
                      <div className="h-2 w-3/4 rounded bg-slate-300" />
                    </div>

                    {mode === 'signature' ? (
                      <div
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-sky-500 bg-sky-500/10 px-2 py-1 text-center text-[10px] font-semibold text-sky-700"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        Signature
                      </div>
                    ) : (
                      <div
                        className={`pointer-events-none absolute inset-x-0 flex justify-center font-bold tracking-wider ${
                          wmPlacement === 'footer'
                            ? 'bottom-3'
                            : 'top-1/2 -translate-y-1/2'
                        }`}
                        style={{
                          color: wmColor,
                          opacity: wmOpacity,
                          fontSize: `${Math.max(10, wmFontSize * 0.35)}px`,
                          transform:
                            wmPlacement === 'diagonal'
                              ? `translateY(-50%) rotate(${-wmAngle}deg)`
                              : undefined,
                        }}
                      >
                        {wmText || 'WATERMARK'}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  id="pdf-sign-export-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleExportPdf()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {isProcessing ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {mode === 'signature'
                    ? 'Sign & Download PDF'
                    : 'Watermark & Download PDF'}
                </button>

                {error && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 inline-flex w-full items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
                    <Check size={16} />
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
