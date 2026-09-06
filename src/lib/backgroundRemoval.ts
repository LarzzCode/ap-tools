import type {
  RawImage,
} from '@huggingface/transformers'


export type BackgroundRemovalMode =
  | 'fast'
  | 'quality'


const FAST_MODEL =
  'Xenova/modnet'

const QUALITY_MODEL =
  'studioludens/birefnet-lite-512'


/* =========================================
   COMMON
========================================= */


function rawImageToPngBlob(
  image: RawImage,
): Promise<Blob> {
  const rgba =
    image.rgba()

  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width =
    rgba.width

  canvas.height =
    rgba.height

  const context =
    canvas.getContext(
      '2d',
    )

  if (!context) {
    throw new Error(
      'Canvas is not supported in this browser.',
    )
  }

  const pixels =
    new Uint8ClampedArray(
      rgba.data,
    )

  const imageData =
    new ImageData(
      pixels,
      rgba.width,
      rgba.height,
    )

  context.putImageData(
    imageData,
    0,
    0,
  )

  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                'Unable to create the transparent PNG.',
              ),
            )

            return
          }

          resolve(blob)
        },
        'image/png',
      )
    },
  )
}


/* =========================================
   FAST MODE
   MODNet q8 + WASM
========================================= */


async function createFastSegmenter() {
  const {
    pipeline,
  } = await import(
    '@huggingface/transformers'
  )

  return pipeline(
    'background-removal',
    FAST_MODEL,
    {
      device: 'wasm',
      dtype: 'q8',

      progress_callback: (
        progress: unknown,
      ) => {
        console.info(
          '[RemoveBG Fast]',
          progress,
        )
      },
    },
  )
}


let fastSegmenterPromise:
  | ReturnType<
      typeof createFastSegmenter
    >
  | null = null


function getFastSegmenter() {
  if (!fastSegmenterPromise) {
    fastSegmenterPromise =
      createFastSegmenter().catch(
        (error) => {
          fastSegmenterPromise =
            null

          console.error(
            '[RemoveBG] Fast model failed:',
            error,
          )

          throw error
        },
      )
  }

  return fastSegmenterPromise
}


async function removeFast(
  file: File,
): Promise<Blob> {
  const segmenter =
    await getFastSegmenter()

  const output =
    await segmenter(file)

  const result =
    Array.isArray(output)
      ? output[0]
      : output

  if (!result) {
    throw new Error(
      'The background removal model returned no result.',
    )
  }

  return rawImageToPngBlob(
    result,
  )
}


/* =========================================
   QUALITY MODE
   BiRefNet Lite 512 + WebGPU
========================================= */


async function createQualityEngine() {
  if (
    !('gpu' in navigator)
  ) {
    throw new Error(
      'Quality mode requires WebGPU. Try the latest Chrome or Edge, or use Fast mode.',
    )
  }

  const {
    AutoModel,
    AutoProcessor,
    RawImage,
  } = await import(
    '@huggingface/transformers'
  )

  console.info(
    '[RemoveBG Quality] Loading model...',
  )

  const [
    model,
    processor,
  ] =
    await Promise.all([
      AutoModel.from_pretrained(
        QUALITY_MODEL,
        {
          device: 'webgpu',
          dtype: 'fp16',

          progress_callback: (
            progress: unknown,
          ) => {
            console.info(
              '[RemoveBG Quality model]',
              progress,
            )
          },
        },
      ),

      AutoProcessor.from_pretrained(
        QUALITY_MODEL,
        {
          progress_callback: (
            progress: unknown,
          ) => {
            console.info(
              '[RemoveBG Quality processor]',
              progress,
            )
          },
        },
      ),
    ])

  console.info(
    '[RemoveBG Quality] Model ready.',
  )

  return {
    model,
    processor,
    RawImage,
  }
}


let qualityEnginePromise:
  | ReturnType<
      typeof createQualityEngine
    >
  | null = null


function getQualityEngine() {
  if (!qualityEnginePromise) {
    qualityEnginePromise =
      createQualityEngine().catch(
        (error) => {
          qualityEnginePromise =
            null

          console.error(
            '[RemoveBG] Quality model failed:',
            error,
          )

          throw error
        },
      )
  }

  return qualityEnginePromise
}


async function removeQuality(
  file: File,
): Promise<Blob> {
  const {
    model,
    processor,
    RawImage,
  } =
    await getQualityEngine()

  console.info(
    '[RemoveBG Quality] Reading image...',
  )

  const image =
    await RawImage.fromBlob(
      file,
    )

  console.info(
    '[RemoveBG Quality] Preparing image...',
  )

  const processed =
    await processor(
      image,
    )

  const pixelValues =
    processed.pixel_values

  if (!pixelValues) {
    throw new Error(
      'Unable to prepare the image for Quality mode.',
    )
  }

  console.info(
    '[RemoveBG Quality] Starting inference...',
  )

  const output =
    await model({
      input_image:
        pixelValues,
    })

  const outputImage =
    (
      output as {
        output_image?: any
      }
    ).output_image

  if (
    !outputImage ||
    !outputImage[0]
  ) {
    throw new Error(
      'The Quality model returned no mask.',
    )
  }

  /*
   * BiRefNet returns logits.
   *
   * sigmoid()
   *     ↓
   * alpha 0..1
   *     ↓
   * × 255
   *     ↓
   * grayscale alpha mask
   */

  const mask =
    await RawImage
      .fromTensor(
        outputImage[0]
          .sigmoid()
          .mul(255)
          .to('uint8'),
      )
      .resize(
        image.width,
        image.height,
      )

  /*
   * Original RGB image
   *       +
   * predicted alpha matte
   *       ↓
   * transparent foreground
   */

  const foreground =
    image
      .clone()
      .rgba()

  foreground.putAlpha(
    mask,
  )

  console.info(
    '[RemoveBG Quality] Inference finished.',
  )

  return rawImageToPngBlob(
    foreground,
  )
}


/* =========================================
   PUBLIC API
========================================= */


export function supportsQualityBackgroundRemoval() {
  return (
    typeof navigator !==
      'undefined' &&
    'gpu' in navigator
  )
}


export async function preloadBackgroundRemovalModel(
  mode:
    BackgroundRemovalMode =
      'fast',
) {
  if (
    mode ===
    'quality'
  ) {
    await getQualityEngine()

    return
  }

  await getFastSegmenter()
}


export async function removeImageBackground(
  file: File,
  mode:
    BackgroundRemovalMode =
      'fast',
): Promise<Blob> {
  if (
    mode ===
    'quality'
  ) {
    return removeQuality(
      file,
    )
  }

  return removeFast(
    file,
  )
}