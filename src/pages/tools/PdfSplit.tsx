import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import {
  ArrowLeft,
  Download,
  FileText,
  LoaderCircle,
  Scissors,
  ShieldCheck,
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
  parsePageSelection,
  readPdfSplitInfo,
  splitPdfPages,
} from '../../lib/pdfSplit'

import {
  downloadBlob,
} from '../../utils/download'

import {
  formatFileSize,
} from '../../utils/file'


interface SelectionState {
  pageNumbers: number[]

  error: string
}


export default function PdfSplit() {
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
    pageCount,
    setPageCount,
  ] =
    useState(0)


  const [
    pageSelection,
    setPageSelection,
  ] =
    useState('')


  const [
    isReading,
    setIsReading,
  ] =
    useState(false)


  const [
    isExtracting,
    setIsExtracting,
  ] =
    useState(false)


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


  const [
    success,
    setSuccess,
  ] =
    useState('')


  const isBusy =
    isReading ||
    isExtracting


  const selectionState =
    useMemo<SelectionState>(
      () => {
        if (
          !file ||
          !pageSelection.trim()
        ) {
          return {
            pageNumbers: [],
            error: '',
          }
        }

        try {
          const result =
            parsePageSelection(
              pageSelection,
              pageCount,
            )

          return {
            pageNumbers:
              result.pageNumbers,

            error: '',
          }
        } catch (
          caughtError
        ) {
          return {
            pageNumbers: [],

            error:
              caughtError
                instanceof Error
                ? caughtError.message
                : 'Invalid page selection.',
          }
        }
      },
      [
        file,
        pageCount,
        pageSelection,
      ],
    )


  const selectedPageCount =
    selectionState
      .pageNumbers
      .length


  async function loadPdf(
    selectedFile: File,
  ) {
    setError('')
    setSuccess('')
    setIsReading(true)

    try {
      const info =
        await readPdfSplitInfo(
          selectedFile,
        )

      setFile(
        info.file,
      )

      setPageCount(
        info.pageCount,
      )

      setPageSelection(
        '',
      )
    } catch (
      caughtError
    ) {
      setFile(null)
      setPageCount(0)
      setPageSelection('')

      if (
        caughtError
        instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'We could not read this PDF file.',
        )
      }
    } finally {
      setIsReading(false)
    }
  }


  function handleInputChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0]

    if (selectedFile) {
      void loadPdf(
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

    if (isBusy) {
      return
    }

    const selectedFile =
      event.dataTransfer
        .files?.[0]

    if (selectedFile) {
      void loadPdf(
        selectedFile,
      )
    }
  }


  function handleReset() {
    if (isBusy) {
      return
    }

    setFile(null)
    setPageCount(0)
    setPageSelection('')
    setError('')
    setSuccess('')
  }


  function selectAllPages() {
    if (
      !file ||
      pageCount < 1
    ) {
      return
    }

    setPageSelection(
      `1-${pageCount}`,
    )

    setError('')
    setSuccess('')
  }


  function selectOddPages() {
    if (
      !file ||
      pageCount < 1
    ) {
      return
    }

    const pages: number[] = []

    for (
      let page = 1;
      page <= pageCount;
      page += 2
    ) {
      pages.push(page)
    }

    setPageSelection(
      pages.join(', '),
    )

    setError('')
    setSuccess('')
  }


  function selectEvenPages() {
    if (
      !file ||
      pageCount < 2
    ) {
      return
    }

    const pages: number[] = []

    for (
      let page = 2;
      page <= pageCount;
      page += 2
    ) {
      pages.push(page)
    }

    setPageSelection(
      pages.join(', '),
    )

    setError('')
    setSuccess('')
  }


  async function handleExtract() {
    if (!file) {
      return
    }

    setError('')
    setSuccess('')


    let pages: number[]


    try {
      const parsed =
        parsePageSelection(
          pageSelection,
          pageCount,
        )

      pages =
        parsed.pageNumbers
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
          'Invalid page selection.',
        )
      }

      return
    }


    setIsExtracting(true)


    try {
      const blob =
        await splitPdfPages(
          file,
          pages,
        )


      const baseName =
        file.name.replace(
          /\.pdf$/i,
          '',
        )


      downloadBlob(
        blob,
        `${baseName}-extracted.pdf`,
      )


      setSuccess(
        `Extracted ${pages.length} ${
          pages.length === 1
            ? 'page'
            : 'pages'
        } successfully.`,
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
          'We could not extract pages from this PDF.',
        )
      }
    } finally {
      setIsExtracting(
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
        {/* BACK */}

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
            PDF Split
          </h1>


          <p
            className="
              mt-3
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            Extract only the pages
            you need from a PDF.
            Select individual pages
            or entire page ranges.
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

            Your PDF never leaves
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
          {!file ? (
            /* UPLOAD */

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
                  isDragging
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
                  ? 'Reading PDF...'
                  : 'Drop your PDF here'}
              </h2>


              <p
                className="
                  mt-2
                  text-sm
                  text-[var(--text-secondary)]
                "
              >
                Choose one PDF file
                to extract pages from
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
                Choose PDF
              </button>
            </div>
          ) : (
            <>
              {/* FILE INFO */}

              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface-soft)]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[var(--primary-soft)]
                    text-[var(--primary-text)]
                  "
                >
                  <FileText
                    size={22}
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
                    {file.name}
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    {pageCount}{' '}
                    {pageCount === 1
                      ? 'page'
                      : 'pages'}

                    {' · '}

                    {formatFileSize(
                      file.size,
                    )}
                  </p>
                </div>


                <button
                  type="button"
                  disabled={
                    isBusy
                  }
                  onClick={
                    handleReset
                  }
                  aria-label="
                    Remove PDF
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
                    hover:bg-red-500/10
                    hover:text-red-500
                    disabled:opacity-40
                  "
                >
                  <X
                    size={17}
                  />
                </button>
              </div>


              {/* SELECTION */}

              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-[var(--border)]
                  p-5
                "
              >
                <div>
                  <label
                    htmlFor="
                      page-selection
                    "
                    className="
                      text-sm
                      font-semibold
                      text-[var(--text-primary)]
                    "
                  >
                    Pages to extract
                  </label>


                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-[var(--text-muted)]
                    "
                  >
                    Enter individual
                    pages, ranges, or
                    combine both.
                  </p>
                </div>


                <input
                  id="
                    page-selection
                  "
                  type="text"
                  value={
                    pageSelection
                  }
                  disabled={
                    isBusy
                  }
                  onChange={(
                    event,
                  ) => {
                    setPageSelection(
                      event
                        .target
                        .value,
                    )

                    setError('')
                    setSuccess('')
                  }}
                  placeholder="
                    e.g. 1-3, 7, 10-15
                  "
                  autoComplete="off"
                  spellCheck={false}
                  className={`
                    mt-4
                    w-full
                    rounded-xl
                    border
                    bg-[var(--background)]
                    px-4
                    py-3
                    text-sm
                    text-[var(--text-primary)]
                    outline-none
                    transition
                    placeholder:text-[var(--text-muted)]

                    ${
                      selectionState.error
                        ? `
                          border-red-500/50
                          focus:border-red-500
                          focus:ring-2
                          focus:ring-red-500/10
                        `
                        : `
                          border-[var(--border)]
                          focus:border-[var(--primary)]
                          focus:ring-2
                          focus:ring-[var(--primary)]/10
                        `
                    }
                  `}
                />


                {/* QUICK SELECTION */}

                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      isBusy
                    }
                    onClick={
                      selectAllPages
                    }
                    className="
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-[var(--text-secondary)]
                      transition
                      hover:border-[var(--primary-border)]
                      hover:bg-[var(--primary-soft)]
                      disabled:opacity-40
                    "
                  >
                    All pages
                  </button>


                  <button
                    type="button"
                    disabled={
                      isBusy
                    }
                    onClick={
                      selectOddPages
                    }
                    className="
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-[var(--text-secondary)]
                      transition
                      hover:border-[var(--primary-border)]
                      hover:bg-[var(--primary-soft)]
                      disabled:opacity-40
                    "
                  >
                    Odd pages
                  </button>


                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      pageCount < 2
                    }
                    onClick={
                      selectEvenPages
                    }
                    className="
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-[var(--text-secondary)]
                      transition
                      hover:border-[var(--primary-border)]
                      hover:bg-[var(--primary-soft)]
                      disabled:opacity-40
                    "
                  >
                    Even pages
                  </button>
                </div>


                {/* LIVE VALIDATION */}

                {pageSelection.trim() &&
                  (
                    selectionState
                      .error
                      ? (
                        <div
                          className="
                            mt-4
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
                          {
                            selectionState
                              .error
                          }
                        </div>
                      ) : (
                        <div
                          className="
                            mt-4
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
                          {
                            selectedPageCount
                          }{' '}
                          {
                            selectedPageCount ===
                            1
                              ? 'page'
                              : 'pages'
                          }{' '}
                          selected
                        </div>
                      )
                  )}


                {/* EXAMPLES */}

                <div
                  className="
                    mt-5
                    border-t
                    border-[var(--border)]
                    pt-4
                  "
                >
                  <p
                    className="
                      text-xs
                      font-medium
                      text-[var(--text-secondary)]
                    "
                  >
                    Examples
                  </p>

                  <div
                    className="
                      mt-2
                      grid
                      gap-1
                      text-xs
                      leading-5
                      text-[var(--text-muted)]
                      sm:grid-cols-2
                    "
                  >
                    <span>
                      <code>
                        3
                      </code>
                      {' '}
                      → page 3
                    </span>

                    <span>
                      <code>
                        1-5
                      </code>
                      {' '}
                      → pages 1 to 5
                    </span>

                    <span>
                      <code>
                        1,3,5
                      </code>
                      {' '}
                      → pages 1, 3 and 5
                    </span>

                    <span>
                      <code>
                        1-3,7,10-12
                      </code>
                      {' '}
                      → combine ranges
                    </span>
                  </div>
                </div>
              </div>


              {/* ACTION */}

              <div
                className="
                  mt-6
                  flex
                  flex-col
                  gap-4
                  border-t
                  border-[var(--border)]
                  pt-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div
                  className="
                    max-w-xl
                  "
                >
                  <p
                    className="
                      text-xs
                      leading-5
                      text-[var(--text-muted)]
                    "
                  >
                    Selected pages are
                    exported in their
                    original page order.
                    Large PDFs may use
                    more browser memory.
                  </p>
                </div>


                <motion.button
                  type="button"
                  disabled={
                    isBusy ||
                    selectedPageCount ===
                      0 ||
                    Boolean(
                      selectionState
                        .error,
                    )
                  }
                  onClick={() => {
                    void handleExtract()
                  }}
                  whileTap={
                    !isBusy &&
                    selectedPageCount >
                      0 &&
                    !selectionState
                      .error
                      ? {
                          scale:
                            0.97,
                        }
                      : undefined
                  }
                  className={`
                    inline-flex
                    min-w-[190px]
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
                      isBusy ||
                      selectedPageCount ===
                        0 ||
                      selectionState
                        .error
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
                  {isExtracting ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="
                          animate-spin
                        "
                      />

                      Extracting...
                    </>
                  ) : (
                    <>
                      <Download
                        size={17}
                      />

                      Extract & Download
                    </>
                  )}
                </motion.button>
              </div>
            </>
          )}


          {/* HIDDEN FILE INPUT */}

          <input
            ref={inputRef}
            type="file"
            accept="
              application/pdf,
              .pdf
            "
            onChange={
              handleInputChange
            }
            className="
              hidden
            "
          />


          {/* GENERAL ERROR */}

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
        </section>
      </motion.div>
    </main>
  )
}