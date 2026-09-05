import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Check,
  Download,
  FileImage,
  ImageDown,
  RefreshCcw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import { Link } from 'react-router'

import {
  compressImage,
  type ImageOutputFormat,
} from '../../lib/image'

import { formatFileSize } from '../../utils/file'

const MAX_FILE_SIZE = 20 * 1024 * 1024

const supportedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export default function ImageCompressor() {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const [file, setFile] =
    useState<File | null>(null)

  const [originalPreview, setOriginalPreview] =
    useState('')

  const [compressedPreview, setCompressedPreview] =
    useState('')

  const [compressedBlob, setCompressedBlob] =
    useState<Blob | null>(null)

  const [quality, setQuality] =
    useState(75)

  const [outputFormat, setOutputFormat] =
    useState<ImageOutputFormat>('image/webp')

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [isDragging, setIsDragging] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    return () => {
      if (originalPreview) {
        URL.revokeObjectURL(originalPreview)
      }

      if (compressedPreview) {
        URL.revokeObjectURL(compressedPreview)
      }
    }
  }, [originalPreview, compressedPreview])

  function resetCompressedResult() {
    if (compressedPreview) {
      URL.revokeObjectURL(compressedPreview)
    }

    setCompressedPreview('')
    setCompressedBlob(null)
  }

  function handleFile(selectedFile: File) {
    setError('')
    resetCompressedResult()

    if (!supportedTypes.includes(selectedFile.type)) {
      setError(
        'Please choose a JPG, PNG, or WebP image.',
      )
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        'This image is too large. Maximum size is 20 MB.',
      )
      return
    }

    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }

    setFile(selectedFile)

    setOriginalPreview(
      URL.createObjectURL(selectedFile),
    )
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0]

    if (selectedFile) {
      handleFile(selectedFile)
    }

    event.target.value = ''
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    setIsDragging(false)

    const selectedFile =
      event.dataTransfer.files?.[0]

    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  async function handleCompress() {
    if (!file) return

    setIsProcessing(true)
    setError('')

    resetCompressedResult()

    try {
      const blob = await compressImage(file, {
        quality: quality / 100,
        outputFormat,
      })

      const previewUrl =
        URL.createObjectURL(blob)

      setCompressedBlob(blob)
      setCompressedPreview(previewUrl)
    } catch {
      setError(
        'We could not compress this image. Try another image.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDownload() {
    if (!compressedBlob || !file) return

    const extension =
      outputFormat === 'image/webp'
        ? 'webp'
        : 'jpg'

    const baseName =
      file.name.replace(/\.[^/.]+$/, '')

    const downloadUrl =
      URL.createObjectURL(compressedBlob)

    const link =
      document.createElement('a')

    link.href = downloadUrl
    link.download =
      `${baseName}-compressed.${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(downloadUrl)
  }

  function handleReset() {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }

    resetCompressedResult()

    setFile(null)
    setOriginalPreview('')
    setError('')
    setQuality(75)
    setOutputFormat('image/webp')
  }

  const savedBytes =
    file && compressedBlob
      ? file.size - compressedBlob.size
      : 0

  const savingPercentage =
    file &&
    compressedBlob &&
    file.size > 0
      ? Math.round(
          (savedBytes / file.size) * 100,
        )
      : 0

  return (
    <main
      className="
        mx-auto max-w-6xl
        px-4 py-10
        sm:px-6 sm:py-14
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
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Back */}

        <Link
          to="/"
          className="
            inline-flex items-center gap-2
            text-sm font-medium
            text-[var(--text-secondary)]
            transition
            hover:text-[var(--primary-text)]
          "
        >
          <ArrowLeft size={16} />

          All tools
        </Link>

        {/* Header */}

        <div className="mt-8 max-w-2xl">
          <div
            className="
              mb-5 flex h-12 w-12
              items-center justify-center
              rounded-2xl
              border border-[var(--primary-border)]
              bg-[var(--primary-soft)]
              text-[var(--primary-text)]
            "
          >
            <ImageDown size={24} />
          </div>

          <h1
            className="
              text-3xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            Image Compressor
          </h1>

          <p
            className="
              mt-3 text-base leading-7
              text-[var(--text-secondary)]
            "
          >
            Reduce image size without uploading it
            anywhere.
          </p>

          <div
            className="
              mt-4 inline-flex items-center gap-2
              text-sm
              text-[var(--text-muted)]
            "
          >
            <ShieldCheck
              size={15}
              className="text-[var(--success)]"
            />

            Your image stays on your device.
          </div>
        </div>

        {!file ? (
          /* Upload */

          <motion.section
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-10"
          >
            <div
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() =>
                setIsDragging(false)
              }
              onDrop={handleDrop}
              className={`
                flex min-h-[360px]
                flex-col items-center justify-center
                rounded-3xl
                border-2 border-dashed
                px-6 py-16
                text-center
                transition-all duration-200
                ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)]'
                }
              `}
            >
              <motion.div
                animate={
                  isDragging
                    ? {
                        y: -5,
                        scale: 1.05,
                      }
                    : {
                        y: 0,
                        scale: 1,
                      }
                }
                className="
                  flex h-16 w-16
                  items-center justify-center
                  rounded-2xl
                  bg-[var(--primary-soft)]
                  text-[var(--primary-text)]
                "
              >
                <Upload size={28} />
              </motion.div>

              <h2
                className="
                  mt-6 text-lg font-semibold
                  text-[var(--text-primary)]
                "
              >
                Drop your image here
              </h2>

              <p
                className="
                  mt-2 text-sm
                  text-[var(--text-secondary)]
                "
              >
                JPG, PNG or WebP · Max 20 MB
              </p>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
                  mt-6 rounded-xl
                  bg-[var(--primary-300)]
                  px-5 py-3
                  text-sm font-semibold
                  text-sky-950
                  transition
                  hover:bg-[var(--primary)]
                "
              >
                Browse Image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {error && (
              <p
                className="
                  mt-4 text-center text-sm
                  text-[var(--error)]
                "
              >
                {error}
              </p>
            )}
          </motion.section>
        ) : (
          /* Workspace */

          <div
            className="
              mt-10 grid gap-6
              lg:grid-cols-[1fr_380px]
            "
          >
            {/* Preview */}

            <section
              className="
                overflow-hidden
                rounded-2xl
                border border-[var(--border)]
                bg-[var(--surface)]
              "
            >
              <div
                className="
                  flex items-center justify-between
                  border-b border-[var(--border)]
                  px-5 py-4
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      truncate text-sm font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    {file.name}
                  </p>

                  <p
                    className="
                      mt-1 text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Remove image"
                  className="
                    flex h-9 w-9
                    shrink-0 items-center justify-center
                    rounded-lg
                    text-[var(--text-muted)]
                    transition
                    hover:bg-[var(--surface-soft)]
                    hover:text-[var(--text-primary)]
                  "
                >
                  <X size={17} />
                </button>
              </div>

              <div
                className="
                  flex min-h-[420px]
                  items-center justify-center
                  bg-[var(--surface-soft)]
                  p-6
                "
              >
                <motion.img
                  key={
                    compressedPreview ||
                    originalPreview
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  src={
                    compressedPreview ||
                    originalPreview
                  }
                  alt="Image preview"
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

            {/* Controls */}

            <section
              className="
                self-start
                rounded-2xl
                border border-[var(--border)]
                bg-[var(--surface)]
                p-5
                sm:p-6
                lg:sticky lg:top-24
              "
            >
              <h2
                className="
                  text-lg font-semibold
                  text-[var(--text-primary)]
                "
              >
                Compression settings
              </h2>

              {/* Format */}

              <div className="mt-6">
                <label
                  htmlFor="output-format"
                  className="
                    text-sm font-medium
                    text-[var(--text-primary)]
                  "
                >
                  Output format
                </label>

                <select
                  id="output-format"
                  value={outputFormat}
                  onChange={(event) => {
                    setOutputFormat(
                      event.target
                        .value as ImageOutputFormat,
                    )

                    resetCompressedResult()
                  }}
                  className="
                    mt-3 w-full
                    rounded-xl
                    border border-[var(--border)]
                    bg-[var(--background)]
                    px-4 py-3
                    text-sm
                    text-[var(--text-primary)]
                    outline-none
                    focus:border-[var(--primary-border)]
                    focus:ring-4
                    focus:ring-sky-100/50
                    dark:focus:ring-sky-900/20
                  "
                >
                  <option value="image/webp">
                    WebP
                  </option>

                  <option value="image/jpeg">
                    JPEG
                  </option>
                </select>
              </div>

              {/* Quality */}

              <div className="mt-6">
                <div
                  className="
                    flex items-center justify-between
                  "
                >
                  <label
                    htmlFor="quality"
                    className="
                      text-sm font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    Quality
                  </label>

                  <span
                    className="
                      text-sm font-semibold
                      text-[var(--primary-text)]
                    "
                  >
                    {quality}%
                  </span>
                </div>

                <input
                  id="quality"
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={quality}
                  onChange={(event) => {
                    setQuality(
                      Number(event.target.value),
                    )

                    resetCompressedResult()
                  }}
                  className="
                    mt-4 w-full
                    accent-sky-400
                  "
                />

                <div
                  className="
                    mt-2 flex justify-between
                    text-xs
                    text-[var(--text-muted)]
                  "
                >
                  <span>Smaller</span>
                  <span>Better quality</span>
                </div>
              </div>

              {/* Result stats */}

              {compressedBlob && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    mt-6
                    rounded-xl
                    border border-[var(--primary-border)]
                    bg-[var(--primary-soft)]
                    p-4
                  "
                >
                  <div
                    className="
                      flex items-center gap-2
                      text-sm font-semibold
                      text-[var(--primary-text)]
                    "
                  >
                    <Check size={16} />

                    Compression complete
                  </div>

                  <div
                    className="
                      mt-4 grid grid-cols-2 gap-3
                    "
                  >
                    <div>
                      <p
                        className="
                          text-xs
                          text-[var(--text-muted)]
                        "
                      >
                        Before
                      </p>

                      <p
                        className="
                          mt-1 text-sm font-semibold
                          text-[var(--text-primary)]
                        "
                      >
                        {formatFileSize(
                          file.size,
                        )}
                      </p>
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          text-[var(--text-muted)]
                        "
                      >
                        After
                      </p>

                      <p
                        className="
                          mt-1 text-sm font-semibold
                          text-[var(--text-primary)]
                        "
                      >
                        {formatFileSize(
                          compressedBlob.size,
                        )}
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-4
                      border-t
                      border-[var(--primary-border)]
                      pt-4
                    "
                  >
                    <p
                      className="
                        text-2xl font-bold
                        text-[var(--primary-text)]
                      "
                    >
                      {savingPercentage > 0
                        ? `${savingPercentage}% smaller`
                        : 'No size reduction'}
                    </p>

                    {savedBytes > 0 && (
                      <p
                        className="
                          mt-1 text-xs
                          text-[var(--text-secondary)]
                        "
                      >
                        Saved{' '}
                        {formatFileSize(
                          savedBytes,
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {error && (
                <p
                  className="
                    mt-5 text-sm
                    text-[var(--error)]
                  "
                >
                  {error}
                </p>
              )}

              {/* Actions */}

              <div className="mt-6 grid gap-2">
                {!compressedBlob ? (
                  <motion.button
                    type="button"
                    onClick={handleCompress}
                    disabled={isProcessing}
                    whileTap={
                      !isProcessing
                        ? { scale: 0.97 }
                        : undefined
                    }
                    className="
                      flex w-full
                      items-center justify-center gap-2
                      rounded-xl
                      bg-[var(--primary-300)]
                      px-4 py-3
                      text-sm font-semibold
                      text-sky-950
                      transition
                      hover:bg-[var(--primary)]
                      disabled:cursor-wait
                      disabled:opacity-60
                    "
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCcw
                          size={17}
                          className="animate-spin"
                        />

                        Compressing...
                      </>
                    ) : (
                      <>
                        <ImageDown size={17} />

                        Compress Image
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleDownload}
                    whileTap={{
                      scale: 0.97,
                    }}
                    className="
                      flex w-full
                      items-center justify-center gap-2
                      rounded-xl
                      bg-[var(--primary-300)]
                      px-4 py-3
                      text-sm font-semibold
                      text-sky-950
                      transition
                      hover:bg-[var(--primary)]
                    "
                  >
                    <Download size={17} />

                    Download Image
                  </motion.button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="
                    flex w-full
                    items-center justify-center gap-2
                    rounded-xl
                    border border-[var(--border)]
                    px-4 py-3
                    text-sm font-medium
                    text-[var(--text-secondary)]
                    transition
                    hover:border-[var(--primary-border)]
                    hover:bg-[var(--primary-soft)]
                    hover:text-[var(--text-primary)]
                  "
                >
                  <FileImage size={17} />

                  Choose Another Image
                </button>
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </main>
  )
}