import {
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  CSS,
} from '@dnd-kit/utilities'

import {
  ArrowLeft,
  Download,
  FileText,
  GripVertical,
  LoaderCircle,
  Merge,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import {
  motion,
} from 'motion/react'

import {
  Link,
} from 'react-router'

import {
  mergePdfFiles,
  readPdfInfo,
} from '../../lib/pdfMerge'

import {
  downloadBlob,
} from '../../utils/download'

import {
  formatFileSize,
} from '../../utils/file'


interface PdfItem {
  id: string

  file: File

  pageCount: number
}


interface SortablePdfItemProps {
  item: PdfItem

  onRemove: (
    id: string,
  ) => void

  disabled: boolean
}


function SortablePdfItem({
  item,
  onRemove,
  disabled,
}: SortablePdfItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({
      id: item.id,
      disabled,
    })


  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),

    transition,

    zIndex:
      isDragging
        ? 10
        : undefined,

    opacity:
      isDragging
        ? 0.65
        : 1,
  }


  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="
        flex
        items-center
        gap-3
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-3
        shadow-sm
      "
    >
      <button
        type="button"
        disabled={disabled}
        {...attributes}
        {...listeners}
        aria-label="Reorder PDF"
        className="
          flex
          h-10
          w-8
          shrink-0
          cursor-grab
          touch-none
          items-center
          justify-center
          rounded-lg
          text-[var(--text-muted)]
          transition
          hover:bg-[var(--surface-soft)]
          hover:text-[var(--text-primary)]
          active:cursor-grabbing
          disabled:cursor-default
          disabled:opacity-40
        "
      >
        <GripVertical
          size={18}
        />
      </button>


      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[var(--primary-soft)]
          text-[var(--primary-text)]
        "
      >
        <FileText
          size={21}
        />
      </div>


      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            truncate
            text-sm
            font-semibold
            text-[var(--text-primary)]
          "
        >
          {item.file.name}
        </p>

        <p
          className="
            mt-1
            text-xs
            text-[var(--text-muted)]
          "
        >
          {item.pageCount}{' '}
          {item.pageCount === 1
            ? 'page'
            : 'pages'}

          {' · '}

          {formatFileSize(
            item.file.size,
          )}
        </p>
      </div>


      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onRemove(
            item.id,
          )
        }}
        aria-label={`Remove ${item.file.name}`}
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
          hover:bg-red-500/10
          hover:text-red-500
          disabled:opacity-40
        "
      >
        <Trash2
          size={17}
        />
      </button>
    </motion.div>
  )
}


function createPdfId() {
  if (
    typeof crypto !==
      'undefined' &&
    'randomUUID' in crypto
  ) {
    return crypto.randomUUID()
  }

  return `${
    Date.now()
  }-${
    Math.random()
      .toString(36)
      .slice(2)
  }`
}


