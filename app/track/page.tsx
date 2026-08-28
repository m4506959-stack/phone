'use client'

import { useState, useEffect, Suspense } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import styles from './track.module.css'

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'ARRIVED', 'READY_FOR_PICKUP', 'COMPLETED'] as const

const STATUS_ICONS: Record<string, string> = {
  PENDING: '🟡',
  CONFIRMED: '🔵',
  ARRIVED: '🟣',
  READY_FOR_PICKUP: '🟢',
  COMPLETED: '✅',
  CANCELLED: '🔴',
  EXPIRED: '⚪',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  ARRIVED: 'badge-arrived',
  READY_FOR_PICKUP: 'badge-ready',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
  EXPIRED: 'badge-expired',
}

interface ReservationData {
  id: string
  reservationCode: string
  status: string
  deliveryMethod: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  customer: { fullName: string; city?: string; area?: string }
  items: {
    quantity: number
    unitPrice: number
    variant: { storage: string; color: string; colorAr: string; product: { name: string; nameAr: string } }
  }[]
}

function TrackPageInner() {
  const { t, lang } = useI18n()
  const searchParams = useSearchParams()
  const initialToken = searchParams.get('token') || ''

  const [token, setToken] = useState(initialToken)
  const [inputToken, setInputToken] = useState(initialToken)
  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [loading, setLoading] = useState(!!initialToken)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  const fetchReservation = async (tokenStr: string) => {
    if (!tokenStr.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reservations/track?token=${tokenStr.trim().toUpperCase()}`)
      const data = await res.json()
      if (!res.ok) {
        setError(t.track?.notFound || data.error)
        setReservation(null)
      } else {
        setReservation(data)
        const baseUrl = window.location.origin
        const qr = await QRCode.toDataURL(`${baseUrl}/track?token=${tokenStr.trim().toUpperCase()}`, { width: 180, margin: 1 })
        setQrDataUrl(qr)
      }
    } catch {
      setError(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialToken) fetchReservation(initialToken)
  }, []) // eslint-disable-line

  const handleSearch = () => {
    setToken(inputToken)
    fetchReservation(inputToken)
  }

  const currentStatusIndex = reservation
    ? STATUS_STEPS.indexOf(reservation.status as typeof STATUS_STEPS[number])
    : -1

  const isCancelledOrExpired = reservation?.status === 'CANCELLED' || reservation?.status === 'EXPIRED'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.backBtn}>← {t.back}</Link>
          <h1 className={styles.headerTitle}>{t.track.title}</h1>
          <div />
        </div>
      </header>

      <div className={`container-sm ${styles.content}`}>
        {/* Search box */}
        <div className={`card ${styles.searchCard}`}>
          <h2 className={styles.searchTitle}>{t.track.title}</h2>
          <p className={styles.searchSubtitle}>{t.track.subtitle}</p>
          <div className={styles.searchRow}>
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder={t.track.tokenPlaceholder}
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              dir="ltr"
              style={{ letterSpacing: 2, textTransform: 'uppercase' }}
            />
            <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
              {loading ? '...' : t.track.trackButton}
            </button>
          </div>
          {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.skeletonCard}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 20, borderRadius: 8, marginBottom: 12 }} />)}
          </div>
        )}

        {/* Result */}
        {reservation && !loading && (
          <>
            {/* Reservation header */}
            <div className={`card ${styles.resCard}`}>
              <div className={styles.resHeader}>
                <div>
                  <p className={styles.resCode}>#{reservation.reservationCode}</p>
                  <p className={styles.resDate}>{new Date(reservation.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className={`badge ${STATUS_BADGE[reservation.status]}`}>
                  {t.statuses[reservation.status as keyof typeof t.statuses] || reservation.status}
                </div>
              </div>

              {/* Customer */}
              <div className={styles.customerInfo}>
                <span>{reservation.customer.fullName}</span>
                {reservation.customer.city && <span>• {reservation.customer.city}{reservation.customer.area ? `, ${reservation.customer.area}` : ''}</span>}
              </div>

              {/* Items */}
              {reservation.items.map((item, i) => (
                <div key={i} className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <strong>{lang === 'ar' ? item.variant.product.nameAr : item.variant.product.name}</strong>
                    <span className={styles.itemVariant}>{item.variant.storage} / {lang === 'ar' ? item.variant.colorAr : item.variant.color}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemQty}>× {item.quantity}</span>
                    <span className={styles.itemPrice}>{(item.unitPrice * item.quantity).toLocaleString()} {t.currency}</span>
                  </div>
                </div>
              ))}

              <div className={styles.totalRow}>
                <span>{t.total}</span>
                <strong>{reservation.totalAmount.toLocaleString()} {t.currency}</strong>
              </div>
            </div>

            {/* Timeline */}
            {!isCancelledOrExpired && (
              <div className="card">
                <h3 className={styles.timelineTitle}>{t.track.timeline}</h3>
                <div className={styles.timeline}>
                  {STATUS_STEPS.map((step, i) => {
                    const done = i < currentStatusIndex
                    const active = i === currentStatusIndex
                    return (
                      <div key={step} className={`${styles.timelineItem} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                        <div className={styles.timelineDot}>
                          {done ? '✓' : active ? '●' : '○'}
                        </div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineLabel}>
                            {t.timeline[step as keyof typeof t.timeline]}
                          </p>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`${styles.timelineConnector} ${done ? styles.connectorDone : ''}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {isCancelledOrExpired && (
              <div className={`card ${styles.cancelledCard}`}>
                <p>{t.statuses[reservation.status as keyof typeof t.statuses]}</p>
              </div>
            )}

            {/* QR Code */}
            {qrDataUrl && reservation.status !== 'CANCELLED' && reservation.status !== 'EXPIRED' && (
              <div className={`card ${styles.qrCard}`}>
                <h3 className={styles.timelineTitle}>{t.confirmation.qrTitle}</h3>
                <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
                <p className={styles.qrNote}>{t.confirmation.qrNote}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackPageInner />
    </Suspense>
  )
}
