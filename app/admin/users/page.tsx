'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'

interface UserItem {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE'
  active: boolean
  createdAt: string
}

export default function UsersPage() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = () => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(t.success, 'success')
        setShowModal(false)
        setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE' })
        fetchUsers()
      } else {
        showToast(data.error || t.errors.serverError, 'error')
      }
    } catch {
      showToast(t.errors.serverError, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t.admin.users.title}</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + {t.admin.users.addUser}
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{t.email}</th>
              <th>{t.admin.users.role}</th>
              <th>{t.status}</th>
              <th>{t.date}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(5).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="empty-state-icon">👤</span>
                    <p className="empty-state-title">{t.admin.users.noUsers}</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td dir="ltr" style={{ fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'OWNER' ? 'badge-confirmed' : u.role === 'ADMIN' ? 'badge-ready' : 'badge-pending'}`}>
                      {t.admin.users[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-ready' : 'badge-cancelled'}`}>
                      {u.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t.admin.users.addUser}</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">{t.name}<span className="required">*</span></label>
                <input
                  className="form-control"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.email}<span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.admin.users.password}<span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.admin.users.role}</label>
                <select
                  className="form-control"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="EMPLOYEE">{t.admin.users.EMPLOYEE}</option>
                  <option value="ADMIN">{t.admin.users.ADMIN}</option>
                  <option value="OWNER">{t.admin.users.OWNER}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? '...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
