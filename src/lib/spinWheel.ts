export interface WheelColorStop {
  fill: string
  fillEnd: string
  text: string
}

/**
 * Curated Cupertino HSL-harmonized palette (no harsh neon, no purple-on-dark).
 * High contrast white typography across every slice in both light & dark themes.
 */
export const WHEEL_PALETTE: readonly WheelColorStop[] = [
  { fill: '#007aff', fillEnd: '#0062cc', text: '#ffffff' }, // Cupertino Ocean Blue
  { fill: '#1fb86c', fillEnd: '#169656', text: '#ffffff' }, // Mint Emerald
  { fill: '#f59e0b', fillEnd: '#d97706', text: '#ffffff' }, // Warm Amber
  { fill: '#ef4444', fillEnd: '#dc2626', text: '#ffffff' }, // Coral Red
  { fill: '#0ea5e9', fillEnd: '#0284c7', text: '#ffffff' }, // Sky Cyan
  { fill: '#14b8a6', fillEnd: '#0d9488', text: '#ffffff' }, // Tropical Teal
  { fill: '#f97316', fillEnd: '#ea580c', text: '#ffffff' }, // Sunset Tangerine
  { fill: '#2563eb', fillEnd: '#1d4ed8', text: '#ffffff' }, // Royal Cobalt
]

/**
 * Ensures two adjacent wheel slices never share the exact same color,
 * including the wraparound boundary between slice (total - 1) and slice 0.
 */
export function getSliceColor(index: number, total: number): WheelColorStop {
  const len = WHEEL_PALETTE.length
  let colorIdx = index % len
  if (total > 1 && index === total - 1 && colorIdx === 0) {
    colorIdx = 1
  }
  return WHEEL_PALETTE[colorIdx]
}

const TWO_PI = Math.PI * 2

/**
 * Returns which slice index [0, count - 1] is currently under the 3 o'clock (0 rad) pointer.
 */
export function getSliceIndexAtPointer(rotation: number, count: number): number {
  if (count <= 0) return 0
  const sliceArc = TWO_PI / count
  const pointerLocalAngle = ((-rotation % TWO_PI) + TWO_PI) % TWO_PI
  return Math.floor(pointerLocalAngle / sliceArc) % count
}

/**
 * Unbiased cryptographic float in [0, 1).
 */
export function cryptoRandomFloat(): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(1)
    window.crypto.getRandomValues(buf)
    return buf[0] / 4294967296
  }
  return Math.random()
}

/**
 * Unbiased cryptographic integer in [0, maxExclusive) using rejection sampling.
 */
export function cryptoRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const maxUint32 = 0xffffffff
    const limit = maxUint32 - ((maxUint32 + 1) % maxExclusive)
    const buf = new Uint32Array(1)
    let val: number
    do {
      window.crypto.getRandomValues(buf)
      val = buf[0]
    } while (val > limit)
    return val % maxExclusive
  }
  return Math.floor(Math.random() * maxExclusive)
}

/**
 * Calculates a forward clockwise target rotation (in radians) that lands
 * inside `winnerIndex` at the 3 o'clock pointer after `extraSpins` full revolutions.
 */
export function computeSpinTargetRotation(
  currentRotation: number,
  winnerIndex: number,
  totalSlices: number,
  extraSpins: number,
): number {
  const sliceArc = TWO_PI / Math.max(1, totalSlices)
  // Land naturally within central 64% of the winning slice so there's zero ambiguity near seams
  const innerOffset = 0.18 + cryptoRandomFloat() * 0.64
  const targetLocalAngle = (winnerIndex + innerOffset) * sliceArc
  const deltaForward =
    (((-targetLocalAngle - currentRotation) % TWO_PI) + TWO_PI) % TWO_PI
  return currentRotation + extraSpins * TWO_PI + deltaForward
}

/**
 * Parses raw textarea or imported text into clean participant entries.
 * Supports newline-separated lists or single-line comma/semicolon lists.
 */
export function parseParticipants(
  rawText: string,
  stripNumbering = false,
): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const hasNewlines = normalized.includes('\n')
  const rawTokens = hasNewlines
    ? normalized.split('\n')
    : normalized.includes(';')
      ? normalized.split(';')
      : normalized.includes(',')
        ? normalized.split(',')
        : [normalized]

  const cleaned: string[] = []
  for (const token of rawTokens) {
    let entry = token.trim()
    if (!entry) continue
    if (stripNumbering) {
      entry = entry
        .replace(/^(?:\d+[.)\-:]|[-•*])\s+/, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    if (entry) {
      cleaned.push(entry)
    }
  }
  return cleaned
}

export function deduplicateParticipants(items: readonly string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const item of items) {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(item.trim())
  }
  return unique
}

export function shuffleFairly<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1)
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

