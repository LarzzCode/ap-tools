import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Download,
  LoaderCircle,
  Palette,
  Scissors,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import { Link } from 'react-router'

import {
  preloadBackgroundRemovalModel,
  removeImageBackground,
  supportsQualityBackgroundRemoval,
  type BackgroundRemovalMode,
} from '../../lib/backgroundRemoval'

import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'


const MAX_FILE_SIZE =
  15 * 1024 * 1024


const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]


type ProcessingStage =
  | 'idle'
  | 'loading-model'
  | 'processing'


type OutputBackground =
  | 'transparent'
  | 'red'
  | 'blue'
  | 'white'
  | 'custom'


const BACKGROUND_PRESETS = {
  red: '#D32F2F',
  blue: '#1565C0',
  white: '#FFFFFF',
} as const


const checkerboardStyle = {
  backgroundColor: '#ffffff',

  backgroundImage: `
    linear-gradient(
      45deg,
      #e2e8f0 25%,
      transparent 25%
    ),
    linear-gradient(
      -45deg,
      #e2e8f0 25%,
      transparent 25%
    ),
    linear-gradient(
      45deg,
      transparent 75%,
      #e2e8f0 75%
    ),
    linear-gradient(
      -45deg,
      transparent 75%,
      #e2e8f0 75%
    )
  `,

  backgroundSize:
    '20px 20px',

  backgroundPosition: `
    0 0,
    0 10px,
    10px -10px,
    -10px 0px
  `,
}


function loadBlobImage(
  blob: Blob,
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(blob)

      const image =
        new Image()

      image.onload = () => {
        URL.revokeObjectURL(url)

        resolve(image)
      }

      image.onerror = () => {
        URL.revokeObjectURL(url)

        reject(
          new Error(
            'Unable to prepare the result image.',
          ),
        )
      }

      image.src = url
    },
  )
}


