import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { motion } from 'motion/react'

import {
  ArrowLeft,
  Check,
  CirclePlay,
  Clock3,
  Download,
  FileAudio,
  LoaderCircle,
  Music2,
  Search,
  UserRound,
  Video,
} from 'lucide-react'

import { Link } from 'react-router'

import LocalServiceStatus from '../../components/tools/LocalServiceStatus'

import { useLocalService } from '../../hooks/useLocalService'

import {
  analyzeYouTubeMedia,
  getLocalDownloadUrl,
  prepareMediaDownload,
  type MediaAnalysis,
  type MediaAudioFormat,
  type MediaDownloadMode,
} from '../../lib/localService'

import { formatDuration } from '../../utils/media'


const BACKEND_SUPPORTED_QUALITIES = new Set([
  144,
  240,
  360,
  480,
  720,
  1080,
  1440,
  2160,
])


export default function YouTubeDownloader() {
  const {
    status,
    health,
    checkConnection,
  } = useLocalService()

  const [url, setUrl] =
    useState('')

  const [analysis, setAnalysis] =
    useState<MediaAnalysis | null>(null)

  const [isAnalyzing, setIsAnalyzing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [downloadMode, setDownloadMode] =
    useState<MediaDownloadMode>('video')

  const [selectedQuality, setSelectedQuality] =
    useState<number | null>(null)

  const [audioFormat, setAudioFormat] =
    useState<MediaAudioFormat>('mp3')

  const [
    isPreparingDownload,
    setIsPreparingDownload,
  ] = useState(false)

  const [
    downloadSuccess,
    setDownloadSuccess,
  ] = useState('')


  const supportedVideoQualities =
    useMemo(() => {
      if (!analysis) {
        return []
      }

      const qualities = new Set<number>()

      analysis.formats.forEach(
        (format) => {
          const hasVideo =
            format.kind === 'video' ||
            format.kind === 'combined'

          if (
            hasVideo &&
            format.height &&
            BACKEND_SUPPORTED_QUALITIES.has(
              format.height,
            )
          ) {
            qualities.add(
              format.height,
            )
          }
        },
      )

      return Array.from(qualities)
        .sort((a, b) => b - a)
    }, [analysis])


  const audioExtensions =
    useMemo(() => {
      if (!analysis) {
        return []
      }

      const extensions =
        new Set<string>()

      analysis.formats.forEach(
        (format) => {
          if (
            format.kind === 'audio' &&
            format.ext
          ) {
            extensions.add(
              format.ext.toUpperCase(),
            )
          }
        },
      )

      return Array.from(extensions)
    }, [analysis])


  useEffect(() => {
    if (
      supportedVideoQualities.length === 0
    ) {
      setSelectedQuality(null)
      return
    }

    setSelectedQuality(
      supportedVideoQualities[0],
    )
  }, [supportedVideoQualities])


  async function handleAnalyze() {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError(
        'Paste a YouTube URL first.',
      )
      return
    }

    if (status !== 'connected') {
      setError(
        'The local service must be connected first.',
      )
      return
    }

    const controller =
      new AbortController()

    const timeoutId =
      window.setTimeout(() => {
        controller.abort()
      }, 30_000)

    setIsAnalyzing(true)

    setAnalysis(null)
    setSelectedQuality(null)

    setError('')
    setDownloadSuccess('')

    try {
      const result =
        await analyzeYouTubeMedia(
          trimmedUrl,
          controller.signal,
        )

      setAnalysis(result)
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === 'AbortError'
      ) {
        setError(
          'Analysis took too long. Try again.',
        )
      } else if (
        caughtError instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'We could not analyze this video.',
        )
      }
    } finally {
      window.clearTimeout(timeoutId)

      setIsAnalyzing(false)
    }
  }


  async function handleDownload() {
    if (!analysis) {
      return
    }

    if (status !== 'connected') {
      setError(
        'The local service must be connected first.',
      )
      return
    }

    if (
      downloadMode === 'video' &&
      selectedQuality === null
    ) {
      setError(
        'Choose a video quality first.',
      )
      return
    }

    const controller =
      new AbortController()

    const timeoutId =
      window.setTimeout(() => {
        controller.abort()
      }, 10 * 60 * 1000)

    setIsPreparingDownload(true)

    setError('')
    setDownloadSuccess('')

    try {
      const prepared =
        await prepareMediaDownload(
          {
            url:
              analysis.webpage_url ??
              url.trim(),

            mode: downloadMode,

            quality:
              downloadMode === 'video'
                ? selectedQuality
                : null,

            audio_format:
              audioFormat,
          },
          controller.signal,
        )

      const downloadUrl =
        getLocalDownloadUrl(
          prepared.download_url,
        )

      const link =
        document.createElement('a')

      link.href = downloadUrl
      link.style.display = 'none'

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)

      setDownloadSuccess(
        prepared.filename,
      )
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === 'AbortError'
      ) {
        setError(
          'Preparing this file took too long. Try again.',
        )
      } else if (
        caughtError instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'We could not prepare this download.',
        )
      }
    } finally {
      window.clearTimeout(timeoutId)

      setIsPreparingDownload(false)
    }
  }


  return (
    <main
      className="
        mx-auto max-w-5xl
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
        {/* BACK */}

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


        {/* PAGE HEADER */}

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
            <CirclePlay size={24} />
          </div>

          <h1
            className="
              text-3xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            YouTube Media Downloader
          </h1>

          <p
            className="
              mt-3 text-base leading-7
              text-[var(--text-secondary)]
            "
          >
            Analyze and save media you own
            or have permission to download
            using your local service.
          </p>
        </div>


        {/* LOCAL SERVICE */}

        <div className="mt-8">
          <LocalServiceStatus
            status={status}
            health={health}
            onRetry={checkConnection}
          />
        </div>


        {/* ANALYZE FORM */}

        <section
          className="
            mt-6
            rounded-2xl
            border border-[var(--border)]
            bg-[var(--surface)]
            p-5
            sm:p-6
          "
        >
          <label
            htmlFor="youtube-url"
            className="
              text-sm font-medium
              text-[var(--text-primary)]
            "
          >
            YouTube URL
          </label>

          <div
            className="
              mt-3 flex gap-3
              max-sm:flex-col
            "
          >
            <input
              id="youtube-url"
              type="url"
              value={url}
              disabled={
                status !== 'connected' ||
                isAnalyzing ||
                isPreparingDownload
              }
              onChange={(event) => {
                setUrl(
                  event.target.value,
                )

                setAnalysis(null)
                setSelectedQuality(null)

                setError('')
                setDownloadSuccess('')
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !isAnalyzing &&
                  !isPreparingDownload
                ) {
                  void handleAnalyze()
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="
                min-w-0 flex-1
                rounded-xl
                border border-[var(--border)]
                bg-[var(--background)]
                px-4 py-3
                text-sm
                text-[var(--text-primary)]
                outline-none
                transition
                placeholder:text-[var(--text-muted)]
                focus:border-[var(--primary-border)]
                focus:ring-4
                focus:ring-sky-100/50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:focus:ring-sky-900/20
              "
            />

            <motion.button
              type="button"
              onClick={() => {
                void handleAnalyze()
              }}
              disabled={
                status !== 'connected' ||
                !url.trim() ||
                isAnalyzing ||
                isPreparingDownload
              }
              whileTap={
                status === 'connected' &&
                url.trim() &&
                !isAnalyzing &&
                !isPreparingDownload
                  ? {
                      scale: 0.97,
                    }
                  : undefined
              }
              className={`
                flex shrink-0
                items-center justify-center gap-2
                rounded-xl
                px-5 py-3
                text-sm font-semibold
                transition
                ${
                  isAnalyzing
                    ? `
                      cursor-wait
                      bg-[var(--primary)]
                      text-slate-950
                    `
                    : status !==
                          'connected' ||
                        !url.trim() ||
                        isPreparingDownload
                      ? `
                        cursor-not-allowed
                        border border-[var(--border)]
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
              {isAnalyzing ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={17} />

                  Analyze Media
                </>
              )}
            </motion.button>
          </div>

          <p
            className="
              mt-3 text-xs
              text-[var(--text-muted)]
            "
          >
            Analysis only reads metadata.
            Nothing is downloaded yet.
          </p>


          {/* ERROR */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mt-5
                rounded-xl
                border border-red-500/20
                bg-red-500/5
                px-4 py-3
                text-sm
                text-[var(--error)]
              "
            >
              {error}
            </motion.div>
          )}
        </section>


        {/* ANALYSIS RESULT */}

        {analysis && (
          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              mt-6 overflow-hidden
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
            "
          >
            {/* MEDIA INFORMATION */}

            <div
              className="
                grid
                md:grid-cols-[300px_1fr]
              "
            >
              {/* THUMBNAIL */}

              <div
                className="
                  flex min-h-48
                  items-center justify-center
                  overflow-hidden
                  bg-[var(--surface-soft)]
                "
              >
                {analysis.thumbnail ? (
                  <img
                    src={
                      analysis.thumbnail
                    }
                    alt=""
                    className="
                      h-full w-full
                      object-cover
                    "
                  />
                ) : (
                  <Video
                    size={40}
                    className="
                      text-[var(--text-muted)]
                    "
                  />
                )}
              </div>


              {/* METADATA */}

              <div className="p-5 sm:p-6">
                <p
                  className="
                    text-xs font-semibold
                    uppercase tracking-wide
                    text-[var(--primary-text)]
                  "
                >
                  Media found
                </p>

                <h2
                  className="
                    mt-2
                    text-xl font-semibold
                    leading-7
                    text-[var(--text-primary)]
                  "
                >
                  {analysis.title}
                </h2>

                <div
                  className="
                    mt-4 flex flex-wrap
                    gap-x-5 gap-y-2
                    text-sm
                    text-[var(--text-muted)]
                  "
                >
                  {analysis.channel && (
                    <span
                      className="
                        inline-flex
                        items-center gap-2
                      "
                    >
                      <UserRound
                        size={15}
                      />

                      {analysis.channel}
                    </span>
                  )}

                  <span
                    className="
                      inline-flex
                      items-center gap-2
                    "
                  >
                    <Clock3 size={15} />

                    {formatDuration(
                      analysis.duration,
                    )}
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center gap-2
                    "
                  >
                    <Video size={15} />

                    {
                      analysis.formats
                        .length
                    }{' '}
                    formats
                  </span>
                </div>


                {/* AVAILABLE VIDEO QUALITY */}

                {supportedVideoQualities
                  .length > 0 && (
                  <div className="mt-6">
                    <p
                      className="
                        text-sm font-medium
                        text-[var(--text-primary)]
                      "
                    >
                      Available video
                    </p>

                    <div
                      className="
                        mt-3 flex
                        flex-wrap gap-2
                      "
                    >
                      {supportedVideoQualities.map(
                        (quality) => (
                          <span
                            key={quality}
                            className="
                              rounded-lg
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              px-3 py-1.5
                              text-xs font-medium
                              text-[var(--text-secondary)]
                            "
                          >
                            {quality}p
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}


                {/* AVAILABLE AUDIO */}

                {audioExtensions.length >
                  0 && (
                  <div className="mt-5">
                    <p
                      className="
                        text-sm font-medium
                        text-[var(--text-primary)]
                      "
                    >
                      Source audio
                    </p>

                    <div
                      className="
                        mt-3 flex
                        flex-wrap gap-2
                      "
                    >
                      {audioExtensions.map(
                        (extension) => (
                          <span
                            key={
                              extension
                            }
                            className="
                              rounded-lg
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              px-3 py-1.5
                              text-xs font-medium
                              text-[var(--text-secondary)]
                            "
                          >
                            {extension}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* DOWNLOAD OPTIONS */}

            <div
              className="
                border-t
                border-[var(--border)]
                p-5
                sm:p-6
              "
            >
              <h3
                className="
                  text-base font-semibold
                  text-[var(--text-primary)]
                "
              >
                Download options
              </h3>

              <p
                className="
                  mt-1 text-sm
                  text-[var(--text-muted)]
                "
              >
                Choose how you want to
                save this media.
              </p>


              {/* VIDEO / AUDIO MODE */}

              <div
                className="
                  mt-5 grid
                  grid-cols-2 gap-2
                  rounded-xl
                  bg-[var(--surface-soft)]
                  p-1
                "
              >
                <button
                  type="button"
                  disabled={
                    isPreparingDownload
                  }
                  onClick={() => {
                    setDownloadMode(
                      'video',
                    )

                    setError('')
                    setDownloadSuccess(
                      '',
                    )
                  }}
                  className={`
                    flex items-center
                    justify-center gap-2
                    rounded-lg
                    px-4 py-2.5
                    text-sm font-medium
                    transition
                    disabled:cursor-not-allowed
                    ${
                      downloadMode ===
                      'video'
                        ? `
                          bg-[var(--surface)]
                          text-[var(--primary-text)]
                          shadow-sm
                        `
                        : `
                          text-[var(--text-secondary)]
                          hover:text-[var(--text-primary)]
                        `
                    }
                  `}
                >
                  <Video size={16} />

                  Video
                </button>

                <button
                  type="button"
                  disabled={
                    isPreparingDownload
                  }
                  onClick={() => {
                    setDownloadMode(
                      'audio',
                    )

                    setError('')
                    setDownloadSuccess(
                      '',
                    )
                  }}
                  className={`
                    flex items-center
                    justify-center gap-2
                    rounded-lg
                    px-4 py-2.5
                    text-sm font-medium
                    transition
                    disabled:cursor-not-allowed
                    ${
                      downloadMode ===
                      'audio'
                        ? `
                          bg-[var(--surface)]
                          text-[var(--primary-text)]
                          shadow-sm
                        `
                        : `
                          text-[var(--text-secondary)]
                          hover:text-[var(--text-primary)]
                        `
                    }
                  `}
                >
                  <Music2 size={16} />

                  Audio
                </button>
              </div>


              {/* VIDEO QUALITY */}

              {downloadMode ===
                'video' && (
                <motion.div
                  key="video-options"
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-6"
                >
                  <p
                    className="
                      text-sm font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    Video quality
                  </p>

                  {supportedVideoQualities
                    .length > 0 ? (
                    <div
                      className="
                        mt-3 flex
                        flex-wrap gap-2
                      "
                    >
                      {supportedVideoQualities.map(
                        (quality) => {
                          const selected =
                            selectedQuality ===
                            quality

                          return (
                            <button
                              key={
                                quality
                              }
                              type="button"
                              disabled={
                                isPreparingDownload
                              }
                              onClick={() => {
                                setSelectedQuality(
                                  quality,
                                )

                                setError(
                                  '',
                                )

                                setDownloadSuccess(
                                  '',
                                )
                              }}
                              className={`
                                rounded-xl
                                border
                                px-4 py-2.5
                                text-sm
                                font-medium
                                transition
                                disabled:cursor-not-allowed
                                ${
                                  selected
                                    ? `
                                      border-[var(--primary)]
                                      bg-[var(--primary-soft)]
                                      text-[var(--primary-text)]
                                    `
                                    : `
                                      border-[var(--border)]
                                      text-[var(--text-secondary)]
                                      hover:border-[var(--primary-border)]
                                      hover:text-[var(--text-primary)]
                                    `
                                }
                              `}
                            >
                              {
                                quality
                              }
                              p
                            </button>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <p
                      className="
                        mt-3 text-sm
                        text-[var(--text-muted)]
                      "
                    >
                      No supported video
                      quality was found.
                    </p>
                  )}

                  <p
                    className="
                      mt-3 text-xs
                      leading-5
                      text-[var(--text-muted)]
                    "
                  >
                    Higher resolutions may
                    take longer because video
                    and audio can be merged
                    locally with FFmpeg.
                  </p>
                </motion.div>
              )}


              {/* AUDIO FORMAT */}

              {downloadMode ===
                'audio' && (
                <motion.div
                  key="audio-options"
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-6"
                >
                  <p
                    className="
                      text-sm font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    Audio format
                  </p>

                  <div
                    className="
                      mt-3 grid
                      grid-cols-2 gap-2
                    "
                  >
                    {(
                      [
                        'mp3',
                        'm4a',
                      ] as const
                    ).map(
                      (format) => {
                        const selected =
                          audioFormat ===
                          format

                        return (
                          <button
                            key={
                              format
                            }
                            type="button"
                            disabled={
                              isPreparingDownload
                            }
                            onClick={() => {
                              setAudioFormat(
                                format,
                              )

                              setError(
                                '',
                              )

                              setDownloadSuccess(
                                '',
                              )
                            }}
                            className={`
                              flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              border
                              px-4 py-3
                              text-sm
                              font-medium
                              uppercase
                              transition
                              disabled:cursor-not-allowed
                              ${
                                selected
                                  ? `
                                    border-[var(--primary)]
                                    bg-[var(--primary-soft)]
                                    text-[var(--primary-text)]
                                  `
                                  : `
                                    border-[var(--border)]
                                    text-[var(--text-secondary)]
                                    hover:border-[var(--primary-border)]
                                    hover:text-[var(--text-primary)]
                                  `
                              }
                            `}
                          >
                            <FileAudio
                              size={
                                16
                              }
                            />

                            {
                              format
                            }
                          </button>
                        )
                      },
                    )}
                  </div>
                </motion.div>
              )}


              {/* DOWNLOAD BUTTON */}

              <motion.button
                type="button"
                onClick={() => {
                  void handleDownload()
                }}
                disabled={
                  isPreparingDownload ||
                  status !==
                    'connected' ||
                  (
                    downloadMode ===
                      'video' &&
                    selectedQuality ===
                      null
                  )
                }
                whileTap={
                  !isPreparingDownload &&
                  status ===
                    'connected'
                    ? {
                        scale: 0.98,
                      }
                    : undefined
                }
                className={`
                  mt-6 flex w-full
                  items-center
                  justify-center gap-2
                  rounded-xl
                  px-5 py-3.5
                  text-sm font-semibold
                  transition
                  ${
                    isPreparingDownload
                      ? `
                        cursor-wait
                        bg-[var(--primary)]
                        text-slate-950
                      `
                      : `
                        bg-[var(--primary)]
                        text-slate-950
                        hover:bg-[var(--primary-hover)]
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      `
                  }
                `}
              >
                {isPreparingDownload ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />

                    Preparing
                    download...
                  </>
                ) : (
                  <>
                    <Download
                      size={18}
                    />

                    {downloadMode ===
                    'video'
                      ? selectedQuality
                        ? `Download ${selectedQuality}p`
                        : 'Download Video'
                      : `Download ${audioFormat.toUpperCase()}`}
                  </>
                )}
              </motion.button>


              {/* PREPARING INFO */}

              {isPreparingDownload && (
                <p
                  className="
                    mt-3 text-center
                    text-xs leading-5
                    text-[var(--text-muted)]
                  "
                >
                  Keep this page open.
                  AP Tools is preparing
                  the file locally.
                </p>
              )}


              {/* SUCCESS */}

              {downloadSuccess && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    mt-4 flex
                    items-start gap-3
                    rounded-xl
                    border
                    border-green-500/20
                    bg-green-500/5
                    p-4
                  "
                >
                  <div
                    className="
                      mt-0.5 flex
                      h-7 w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-green-500/10
                      text-green-500
                    "
                  >
                    <Check
                      size={15}
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-sm
                        font-medium
                        text-[var(--text-primary)]
                      "
                    >
                      Download ready
                    </p>

                    <p
                      className="
                        mt-1 break-words
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      {
                        downloadSuccess
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </motion.div>
    </main>
  )
}