export type TeamSplitMode = 'by-team-count' | 'by-member-count'
export type TeamNamingStyle = 'numeric' | 'alpha' | 'nusantara' | 'elements'

export interface GeneratedTeam {
  id: string
  name: string
  accentColor: string
  members: string[]
  leaderName: string | null
}

const NUSANTARA_NAMES_ID = [
  'Tim Garuda',
  'Tim Harimau',
  'Tim Komodo',
  'Tim Rajawali',
  'Tim Elang',
  'Tim Cendrawasih',
  'Tim Macan',
  'Tim Badak',
  'Tim Lumba-Lumba',
  'Tim Jalak Bali',
  'Tim Kancil',
  'Tim Pesut',
  'Tim Beruang',
  'Tim Kasuari',
  'Tim Merak',
  'Tim Rusa',
]

const NUSANTARA_NAMES_EN = [
  'Team Falcon',
  'Team Tiger',
  'Team Dragon',
  'Team Eagle',
  'Team Phoenix',
  'Team Panther',
  'Team Dolphin',
  'Team Hawk',
  'Team Wolf',
  'Team Lion',
  'Team Grizzly',
  'Team Cobra',
  'Team Osprey',
  'Team Jaguar',
  'Team Lynx',
  'Team Shark',
]

const ELEMENT_NAMES_ID = [
  'Tim Samudra',
  'Tim Zamrud',
  'Tim Surya',
  'Tim Koral',
  'Tim Angkasa',
  'Tim Rimba',
  'Tim Senja',
  'Tim Bintang',
  'Tim Pelangi',
  'Tim Kristal',
  'Tim Aurora',
  'Tim Guntur',
]

const ELEMENT_NAMES_EN = [
  'Team Ocean',
  'Team Emerald',
  'Team Solar',
  'Team Coral',
  'Team Sky',
  'Team Forest',
  'Team Sunset',
  'Team Nova',
  'Team Prism',
  'Team Crystal',
  'Team Aurora',
  'Team Thunder',
]

function getTeamDisplayName(
  index: number,
  style: TeamNamingStyle,
  lang: 'id' | 'en',
): string {
  if (style === 'alpha') {
    const letter =
      index < 26
        ? String.fromCharCode(65 + index)
        : `${String.fromCharCode(65 + Math.floor(index / 26) - 1)}${String.fromCharCode(65 + (index % 26))}`
    return lang === 'id' ? `Tim ${letter}` : `Team ${letter}`
  }

  if (style === 'nusantara') {
    const pool = lang === 'id' ? NUSANTARA_NAMES_ID : NUSANTARA_NAMES_EN
    return index < pool.length
      ? pool[index]
      : `${pool[index % pool.length]} ${Math.floor(index / pool.length) + 1}`
  }

  if (style === 'elements') {
    const pool = lang === 'id' ? ELEMENT_NAMES_ID : ELEMENT_NAMES_EN
    return index < pool.length
      ? pool[index]
      : `${pool[index % pool.length]} ${Math.floor(index / pool.length) + 1}`
  }

  return lang === 'id' ? `Kelompok ${index + 1}` : `Team ${index + 1}`
}

export interface GenerateTeamsOptions {
  participants: readonly string[]
  splitMode: TeamSplitMode
  targetCount: number
  namingStyle: TeamNamingStyle
  pickLeader: boolean
  pinnedPotRaw?: string
  language: 'id' | 'en'
}

/**
 * Splits participants into balanced groups (size difference at most 1).
 * If `pinnedPotRaw` contains seeded/skilled names, distributes them across distinct teams first.
 */
export function generateBalancedTeams(
  options: GenerateTeamsOptions,
): GeneratedTeam[] {
  const {
    participants,
    splitMode,
    targetCount,
    namingStyle,
    pickLeader,
    pinnedPotRaw = '',
    language,
  } = options

  const total = participants.length
  if (total === 0) return []

  const safeValue = Math.max(1, Math.floor(targetCount))
  const numTeams =
    splitMode === 'by-team-count'
      ? Math.min(total, Math.max(2, safeValue))
      : Math.min(total, Math.max(1, Math.ceil(total / Math.max(1, safeValue))))

  const potNamesLower = new Set(
    parseParticipants(pinnedPotRaw, true).map((n) => n.toLowerCase()),
  )

  const seededGroup: string[] = []
  const regularGroup: string[] = []

  for (const person of participants) {
    if (potNamesLower.has(person.toLowerCase())) {
      seededGroup.push(person)
    } else {
      regularGroup.push(person)
    }
  }

  const orderedPool = [
    ...shuffleFairly(seededGroup),
    ...shuffleFairly(regularGroup),
  ]

  const buckets: string[][] = Array.from({ length: numTeams }, () => [])
  orderedPool.forEach((person, idx) => {
    buckets[idx % numTeams].push(person)
  })

  return buckets.map((bucket, idx) => {
    // Shuffle inside each bucket so seeded players aren't predictably always #1
    const members = shuffleFairly(bucket)
    const leaderName =
      pickLeader && members.length > 0 ? members[0] : null
    const paletteStop = WHEEL_PALETTE[idx % WHEEL_PALETTE.length]

    return {
      id: `team-${idx + 1}`,
      name: getTeamDisplayName(idx, namingStyle, language),
      accentColor: paletteStop.fill,
      members,
      leaderName,
    }
  })
}