async function applyBackgroundColor(
  foreground: Blob,
  backgroundColor: string,
): Promise<Blob> {
  const image =
    await loadBlobImage(
      foreground,
    )

  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width =
    image.naturalWidth

  canvas.height =
    image.naturalHeight

  const context =
    canvas.getContext(
      '2d',
    )

  if (!context) {
    throw new Error(
      'Canvas is not supported in this browser.',
    )
  }

  context.fillStyle =
    backgroundColor

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  )

  context.drawImage(
    image,
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
                'Unable to create the final image.',
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


export default function RemoveBackground() {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    originalPreview,
    setOriginalPreview,
  ] =
    useState('')

  const [
    resultPreview,
    setResultPreview,
  ] =
    useState('')

  const [
    resultBlob,
    setResultBlob,
  ] =
    useState<Blob | null>(
      null,
    )

  const [
    stage,
    setStage,
  ] =
    useState<ProcessingStage>(
      'idle',
    )

  const [
    outputBackground,
    setOutputBackground,
  ] =
    useState<OutputBackground>(
      'transparent',
    )

  const [
    customBackground,
    setCustomBackground,
  ] =
    useState('#1565C0')
  const [
    removalMode,
    setRemovalMode,
  ] = useState<BackgroundRemovalMode>(
    'fast',
  )

  const qualitySupported =
    supportsQualityBackgroundRemoval()

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')


  const isProcessing =
    stage !== 'idle'


  const selectedBackgroundColor =
    outputBackground ===
    'transparent'
      ? null

      : outputBackground ===
          'custom'
        ? customBackground

        : BACKGROUND_PRESETS[
            outputBackground
          ]


  function clearResult() {
    if (resultPreview) {
      URL.revokeObjectURL(
        resultPreview,
      )
    }

    setResultPreview('')
    setResultBlob(null)
  }


  function handleFile(
    selectedFile: File,
  ) {
    setError('')
    clearResult()

    if (
      !SUPPORTED_TYPES.includes(
        selectedFile.type,
      )
    ) {
      setError(
        'Please choose a JPG, PNG, or WebP image.',
      )

      return
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        'This image is too large. Maximum size is 15 MB.',
      )

      return
    }

    if (originalPreview) {
      URL.revokeObjectURL(
        originalPreview,
      )
    }

    setFile(
      selectedFile,
    )

    setOriginalPreview(
      URL.createObjectURL(
        selectedFile,
      ),
    )

    setOutputBackground(
      'transparent',
    )
  }


  function handleInputChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0]

    if (selectedFile) {
      handleFile(
        selectedFile,
      )
    }

    event.target.value = ''
  }


  function handleDrop(
    event:
      DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    setIsDragging(false)

    const selectedFile =
      event.dataTransfer
        .files?.[0]

    if (selectedFile) {
      handleFile(
        selectedFile,
      )
    }
  }


  async function handleRemoveBackground() {
    if (!file) {
      return
    }

    setError('')
    clearResult()

    try {
      setStage(
        'loading-model',
      )

      await preloadBackgroundRemovalModel(
        removalMode,
      )

      setStage(
        'processing',
      )

      const blob =
        await removeImageBackground(
          file,
          removalMode,
        )

      const resultUrl =
        URL.createObjectURL(
          blob,
        )

      setResultBlob(
        blob,
      )

      setResultPreview(
        resultUrl,
      )
    } catch (
      caughtError
    ) {
      if (
        caughtError
        instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'We could not remove the background from this image.',
        )
      }
    } finally {
      setStage(
        'idle',
      )
    }
  }


  async function handleDownload() {
    if (
      !resultBlob ||
      !file
    ) {
      return
    }

    setError('')

    try {
      const outputBlob =
        selectedBackgroundColor
          ? await applyBackgroundColor(
              resultBlob,
              selectedBackgroundColor,
            )
          : resultBlob

      const baseName =
        file.name.replace(
          /\.[^/.]+$/,
          '',
        )

      const suffix =
        outputBackground ===
        'transparent'
          ? 'transparent'

          : outputBackground ===
              'custom'
            ? 'custom-background'

            : `${outputBackground}-background`

      downloadBlob(
        outputBlob,
        `${baseName}-${suffix}.png`,
      )
    } catch (
      caughtError
    ) {
      if (
        caughtError
        instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'Unable to download the result.',
        )
      }
    }
  }


  function handleReset() {
    if (originalPreview) {
      URL.revokeObjectURL(
        originalPreview,
      )
    }

    clearResult()

    setFile(null)

    setOriginalPreview('')

    setError('')

    setStage(
      'idle',
    )

    setOutputBackground(
      'transparent',
    )

    setCustomBackground(
      '#1565C0',
    )
  }


  return (
    <main
      className="
        mx-auto
        max-w-6xl
        px-4
        py-10
        sm:px-6
        sm:py-14
        lg:px-8
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
      >
        <Link
          to="/"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-[var(--text-secondary)]
            transition
            hover:text-[var(--primary-text)]
          "
        >
          <ArrowLeft
            size={16}
          />

          All tools
        </Link>


        {/* HEADER */}

        <div
          className="
            mt-8
            max-w-2xl
          "
        >
          <div
            className="
              mb-5
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-[var(--primary-border)]
              bg-[var(--primary-soft)]
              text-[var(--primary-text)]
            "
          >
            <Scissors
              size={23}
            />
          </div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            Remove Background
          </h1>

          <p
            className="
              mt-3
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            Remove image
            backgrounds directly
            in your browser and
            export transparent,
            red, blue, white, or
            custom backgrounds.
          </p>

          <div
            className="
              mt-4
              inline-flex
              items-center
              gap-2
              text-sm
              text-[var(--text-muted)]
            "
          >
            <ShieldCheck
              size={15}
              className="
                text-[var(--success)]
              "
            />

            Your image never
            leaves your device.
          </div>
        </div>
        <div
          className="
            mt-6
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-4
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-[var(--text-primary)]
            "
          >
            Removal quality
          </p>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-[var(--text-muted)]
            "
          >
            Fast is recommended for everyday use.
            Quality gives cleaner edges but requires
            a much larger AI model on first use.
          </p>

          <div
            className="
              mt-4
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setRemovalMode('fast')
              }}
              className={`
                rounded-xl
                border
                p-4
                text-left
                transition

                ${
                  removalMode === 'fast'
                    ? `
                      border-[var(--primary)]
                      bg-[var(--primary-soft)]
                    `
                    : `
                      border-[var(--border)]
                      hover:border-[var(--primary-border)]
                    `
                }
              `}
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <span
                  className="
                    text-sm
                    font-semibold
                    text-[var(--text-primary)]
                  "
                >
                  ⚡ Fast
                </span>

                {removalMode === 'fast' && (
                  <span
                    className="
                      text-xs
                      font-medium
                      text-[var(--primary-text)]
                    "
                  >
                    Selected
                  </span>
                )}
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-[var(--text-muted)]
                "
              >
                Lightweight model. Faster first load
                and recommended for most portraits.
              </p>
            </button>


            <button
              type="button"
              disabled={
                isProcessing ||
                !qualitySupported
              }
              onClick={() => {
                setRemovalMode(
                  'quality',
                )
              }}
              className={`
                rounded-xl
                border
                p-4
                text-left
                transition

                ${
                  removalMode === 'quality'
                    ? `
                      border-[var(--primary)]
                      bg-[var(--primary-soft)]
                    `
                    : `
                      border-[var(--border)]
                      hover:border-[var(--primary-border)]
                    `
                }

                ${
                  !qualitySupported
                    ? `
                      cursor-not-allowed
                      opacity-50
                    `
                    : ''
                }
              `}
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <span
                  className="
                    text-sm
                    font-semibold
                    text-[var(--text-primary)]
                  "
                >
                  ✨ Quality
                </span>

                {removalMode === 'quality' && (
                  <span
                    className="
                      text-xs
                      font-medium
                      text-[var(--primary-text)]
                    "
                  >
                    Selected
                  </span>
                )}
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-[var(--text-muted)]
                "
              >
                Better fine edges and hair.
                Large first download and slower processing.
              </p>

              {!qualitySupported && (
                <p
                  className="
                    mt-2
                    text-xs
                    font-medium
                    text-amber-500
                  "
                >
                  WebGPU is not available in this browser.
                </p>
              )}
            </button>
          </div>
        </div>

        {!file ? (
          /* UPLOAD */

          <motion.section
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              mt-10
            "
          >
            <div
              onDragEnter={(
                event,
              ) => {
                event.preventDefault()

                setIsDragging(
                  true,
                )
              }}
              onDragOver={(
                event,
              ) => {
                event.preventDefault()

                setIsDragging(
                  true,
                )
              }}
              onDragLeave={() => {
                setIsDragging(
                  false,
                )
              }}
              onDrop={
                handleDrop
              }
              className={`
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                rounded-3xl
                border-2
                border-dashed
                px-6
                py-16
                text-center
                transition-all
                duration-200

                ${
                  isDragging
                    ? `
                      border-[var(--primary)]
                      bg-[var(--primary-soft)]
                    `
                    : `
                      border-[var(--border)]
                      bg-[var(--surface)]
                      hover:border-[var(--primary-border)]
                    `
                }
              `}
            >
              <motion.div
                animate={
                  isDragging
                    ? {
                        y: -5,
                        scale:
                          1.05,
                      }
                    : {
                        y: 0,
                        scale:
                          1,
                      }
                }
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--primary-soft)]
                  text-[var(--primary-text)]
                "
              >
                <Upload
                  size={28}
                />
              </motion.div>

              <h2
                className="
                  mt-6
                  text-lg
                  font-semibold
                  text-[var(--text-primary)]
                "
              >
                Drop your
                image here
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-[var(--text-secondary)]
                "
              >
                JPG, PNG or WebP
                {' · '}
                Max 15 MB
              </p>

              <button
                type="button"
                onClick={() => {
                  inputRef
                    .current
                    ?.click()
                }}
                className="
                  mt-6
                  rounded-xl
                  bg-[var(--primary)]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-[var(--primary-hover)]
                "
              >
                Browse Image
              </button>

              <input
                ref={inputRef}
                type="file"
                accept="
                  image/jpeg,
                  image/png,
                  image/webp
                "
                onChange={
                  handleInputChange
                }
                className="
                  hidden
                "
              />
            </div>

            {error && (
              <p
                className="
                  mt-4
                  text-center
                  text-sm
                  text-[var(--error)]
                "
              >
                {error}
              </p>
            )}
          </motion.section>
        ) : (
          /* WORKSPACE */

          <div
            className="
              mt-10
              grid
              gap-6
              lg:grid-cols-2
            "
          >
            {/* ORIGINAL */}

            <section
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-b
                  border-[var(--border)]
                  px-5
                  py-4
                "
              >
                <div
                  className="
                    min-w-0
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[var(--text-primary)]
                    "
                  >
                    Original
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    {file.name}
                    {' · '}
                    {formatFileSize(
                      file.size,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    isProcessing
                  }
                  onClick={
                    handleReset
                  }
                  aria-label="
                    Remove image
                  "
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-[var(--text-muted)]
                    transition
                    hover:bg-[var(--surface-soft)]
                    hover:text-[var(--text-primary)]
                    disabled:opacity-40
                  "
                >
                  <X
                    size={17}
                  />
                </button>
              </div>

              <div
                className="
                  flex
                  min-h-[420px]
                  items-center
                  justify-center
                  bg-[var(--surface-soft)]
                  p-5
                "
              >
                <img
                  src={
                    originalPreview
                  }
                  alt="Original"
                  className="
                    max-h-[520px]
                    max-w-full
                    rounded-xl
                    object-contain
                    shadow-sm
                  "
                />
              </div>
            </section>


            {/* RESULT */}

            <section
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  border-b
                  border-[var(--border)]
                  px-5
                  py-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[var(--text-primary)]
                    "
                  >
                    Result
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    PNG output
                  </p>
                </div>


                {/* BACKGROUND COLORS */}

                {resultPreview && (
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    "
                  >
                    <Palette
                      size={15}
                      className="
                        mr-1
                        text-[var(--text-muted)]
                      "
                    />

                    {/* TRANSPARENT */}

                    <button
                      type="button"
                      onClick={() => {
                        setOutputBackground(
                          'transparent',
                        )
                      }}
                      title="Transparent"
                      aria-label="
                        Transparent background
                      "
                      className={`
                        h-8
                        w-8
                        rounded-lg
                        border
                        transition

                        ${
                          outputBackground ===
                          'transparent'
                            ? `
                              border-[var(--primary)]
                              ring-2
                              ring-[var(--primary)]/20
                            `
                            : `
                              border-[var(--border)]
                            `
                        }
                      `}
                      style={{
                        background: `
                          linear-gradient(
                            45deg,
                            #cbd5e1 25%,
                            #fff 25%,
                            #fff 75%,
                            #cbd5e1 75%
                          )
                        `,

                        backgroundSize:
                          '8px 8px',
                      }}
                    />


                    {/* RED */}

                    <button
                      type="button"
                      onClick={() => {
                        setOutputBackground(
                          'red',
                        )
                      }}
                      title="Red"
                      aria-label="
                        Red background
                      "
                      className={`
                        h-8
                        w-8
                        rounded-lg
                        border
                        transition

                        ${
                          outputBackground ===
                          'red'
                            ? `
                              border-[var(--primary)]
                              ring-2
                              ring-[var(--primary)]/20
                            `
                            : `
                              border-[var(--border)]
                            `
                        }
                      `}
                      style={{
                        backgroundColor:
                          BACKGROUND_PRESETS
                            .red,
                      }}
                    />


                    {/* BLUE */}

                    <button
                      type="button"
                      onClick={() => {
                        setOutputBackground(
                          'blue',
                        )
                      }}
                      title="Blue"
                      aria-label="
                        Blue background
                      "
                      className={`
                        h-8
                        w-8
                        rounded-lg
                        border
                        transition

                        ${
                          outputBackground ===
                          'blue'
                            ? `
                              border-[var(--primary)]
                              ring-2
                              ring-[var(--primary)]/20
                            `
                            : `
                              border-[var(--border)]
                            `
                        }
                      `}
                      style={{
                        backgroundColor:
                          BACKGROUND_PRESETS
                            .blue,
                      }}
                    />


                    {/* WHITE */}

                    <button
                      type="button"
                      onClick={() => {
                        setOutputBackground(
                          'white',
                        )
                      }}
                      title="White"
                      aria-label="
                        White background
                      "
                      className={`
                        h-8
                        w-8
                        rounded-lg
                        border
                        bg-white
                        transition

                        ${
                          outputBackground ===
                          'white'
                            ? `
                              border-[var(--primary)]
                              ring-2
                              ring-[var(--primary)]/20
                            `
                            : `
                              border-[var(--border)]
                            `
                        }
                      `}
                    />


                    {/* CUSTOM */}

                    <label
                      title="Custom color"
                      className={`
                        relative
                        h-8
                        w-8
                        cursor-pointer
                        overflow-hidden
                        rounded-lg
                        border
                        transition

                        ${
                          outputBackground ===
                          'custom'
                            ? `
                              border-[var(--primary)]
                              ring-2
                              ring-[var(--primary)]/20
                            `
                            : `
                              border-[var(--border)]
                            `
                        }
                      `}
                      style={{
                        backgroundColor:
                          customBackground,
                      }}
                    >
                      <input
                        type="color"
                        value={
                          customBackground
                        }
                        onChange={(
                          event,
                        ) => {
                          setCustomBackground(
                            event
                              .target
                              .value,
                          )

                          setOutputBackground(
                            'custom',
                          )
                        }}
                        onClick={() => {
                          setOutputBackground(
                            'custom',
                          )
                        }}
                        className="
                          absolute
                          inset-0
                          h-full
                          w-full
                          cursor-pointer
                          opacity-0
                        "
                        aria-label="
                          Custom background color
                        "
                      />
                    </label>
                  </div>
                )}
              </div>


              {/* RESULT PREVIEW */}

              <div
                style={
                  selectedBackgroundColor
                    ? {
                        backgroundColor:
                          selectedBackgroundColor,
                      }
                    : checkerboardStyle
                }
                className="
                  flex
                  min-h-[420px]
                  items-center
                  justify-center
                  p-5
                  transition-colors
                "
              >
                {resultPreview ? (
                  <motion.img
                    initial={{
                      opacity: 0,
                      scale:
                        0.98,
                    }}
                    animate={{
                      opacity: 1,
                      scale:
                        1,
                    }}
                    src={
                      resultPreview
                    }
                    alt="
                      Background removed
                    "
                    className="
                      max-h-[520px]
                      max-w-full
                      object-contain
                    "
                  />
                ) : (
                  <div
                    className="
                      max-w-xs
                      text-center
                    "
                  >
                    {isProcessing ? (
                      <>
                        <LoaderCircle
                          size={30}
                          className="
                            mx-auto
                            animate-spin
                            text-[var(--primary)]
                          "
                        />

                        <p
                          className="
                            mt-4
                            text-sm
                            font-medium
                            text-[var(--text-primary)]
                          "
                        >
                          {stage === 'loading-model'
                            ? removalMode === 'quality'
                              ? 'Loading Quality AI model...'
                              : 'Loading Fast AI model...'
                            : removalMode === 'quality'
                              ? 'Removing with Quality mode...'
                              : 'Removing background...'}
                        </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          leading-5
                          text-[var(--text-muted)]
                        "
                      >
                        {removalMode === 'quality'
                          ? 'Quality mode has a large first download. Future runs may be faster after caching.'
                          : 'The first run can take a little longer. The model is cached by your browser.'}
                      </p>
                      </>
                    ) : (
                      <>
                        <Scissors
                          size={30}
                          className="
                            mx-auto
                            text-[var(--text-muted)]
                          "
                        />

                        <p
                          className="
                            mt-4
                            text-sm
                            font-medium
                            text-[var(--text-primary)]
                          "
                        >
                          Ready to remove
                          the background
                        </p>

                        <p
                          className="
                            mt-2
                            text-xs
                            leading-5
                            text-[var(--text-muted)]
                          "
                        >
                          Processing
                          happens locally
                          on this device.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>


            {/* ACTIONS */}

            <section
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-5
                lg:col-span-2
              "
            >
              {error && (
                <div
                  className="
                    mb-4
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/5
                    px-4
                    py-3
                    text-sm
                    text-[var(--error)]
                  "
                >
                  {error}
                </div>
              )}

              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      leading-5
                      text-[var(--text-muted)]
                    "
                  >
                    Lightweight AI
                    processing optimized
                    mainly for portraits
                    and people.
                  </p>

                  {resultPreview && (
                    <p
                      className="
                        mt-1
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      Selected background:
                      {' '}

                      <span
                        className="
                          font-medium
                          text-[var(--text-secondary)]
                        "
                      >
                        {outputBackground ===
                        'transparent'
                          ? 'Transparent'

                          : outputBackground ===
                              'custom'
                            ? customBackground.toUpperCase()

                            : outputBackground
                                .charAt(0)
                                .toUpperCase() +
                              outputBackground
                                .slice(1)}
                      </span>
                    </p>
                  )}
                </div>


                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                  "
                >
                  <button
                    type="button"
                    disabled={
                      isProcessing
                    }
                    onClick={
                      handleReset
                    }
                    className="
                      rounded-xl
                      border
                      border-[var(--border)]
                      px-4
                      py-3
                      text-sm
                      font-medium
                      text-[var(--text-secondary)]
                      transition
                      hover:border-[var(--primary-border)]
                      hover:bg-[var(--primary-soft)]
                      hover:text-[var(--text-primary)]
                      disabled:opacity-40
                    "
                  >
                    Choose Another
                  </button>


                  {!resultBlob ? (
                    <motion.button
                      type="button"
                      disabled={
                        isProcessing
                      }
                      onClick={() => {
                        void handleRemoveBackground()
                      }}
                      whileTap={
                        !isProcessing
                          ? {
                              scale:
                                0.97,
                            }
                          : undefined
                      }
                      className={`
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        transition

                        ${
                          isProcessing
                            ? `
                              cursor-wait
                              bg-[var(--primary)]
                              text-slate-950
                            `
                            : `
                              bg-[var(--primary)]
                              text-slate-950
                              hover:bg-[var(--primary-hover)]
                            `
                        }
                      `}
                    >
                      {isProcessing ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="
                              animate-spin
                            "
                          />

                          {stage ===
                          'loading-model'
                            ? 'Loading model...'
                            : 'Removing...'}
                        </>
                      ) : (
                        <>
                          <Scissors
                            size={17}
                          />

                          Remove Background
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={() => {
                        void handleDownload()
                      }}
                      whileTap={{
                        scale:
                          0.97,
                      }}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[var(--primary)]
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-slate-950
                        transition
                        hover:bg-[var(--primary-hover)]
                      "
                    >
                      <Download
                        size={17}
                      />

                      Download PNG
                    </motion.button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </main>
  )
}