'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/contexts/i18n-context'
import styles from './admin.module.css'

interface NavItem {
  key: string
  href: string
  icon: string
  label: (t: ReturnType<typeof useI18n>['t']) => string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/admin/dashboard', icon: '📊', label: (t) => t.admin.sidebar.dashboard },
  { key: 'reservations', href: '/admin/reservations', icon: '📋', label: (t) => t.admin.sidebar.reservations },
  { key: 'products', href: '/admin/products', icon: '📦', label: (t) => t.admin.sidebar.products },
  { key: 'inventory', href: '/admin/inventory', icon: '🏭', label: (t) => t.admin.sidebar.inventory },
  { key: 'customers', href: '/admin/customers', icon: '👥', label: (t) => t.admin.sidebar.customers },
  { key: 'notifications', href: '/admin/notifications', icon: '🔔', label: (t) => t.admin.sidebar.notifications },
  { key: 'audit', href: '/admin/audit', icon: '📝', label: (t) => t.admin.sidebar.auditLog },
  { key: 'users', href: '/admin/users', icon: '👤', label: (t) => t.admin.sidebar.users, roles: ['OWNER'] },
  { key: 'settings', href: '/admin/settings', icon: '⚙️', label: (t) => t.admin.sidebar.settings, roles: ['OWNER', 'ADMIN'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang, setLang, theme, setTheme } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="skeleton" style={{ width: 200, height: 40 }} />
    </div>
  )

  if (status === 'unauthenticated' && !pathname.includes('/admin/login')) {
    router.push('/admin/login')
    return null
  }

  if (pathname.includes('/admin/login')) return <>{children}</>

  const userRole = (session?.user as { role?: string })?.role || ''
  const filteredNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(userRole))

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoIcon}>🍎</span>
            <span className={styles.sidebarLogoText}>Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`${styles.closeSidebar} btn btn-ghost btn-icon`}>✕</button>
        </div>

        <nav className={styles.nav}>
          {filteredNav.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label(t)}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{session?.user?.name?.[0] || 'A'}</div>
            <div>
              <p className={styles.userName}>{session?.user?.name}</p>
              <p className={styles.userRole}>{userRole}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}>
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button onClick={() => setSidebarOpen(true)} className={`btn btn-ghost btn-icon ${styles.menuBtn}`}>☰</button>
          <div className={styles.topbarRight}>
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-ghost btn-sm">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="btn btn-ghost btn-sm btn-icon"
              title={t.theme[theme]}
            >
              {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
            </button>
            <Link href="/" target="_blank" className="btn btn-secondary btn-sm">🌐 {lang === 'ar' ? 'الموقع' : 'Website'}</Link>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
