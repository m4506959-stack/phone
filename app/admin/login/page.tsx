'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/i18n-context'
import styles from './login.module.css'

export default function LoginPage() {
  const { t, lang, setLang, theme, setTheme } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError(t.login.invalidCredentials)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className={styles.page}>
      {/* Theme/Lang switcher */}
      <div className={styles.topBar}>
        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-ghost btn-sm">
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="btn btn-ghost btn-sm btn-icon">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.logo}>🍎</div>
          <h1 className={styles.title}>{t.login.title}</h1>
          <p className={styles.subtitle}>{t.login.subtitle}</p>

          {error && (
            <div className={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            <div className="form-group">
              <label className="form-label">{t.login.email}</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.login.password}</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className={`btn btn-primary w-full ${styles.loginBtn}`}>
              {loading ? t.login.loggingIn : t.login.loginButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
