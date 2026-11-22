import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
} from 'pdf-lib'

export type OfficialLetterKind =
  | 'lamaran'
  | 'resign'
  | 'izin'
  | 'pernyataan'

export interface OfficialLetterTemplateParams {
  kind: OfficialLetterKind
  cityAndDate: string
  subject: string
  recipientName: string
  recipientTitle: string
  recipientCompany: string
  senderName: string
  senderRoleOrInfo: string
  senderContact: string
  targetPositionOrReason: string
  attachmentsList: string
}

export function buildLetterBodyTemplate(
  params: OfficialLetterTemplateParams,
): string {
  switch (params.kind) {
    case 'lamaran':
      return [
        'Dengan hormat,',
        `Berdasarkan informasi lowongan pekerjaan yang saya peroleh, melalui surat ini saya bermaksud mengajukan permohonan untuk bergabung di ${params.recipientCompany || 'perusahaan yang Bapak/Ibu pimpin'} sebagai ${params.targetPositionOrReason || 'posisi yang dibutuhkan'}.`,
        `Saya ${params.senderName || 'Pelamar'}, memiliki latar belakang ${params.senderRoleOrInfo || 'pendidikan dan pengalaman yang relevan'}, mampu bekerja secara mandiri maupun dalam tim, serta berkomitmen tinggi untuk memberikan kontribusi terbaik bagi perusahaan.`,
        params.attachmentsList.trim()
          ? `Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya lampirkan:\n${params.attachmentsList.trim()}`
          : 'Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini turut saya lampirkan Curriculum Vitae (CV) beserta dokumen pendukung lainnya.',
        'Besar harapan saya untuk diberikan kesempatan mengikuti tahapan wawancara agar dapat menjelaskan kualifikasi saya secara lebih mendalam. Atas perhatian dan kesempatan yang Bapak/Ibu berikan, saya ucapkan terima kasih.',
      ].join('\n\n')

    case 'resign':
      return [
        'Dengan hormat,',
        `Melalui surat ini, saya ${params.senderName || 'Karyawan'} selaku ${params.senderRoleOrInfo || 'Staf'} bermaksud untuk mengajukan permohonan pengunduran diri dari ${params.recipientCompany || 'Perusahaan'}, efektif terhitung mulai tanggal ${params.targetPositionOrReason || 'bulan depan'}.`,
        'Saya mengucapkan terima kasih yang sebesar-besarnya atas kesempatan, bimbingan, dan kerja sama yang sangat baik selama saya bekerja di perusahaan ini. Saya juga memohon maaf apabila selama bekerja terdapat kekhilafan.',
        'Saya berkomitmen penuh untuk menyelesaikan tanggung jawab pekerjaan yang sedang berjalan serta melakukan serah terima tugas (handover) dengan baik sebelum hari terakhir saya bekerja.',
        'Demikian surat pengunduran diri ini saya sampaikan. Atas perhatian dan pengertian Bapak/Ibu, saya ucapkan terima kasih.',
      ].join('\n\n')

    case 'izin':
      return [
        'Dengan hormat,',
        `Melalui surat ini, saya ${params.senderName || 'Pengirim'} (${params.senderRoleOrInfo || 'Karyawan / Mahasiswa'}) bermaksud memohon izin untuk tidak dapat hadir bekerja/mengikuti kegiatan di ${params.recipientCompany || 'instansi'} dikarenakan ${params.targetPositionOrReason || 'keperluan mendesak / kondisi kesehatan'}.`,
        'Sehubungan dengan hal tersebut, saya memohon pengertian dan izin dari Bapak/Ibu. Saya akan segera kembali beraktivitas seperti biasa setelah keperluan/pemulihan tersebut selesai.',
        'Demikian surat permohonan izin ini saya sampaikan. Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.',
      ].join('\n\n')

    case 'pernyataan':
      return [
        `Yang bertanda tangan di bawah ini:\nNama: ${params.senderName || '-'}\nKeterangan / Jabatan: ${params.senderRoleOrInfo || '-'}\nKontak: ${params.senderContact || '-'}`,
        `Dengan ini menyatakan dengan sesungguhnya bahwa ${params.targetPositionOrReason || 'seluruh data dan dokumen yang saya lampirkan adalah benar dan dapat dipertanggungjawabkan'}.`,
        'Apabila di kemudian hari ditemukan ketidaksesuaian atas pernyataan ini, saya bersedia menerima konsekuensi sesuai ketentuan yang berlaku.',
        'Demikian surat pernyataan ini saya buat dengan sadar dan tanpa paksaan dari pihak mana pun untuk dapat dipergunakan sebagaimana mestinya.',
      ].join('\n\n')
  }
}

