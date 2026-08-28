'use client'

import React, { useState, useEffect } from 'react'

interface PhoneFrontProps {
  colorHex: string
  colorName: string
  modelId: string
}

// Color-specific OLED wallpaper glow & theme configurations
const SCREEN_THEMES: Record<string, {
  primary: string
  secondary: string
  accent: string
  ambientGlow: string
  tagline: string
}> = {
  'Space Black': {
    primary: '#1c1d22',
    secondary: '#383a42',
    accent: '#8b8f9a',
    ambientGlow: 'rgba(56, 58, 66, 0.5)',
    tagline: 'TITANIUM BLACK • OLED PRO',
  },
  'Sky Blue': {
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    accent: '#93c5fd',
    ambientGlow: 'rgba(56, 189, 248, 0.65)',
    tagline: 'SKY BLUE • SUPER RETINA XDR',
  },
  'Henna Crimson': {
    primary: '#6b1a26',
    secondary: '#9e2639',
    accent: '#f87171',
    ambientGlow: 'rgba(158, 38, 57, 0.7)',
    tagline: 'HENNA CRIMSON • TITANIUM PRO',
  },
  'Deep Plum': {
    primary: '#6b1a26',
    secondary: '#9e2639',
    accent: '#f87171',
    ambientGlow: 'rgba(158, 38, 57, 0.7)',
    tagline: 'HENNA CRIMSON • TITANIUM PRO',
  },
  'Titanium Gray': {
    primary: '#64748b',
    secondary: '#94a3b8',
    accent: '#e2e8f0',
    ambientGlow: 'rgba(148, 163, 184, 0.6)',
    tagline: 'NATURAL TITANIUM • A19 PRO',
  },
}

