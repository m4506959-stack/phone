'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'

export default function CustomersPage() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<any>({ customers: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = () => {
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    fetch(`/api/customers?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [page]) // eslint-disable-line
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchData() }, 400)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t.admin.customers.title}</h1>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{data.total} {lang === 'ar' ? 'عميل' : 'customers'}</span>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <input
          type="text"
          className="form-control"
          placeholder={lang === 'ar' ? 'بحث بالاسم أو الهاتف أو الإيميل...' : 'Search by name, phone, or email...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t.admin.customers.fullName}</th>
              <th>{t.admin.customers.phone}</th>
              <th>{t.admin.customers.email}</th>
              <th>{t.admin.customers.city}</th>
              <th>{t.admin.customers.reservations}</th>
              <th>{t.admin.customers.joinedAt}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)
            ) : data.customers.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><span className="empty-state-icon">👥</span><p className="empty-state-title">{t.admin.customers.noCustomers}</p></div></td></tr>
            ) : data.customers.map((c: any) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.fullName}</td>
                <td dir="ltr">{c.phone}</td>
                <td dir="ltr" style={{ fontSize: 12 }}>{c.email || '—'}</td>
                <td>{c.city || '—'}{c.area ? `, ${c.area}` : ''}</td>
                <td><span className="badge badge-confirmed">{c._count.reservations}</span></td>
                <td style={{ fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