function wrapParagraph(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export interface GenerateLetterPdfInput {
  kind: OfficialLetterKind
  cityAndDate: string
  subject: string
  recipientName: string
  recipientTitle: string
  recipientCompany: string
  senderName: string
  senderContact: string
  bodyText: string
  signaturePngBytes?: ArrayBuffer | null
}

export async function generateOfficialLetterPdf(
  input: GenerateLetterPdfInput,
): Promise<Blob> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  const fontRegular = await pdf.embedFont(StandardFonts.TimesRoman)
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold)

  const dark = rgb(0.08, 0.08, 0.1)
  const margin = 56
  const maxWidth = width - margin * 2
  let y = height - margin

  // City & Date (Top Right)
  if (input.cityAndDate.trim()) {
    const dateStr = input.cityAndDate.trim()
    const dw = fontRegular.widthOfTextAtSize(dateStr, 11)
    page.drawText(dateStr, {
      x: width - margin - dw,
      y,
      size: 11,
      font: fontRegular,
      color: dark,
    })
    y -= 28
  }

  if (input.kind === 'pernyataan') {
    const title = 'SURAT PERNYATAAN'
    const tw = fontBold.widthOfTextAtSize(title, 14)
    page.drawText(title, {
      x: (width - tw) / 2,
      y,
      size: 14,
      font: fontBold,
      color: dark,
    })
    y -= 32
  } else {
    // Subject & Recipient block
    if (input.subject.trim()) {
      page.drawText(`Perihal: ${input.subject.trim()}`, {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: dark,
      })
      y -= 24
    }

    page.drawText('Kepada Yth.', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: dark,
    })
    y -= 15

    const recHeader = [
      input.recipientName.trim(),
      input.recipientTitle.trim(),
    ]
      .filter(Boolean)
      .join(' — ')

    if (recHeader) {
      page.drawText(recHeader, {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: dark,
      })
      y -= 15
    }

    if (input.recipientCompany.trim()) {
      page.drawText(input.recipientCompany.trim(), {
        x: margin,
        y,
        size: 11,
        font: fontRegular,
        color: dark,
      })
      y -= 15
    }

    page.drawText('Di Tempat', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: dark,
    })
    y -= 28
  }

  // Body Paragraphs
  const rawParagraphs = input.bodyText
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)

  for (const block of rawParagraphs) {
    const subLines = block.split('\n')
    for (const subLine of subLines) {
      const wrapped = wrapParagraph(subLine, fontRegular, 11, maxWidth)
      for (const line of wrapped) {
        if (y < 130) break
        page.drawText(line, {
          x: margin,
          y,
          size: 11,
          font: fontRegular,
          color: dark,
        })
        y -= 16.5
      }
    }
    y -= 10
  }

  // Signature block on bottom right
  y = Math.min(y - 16, 210)
  const sigBlockX = width - margin - 170

  page.drawText('Hormat saya,', {
    x: sigBlockX,
    y,
    size: 11,
    font: fontRegular,
    color: dark,
  })

  if (input.signaturePngBytes) {
    const sigImg = await pdf.embedPng(input.signaturePngBytes)
    const sigW = 110
    const sigH = Math.min(54, (sigImg.height / sigImg.width) * sigW)
    page.drawImage(sigImg, {
      x: sigBlockX,
      y: y - sigH - 6,
      width: sigW,
      height: sigH,
    })
  }

  const nameY = y - 68
  page.drawText(input.senderName.trim() || 'Pengirim', {
    x: sigBlockX,
    y: nameY,
    size: 11,
    font: fontBold,
    color: dark,
  })

  if (input.senderContact.trim()) {
    page.drawText(input.senderContact.trim(), {
      x: sigBlockX,
      y: nameY - 14,
      size: 9.5,
      font: fontRegular,
      color: dark,
    })
  }

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
