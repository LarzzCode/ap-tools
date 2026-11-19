import {
  useEffect,
} from 'react'

import {
  useLocation,
} from 'react-router'


interface PageMeta {
  title: string
  description: string
}


const DEFAULT_META: PageMeta = {
  title:
    'Ditya Tools — Simple Online Utilities',

  description:
    'Ditya Tools is a collection of simple, privacy-focused utilities for images, PDFs, media, QR codes, and everyday tasks.',
}


const PAGE_META:
  Record<string, PageMeta> = {
    '/': DEFAULT_META,

    '/tools': {
      title:
        'All Tools — Ditya Tools',

      description:
        'Browse all utilities available in Ditya Tools.',
    },

    '/tools/image-to-pdf': {
      title:
        'Image to PDF — Ditya Tools',

      description:
        'Convert multiple images into a PDF directly in your browser.',
    },

    '/tools/image-compressor': {
      title:
        'Image Compressor — Ditya Tools',

      description:
        'Compress JPG, PNG, and WebP images directly in your browser.',
    },

    '/tools/qr-generator': {
      title:
        'QR Generator — Ditya Tools',

      description:
        'Generate downloadable QR codes quickly and directly in your browser.',
    },

    '/tools/whatsapp-link': {
      title:
        'WhatsApp Link Generator — Ditya Tools',

      description:
        'Create WhatsApp links and QR codes without saving contacts.',
    },

    '/tools/remove-background': {
      title: 'Remove Background — Ditya Tools',
      description:
        'Remove image backgrounds locally and export transparent or solid-color photos.',
    },

    '/tools/pas-foto': {
      title: 'Pas Foto & Print Sheet — Ditya Tools',
      description:
        'Crop standard 2x3, 3x4, 4x6 cm or visa ID photos and arrange 4R / A4 print sheets.',
    },

    '/tools/image-privacy': {
      title: 'EXIF Stripper & Converter — Ditya Tools',
      description:
        'Inspect and remove EXIF/GPS metadata from images and convert formats locally.',
    },

    '/tools/pdf-merge': {
      title: 'PDF Merge — Ditya Tools',
      description:
        'Combine multiple PDF files into one document directly in your browser.',
    },

    '/tools/pdf-split': {
      title: 'PDF Split — Ditya Tools',
      description:
        'Extract selected pages from a PDF directly in your browser.',
    },

    '/tools/pdf-sign': {
      title: 'PDF Sign & Watermark — Ditya Tools',
      description:
        'Sign PDFs or stamp text watermarks locally in your browser.',
    },

    '/tools/text-utilities': {
      title: 'Text Cleaner & Case Tools — Ditya Tools',
      description:
        'Clean PDF line breaks, transform casing, deduplicate lines, and count words.',
    },

    '/tools/json-diff': {
      title: 'JSON Formatter & Text Diff — Ditya Tools',
      description:
        'Validate and format JSON payloads and compare text differences locally.',
    },

    '/tools/qr-scanner': {
      title: 'QR Code Scanner — Ditya Tools',
      description:
        'Decode QR codes from images or your camera locally in your browser.',
    },

    '/tools/clean-url': {
      title: 'Clean URL Stripper — Ditya Tools',
      description:
        'Remove tracking parameters such as utm_source, fbclid, and igsh from URLs.',
    },

    '/tools/youtube-downloader': {
      title: 'YouTube Media Downloader — Ditya Tools',
      description:
        'Save authorized YouTube media using Ditya Tools Local Service.',
    },

    '/tools/media-converter': {
      title: 'Local Media Clipper & Converter — Ditya Tools',
      description:
        'Trim, compress, and convert local video or audio files via Ditya Tools Local Service.',
    },

    '/privacy': {
      title: 'Privacy — Ditya Tools',
      description:
        'Learn how Ditya Tools handles local file processing, analytics, and privacy.',
    },

    '/about': {
      title: 'About — Ditya Tools',
      description:
        'Learn about Ditya Tools and the principles behind its simple, privacy-focused utilities.',
    },
  }


function updateMetaDescription(
  description: string,
) {
  let element =
    document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )

  if (!element) {
    element =
      document.createElement(
        'meta',
      )

    element.name =
      'description'

    document.head.appendChild(
      element,
    )
  }

  element.content =
    description
}


function updateOpenGraphMeta(
  property: string,
  content: string,
) {
  let element =
    document.querySelector<HTMLMetaElement>(
      `meta[property="${property}"]`,
    )

  if (!element) {
    element =
      document.createElement(
        'meta',
      )

    element.setAttribute(
      'property',
      property,
    )

    document.head.appendChild(
      element,
    )
  }

  element.content =
    content
}


function updateTwitterMeta(
  name: string,
  content: string,
) {
  let element =
    document.querySelector<HTMLMetaElement>(
      `meta[name="${name}"]`,
    )

  if (!element) {
    element =
      document.createElement(
        'meta',
      )

    element.name =
      name

    document.head.appendChild(
      element,
    )
  }

  element.content =
    content
}


export function usePageMeta() {
  const location =
    useLocation()


  useEffect(
    () => {
      const meta =
        PAGE_META[
          location.pathname
        ] ??
        {
          title:
            'Page Not Found — Ditya Tools',

          description:
            'The requested page could not be found on Ditya Tools.',
        }


      document.title =
        meta.title


      updateMetaDescription(
        meta.description,
      )


      updateOpenGraphMeta(
        'og:title',
        meta.title,
      )

      updateOpenGraphMeta(
        'og:description',
        meta.description,
      )


      updateTwitterMeta(
        'twitter:title',
        meta.title,
      )

      updateTwitterMeta(
        'twitter:description',
        meta.description,
      )
    },
    [
      location.pathname,
    ],
  )
}