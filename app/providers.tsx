'use client'

import { I18nProvider } from '@/contexts/i18n-context'
import { ToastProvider } from '@/contexts/toast-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </I18nProvider>
  )
}
