import * as QRCode from 'qrcode'

interface GenerateQrOptions {
  size?: number
}

export async function generateQrCode(
  content: string,
  options: GenerateQrOptions = {},
) {
  const { size = 512 } = options

  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',

    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })
}