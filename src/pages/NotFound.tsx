import {
  ArrowLeft,
  Home,
  SearchX,
} from 'lucide-react'

import {
  motion,
} from 'motion/react'

import {
  Link,
} from 'react-router'


export default function NotFound() {
  return (
    <main
      className="
        mx-auto
        flex
        min-h-[70vh]
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
            border-[var(--border)]
            bg-[var(--surface)]
            text-[var(--primary-text)]
          "
        >
          <SearchX
            size={28}
          />
        </div>


        <p
          className="
            mt-6
            text-sm
            font-semibold
            text-[var(--primary-text)]
          "
        >
          404
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
          Tool not found
        </h1>


        <p
          className="
            mt-4
            text-base
            leading-7
            text-[var(--text-secondary)]
          "
        >
          The page you're looking
          for doesn't exist, may
          have moved, or is no
          longer available.
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
          <Link
            to="/"
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
            <Home
              size={17}
            />

            Back to Home
          </Link>


          <Link
            to="/tools"
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
            <ArrowLeft
              size={17}
            />

            Browse Tools
          </Link>
        </div>
      </motion.div>
    </main>
  )
}