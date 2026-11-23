import { useEffect, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  Camera,
  CameraOff,
  FlipHorizontal2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'

const SAMPLE_SCRIPT_ID = `Halo semuanya! Selamat datang di presentasi singkat kali ini.

Saat kita merekam video presentasi tugas kuliah, latihan public speaking, atau membuat konten Reels dan TikTok, sering kali kita lupa poin penting yang ingin disampaikan.

Dengan Teleprompter ini, Anda cukup menaruh naskah di layar, mengatur kecepatan jalan teks, dan membaca tepat pada area garis fokus mata di dekat kamera.

Hasilnya: kontak mata Anda ke kamera tetap terlihat natural, bicara jauh lebih lancar tanpa "eee...", dan proses rekaman selesai dalam satu kali take!

Selamat mencoba dan semoga rekaman Anda berjalan lancar!`

const SAMPLE_SCRIPT_EN = `Hello everyone! Welcome to today's presentation.

When recording video assignments, rehearsing a speech, or filming short-form content, it is easy to lose track of your key talking points.

With this browser Teleprompter, simply paste your script, set your comfortable reading speed, and read along the eye-line focus bar near your camera lens.

Your eye contact stays natural, your delivery sounds confident, and you can nail your recording in a single take!`

export default function Teleprompter() {
  const { language, t } = useLanguage()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [script, setScript] = useState(
    language === 'id' ? SAMPLE_SCRIPT_ID : SAMPLE_SCRIPT_EN,
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3)
  const [fontSize, setFontSize] = useState(32)
  const [isMirrored, setIsMirrored] = useState(false)
  const [alignCenter, setAlignCenter] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)

  // Smooth 60fps auto-scroll loop
  useEffect(() => {
    if (!isPlaying) return

    let rafId = 0
    let lastTime = performance.now()
    let subPixelAccumulator = 0

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      const el = scrollerRef.current
      if (el) {
        const pixelsPerSecond = speed * 22
        subPixelAccumulator += pixelsPerSecond * dt
        if (subPixelAccumulator >= 0.5) {
          const delta = subPixelAccumulator
          subPixelAccumulator = 0
          el.scrollTop += delta

          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
            setIsPlaying(false)
            return
          }
        }
      }

      rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(rafId)
  }, [isPlaying, speed])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop())
      }
    }
  }, [])

  function handleResetScroll() {
    setIsPlaying(false)
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0
    }
  }

  async function toggleCamera() {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraActive(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
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
      setCameraActive(false)
    }
  }

  async function toggleFullscreen() {
    const stage = stageRef.current
    if (!stage) return

    try {
      if (!document.fullscreenElement) {
        await stage.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      setIsFullscreen((prev) => !prev)
    }
  }

  const wordCount = script
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const estMinutes = Math.max(1, Math.round(wordCount / 125))

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="teleprompter" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: Script Editor & Settings */}
        <section className="ios-card h-fit space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <label
              htmlFor="teleprompter-script"
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              {t('Naskah Presentasi / Video', 'Presentation / Video Script')}
            </label>
            <button
              type="button"
              onClick={() => {
                setScript(
                  language === 'id' ? SAMPLE_SCRIPT_ID : SAMPLE_SCRIPT_EN,
                )
                handleResetScroll()
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
            >
              <Sparkles size={12} />
              {t('Isi Contoh', 'Sample Script')}
            </button>
          </div>

          <textarea
            id="teleprompter-script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            placeholder={t(
              'Ketik atau tempel naskah pidato, presentasi, atau konten video Anda di sini...',
              'Paste or type your presentation or video script here...',
            )}
            className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3.5 text-xs leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
          />

          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
            <span>
              {wordCount} {t('kata', 'words')}
            </span>
            <span>
              ~{estMinutes} {t('menit durasi baca normal', 'min speaking time')}
            </span>
          </div>

          {/* Speed Slider */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-primary)]">
                <span>{t('Kecepatan Jalan Teks', 'Scroll Speed')}</span>
                <span className="text-[var(--primary)]">{speed}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-primary)]">
                <span>{t('Ukuran Huruf Layar', 'Font Size')}</span>
                <span className="text-[var(--primary)]">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={20}
                max={58}
                step={2}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          {/* Display Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAlignCenter((prev) => !prev)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
            >
              {alignCenter ? <AlignCenter size={14} /> : <AlignLeft size={14} />}
              {alignCenter
                ? t('Rata Tengah', 'Centered')
                : t('Rata Kiri', 'Left Align')}
            </button>

            <button
              type="button"
              onClick={() => setIsMirrored((prev) => !prev)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                isMirrored
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
              }`}
            >
              <FlipHorizontal2 size={14} />
              {t('Mode Cermin', 'Mirror Flip')}
            </button>
          </div>
        </section>

        {/* Right: Teleprompter Studio Stage */}
        <section
          ref={stageRef}
          className="relative flex min-h-[480px] flex-col overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 text-white shadow-xl"
        >
          {/* Top Studio Control Bar */}
          <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                id="teleprompter-play-btn"
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xs transition ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[var(--primary)] hover:opacity-95'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} />
                    {t('Jeda (Pause)', 'Pause')}
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    {t('Mulai Jalan', 'Start Scroll')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetScroll}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <RotateCcw size={13} />
                {t('Ke Awal', 'Reset')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleCamera()}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  cameraActive
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cameraActive ? <CameraOff size={13} /> : <Camera size={13} />}
                <span className="hidden sm:inline">
                  {cameraActive
                    ? t('Tutup Kamera', 'Hide Camera')
                    : t('Cermin Kamera', 'Selfie Cam')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                title={t('Layar Penuh', 'Fullscreen')}
              >
                {isFullscreen ? (
                  <Minimize2 size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}
                <span className="hidden sm:inline">
                  {t('Layar Penuh', 'Fullscreen')}
                </span>
              </button>
            </div>
          </div>

          {/* Optional Front Camera PiP Preview near top camera lens */}
          {cameraActive && (
            <div className="z-20 mx-auto mt-3 overflow-hidden rounded-2xl border-2 border-sky-400/50 bg-black shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-24 w-40 -scale-x-100 object-cover sm:h-28 sm:w-48"
              />
            </div>
          )}

          {/* Eye-line Reading Guide Highlight Band */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[34%] z-10 h-20 border-y border-sky-400/35 bg-sky-400/10"
          >
            <span className="absolute left-3 top-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400/80">
              ▸ {t('Fokus Baca di Sini', 'Read Here (Eye Line)')}
            </span>
          </div>

          {/* Scrolling Script Container */}
          <div
            ref={scrollerRef}
            className="relative flex-1 overflow-y-auto px-6 py-36 sm:px-12"
            style={{
              maxHeight: isFullscreen ? 'calc(100dvh - 60px)' : '500px',
            }}
          >
            <div
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.55,
                transform: isMirrored ? 'scaleX(-1)' : undefined,
              }}
              className={`mx-auto max-w-2xl whitespace-pre-wrap font-bold tracking-tight text-white select-none ${
                alignCenter ? 'text-center' : 'text-left'
              }`}
            >
              {script ||
                t(
                  'Tulis naskah Anda di panel sebelah kiri...',
                  'Type your script in the left panel...',
                )}
            </div>
            <div className="h-64" />
          </div>
        </section>
      </div>
    </main>
  )
}
