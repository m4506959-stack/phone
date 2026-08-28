'use client'

import { useState, useEffect, Suspense } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/contexts/toast-context'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import styles from './reserve.module.css'

interface Variant {
  id: string
  storage: string
  color: string
  colorAr: string
  price: number
  availableStock: number
  inventory: { totalStock: number; reservedStock: number; completedStock: number } | null
}

interface Product {
  id: string
  name: string
  nameAr: string
  images: string
  variants: Variant[]
}

type Step = 'select' | 'form' | 'confirm'

interface FormData {
  fullName: string
  phone: string
  email: string
  city: string
  area: string
  deliveryMethod: 'PICKUP' | 'DELIVERY'
  notes: string
}

interface ReservationResult {
  reservationCode: string
  token: string
  totalAmount: number
}

const COLOR_HEX_MAP: Record<string, string> = {
  'Space Black':    '#26272B',
  'Sky Blue':       '#7FAADC',
  'Deep Plum':      '#622749',
  'Titanium Gray':  '#B2B7BD',
}

function ReservePageInner() {
  const { t, lang } = useI18n()
  const { showToast } = useToast()
  const searchParams = useSearchParams()

  const queryProduct = searchParams.get('product') || 'iphone-18-pro-max'
  const queryStorage = searchParams.get('storage') || ''
  const queryColor = searchParams.get('color') || ''

  const [step, setStep] = useState<Step>('select')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState<string>(queryProduct)
  const [selectedStorage, setSelectedStorage] = useState<string>(queryStorage)
  const [selectedColor, setSelectedColor] = useState<string>(queryColor)
  const [quantity, setQuantity] = useState(1)

  // Form state
  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    city: 'طرابلس',
    area: '',
    deliveryMethod: 'PICKUP',
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Result
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data)
          const targetProduct = data.find((p) => p.id === queryProduct) || data[0]
          setSelectedProductId(targetProduct.id)

          const firstStorage = queryStorage && targetProduct.variants.some((v) => v.storage === queryStorage)
            ? queryStorage
            : targetProduct.variants[0]?.storage || ''
          setSelectedStorage(firstStorage)

          const firstColor = queryColor && targetProduct.variants.some((v) => v.color === queryColor)
            ? queryColor
            : targetProduct.variants[0]?.color || ''
          setSelectedColor(firstColor)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [queryProduct, queryStorage, queryColor])

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0]

  const storageOptions = Array.from(
    new Set(currentProduct?.variants.map((v) => v.storage) || [])
  )

  const colorOptions = Array.from(
    new Set(currentProduct?.variants.map((v) => v.color) || [])
  ).map((c) => {
    const v = currentProduct?.variants.find((item) => item.color === c)
    return { name: c, nameAr: v?.colorAr || c, hex: COLOR_HEX_MAP[c] || '#888' }
  })

  const selectedVariant = currentProduct?.variants.find(
    (v) => v.storage === selectedStorage && v.color === selectedColor
  )

  const handleProductChange = (id: string) => {
    setSelectedProductId(id)
    const prod = products.find((p) => p.id === id)
    if (prod && prod.variants.length > 0) {
      setSelectedStorage(prod.variants[0].storage)
      setSelectedColor(prod.variants[0].color)
    }
  }

  const validateForm = () => {
    const errs: Partial<FormData> = {}
    if (!form.fullName.trim()) errs.fullName = t.required
    if (!form.phone.trim() || form.phone.length < 7) errs.phone = t.invalidPhone
    if (!form.email.trim() || !form.email.includes('@')) errs.email = t.invalidEmail
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!selectedVariant) return
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || t.errors.serverError, 'error')
        return
      }
      setResult(data)

      // Generate QR Code
      const baseUrl = window.location.origin
      const qrUrl = `${baseUrl}/track?token=${data.token}`
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 220, margin: 1 })
      setQrDataUrl(dataUrl)

      setStep('confirm')
    } catch {
      showToast(t.errors.serverError, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = step === 'select' ? 0 : step === 'form' ? 1 : 2

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCenter}>
          <div className="skeleton" style={{ width: 320, height: 260, borderRadius: 20 }} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.backBtn}>
            {lang === 'ar' ? '← العودة للمتجر' : '← Back to Store'}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={styles.headerTitle}>{lang === 'ar' ? 'حجز مسبق رسمي' : 'Official Pre-Order'}</span>
          </div>
          <div />
        </div>
      </header>

      <div className={`container-sm ${styles.content}`}>
        {/* Step Indicator */}
        <div className={styles.steps}>
          {[
            { num: 1, label: lang === 'ar' ? 'تخصيص الجهاز' : 'Customization' },
            { num: 2, label: lang === 'ar' ? 'بيانات الاستلام' : 'Contact & Pickup' },
            { num: 3, label: lang === 'ar' ? 'تأكيد الحجز و QR' : 'Confirmation' },
          ].map((s, i) => (
            <div key={i} className={`${styles.step} ${i <= stepIndex ? styles.stepActive : ''} ${i < stepIndex ? styles.stepDone : ''}`}>
              <div className={styles.stepCircle}>{i < stepIndex ? '✓' : s.num}</div>
              <span className={styles.stepLabel}>{s.label}</span>
              {i < 2 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* Step 1: Model & Variant Customization */}
        {step === 'select' && (
          <div className={styles.stepContent}>
            <div className="card" style={{ padding: '30px' }}>
              <div style={{ marginBottom: 24 }}>
                <span className="badge badge-info" style={{ marginBottom: 8 }}>
                  {lang === 'ar' ? 'الخطوة الأولى' : 'Step 1'}
                </span>
                <h2 className={styles.sectionTitle}>
                  {lang === 'ar' ? 'اختر الطراز والمواصفات' : 'Select Model & Specifications'}
                </h2>
              </div>

              {/* Model Select Buttons */}
              <div className={styles.optionGroup}>
                <p className={styles.optionLabel}>{lang === 'ar' ? 'الطراز' : 'Model'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {products.map((p) => {
                    const active = p.id === selectedProductId
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleProductChange(p.id)}
                        className={`${styles.optionBtn} ${active ? styles.optionSelected : ''}`}
                        style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)' }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 15 }}>
                          {lang === 'ar' ? p.nameAr : p.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Storage Select */}
              <div className={styles.optionGroup}>
                <p className={styles.optionLabel}>{t.product.selectStorage}</p>
                <div className={styles.optionGrid}>
                  {storageOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStorage(s)}
                      className={`${styles.optionBtn} ${selectedStorage === s ? styles.optionSelected : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Select */}
              <div className={styles.optionGroup}>
                <p className={styles.optionLabel}>{t.product.selectColor}</p>
                <div className={styles.optionGrid}>
                  {colorOptions.map((c) => {
                    const active = c.name === selectedColor
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`${styles.optionBtn} ${active ? styles.optionSelected : ''}`}
                      >
                        <span className={styles.colorDot} style={{ background: c.hex }} />
                        <span>{lang === 'ar' ? c.nameAr : c.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div className={styles.optionGroup}>
                <p className={styles.optionLabel}>{t.product.selectQuantity}</p>
                <div className={styles.quantityRow}>
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="btn btn-secondary btn-icon">−</button>
                  <span className={styles.quantityVal}>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(2, q + 1))} className="btn btn-secondary btn-icon">+</button>
                </div>
                <p className={styles.optionHint}>{t.product.max}: 2 {lang === 'ar' ? 'أجهزة لكل عميل' : 'devices per customer'}</p>
              </div>

              {/* Selection Summary Box */}
              {selectedVariant && (
                <div className={styles.summaryCard} style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
                        {lang === 'ar' ? currentProduct?.nameAr : currentProduct?.name}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {selectedStorage} • {lang === 'ar' ? selectedVariant.colorAr : selectedVariant.color} • {quantity}x
                      </p>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text-primary)' }}>
                        {(selectedVariant.price * quantity).toLocaleString()} {t.currency}
                      </p>
                      <span className="badge badge-ready" style={{ fontSize: 11 }}>
                        {lang === 'ar' ? 'متوفر للحجز' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('form')}
                disabled={!selectedVariant}
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 24 }}
              >
                {lang === 'ar' ? 'متابعة لإدخال البيانات ←' : 'Continue to Contact Details →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contact Form */}
        {step === 'form' && (
          <div className={styles.stepContent}>
            <div className="card" style={{ padding: '30px' }}>
              <div style={{ marginBottom: 24 }}>
                <span className="badge badge-info" style={{ marginBottom: 8 }}>
                  {lang === 'ar' ? 'الخطوة الثانية' : 'Step 2'}
                </span>
                <h2 className={styles.sectionTitle}>{t.form.title}</h2>
              </div>

              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">{t.form.fullName}<span className="required">*</span></label>
                  <input
                    className={`form-control ${errors.fullName ? 'error' : ''}`}
                    placeholder={lang === 'ar' ? 'الاسم الثلاثي' : 'Full Name'}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                  {errors.fullName && <p className="form-error">{errors.fullName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t.form.phone}<span className="required">*</span></label>
                  <input
                    className={`form-control ${errors.phone ? 'error' : ''}`}
                    placeholder="091XXXXXXX / 092XXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    dir="ltr"
                  />
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t.form.email}<span className="required">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    placeholder="example@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    dir="ltr"
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                  <p className="form-hint">{t.form.emailNote}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.form.city}</label>
                  <select
                    className="form-control"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  >
                    <option value="طرابلس">طرابلس (Tripoli)</option>
                    <option value="بنغازي">بنغازي (Benghazi)</option>
                    <option value="مصراتة">مصراتة (Misrata)</option>
                    <option value="الزاوية">الزاوية (Zawiya)</option>
                    <option value="زليتن">زليتن (Zliten)</option>
                    <option value="البيضاء">البيضاء (Bayda)</option>
                    <option value="طبرق">طبرق (Tobruk)</option>
                    <option value="سبها">سبها (Sabha)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.form.area}</label>
                  <input
                    className="form-control"
                    placeholder={lang === 'ar' ? 'المنطقة / الشارع' : 'District / Street'}
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t.form.deliveryMethod}</label>
                  <div className={styles.deliveryOptions}>
                    {(['PICKUP', 'DELIVERY'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, deliveryMethod: opt })}
                        className={`${styles.deliveryBtn} ${form.deliveryMethod === opt ? styles.deliverySelected : ''}`}
                      >
                        <span>{opt === 'PICKUP' ? (lang === 'ar' ? 'استلام من أحد الفروع' : 'Store Pickup') : (lang === 'ar' ? 'توصيل للمنزل' : 'Home Delivery')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t.form.notes}</label>
                  <textarea
                    className="form-control"
                    placeholder={lang === 'ar' ? 'أي تعليمات أو ملاحظات إضافية...' : 'Any extra instructions...'}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setStep('select')} className="btn btn-secondary">
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                >
                  {submitting ? (lang === 'ar' ? 'جاري تأكيد الحجز...' : 'Processing...') : (lang === 'ar' ? 'تأكيد الحجز النهائي' : 'Complete Reservation')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation with QR */}
        {step === 'confirm' && result && (
          <div className={styles.stepContent}>
            <div className={`card ${styles.confirmCard}`} style={{ padding: '40px 30px' }}>
              <h2 className={styles.confirmTitle}>{t.confirmation.title}</h2>
              <p className={styles.confirmSubtitle}>
                {lang === 'ar'
                  ? 'تم تسجيل طلب حجزك بنجاح وحجز الجهاز في المخزون.'
                  : 'Your pre-order is confirmed and stock has been securely reserved.'}
              </p>

              <div className={styles.tokenBox}>
                <p className={styles.tokenLabel}>{t.confirmation.reservationNumber}</p>
                <p className={styles.tokenCode}>#{result.reservationCode}</p>
                <div className={styles.divider} />
                <p className={styles.tokenLabel}>{t.confirmation.trackingToken}</p>
                <p className={styles.tokenValue}>{result.token}</p>
                <p className={styles.tokenHint}>{t.confirmation.saveToken}</p>
              </div>

              {qrDataUrl && (
                <div className={styles.qrSection}>
                  <p className={styles.qrTitle}>{t.confirmation.qrTitle}</p>
                  <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
                  <p className={styles.qrNote}>{t.confirmation.qrNote}</p>
                </div>
              )}

              <div className={styles.emailNote}>
                {t.confirmation.emailSent} ({form.email})
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, flexDirection: 'column' }}>
                <Link href={`/track?token=${result.token}`} className="btn btn-primary btn-lg w-full">
                  {t.confirmation.trackReservation} →
                </Link>
                <Link href="/" className="btn btn-ghost w-full">
                  {lang === 'ar' ? 'العودة للرئيسية' : 'Return to Home'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReservePage() {
  return (
    <Suspense>
      <ReservePageInner />
    </Suspense>
  )
}
