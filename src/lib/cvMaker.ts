import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'

export interface CvExperienceItem {
  id: string
  role: string
  company: string
  period: string
  bullets: string
}

export interface CvEducationItem {
  id: string
  degree: string
  school: string
  period: string
  gpa: string
}

export interface CvPayload {
  fullName: string
  headline: string
  phone: string
  email: string
  location: string
  portfolio: string
  summary: string
  experiences: CvExperienceItem[]
  educations: CvEducationItem[]
  skills: string
  certifications: string
}

function wrapTextToLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    const words = trimmed.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(candidate, fontSize)
      if (width <= maxWidth) {
        currentLine = candidate
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

export async function generateAtsCvPdf(payload: CvPayload): Promise<Blob> {
  const pdf = await PDFDocument.create()
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595.28 // A4
  const pageHeight = 841.89
  const margin = 46
  const contentWidth = pageWidth - margin * 2

  const dark = rgb(0.08, 0.09, 0.11)
  const bodyColor = rgb(0.2, 0.22, 0.25)
  const muted = rgb(0.42, 0.44, 0.48)
  const ruleColor = rgb(0.75, 0.77, 0.8)

  let page: PDFPage = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  function ensureSpace(requiredHeight: number) {
    if (y - requiredHeight < margin) {
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  function drawSectionHeader(title: string) {
    ensureSpace(34)
    y -= 10
    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: 10.5,
      font: fontBold,
      color: dark,
    })
    y -= 5
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.8,
      color: ruleColor,
    })
    y -= 14
  }

  // 1. Name & Headline (Centered ATS Header)
  const nameText = (payload.fullName || 'NAMA LENGKAP').trim()
  const nameWidth = fontBold.widthOfTextAtSize(nameText, 20)
  page.drawText(nameText, {
    x: Math.max(margin, (pageWidth - nameWidth) / 2),
    y: y - 16,
    size: 20,
    font: fontBold,
    color: dark,
  })
  y -= 32

  if (payload.headline.trim()) {
    const headText = payload.headline.trim()
    const headW = fontRegular.widthOfTextAtSize(headText, 11)
    page.drawText(headText, {
      x: Math.max(margin, (pageWidth - headW) / 2),
      y,
      size: 11,
      font: fontRegular,
      color: bodyColor,
    })
    y -= 15
  }

  const contactParts = [
    payload.phone.trim(),
    payload.email.trim(),
    payload.location.trim(),
    payload.portfolio.trim(),
  ].filter(Boolean)

  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ')
    const contactLines = wrapTextToLines(
      contactLine,
      fontRegular,
      9.5,
      contentWidth,
    )
    for (const cLine of contactLines) {
      const cw = fontRegular.widthOfTextAtSize(cLine, 9.5)
      page.drawText(cLine, {
        x: Math.max(margin, (pageWidth - cw) / 2),
        y,
        size: 9.5,
        font: fontRegular,
        color: muted,
      })
      y -= 13
    }
  }

  y -= 6

  // 2. Professional Summary
  if (payload.summary.trim()) {
    drawSectionHeader('RINGKASAN PROFESIONAL / SUMMARY')
    const sumLines = wrapTextToLines(
      payload.summary,
      fontRegular,
      10,
      contentWidth,
    )
    for (const line of sumLines) {
      ensureSpace(15)
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: fontRegular,
        color: bodyColor,
      })
      y -= 14
    }
    y -= 6
  }

  // 3. Work Experience
  const validExp = payload.experiences.filter(
    (item) => item.role.trim() || item.company.trim(),
  )
  if (validExp.length > 0) {
    drawSectionHeader('PENGALAMAN KERJA & ORGANISASI / EXPERIENCE')

    for (const exp of validExp) {
      ensureSpace(32)
      const roleTitle = exp.role.trim() || 'Posisi'
      page.drawText(roleTitle, {
        x: margin,
        y,
        size: 10.5,
        font: fontBold,
        color: dark,
      })

      if (exp.period.trim()) {
        const per = exp.period.trim()
        const perW = fontBold.widthOfTextAtSize(per, 9.5)
        page.drawText(per, {
          x: pageWidth - margin - perW,
          y,
          size: 9.5,
          font: fontBold,
          color: muted,
        })
      }

      y -= 13
      if (exp.company.trim()) {
        page.drawText(exp.company.trim(), {
          x: margin,
          y,
          size: 10,
          font: fontRegular,
          color: muted,
        })
        y -= 14
      }

      const rawBullets = exp.bullets
        .split(/\r?\n/)
        .map((b) => b.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)

      for (const bullet of rawBullets) {
        const bLines = wrapTextToLines(
          bullet,
          fontRegular,
          9.8,
          contentWidth - 14,
        )
        bLines.forEach((bLine, idx) => {
          ensureSpace(14)
          if (idx === 0) {
            page.drawText('•', {
              x: margin + 2,
              y,
              size: 10,
              font: fontBold,
              color: dark,
            })
          }
          page.drawText(bLine, {
            x: margin + 14,
            y,
            size: 9.8,
            font: fontRegular,
            color: bodyColor,
          })
          y -= 13.5
        })
      }

      y -= 8
    }
  }

  // 4. Education
  const validEdu = payload.educations.filter(
    (item) => item.school.trim() || item.degree.trim(),
  )
  if (validEdu.length > 0) {
    drawSectionHeader('PENDIDIKAN / EDUCATION')

    for (const edu of validEdu) {
      ensureSpace(28)
      const schoolName = edu.school.trim() || 'Institusi Pendidikan'
      page.drawText(schoolName, {
        x: margin,
        y,
        size: 10.5,
        font: fontBold,
        color: dark,
      })

      if (edu.period.trim()) {
        const per = edu.period.trim()
        const perW = fontBold.widthOfTextAtSize(per, 9.5)
        page.drawText(per, {
          x: pageWidth - margin - perW,
          y,
          size: 9.5,
          font: fontBold,
          color: muted,
        })
      }

      y -= 13
      const degParts = [
        edu.degree.trim(),
        edu.gpa.trim() ? `IPK / GPA: ${edu.gpa.trim()}` : '',
      ].filter(Boolean)

      if (degParts.length > 0) {
        page.drawText(degParts.join('  •  '), {
          x: margin,
          y,
          size: 9.8,
          font: fontRegular,
          color: bodyColor,
        })
        y -= 15
      }
      y -= 4
    }
  }

  // 5. Skills & Certifications
  if (payload.skills.trim() || payload.certifications.trim()) {
    drawSectionHeader('KEAHLIAN & SERTIFIKASI / SKILLS & CERTIFICATIONS')

    if (payload.skills.trim()) {
      const skillLines = wrapTextToLines(
        `Keahlian: ${payload.skills.trim()}`,
        fontRegular,
        9.8,
        contentWidth,
      )
      for (const line of skillLines) {
        ensureSpace(14)
        page.drawText(line, {
          x: margin,
          y,
          size: 9.8,
          font: fontRegular,
          color: bodyColor,
        })
        y -= 14
      }
      y -= 4
    }

    if (payload.certifications.trim()) {
      const certLines = wrapTextToLines(
        `Sertifikasi & Bahasa: ${payload.certifications.trim()}`,
        fontRegular,
        9.8,
        contentWidth,
      )
      for (const line of certLines) {
        ensureSpace(14)
        page.drawText(line, {
          x: margin,
          y,
          size: 9.8,
          font: fontRegular,
          color: bodyColor,
        })
        y -= 14
      }
    }
  }

  const saved = await pdf.save()
  return new Blob([saved as BlobPart], { type: 'application/pdf' })
}
