let pendingSmartFile: File | null = null

export function setPendingSmartFile(file: File | null): void {
  pendingSmartFile = file
}

export function getPendingSmartFile(): File | null {
  return pendingSmartFile
}

export function consumePendingSmartFile(): File | null {
  const file = pendingSmartFile
  pendingSmartFile = null
  return file
}
