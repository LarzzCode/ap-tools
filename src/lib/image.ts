export type ImageOutputFormat =
  | 'image/webp'
  | 'image/jpeg'

interface CompressImageOptions {
  quality: number
  outputFormat: ImageOutputFormat
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)

      reject(
        new Error('Unable to load image.'),
      )
    }

    image.src = objectUrl
  })
}

export async function compressImage(
  file: File,
  options: CompressImageOptions,
): Promise<Blob> {
  const image = await loadImage(file)

  const canvas = document.createElement('canvas')

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas is not supported in this browser.',
    )
  }

  if (options.outputFormat === 'image/jpeg') {
    context.fillStyle = '#ffffff'

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    )
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error('Unable to compress image.'),
          )
          return
        }

        resolve(blob)
      },
      options.outputFormat,
      options.quality,
    )
  })
}