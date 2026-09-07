import {
  PDFDocument,
} from 'pdf-lib'


export interface PdfSplitInfo {
  file: File

  pageCount: number
}


export interface ParsedPageSelection {
  pageNumbers: number[]

  normalized: string
}


function isPdfFile(
  file: File,
) {
  return (
    file.type ===
      'application/pdf' ||
    file.name
      .toLowerCase()
      .endsWith('.pdf')
  )
}


export async function readPdfSplitInfo(
  file: File,
): Promise<PdfSplitInfo> {
  if (!isPdfFile(file)) {
    throw new Error(
      `${file.name} is not a PDF file.`,
    )
  }

  try {
    const bytes =
      await file.arrayBuffer()

    const document =
      await PDFDocument.load(
        bytes,
        {
          updateMetadata:
            false,
        },
      )

    return {
      file,

      pageCount:
        document.getPageCount(),
    }
  } catch {
    throw new Error(
      `Unable to read "${file.name}". The PDF may be damaged or protected.`,
    )
  }
}


export function parsePageSelection(
  input: string,
  pageCount: number,
): ParsedPageSelection {
  const cleaned =
    input
      .trim()
      .replace(/\s+/g, '')


  if (!cleaned) {
    throw new Error(
      'Enter at least one page or page range.',
    )
  }


  const parts =
    cleaned.split(',')


  const selectedPages =
    new Set<number>()


  for (
    const part
    of parts
  ) {
    if (!part) {
      throw new Error(
        'The page selection contains an empty value.',
      )
    }


    /*
     * Single page:
     *
     * 7
     */

    if (
      /^\d+$/.test(
        part,
      )
    ) {
      const page =
        Number(part)

      if (
        page < 1 ||
        page > pageCount
      ) {
        throw new Error(
          `Page ${page} is outside the document. This PDF has ${pageCount} pages.`,
        )
      }

      selectedPages.add(
        page,
      )

      continue
    }


    /*
     * Range:
     *
     * 1-3
     */

    const rangeMatch =
      part.match(
        /^(\d+)-(\d+)$/,
      )


    if (!rangeMatch) {
      throw new Error(
        `"${part}" is not a valid page or range.`,
      )
    }


    const start =
      Number(
        rangeMatch[1],
      )

    const end =
      Number(
        rangeMatch[2],
      )


    if (
      start < 1 ||
      end < 1 ||
      start > pageCount ||
      end > pageCount
    ) {
      throw new Error(
        `Range ${start}-${end} is outside the document. This PDF has ${pageCount} pages.`,
      )
    }


    if (
      start > end
    ) {
      throw new Error(
        `Range ${start}-${end} is reversed. Use ${end}-${start} instead.`,
      )
    }


    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      selectedPages.add(
        page,
      )
    }
  }


  const pageNumbers =
    Array.from(
      selectedPages,
    ).sort(
      (
        a,
        b,
      ) =>
        a - b,
    )


  if (
    pageNumbers.length ===
    0
  ) {
    throw new Error(
      'No pages were selected.',
    )
  }


  return {
    pageNumbers,

    normalized:
      pageNumbers.join(', '),
  }
}


export async function splitPdfPages(
  file: File,
  pageNumbers: number[],
): Promise<Blob> {
  if (!isPdfFile(file)) {
    throw new Error(
      `${file.name} is not a PDF file.`,
    )
  }


  if (
    pageNumbers.length ===
    0
  ) {
    throw new Error(
      'Select at least one page.',
    )
  }


  try {
    const bytes =
      await file.arrayBuffer()


    const sourceDocument =
      await PDFDocument.load(
        bytes,
        {
          updateMetadata:
            false,
        },
      )


    const pageCount =
      sourceDocument
        .getPageCount()


    const uniquePages =
      Array.from(
        new Set(
          pageNumbers,
        ),
      )


    for (
      const page
      of uniquePages
    ) {
      if (
        page < 1 ||
        page > pageCount
      ) {
        throw new Error(
          `Page ${page} does not exist in this PDF.`,
        )
      }
    }


    const outputDocument =
      await PDFDocument.create()


    /*
     * pdf-lib uses zero-based
     * page indexes.
     *
     * User:
     * 1, 3, 5
     *
     * pdf-lib:
     * 0, 2, 4
     */

    const sourceIndices =
      uniquePages.map(
        page =>
          page - 1,
      )


    const copiedPages =
      await outputDocument
        .copyPages(
          sourceDocument,
          sourceIndices,
        )


    for (
      const page
      of copiedPages
    ) {
      outputDocument.addPage(
        page,
      )
    }


    outputDocument.setTitle(
      'Extracted PDF',
    )

    outputDocument.setCreator(
      'AP Tools',
    )

    outputDocument.setProducer(
      'AP Tools',
    )


    const outputBytes =
      await outputDocument.save()


    const output =
      new Uint8Array(
        outputBytes,
      )


    return new Blob(
      [output],
      {
        type:
          'application/pdf',
      },
    )
  } catch (
    error
  ) {
    if (
      error instanceof Error &&
      error.message.startsWith(
        'Page ',
      )
    ) {
      throw error
    }

    throw new Error(
      `Unable to extract pages from "${file.name}". The PDF may be damaged or protected.`,
    )
  }
}