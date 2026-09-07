import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Download,
  FileText,
  Images,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'

import { Link } from 'react-router'

import SortableImageCard from '../../components/tools/SortableImageCard'

import {
  generateImagePdf,
  type PdfMargin,
  type PdfOrientation,
} from '../../lib/pdf'

import type { PdfImageItem } from '../../types/imagePdf'

import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

const MAX_IMAGES = 20
const MAX_FILE_SIZE = 15 * 1024 * 1024

const supportedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export default function ImageToPdf() {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const previewUrlsRef =
    useRef<Set<string>>(new Set())

  const [images, setImages] =
    useState<PdfImageItem[]>([])

  const [orientation, setOrientation] =
    useState<PdfOrientation>('portrait')

  const [margin, setMargin] =
    useState<PdfMargin>('small')

  const [pdfBlob, setPdfBlob] =
    useState<Blob | null>(null)

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [isDraggingFiles, setIsDraggingFiles] =
    useState(false)

  const [error, setError] =
    useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),

    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url)
        },
      )

      previewUrlsRef.current.clear()
    }
  }, [])

  function invalidatePdf() {
    setPdfBlob(null)
  }

  function addFiles(
    fileList: FileList | File[],
  ) {
    const files = Array.from(fileList)

    if (files.length === 0) {
      return
    }

    setError('')

    const validFiles = files.filter(
      (file) =>
        supportedTypes.includes(file.type) &&
        file.size <= MAX_FILE_SIZE,
    )

    if (validFiles.length !== files.length) {
      setError(
        'Some files were skipped. Use JPG, PNG, or WebP images up to 15 MB each.',
      )
    }

    const availableSlots =
      MAX_IMAGES - images.length

    if (availableSlots <= 0) {
      setError(
        `You can add up to ${MAX_IMAGES} images.`,
      )
      return
    }

    const filesToAdd =
      validFiles.slice(0, availableSlots)

    if (
      validFiles.length >
      availableSlots
    ) {
      setError(
        `Only ${MAX_IMAGES} images can be added at once.`,
      )
    }

    const newItems =
      filesToAdd.map((file) => {
        const previewUrl =
          URL.createObjectURL(file)

        previewUrlsRef.current.add(
          previewUrl,
        )

        return {
          id: crypto.randomUUID(),
          file,
          previewUrl,
        }
      })

    setImages((current) => [
      ...current,
      ...newItems,
    ])

    invalidatePdf()
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (event.target.files) {
      addFiles(event.target.files)
    }

    event.target.value = ''
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    setIsDraggingFiles(false)

    addFiles(event.dataTransfer.files)
  }

  function removeImage(id: string) {
    setImages((current) => {
      const target =
        current.find(
          (item) => item.id === id,
        )

      if (target) {
        URL.revokeObjectURL(
          target.previewUrl,
        )

        previewUrlsRef.current.delete(
          target.previewUrl,
        )
      }

      return current.filter(
        (item) => item.id !== id,
      )
    })

    invalidatePdf()
  }

  function clearImages() {
    images.forEach((item) => {
      URL.revokeObjectURL(
        item.previewUrl,
      )

      previewUrlsRef.current.delete(
        item.previewUrl,
      )
    })

    setImages([])
    setPdfBlob(null)
    setError('')
  }

  function handleDragEnd(
    event: DragEndEvent,
  ) {
    const { active, over } = event

    if (
      !over ||
      active.id === over.id
    ) {
      return
    }

    setImages((current) => {
      const oldIndex =
        current.findIndex(
          (item) =>
            item.id === active.id,
        )

      const newIndex =
        current.findIndex(
          (item) =>
            item.id === over.id,
        )

      if (
        oldIndex === -1 ||
        newIndex === -1
      ) {
        return current
      }

      return arrayMove(
        current,
        oldIndex,
        newIndex,
      )
    })

    invalidatePdf()
  }

  async function handleGenerate() {
    if (images.length === 0) {
      return
    }

    setIsProcessing(true)
    setError('')
    setPdfBlob(null)

    try {
      const result =
        await generateImagePdf(
          images.map(
            (item) => item.file,
          ),
          {
            orientation,
            margin,
          },
        )

      setPdfBlob(result)
    } catch {
      setError(
        'We could not create the PDF. Try removing the problematic image and try again.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDownload() {
    if (!pdfBlob) {
      return
    }

    downloadBlob(
      pdfBlob,
      'ditya-tools-images.pdf',
    )
  }

  const totalInputSize =
    images.reduce(
      (total, item) =>
        total + item.file.size,
      0,
    )

  return (
    <main
      className="
        mx-auto max-w-7xl
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
            <FileText size={24} />
          </div>

          <h1
            className="
              text-3xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            Image to PDF
          </h1>

          <p
            className="
              mt-3 text-base leading-7
              text-[var(--text-secondary)]
            "
          >
            Combine multiple images into one
            clean PDF document.
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

            Your images never leave your device.
          </div>
        </div>

        <div
          className="
            mt-10 grid gap-6
            lg:grid-cols-[1fr_360px]
          "
        >
          {/* LEFT */}

          <section>
            <div
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDraggingFiles(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDraggingFiles(true)
              }}
              onDragLeave={() =>
                setIsDraggingFiles(false)
              }
              onDrop={handleDrop}
              className={`
                flex min-h-40
                items-center justify-center
                rounded-2xl
                border-2 border-dashed
                px-6 py-8
                text-center
                transition
                ${
                  isDraggingFiles
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)]'
                }
              `}
            >
              <div>
                <Upload
                  size={26}
                  className="
                    mx-auto
                    text-[var(--primary-text)]
                  "
                />

                <p
                  className="
                    mt-3 text-sm font-medium
                    text-[var(--text-primary)]
                  "
                >
                  Drop images here
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-[var(--text-muted)]
                  "
                >
                  JPG, PNG or WebP · Up to 20 images
                </p>

                <button
                  type="button"
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  className="
                    mt-4 inline-flex
                    items-center gap-2
                    rounded-xl
                    bg-[var(--primary-soft)]
                    px-4 py-2.5
                    text-sm font-semibold
                    text-[var(--primary-text)]
                    transition
                    hover:bg-[var(--primary-soft-strong)]
                  "
                >
                  <Plus size={16} />

                  Add Images
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {error && (
              <p
                className="
                  mt-4 text-sm
                  text-[var(--error)]
                "
              >
                {error}
              </p>
            )}

            {images.length > 0 && (
              <div className="mt-6">
                <div
                  className="
                    mb-4 flex
                    items-center justify-between
                    gap-4
                  "
                >
                  <div>
                    <h2
                      className="
                        text-lg font-semibold
                        text-[var(--text-primary)]
                      "
                    >
                      Your images
                    </h2>

                    <p
                      className="
                        mt-1 text-sm
                        text-[var(--text-muted)]
                      "
                    >
                      Drag the handle to change
                      page order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearImages}
                    className="
                      inline-flex
                      items-center gap-2
                      text-sm font-medium
                      text-[var(--text-muted)]
                      transition
                      hover:text-[var(--error)]
                    "
                  >
                    <Trash2 size={16} />

                    Clear
                  </button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={
                    closestCenter
                  }
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={images.map(
                      (item) => item.id,
                    )}
                    strategy={
                      rectSortingStrategy
                    }
                  >
                    <div
                      className="
                        grid grid-cols-1 gap-4
                        sm:grid-cols-2
                        xl:grid-cols-3
                      "
                    >
                      {images.map(
                        (item, index) => (
                          <SortableImageCard
                            key={item.id}
                            item={item}
                            index={index}
                            onRemove={
                              removeImage
                            }
                          />
                        ),
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </section>

          {/* RIGHT */}

          <aside
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
              PDF settings
            </h2>

            <div className="mt-6">
              <p
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Page size
              </p>

              <div
                className="
                  mt-3 rounded-xl
                  border border-[var(--border)]
                  bg-[var(--background)]
                  px-4 py-3
                  text-sm
                  text-[var(--text-secondary)]
                "
              >
                A4
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="orientation"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Orientation
              </label>

              <select
                id="orientation"
                value={orientation}
                onChange={(event) => {
                  setOrientation(
                    event.target
                      .value as PdfOrientation,
                  )

                  invalidatePdf()
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
                <option value="portrait">
                  Portrait
                </option>

                <option value="landscape">
                  Landscape
                </option>
              </select>
            </div>

            <div className="mt-6">
              <label
                htmlFor="margin"
                className="
                  text-sm font-medium
                  text-[var(--text-primary)]
                "
              >
                Margin
              </label>

              <select
                id="margin"
                value={margin}
                onChange={(event) => {
                  setMargin(
                    event.target
                      .value as PdfMargin,
                  )

                  invalidatePdf()
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
                <option value="none">
                  No margin
                </option>

                <option value="small">
                  Small
                </option>

                <option value="normal">
                  Normal
                </option>
              </select>
            </div>

            {images.length > 0 && (
              <div
                className="
                  mt-6 rounded-xl
                  bg-[var(--surface-soft)]
                  p-4
                "
              >
                <div
                  className="
                    flex items-center gap-2
                    text-sm font-medium
                    text-[var(--text-primary)]
                  "
                >
                  <Images size={16} />

                  {images.length}{' '}
                  {images.length === 1
                    ? 'image'
                    : 'images'}
                </div>

                <p
                  className="
                    mt-2 text-xs
                    text-[var(--text-muted)]
                  "
                >
                  Total input:{' '}
                  {formatFileSize(
                    totalInputSize,
                  )}
                </p>
              </div>
            )}

            {pdfBlob && (
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
                  mt-6 rounded-xl
                  border border-[var(--primary-border)]
                  bg-[var(--primary-soft)]
                  p-4
                "
              >
                <p
                  className="
                    text-sm font-semibold
                    text-[var(--primary-text)]
                  "
                >
                  PDF ready
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-[var(--text-secondary)]
                  "
                >
                  {images.length} pages ·{' '}
                  {formatFileSize(
                    pdfBlob.size,
                  )}
                </p>
              </motion.div>
            )}

            <div className="mt-6">
              {!pdfBlob ? (
                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={
                    images.length === 0 ||
                    isProcessing
                  }
                  whileTap={
                    images.length > 0 &&
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
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />

                      Creating PDF...
                    </>
                  ) : (
                    <>
                      <FileText size={17} />

                      Create PDF
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

                  Download PDF
                </motion.button>
              )}
            </div>
          </aside>
        </div>
      </motion.div>
    </main>
  )
}