export function formatTeamsForWhatsApp(
  teams: readonly GeneratedTeam[],
  eventTitle: string,
  lang: 'id' | 'en',
): string {
  const heading =
    eventTitle.trim() ||
    (lang === 'id' ? 'Pembagian Kelompok Acak' : 'Random Team Assignment')
  const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0)

  const lines: string[] = [
    `📋 *${heading.toUpperCase()}*`,
    lang === 'id'
      ? `Total: ${totalMembers} peserta • ${teams.length} kelompok`
      : `Total: ${totalMembers} participants • ${teams.length} teams`,
    '',
  ]

  teams.forEach((team) => {
    lines.push(`🔹 *${team.name}* (${team.members.length})`)
    team.members.forEach((member, mIdx) => {
      const isLeader = team.leaderName === member && mIdx === 0
      const leaderBadge = isLeader
        ? lang === 'id'
          ? ' ⭐ _(Ketua)_'
          : ' ⭐ _(Leader)_'
        : ''
      lines.push(`${mIdx + 1}. ${member}${leaderBadge}`)
    })
    lines.push('')
  })

  return lines.join('\n').trim()
}

export function formatTeamsAsCsv(
  teams: readonly GeneratedTeam[],
  lang: 'id' | 'en',
): string {
  const header =
    lang === 'id' ? 'Kelompok,No,Nama Peserta,Peran' : 'Team,No,Member Name,Role'
  const rows = [header]

  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

  teams.forEach((team) => {
    team.members.forEach((member, idx) => {
      const isLeader = team.leaderName === member && idx === 0
      const role = isLeader
        ? lang === 'id'
          ? 'Ketua Kelompok'
          : 'Team Leader'
        : lang === 'id'
          ? 'Anggota'
          : 'Member'
      rows.push(
        `${escapeCsv(team.name)},${idx + 1},${escapeCsv(member)},${escapeCsv(role)}`,
      )
    })
  })

  return `\uFEFF${rows.join('\r\n')}`
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.closePath()
}

/**
 * Renders a crisp high-resolution Cupertino poster PNG of all generated teams
 * ready to share directly in WhatsApp Groups, Telegram, or class chats.
 */