export default function PhoneFrontShowcase({ colorHex, colorName, modelId }: PhoneFrontProps) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const theme = SCREEN_THEMES[colorName] || {
    primary: colorHex,
    secondary: colorHex,
    accent: '#ffffff',
    ambientGlow: `color-mix(in srgb, ${colorHex} 60%, transparent)`,
    tagline: 'IPHONE 18 • APPLE INTELLIGENCE',
  }

  // 3D tilt calculation
  const tiltX = (mousePos.y - 0.5) * -14
  const tiltY = (mousePos.x - 0.5) * 16

  // Specular sheen highlight coordinate
  const glareX = mousePos.x * 100
  const glareY = mousePos.y * 100

  const isPro = modelId.includes('pro')
  const isMax = modelId.includes('max')
  const isAir = modelId.includes('air')

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
      }}
    >
      <div
        style={{
          width: '290px',
          maxWidth: '85vw',
          height: '590px',
          maxHeight: '62vh',
          position: 'relative',
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
          filter: `drop-shadow(0 35px 70px rgba(0,0,0,0.9)) drop-shadow(0 0 60px ${theme.ambientGlow})`,
        }}
      >
        <svg
          viewBox="0 0 420 840"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Outer Grade 5 Titanium Chassis Frame */}
            <linearGradient id="frontFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
              <stop offset="25%" stop-color={colorHex} />
              <stop offset="50%" stop-color="#0f1013" />
              <stop offset="75%" stop-color={colorHex} />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5" />
            </linearGradient>

            {/* Ceramic Shield Glass Bevel */}
            <linearGradient id="bezelGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
              <stop offset="50%" stop-color="rgba(0,0,0,0.9)" />
              <stop offset="100%" stop-color={theme.secondary} stop-opacity="0.4" />
            </linearGradient>

            {/* Apple Keynote Dynamic Aura Screen Wallpaper */}
            <radialGradient id="screenWallpaperCore" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stop-color={theme.secondary} stop-opacity="0.9" />
              <stop offset="40%" stop-color={theme.primary} stop-opacity="0.7" />
              <stop offset="75%" stop-color="#04060c" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#020306" />
            </radialGradient>

            {/* Organic Fluid Light Wave on Screen */}
            <linearGradient id="fluidWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color={theme.accent} stop-opacity="0.85" />
              <stop offset="35%" stop-color={theme.secondary} stop-opacity="0.75" />
              <stop offset="70%" stop-color={theme.primary} stop-opacity="0.5" />
              <stop offset="100%" stop-color="transparent" stop-opacity="0" />
            </linearGradient>

            {/* Dynamic Interactive Glare Sheen from Mouse */}
            <linearGradient id="screenGlare" x1={`${glareX - 40}%`} y1={`${glareY - 40}%`} x2={`${glareX + 60}%`} y2={`${glareY + 60}%`}>
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
              <stop offset="30%" stop-color="#ffffff" stop-opacity="0.05" />
              <stop offset="70%" stop-color="#ffffff" stop-opacity="0" />
            </linearGradient>

            {/* Clip Path for the Screen Content (Rounded Screen Display) */}
            <clipPath id="screenClip">
              <rect x="18" y="18" width="384" height="804" rx="54" />
            </clipPath>
          </defs>

          {/* ===== 1. OUTER CHASSIS TITANIUM FRAME ===== */}
          <rect
            x="6"
            y="6"
            width="408"
            height="828"
            rx="64"
            fill="url(#frontFrameGrad)"
            stroke="rgba(255,255,255,0.4)"
            stroke-width="1.5"
          />

          {/* Frame Inner Chamfer */}
          <rect
            x="10"
            y="10"
            width="400"
            height="820"
            rx="60"
            fill="#08080a"
            stroke="rgba(0,0,0,0.8)"
            stroke-width="1.5"
          />

          {/* Thin Ceramic Shield Glass Bevel Edge */}
          <rect
            x="14"
            y="14"
            width="392"
            height="812"
            rx="56"
            fill="#000000"
            stroke="url(#bezelGlow)"
            stroke-width="1"
          />

          {/* ===== 2. ACTIVE OLED RETINA DISPLAY CONTENT ===== */}
          <g clip-path="url(#screenClip)">
            {/* Screen Deep Space Dark Base */}
            <rect x="18" y="18" width="384" height="804" fill="#030408" />

            {/* Wallpaper Glowing Orb 1 */}
            <circle cx="210" cy="380" r="220" fill="url(#screenWallpaperCore)" opacity="0.85" />

            {/* Wallpaper Glowing Fluid Aura Waves */}
            <path
              d="M 18 280 C 120 220, 280 440, 402 340 L 402 822 L 18 822 Z"
              fill="url(#fluidWaveGrad)"
              opacity="0.75"
            />
            <path
              d="M 18 420 C 150 360, 260 520, 402 460 L 402 822 L 18 822 Z"
              fill={theme.primary}
              opacity="0.4"
            />

            {/* Subtle Abstract Ring Graphics */}
            <circle cx="210" cy="400" r="140" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="4 8" />
            <circle cx="210" cy="400" r="170" stroke={theme.accent} stroke-width="1" opacity="0.3" />

            {/* ===== STATUS BAR TOP ===== */}
            {/* Time (9:41) */}
            <text
              x="54"
              y="58"
              fill="#ffffff"
              font-size="14"
              font-weight="700"
              font-family="-apple-system, system-ui, sans-serif"
              letter-spacing="0.2"
            >
              9:41
            </text>

            {/* Status Icons (5G, WiFi, Battery) */}
            <g transform="translate(325, 46)" fill="#ffffff">
              {/* Signal Bars */}
              <rect x="0" y="8" width="3" height="4" rx="0.8" />
              <rect x="5" y="6" width="3" height="6" rx="0.8" />
              <rect x="10" y="3" width="3" height="9" rx="0.8" />
              <rect x="15" y="0" width="3" height="12" rx="0.8" />
              {/* 5G Text */}
              <text x="22" y="10" font-size="9" font-weight="800" font-family="sans-serif">5G</text>
              {/* Battery */}
              <rect x="40" y="1" width="22" height="11" rx="3" fill="none" stroke="#ffffff" stroke-width="1.2" />
              <rect x="42" y="3" width="15" height="7" rx="1.5" fill="#ffffff" />
              <path d="M 63 4 C 64 4, 64 8, 63 8 Z" fill="#ffffff" />
            </g>

            {/* ===== SCREEN HERO TYPOGRAPHY ===== */}
            <g transform="translate(210, 240)">
              {/* Lock Screen Date */}
              <text
                x="0"
                y="0"
                fill="rgba(255,255,255,0.75)"
                font-size="14"
                font-weight="600"
                font-family="-apple-system, system-ui, 'Cairo', sans-serif"
                text-anchor="middle"
                letter-spacing="0.5"
              >
                Wednesday, September 9
              </text>

              {/* Grand Lock Clock */}
              <text
                x="0"
                y="85"
                fill="#ffffff"
                font-size="82"
                font-weight="800"
                font-family="-apple-system, system-ui, sans-serif"
                text-anchor="middle"
                letter-spacing="-2"
                style={{
                  filter: `drop-shadow(0 0 30px ${theme.secondary})`,
                }}
              >
                09:41
              </text>

              {/* Apple Intelligence Pill Widget */}
              <g transform="translate(-110, 125)">
                <rect
                  x="0"
                  y="0"
                  width="220"
                  height="34"
                  rx="17"
                  fill="rgba(255,255,255,0.12)"
                  stroke="rgba(255,255,255,0.25)"
                  stroke-width="1"
                />
                <text
                  x="110"
                  y="22"
                  fill="#ffffff"
                  font-size="11"
                  font-weight="700"
                  font-family="-apple-system, system-ui, sans-serif"
                  text-anchor="middle"
                  letter-spacing="1"
                >
                  {theme.tagline}
                </text>
              </g>
            </g>

            {/* Lock Screen Action Buttons (Flashlight & Camera) */}
            <g transform="translate(48, 735)">
              <circle cx="20" cy="20" r="22" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
              {/* Flashlight icon */}
              <path d="M 16 12 L 24 12 L 22 18 L 22 28 L 18 28 L 18 18 Z" fill="#ffffff" />
            </g>

            <g transform="translate(332, 735)">
              <circle cx="20" cy="20" r="22" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
              {/* Camera icon */}
              <rect x="12" y="14" width="16" height="12" rx="2" fill="#ffffff" />
              <circle cx="20" cy="20" r="3.5" fill="#000000" />
            </g>

            {/* Home Bar Indicator */}
            <rect x="145" y="795" width="130" height="4.5" rx="2.25" fill="#ffffff" opacity="0.85" />

            {/* Screen Glass Specular Parallax Glare */}
            <rect x="18" y="18" width="384" height="804" fill="url(#screenGlare)" style={{ mixBlendMode: 'screen' }} />
          </g>

          {/* ===== 3. DYNAMIC ISLAND PILL (FLOATING ON TOP) ===== */}
          <g filter="drop-shadow(0 2px 8px rgba(0,0,0,0.8))">
            <rect
              x="145"
              y="28"
              width="130"
              height="36"
              rx="18"
              fill="#000000"
              stroke="rgba(255,255,255,0.15)"
              stroke-width="0.8"
            />
            {/* Front Camera Lens */}
            <circle cx="248" cy="46" r="6" fill="#080c14" stroke="#1f2937" stroke-width="1" />
            <circle cx="248" cy="46" r="2.5" fill="#0284c7" opacity="0.8" />
            <circle cx="247" cy="45" r="1" fill="#ffffff" />

            {/* FaceID / TrueDepth Sensor */}
            <circle cx="168" cy="46" r="4.5" fill="#08080c" />
            <circle cx="168" cy="46" r="2" fill="#4338ca" opacity="0.5" />
          </g>
        </svg>
      </div>
    </div>
  )
}
