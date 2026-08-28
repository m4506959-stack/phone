'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'

export default function NotificationsPage() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const [data, setData] = useState<any>({ notifications: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  const fetchData = () => {
    fetch('/api/notifications').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const retry = async (id: string) => {
    setRetrying(id)
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setRetrying(null)
    if (res.ok) { showToast(lang === 'ar' ? 'تم إعادة الإرسال' : 'Retried', 'success'); fetchData() }
    else showToast(lang === 'ar' ? 'فشل الإعادة' : 'Retry failed', 'error')
  }

  const NOTIF_BADGE: Record<string, string> = { SENT: 'badge-sent', FAILED: 'badge-cancelled', PENDING: 'badge-pending' }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>{t.admin.notifications.title}</h1>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{lang === 'ar' ? 'الحجز' : 'Reservation'}</th>
              <th>{t.admin.notifications.recipient}</th>
              <th>{t.admin.notifications.type}</th>
              <th>{t.admin.notifications.notifStatus}</th>
              <th>{t.admin.notifications.sentAt}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>
              ))
            ) : data.notifications.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><span className="empty-state-icon">🔔</span><p className="empty-state-title">{t.admin.notifications.noNotifications}</p></div></td></tr>
            ) : data.notifications.map((n: any) => (
              <tr key={n.id}>
                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>#{n.reservation.reservationCode}</td>
                <td dir="ltr" style={{ fontSize: 12 }}>{n.recipient}</td>
                <td><span className="badge badge-info">{t.admin.notifications[n.type as keyof typeof t.admin.notifications] || n.type}</span></td>
                <td><span className={`badge ${NOTIF_BADGE[n.status]}`}>{t.admin.notifications[n.status as keyof typeof t.admin.notifications] || n.status}</span></td>
                <td style={{ fontSize: 12 }}>{n.sentAt ? new Date(n.sentAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}</td>
                <td>
                  {n.status === 'FAILED' && (
                    <button onClick={() => retry(n.id)} disabled={retrying === n.id} className="btn btn-secondary btn-sm">
                      {retrying === n.id ? '...' : t.admin.notifications.retry}
                    </button>
                  )}
                  {n.error && <p style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 4 }}>{n.error}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
