'use client'

import { useState, useEffect, Suspense } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'
import { useSearchParams } from 'next/navigation'
import styles from './reservations.module.css'

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'ARRIVED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'EXPIRED']
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', ARRIVED: 'badge-arrived',
  READY_FOR_PICKUP: 'badge-ready', COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled', EXPIRED: 'badge-expired',
}
const STATUS_ICONS: Record<string, string> = {
  PENDING: '🟡', CONFIRMED: '🔵', ARRIVED: '🟣', READY_FOR_PICKUP: '🟢',
  COMPLETED: '✅', CANCELLED: '🔴', EXPIRED: '⚪',
}

// Which next status each current status can transition to
const NEXT_ACTIONS: Record<string, { status: string; label_ar: string; label_en: string; btnClass: string }[]> = {
  PENDING: [{ status: 'CONFIRMED', label_ar: 'تأكيد الحجز', label_en: 'Confirm', btnClass: 'btn-primary' }, { status: 'CANCELLED', label_ar: 'إلغاء', label_en: 'Cancel', btnClass: 'btn-danger' }],
  CONFIRMED: [{ status: 'ARRIVED', label_ar: 'تأكيد الوصول', label_en: 'Mark Arrived', btnClass: 'btn-primary' }, { status: 'CANCELLED', label_ar: 'إلغاء', label_en: 'Cancel', btnClass: 'btn-danger' }],
  ARRIVED: [{ status: 'READY_FOR_PICKUP', label_ar: 'جاهز للاستلام', label_en: 'Mark Ready', btnClass: 'btn-success' }],
  READY_FOR_PICKUP: [{ status: 'COMPLETED', label_ar: 'إتمام الاستلام', label_en: 'Complete', btnClass: 'btn-success' }],
}

interface ReservationItem {
  quantity: number
  unitPrice: number
  variant: { storage: string; color: string; colorAr: string; product: { name: string; nameAr: string } }
}
interface Customer { fullName: string; phone: string; email: string }
interface Reservation {
  id: string
  reservationCode: string
  status: string
  totalAmount: number
  createdAt: string
  deliveryMethod: string
  customer: Customer
  items: ReservationItem[]
}

function ReservationsInner() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const initStatus = searchParams.get('status') || 'ALL'

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; status: string; label: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/reservations?${params}`)
    const data = await res.json()
    setReservations(data.reservations || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter, page]) // eslint-disable-line
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchData() }, 400)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line

  const changeStatus = async (id: string, status: string) => {
    setActionLoading(id)
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    setActionLoading(null)
    setConfirmDialog(null)
    if (res.ok) {
      showToast(t.admin.reservations.statusChanged, 'success')
      fetchData()
    } else {
      showToast(data.error || t.errors.serverError, 'error')
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t.admin.reservations.title}</h1>
        <span className={styles.totalBadge}>{total} {lang === 'ar' ? 'حجز' : 'reservations'}</span>
      </div>

      {/* Filters */}
      <div className={`card ${styles.filterCard}`}>
        <div className={styles.filterRow}>
          <input
            type="text"
            className={`form-control ${styles.searchInput}`}
            placeholder={t.admin.reservations.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.statusTabs}>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`${styles.statusTab} ${statusFilter === s ? styles.statusTabActive : ''}`}
              >
                {s === 'ALL' ? (lang === 'ar' ? 'الكل' : 'All') : t.statuses[s as keyof typeof t.statuses] || s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className={`table-wrapper hide-mobile`} style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>{t.admin.reservations.reservation}</th>
              <th>{t.admin.reservations.customer}</th>
              <th>{t.phone}</th>
              <th>{t.admin.reservations.product}</th>
              <th>{t.status}</th>
              <th>{t.admin.reservations.created}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : reservations.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><span className="empty-state-icon">📋</span><p className="empty-state-title">{t.admin.reservations.noReservations}</p></div></td></tr>
            ) : reservations.map(r => {
              const item = r.items[0]
              const actions = NEXT_ACTIONS[r.status] || []
              return (
                <tr key={r.id}>
                  <td><span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{r.reservationCode}</span></td>
                  <td>{r.customer.fullName}</td>
                  <td dir="ltr">{r.customer.phone}</td>
                  <td>
                    {item && <><span style={{ fontWeight: 600 }}>{lang === 'ar' ? item.variant.product.nameAr : item.variant.product.name}</span><br /><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.variant.storage} / {lang === 'ar' ? item.variant.colorAr : item.variant.color}</span></>}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>
                      {STATUS_ICONS[r.status]} {t.statuses[r.status as keyof typeof t.statuses]}
                    </span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {actions.map(a => (
                        <button
                          key={a.status}
                          onClick={() => setConfirmDialog({ id: r.id, status: a.status, label: lang === 'ar' ? a.label_ar : a.label_en })}
                          disabled={actionLoading === r.id}
                          className={`btn ${a.btnClass} btn-sm`}
                        >
                          {lang === 'ar' ? a.label_ar : a.label_en}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={styles.mobileCards}>
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14, marginBottom: 12 }} />
          ))
        ) : reservations.map(r => {
          const item = r.items[0]
          const actions = NEXT_ACTIONS[r.status] || []
          const expanded = expandedId === r.id
          return (
            <div key={r.id} className={`card ${styles.mobileCard}`}>
              <div className={styles.mobileCardHeader} onClick={() => setExpandedId(expanded ? null : r.id)}>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 15 }}>#{r.reservationCode}</span>
                  <p style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{r.customer.fullName}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }} dir="ltr">{r.customer.phone}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_ICONS[r.status]} {t.statuses[r.status as keyof typeof t.statuses]}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {expanded && (
                <div className={styles.mobileCardExpanded}>
                  {item && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{lang === 'ar' ? item.variant.product.nameAr : item.variant.product.name} — {item.variant.storage} / {lang === 'ar' ? item.variant.colorAr : item.variant.color} × {item.quantity}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {actions.map(a => (
                      <button key={a.status} onClick={() => setConfirmDialog({ id: r.id, status: a.status, label: lang === 'ar' ? a.label_ar : a.label_en })} className={`btn ${a.btnClass} btn-sm`}>
                        {lang === 'ar' ? a.label_ar : a.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">
            {lang === 'ar' ? '← السابق' : '← Prev'}
          </button>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">
            {lang === 'ar' ? 'التالي →' : 'Next →'}
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t.admin.reservations.confirmDialog}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>
              {lang === 'ar' ? 'سيتم تغيير الحالة إلى:' : 'Status will change to:'} <strong>{confirmDialog.label}</strong>
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary" style={{ flex: 1 }}>{t.cancel}</button>
              <button onClick={() => changeStatus(confirmDialog.id, confirmDialog.status)} disabled={!!actionLoading} className="btn btn-primary" style={{ flex: 1 }}>
                {actionLoading ? '...' : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  return <Suspense><ReservationsInner /></Suspense>
}
