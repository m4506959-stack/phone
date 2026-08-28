'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PhoneBackShowcase from '@/components/iphone-back-showcase'
import styles from './home.module.css'

const GalaxyBackground = dynamic(() => import('@/components/galaxy-background'), {
  ssr: false,
})

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
  description: string
  descriptionAr: string
  images: string
  variants: Variant[]
}

interface StoreSettings {
  storeName: string
  storeNameAr: string
  reservationsOpen: boolean
  countdownEnabled: boolean
  countdownEnd: string | null
}

// The 4 exact leaked colors: Space Black | Sky Blue | Deep Plum | Titanium Gray
const COLOR_HEX_MAP: Record<string, string> = {
  'Space Black':    '#26272B',
  'Sky Blue':       '#7FAADC',
  'Deep Plum':      '#622749',
  'Titanium Gray':  '#B2B7BD',
}

// CSS filters for each color
const COLOR_IMAGE_FILTER: Record<string, string> = {
  'Sky Blue':       'brightness(0.92) saturate(1.8) hue-rotate(190deg)',
  'Space Black':    'none',
  'Silver White':   'brightness(1.02) saturate(0.8)',
  'Crimson Berry':  'brightness(0.55) saturate(2.6) hue-rotate(328deg)',
}

// Which base image to use per color
const COLOR_PHONE_IMAGE: Record<string, string> = {
  'Sky Blue':       '/phone-white.jpg',
  'Space Black':    '/phone-black.jpg',
  'Silver White':   '/phone-white.jpg',
  'Crimson Berry':  '/phone-white.jpg',
  'Desert Titanium':'/phone-desert.jpg',
  'Natural Titanium':'/phone-natural.jpg',
  'Black Titanium': '/phone-black.jpg',
  'White Titanium': '/phone-white.jpg',
}

// Apple Keynote Target Date: September 9, 2026 17:00:00 UTC (19:00 Libya Time)
const APPLE_EVENT_DATE = new Date('2026-09-09T17:00:00Z').getTime()

