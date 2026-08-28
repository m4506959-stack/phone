'use client'

import React, { useState, useEffect } from 'react'

interface PhoneBackProps {
  colorHex: string
  colorName: string
  modelId: string
}

// Exact 4-color palette matching the leaked dummy units
const COLOR_SPECS: Record<string, { upper: string; lower: string; accent: string; frame: string }> = {
  'Space Black': {
    upper: '#18191c',
    lower: '#26272b',
    accent: '#3f4148',
    frame: '#1f2024',
  },
  'Sky Blue': {
    upper: '#6a96c3',
    lower: '#7faadc',
    accent: '#a5c7eb',
    frame: '#608ab6',
  },
  'Deep Plum': {
    upper: '#4e1f3a',
    lower: '#622749',
    accent: '#8d3e6c',
    frame: '#441832',
  },
  'Titanium Gray': {
    upper: '#9fa3a8',
    lower: '#b2b7bd',
    accent: '#d1d6dc',
    frame: '#8e9297',
  },
}

export default function PhoneBackShowcase({ colorHex, colorName, modelId }: PhoneBackProps) {
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

  // Resolve color palette spec
  const spec = COLOR_SPECS[colorName] || {
    upper: colorHex,
    lower: colorHex,
    accent: '#ffffff',
    frame: colorHex,
  }

  // 3D tilt calculation
  const tiltX = (mousePos.y - 0.5) * -10
  const tiltY = (mousePos.x - 0.5) * 12

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
      }}
    >
      <div
        style={{
          width: '260px',
          maxWidth: '85vw',
          height: '520px',
          maxHeight: '55vh',
          position: 'relative',
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.12s ease-out',
          transformStyle: 'preserve-3d',
          filter: `drop-shadow(0 25px 45px rgba(0,0,0,0.85)) drop-shadow(0 0 40px color-mix(in srgb, ${spec.lower} 40%, transparent))`,
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
            {/* Outer Titanium Chamfer Frame */}
            <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7" />
              <stop offset="25%" stop-color={spec.frame} />
              <stop offset="50%" stop-color="#141416" />
              <stop offset="75%" stop-color={spec.frame} />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.4" />
            </linearGradient>

            {/* Upper Visor Island Gradient */}
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color={spec.accent} stop-opacity="0.6" />
              <stop offset="30%" stop-color={spec.upper} />
              <stop offset="100%" stop-color={spec.upper} />
            </linearGradient>

            {/* Lower Main Frosted Glass Back */}
            <linearGradient id="lowerBackGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color={spec.lower} />
              <stop offset="70%" stop-color={spec.lower} />
              <stop offset="100%" stop-color={spec.upper} stop-opacity="0.9" />
            </linearGradient>

            {/* Dynamic Specular Sheen from mouse */}
            <radialGradient id="specularGlow" cx={`${mousePos.x * 100}%`} cy={`${mousePos.y * 100}%`} r="60%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
              <stop offset="45%" stop-color="#ffffff" stop-opacity="0.05" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>

            {/* Lens Outer Metallic Ring */}
            <linearGradient id="lensRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#2a2b30" />
              <stop offset="100%" stop-color={spec.upper} />
            </linearGradient>

            {/* Sapphire Optics Dark Glass */}
            <radialGradient id="opticsGlass" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#223048" />
              <stop offset="40%" stop-color="#0b101c" />
              <stop offset="85%" stop-color="#000000" />
            </radialGradient>

            {/* Apple Logo Specular */}
            <linearGradient id="appleLogo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
              <stop offset="50%" stop-color={spec.upper} stop-opacity="0.9" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.25" />
            </linearGradient>

            {/* Visor Shadow */}
            <filter id="visorShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.5" />
            </filter>
          </defs>

          {/* ===== 1. OUTER TITANIUM FRAME ===== */}
          <rect
            x="6"
            y="6"
            width="408"
            height="828"
            rx="64"
            fill="url(#frameGradient)"
            stroke="rgba(255,255,255,0.4)"
            stroke-width="1.5"
          />

          {/* Frame Inner Inset Bevel */}
          <rect
            x="10"
            y="10"
            width="400"
            height="820"
            rx="60"
            fill={spec.frame}
          />

          {/* ===== 2. UPPER HORIZONTAL CAMERA VISOR (EXACT LEAK DESIGN) ===== */}
          <g filter="url(#visorShadow)">
            <rect
              x="16"
              y="16"
              width="388"
              height="250"
              rx="54"
              fill="url(#visorGrad)"
              stroke="rgba(255,255,255,0.3)"
              stroke-width="1.2"
            />
          </g>

          {/* ===== 3. LOWER FROSTED GLASS REAR PANEL (EXACT LEAK DESIGN) ===== */}
          <rect
            x="16"
            y="278"
            width="388"
            height="546"
            rx="52"
            fill="url(#lowerBackGrad)"
            stroke="rgba(255,255,255,0.18)"
            stroke-width="1.2"
          />

          {/* Frosted specular mouse sheen */}
          <rect
            x="16"
            y="278"
            width="388"
            height="546"
            rx="52"
            fill="url(#specularGlow)"
            style={{ mixBlendMode: 'overlay' }}
          />

          {/* ===== 4. CENTERED APPLE LOGO ON LOWER PANEL ===== */}
          <g transform="translate(182, 490) scale(1.4)" opacity="0.85">
            {/* Apple Leaf */}
            <path
              d="M 18.5 0.5 C 21.2 3.8 19.8 8.4 16.5 10.2 C 15.2 6.8 17.1 2.2 18.5 0.5 Z"
              fill="url(#appleLogo)"
            />
            {/* Apple Body */}
            <path
              d="M 23.2 12.8 C 20.2 14.6 18.4 18.2 19.7 21.8 C 21.2 25.4 24.2 26.6 24.2 26.6 C 24.2 26.6 22.2 32.5 17.8 32.5 C 15.6 32.5 13.9 31.1 11.8 31.1 C 9.6 31.1 7.6 32.5 5.6 32.5 C 1.6 32.5 0 25.8 0 21.4 C 0 14.3 4.5 10.5 8.9 10.5 C 11.5 10.5 13.5 12.1 15.1 12.1 C 16.6 12.1 18.8 10.5 21.7 10.5 C 22.8 10.5 25.6 10.8 27.2 12.8 C 26.8 13.2 23.6 15.2 23.2 12.8 Z"
              fill="url(#appleLogo)"
            />
          </g>

          {/* ===== 5. THREE CAMERAS (LEFT TRIANGLE) + FLASH & SENSORS (RIGHT) ===== */}
          
          {/* LENS 1: Top Left */}
          <g>
            <circle cx="82" cy="85" r="36" fill="url(#lensRingGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
            <circle cx="82" cy="85" r="29" fill="url(#opticsGlass)" stroke="#000" stroke-width="2" />
            <circle cx="82" cy="85" r="14" fill="#0284c7" opacity="0.3" />
            <circle cx="75" cy="78" r="5.5" fill="#ffffff" opacity="0.8" />
          </g>

          {/* LENS 2: Bottom Left */}
          <g>
            <circle cx="82" cy="180" r="36" fill="url(#lensRingGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
            <circle cx="82" cy="180" r="29" fill="url(#opticsGlass)" stroke="#000" stroke-width="2" />
            <circle cx="82" cy="180" r="14" fill="#0284c7" opacity="0.3" />
            <circle cx="75" cy="173" r="5.5" fill="#ffffff" opacity="0.8" />
          </g>

          {/* LENS 3: Center Left Offset */}
          <g>
            <circle cx="172" cy="132" r="36" fill="url(#lensRingGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
            <circle cx="172" cy="132" r="29" fill="url(#opticsGlass)" stroke="#000" stroke-width="2" />
            <circle cx="172" cy="132" r="14" fill="#0284c7" opacity="0.3" />
            <circle cx="165" cy="125" r="5.5" fill="#ffffff" opacity="0.8" />
          </g>

          {/* True Tone Quad Flash (Top Right) */}
          <g>
            <circle cx="340" cy="85" r="15" fill="#ffffff" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
            <circle cx="340" cy="85" r="9" fill="#fef08a" />
            <circle cx="340" cy="85" r="4" fill="#ffffff" />
          </g>

          {/* LiDAR / Sensor Window (Bottom Right) */}
          <g>
            <circle cx="340" cy="180" r="14" fill="#000000" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" />
            <circle cx="340" cy="180" r="8" fill="#18181b" />
            <circle cx="338" cy="178" r="2.5" fill="#6366f1" opacity="0.6" />
          </g>

          {/* Mic Hole */}
          <circle cx="340" cy="132" r="3.5" fill="#000000" />
        </svg>
      </div>
    </div>
  )
}
