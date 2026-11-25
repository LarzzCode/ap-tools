import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  Check,
  Copy,
  Crown,
  Dices,
  Download,
  FileSpreadsheet,
  ImageDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  UserMinus,
  Users,
  Volume2,
  VolumeX,
  WandSparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  WHEEL_PALETTE,
  WheelSoundEngine,
  computeSpinTargetRotation,
  cryptoRandomFloat,
  cryptoRandomInt,
  deduplicateParticipants,
  formatTeamsAsCsv,
  formatTeamsForWhatsApp,
  generateBalancedTeams,
  getSliceColor,
  getSliceIndexAtPointer,
  parseParticipants,
  renderTeamsBoardPng,
  shuffleFairly,
  type GeneratedTeam,
  type TeamNamingStyle,
  type TeamSplitMode,
} from '../../lib/spinWheel'
import { downloadBlob, downloadDataUrl } from '../../utils/download'

interface DrawHistoryItem {
  id: string
  round: number
  winner: string
  timestamp: string
}

interface ConfettiPiece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vRot: number
  color: string
  alpha: number
}

const DEFAULT_PARTICIPANTS_ID = `Budi Santoso
Siti Nurhaliza
Andi Pratama
Nadia Putri
Rizky Ramadhan
Dewi Lestari
Fajar Nugroho
Alya Rahmawati`

const DEFAULT_PARTICIPANTS_EN = `Alex Rivera
Maya Lin
Jordan Patel
Samira Khan
Liam O'Connor
Chloe Bennett
Noah Takahashi
Elena Rostova`

const PRESETS = [
  {
    id: 'arisan',
    labelId: 'Arisan / Doorprize',
    labelEn: 'Raffle / Doorprize',
    titleId: 'Undian Doorprize & Arisan',
    titleEn: 'Lucky Draw & Raffle',
    itemsId: DEFAULT_PARTICIPANTS_ID,
    itemsEn: DEFAULT_PARTICIPANTS_EN,
  },
  {
    id: 'class',
    labelId: 'Urutan Presentasi',
    labelEn: 'Class Presentation',
    titleId: 'Urutan Maju Presentasi Kelas',
    titleEn: 'Presentation Speaking Order',
    itemsId: `Kelompok 1 — Sistem Informasi
Kelompok 2 — Kecerdasan Buatan
Kelompok 3 — Keamanan Jaringan
Kelompok 4 — Desain Antarmuka UI/UX
Kelompok 5 — Komputasi Awan
Kelompok 6 — Sains Data`,
    itemsEn: `Group 1 — Distributed Systems
Group 2 — Machine Learning
Group 3 — Network Security
Group 4 — Product Design & UX
Group 5 — Cloud Architecture
Group 6 — Data Engineering`,
  },
  {
    id: 'lunch',
    labelId: 'Makan Siang Apa?',
    labelEn: 'Lunch Picker',
    titleId: 'Penentu Menu Makan Siang',
    titleEn: 'Today’s Lunch Picker',
    itemsId: `Nasi Padang Rendang
Mie Ayam Bakso
Ayam Geprek Sambal Bawang
Soto Betawi Hangat
Sate Ayam Madura
Nasi Goreng Kampung
Gado-Gado Siram
Ramen Kuah Kaldu`,
    itemsEn: ` Teriyaki Chicken Bowl
Crispy Smash Burger
Spicy Tonkotsu Ramen
Wood-Fired Margherita Pizza
Thai Basil Fried Rice
Mediterranean Falafel Wrap
Grilled Salmon Salad
Tacos Al Pastor`,
  },
  {
    id: 'futsal',
    labelId: '12 Pemain Tim / Panitia',
    labelEn: '12-Player Squad',
    titleId: 'Pembagian Tim Futsal & Panitia',
    titleEn: 'Balanced Squad Split',
    itemsId: `Raka Saputra
Dimas Aditya
Bagas Prakoso
Ilham Maulana
Reza Pahlevi
Galih Permana
Taufik Hidayat
Arif Budiman
Yoga Pratama
Hendra Wijaya
Bayu Setiawan
Farhan Akbar`,
    itemsEn: `Marcus Vance
Lucas Sterling
Owen Brooks
Ethan Morales
Caleb Foster
Julian Reed
Nathaniel Cole
Adrian Hayes
Dominic Cruz
Xavier Grant
Sebastian Park
Leo Gallagher`,
  },
] as const

