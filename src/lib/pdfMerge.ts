import {
  PDFDocument,
} from 'pdf-lib'


export interface PdfFileInfo {
  file: File
  pageCount: number
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


export async function readPdfInfo(
  file: File,
): Promise<PdfFileInfo> {
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


export async function mergePdfFiles(
  files: File[],
): Promise<Blob> {
  if (
    files.length < 2
  ) {
    throw new Error(
      'Please select at least two PDF files.',
    )
  }

  const mergedDocument =
    await PDFDocument.create()

  for (
    const file of files
  ) {
    if (!isPdfFile(file)) {
      throw new Error(
        `${file.name} is not a PDF file.`,
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

      const pageIndices =
        sourceDocument
          .getPageIndices()

      const pages =
        await mergedDocument
          .copyPages(
            sourceDocument,
            pageIndices,
          )

      for (
        const page of pages
      ) {
        mergedDocument.addPage(
          page,
        )
      }
    } catch {
      throw new Error(
        `Unable to merge "${file.name}". The PDF may be damaged or protected.`,
      )
    }
  }

  mergedDocument.setTitle(
    'Merged PDF',
  )

  mergedDocument.setCreator(
    'Ditya Tools',
  )

  mergedDocument.setProducer(
    'Ditya Tools',
  )

  const outputBytes =
    await mergedDocument.save()

  /*
   * Create a fresh ArrayBuffer-backed
   * Uint8Array for Blob compatibility.
   */
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
}