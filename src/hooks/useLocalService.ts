import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  checkLocalService,
  type LocalServiceHealth,
} from '../lib/localService'

export type LocalServiceStatus =
  | 'checking'
  | 'connected'
  | 'offline'

export function useLocalService() {
  const [status, setStatus] =
    useState<LocalServiceStatus>('checking')

  const [health, setHealth] =
    useState<LocalServiceHealth | null>(null)

  const checkConnection =
    useCallback(async () => {
      const controller =
        new AbortController()

      const timeoutId =
        window.setTimeout(() => {
          controller.abort()
        }, 2500)

      setStatus('checking')

      try {
        const result =
          await checkLocalService(
            controller.signal,
          )

        setHealth(result)
        setStatus('connected')
      } catch {
        setHealth(null)
        setStatus('offline')
      } finally {
        window.clearTimeout(timeoutId)
      }
    }, [])

  useEffect(() => {
    void checkConnection()
  }, [checkConnection])

  return {
    status,
    health,
    checkConnection,
  }
}