export default function SpinWheel() {
  const { language, t } = useLanguage()

  const [activeTab, setActiveTab] = useState<'wheel' | 'teams'>('wheel')
  const [eventTitle, setEventTitle] = useState('')
  const [rawInput, setRawInput] = useState(() =>
    language === 'id' ? DEFAULT_PARTICIPANTS_ID : DEFAULT_PARTICIPANTS_EN,
  )
  const [eliminatedNames, setEliminatedNames] = useState<string[]>([])

  // Spin Wheel state
  const [spinDurationSec, setSpinDurationSec] = useState<3 | 5 | 8>(5)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoEliminate, setAutoEliminate] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [livePointerName, setLivePointerName] = useState('')
  const [latestWinner, setLatestWinner] = useState<DrawHistoryItem | null>(null)
  const [winnerRemovedNotice, setWinnerRemovedNotice] = useState(false)
  const [history, setHistory] = useState<DrawHistoryItem[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Team Generator state
  const [splitMode, setSplitMode] = useState<TeamSplitMode>('by-team-count')
  const [targetCount, setTargetCount] = useState(3)
  const [namingStyle, setNamingStyle] = useState<TeamNamingStyle>('numeric')
  const [pickLeader, setPickLeader] = useState(true)
  const [showSeededPot, setShowSeededPot] = useState(false)
  const [seededPotRaw, setSeededPotRaw] = useState('')
  const [generatedTeams, setGeneratedTeams] = useState<GeneratedTeam[] | null>(
    null,
  )
  const [shuffleGeneration, setShuffleGeneration] = useState(0)

  // Refs for 60fps canvas wheel, physics, sound & file upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wheelStageRef = useRef<HTMLDivElement>(null)
  const canvasBoxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const soundEngineRef = useRef<WheelSoundEngine | null>(null)

  const rotationRef = useRef(0)
  const pointerKickRef = useRef(0)
  const confettiRef = useRef<ConfettiPiece[]>([])
  const spinAnimRef = useRef<number | null>(null)
  const confettiAnimRef = useRef<number | null>(null)
  const canvasSizeRef = useRef(420)
  const roundCounterRef = useRef(0)

  const participants = useMemo(() => parseParticipants(rawInput, false), [rawInput])

  // Keep effective Teams always ready when user switches to Teams tab
  const displayedTeams = useMemo(() => {
    if (generatedTeams !== null) return generatedTeams
    if (participants.length === 0) return []
    return generateBalancedTeams({
      participants,
      splitMode,
      targetCount,
      namingStyle,
      pickLeader,
      pinnedPotRaw: showSeededPot ? seededPotRaw : '',
      language,
    })
  }, [
    generatedTeams,
    participants,
    splitMode,
    targetCount,
    namingStyle,
    pickLeader,
    showSeededPot,
    seededPotRaw,
    language,
  ])

  const triggerCopied = useCallback((key: string) => {
    setCopiedKey(key)
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev))
    }, 2000)
  }, [])

  const getSoundEngine = useCallback(() => {
    if (!soundEngineRef.current) {
      soundEngineRef.current = new WheelSoundEngine()
    }
    return soundEngineRef.current
  }, [])

  // Render crisp Retina wheel frame
  const renderWheelFrame = useCallback(
    (items: readonly string[], isSpinActive: boolean) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const cssSize = canvasSizeRef.current
      const targetPx = Math.round(cssSize * dpr)

      if (canvas.width !== targetPx || canvas.height !== targetPx) {
        canvas.width = targetPx
        canvas.height = targetPx
      }

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cssSize, cssSize)

      const cx = cssSize / 2
      const cy = cssSize / 2
      const outerMargin = Math.max(18, cssSize * 0.052)
      const wheelRadius = Math.max(60, cssSize / 2 - outerMargin)
      const rotation = rotationRef.current
      const TWO_PI = Math.PI * 2

      const safeItems =
        items.length > 0
          ? items
          : [
              language === 'id'
                ? 'Tambahkan nama peserta...'
                : 'Add participant names...',
            ]
      const count = safeItems.length
      const sliceArc = TWO_PI / count
      const activeIdx = getSliceIndexAtPointer(rotation, count)

      // Outer elevation shadow & metallic casing ring
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, wheelRadius + 7, 0, TWO_PI)
      ctx.shadowColor = 'rgba(15, 23, 42, 0.18)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      ctx.beginPath()
      ctx.arc(cx, cy, wheelRadius + 7, 0, TWO_PI)
      ctx.strokeStyle = 'rgba(60, 60, 67, 0.16)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Draw each slice
      for (let i = 0; i < count; i++) {
        const startAngle = rotation + i * sliceArc
        const endAngle = startAngle + sliceArc
        const midAngle = startAngle + sliceArc / 2
        const color =
          items.length > 0
            ? getSliceColor(i, count)
            : { fill: '#94a3b8', fillEnd: '#64748b', text: '#ffffff' }

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, wheelRadius, startAngle, endAngle)
        ctx.closePath()

        const grad = ctx.createRadialGradient(
          cx,
          cy,
          wheelRadius * 0.12,
          cx,
          cy,
          wheelRadius,
        )
        grad.addColorStop(0, color.fill)
        grad.addColorStop(1, color.fillEnd)
        ctx.fillStyle = grad
        ctx.fill()

        // Subtle inner highlight on the slice currently under the 3 o'clock pointer
        if (i === activeIdx && items.length > 1) {
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.arc(cx, cy, wheelRadius, startAngle, endAngle)
          ctx.closePath()
          ctx.fillStyle = isSpinActive
            ? 'rgba(255, 255, 255, 0.14)'
            : 'rgba(255, 255, 255, 0.08)'
          ctx.fill()
          ctx.restore()
        }

        // Crisp slice divider seam
        if (count > 1) {
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(
            cx + Math.cos(startAngle) * wheelRadius,
            cy + Math.sin(startAngle) * wheelRadius,
          )
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)'
          ctx.lineWidth = count > 32 ? 1 : 2
          ctx.stroke()
        }

        // Radial label — kept upright on both left & right hemispheres
        ctx.save()
        ctx.translate(cx, cy)
        const cosMid = Math.cos(midAngle)
        const isLeftHalf = cosMid < -0.001
        ctx.rotate(isLeftHalf ? midAngle + Math.PI : midAngle)

        const hubClearance = Math.max(38, wheelRadius * 0.24)
        const rimPadding = Math.max(16, wheelRadius * 0.085)
        const maxTextSpan = Math.max(40, wheelRadius - hubClearance - rimPadding)

        const chordAtMid = 2 * (wheelRadius * 0.62) * Math.sin(sliceArc / 2)
        const dynamicFontPx = Math.max(
          9.5,
          Math.min(
            17,
            wheelRadius * 0.082,
            chordAtMid * 0.56,
          ),
        )

        ctx.font = `700 ${dynamicFontPx.toFixed(1)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif`
        ctx.fillStyle = color.text
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.24)'
        ctx.shadowBlur = 3
        ctx.shadowOffsetY = 1

        let label = safeItems[i]
        if (ctx.measureText(label).width > maxTextSpan) {
          while (
            label.length > 2 &&
            ctx.measureText(`${label}…`).width > maxTextSpan
          ) {
            label = label.slice(0, -1)
          }
          label = `${label.trimEnd()}…`
        }

        if (isLeftHalf) {
          ctx.textAlign = 'left'
          ctx.fillText(label, -(wheelRadius - rimPadding), 0)
        } else {
          ctx.textAlign = 'right'
          ctx.fillText(label, wheelRadius - rimPadding, 0)
        }
        ctx.restore()
      }

      // Outer rim ring & brass/silver boundary pegs
      ctx.beginPath()
      ctx.arc(cx, cy, wheelRadius, 0, TWO_PI)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.lineWidth = 3
      ctx.stroke()

      if (count > 1 && count <= 48) {
        for (let i = 0; i < count; i++) {
          const pegAngle = rotation + i * sliceArc
          const px = cx + Math.cos(pegAngle) * (wheelRadius + 1)
          const py = cy + Math.sin(pegAngle) * (wheelRadius + 1)
          ctx.beginPath()
          ctx.arc(px, py, count > 24 ? 2.4 : 3.4, 0, TWO_PI)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // Center decorative collar behind the HTML button
      const collarRadius = Math.max(32, wheelRadius * 0.2)
      ctx.beginPath()
      ctx.arc(cx, cy, collarRadius, 0, TWO_PI)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(60, 60, 67, 0.15)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Physical 3 o'clock pointer stopper with spring deflection kick
      const pivotX = cx + wheelRadius + 10
      const pivotY = cy
      const kickRad = pointerKickRef.current

      ctx.save()
      ctx.translate(pivotX, pivotY)
      ctx.rotate(kickRad)

      ctx.shadowColor = 'rgba(15, 23, 42, 0.32)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 3

      // Pointer wedge pointing left into 3 o'clock edge
      ctx.beginPath()
      ctx.moveTo(-28, 0)
      ctx.lineTo(6, -13)
      ctx.quadraticCurveTo(15, 0, 6, 13)
      ctx.closePath()
      ctx.fillStyle = '#1c1c1e'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      // Pointer rivet dot
      ctx.beginPath()
      ctx.arc(4, 0, 4.2, 0, TWO_PI)
      ctx.fillStyle = '#007aff'
      ctx.fill()
      ctx.restore()

      // Confetti celebration overlay
      if (confettiRef.current.length > 0) {
        for (const c of confettiRef.current) {
          ctx.save()
          ctx.globalAlpha = Math.max(0, c.alpha)
          ctx.translate(c.x, c.y)
          ctx.rotate(c.rotation)
          ctx.fillStyle = c.color
          ctx.fillRect(-c.size / 2, -c.size * 0.32, c.size, c.size * 0.64)
          ctx.restore()
        }
      }

      ctx.restore()
    },
    [language],
  )

  // Observe responsive container width so canvas stays razor-sharp
  useEffect(() => {
    const box = canvasBoxRef.current
    if (!box) return

    const updateSize = () => {
      const rect = box.getBoundingClientRect()
      const nextSize = Math.max(260, Math.min(540, Math.floor(rect.width)))
      canvasSizeRef.current = nextSize
      renderWheelFrame(participants, isSpinning)
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(box)
    return () => observer.disconnect()
  }, [participants, isSpinning, activeTab, isFullscreen, renderWheelFrame])

  // Redraw whenever participants change while idle
  useEffect(() => {
    if (!isSpinning) {
      renderWheelFrame(participants, false)
    }
  }, [participants, isSpinning, renderWheelFrame])

  // Sync fullscreen state with Esc key
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Cleanup animations & AudioContext on unmount
  useEffect(() => {
    return () => {
      if (spinAnimRef.current !== null) {
        window.cancelAnimationFrame(spinAnimRef.current)
      }
      if (confettiAnimRef.current !== null) {
        window.cancelAnimationFrame(confettiAnimRef.current)
      }
      soundEngineRef.current?.dispose()
    }
  }, [])

  const launchConfetti = useCallback(() => {
    const size = canvasSizeRef.current
    const cx = size / 2
    const cy = size * 0.42
    const pieces: ConfettiPiece[] = []

    for (let i = 0; i < 64; i++) {
      const angle = cryptoRandomFloat() * Math.PI * 2
      const speed = 2.4 + cryptoRandomFloat() * 6.5
      const palette = WHEEL_PALETTE[i % WHEEL_PALETTE.length]
      pieces.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.2,
        size: 7 + cryptoRandomFloat() * 6,
        rotation: cryptoRandomFloat() * Math.PI * 2,
        vRot: (cryptoRandomFloat() - 0.5) * 0.26,
        color: palette.fill,
        alpha: 1,
      })
    }

    confettiRef.current = pieces
    if (confettiAnimRef.current !== null) {
      window.cancelAnimationFrame(confettiAnimRef.current)
    }

    const stepConfetti = () => {
      let alive = 0
      for (const p of confettiRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.16
        p.vx *= 0.985
        p.rotation += p.vRot
        p.alpha -= 0.012
        if (p.alpha > 0.02 && p.y < canvasSizeRef.current + 30) {
          alive += 1
        }
      }
      renderWheelFrame(participants, false)
      if (alive > 0) {
        confettiAnimRef.current = window.requestAnimationFrame(stepConfetti)
      } else {
        confettiRef.current = []
        confettiAnimRef.current = null
        renderWheelFrame(participants, false)
      }
    }

    confettiAnimRef.current = window.requestAnimationFrame(stepConfetti)
  }, [participants, renderWheelFrame])

  const handleSpin = useCallback(() => {
    if (isSpinning || participants.length < 2) return

    // Snapshot active wheel entries at the moment spin starts
    const snapshot = [...participants]
    const count = snapshot.length
    const winnerIndex = cryptoRandomInt(count)

    const extraRevolutions =
      spinDurationSec === 3
        ? 5 + cryptoRandomInt(2)
        : spinDurationSec === 5
          ? 7 + cryptoRandomInt(3)
          : 10 + cryptoRandomInt(4)

    const startRotation = rotationRef.current
    const targetRotation = computeSpinTargetRotation(
      startRotation,
      winnerIndex,
      count,
      extraRevolutions,
    )
    const totalDelta = targetRotation - startRotation
    const durationMs = spinDurationSec * 1000

    confettiRef.current = []
    setLatestWinner(null)
    setWinnerRemovedNotice(false)
    setIsSpinning(true)

    // Warm up Web Audio context inside the direct user click gesture
    if (soundEnabled) {
      getSoundEngine().playTick(0.9)
    }

    let prevSliceIdx = getSliceIndexAtPointer(startRotation, count)
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)
      // Quintic ease-out for authentic long suspenseful coasting
      const eased = 1 - Math.pow(1 - progress, 4.4)

      const currentRot = startRotation + totalDelta * eased
      rotationRef.current = currentRot

      // Decay pointer kick smoothly back toward 0
      pointerKickRef.current *= 0.82

      const currentIdx = getSliceIndexAtPointer(currentRot, count)
      if (currentIdx !== prevSliceIdx) {
        prevSliceIdx = currentIdx
        const velocityRatio = Math.max(0.08, 1 - progress)
        // Deflect pointer tip downward as rim peg sweeps clockwise past 3 o'clock
        pointerKickRef.current = -0.34 * (0.45 + 0.55 * velocityRatio)
        setLivePointerName(snapshot[currentIdx] ?? '')
        if (soundEnabled) {
          getSoundEngine().playTick(velocityRatio)
        }
      }

      renderWheelFrame(snapshot, progress < 1)

      if (progress < 1) {
        spinAnimRef.current = window.requestAnimationFrame(animate)
      } else {
        pointerKickRef.current = 0
        spinAnimRef.current = null
        setIsSpinning(false)

        const finalIdx = getSliceIndexAtPointer(targetRotation, count)
        const winnerName = snapshot[finalIdx] ?? snapshot[winnerIndex]
        setLivePointerName(winnerName)

        const timeLabel = new Date().toLocaleTimeString(
          language === 'id' ? 'id-ID' : 'en-US',
          { hour: '2-digit', minute: '2-digit', second: '2-digit' },
        )

        roundCounterRef.current += 1
        const nextRound = roundCounterRef.current
        const record: DrawHistoryItem = {
          id: `win-${Date.now()}-${nextRound}`,
          round: nextRound,
          winner: winnerName,
          timestamp: timeLabel,
        }
        setLatestWinner(record)
        setHistory((prev) => [record, ...prev])

        if (autoEliminate && snapshot.length > 2) {
          const remaining = [...snapshot]
          remaining.splice(finalIdx, 1)
          setRawInput(remaining.join('\n'))
          setEliminatedNames((prev) => [...prev, winnerName])
          setWinnerRemovedNotice(true)
        }

        if (soundEnabled) {
          getSoundEngine().playWinChime()
        }
        launchConfetti()
      }
    }

    spinAnimRef.current = window.requestAnimationFrame(animate)
  }, [
    isSpinning,
    participants,
    spinDurationSec,
    soundEnabled,
    autoEliminate,
    language,
    getSoundEngine,
    renderWheelFrame,
    launchConfetti,
  ])

  // Spacebar shortcut when wheel tab is active and user isn't typing in an input
  useEffect(() => {
    if (activeTab !== 'wheel') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (
        tag === 'TEXTAREA' ||
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'BUTTON'
      ) {
        return
      }
      e.preventDefault()
      handleSpin()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTab, handleSpin])

  function handleEliminateLatestWinner() {
    if (!latestWinner || winnerRemovedNotice) return
    const idx = participants.findIndex((p) => p === latestWinner.winner)
    if (idx === -1) return
    const next = [...participants]
    next.splice(idx, 1)
    setRawInput(next.join('\n'))
    setEliminatedNames((prev) => [...prev, latestWinner.winner])
    setWinnerRemovedNotice(true)
    setGeneratedTeams(null)
  }

  function handleRestoreEliminated() {
    if (eliminatedNames.length === 0) return
    const merged = [...participants, ...eliminatedNames]
    setRawInput(merged.join('\n'))
    setEliminatedNames([])
    setWinnerRemovedNotice(false)
    setGeneratedTeams(null)
  }

  function handleShuffleList() {
    if (participants.length < 2 || isSpinning) return
    const shuffled = shuffleFairly(participants)
    setRawInput(shuffled.join('\n'))
    setGeneratedTeams(null)
  }

  function handleCleanAndDeduplicate() {
    if (isSpinning) return
    const stripped = parseParticipants(rawInput, true)
    const unique = deduplicateParticipants(stripped)
    setRawInput(unique.join('\n'))
    setGeneratedTeams(null)
  }

  function handleApplyPreset(preset: (typeof PRESETS)[number]) {
    if (isSpinning) return
    setRawInput(language === 'id' ? preset.itemsId : preset.itemsEn)
    setEventTitle(language === 'id' ? preset.titleId : preset.titleEn)
    setEliminatedNames([])
    setLatestWinner(null)
    setWinnerRemovedNotice(false)
    setGeneratedTeams(null)
  }

  function handleFileImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void file.text().then((content) => {
      const lines = content
        .replace(/\r\n/g, '\n')
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (lines.length > 0) {
        setRawInput(lines.join('\n'))
        setEliminatedNames([])
        setGeneratedTeams(null)
      }
    })
  }

  async function toggleFullscreen() {
    const stage = wheelStageRef.current
    if (!stage) return
    try {
      if (!document.fullscreenElement) {
        await stage.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore if browser blocks fullscreen API
    }
  }

  function handleCopyHistoryWhatsApp() {
    if (history.length === 0) return
    const heading =
      eventTitle.trim() ||
      (language === 'id' ? 'Hasil Roda Undian' : 'Spin Wheel Winners')
    const ordered = [...history].reverse()
    const body = ordered
      .map((item) => `${item.round}. *${item.winner}* _(${item.timestamp})_`)
      .join('\n')
    const text = `🏆 *${heading.toUpperCase()}*\n\n${body}`
    void navigator.clipboard.writeText(text)
    triggerCopied('history-wa')
  }

  function handleGenerateTeamsNow() {
    if (participants.length === 0) return
    const next = generateBalancedTeams({
      participants,
      splitMode,
      targetCount,
      namingStyle,
      pickLeader,
      pinnedPotRaw: showSeededPot ? seededPotRaw : '',
      language,
    })
    setGeneratedTeams(next)
    setShuffleGeneration((prev) => prev + 1)
  }

  function handlePromoteLeader(teamId: string, memberName: string) {
    setGeneratedTeams((prev) => {
      const source = prev ?? displayedTeams
      return source.map((team) => {
        if (team.id !== teamId) return team
        const rest = team.members.filter((m) => m !== memberName)
        return {
          ...team,
          members: [memberName, ...rest],
          leaderName: memberName,
        }
      })
    })
  }

  function handleCopyTeamsWhatsApp() {
    if (displayedTeams.length === 0) return
    const text = formatTeamsForWhatsApp(displayedTeams, eventTitle, language)
    void navigator.clipboard.writeText(text)
    triggerCopied('teams-wa')
  }

  function handleDownloadTeamsPng() {
    if (displayedTeams.length === 0) return
    const dataUrl = renderTeamsBoardPng(displayedTeams, eventTitle, language)
    if (!dataUrl) return
    const slug = (eventTitle.trim() || 'pembagian-kelompok')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    downloadDataUrl(dataUrl, `${slug || 'teams'}-ditya-tools.png`)
  }

  function handleDownloadTeamsCsv() {
    if (displayedTeams.length === 0) return
    const csv = formatTeamsAsCsv(displayedTeams, language)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, 'pembagian-kelompok.csv')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="spin-wheel" />

      {/* Primary Segmented Mode Switcher */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="ios-segmented inline-flex max-w-full overflow-x-auto no-scrollbar">
          <button
            id="spin-wheel-tab-wheel"
            type="button"
            onClick={() => setActiveTab('wheel')}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
              activeTab === 'wheel'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Dices size={15} />
            {t('Roda Undian Interaktif', 'Interactive Spin Wheel')}
          </button>

          <button
            id="spin-wheel-tab-teams"
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
              activeTab === 'teams'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users size={15} />
            {t('Pembagi Kelompok Acak', 'Random Team Generator')}
          </button>
        </div>

        {/* Quick Preset Templates */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold text-[var(--text-muted)]">
            {t('Contoh Cepat:', 'Quick Presets:')}
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              type="button"
              disabled={isSpinning}
              onClick={() => handleApplyPreset(preset)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-50"
            >
              {language === 'id' ? preset.labelId : preset.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[370px_1fr]">
        {/* Left Shared Panel: Participant Names & List Tools */}
        <section className="ios-card order-2 h-fit space-y-4 p-5 sm:p-6 lg:order-1">
          <div>
            <label
              htmlFor="spin-event-title"
              className="block text-xs font-bold text-[var(--text-secondary)]"
            >
              {t('Judul Acara / Undian (Opsional)', 'Event / Draw Title (Optional)')}
            </label>
            <input
              id="spin-event-title"
              type="text"
              value={eventTitle}
              onChange={(e) => {
                setEventTitle(e.target.value)
              }}
              placeholder={t(
                'Misal: Arisan Bulanan / Kelompok Tugas Web',
                'e.g. Friday Doorprize / Project Squads',
              )}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-border)] sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="participants-textarea"
                className="text-xs font-bold text-[var(--text-secondary)]"
              >
                {t('Daftar Nama / Pilihan', 'Participants / Choices')}
              </label>

              <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--primary)]">
                {participants.length} {t('item', 'items')}
              </span>
            </div>

            <textarea
              id="participants-textarea"
              value={rawInput}
              disabled={isSpinning}
              onChange={(e) => {
                setRawInput(e.target.value)
                setGeneratedTeams(null)
              }}
              rows={10}
              placeholder={t(
                'Ketik 1 nama per baris...\nBudi Santoso\nSiti Nurhaliza\nAndi Pratama',
                'Enter 1 name per line...\nAlex Rivera\nMaya Lin\nJordan Patel',
              )}
              className="mt-2 w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3.5 text-xs leading-6 font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-border)] disabled:opacity-60 sm:text-sm"
            />

            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
              {t(
                'Pisahkan dengan baris baru (Enter). Daftar ini dipakai bersama untuk Roda Undian & Pembagi Kelompok.',
                'One entry per line. Shared automatically between Spin Wheel & Team Generator.',
              )}
            </p>
          </div>

          {/* List Cleanup & Import Toolbar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="participants-shuffle-btn"
              type="button"
              disabled={isSpinning || participants.length < 2}
              onClick={handleShuffleList}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-45"
            >
              <Shuffle size={13} />
              {t('Acak Urutan', 'Shuffle List')}
            </button>

            <button
              id="participants-dedupe-btn"
              type="button"
              disabled={isSpinning || participants.length === 0}
              onClick={handleCleanAndDeduplicate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-45"
            >
              <WandSparkles size={13} />
              {t('Rapikan & Unik', 'Clean & Dedupe')}
            </button>

            <input
              id="participants-file-input"
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              id="participants-import-btn"
              type="button"
              disabled={isSpinning}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)] disabled:opacity-45"
            >
              <Upload size={13} />
              {t('Impor .TXT/.CSV', 'Import .TXT/.CSV')}
            </button>

            <button
              id="participants-clear-btn"
              type="button"
              disabled={isSpinning || rawInput.length === 0}
              onClick={() => {
                setRawInput('')
                setEliminatedNames([])
                setLatestWinner(null)
                setGeneratedTeams(null)
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--error)] transition hover:border-[var(--error)]/40 disabled:opacity-45"
            >
              <Trash2 size={13} />
              {t('Kosongkan', 'Clear All')}
            </button>
          </div>

          {eliminatedNames.length > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3.5 py-2.5">
              <span className="text-xs font-bold text-[var(--primary)]">
                {eliminatedNames.length}{' '}
                {t('pemenang disingkirkan', 'winners removed')}
              </span>
              <button
                id="restore-eliminated-btn"
                type="button"
                disabled={isSpinning}
                onClick={handleRestoreEliminated}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition hover:opacity-90"
              >
                <RotateCcw size={12} />
                {t('Pulihkan Semua', 'Restore All')}
              </button>
            </div>
          )}
        </section>

        {/* Right Interactive Stage */}
        <div className="order-1 space-y-6 lg:order-2">
          {activeTab === 'wheel' ? (
            <>
              <section
                ref={wheelStageRef}
                className={`ios-card wheel-stage-surface flex flex-col justify-between p-5 sm:p-6 ${
                  isFullscreen
                    ? 'fixed inset-0 z-50 overflow-y-auto rounded-none border-0 bg-[var(--background)] p-6 sm:p-10'
                    : ''
                }`}
              >
                {/* Top Stage Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        [3, t('Cepat 3d', 'Fast 3s')],
                        [5, t('Normal 5d', 'Normal 5s')],
                        [8, t('Tegang 8d', 'Suspense 8s')],
                      ] as const
                    ).map(([sec, label]) => (
                      <button
                        key={sec}
                        id={`spin-duration-${sec}`}
                        type="button"
                        disabled={isSpinning}
                        onClick={() => setSpinDurationSec(sec)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                          spinDurationSec === sec
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-2xs'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id="wheel-sound-toggle"
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      aria-pressed={soundEnabled}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        soundEnabled
                          ? 'border-[var(--primary-border)] bg-[var(--surface)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      {soundEnabled ? t('Suara Aktif', 'Sound On') : t('Bisu', 'Muted')}
                    </button>

                    <button
                      id="wheel-fullscreen-toggle"
                      type="button"
                      onClick={toggleFullscreen}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 size={14} />
                          {t('Keluar', 'Exit')}
                        </>
                      ) : (
                        <>
                          <Maximize2 size={14} />
                          {t('Layar Penuh', 'Fullscreen')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {eventTitle.trim() && (
                  <p className="mt-4 text-center text-sm font-extrabold tracking-tight text-[var(--text-primary)] sm:text-base">
                    {eventTitle}
                  </p>
                )}

                {/* Live Suspense Ticker */}
                <div
                  aria-live="polite"
                  className="mt-3 flex min-h-[28px] items-center justify-center"
                >
                  {isSpinning && livePointerName ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-border)] bg-[var(--surface)] px-4 py-1 text-xs font-bold text-[var(--primary)] shadow-2xs">
                      <span className="h-2 w-2 animate-ping rounded-full bg-[var(--primary)]" />
                      <span className="max-w-[240px] truncate sm:max-w-sm">
                        {livePointerName}
                      </span>
                    </span>
                  ) : participants.length < 2 ? (
                    <span className="text-xs font-semibold text-[var(--warning)]">
                      {t(
                        'Masukkan minimal 2 nama peserta untuk memutar roda.',
                        'Enter at least 2 participant names to spin the wheel.',
                      )}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {t(
                        'Ketuk tombol PUTAR di tengah roda atau tekan tombol Spasi',
                        'Tap SPIN in the center of the wheel or press Spacebar',
                      )}
                    </span>
                  )}
                </div>

                {/* Responsive Square Wheel Canvas Container */}
                <div
                  ref={canvasBoxRef}
                  className={`relative mx-auto my-2 aspect-square w-full ${
                    isFullscreen ? 'max-w-[520px]' : 'max-w-[440px]'
                  }`}
                >
                  <canvas
                    id="spin-wheel-canvas"
                    ref={canvasRef}
                    onClick={handleSpin}
                    className={`h-full w-full select-none ${
                      participants.length >= 2 && !isSpinning
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }`}
                  />

                  <button
                    id="wheel-center-spin-btn"
                    type="button"
                    disabled={isSpinning || participants.length < 2}
                    onClick={handleSpin}
                    className="spin-hub-btn absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--primary)] text-xs font-extrabold tracking-wider text-white uppercase disabled:opacity-60 sm:h-18 sm:w-18 sm:text-sm"
                  >
                    {isSpinning ? '•••' : t('PUTAR', 'SPIN')}
                  </button>
                </div>

                {/* Bottom Wheel Options & Primary Action */}
                <div className="mt-3 space-y-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {t(
                          'Singkirkan pemenang otomatis setelah terpilih',
                          'Auto-remove winner after each spin',
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {t(
                          'Cocok untuk arisan, doorprize, atau giliran maju agar tidak terpilih dua kali.',
                          'Ideal for raffles, doorprizes, and turn order so nobody is picked twice.',
                        )}
                      </p>
                    </div>
                    <input
                      id="auto-eliminate-checkbox"
                      type="checkbox"
                      checked={autoEliminate}
                      onChange={(e) => setAutoEliminate(e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                  </label>

                  <button
                    id="wheel-spin-action-btn"
                    type="button"
                    disabled={isSpinning || participants.length < 2}
                    onClick={handleSpin}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  >
                    <Sparkles size={17} />
                    {isSpinning
                      ? t('Roda Sedang Berputar...', 'Spinning the Wheel...')
                      : t('Putar Roda Undian Sekarang', 'Spin the Wheel Now')}
                  </button>
                </div>

                {/* Winner Spotlight Banner */}
                <AnimatePresence>
                  {latestWinner && !isSpinning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-4 rounded-2xl border border-[var(--primary-border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                            <Trophy size={14} />
                            {t(
                              `Pemenang Putaran #${latestWinner.round}`,
                              `Round #${latestWinner.round} Winner`,
                            )}
                          </span>
                          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                            {latestWinner.winner}
                          </h2>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {winnerRemovedNotice
                              ? t(
                                  'Nama ini telah disingkirkan dari putaran berikutnya.',
                                  'Removed from upcoming spins.',
                                )
                              : `${t('Terpilih pukul', 'Picked at')} ${latestWinner.timestamp}`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!winnerRemovedNotice && participants.length > 2 && (
                            <button
                              id="winner-eliminate-now-btn"
                              type="button"
                              onClick={handleEliminateLatestWinner}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                            >
                              <UserMinus size={14} />
                              {t('Singkirkan Nama Ini', 'Remove Winner')}
                            </button>
                          )}

                          <button
                            id="winner-copy-single-btn"
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                latestWinner.winner,
                              )
                              triggerCopied('single-winner')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
                          >
                            {copiedKey === 'single-winner' ? (
                              <>
                                <Check size={14} />
                                {t('Tersalin', 'Copied')}
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                {t('Salin Nama', 'Copy Name')}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Draw History Log */}
              {history.length > 0 && (
                <section className="ios-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-[var(--primary)]" />
                      <h2 className="text-sm font-bold text-[var(--text-primary)] sm:text-base">
                        {t('Riwayat Pemenang Undian', 'Draw Winner History')} (
                        {history.length})
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="history-copy-wa-btn"
                        type="button"
                        onClick={handleCopyHistoryWhatsApp}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
                      >
                        {copiedKey === 'history-wa' ? (
                          <>
                            <Check size={13} />
                            {t('Tersalin untuk WA!', 'Copied!')}
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            {t('Salin Hasil ke WA', 'Copy Summary')}
                          </>
                        )}
                      </button>

                      <button
                        id="history-clear-btn"
                        type="button"
                        onClick={() => {
                          roundCounterRef.current = 0
                          setHistory([])
                          setLatestWinner(null)
                        }}
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--error)]"
                      >
                        {t('Reset', 'Reset')}
                      </button>
                    </div>
                  </div>

                  <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                    {history.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-extrabold text-white">
                            #{item.round}
                          </span>
                          <span className="truncate text-xs font-bold text-[var(--text-primary)] sm:text-sm">
                            {item.winner}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]">
                          {item.timestamp}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          ) : (
            /* TAB 2: RANDOM TEAM / GROUP GENERATOR */
            <div className="space-y-6">
              <section className="ios-card space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {t('Pengaturan Pembagian Kelompok', 'Team Split Settings')}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t(
                        'Anggota dibagi secara adil (selisih maksimal 1 orang antar kelompok).',
                        'Members are distributed evenly (at most 1 person difference between teams).',
                      )}
                    </p>
                  </div>

                  <div className="ios-segmented inline-flex">
                    <button
                      id="split-mode-teams"
                      type="button"
                      onClick={() => {
                        setSplitMode('by-team-count')
                        setTargetCount(3)
                        setGeneratedTeams(null)
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        splitMode === 'by-team-count'
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {t('Jumlah Kelompok', 'Number of Teams')}
                    </button>

                    <button
                      id="split-mode-members"
                      type="button"
                      onClick={() => {
                        setSplitMode('by-member-count')
                        setTargetCount(4)
                        setGeneratedTeams(null)
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        splitMode === 'by-member-count'
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {t('Orang per Tim', 'Members per Team')}
                    </button>
                  </div>
                </div>

                {/* Count & Naming Style Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="team-target-count"
                      className="block text-xs font-bold text-[var(--text-secondary)]"
                    >
                      {splitMode === 'by-team-count'
                        ? t('Bagi Menjadi Berapa Kelompok?', 'How Many Teams?')
                        : t(
                            'Maksimal Anggota per Kelompok',
                            'Max Members per Team',
                          )}
                    </label>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {[2, 3, 4, 5, 6, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setTargetCount(num)
                            setGeneratedTeams(null)
                          }}
                          className={`h-8 w-9 rounded-xl border text-xs font-bold transition ${
                            targetCount === num
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <input
                        id="team-target-count"
                        type="number"
                        min={1}
                        max={50}
                        value={targetCount}
                        onChange={(e) => {
                          setTargetCount(
                            Math.max(1, Math.min(50, Number(e.target.value) || 2)),
                          )
                          setGeneratedTeams(null)
                        }}
                        className="h-8 w-16 rounded-xl border border-[var(--border)] bg-[var(--background)] px-2.5 text-center text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-[var(--text-secondary)]">
                      {t('Gaya Nama Kelompok', 'Team Naming Theme')}
                    </span>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(
                        [
                          ['numeric', t('Kelompok 1, 2', 'Team 1, 2')],
                          ['alpha', t('Tim A, B, C', 'Team A, B, C')],
                          ['nusantara', t('Hewan Garuda', 'Falcon / Tiger')],
                          ['elements', t('Samudra / Surya', 'Ocean / Solar')],
                        ] as const
                      ).map(([styleId, label]) => (
                        <button
                          key={styleId}
                          type="button"
                          onClick={() => {
                            setNamingStyle(styleId)
                            setGeneratedTeams(null)
                          }}
                          className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                            namingStyle === styleId
                              ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                              : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leader Toggle & Optional Seeded Pot */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-3">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                      <Crown size={15} className="text-[var(--warning)]" />
                      {t('Pilih Ketua Tim Otomatis', 'Auto-Pick Team Leader')}
                    </span>
                    <input
                      id="team-pick-leader-checkbox"
                      type="checkbox"
                      checked={pickLeader}
                      onChange={(e) => {
                        setPickLeader(e.target.checked)
                        setGeneratedTeams(null)
                      }}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-3">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {t(
                        'Pisahkan Unggulan ke Beda Tim',
                        'Separate Seeded Captains',
                      )}
                    </span>
                    <input
                      id="team-seeded-pot-checkbox"
                      type="checkbox"
                      checked={showSeededPot}
                      onChange={(e) => {
                        setShowSeededPot(e.target.checked)
                        setGeneratedTeams(null)
                      }}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                  </label>
                </div>

                {showSeededPot && (
                  <div>
                    <label
                      htmlFor="seeded-pot-input"
                      className="block text-xs font-bold text-[var(--text-secondary)]"
                    >
                      {t(
                        'Nama Unggulan / Kapten (disebar merata agar tidak menumpuk di 1 tim)',
                        'Seeded Names (spread evenly across separate teams)',
                      )}
                    </label>
                    <input
                      id="seeded-pot-input"
                      type="text"
                      value={seededPotRaw}
                      onChange={(e) => {
                        setSeededPotRaw(e.target.value)
                        setGeneratedTeams(null)
                      }}
                      placeholder={t(
                        'Pisahkan dengan koma, misal: Budi Santoso, Andi Pratama',
                        'Comma-separated exact names, e.g. Alex Rivera, Jordan Patel',
                      )}
                      className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                    />
                  </div>
                )}

                <button
                  id="team-generate-btn"
                  type="button"
                  disabled={participants.length < 2}
                  onClick={handleGenerateTeamsNow}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  <Shuffle size={16} />
                  {t('Acak Ulang Pembagian Kelompok', 'Shuffle & Generate Teams')}
                </button>
              </section>

              {/* Team Results & Export Toolbar */}
              {displayedTeams.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[var(--text-secondary)] sm:text-sm">
                      {t(
                        `Terbentuk ${displayedTeams.length} kelompok dari ${participants.length} peserta`,
                        `Generated ${displayedTeams.length} balanced teams from ${participants.length} participants`,
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="teams-copy-wa-btn"
                        type="button"
                        onClick={handleCopyTeamsWhatsApp}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)]"
                      >
                        {copiedKey === 'teams-wa' ? (
                          <>
                            <Check size={14} />
                            {t('Tersalin untuk WA!', 'Copied for WA!')}
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {t('Salin Format WA', 'Copy for WhatsApp')}
                          </>
                        )}
                      </button>

                      <button
                        id="teams-download-png-btn"
                        type="button"
                        onClick={handleDownloadTeamsPng}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3.5 py-2 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
                      >
                        <ImageDown size={14} />
                        {t('Unduh Gambar PNG', 'Save Poster PNG')}
                      </button>

                      <button
                        id="teams-download-csv-btn"
                        type="button"
                        onClick={handleDownloadTeamsCsv}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                      >
                        <FileSpreadsheet size={14} />
                        {t('.CSV Excel', '.CSV')}
                      </button>
                    </div>
                  </div>

                  <motion.div
                    key={shuffleGeneration}
                    initial={{ opacity: 0.65, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {displayedTeams.map((team) => (
                      <article
                        key={team.id}
                        className="ios-card flex flex-col justify-between p-4 sm:p-5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: team.accentColor }}
                              />
                              <h3 className="truncate text-sm font-extrabold text-[var(--text-primary)] sm:text-base">
                                {team.name}
                              </h3>
                            </div>

                            <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">
                              {team.members.length}{' '}
                              {t('orang', 'members')}
                            </span>
                          </div>

                          <ol className="mt-3 space-y-1.5">
                            {team.members.map((member, mIdx) => {
                              const isLeader =
                                team.leaderName === member && mIdx === 0
                              return (
                                <li
                                  key={`${member}-${mIdx}`}
                                  className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-xs transition hover:bg-[var(--surface-soft)] sm:text-sm"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="w-5 shrink-0 text-xs font-semibold text-[var(--text-muted)]">
                                      {mIdx + 1}.
                                    </span>
                                    <span
                                      className={`truncate ${
                                        isLeader
                                          ? 'font-bold text-[var(--primary)]'
                                          : 'font-medium text-[var(--text-primary)]'
                                      }`}
                                    >
                                      {member}
                                    </span>
                                  </div>

                                  {isLeader ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                                      <Crown size={11} />
                                      {t('Ketua', 'Leader')}
                                    </span>
                                  ) : pickLeader ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePromoteLeader(team.id, member)
                                      }
                                      title={t(
                                        'Jadikan Ketua Kelompok',
                                        'Set as Team Leader',
                                      )}
                                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] opacity-85 transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                      {t('Jadikan Ketua', 'Make Leader')}
                                    </button>
                                  ) : null}
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      </article>
                    ))}
                  </motion.div>

                  <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Download size={12} />
                    {t(
                      'Tip: Klik "Unduh Gambar PNG" untuk membagikan papan daftar kelompok langsung ke grup WhatsApp kelas atau panitia.',
                      'Tip: Click "Save Poster PNG" to share a clean visual team board directly into WhatsApp or Slack.',
                    )}
                  </p>
                </section>
              ) : (
                <div className="ios-card p-10 text-center">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    {t(
                      'Tambahkan daftar nama peserta di kolom sebelah kiri untuk mulai membagi kelompok.',
                      'Add participant names in the left panel to generate balanced teams.',
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
