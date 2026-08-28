'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './dashboard.module.css'

interface DashboardData {
  totalReservations: number
  todayReservations: number
  pendingCount: number
  confirmedCount: number
  arrivedCount: number
  completedCount: number
  cancelledCount: number
  inventory: { totalStock: number; reservedStock: number; completedStock: number; availableStock: number }
  last7Days: { date: string; count: number }[]
}

export default function DashboardPage() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const stats = [
    { label: t.admin.dashboard.todayReservations, value: data?.todayReservations ?? 0, icon: '📅', color: 'var(--color-primary)' },
    { label: t.admin.dashboard.totalReservations, value: data?.totalReservations ?? 0, icon: '📋', color: 'var(--color-confirmed)' },
    { label: t.admin.dashboard.pending, value: data?.pendingCount ?? 0, icon: '🟡', color: 'var(--color-pending)' },
    { label: t.admin.dashboard.confirmed, value: data?.confirmedCount ?? 0, icon: '🔵', color: 'var(--color-confirmed)' },
    { label: t.admin.dashboard.arrived, value: data?.arrivedCount ?? 0, icon: '🟣', color: 'var(--color-arrived)' },
    { label: t.admin.dashboard.completed, value: data?.completedCount ?? 0, icon: '✅', color: 'var(--color-completed)' },
    { label: t.admin.dashboard.available, value: data?.inventory.availableStock ?? 0, icon: '📦', color: 'var(--color-success)' },
    { label: t.admin.dashboard.cancelled, value: data?.cancelledCount ?? 0, icon: '🔴', color: 'var(--color-error)' },
  ]

  const chartData = (data?.last7Days || []).map(d => ({
    date: new Date(d.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }))

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t.admin.dashboard.title}</h1>
        <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm">↻ {lang === 'ar' ? 'تحديث' : 'Refresh'}</button>
      </div>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${loading ? 'skeleton' : ''}`}>
            {!loading && (
              <>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className="stat-card-value" style={{ color: stat.color }}>{stat.value.toLocaleString()}</div>
                <div className="stat-card-label">{stat.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Daily chart */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>{t.admin.dashboard.reservationsPerDay}</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory overview */}
        <div className={`card ${styles.invCard}`}>
          <h3 className={styles.chartTitle}>{t.admin.dashboard.stockOverview}</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 160 }} />
          ) : (
            <div className={styles.invGrid}>
              {[
                { label: t.admin.dashboard.totalStock, val: data?.inventory.totalStock ?? 0, pct: 100, color: 'var(--color-primary)' },
                { label: t.admin.dashboard.reserved, val: data?.inventory.reservedStock ?? 0, pct: data?.inventory.totalStock ? Math.round((data.inventory.reservedStock / data.inventory.totalStock) * 100) : 0, color: 'var(--color-pending)' },
                { label: t.admin.dashboard.available, val: data?.inventory.availableStock ?? 0, pct: data?.inventory.totalStock ? Math.round((data.inventory.availableStock / data.inventory.totalStock) * 100) : 0, color: 'var(--color-success)' },
                { label: t.admin.dashboard.completed, val: data?.inventory.completedStock ?? 0, pct: data?.inventory.totalStock ? Math.round((data.inventory.completedStock / data.inventory.totalStock) * 100) : 0, color: 'var(--color-completed)' },
              ].map((item, i) => (
                <div key={i} className={styles.invItem}>
                  <div className={styles.invRow}>
                    <span className={styles.invLabel}>{item.label}</span>
                    <span className={styles.invVal} style={{ color: item.color }}>{item.val}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className={styles.quickLinks}>
        {[
          { href: '/admin/reservations?status=PENDING', label: lang === 'ar' ? `${data?.pendingCount || 0} حجز قيد الانتظار` : `${data?.pendingCount || 0} Pending`, color: 'var(--color-pending)', icon: '🟡' },
          { href: '/admin/reservations', label: lang === 'ar' ? 'إدارة الحجوزات' : 'Manage Reservations', color: 'var(--color-primary)', icon: '📋' },
          { href: '/admin/inventory', label: lang === 'ar' ? 'إدارة المخزون' : 'Inventory', color: 'var(--color-success)', icon: '📦' },
          { href: '/admin/notifications', label: lang === 'ar' ? 'الإشعارات' : 'Notifications', color: 'var(--color-arrived)', icon: '🔔' },
        ].map((link, i) => (
          <a key={i} href={link.href} className={`card card-hover ${styles.quickLink}`}>
            <span className={styles.quickLinkIcon}>{link.icon}</span>
            <span className={styles.quickLinkLabel}>{link.label}</span>
            <span className={styles.quickLinkArrow}>→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
