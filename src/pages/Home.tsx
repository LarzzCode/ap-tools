import { useMemo, useState } from 'react'
import {
  Search,
  SearchX,
  Star,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import ToolGrid from '../components/tools/ToolGrid'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const {
    favoriteIds,
    toggleFavorite,
    isFavorite,
  } = useFavorites()

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return tools
    }

    return tools.filter((tool) => {
      const searchableText = [
        tool.name,
        tool.description,
        tool.category,
        ...tool.keywords,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [searchQuery])

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) =>
      favoriteIds.includes(tool.id),
    )
  }, [favoriteIds])

  const isSearching = searchQuery.trim().length > 0

  return (
    <main>
      <section
        className="
          relative overflow-hidden
          px-4 py-20
          sm:px-6 sm:py-24
          lg:px-8
        "
      >
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="
          pointer-events-none
          absolute left-1/2 top-0
          -z-10
          h-72 w-72
          -translate-x-1/2
          rounded-full
          bg-sky-300/20
          blur-3xl
        "
      />

        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-3xl text-center"
        >
          <div
            className="
              mb-6 inline-flex
              rounded-full
              border border-[var(--primary-border)]
              bg-[var(--primary-soft)]
              px-4 py-2
              text-sm font-medium
              text-[var(--primary-text)]
            "
          >
            No ads. Ever.
          </div>

          <h1
            className="
              text-4xl font-bold tracking-tight
              text-[var(--text-primary)]
              sm:text-5xl
              lg:text-6xl
            "
          >
            Your everyday{' '}
            <span className="text-[var(--primary)]">
              tools.
            </span>
          </h1>

          <p
            className="
              mx-auto mt-6 max-w-xl
              text-base leading-7
              text-[var(--text-secondary)]
              sm:text-lg
            "
          >
            Simple utilities for everyday digital
            tasks. No ads, no clutter, and no
            unnecessary accounts.
          </p>

          <div
            className="
              mx-auto mt-10 flex max-w-2xl
              items-center gap-3
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              px-5 py-4
              shadow-sm
              transition
              focus-within:border-[var(--primary-border)]
              focus-within:ring-4
              focus-within:ring-sky-100/50
              dark:focus-within:ring-sky-900/20
            "
          >
            <Search
              size={20}
              className="
                shrink-0
                text-[var(--text-muted)]
              "
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search tools..."
              aria-label="Search tools"
              className="
                w-full bg-transparent
                text-[var(--text-primary)]
                outline-none
                placeholder:text-[var(--text-muted)]
              "
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="
                  flex h-8 w-8 shrink-0
                  items-center justify-center
                  rounded-lg
                  text-[var(--text-muted)]
                  transition
                  hover:bg-[var(--primary-soft)]
                  hover:text-[var(--primary-text)]
                "
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div
            className="
              mt-5 flex flex-wrap
              items-center justify-center
              gap-x-5 gap-y-2
              text-sm
              text-[var(--text-muted)]
            "
          >
            <span>Private by design</span>
            <span>•</span>
            <span>Fast</span>
            <span>•</span>
            <span>No account required</span>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {!isSearching && favoriteTools.length > 0 && (
          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              mx-auto max-w-7xl
              px-4 pb-14
              sm:px-6
              lg:px-8
            "
          >
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Star
                size={18}
                fill="currentColor"
                className="text-[var(--primary)]"
              />

              <h2
                className="
                  text-xl font-semibold tracking-tight
                  text-[var(--text-primary)]
                "
              >
                Favorites
              </h2>
            </div>

            <p
              className="
                mt-2 text-sm
                text-[var(--text-secondary)]
              "
            >
              Your most-used tools, ready when you
              need them.
            </p>
          </div>

          <ToolGrid
            tools={favoriteTools}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
            </motion.section>
          )}
        </AnimatePresence>

      <section
        className="
          mx-auto max-w-7xl
          px-4 pb-20
          sm:px-6
          lg:px-8
        "
      >
        <div className="mb-8">
          <p
            className="
              text-sm font-medium
              text-[var(--primary-text)]
            "
          >
            {isSearching ? 'SEARCH RESULTS' : 'TOOLBOX'}
          </p>

          <h2
            className="
              mt-2
              text-2xl font-semibold tracking-tight
              text-[var(--text-primary)]
              sm:text-3xl
            "
          >
            {isSearching
              ? `Results for "${searchQuery}"`
              : 'Pick a tool and get it done.'}
          </h2>

          <p
            className="
              mt-2 text-sm
              text-[var(--text-secondary)]
            "
          >
            {isSearching
              ? `${filteredTools.length} ${
                  filteredTools.length === 1
                    ? 'tool'
                    : 'tools'
                } found.`
              : 'Six tools to start. More will come when they’re actually useful.'}
          </p>
        </div>

        {filteredTools.length > 0 ? (
          <ToolGrid
            tools={filteredTools}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div
            className="
              rounded-2xl
              border border-dashed
              border-[var(--border)]
              bg-[var(--surface)]
              px-6 py-16
              text-center
            "
          >
            <div
              className="
                mx-auto flex h-12 w-12
                items-center justify-center
                rounded-xl
                bg-[var(--primary-soft)]
                text-[var(--primary-text)]
              "
            >
              <SearchX size={22} />
            </div>

            <h3
              className="
                mt-4 text-base font-semibold
                text-[var(--text-primary)]
              "
            >
              No tools found
            </h3>

            <p
              className="
                mx-auto mt-2 max-w-sm
                text-sm leading-6
                text-[var(--text-secondary)]
              "
            >
              We couldn't find a tool matching
              {' '}
              <strong>"{searchQuery}"</strong>.
              Try another keyword.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}