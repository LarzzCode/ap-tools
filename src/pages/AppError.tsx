import {
  AlertTriangle,
  Home,
  RefreshCcw,
} from 'lucide-react'

import {
  motion,
} from 'motion/react'

import {
  Link,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router'


export default function AppError() {
  const error =
    useRouteError()


  let title =
    'Something went wrong'

  let message =
    'Ditya Tools ran into an unexpected problem.'


  if (
    isRouteErrorResponse(
      error,
    )
  ) {
    if (
      error.status === 404
    ) {
      title =
        'Page not found'

      message =
        'The page you requested could not be found.'
    } else {
      title =
        `Error ${error.status}`

      message =
        error.statusText ||
        message
    }
  }


  function handleReload() {
    window.location.reload()
  }


  return (
    <main
      className="
        mx-auto
        flex
        min-h-screen
        max-w-4xl
        items-center
        justify-center
        px-4
        py-16
        sm:px-6
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
        className="
          max-w-lg
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/5
            text-red-500
          "
        >
          <AlertTriangle
            size={28}
          />
        </div>


        <p
          className="
            mt-6
            text-sm
            font-semibold
            text-red-500
          "
        >
          Ditya Tools
        </p>


        <h1
          className="
            mt-2
            text-3xl
            font-bold
            tracking-tight
            text-[var(--text-primary)]
            sm:text-4xl
          "
        >
          {title}
        </h1>


        <p
          className="
            mt-4
            text-base
            leading-7
            text-[var(--text-secondary)]
          "
        >
          {message}
        </p>


        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[var(--text-muted)]
          "
        >
          Your local files have
          not been uploaded because
          of this error.
        </p>


        <div
          className="
            mt-8
            flex
            flex-col
            justify-center
            gap-3
            sm:flex-row
          "
        >
          <button
            type="button"
            onClick={
              handleReload
            }
            className="
              inline-flex
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
            <RefreshCcw
              size={17}
            />

            Try Again
          </button>


          <Link
            to="/"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-5
              py-3
              text-sm
              font-medium
              text-[var(--text-secondary)]
              transition
              hover:border-[var(--primary-border)]
              hover:bg-[var(--primary-soft)]
              hover:text-[var(--text-primary)]
            "
          >
            <Home
              size={17}
            />

            Back to Home
          </Link>
        </div>
      </motion.div>
    </main>
  )
}