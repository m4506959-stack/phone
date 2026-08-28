'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface GalaxyProps {
  themeColor?: string
}

export default function GalaxyBackground({ themeColor = '#0070f3' }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x02040a, 0.0012)

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 25, 45)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // ==========================================
    // 1. SPIRAL GALAXY GENERATION (Logarithmic)
    // ==========================================
    const parameters = {
      count: 45000,
      size: 0.018,
      radius: 35,
      branches: 4,
      spin: 1.2,
      randomness: 0.55,
      power: 3.5,
      insideColor: '#38bdf8',
      midColor: '#818cf8',
      outsideColor: '#c084fc',
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorMid = new THREE.Color(parameters.midColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for (let i = 0; i < parameters.count; i++) {
      // Position calculation
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
        radius
      const randomZ =
        Math.pow(Math.random(), parameters.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

      // Color interpolation across radius
      let mixedColor = colorInside.clone()
      const ratio = radius / parameters.radius
      if (ratio < 0.35) {
        mixedColor.lerp(colorMid, ratio / 0.35)
      } else {
        mixedColor = colorMid.clone().lerp(colorOutside, (ratio - 0.35) / 0.65)
      }

      // Core brightness boost
      if (ratio < 0.1) {
        mixedColor.addScalar(0.4)
      }

      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b

      scales[i] = Math.random() * 1.5 + 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))

    // Create Circular Star Particle Texture
    const createStarTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
      grad.addColorStop(0.2, 'rgba(240, 250, 255, 0.8)')
      grad.addColorStop(0.5, 'rgba(100, 180, 255, 0.25)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(canvas)
    }

    const starTexture = createStarTexture()

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
    galaxy.rotation.x = 0.45
    scene.add(galaxy)

    // ==========================================
    // 2. BACKGROUND COSMIC STARFIELD & NEBULA
    // ==========================================
    const bgStarCount = 2500
    const bgGeometry = new THREE.BufferGeometry()
    const bgPositions = new Float32Array(bgStarCount * 3)
    const bgColors = new Float32Array(bgStarCount * 3)

    for (let i = 0; i < bgStarCount; i++) {
      const i3 = i * 3
      bgPositions[i3] = (Math.random() - 0.5) * 300
      bgPositions[i3 + 1] = (Math.random() - 0.5) * 300
      bgPositions[i3 + 2] = (Math.random() - 0.5) * 300

      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6 + Math.random() * 0.4)
      bgColors[i3] = c.r
      bgColors[i3 + 1] = c.g
      bgColors[i3 + 2] = c.b
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3))
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3))

    const bgMaterial = new THREE.PointsMaterial({
      size: 0.18,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      opacity: 0.75,
    })

    const bgStars = new THREE.Points(bgGeometry, bgMaterial)
    scene.add(bgStars)

    // ==========================================
    // 3. SHOOTING METEORS (Cosmic Streaks)
    // ==========================================
    const meteors: Array<{
      mesh: THREE.Line
      velocity: THREE.Vector3
      life: number
      maxLife: number
    }> = []

    const createMeteor = () => {
      const lineGeo = new THREE.BufferGeometry()
      const startX = (Math.random() - 0.5) * 60
      const startY = 15 + Math.random() * 15
      const startZ = (Math.random() - 0.5) * 40
      const points = [
        new THREE.Vector3(startX, startY, startZ),
        new THREE.Vector3(startX - 4, startY - 2.5, startZ - 2),
      ]
      lineGeo.setFromPoints(points)

      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#38bdf8'),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })

      const line = new THREE.Line(lineGeo, lineMat)
      scene.add(line)

      meteors.push({
        mesh: line,
        velocity: new THREE.Vector3(-0.9 - Math.random() * 0.6, -0.6 - Math.random() * 0.4, -0.4),
        life: 0,
        maxLife: 45 + Math.random() * 30,
      })
    }

    // ==========================================
    // 4. MOUSE PHYSICS & INTERACTION
    // ==========================================
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    }

    const onMouseMove = (event: MouseEvent) => {
      mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2
      mouse.targetY = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', onResize)

    // ==========================================
    // 5. ANIMATION LOOP
    // ==========================================
    const clock = new THREE.Clock()
    let frameId: number
    let meteorTimer = 0

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      // Smooth inertia mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.04
      mouse.y += (mouse.targetY - mouse.y) * 0.04

      // Rotate Galaxy
      galaxy.rotation.y = elapsedTime * 0.05
      galaxy.rotation.z = Math.sin(elapsedTime * 0.1) * 0.04

      // Camera 3D response to cursor
      camera.position.x = mouse.x * 12
      camera.position.y = 25 - mouse.y * 8
      camera.position.z = 45 + mouse.y * 5
      camera.lookAt(mouse.x * 2, 0, mouse.y * 2)

      // Background stars slow drift
      bgStars.rotation.y = -elapsedTime * 0.015

      // Spawn meteors periodically
      meteorTimer++
      if (meteorTimer > 180 && Math.random() < 0.04) {
        createMeteor()
        meteorTimer = 0
      }

      // Update meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        m.life++
        m.mesh.position.add(m.velocity)
        const mat = m.mesh.material as THREE.LineBasicMaterial
        mat.opacity = 1 - m.life / m.maxLife

        if (m.life >= m.maxLife) {
          scene.remove(m.mesh)
          m.mesh.geometry.dispose()
          mat.dispose()
          meteors.splice(i, 1)
        }
      }

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
