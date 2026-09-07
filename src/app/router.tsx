import { createBrowserRouter } from 'react-router'

import AppLayout from '../components/layout/AppLayout'
import Home from '../pages/Home'
import AppError from '../pages/AppError'

export const router = createBrowserRouter([
  {
    Component: AppLayout,

    ErrorBoundary: AppError,

    children: [
      {
        path: '/',
        Component: Home,
      },

      {
        path: '/tools',
        lazy: async () => {
          const { default: Component } =
            await import('../pages/AllTools')

          return { Component }
        },
      },

      {
        path: '/tools/image-to-pdf',
        lazy: async () => {
          const { default: Component } =
            await import(
              '../pages/tools/ImageToPdf'
            )

          return { Component }
        },
      },

      {
        path: '/tools/image-compressor',
        lazy: async () => {
          const { default: Component } =
            await import(
              '../pages/tools/ImageCompressor'
            )

          return { Component }
        },
      },

      {
        path: '/tools/qr-generator',
        lazy: async () => {
          const { default: Component } =
            await import(
              '../pages/tools/QrGenerator'
            )

          return { Component }
        },
      },

      {
        path: '/tools/whatsapp-link',
        lazy: async () => {
          const { default: Component } =
            await import(
              '../pages/tools/WhatsAppLink'
            )

          return { Component }
        },
      },

      {
        path: '/tools/youtube-downloader',
        lazy: async () => {
          const { default: Component } =
            await import(
              '../pages/tools/YouTubeDownloader'
            )

          return { Component }
        },
      },

      {
        path: '/tools/remove-background',
        lazy: async () => {
          const { default: Component } = 
            await import(
            '../pages/tools/RemoveBackground'
            )

          return { Component }
        },
      },

      {
        path: '/tools/pdf-merge',

        lazy: async () => {
          const {
            default: Component,
          } = await import(
            '../pages/tools/PdfMerge'
          )

          return {
            Component,
          }
        },
      },
      {
        path: '/tools/pdf-split',

        lazy: async () => {
          const {
            default: Component,
          } = await import(
            '../pages/tools/PdfSplit'
          )

          return {
            Component,
          }
        },
      },

      {
        path: '/about',
        lazy: async () => {
          const { default: Component } =
            await import('../pages/About')

          return { Component }
        },
      },

      {
        path: '/privacy',
        lazy: async () => {
          const { default: Component } =
            await import('../pages/Privacy')

          return { Component }
        },
      },
    ],
  },
  {
  path: '*',

  lazy: async () => {
    const {
      default: Component,
    } = await import(
      '../pages/NotFound'
    )

    return {
      Component,
    }
  },
},
])