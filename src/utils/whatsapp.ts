export function normalizeIndonesianPhoneNumber(
  phoneNumber: string,
) {
  let cleaned = phoneNumber.replace(/\D/g, '')

  if (!cleaned) {
    return ''
  }

  // 0812... → 62812...
  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.slice(1)}`
  }

  // 812... → 62812...
  if (cleaned.startsWith('8')) {
    cleaned = `62${cleaned}`
  }

  return cleaned
}

export function createWhatsAppLink(
  phoneNumber: string,
  message: string,
) {
  const normalizedPhone =
    normalizeIndonesianPhoneNumber(phoneNumber)

  if (!normalizedPhone) {
    return ''
  }

  const baseUrl = `https://wa.me/${normalizedPhone}`

  const trimmedMessage = message.trim()

  if (!trimmedMessage) {
    return baseUrl
  }

  return `${baseUrl}?text=${encodeURIComponent(trimmedMessage)}`
}