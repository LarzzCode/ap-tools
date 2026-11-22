import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
} from 'pdf-lib'

export type InvoiceDocKind = 'invoice' | 'receipt'
export type InvoiceCurrency = 'IDR' | 'USD'
export type InvoiceStamp = 'none' | 'paid' | 'unpaid'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoicePayload {
  kind: InvoiceDocKind
  currency: InvoiceCurrency
  stamp: InvoiceStamp
  docNumber: string
  issueDate: string
  dueDate: string
  senderName: string
  senderContact: string
  clientName: string
  clientContact: string
  items: InvoiceLineItem[]
  discountAmount: number
  taxPercent: number
  notes: string
}

export function formatMoney(
  amount: number,
  currency: InvoiceCurrency,
): string {
  const safe = Number.isFinite(amount) ? amount : 0
  if (currency === 'IDR') {
    return `Rp ${Math.round(safe).toLocaleString('id-ID')}`
  }
  return `$${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  discountAmount: number,
  taxPercent: number,
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
    0,
  )
  const cleanDiscount = Math.max(0, Math.min(subtotal, discountAmount || 0))
  const afterDiscount = subtotal - cleanDiscount
  const taxAmount = (afterDiscount * Math.max(0, taxPercent || 0)) / 100
  const grandTotal = afterDiscount + taxAmount

  return {
    subtotal,
    discount: cleanDiscount,
    taxAmount,
    grandTotal,
  }
}

export async function generateInvoicePdf(
  payload: InvoicePayload,
): Promise<Blob> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4 Portrait
  const { width, height } = page.getSize()

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const primaryColor = rgb(0, 0.48, 1) // iOS Blue #007AFF
  const darkText = rgb(0.11, 0.11, 0.12)
  const mutedText = rgb(0.45, 0.45, 0.48)
  const lightFill = rgb(0.95, 0.95, 0.97)

  const margin = 48
  let cursorY = height - margin

  // Top Header Title
  const docTitle =
    payload.kind === 'invoice' ? 'INVOICE' : 'KWITANSI / RECEIPT'

  page.drawText(docTitle, {
    x: margin,
    y: cursorY - 24,
    size: 24,
    font: fontBold,
    color: primaryColor,
  })

  page.drawText(`No: ${payload.docNumber || 'INV-001'}`, {
    x: margin,
    y: cursorY - 44,
    size: 10,
    font: fontBold,
    color: darkText,
  })

  // Dates on Top Right
  const dateLabel = `Tanggal: ${payload.issueDate || '-'}`
  const dateW = fontRegular.widthOfTextAtSize(dateLabel, 10)
  page.drawText(dateLabel, {
    x: width - margin - dateW,
    y: cursorY - 18,
    size: 10,
    font: fontRegular,
    color: mutedText,
  })

  if (payload.kind === 'invoice' && payload.dueDate) {
    const dueLabel = `Jatuh Tempo: ${payload.dueDate}`
    const dueW = fontRegular.widthOfTextAtSize(dueLabel, 10)
    page.drawText(dueLabel, {
      x: width - margin - dueW,
      y: cursorY - 34,
      size: 10,
      font: fontRegular,
      color: mutedText,
    })
  }

  cursorY -= 76

  // Sender & Client Columns
  page.drawText('DARI / FROM:', {
    x: margin,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: mutedText,
  })
  page.drawText(payload.senderName || 'Nama Usaha / Pengirim', {
    x: margin,
    y: cursorY - 16,
    size: 12,
    font: fontBold,
    color: darkText,
  })
  if (payload.senderContact) {
    page.drawText(payload.senderContact.slice(0, 60), {
      x: margin,
      y: cursorY - 32,
      size: 9.5,
      font: fontRegular,
      color: mutedText,
    })
  }

  const col2X = width / 2 + 12
  page.drawText('KEPADA / BILL TO:', {
    x: col2X,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: mutedText,
  })
  page.drawText(payload.clientName || 'Nama Klien / Pelanggan', {
    x: col2X,
    y: cursorY - 16,
    size: 12,
    font: fontBold,
    color: darkText,
  })
  if (payload.clientContact) {
    page.drawText(payload.clientContact.slice(0, 60), {
      x: col2X,
      y: cursorY - 32,
      size: 9.5,
      font: fontRegular,
      color: mutedText,
    })
  }

  cursorY -= 64

  // Table Header
  const tableWidth = width - margin * 2
  page.drawRectangle({
    x: margin,
    y: cursorY - 24,
    width: tableWidth,
    height: 26,
    color: lightFill,
  })

  page.drawText('DESKRIPSI ITEM', {
    x: margin + 12,
    y: cursorY - 15,
    size: 9,
    font: fontBold,
    color: darkText,
  })
  page.drawText('QTY', {
    x: margin + 280,
    y: cursorY - 15,
    size: 9,
    font: fontBold,
    color: darkText,
  })
  page.drawText('HARGA SATUAN', {
    x: margin + 335,
    y: cursorY - 15,
    size: 9,
    font: fontBold,
    color: darkText,
  })
  page.drawText('JUMLAH', {
    x: width - margin - 65,
    y: cursorY - 15,
    size: 9,
    font: fontBold,
    color: darkText,
  })

  cursorY -= 26

  // Line Items
  for (const item of payload.items) {
    if (cursorY < 180) break
    cursorY -= 24

    const desc = (item.description || 'Item').slice(0, 52)
    const qty = Math.max(0, item.quantity)
    const price = Math.max(0, item.unitPrice)
    const lineTotal = qty * price

    page.drawText(desc, {
      x: margin + 12,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: darkText,
    })
    page.drawText(String(qty), {
      x: margin + 285,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: darkText,
    })
    page.drawText(formatMoney(price, payload.currency), {
      x: margin + 335,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: mutedText,
    })

    const lineTotalStr = formatMoney(lineTotal, payload.currency)
    const lineTotalW = fontBold.widthOfTextAtSize(lineTotalStr, 10)
    page.drawText(lineTotalStr, {
      x: width - margin - 12 - lineTotalW,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: darkText,
    })

    page.drawLine({
      start: { x: margin, y: cursorY - 8 },
      end: { x: width - margin, y: cursorY - 8 },
      thickness: 0.6,
      color: rgb(0.9, 0.9, 0.92),
    })
  }

  // Totals Summary
  const totals = calculateInvoiceTotals(
    payload.items,
    payload.discountAmount,
    payload.taxPercent,
  )

  cursorY -= 36
  const summaryLabelX = width - margin - 210

  const drawSummaryRow = (
    label: string,
    val: string,
    isGrand = false,
  ) => {
    const f = isGrand ? fontBold : fontRegular
    const sz = isGrand ? 12 : 10
    const col = isGrand ? primaryColor : darkText

    page.drawText(label, {
      x: summaryLabelX,
      y: cursorY,
      size: sz,
      font: f,
      color: isGrand ? darkText : mutedText,
    })

    const valW = f.widthOfTextAtSize(val, sz)
    page.drawText(val, {
      x: width - margin - 12 - valW,
      y: cursorY,
      size: sz,
      font: f,
      color: col,
    })
    cursorY -= isGrand ? 24 : 18
  }

  drawSummaryRow(
    'Subtotal',
    formatMoney(totals.subtotal, payload.currency),
  )
  if (totals.discount > 0) {
    drawSummaryRow(
      'Diskon',
      `- ${formatMoney(totals.discount, payload.currency)}`,
    )
  }
  if (payload.taxPercent > 0) {
    drawSummaryRow(
      `Pajak (${payload.taxPercent}%)`,
      formatMoney(totals.taxAmount, payload.currency),
    )
  }

  cursorY -= 4
  drawSummaryRow(
    'TOTAL AKHIR',
    formatMoney(totals.grandTotal, payload.currency),
    true,
  )

  // Optional Status Stamp (LUNAS / BELUM LUNAS)
  if (payload.stamp !== 'none') {
    const isPaid = payload.stamp === 'paid'
    const stampText = isPaid ? 'LUNAS / PAID' : 'BELUM LUNAS'
    const stampColor = isPaid ? rgb(0.16, 0.72, 0.32) : rgb(0.92, 0.25, 0.2)

    page.drawText(stampText, {
      x: margin + 20,
      y: cursorY + 12,
      size: 22,
      font: fontBold,
      color: stampColor,
      opacity: 0.78,
      rotate: degrees(8),
    })
  }

  // Notes / Payment Instructions
  if (payload.notes.trim()) {
    const notesY = Math.min(cursorY - 24, 180)
    page.drawText('CATATAN & PEMBAYARAN / NOTES:', {
      x: margin,
      y: notesY,
      size: 8.5,
      font: fontBold,
      color: mutedText,
    })

    const noteLines = payload.notes
      .trim()
      .split(/\r?\n/)
      .slice(0, 5)

    noteLines.forEach((line, idx) => {
      page.drawText(line.slice(0, 90), {
        x: margin,
        y: notesY - 16 - idx * 14,
        size: 9.5,
        font: fontRegular,
        color: darkText,
      })
    })
  }

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
