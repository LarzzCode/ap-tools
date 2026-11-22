import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ditya-recent-tools-v1'
const MAX_RECENT = 5

function readRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string')
    }
  } catch {
    // ignore storage read error
  }
  return []
}

function writeRecentIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    window.dispatchEvent(new CustomEvent('ditya-recent-tools-updated'))
  } catch {
    // ignore storage write error
  }
}

export function recordRecentToolId(toolId: string): void {
  if (!toolId) return
  const current = readRecentIds()
  const next = [toolId, ...current.filter((id) => id !== toolId)].slice(
    0,
    MAX_RECENT,
  )
  writeRecentIds(next)
}

export function useRecentTools() {
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentIds())

  useEffect(() => {
    const handleSync = () => {
      setRecentIds(readRecentIds())
    }

    window.addEventListener('ditya-recent-tools-updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('ditya-recent-tools-updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const clearRecentTools = useCallback(() => {
    writeRecentIds([])
    setRecentIds([])
  }, [])

  return {
    recentIds,
    clearRecentTools,
  }
}
