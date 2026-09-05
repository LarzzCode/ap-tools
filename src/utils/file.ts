export function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']

  const unitIndex = Math.floor(
    Math.log(bytes) / Math.log(1024),
  )

  const value =
    bytes / Math.pow(1024, unitIndex)

  return `${value.toFixed(
    unitIndex === 0 ? 0 : 2,
  )} ${units[unitIndex]}`
}