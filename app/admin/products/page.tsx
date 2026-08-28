'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'

interface Variant {
  id: string
  storage: string
  color: string
  colorAr: string
  price: number
  availableStock: number
  inventory?: {
    totalStock: number
    reservedStock: number
    completedStock: number
  } | null
}

interface Product {
  id: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  active: boolean
  variants: Variant[]
}

export default function ProductsPage() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState<number>(0)
  const [savingPrice, setSavingPrice] = useState(false)

  const fetchProducts = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const startEditPrice = (variant: Variant) => {
    setEditingPriceId(variant.id)
    setTempPrice(variant.price)
  }

  const savePrice = async (variantId: string) => {
    setSavingPrice(true)
    try {
      const res = await fetch(`/api/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(tempPrice) }),
      })
      if (res.ok) {
        showToast(lang === 'ar' ? 'تم تحديث السعر بنجاح 💰' : 'Price updated successfully 💰', 'success')
        setEditingPriceId(null)
        fetchProducts()
      } else {
        const d = await res.json()
        showToast(d.error || t.errors.serverError, 'error')
      }
    } catch {
      showToast(t.errors.serverError, 'error')
    } finally {
      setSavingPrice(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t.admin.products.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {lang === 'ar' ? 'يمكنك تعديل أسعار كافة الطرازات والمتغيرات بشكل فوري من هنا' : 'Manage and update pricing for all models and variants in real-time'}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-state-icon">📦</span>
          <p className="empty-state-title">{t.admin.products.noProducts}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {products.map((product) => (
            <div key={product.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}></span>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                      {lang === 'ar' ? product.nameAr : product.name}
                    </h2>
                    <span className={`badge ${product.active ? 'badge-ready' : 'badge-cancelled'}`}>
                      {product.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    {lang === 'ar' ? product.descriptionAr : product.description}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {t.admin.products.variants} ({product.variants?.length || 0})
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {lang === 'ar' ? 'انقر على السعر أو زر التعديل لتغييره' : 'Click edit button to change price'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {product.variants?.map((v) => {
                    const isEditing = editingPriceId === v.id
                    return (
                      <div
                        key={v.id}
                        style={{
                          padding: 16,
                          border: isEditing ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 15 }}>{v.storage}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            {lang === 'ar' ? v.colorAr : v.color}
                          </span>
                        </div>

                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                            <input
                              type="number"
                              className="form-control"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              style={{ padding: '6px 10px', fontSize: 14, fontWeight: 700 }}
                              autoFocus
                            />
                            <button
                              onClick={() => savePrice(v.id)}
                              disabled={savingPrice}
                              className="btn btn-primary btn-sm"
                            >
                              {savingPrice ? '...' : '✓'}
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="btn btn-ghost btn-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <div>
                              <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 16 }}>
                                {v.price.toLocaleString()} {t.currency}
                              </span>
                            </div>
                            <button
                              onClick={() => startEditPrice(v)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '4px 10px' }}
                            >
                              ✏️ {lang === 'ar' ? 'تعديل السعر' : 'Edit'}
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 4 }}>
                          <span>{t.admin.inventory.available}: <strong>{v.availableStock}</strong></span>
                          <span>{t.admin.inventory.reserved}: <strong>{v.inventory?.reservedStock || 0}</strong></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
