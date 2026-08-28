'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'

interface AuditItem {
  id: string
  action: string
  entity: string
  entityId: string
  prevValue?: string | null
  newValue?: string | null
  ip?: string | null
  createdAt: string
  user: {
    name: string
    email: string
    role: string
  }
}

export default function AuditLogPage() {
  const { t, lang } = useI18n()
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = () => {
    setLoading(true)
    fetch(`/api/audit?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || [])
        setTotalPages(d.totalPages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [page]) // eslint-disable-line

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t.admin.auditLog.title}</h1>
        <button onClick={fetchLogs} className="btn btn-secondary btn-sm">↻ {lang === 'ar' ? 'تحديث' : 'Refresh'}</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t.admin.auditLog.user}</th>
              <th>{t.admin.auditLog.action}</th>
              <th>{t.admin.auditLog.entity}</th>
              <th>{t.admin.auditLog.prevValue}</th>
              <th>{t.admin.auditLog.newValue}</th>
              <th>{t.date}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <span className="empty-state-icon">📝</span>
                    <p className="empty-state-title">{t.admin.auditLog.noLogs}</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div>
                      <strong style={{ fontSize: 13 }}>{log.user?.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{log.user?.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{log.action}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{log.entity}</span>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ID: {log.entityId?.slice(0, 8)}...</div>
                  </td>
                  <td>
                    <pre style={{ fontSize: 11, background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 4, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.prevValue || '—'}
                    </pre>
                  </td>
                  <td>
                    <pre style={{ fontSize: 11, background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 4, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.newValue || '—'}
                    </pre>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">
            {lang === 'ar' ? '← السابق' : '← Prev'}
          </button>
          <span style={{ fontSize: 14 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">
            {lang === 'ar' ? 'التالي →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
