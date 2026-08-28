'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'

export default function SettingsPage() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => { setSettings(d); setLoading(false) })
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) showToast(t.admin.settings.settingsSaved, 'success')
    else showToast(t.errors.serverError, 'error')
  }

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 14 }} />
  if (!settings) return null

  const update = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t.admin.settings.title}</h1>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? '...' : t.admin.settings.saveSettings}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Store Info */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t.admin.settings.store}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.storeName}</label>
              <input className="form-control" value={settings.storeName || ''} onChange={e => update('storeName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.storeNameAr}</label>
              <input className="form-control" value={settings.storeNameAr || ''} onChange={e => update('storeNameAr', e.target.value)} dir="rtl" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.phone}</label>
              <input className="form-control" value={settings.phone || ''} onChange={e => update('phone', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.address}</label>
              <input className="form-control" value={settings.address || ''} onChange={e => update('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Reservation Settings */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t.admin.settings.reservation}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.reservationsOpen}</label>
              <select className="form-control" value={settings.reservationsOpen ? 'true' : 'false'} onChange={e => update('reservationsOpen', e.target.value === 'true')}>
                <option value="true">{lang === 'ar' ? 'مفتوح' : 'Open'}</option>
                <option value="false">{lang === 'ar' ? 'مغلق' : 'Closed'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.maxQtyPerCustomer}</label>
              <input type="number" className="form-control" value={settings.maxQtyPerCustomer || 2} onChange={e => update('maxQtyPerCustomer', Number(e.target.value))} min={1} max={10} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.countdownEnabled}</label>
              <select className="form-control" value={settings.countdownEnabled ? 'true' : 'false'} onChange={e => update('countdownEnabled', e.target.value === 'true')}>
                <option value="false">{lang === 'ar' ? 'معطل' : 'Disabled'}</option>
                <option value="true">{lang === 'ar' ? 'مفعل' : 'Enabled'}</option>
              </select>
            </div>
            {settings.countdownEnabled && (
              <div className="form-group">
                <label className="form-label">{t.admin.settings.countdownEnd}</label>
                <input type="datetime-local" className="form-control" value={settings.countdownEnd ? settings.countdownEnd.slice(0, 16) : ''} onChange={e => update('countdownEnd', e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t.admin.settings.email}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.emailEnabled}</label>
              <select className="form-control" value={settings.emailEnabled ? 'true' : 'false'} onChange={e => update('emailEnabled', e.target.value === 'true')}>
                <option value="true">{lang === 'ar' ? 'مفعل' : 'Enabled'}</option>
                <option value="false">{lang === 'ar' ? 'معطل' : 'Disabled'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.smtpHost}</label>
              <input className="form-control" value={settings.smtpHost || ''} onChange={e => update('smtpHost', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.smtpUser}</label>
              <input type="email" className="form-control" value={settings.smtpUser || ''} onChange={e => update('smtpUser', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.admin.settings.smtpPass}</label>
              <input type="password" className="form-control" placeholder="••••••••" onChange={e => update('smtpPass', e.target.value)} />
              <p className="form-hint">{lang === 'ar' ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية' : 'Leave empty to keep current password'}</p>
            </div>
          </div>
        </div>

        {/* Language & Appearance */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t.admin.settings.language}</h2>
          <div className="form-group" style={{ maxWidth: 300 }}>
            <label className="form-label">{t.admin.settings.defaultLanguage}</label>
            <select className="form-control" value={settings.defaultLanguage || 'ar'} onChange={e => update('defaultLanguage', e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? '...' : t.admin.settings.saveSettings}
        </button>
      </div>
    </div>
  )
}
