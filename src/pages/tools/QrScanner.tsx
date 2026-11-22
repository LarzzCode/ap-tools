import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import jsQR from 'jsqr'

import { motion } from 'motion/react'

import {
  Camera,
  CameraOff,
  Check,
  Copy,
  ExternalLink,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function QrScanner() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [mode, setMode] = useState<'image' | 'camera'>('image')
  const [decodedText, setDecodedText] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function decodeImageFile(file: File) {
    setError('')
    setDecodedText('')
    setCopied(false)

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file containing a QR code.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Unable to load image.'))
        img.src = objectUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas is not supported in this browser.')
      }

      ctx.drawImage(image, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })

      if (!result) {
        setError('No QR code detected in this image. Try a clearer or tighter crop.')
        return
      }

      setDecodedText(result.data)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to scan image.',
      )
    }
  }

  async function startCamera() {
    setError('')
    setDecodedText('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      streamRef.current = stream
      setIsCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const scanFrame = () => {
        const video = videoRef.current
        const canvas = scanCanvasRef.current

        if (!video || !canvas || !streamRef.current) return

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code?.data) {
              setDecodedText(code.data)
              stopCamera()
              return
            }
          }
        }

        rafRef.current = requestAnimationFrame(scanFrame)
      }

      rafRef.current = requestAnimationFrame(scanFrame)
    } catch {
      stopCamera()
      setError('Camera permission denied or no camera found.')
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) void decodeImageFile(selected)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void decodeImageFile(dropped)
  }

  async function handleCopy() {
    if (!decodedText) return
    await navigator.clipboard.writeText(decodedText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const looksLikeUrl = isHttpUrl(decodedText)

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="qr-scanner" />

        <input
          id="qr-scanner-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <canvas ref={scanCanvasRef} className="hidden" />

        {/* Mode toggle */}
        <div className="mt-8 inline-flex rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            id="qr-scanner-mode-image"
            type="button"
            onClick={() => {
              stopCamera()
              setMode('image')
              setError('')
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'image'
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Upload size={15} />
            From Image
          </button>
          <button
            id="qr-scanner-mode-camera"
            type="button"
            onClick={() => {
              setMode('camera')
              setError('')
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'camera'
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Camera size={15} />
            Live Camera
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            {mode === 'image' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)]'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded QR code"
                    className="max-h-56 rounded-xl border border-[var(--border)] object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-text)]">
                    <Upload size={22} />
                  </div>
                )}
                <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {previewUrl
                    ? 'Click or drop another QR image'
                    : 'Drop a QR screenshot or click to upload'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`max-h-72 w-full object-cover ${
                      isCameraActive ? 'block' : 'hidden'
                    }`}
                  />
                  {!isCameraActive && (
                    <p className="px-4 text-center text-sm text-slate-400">
                      Click "Start Camera" to scan a QR code.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  {!isCameraActive ? (
                    <button
                      id="qr-scanner-start-camera"
                      type="button"
                      onClick={() => void startCamera()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)]"
                    >
                      <Camera size={16} />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      id="qr-scanner-stop-camera"
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)]"
                    >
                      <CameraOff size={16} />
                      Stop Camera
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <section className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Decoded Result
              </h2>

              {error ? (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : decodedText ? (
                <div className="mt-4 space-y-4">
                  <div className="break-all rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 font-mono text-xs leading-6 text-[var(--text-primary)]">
                    {decodedText}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      id="qr-scanner-copy-btn"
                      type="button"
                      onClick={() => void handleCopy()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--primary-hover)]"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>

                    {looksLikeUrl && (
                      <a
                        href={decodedText}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
                      >
                        <ExternalLink size={16} />
                        Open URL
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Scan or upload a QR code to inspect its contents safely before visiting any link.
                </p>
              )}
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
