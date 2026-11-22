import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'id' | 'en'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (idText: string, enText: string) => string
}

const STORAGE_KEY = 'ditya-tools-lang'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'id'
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'id' || saved === 'en') {
    return saved
  }

  return 'id'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((prev) => (prev === 'id' ? 'en' : 'id')),
      t: (idText: string, enText: string) =>
        language === 'id' ? idText : enText,
    }
  }, [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
