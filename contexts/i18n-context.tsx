'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import ar from '@/i18n/ar'
import en from '@/i18n/en'
import type { Translations } from '@/i18n/ar'

type Language = 'ar' | 'en'
type Theme = 'light' | 'dark' | 'system'

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
  dir: 'rtl' | 'ltr'
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const I18nContext = createContext<I18nContextType | null>(null)

const translations: Record<Language, Translations> = { ar, en }

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ar')
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load persisted preferences
    const savedLang = (localStorage.getItem('lang') as Language) || 'ar'
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    setLangState(savedLang)
    setThemeState(savedTheme)
  }, [])

  useEffect(() => {
    // Apply direction
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  useEffect(() => {
    // Apply theme
    const applyTheme = (t: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', t)
      setResolvedTheme(t)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }, [])

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        theme,
        setTheme,
        resolvedTheme,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