export default function HomePage() {
  const { t, lang, setLang } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string>('iphone-18-pro-max')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedStorage, setSelectedStorage] = useState<string>('')
  const [scrolled, setScrolled] = useState(false)

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Countdown calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = APPLE_EVENT_DATE - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Header scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch products and store settings
  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([prods, sets]) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods)
          setSelectedProductId(prods[0].id)
          if (prods[0].variants?.[0]) {
            setSelectedColor(prods[0].variants[0].color)
            setSelectedStorage(prods[0].variants[0].storage)
          }
        }
        setSettings(sets)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0]

  const handleProductTabChange = useCallback(
    (productId: string) => {
      setSelectedProductId(productId)
      const p = products.find((prod) => prod.id === productId)
      if (p && p.variants.length > 0) {
        setSelectedColor(p.variants[0].color)
        setSelectedStorage(p.variants[0].storage)
      }
    },
    [products]
  )

  const availableColors = Array.from(
    new Set(currentProduct?.variants.map((v) => v.color) || [])
  ).map((c) => {
    const v = currentProduct?.variants.find((item) => item.color === c)
    return { name: c, nameAr: v?.colorAr || c, hex: COLOR_HEX_MAP[c] || '#888' }
  })

  const availableStorages = Array.from(
    new Set(currentProduct?.variants.map((v) => v.storage) || [])
  )

  const currentVariant =
    currentProduct?.variants.find(
      (v) => v.color === selectedColor && v.storage === selectedStorage
    ) || currentProduct?.variants[0]

  const totalModelStock =
    currentProduct?.variants.reduce((s, v) => s + (v.inventory?.totalStock || 0), 0) || 0
  const reservedModelStock =
    currentProduct?.variants.reduce((s, v) => s + (v.inventory?.reservedStock || 0), 0) || 0
  const completedModelStock =
    currentProduct?.variants.reduce((s, v) => s + (v.inventory?.completedStock || 0), 0) || 0
  const availableModelStock = Math.max(0, totalModelStock - reservedModelStock - completedModelStock)
  const minPrice =
    currentProduct?.variants.reduce((min, v) => Math.min(min, v.price), Infinity) || 0

  const activeColorHex = COLOR_HEX_MAP[selectedColor] || '#7A2E22'

  // Model Label for Backdrop Typography
  const modelBackdropText = selectedProductId.includes('pro-max')
    ? 'PRO MAX'
    : selectedProductId.includes('pro')
    ? 'PRO'
    : selectedProductId.includes('air')
    ? 'AIR'
    : '18'

  return (
    <div
      className={styles.page}
      style={{
        ['--theme-color' as any]: activeColorHex,
      }}
    >
      {/* 3D Deep Space WebGL Galaxy */}
      <GalaxyBackground themeColor={activeColorHex} />

      {/* Floating Glassmorphic Top HUD */}
      <header className={`${styles.navBar} ${scrolled ? styles.navBarScrolled : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.brandGroup}>
            <div className={styles.brandBeacon} />
            <span className={styles.brandTitle}>
              {lang === 'ar'
                ? settings?.storeNameAr || 'آيفون 18'
                : settings?.storeName || 'iPhone 18'}
            </span>
            <span className={styles.brandBadge}>
              {lang === 'ar' ? 'ليبيا' : 'Libya'}
            </span>
          </div>

          <div className={styles.navLinks}>
            <Link href="/track" className={styles.navButtonGhost}>
              {t.nav.track}
            </Link>
            <Link href="/admin" className={styles.navButtonGhost}>
              {t.nav.admin}
            </Link>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className={styles.navButtonGhost}
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <Link
              href={`/reserve?product=${selectedProductId}&storage=${selectedStorage}&color=${encodeURIComponent(selectedColor)}`}
              className={styles.navButtonPrimary}
            >
              {t.hero.reserveNow}
            </Link>
          </div>
        </div>
      </header>

      {/* Full-Bleed Apple-style Centered Hero */}
      <main>
        <section className={styles.heroSection}>
          {/* Giant Typographic Backdrop */}
          <div className={styles.giantTypoBackdrop} aria-hidden="true">
            {modelBackdropText}
          </div>

          {/* Top title bar */}
          <div className={styles.heroTopBar}>
            <div className={styles.keynoteTagRow}>
              <div className={styles.eventPill}>
                <span>
                  {lang === 'ar'
                    ? 'الحجز المسبق المعتمد • الدفع عند الاستلام'
                    : 'Official Pre-Order • Cash on Delivery'}
                </span>
              </div>
              <span className={styles.warrantyPill}>
                {lang === 'ar' ? 'ضمان 12 شهر رسمي' : '12-Month Official Warranty'}
              </span>
            </div>
            <h1 className={styles.heroGrandTitle}>
              {lang === 'ar' ? currentProduct?.nameAr : currentProduct?.name}
              <br />
              <span className={styles.heroTitleShimmer}>
                {selectedProductId.includes('pro')
                  ? (lang === 'ar' ? 'تيتانيوم. قمة الإتقان.' : 'Titanium. Mastery Redefined.')
                  : selectedProductId.includes('air')
                  ? (lang === 'ar' ? 'الأنحف. الأخف. الأقوى.' : 'Thinnest. Lightest. Strongest.')
                  : (lang === 'ar' ? 'قوة فائقة. ألوان تسحر.' : 'Powerhouse in Vivid Color.')}
              </span>
            </h1>
          </div>

          {/* ===== CENTERED PHONE HERO (100% Transparent Background, iPhone 17 Styling) ===== */}
          <div className={styles.centeredPhoneStage}>
            <PhoneBackShowcase
              colorHex={activeColorHex}
              colorName={selectedColor}
              modelId={selectedProductId}
            />
          </div>

          {/* ===== CONTROLS PANEL (centered, below phone) ===== */}
          <div className={styles.controlsPanel}>

            {/* Model Switcher */}
            <div className={styles.modelSelectorPills}>
              {products.map((p) => {
                const active = p.id === selectedProductId
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProductTabChange(p.id)}
                    className={`${styles.modelPillBtn} ${active ? styles.modelPillBtnActive : ''}`}
                  >
                    {lang === 'ar' ? p.nameAr : p.name}
                  </button>
                )
              })}
            </div>

            {/* Storage row */}
            <div className={styles.storageSelectionRow}>
              {availableStorages.map((storage) => {
                const active = storage === selectedStorage
                const variantForStorage = currentProduct?.variants.find(
                  (v) => v.storage === storage && v.color === selectedColor
                )
                return (
                  <button
                    key={storage}
                    onClick={() => setSelectedStorage(storage)}
                    className={`${styles.storageCardBtn} ${active ? styles.storageCardBtnActive : ''}`}
                  >
                    <span>{storage}</span>
                    {variantForStorage && (
                      <span className={styles.storagePriceTag}>
                        ({variantForStorage.price.toLocaleString()} {t.currency})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Price + CTA */}
            <div className={styles.actionPriceBlock}>
              <div className={styles.priceGroup}>
                <span className={styles.priceMicroLabel}>{t.hero.startingFrom}</span>
                <div>
                  <span className={styles.priceGrandNumber}>
                    {(currentVariant?.price || minPrice).toLocaleString()}
                  </span>
                  <span className={styles.priceCurrencyLabel}>{t.currency}</span>
                </div>
              </div>

              <Link
                href={`/reserve?product=${selectedProductId}&storage=${selectedStorage}&color=${encodeURIComponent(selectedColor)}`}
                className={styles.orderNowMainBtn}
              >
                <span>{t.hero.reserveNow}</span>
                <span>{lang === 'ar' ? '←' : '→'}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Apple Keynote Official Countdown Bar */}
        <section className={styles.keynoteCountdownBanner}>
          <div className={styles.countdownGlassPanel}>
            <div className={styles.countdownMeta}>
              <span className={styles.countdownOverline}>
                {lang === 'ar' ? 'مؤتمر آبل السنوي' : 'Apple Special Event'}
              </span>
              <h2 className={styles.countdownMainHeading}>
                {lang === 'ar'
                  ? 'الكشف الرسمي عن عائلة iPhone 18'
                  : 'Official iPhone 18 Keynote'}
              </h2>
              <span className={styles.countdownLocationText}>
                {lang === 'ar'
                  ? '9 سبتمبر 2026 — مسرح ستيف جوبز، كوبرتينو'
                  : 'September 9, 2026 — Steve Jobs Theater, Cupertino'}
              </span>
            </div>

            <div className={styles.countdownGrid}>
              <div className={styles.countdownBox}>
                <span className={styles.countdownDigit}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>{lang === 'ar' ? 'يوم' : 'Days'}</span>
              </div>
              <div className={styles.countdownBox}>
                <span className={styles.countdownDigit}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>{lang === 'ar' ? 'ساعة' : 'Hours'}</span>
              </div>
              <div className={styles.countdownBox}>
                <span className={styles.countdownDigit}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>{lang === 'ar' ? 'دقيقة' : 'Mins'}</span>
              </div>
              <div className={styles.countdownBox}>
                <span className={styles.countdownDigit}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>{lang === 'ar' ? 'ثانية' : 'Secs'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Architectural Specs Bento Grid */}
        <section className={styles.bentoSpecsContainer}>
          <div className={styles.specsMainHeading}>
            <span className={styles.specsOverline}>
              {lang === 'ar' ? 'الهندسة التقنية' : 'Next-Gen Architecture'}
            </span>
            <h2 className={styles.specsTitleText}>
              {lang === 'ar' ? 'مواصفات تعيد صياغة المستقبل' : 'Engineered to Perfection'}
            </h2>
          </div>

          <div className={styles.specsBentoGrid}>
            <div className={`${styles.bentoSpecCard} ${styles.bentoCardSpanTwo}`}>
              <span className={styles.bentoIndex}>01 / PERFORMANCE</span>
              <h3 className={styles.bentoHeading}>
                {lang === 'ar' ? 'معالج A19 Pro بمعمارية 2 نانومتر' : 'A19 Pro 2nm Architecture'}
              </h3>
              <p className={styles.bentoDesc}>
                {lang === 'ar'
                  ? 'أقوى معالج تم تصميمه لهاتف ذكي على الإطلاق مع محرك عصبي بـ 16 نواة لمعالجة تقنيات Apple Intelligence الفورية مع استهلاك طاقة هو الأقل تاريخياً.'
                  : 'Unmatched performance with 16-core Neural Engine designed for real-time Apple Intelligence workflows with supreme energy efficiency.'}
              </p>
            </div>

            <div className={styles.bentoSpecCard}>
              <span className={styles.bentoIndex}>02 / MATERIALS</span>
              <h3 className={styles.bentoHeading}>
                {lang === 'ar' ? 'تيتانيوم من الدرجة الخامسة' : 'Grade 5 Aerospace Titanium'}
              </h3>
              <p className={styles.bentoDesc}>
                {lang === 'ar'
                  ? 'سبيكة معدنية معالجة بتقنية PVD المجهرية لمقاومة الخدوش والبصمات بوزن خفيف للغاية.'
                  : 'Ultra-lightweight aerospace alloy with precision PVD finish resisting fingerprints and wear.'}
              </p>
            </div>

            <div className={styles.bentoSpecCard}>
              <span className={styles.bentoIndex}>03 / OPTICS</span>
              <h3 className={styles.bentoHeading}>
                {lang === 'ar' ? 'نظام عدسات بفتحة متغيرة' : 'Variable Aperture Optics'}
              </h3>
              <p className={styles.bentoDesc}>
                {lang === 'ar'
                  ? 'تحكم بصري ميكانيكي حقيقي بعمق الميدان للحصول على لقطات سينمائية نقية وعزل احترافي.'
                  : 'True mechanical aperture control delivering cinema-grade depth of field and low-light clarity.'}
              </p>
            </div>

            <div className={`${styles.bentoSpecCard} ${styles.bentoCardSpanTwo}`}>
              <span className={styles.bentoIndex}>04 / DISPLAY</span>
              <h3 className={styles.bentoHeading}>
                {lang === 'ar' ? 'شاشة Super Retina XDR مع أنحف حواف' : 'Super Retina XDR Display'}
              </h3>
              <p className={styles.bentoDesc}>
                {lang === 'ar'
                  ? 'سطوع قياسي يصل إلى 3000 شمعة وتقنية ProMotion 120Hz التكيفية مع حواف متناهية النحافة لتجربة بصرية غامرة.'
                  : 'Peak brightness up to 3,000 nits, adaptive 120Hz ProMotion, and the slimmest bezels in smartphone history.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className={styles.footerBar}>
        <div className={styles.footerInner}>
          <div>
            {lang === 'ar'
              ? settings?.storeNameAr || 'نظام حجز آيفون 18 الرسمي — ليبيا'
              : settings?.storeName || 'Official iPhone 18 Pre-Order — Libya'}
          </div>
          <div>
            {lang === 'ar'
              ? 'الأسعار بالدينار الليبي (د.ل) • خدمة التوصيل لكافة المدن الليبية'
              : 'All prices in Libyan Dinar (LYD) • Delivery available across Libya'}
          </div>
        </div>
      </footer>
    </div>
  )
}
