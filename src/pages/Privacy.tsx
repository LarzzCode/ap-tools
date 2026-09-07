import {
  BarChart3,
  CloudDownload,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'

import {
  motion,
} from 'motion/react'


const sections = [
  {
    icon: HardDrive,

    title: 'Local file processing',

    content: (
      <>
        <p>
          Most AP Tools utilities process
          your files directly inside your
          browser whenever possible.
        </p>

        <p className="mt-3">
          This includes tools such as Image
          Compressor, Image to PDF, PDF Merge,
          and PDF Split. Your selected images
          and PDF files are not uploaded to an
          AP Tools server for these operations.
        </p>
      </>
    ),
  },

  {
    icon: ShieldCheck,

    title: 'Remove Background',

    content: (
      <>
        <p>
          Remove Background performs AI
          processing on your device. Your
          selected image is processed locally
          and is not uploaded to AP Tools.
        </p>

        <p className="mt-3">
          The AI models and required runtime
          files may be downloaded from their
          model hosting providers when needed.
          Once available, your browser may cache
          these files to make future processing
          faster.
        </p>
      </>
    ),
  },

  {
    icon: CloudDownload,

    title: 'Media tools and Local Service',

    content: (
      <>
        <p>
          Some media features require AP Tools
          Local Service running on your own
          computer.
        </p>

        <p className="mt-3">
          When you use these features, the URL
          you provide is sent to your local
          service. The local service may then
          communicate with the relevant media
          platform to analyze or save media that
          you own or have permission to download.
        </p>

        <p className="mt-3">
          AP Tools does not use its hosted
          frontend as a storage server for the
          downloaded media.
        </p>
      </>
    ),
  },

  {
    icon: BarChart3,

    title: 'Website analytics',

    content: (
      <>
        <p>
          AP Tools may use privacy-focused web
          analytics provided by Vercel to
          understand general website usage.
        </p>

        <p className="mt-3">
          This can include information such as
          page visits, referral sources, browser
          or device categories, and approximate
          geographic information.
        </p>

        <p className="mt-3">
          Analytics data is used to understand
          which tools are useful and to improve
          the website. Files you select for local
          processing are not sent to analytics
          as part of their file contents.
        </p>
      </>
    ),
  },

  {
    icon: LockKeyhole,

    title: 'Accounts and personal information',

    content: (
      <>
        <p>
          AP Tools does not require you to create
          an account to use its current tools.
        </p>

        <p className="mt-3">
          AP Tools does not intentionally ask for
          your name, email address, password, or
          other account information simply to use
          the utilities available on this site.
        </p>
      </>
    ),
  },
]


export default function Privacy() {
  return (
    <main
      className="
        mx-auto
        max-w-4xl
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
            max-w-2xl
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
            <ShieldCheck
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
            Privacy
          </h1>

          <p
            className="
              mt-4
              text-base
              leading-7
              text-[var(--text-secondary)]
            "
          >
            AP Tools is designed around a simple
            principle: process as much as possible
            on your own device and collect only
            what is useful for operating and
            improving the website.
          </p>

          <p
            className="
              mt-3
              text-sm
              text-[var(--text-muted)]
            "
          >
            Last updated: September 7, 2026
          </p>
        </section>


        {/* HIGHLIGHT */}

        <section
          className="
            mt-10
            rounded-2xl
            border
            border-[var(--primary-border)]
            bg-[var(--primary-soft)]
            p-5
            sm:p-6
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
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--surface)]
                text-[var(--primary-text)]
              "
            >
              <LockKeyhole
                size={18}
              />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-[var(--text-primary)]
                "
              >
                Files first, privacy first
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-[var(--text-secondary)]
                "
              >
                Browser-based image and PDF tools
                are intentionally designed so your
                working files stay on your device
                instead of being uploaded to an AP
                Tools processing server.
              </p>
            </div>
          </div>
        </section>


        {/* DETAILS */}

        <div
          className="
            mt-8
            space-y-4
          "
        >
          {sections.map(
            (
              section,
              index,
            ) => {
              const Icon =
                section.icon

              return (
                <motion.section
                  key={
                    section.title
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
                      items-start
                      gap-4
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
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

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <h2
                        className="
                          text-base
                          font-semibold
                          text-[var(--text-primary)]
                        "
                      >
                        {
                          section.title
                        }
                      </h2>

                      <div
                        className="
                          mt-3
                          text-sm
                          leading-6
                          text-[var(--text-secondary)]
                        "
                      >
                        {
                          section.content
                        }
                      </div>
                    </div>
                  </div>
                </motion.section>
              )
            },
          )}
        </div>


        {/* STORAGE */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-5
            sm:p-6
          "
        >
          <h2
            className="
              text-base
              font-semibold
              text-[var(--text-primary)]
            "
          >
            Local preferences
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[var(--text-secondary)]
            "
          >
            AP Tools may store small preferences
            in your browser, such as your selected
            theme or favorite tools. These settings
            help preserve your experience between
            visits.
          </p>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[var(--text-secondary)]
            "
          >
            Clearing your browser storage may reset
            these preferences.
          </p>
        </section>


        {/* RESPONSIBILITY */}

        <section
          className="
            mt-8
            border-t
            border-[var(--border)]
            pt-8
          "
        >
          <h2
            className="
              text-base
              font-semibold
              text-[var(--text-primary)]
            "
          >
            Your responsibility
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[var(--text-secondary)]
            "
          >
            You are responsible for ensuring that
            you have the appropriate rights or
            permission to process, convert, save,
            or download the files and media you use
            with AP Tools.
          </p>
        </section>


        {/* CHANGES */}

        <section
          className="
            mt-8
            border-t
            border-[var(--border)]
            pt-8
          "
        >
          <h2
            className="
              text-base
              font-semibold
              text-[var(--text-primary)]
            "
          >
            Changes to this notice
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[var(--text-secondary)]
            "
          >
            This privacy notice may be updated as
            AP Tools adds new features, services,
            or integrations. The date shown at the
            top of this page indicates the latest
            revision.
          </p>
        </section>
      </motion.div>
    </main>
  )
}