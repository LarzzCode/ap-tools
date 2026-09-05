export function downloadDataUrl(
  dataUrl: string,
  fileName: string,
) {
  const link = document.createElement('a')

  link.href = dataUrl
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadBlob(
  blob: Blob,
  fileName: string,
) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}