export function renderTeamsBoardPng(
  teams: readonly GeneratedTeam[],
  eventTitle: string,
  lang: 'id' | 'en',
): string {
  const cols = teams.length === 1 ? 1 : teams.length === 2 ? 2 : teams.length <= 4 ? 2 : 3
  const width = cols === 1 ? 760 : cols === 2 ? 1080 : 1360
  const outerPad = 48
  const gap = 24
  const cardWidth = (width - outerPad * 2 - gap * (cols - 1)) / cols

  const rowHeight = 34
  const cardHeaderHeight = 56
  const cardBottomPad = 20

  const rowsOfTeams: GeneratedTeam[][] = []
  for (let i = 0; i < teams.length; i += cols) {
    rowsOfTeams.push(teams.slice(i, i + cols))
  }

  const rowHeights = rowsOfTeams.map((row) => {
    const maxMembers = Math.max(...row.map((t) => t.members.length), 1)
    return cardHeaderHeight + maxMembers * rowHeight + cardBottomPad
  })

  const headerAreaHeight = 132
  const footerAreaHeight = 68
  const cardsTotalHeight =
    rowHeights.reduce((sum, h) => sum + h, 0) +
    Math.max(0, rowHeights.length - 1) * gap
  const totalHeight = outerPad + headerAreaHeight + cardsTotalHeight + footerAreaHeight

  const canvas = document.createElement('canvas')
  const dpr = 2
  canvas.width = width * dpr
  canvas.height = totalHeight * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.scale(dpr, dpr)

  // Soft Cupertino background
  ctx.fillStyle = '#f2f4f8'
  ctx.fillRect(0, 0, width, totalHeight)

  // Subtle top accent bar
  ctx.fillStyle = '#007aff'
  ctx.fillRect(0, 0, width, 8)

  const heading =
    eventTitle.trim() ||
    (lang === 'id' ? 'Pembagian Kelompok Acak' : 'Random Team Assignment')
  const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0)
  const dateStr = new Date().toLocaleDateString(
    lang === 'id' ? 'id-ID' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )

  ctx.fillStyle = '#007aff'
  ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(
    lang === 'id' ? 'HASIL PEMBAGIAN ACAK ADIL' : 'FAIR RANDOM GROUPING',
    outerPad,
    outerPad + 18,
  )

  ctx.fillStyle = '#1c1c1e'
  ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(heading, outerPad, outerPad + 58)

  ctx.fillStyle = '#636366'
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  const subtitle =
    lang === 'id'
      ? `${totalMembers} Peserta • ${teams.length} Kelompok • ${dateStr}`
      : `${totalMembers} Participants • ${teams.length} Teams • ${dateStr}`
  ctx.fillText(subtitle, outerPad, outerPad + 88)

  let currentY = outerPad + headerAreaHeight

  rowsOfTeams.forEach((row, rIdx) => {
    const h = rowHeights[rIdx]
    row.forEach((team, cIdx) => {
      const x = outerPad + cIdx * (cardWidth + gap)

      // Card shadow & surface
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.06)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 6
      drawRoundedRect(ctx, x, currentY, cardWidth, h, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      drawRoundedRect(ctx, x, currentY, cardWidth, h, 20)
      ctx.strokeStyle = 'rgba(60, 60, 67, 0.12)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Header pill dot & title
      ctx.beginPath()
      ctx.arc(x + 24, currentY + 29, 6, 0, TWO_PI)
      ctx.fillStyle = team.accentColor
      ctx.fill()

      ctx.fillStyle = '#1c1c1e'
      ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
      ctx.fillText(team.name, x + 38, currentY + 35)

      // Member count pill
      const countText = `${team.members.length}`
      ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
      const countWidth = ctx.measureText(countText).width + 18
      drawRoundedRect(
        ctx,
        x + cardWidth - countWidth - 18,
        currentY + 18,
        countWidth,
        22,
        11,
      )
      ctx.fillStyle = '#f2f4f8'
      ctx.fill()
      ctx.fillStyle = '#48484a'
      ctx.fillText(countText, x + cardWidth - countWidth - 9, currentY + 33)

      // Divider
      ctx.beginPath()
      ctx.moveTo(x + 18, currentY + 50)
      ctx.lineTo(x + cardWidth - 18, currentY + 50)
      ctx.strokeStyle = 'rgba(60, 60, 67, 0.1)'
      ctx.stroke()

      // Members
      team.members.forEach((member, mIdx) => {
        const my = currentY + cardHeaderHeight + mIdx * rowHeight + 22
        const isLeader = team.leaderName === member && mIdx === 0

        ctx.fillStyle = '#8e8e93'
        ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
        ctx.fillText(`${mIdx + 1}.`, x + 20, my)

        ctx.fillStyle = isLeader ? '#0066dc' : '#1c1c1e'
        ctx.font = `${isLeader ? '700' : '500'} 14px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`

        const maxNameWidth = isLeader ? cardWidth - 122 : cardWidth - 62
        let displayMember = member
        while (
          displayMember.length > 4 &&
          ctx.measureText(displayMember).width > maxNameWidth
        ) {
          displayMember = `${displayMember.slice(0, -2)}…`
        }
        ctx.fillText(displayMember, x + 44, my)

        if (isLeader) {
          const badgeLabel = lang === 'id' ? 'KETUA' : 'LEADER'
          ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
          const bw = ctx.measureText(badgeLabel).width + 14
          drawRoundedRect(
            ctx,
            x + cardWidth - bw - 18,
            my - 13,
            bw,
            18,
            9,
          )
          ctx.fillStyle = 'rgba(0, 122, 255, 0.12)'
          ctx.fill()
          ctx.fillStyle = '#0066dc'
          ctx.fillText(badgeLabel, x + cardWidth - bw - 11, my - 1)
        }
      })
    })

    currentY += h + gap
  })

  // Footer
  ctx.fillStyle = '#8e8e93'
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(
    'Ditya Tools • 100% Fair Cryptographic Shuffle',
    outerPad,
    totalHeight - 26,
  )

  return canvas.toDataURL('image/png')
}

/**
 * Synthesizes tactile wooden/acrylic wheel peg clicks and celebratory chimes
 * locally via Web Audio API with zero external audio files.
 */
export class WheelSoundEngine {
  private ctx: AudioContext | null = null

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  playTick(speedRatio = 0.5): void {
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const clamped = Math.max(0.1, Math.min(1, speedRatio))
    const startFreq = 580 + clamped * 320
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.026)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.13, now + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.03)
  }

  playWinChime(): void {
    const ctx = this.ensureContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    const base = ctx.currentTime

    notes.forEach((freq, idx) => {
      const start = base + idx * 0.075
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(idx === notes.length - 1 ? 0.18 : 0.13, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0008, start + (idx === notes.length - 1 ? 0.55 : 0.28))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.58)
    })
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
    }
  }
}
