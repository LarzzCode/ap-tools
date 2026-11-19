export type PrivacyOutputFormat =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

export interface MetadataReport {
  hasExif: boolean
  hasXmp: boolean
  hasIccProfile: boolean
  hasPngTextChunks: boolean
  markers: string[]
  width: number
  height: number
}

function readAscii(
  bytes: Uint8Array,
  start: number,
  length: number,
): string {
  let out = ''
  const end = Math.min(bytes.length, start + length)
  for (let i = start; i < end; i++) {
    out += String.fromCharCode(bytes[i])
  }
  return out
}

function inspectJpegMarkers(bytes: Uint8Array): {
  hasExif: boolean
  hasXmp: boolean
  hasIccProfile: boolean
  markers: string[]
} {
  let hasExif = false
  let hasXmp = false
  let hasIccProfile = false
  const markers = new Set<string>()

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return {
      hasExif,
      hasXmp,
      hasIccProfile,
      markers: [],
    }
  }

  let offset = 2
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      break
    }

    const marker = bytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) {
      break
    }

    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      break
    }

    const payloadStart = offset + 4
    const header = readAscii(bytes, payloadStart, 29)

    if (marker === 0xe1) {
      if (header.startsWith('Exif')) {
        hasExif = true
        markers.add('EXIF (Camera / Date / GPS)')
      } else if (header.includes('ns.adobe.com/xap/')) {
        hasXmp = true
        markers.add('XMP Metadata')
      } else {
        markers.add('APP1 Metadata')
      }
    } else if (marker === 0xe2 && header.startsWith('ICC_PROFILE')) {
      hasIccProfile = true
      markers.add('ICC Color Profile')
    } else if (marker === 0xed) {
      markers.add('IPTC / Photoshop Metadata')
    } else if (marker === 0xfe) {
      markers.add('JPEG Comment')
    }

    offset += 2 + segmentLength
  }

  return {
    hasExif,
    hasXmp,
    hasIccProfile,
    markers: Array.from(markers),
  }
}

function inspectPngChunks(bytes: Uint8Array): {
  hasPngTextChunks: boolean
  hasIccProfile: boolean
  markers: string[]
} {
  let hasPngTextChunks = false
  let hasIccProfile = false
  const markers = new Set<string>()

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (
    bytes.length < 16 ||
    !pngSignature.every((val, index) => bytes[index] === val)
  ) {
    return { hasPngTextChunks, hasIccProfile, markers: [] }
  }

  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]

    const chunkType = readAscii(bytes, offset + 4, 4)

    if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
      hasPngTextChunks = true
      markers.add(`PNG Text Chunk (${chunkType})`)
    } else if (chunkType === 'eXIf') {
      hasPngTextChunks = true
      markers.add('PNG EXIF Chunk')
    } else if (chunkType === 'iCCP') {
      hasIccProfile = true
      markers.add('ICC Color Profile')
    }

    if (chunkType === 'IEND' || length < 0) {
      break
    }

    offset += 12 + length
  }

  return {
    hasPngTextChunks,
    hasIccProfile,
    markers: Array.from(markers),
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Unable to read ${file.name}.`))
    }

    image.src = objectUrl
  })
}

export async function inspectImageMetadata(
  file: File,
): Promise<MetadataReport> {
  const [buffer, image] = await Promise.all([
    file.arrayBuffer(),
    loadImageElement(file),
  ])

  const bytes = new Uint8Array(buffer)
  const jpeg = inspectJpegMarkers(bytes)
  const png = inspectPngChunks(bytes)

  const markers = [...jpeg.markers, ...png.markers]

  return {
    hasExif: jpeg.hasExif || markers.some((m) => m.includes('EXIF')),
    hasXmp: jpeg.hasXmp,
    hasIccProfile: jpeg.hasIccProfile || png.hasIccProfile,
    hasPngTextChunks: png.hasPngTextChunks,
    markers,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}

export interface CleanImageOptions {
  outputFormat: PrivacyOutputFormat
  quality: number
  maxWidth: number | null
}

export async function stripImageMetadataAndConvert(
  file: File,
  options: CleanImageOptions,
): Promise<{
  blob: Blob
  width: number
  height: number
}> {
  const image = await loadImageElement(file)

  let targetWidth = image.naturalWidth
  let targetHeight = image.naturalHeight

  if (options.maxWidth && options.maxWidth > 0 && targetWidth > options.maxWidth) {
    const ratio = options.maxWidth / targetWidth
    targetWidth = Math.round(targetWidth * ratio)
    targetHeight = Math.round(targetHeight * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not supported in this browser.')
  }

  if (options.outputFormat === 'image/jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, targetWidth, targetHeight)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Unable to export clean image.'))
          return
        }
        resolve(result)
      },
      options.outputFormat,
      options.outputFormat === 'image/png' ? undefined : options.quality,
    )
  })

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
  }
}
