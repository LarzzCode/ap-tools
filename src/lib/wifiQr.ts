import * as QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'
export type WifiCardTheme = 'ios-light' | 'ios-dark' | 'ocean-blue' | 'warm-cafe'

export interface WifiCardConfig {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
  showPasswordOnCard: boolean
  title: string
  subtitle: string
  theme: WifiCardTheme
}

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:])/g, '\\$1')
}

export function buildWifiQrPayload(config: {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}): string {
  const cleanSsid = escapeWifiField(config.ssid.trim())
  const cleanPass =
    config.encryption === 'nopass'
      ? ''
      : escapeWifiField(config.password)

  const parts = [`WIFI:T:${config.encryption}`, `S:${cleanSsid}`]
  if (config.encryption !== 'nopass' && cleanPass) {
    parts.push(`P:${cleanPass}`)
  }
  if (config.hidden) {
    parts.push('H:true')
  }

  return `${parts.join(';')};;`
}

const THEME_PALETTES: Record<
  WifiCardTheme,
  {
    bgTop: string
    bgBottom: string
    cardSurface: string
    titleColor: string
    subColor: string
    accentColor: string
    borderColor: string
  }
> = {
  'ios-light': {
    bgTop: '#f2f2f7',
    bgBottom: '#e5e5ea',
    cardSurface: '#ffffff',
    titleColor: '#1c1c1e',
    subColor: '#636366',
    accentColor: '#007aff',
    borderColor: '#d1d1d6',
  },
  'ios-dark': {
    bgTop: '#1c1c1e',
    bgBottom: '#000000',
    cardSurface: '#2c2c2e',
    titleColor: '#f5f5f7',
    subColor: '#aeaeb2',
    accentColor: '#0a84ff',
    borderColor: '#3a3a3c',
  },
  'ocean-blue': {
    bgTop: '#007aff',
    bgBottom: '#0040dd',
    cardSurface: '#ffffff',
    titleColor: '#ffffff',
    subColor: '#dbeafe',
    accentColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  'warm-cafe': {
    bgTop: '#fdf8f3',
    bgBottom: '#f3e5d8',
    cardSurface: '#ffffff',
    titleColor: '#292524',
    subColor: '#78716c',
    accentColor: '#c2410c',
    borderColor: '#e7d5c5',
  },
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
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderWifiCardCanvas(
  config: WifiCardConfig,
): Promise<HTMLCanvasElement> {
  const payload = buildWifiQrPayload(config)
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 640,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1c1c1e',
      light: '#ffffff',
    },
  })

  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal membuat gambar QR Wi-Fi.'))
    img.src = qrDataUrl
  })

  const width = 1000
  const height = 1350
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser tidak mendukung Canvas.')
  }

  const palette = THEME_PALETTES[config.theme]

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, palette.bgTop)
  grad.addColorStop(1, palette.bgBottom)
  ctx.fillStyle = grad
  drawRoundedRect(ctx, 0, 0, width, height, 64)
  ctx.fill()

  // Title & Subtitle
  ctx.fillStyle = palette.titleColor
  ctx.textAlign = 'center'
  ctx.font = '800 58px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(config.title.trim() || 'Wi-Fi Access', width / 2, 145)

  ctx.fillStyle = palette.subColor
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(
    config.subtitle.trim() || 'Arahkan kamera HP ke kode QR untuk tersambung otomatis',
    width / 2,
    205,
  )

  // White QR container squircle
  const qrBoxSize = 620
  const qrBoxX = (width - qrBoxSize) / 2
  const qrBoxY = 265

  ctx.fillStyle = '#ffffff'
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 48)
  ctx.fill()

  ctx.drawImage(
    qrImg,
    qrBoxX + 36,
    qrBoxY + 36,
    qrBoxSize - 72,
    qrBoxSize - 72,
  )

  // Credentials info card at bottom
  const infoX = 110
  const infoY = 945
  const infoW = width - 220
  const infoH = 290

  ctx.fillStyle = palette.cardSurface
  drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 36)
  ctx.fill()

  const textDark = config.theme === 'ios-dark' ? '#f5f5f7' : '#1c1c1e'
  const textMuted = config.theme === 'ios-dark' ? '#8e8e93' : '#636366'

  ctx.textAlign = 'left'
  ctx.fillStyle = textMuted
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText('NAMA JARINGAN (SSID)', infoX + 48, infoY + 70)

  ctx.fillStyle = textDark
  ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText(config.ssid.trim() || 'Nama Wi-Fi', infoX + 48, infoY + 122)

  ctx.fillStyle = textMuted
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillText('KATA SANDI (PASSWORD)', infoX + 48, infoY + 195)

  ctx.fillStyle = textDark
  ctx.font = '700 34px ui-monospace, SFMono-Regular, Menlo, monospace'

  let displayedPass = 'Tanpa Password (Open)'
  if (config.encryption !== 'nopass') {
    displayedPass = config.showPasswordOnCard
      ? config.password || '••••••••'
      : '• • • • • • • • (Scan QR)'
  }

  ctx.fillText(displayedPass, infoX + 48, infoY + 245)

  return canvas
}

export async function exportWifiCardPdf(
  cardCanvas: HTMLCanvasElement,
): Promise<Blob> {
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    cardCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal mengekspor kartu Wi-Fi.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })

  const pngBytes = await pngBlob.arrayBuffer()
  const pdf = await PDFDocument.create()

  // A5 Portrait dimensions in PDF points (148 x 210 mm)
  const pageW = 419.53
  const pageH = 595.28
  const page = pdf.addPage([pageW, pageH])
  const embedded = await pdf.embedPng(pngBytes)

  const margin = 24
  const availW = pageW - margin * 2
  const availH = pageH - margin * 2
  const scale = Math.min(availW / embedded.width, availH / embedded.height)

  const drawW = embedded.width * scale
  const drawH = embedded.height * scale

  page.drawImage(embedded, {
    x: (pageW - drawW) / 2,
    y: (pageH - drawH) / 2,
    width: drawW,
    height: drawH,
  })

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