export default function PdfMerge() {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    )


  const [
    items,
    setItems,
  ] =
    useState<PdfItem[]>(
      [],
    )


  const [
    isReading,
    setIsReading,
  ] =
    useState(false)


  const [
    isMerging,
    setIsMerging,
  ] =
    useState(false)


  const [
    isDraggingFiles,
    setIsDraggingFiles,
  ] =
    useState(false)


  const [
    error,
    setError,
  ] =
    useState('')


  const [
    success,
    setSuccess,
  ] =
    useState('')


  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        },
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        },
      ),
    )


  const isBusy =
    isReading ||
    isMerging


  const totalPages =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.pageCount,

      0,
    )


  const totalSize =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.file.size,

      0,
    )


  async function addFiles(
    incomingFiles: File[],
  ) {
    if (
      incomingFiles.length ===
      0
    ) {
      return
    }

    setError('')
    setSuccess('')
    setIsReading(true)

    try {
      const newItems:
        PdfItem[] = []

      const errors:
        string[] = []


      for (
        const file
        of incomingFiles
      ) {
        try {
          const info =
            await readPdfInfo(
              file,
            )

          newItems.push({
            id: createPdfId(),

            file:
              info.file,

            pageCount:
              info.pageCount,
          })
        } catch (
          caughtError
        ) {
          if (
            caughtError
            instanceof Error
          ) {
            errors.push(
              caughtError.message,
            )
          }
        }
      }


      if (
        newItems.length >
        0
      ) {
        setItems(
          current => [
            ...current,
            ...newItems,
          ],
        )
      }


      if (
        errors.length >
        0
      ) {
        setError(
          errors.join(' '),
        )
      }
    } finally {
      setIsReading(
        false,
      )
    }
  }


  function handleInputChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ??
          [],
      )

    void addFiles(
      files,
    )

    event.target.value = ''
  }


  function handleDrop(
    event:
      DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    setIsDraggingFiles(
      false,
    )

    const files =
      Array.from(
        event.dataTransfer
          .files,
      )

    void addFiles(
      files,
    )
  }


  function handleRemove(
    id: string,
  ) {
    if (isBusy) {
      return
    }

    setItems(
      current =>
        current.filter(
          item =>
            item.id !== id,
        ),
    )

    setError('')
    setSuccess('')
  }


  function handleClear() {
    if (isBusy) {
      return
    }

    setItems([])
    setError('')
    setSuccess('')
  }


  function handleDragEnd(
    event:
      DragEndEvent,
  ) {
    const {
      active,
      over,
    } = event

    if (
      !over ||
      active.id ===
        over.id
    ) {
      return
    }

    setItems(
      current => {
        const oldIndex =
          current.findIndex(
            item =>
              item.id ===
              active.id,
          )

        const newIndex =
          current.findIndex(
            item =>
              item.id ===
              over.id,
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
      },
    )

    setSuccess('')
  }


  async function handleMerge() {
    if (
      items.length < 2
    ) {
      setError(
        'Add at least two PDF files to merge.',
      )

      return
    }

    setError('')
    setSuccess('')
    setIsMerging(true)

    try {
      const blob =
        await mergePdfFiles(
          items.map(
            item =>
              item.file,
          ),
        )

      downloadBlob(
        blob,
        'merged.pdf',
      )

      setSuccess(
        `Merged ${items.length} PDFs with ${totalPages} pages successfully.`,
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
          'We could not merge these PDF files.',
        )
      }
    } finally {
      setIsMerging(
        false,
      )
    }
  }


  return (
    <main
      className="
        mx-auto
        max-w-5xl
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
            <Merge
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
            PDF Merge
          </h1>

          <p
            className="
              mt-3
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            Combine multiple PDF
            files into one document.
            Reorder them however
            you want before merging.
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

            Your PDFs never leave
            your device.
          </div>
        </div>


        {/* WORKSPACE */}

        <section
          className="
            mt-10
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-4
            sm:p-6
          "
        >
          {/* EMPTY UPLOAD */}

          {items.length === 0 ? (
            <div
              onDragEnter={(
                event,
              ) => {
                event.preventDefault()

                setIsDraggingFiles(
                  true,
                )
              }}
              onDragOver={(
                event,
              ) => {
                event.preventDefault()

                setIsDraggingFiles(
                  true,
                )
              }}
              onDragLeave={() => {
                setIsDraggingFiles(
                  false,
                )
              }}
              onDrop={
                handleDrop
              }
              className={`
                flex
                min-h-[340px]
                flex-col
                items-center
                justify-center
                rounded-2xl
                border-2
                border-dashed
                px-6
                py-12
                text-center
                transition-all

                ${
                  isDraggingFiles
                    ? `
                      border-[var(--primary)]
                      bg-[var(--primary-soft)]
                    `
                    : `
                      border-[var(--border)]
                      bg-[var(--surface-soft)]
                      hover:border-[var(--primary-border)]
                    `
                }
              `}
            >
              <motion.div
                animate={
                  isDraggingFiles
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
                {isReading ? (
                  <LoaderCircle
                    size={28}
                    className="
                      animate-spin
                    "
                  />
                ) : (
                  <Upload
                    size={28}
                  />
                )}
              </motion.div>

              <h2
                className="
                  mt-6
                  text-lg
                  font-semibold
                  text-[var(--text-primary)]
                "
              >
                {isReading
                  ? 'Reading PDFs...'
                  : 'Drop your PDFs here'}
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-[var(--text-secondary)]
                "
              >
                Select two or more
                PDF files
              </p>

              <button
                type="button"
                disabled={
                  isReading
                }
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
                  disabled:opacity-50
                "
              >
                Choose PDFs
              </button>
            </div>
          ) : (
            <>
              {/* TOOLBAR */}

              <div
                className="
                  flex
                  flex-col
                  gap-4
                  border-b
                  border-[var(--border)]
                  pb-5
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
                    PDFs to merge
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    {items.length}{' '}
                    files ·{' '}
                    {totalPages}{' '}
                    pages ·{' '}
                    {formatFileSize(
                      totalSize,
                    )}
                  </p>
                </div>


                <div
                  className="
                    flex
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      isBusy
                    }
                    onClick={() => {
                      inputRef
                        .current
                        ?.click()
                    }}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-[var(--border)]
                      px-4
                      py-2.5
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
                    {isReading ? (
                      <LoaderCircle
                        size={16}
                        className="
                          animate-spin
                        "
                      />
                    ) : (
                      <Plus
                        size={16}
                      />
                    )}

                    Add PDFs
                  </button>


                  <button
                    type="button"
                    disabled={
                      isBusy
                    }
                    onClick={
                      handleClear
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[var(--border)]
                      px-3
                      py-2.5
                      text-[var(--text-muted)]
                      transition
                      hover:border-red-500/30
                      hover:bg-red-500/10
                      hover:text-red-500
                      disabled:opacity-40
                    "
                    aria-label="
                      Clear all PDFs
                    "
                  >
                    <X
                      size={17}
                    />
                  </button>
                </div>
              </div>


              {/* SORTABLE LIST */}

              <div
                className="
                  mt-5
                "
              >
                <p
                  className="
                    mb-3
                    text-xs
                    text-[var(--text-muted)]
                  "
                >
                  Drag files to change
                  their order. The PDF
                  at the top will appear
                  first.
                </p>

                <DndContext
                  sensors={
                    sensors
                  }
                  collisionDetection={
                    closestCenter
                  }
                  onDragEnd={
                    handleDragEnd
                  }
                >
                  <SortableContext
                    items={
                      items.map(
                        item =>
                          item.id,
                      )
                    }
                    strategy={
                      verticalListSortingStrategy
                    }
                  >
                    <div
                      className="
                        space-y-3
                      "
                    >
                      {items.map(
                        item => (
                          <SortablePdfItem
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                            disabled={
                              isBusy
                            }
                            onRemove={
                              handleRemove
                            }
                          />
                        ),
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </>
          )}


          {/* HIDDEN INPUT */}

          <input
            ref={inputRef}
            type="file"
            accept="
              application/pdf,
              .pdf
            "
            multiple
            onChange={
              handleInputChange
            }
            className="
              hidden
            "
          />


          {/* ERRORS */}

          {error && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-red-500/20
                bg-red-500/5
                px-4
                py-3
                text-sm
                leading-6
                text-[var(--error)]
              "
            >
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                px-4
                py-3
                text-sm
                text-emerald-600
                dark:text-emerald-400
              "
            >
              {success}
            </div>
          )}


          {/* MERGE ACTION */}

          {items.length > 0 && (
            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
                border-t
                border-[var(--border)]
                pt-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p
                className="
                  max-w-xl
                  text-xs
                  leading-5
                  text-[var(--text-muted)]
                "
              >
                Large PDF files may use
                more memory because the
                merge happens entirely
                inside your browser.
              </p>


              <motion.button
                type="button"
                disabled={
                  items.length < 2 ||
                  isBusy
                }
                onClick={() => {
                  void handleMerge()
                }}
                whileTap={
                  items.length >= 2 &&
                  !isBusy
                    ? {
                        scale:
                          0.97,
                      }
                    : undefined
                }
                className={`
                  inline-flex
                  min-w-[160px]
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
                    items.length < 2 ||
                    isBusy
                      ? `
                        cursor-not-allowed
                        bg-[var(--surface-soft)]
                        text-[var(--text-muted)]
                      `
                      : `
                        bg-[var(--primary)]
                        text-slate-950
                        hover:bg-[var(--primary-hover)]
                      `
                  }
                `}
              >
                {isMerging ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="
                        animate-spin
                      "
                    />

                    Merging...
                  </>
                ) : (
                  <>
                    <Download
                      size={17}
                    />

                    Merge & Download
                  </>
                )}
              </motion.button>
            </div>
          )}
        </section>
      </motion.div>
    </main>
  )
}