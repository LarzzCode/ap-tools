import QRCode from 'qrcode'

export const WORMHOLE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export const WORMHOLE_CODE_LENGTH = 6
export const WORMHOLE_PEER_PREFIX = 'ditya-wh-v1-'
export const WORMHOLE_CHUNK_BYTES = 64 * 1024 // 64 KB WebRTC-safe SCTP frame

export type WormholePacket =
  | {
      kind: 'hello'
      deviceLabel: string
    }
  | {
      kind: 'text'
      id: string
      text: string
      sentAt: number
    }
  | {
      kind: 'file-start'
      fileId: string
      name: string
      size: number
      mimeType: string
      totalChunks: number
    }
  | {
      kind: 'file-chunk'
      fileId: string
      index: number
      data: ArrayBuffer | Uint8Array
    }
  | {
      kind: 'file-end'
      fileId: string
    }

export interface WormholeTransferItem {
  id: string
  direction: 'sent' | 'received'
  kind: 'file' | 'text'
  name: string
  size: number
  mimeType: string
  progress: number // 0..100
  speedBps: number
  status: 'transferring' | 'completed' | 'error'
  textValue?: string
  blob?: Blob
  timestamp: number
}

export function generateWormholeCode(length = WORMHOLE_CODE_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += WORMHOLE_ALPHABET[bytes[i] % WORMHOLE_ALPHABET.length]
  }
  return out
}

export function normalizeWormholeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, WORMHOLE_CODE_LENGTH)
}

export function roomCodeToPeerId(code: string): string {
  return `${WORMHOLE_PEER_PREFIX}${normalizeWormholeCode(code)}`
}

export function extractRoomCodeFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed)
      const param = url.searchParams.get('room')
      if (param) {
        const clean = normalizeWormholeCode(param)
        if (clean.length === WORMHOLE_CODE_LENGTH) return clean
      }
    }
  } catch {
    // Fall through to plain code check
  }

  const normalized = normalizeWormholeCode(trimmed)
  return normalized.length === WORMHOLE_CODE_LENGTH ? normalized : null
}

export function buildWormholeShareUrl(roomCode: string): string {
  if (typeof window === 'undefined') {
    return `https://dityatools.vercel.app/tools/p2p-wormhole?room=${roomCode}`
  }
  const url = new URL('/tools/p2p-wormhole', window.location.origin)
  url.searchParams.set('room', normalizeWormholeCode(roomCode))
  return url.toString()
}

export async function renderWormholeQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  })
}

export function detectFriendlyDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Browser Peer'
  const ua = navigator.userAgent

  let os = 'Perangkat'
  if (/iPhone/i.test(ua)) os = 'iPhone'
  else if (/iPad/i.test(ua)) os = 'iPad'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac'
  else if (/Windows/i.test(ua)) os = 'Windows PC'
  else if (/Linux/i.test(ua)) os = 'Linux'

  let browser = 'Browser'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari'

  return `${os} · ${browser}`
}

export function formatTransferSpeed(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '—'
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
  }
  return `${Math.max(1, Math.round(bytesPerSec / 1024))} KB/s`
}
