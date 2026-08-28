'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface GalaxyProps {
  themeColor?: string
}

export default function GalaxyBackground({ themeColor = '#7FAADC' }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030306, 0.0008)

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    )
    camera.position.set(0, 32, 58)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Base color resolution from themeColor
    const activeColor = new THREE.Color(themeColor || '#7FAADC')
    const primaryColor = activeColor.clone()
    const coreColor = activeColor.clone().addScalar(0.4)
    const rimColor = activeColor.clone().offsetHSL(0.08, 0.2, -0.1)

    // ==========================================
    // 1. GRAND SPIRAL GALAXY GENERATION
    // ==========================================
    const parameters = {
      count: 65000,
      size: 0.022,
      radius: 48,
      branches: 5,
      spin: 1.4,
      randomness: 0.65,
      power: 3.8,
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count)

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3
      const radius = Math.random() * parameters.radius
      const spinAngle = radius * parameters.spin
      const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2

      const randomX =
        Math.pow(Math.random(), parameters.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius
      const randomY =
        Math.pow(Math.random(), parameters.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius *
        0.5
      const randomZ =
        Math.pow(Math.random(), parameters.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

      // Dynamic color interpolation
      let mixedColor = coreColor.clone()
      const ratio = radius / parameters.radius
      if (ratio < 0.3) {
        mixedColor.lerp(primaryColor, ratio / 0.3)
      } else {
        mixedColor = primaryColor.clone().lerp(rimColor, (ratio - 0.3) / 0.7)
      }

      if (ratio < 0.12) {
        mixedColor.addScalar(0.5) // Super bright cosmic core
      }

      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b

      scales[i] = Math.random() * 1.8 + 0.4
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))

    // High quality soft glowing circular star texture
    const createGlowTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 128
      const ctx = canvas.getContext('2d')!
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
      grad.addColorStop(0.15, 'rgba(255, 255, 255, 0.9)')
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)')
      grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.06)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(canvas)
    }

    const starTexture = createGlowTexture()

    const material = new THREE.PointsMaterial({
      size: parameters.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: starTexture,
      transparent: true,
    })

    const galaxy = new THREE.Points(geometry, material)
    galaxy.rotation.x = 0.48
    scene.add(galaxy)

    // ==========================================
    // 2. COSMIC NEBULA AURA CLOUDS
    // ==========================================
    const nebulaGeo = new THREE.SphereGeometry(18, 32, 32)
    const nebulaMat = new THREE.MeshBasicMaterial({
      color: activeColor,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
    const nebulaCore = new THREE.Mesh(nebulaGeo, nebulaMat)
    scene.add(nebulaCore)

    // Outer Starfield
    const bgStarCount = 8000
    const bgPositions = new Float32Array(bgStarCount * 3)
    for (let i = 0; i < bgStarCount * 3; i += 3) {
      bgPositions[i] = (Math.random() - 0.5) * 400
      bgPositions[i + 1] = (Math.random() - 0.5) * 400
      bgPositions[i + 2] = (Math.random() - 0.5) * 400
    }
    const bgGeometry = new THREE.BufferGeometry()
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3))
    const bgMaterial = new THREE.PointsMaterial({
      size: 0.06,
      sizeAttenuation: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      map: starTexture,
      blending: THREE.AdditiveBlending,
    })
    const bgStars = new THREE.Points(bgGeometry, bgMaterial)
    scene.add(bgStars)

    // ==========================================
    // 3. MOUSE INTERACTION & PHYSICS
    // ==========================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const onMouseMove = (event: MouseEvent) => {
      mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2
      mouse.targetY = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', onResize)

    // ==========================================
    // 4. ANIMATION LOOP
    // ==========================================
    const clock = new THREE.Clock()
    let frameId: number

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      mouse.x += (mouse.targetX - mouse.x) * 0.045
      mouse.y += (mouse.targetY - mouse.y) * 0.045

      galaxy.rotation.y = elapsedTime * 0.045
      galaxy.rotation.z = Math.sin(elapsedTime * 0.08) * 0.05

      camera.position.x = mouse.x * 14
      camera.position.y = 32 - mouse.y * 10
      camera.position.z = 58 + mouse.y * 6
      camera.lookAt(mouse.x * 3, 0, mouse.y * 3)

      nebulaCore.scale.setScalar(1 + Math.sin(elapsedTime * 0.6) * 0.08)
      bgStars.rotation.y = -elapsedTime * 0.01

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameId)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      starTexture.dispose()
      bgGeometry.dispose()
      bgMaterial.dispose()
      nebulaGeo.dispose()
      nebulaMat.dispose()
      renderer.dispose()
    }
  }, [themeColor])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    />
  )
}
