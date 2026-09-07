import {
  Cpu,
  Gauge,
  HardDrive,
  Heart,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'

import {
  motion,
} from 'motion/react'


const principles = [
  {
    icon: Zap,

    title: 'Open. Use. Done.',

    description:
      'Ditya Tools is built for quick tasks without unnecessary steps, accounts, or clutter.',
  },

  {
    icon: ShieldCheck,

    title: 'Privacy first',

    description:
      'Image and PDF utilities process files locally in your browser whenever possible.',
  },

  {
    icon: Gauge,

    title: 'Fast by default',

    description:
      'Tools are designed to load only what they need. Heavy features are lazy-loaded when possible.',
  },

  {
    icon: Wrench,

    title: 'Useful over flashy',

    description:
      'Every tool should solve a real problem instead of existing only to make the feature list longer.',
  },
]


export default function About() {
  return (
    <main
      className="
        mx-auto
        max-w-5xl
        px-4
        py-12
        sm:px-6
        sm:py-16
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
        {/* HERO */}

        <section
          className="
            max-w-3xl
          "
        >
          <div
            className="
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
            <Sparkles
              size={23}
            />
          </div>


          <h1
            className="
              mt-6
              text-3xl
              font-bold
              tracking-tight
              text-[var(--text-primary)]
              sm:text-4xl
            "
          >
            About Ditya Tools
          </h1>


          <p
            className="
              mt-4
              max-w-2xl
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            Ditya Tools is a collection
            of focused utilities for
            everyday image, PDF,
            media, and productivity
            tasks.
          </p>


          <p
            className="
              mt-3
              max-w-2xl
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            The goal is simple:
            remove unnecessary
            friction and make each
            tool useful from the
            moment you open it.
          </p>


          <div
            className="
              mt-6
              inline-flex
              items-center
              rounded-full
              border
              border-[var(--primary-border)]
              bg-[var(--primary-soft)]
              px-4
              py-2
              text-sm
              font-medium
              text-[var(--primary-text)]
            "
          >
            No ads. No clutter.
            Just tools.
          </div>
        </section>


        {/* PRINCIPLES */}

        <section
          className="
            mt-12
          "
        >
          <h2
            className="
              text-xl
              font-bold
              tracking-tight
              text-[var(--text-primary)]
            "
          >
            Built around a few
            simple principles
          </h2>


          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            {principles.map(
              (
                principle,
                index,
              ) => {
                const Icon =
                  principle.icon

                return (
                  <motion.article
                    key={
                      principle.title
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.04 *
                        index,

                      duration:
                        0.3,
                    }}
                    className="
                      rounded-2xl
                      border
                      border-[var(--border)]
                      bg-[var(--surface)]
                      p-5
                      sm:p-6
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-[var(--surface-soft)]
                        text-[var(--primary-text)]
                      "
                    >
                      <Icon
                        size={19}
                      />
                    </div>


                    <h3
                      className="
                        mt-4
                        text-base
                        font-semibold
                        text-[var(--text-primary)]
                      "
                    >
                      {
                        principle.title
                      }
                    </h3>


                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-[var(--text-secondary)]
                      "
                    >
                      {
                        principle.description
                      }
                    </p>
                  </motion.article>
                )
              },
            )}
          </div>
        </section>


        {/* HOW IT WORKS */}

        <section
          className="
            mt-12
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-5
            sm:p-7
          "
        >
          <div
            className="
              flex
              items-start
              gap-4
            "
          >
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
              <HardDrive
                size={20}
              />
            </div>


            <div>
              <h2
                className="
                  text-lg
                  font-semibold
                  text-[var(--text-primary)]
                "
              >
                Browser-first processing
              </h2>


              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-secondary)]
                "
              >
                Many Ditya Tools features,
                including image utilities
                and PDF tools, perform
                their work directly in
                your browser. This keeps
                the workflow fast and
                avoids uploading your
                working files to an Ditya
                Tools processing server.
              </p>
            </div>
          </div>


          <div
            className="
              mt-6
              flex
              items-start
              gap-4
              border-t
              border-[var(--border)]
              pt-6
            "
          >
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
              <Cpu
                size={20}
              />
            </div>


            <div>
              <h2
                className="
                  text-lg
                  font-semibold
                  text-[var(--text-primary)]
                "
              >
                Local Service when needed
              </h2>


              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-secondary)]
                "
              >
                Features that need
                capabilities unavailable
                inside a normal browser
                can use Ditya Tools Local
                Service running on your
                own computer.
              </p>


              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-secondary)]
                "
              >
                This keeps heavier local
                processing separate from
                the hosted website while
                still providing a simple
                interface.
              </p>
            </div>
          </div>
        </section>


        {/* CURRENT TOOLKIT */}

        <section
          className="
            mt-12
          "
        >
          <h2
            className="
              text-xl
              font-bold
              tracking-tight
              text-[var(--text-primary)]
            "
          >
            Current toolkit
          </h2>


          <p
            className="
              mt-2
              text-sm
              leading-6
              text-[var(--text-secondary)]
            "
          >
            Ditya Tools currently includes
            utilities across quick tasks,
            images, PDFs, and media.
          </p>


          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-[var(--text-muted)]
                "
              >
                Quick
              </p>

              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-primary)]
                "
              >
                QR Generator
                <br />
                WhatsApp Link
              </p>
            </div>


            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-[var(--text-muted)]
                "
              >
                Image
              </p>

              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-primary)]
                "
              >
                Image Compressor
                <br />
                Remove Background
              </p>
            </div>


            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-[var(--text-muted)]
                "
              >
                PDF
              </p>

              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-primary)]
                "
              >
                Image to PDF
                <br />
                PDF Merge
                <br />
                PDF Split
              </p>
            </div>


            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-[var(--text-muted)]
                "
              >
                Media
              </p>

              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-primary)]
                "
              >
                YouTube Media
                Downloader
              </p>
            </div>
          </div>
        </section>


        {/* END */}

        <section
          className="
            mt-12
            border-t
            border-[var(--border)]
            pt-8
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <Heart
              size={18}
              className="
                mt-0.5
                shrink-0
                text-[var(--primary-text)]
              "
            />

            <p
              className="
                text-sm
                leading-6
                text-[var(--text-secondary)]
              "
            >
              Ditya Tools is an evolving
              project. New utilities are
              added when they solve a
              useful problem and fit the
              project's focus on simple,
              practical tools.
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  )
}