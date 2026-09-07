import type { Tool } from '../types/tool'

export const tools: Tool[] = [
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description:
      'Combine multiple images into a single PDF file.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/image-to-pdf',
    keywords: ['image', 'pdf', 'jpg', 'png', 'convert'],
    featured: true,
  },

  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description:
      'Reduce image file size directly in your browser.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/image-compressor',
    keywords: [
      'image',
      'compress',
      'compression',
      'jpg',
      'png',
      'size',
    ],
    featured: true,
  },

  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description:
      'Create clean QR codes for links and text.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/qr-generator',
    keywords: ['qr', 'qrcode', 'url', 'link', 'text'],
    featured: true,
  },

  {
    id: 'whatsapp-link',
    name: 'WhatsApp Link',
    description:
      'Create WhatsApp links with pre-filled messages.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/whatsapp-link',
    keywords: [
      'whatsapp',
      'wa',
      'message',
      'link',
      'chat',
    ],
    featured: true,
  },

  {
    id: 'youtube-downloader',
    name: 'YouTube Downloader',
    description:
      'Save authorized YouTube media with your local service.',
    category: 'media',
    runtime: 'local-service',
    path: '/tools/youtube-downloader',
    keywords: [
      'youtube',
      'video',
      'audio',
      'download',
      'mp3',
    ],
    featured: true,
  },
  {
    id: 'remove-background',

    name: 'Remove Background',

    description:
      'Remove image backgrounds locally and export transparent or solid-color photos.',

    category: 'image',

    runtime: 'browser',

    path: '/tools/remove-background',

    keywords: [
      'remove background',
      'background',
      'transparent',
      'png',
      'photo',
      'pas foto',
      'red background',
      'blue background',
      'job application',
    ],

    featured: true,
  },
  {
    id: 'pdf-merge',

    name: 'PDF Merge',

    description:
      'Combine multiple PDF files into one document directly in your browser.',

    category: 'pdf',

    runtime: 'browser',

    path: '/tools/pdf-merge',

    keywords: [
      'pdf',
      'merge',
      'combine',
      'join',
      'document',
    ],

    featured: true,
  },
  {
    id: 'pdf-split',

    name: 'PDF Split',

    description:
      'Extract selected pages from a PDF directly in your browser.',

    category: 'pdf',

    runtime: 'browser',

    path: '/tools/pdf-split',

    keywords: [
      'pdf',
      'split',
      'extract',
      'pages',
      'separate',
      'document',
    ],

    featured: true,
  },
]