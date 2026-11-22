import { createBrowserRouter } from 'react-router'

import AppLayout from '../components/layout/AppLayout'
import AppError from '../pages/AppError'
import Home from '../pages/Home'

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
          const { default: Component } = await import('../pages/AllTools')
          return { Component }
        },
      },
      {
        path: '/tools/ktp-watermark',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/KtpWatermark'
          )
          return { Component }
        },
      },
      {
        path: '/tools/image-to-pdf',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/ImageToPdf'
          )
          return { Component }
        },
      },
      {
        path: '/tools/image-compressor',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/ImageCompressor'
          )
          return { Component }
        },
      },
      {
        path: '/tools/remove-background',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/RemoveBackground'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pas-foto',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PasFoto'
          )
          return { Component }
        },
      },
      {
        path: '/tools/image-privacy',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/ImagePrivacy'
          )
          return { Component }
        },
      },
      {
        path: '/tools/image-stitcher',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/ImageStitcher'
          )
          return { Component }
        },
      },
      {
        path: '/tools/aspect-cropper',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/AspectCropper'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pdf-merge',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PdfMerge'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pdf-split',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PdfSplit'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pdf-organizer',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PdfOrganizer'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pdf-sign',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PdfSign'
          )
          return { Component }
        },
      },
      {
        path: '/tools/pdf-compressor',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/PdfCompressor'
          )
          return { Component }
        },
      },
      {
        path: '/tools/cv-maker',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/CvMaker'
          )
          return { Component }
        },
      },
      {
        path: '/tools/letter-generator',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/LetterGenerator'
          )
          return { Component }
        },
      },
      {
        path: '/tools/invoice-generator',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/InvoiceGenerator'
          )
          return { Component }
        },
      },
      {
        path: '/tools/text-utilities',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/TextUtilities'
          )
          return { Component }
        },
      },
      {
        path: '/tools/wifi-qr',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/WifiQr'
          )
          return { Component }
        },
      },
      {
        path: '/tools/qr-generator',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/QrGenerator'
          )
          return { Component }
        },
      },
      {
        path: '/tools/qr-scanner',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/QrScanner'
          )
          return { Component }
        },
      },
      {
        path: '/tools/whatsapp-link',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/WhatsAppLink'
          )
          return { Component }
        },
      },
      {
        path: '/tools/clean-url',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/CleanUrl'
          )
          return { Component }
        },
      },
      {
        path: '/tools/youtube-downloader',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/YouTubeDownloader'
          )
          return { Component }
        },
      },
      {
        path: '/tools/media-converter',
        lazy: async () => {
          const { default: Component } = await import(
            '../pages/tools/MediaConverter'
          )
          return { Component }
        },
      },
      {
        path: '/feedback',
        lazy: async () => {
          const { default: Component } = await import('../pages/Feedback')
          return { Component }
        },
      },
      {
        path: '/about',
        lazy: async () => {
          const { default: Component } = await import('../pages/About')
          return { Component }
        },
      },
      {
        path: '/privacy',
        lazy: async () => {
          const { default: Component } = await import('../pages/Privacy')
          return { Component }
        },
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const { default: Component } = await import('../pages/NotFound')
      return { Component }
    },
  },
])