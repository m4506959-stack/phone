'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'

export default function InventoryPage() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustModal, setAdjustModal] = useState<{ variantId: string; name: string } | null>(null)
  const [delta, setDelta] = useState<number>(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    fetch('/api/inventory').then(r => r.json()).then(d => { setInventory(d); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const handleAdjust = async () => {
    if (!adjustModal || !note.trim() || delta === 0) return
    setSaving(true)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId: adjustModal.variantId, delta, note }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      showToast(lang === 'ar' ? 'تم تعديل المخزون' : 'Stock adjusted', 'success')
      setAdjustModal(null)
      setDelta(0)
      setNote('')
      fetchData()
    } else {
      showToast(data.error, 'error')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>{t.admin.inventory.title}</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inventory.map((inv) => {
            const avail = Math.max(0, inv.totalStock - inv.reservedStock - inv.completedStock)
            const pct = inv.totalStock > 0 ? Math.round((inv.reservedStock + inv.completedStock) / inv.totalStock * 100) : 0
            return (
              <div key={inv.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>
                      {lang === 'ar' ? inv.variant.product.nameAr : inv.variant.product.name}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {inv.variant.storage} / {lang === 'ar' ? inv.variant.colorAr : inv.variant.color}
                    </p>
                  </div>
                  <button
                    onClick={() => setAdjustModal({ variantId: inv.variantId, name: `${inv.variant.storage} / ${lang === 'ar' ? inv.variant.colorAr : inv.variant.color}` })}
                    className="btn btn-secondary btn-sm"
                  >
                    ± {t.admin.inventory.adjustStock}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 12 }}>
                  {[
                    { label: t.admin.inventory.totalStock, val: inv.totalStock, color: 'var(--color-primary)' },
                    { label: t.admin.inventory.reserved, val: inv.reservedStock, color: 'var(--color-pending)' },
                    { label: t.admin.inventory.available, val: avail, color: 'var(--color-success)' },
                    { label: t.admin.inventory.completed, val: inv.completedStock, color: 'var(--color-completed)' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>

                {/* Recent transactions */}
                {inv.transactions.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>{t.admin.inventory.history}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {inv.transactions.slice(0, 3).map((tx: any) => (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <span>{t.admin.inventory[tx.type as keyof typeof t.admin.inventory] || tx.type} — {tx.note}</span>
                          <span>+{tx.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{t.admin.inventory.adjustStock}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>{adjustModal.name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'التعديل (موجب = إضافة، سالب = سحب)' : 'Delta (positive = add, negative = remove)'}</label>
                <input type="number" className="form-control" value={delta} onChange={e => setDelta(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.admin.inventory.adjustNote}<span className="required">*</span></label>
                <input className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder={lang === 'ar' ? 'سبب التعديل...' : 'Reason...'} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAdjustModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>{t.cancel}</button>
                <button onClick={handleAdjust} disabled={saving || !note.trim() || delta === 0} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? '...' : t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
