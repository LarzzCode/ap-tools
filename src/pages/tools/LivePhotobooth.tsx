import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  Camera,
  CameraOff,
  Download,
  FlipHorizontal2,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadDataUrl } from '../../utils/download'

type PhotoFilterId = 'natural' | 'vintage' | 'bw' | 'warm' | 'y2k'

const FILTER_CSS: Record<
  PhotoFilterId,
  { css: string; labelId: string; labelEn: string }
> = {
  natural: {
    css: 'none',
    labelId: 'Natural',
    labelEn: 'Natural',
  },
  vintage: {
    css: 'sepia(0.32) contrast(1.08) brightness(1.03)',
    labelId: 'Film Vintage',
    labelEn: 'Vintage Film',
  },
  bw: {
    css: 'grayscale(1) contrast(1.22)',
    labelId: 'Retro B&W',
    labelEn: 'Retro B&W',
  },
  warm: {
    css: 'saturate(1.28) contrast(1.06) sepia(0.14)',
    labelId: 'Warm Golden',
    labelEn: 'Warm Golden',
  },
  y2k: {
    css: 'contrast(1.14) saturate(1.22) hue-rotate(-8deg)',
    labelId: 'Cool Y2K',
    labelEn: 'Cool Y2K',
  },
}

export default function LivePhotobooth() {
  const { language, t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const stripCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [poseCount, setPoseCount] = useState<3 | 4>(4)
  const [countdownSec, setCountdownSec] = useState<3 | 5>(3)
  const [filterId, setFilterId] = useState<PhotoFilterId>('natural')
  const [mirrorSelfie, setMirrorSelfie] = useState(true)

  const [capturedFrames, setCapturedFrames] = useState<HTMLCanvasElement[]>([])
  const [isShootingSession, setIsShootingSession] = useState(false)
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null)
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0)
  const [flashVisible, setFlashVisible] = useState(false)

  const [stripColor, setStripColor] = useState('#0F172A')
  const [footerTitle, setFooterTitle] = useState('PHOTOBOX STUDIO')
  const [footerDate, setFooterDate] = useState(() =>
    new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  )
  const [error, setError] = useState('')

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
      window.requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
    } catch {
      setError(
        t(
          'Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan di browser atau unggah foto dari galeri.',
          'Unable to access camera. Please allow camera permission or upload photos from your gallery.',
        ),
      )
    }
  }

  const snapCurrentVideoFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    // Crop 4:3 landscape pose frame
    const targetW = 960
    const targetH = 720
    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = targetW
    frameCanvas.height = targetH
    const ctx = frameCanvas.getContext('2d')
    if (!ctx) return null

    const videoRatio = video.videoWidth / video.videoHeight
    const boxRatio = targetW / targetH
    let drawW = targetW
    let drawH = targetH
    if (videoRatio > boxRatio) {
      drawW = targetH * videoRatio
    } else {
      drawH = targetW / videoRatio
    }

    ctx.save()
    ctx.filter = FILTER_CSS[filterId].css
    if (mirrorSelfie) {
      ctx.translate(targetW, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(
      video,
      (targetW - drawW) / 2,
      (targetH - drawH) / 2,
      drawW,
      drawH,
    )
    ctx.restore()

    return frameCanvas
  }, [filterId, mirrorSelfie])

  // Automated multi-pose countdown session
  useEffect(() => {
    if (!isShootingSession) return

    let cancelled = false
    let timerId: number | undefined

    const runPoseSequence = (poseIdx: number, secLeft: number) => {
      if (cancelled) return

      if (secLeft > 0) {
        setCurrentPoseIndex(poseIdx)
        setActiveCountdown(secLeft)
        timerId = window.setTimeout(() => {
          runPoseSequence(poseIdx, secLeft - 1)
        }, 1000)
      } else {
        // Snap photo!
        setActiveCountdown(null)
        setFlashVisible(true)
        window.setTimeout(() => {
          if (!cancelled) setFlashVisible(false)
        }, 220)

        const snapped = snapCurrentVideoFrame()
        if (snapped) {
          setCapturedFrames((prev) => [...prev, snapped].slice(0, poseCount))
        }

        const nextPose = poseIdx + 1
        if (nextPose < poseCount) {
          timerId = window.setTimeout(() => {
            runPoseSequence(nextPose, countdownSec)
          }, 900)
        } else {
          setIsShootingSession(false)
          setActiveCountdown(null)
        }
      }
    }

    runPoseSequence(0, countdownSec)

    return () => {
      cancelled = true
      if (timerId !== undefined) window.clearTimeout(timerId)
    }
  }, [isShootingSession, poseCount, countdownSec, snapCurrentVideoFrame])

  function handleStartAutoSession() {
    if (!cameraActive) return
    setCapturedFrames([])
    setIsShootingSession(true)
  }

  function handleManualSnap() {
    if (!cameraActive || capturedFrames.length >= poseCount) return
    setFlashVisible(true)
    window.setTimeout(() => setFlashVisible(false), 180)
    const snapped = snapCurrentVideoFrame()
    if (snapped) {
      setCapturedFrames((prev) => [...prev, snapped].slice(0, poseCount))
    }
  }

  function handleFallbackUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files)
      .slice(0, poseCount)
      .forEach((file) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = 960
          c.height = 720
          const ctx = c.getContext('2d')
          if (ctx) {
            ctx.filter = FILTER_CSS[filterId].css
            const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight)
            const boxRatio = 960 / 720
            let dw = 960
            let dh = 720
            if (imgRatio > boxRatio) dw = 720 * imgRatio
            else dh = 960 / imgRatio
            ctx.drawImage(img, (960 - dw) / 2, (720 - dh) / 2, dw, dh)
          }
          setCapturedFrames((prev) => [...prev, c].slice(0, poseCount))
          URL.revokeObjectURL(url)
        }
        img.onerror = () => URL.revokeObjectURL(url)
        img.src = url
      })
    e.target.value = ''
  }

  // Render the Photobox Strip canvas
  useEffect(() => {
    const canvas = stripCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const stripW = 680
    const padX = 48
    const topPad = 48
    const gap = 26
    const slotW = stripW - padX * 2
    const slotH = Math.round(slotW * 0.72)
    const footerH = 170
    const stripH =
      topPad + poseCount * slotH + (poseCount - 1) * gap + footerH

    canvas.width = stripW
    canvas.height = stripH

    ctx.fillStyle = stripColor
    ctx.fillRect(0, 0, stripW, stripH)

    const isDark =
      stripColor.toLowerCase() === '#0f172a' ||
      stripColor.toLowerCase() === '#1e293b'
    const textColor = isDark ? '#FFFFFF' : '#0F172A'
    const subColor = isDark ? '#94A3B8' : '#64748B'
    const emptyBg = isDark ? '#1E293B' : '#E2E8F0'

    for (let i = 0; i < poseCount; i++) {
      const y = topPad + i * (slotH + gap)
      const frame = capturedFrames[i]

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(padX, y, slotW, slotH, 18)
      ctx.clip()

      if (frame) {
        ctx.drawImage(frame, padX, y, slotW, slotH)
      } else {
        ctx.fillStyle = emptyBg
        ctx.fillRect(padX, y, slotW, slotH)
        ctx.fillStyle = subColor
        ctx.textAlign = 'center'
        ctx.font = 'bold 24px Inter, system-ui, sans-serif'
        ctx.fillText(`POSE #${i + 1}`, stripW / 2, y + slotH / 2 + 8)
      }
      ctx.restore()
    }

    // Footer Branding
    ctx.textAlign = 'center'
    ctx.fillStyle = textColor
    ctx.font = 'bold 32px Inter, system-ui, sans-serif'
    ctx.fillText(
      (footerTitle.trim() || 'PHOTOBOX STUDIO').slice(0, 28),
      stripW / 2,
      stripH - 86,
    )

    ctx.fillStyle = subColor
    ctx.font = '600 20px Inter, system-ui, sans-serif'
    ctx.fillText(
      (footerDate.trim() || '').slice(0, 32),
      stripW / 2,
      stripH - 46,
    )
  }, [capturedFrames, poseCount, stripColor, footerTitle, footerDate])

  function handleDownloadStrip(format: 'png' | 'jpeg') {
    const canvas = stripCanvasRef.current
    if (!canvas) return
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const url = canvas.toDataURL(mime, format === 'jpeg' ? 0.94 : undefined)
    downloadDataUrl(
      url,
      `ditya-tools-photobox-strip.${format === 'png' ? 'png' : 'jpg'}`,
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="live-photobooth" />

      <input
        id="photobooth-fallback-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFallbackUpload}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_390px]">
        {/* Left: Live Camera Booth Stage */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Kamera Photobox Langsung (Auto-Timer)',
                    'Live Photobooth Camera Stage',
                  )}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t(
                    `Pose terambil: ${capturedFrames.length} / ${poseCount} foto`,
                    `Captured poses: ${capturedFrames.length} / ${poseCount} frames`,
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400"
                  >
                    <CameraOff size={14} />
                    {t('Matikan Kamera', 'Stop Camera')}
                  </button>
                ) : (
                  <button
                    id="photobooth-start-camera-btn"
                    type="button"
                    onClick={() => void startCamera()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    <Camera size={14} />
                    {t('Nyalakan Kamera', 'Turn On Camera')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Upload size={13} />
                  {t('Dari Galeri', 'From Gallery')}
                </button>
              </div>
            </div>

            {/* Live Video Viewport */}
            <div className="relative mt-4 flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      filter: FILTER_CSS[filterId].css,
                      transform: mirrorSelfie ? 'scaleX(-1)' : undefined,
                    }}
                    className="h-[360px] w-full object-cover sm:h-[420px]"
                  />

                  {/* Countdown Overlay */}
                  {activeCountdown !== null && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px]">
                      <span className="rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        {t(
                          `Siap Pose #${currentPoseIndex + 1} dari ${poseCount}`,
                          `Get Ready: Pose #${currentPoseIndex + 1} of ${poseCount}`,
                        )}
                      </span>
                      <span className="mt-2 text-7xl font-black text-white drop-shadow-lg">
                        {activeCountdown}
                      </span>
                    </div>
                  )}

                  {/* White Camera Flash Effect */}
                  {flashVisible && (
                    <div className="pointer-events-none absolute inset-0 bg-white" />
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-300">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
                    <Camera size={28} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">
                    {t(
                      'Nyalakan Kamera untuk Mulai Photobox!',
                      'Turn On Camera to Start the Photobooth!',
                    )}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
                    {t(
                      'Kamera akan otomatis menghitung mundur 3.. 2.. 1.. dan mengambil 3–4 pose berturut-turut ala Photobox mall.',
                      'The camera will automatically count down 3.. 2.. 1.. and snap 3–4 consecutive poses.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95"
                  >
                    <Camera size={15} />
                    {t('Buka Kamera Selfie Sekarang', 'Open Selfie Camera Now')}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--error)]">
                {error}
              </p>
            )}

            {/* Filter & Camera Controls */}
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(FILTER_CSS) as PhotoFilterId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFilterId(id)}
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                        filterId === id
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {language === 'id'
                        ? FILTER_CSS[id].labelId
                        : FILTER_CSS[id].labelEn}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMirrorSelfie((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]"
                >
                  <FlipHorizontal2 size={13} />
                  {t('Mirror', 'Mirror')}
                </button>
              </div>

              {/* Session Settings: 3/4 Poses & 3/5s Timer */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {t('Jumlah Pose:', 'Poses:')}
                  </span>
                  <div className="flex gap-1">
                    {([3, 4] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPoseCount(cnt)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          poseCount === cnt
                            ? 'bg-[var(--primary)] text-white'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {cnt}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {t('Timer:', 'Timer:')}
                  </span>
                  <div className="flex gap-1">
                    {([3, 5] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setCountdownSec(sec)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          countdownSec === sec
                            ? 'bg-[var(--primary)] text-white'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shutter Action Row */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              id="photobooth-auto-shoot-btn"
              type="button"
              disabled={!cameraActive || isShootingSession}
              onClick={handleStartAutoSession}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-40 sm:col-span-2"
            >
              <Sparkles size={15} />
              {isShootingSession
                ? t('Sedang Mengambil Pose...', 'Shooting Session...')
                : t(
                    `Mulai Sesi Otomatis (${poseCount} Pose)`,
                    `Start Auto Session (${poseCount} Poses)`,
                  )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  !cameraActive ||
                  isShootingSession ||
                  capturedFrames.length >= poseCount
                }
                onClick={handleManualSnap}
                className="flex items-center justify-center gap-1 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] disabled:opacity-40"
              >
                <Camera size={14} />
                {t('Jepret', 'Snap')}
              </button>

              <button
                type="button"
                disabled={capturedFrames.length === 0 || isShootingSession}
                onClick={() => setCapturedFrames([])}
                className="flex items-center justify-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-xs font-bold text-[var(--text-secondary)] disabled:opacity-40"
                title={t('Ulangi Foto', 'Reset Photos')}
              >
                <RotateCcw size={14} />
                {t('Ulang', 'Reset')}
              </button>
            </div>
          </div>
        </section>

        {/* Right: Strip Preview & Customization */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {t('Hasil Strip Photobox', 'Photobooth Strip Output')}
            </h2>

            {/* Strip Frame Color */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {(
                [
                  ['#0F172A', t('Hitam', 'Dark')],
                  ['#FFFFFF', t('Putih', 'White')],
                  ['#FEFCE8', t('Krem', 'Cream')],
                  ['#FCE7F3', t('Pink', 'Pink')],
                  ['#E0F2FE', t('Biru', 'Sky')],
                ] as const
              ).map(([hex, label]) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setStripColor(hex)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-1.5 text-[10px] font-bold transition ${
                    stripColor === hex
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

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={footerTitle}
                onChange={(e) => setFooterTitle(e.target.value)}
                placeholder="PHOTOBOX STUDIO"
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
              <input
                type="text"
                value={footerDate}
                onChange={(e) => setFooterDate(e.target.value)}
                placeholder="Tanggal"
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div className="my-4 flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <canvas
                ref={stripCanvasRef}
                className="max-h-[410px] w-auto rounded-xl object-contain shadow-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="photobooth-download-png-btn"
              type="button"
              onClick={() => handleDownloadStrip('png')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-3 py-3 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              <Download size={15} />
              {t('Unduh Strip PNG', 'Download PNG')}
            </button>

            <button
              id="photobooth-download-jpg-btn"
              type="button"
              onClick={() => handleDownloadStrip('jpeg')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-3 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
            >
              <Download size={15} />
              {t('Unduh Strip JPG', 'Download JPG')}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
