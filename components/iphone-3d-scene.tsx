'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Phone3DSceneProps {
  colorHex: string
  modelId: string
  modelName: string
}

export default function Phone3DScene({
  colorHex = '#8B3A2B',
  modelId = 'iphone-18-pro-max',
  modelName = 'PRO',
}: Phone3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const phoneGroupRef = useRef<THREE.Group | null>(null)
  const materialsRef = useRef<{
    titaniumMat?: THREE.MeshStandardMaterial
    plateauMat?: THREE.MeshStandardMaterial
    backGlassMat?: THREE.MeshPhysicalMaterial
    lensRingMat?: THREE.MeshStandardMaterial
    lensGlassMat?: THREE.MeshPhysicalMaterial
    keyLight?: THREE.DirectionalLight
    rimLight?: THREE.PointLight
  }>({})
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const scrollRef = useRef(0)

  // Color updates
  useEffect(() => {
    const hex = new THREE.Color(colorHex)
    if (materialsRef.current.titaniumMat) {
      materialsRef.current.titaniumMat.color = hex
    }
    if (materialsRef.current.plateauMat) {
      materialsRef.current.plateauMat.color = hex.clone().offsetHSL(0, 0.05, -0.02)
    }
    if (materialsRef.current.backGlassMat) {
      materialsRef.current.backGlassMat.color = hex.clone().offsetHSL(0, -0.02, 0.02)
    }
    if (materialsRef.current.lensRingMat) {
      materialsRef.current.lensRingMat.color = hex.clone().offsetHSL(0, 0, -0.1)
    }
    if (materialsRef.current.rimLight) {
      materialsRef.current.rimLight.color = hex.clone().offsetHSL(0, 0.2, 0.15)
    }
  }, [colorHex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 22)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // ==========================================
    // LIGHTING (Studio Key + Warm Dramatic Rim)
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(12, 18, 25)
    keyLight.castShadow = true
    scene.add(keyLight)
    materialsRef.current.keyLight = keyLight

    const baseColor = new THREE.Color(colorHex)
    const rimLight = new THREE.PointLight(baseColor.clone().offsetHSL(0, 0.2, 0.15), 4.5, 60)
    rimLight.position.set(-14, 8, -8)
    scene.add(rimLight)
    materialsRef.current.rimLight = rimLight

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-15, -10, 15)
    scene.add(fillLight)

    const topDownLight = new THREE.SpotLight(0xffffff, 3.0, 40, Math.PI / 4, 0.3)
    topDownLight.position.set(0, 20, 10)
    scene.add(topDownLight)

    // ==========================================
    // 3D IPHONE 18 PRO EXACT LEAK RECONSTRUCTION
    // ==========================================
    const phoneGroup = new THREE.Group()
    phoneGroupRef.current = phoneGroup
    scene.add(phoneGroup)

    const phoneWidth = 7.6
    const phoneHeight = 15.6
    const phoneDepth = 0.78
    const cornerRadius = 1.45

    // Helper: Rounded Rectangle Shape
    const createRoundedShape = (w: number, h: number, r: number) => {
      const shape = new THREE.Shape()
      const x = -w / 2
      const y = -h / 2
      shape.moveTo(x + r, y)
      shape.lineTo(x + w - r, y)
      shape.quadraticCurveTo(x + w, y, x + w, y + r)
      shape.lineTo(x + w, y + h - r)
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      shape.lineTo(x + r, y + h)
      shape.quadraticCurveTo(x, y + h, x, y + h - r)
      shape.lineTo(x, y + r)
      shape.quadraticCurveTo(x, y, x + r, y)
      return shape
    }

    // 1. Titanium Chassis Rail Frame
    const mainShape = createRoundedShape(phoneWidth, phoneHeight, cornerRadius)
    const extrudeSettings = {
      depth: phoneDepth,
      bevelEnabled: true,
      bevelSegments: 16,
      steps: 1,
      bevelSize: 0.14,
      bevelThickness: 0.14,
    }
    const chassisGeo = new THREE.ExtrudeGeometry(mainShape, extrudeSettings)
    chassisGeo.center()

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.94,
      roughness: 0.24,
    })
    materialsRef.current.titaniumMat = titaniumMat

    const chassisMesh = new THREE.Mesh(chassisGeo, titaniumMat)
    phoneGroup.add(chassisMesh)

    // 2. Lower Brushed Back Glass Panel
    const lowerGlassGeo = new THREE.PlaneGeometry(phoneWidth - 0.2, phoneHeight * 0.58)
    const backGlassMat = new THREE.MeshPhysicalMaterial({
      color: baseColor.clone().offsetHSL(0, -0.02, 0.02),
      metalness: 0.25,
      roughness: 0.35,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    })
    materialsRef.current.backGlassMat = backGlassMat

    const lowerGlassMesh = new THREE.Mesh(lowerGlassGeo, backGlassMat)
    lowerGlassMesh.position.set(0, -phoneHeight * 0.18, -(phoneDepth / 2 + 0.15))
    lowerGlassMesh.rotateY(Math.PI)
    phoneGroup.add(lowerGlassMesh)

    // 3. Official Leaked Elevated Top Camera Visor / Plateau
    const plateauWidth = phoneWidth - 0.4
    const plateauHeight = phoneHeight * 0.36
    const plateauRadius = 0.9
    const plateauShape = createRoundedShape(plateauWidth, plateauHeight, plateauRadius)
    const plateauExtrude = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    }
    const plateauGeo = new THREE.ExtrudeGeometry(plateauShape, plateauExtrude)
    plateauGeo.center()

    const plateauMat = new THREE.MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(0, 0.05, -0.02),
      metalness: 0.92,
      roughness: 0.26,
    })
    materialsRef.current.plateauMat = plateauMat

    const plateauMesh = new THREE.Mesh(plateauGeo, plateauMat)
    plateauMesh.position.set(0, phoneHeight * 0.28, -(phoneDepth / 2 + 0.3))
    plateauMesh.rotateY(Math.PI)
    phoneGroup.add(plateauMesh)

    // 4. Triple Optical Camera Lenses (Triangular Arrangement on Left)
    const lensPositions = [
      [-1.8, phoneHeight * 0.36, -(phoneDepth / 2 + 0.55)], // Top Left Main
      [-0.6, phoneHeight * 0.30, -(phoneDepth / 2 + 0.55)], // Center Telephoto
      [-1.8, phoneHeight * 0.22, -(phoneDepth / 2 + 0.55)], // Bottom Left UltraWide
    ]

    const lensRingGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.28, 36)
    lensRingGeo.rotateX(Math.PI / 2)

    const lensRingMat = new THREE.MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(0, 0, -0.1),
      metalness: 0.96,
      roughness: 0.12,
    })
    materialsRef.current.lensRingMat = lensRingMat

    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.8,
      reflectivity: 0.9,
    })
    materialsRef.current.lensGlassMat = lensGlassMat

    lensPositions.forEach((pos) => {
      // Outer Titanium Bevel Ring
      const ring = new THREE.Mesh(lensRingGeo, lensRingMat)
      ring.position.set(pos[0], pos[1], pos[2])
      phoneGroup.add(ring)

      // Inner Sapphire Optical Element
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), lensGlassMat)
      glass.position.set(pos[0], pos[1], pos[2] - 0.15)
      glass.rotateY(Math.PI)
      phoneGroup.add(glass)

      // Inner Aperture Reflection Pupil
      const pupil = new THREE.Mesh(
        new THREE.CircleGeometry(0.24, 32),
        new THREE.MeshBasicMaterial({ color: 0x020308 })
      )
      pupil.position.set(pos[0], pos[1], pos[2] - 0.16)
      pupil.rotateY(Math.PI)
      phoneGroup.add(pupil)
    })

    // 5. TrueTone Flash (Top Right of Plateau)
    const flashGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 28)
    flashGeo.rotateX(Math.PI / 2)
    const flashMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xfffaed,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
    const flashMesh = new THREE.Mesh(flashGeo, flashMat)
    flashMesh.position.set(1.9, phoneHeight * 0.36, -(phoneDepth / 2 + 0.5))
    phoneGroup.add(flashMesh)

    // 6. Microphone Port & LiDAR Scanner (Bottom Right of Plateau)
    const micGeo = new THREE.CircleGeometry(0.08, 16)
    const micMat = new THREE.MeshBasicMaterial({ color: 0x010204 })
    const micMesh = new THREE.Mesh(micGeo, micMat)
    micMesh.position.set(1.9, phoneHeight * 0.29, -(phoneDepth / 2 + 0.52))
    micMesh.rotateY(Math.PI)
    phoneGroup.add(micMesh)

    const lidarGeo = new THREE.CircleGeometry(0.32, 28)
    const lidarMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a101a,
      roughness: 0.1,
      metalness: 0.8,
    })
    const lidarMesh = new THREE.Mesh(lidarGeo, lidarMat)
    lidarMesh.position.set(1.9, phoneHeight * 0.21, -(phoneDepth / 2 + 0.52))
    lidarMesh.rotateY(Math.PI)
    phoneGroup.add(lidarMesh)

    // 7. Apple Logo on Center Back (Embossed Texture)
    const createAppleLogoTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, 512, 512)

      // Draw minimal Apple silhouette
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.beginPath()
      // Stylized Apple shape
      ctx.arc(256, 280, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(256, 170, 25, 45, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()

      return new THREE.CanvasTexture(canvas)
    }

    const logoGeo = new THREE.PlaneGeometry(1.6, 1.6)
    const logoMat = new THREE.MeshBasicMaterial({
      map: createAppleLogoTexture(),
      transparent: true,
      opacity: 0.75,
    })
    const logoMesh = new THREE.Mesh(logoGeo, logoMat)
    logoMesh.position.set(0, -phoneHeight * 0.12, -(phoneDepth / 2 + 0.17))
    logoMesh.rotateY(Math.PI)
    phoneGroup.add(logoMesh)

    // Default angle: Back Facing as shown in the official leak image!
    phoneGroup.rotation.y = Math.PI

    // ==========================================
    // MOUSE & SCROLL INTERACTIVE PHYSICS
    // ==========================================
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      mouseRef.current.targetX = x
      mouseRef.current.targetY = y

      // Dynamically move studio key light to create sweeping metallic highlights
      if (materialsRef.current.keyLight) {
        materialsRef.current.keyLight.position.x = 12 + x * 10
        materialsRef.current.keyLight.position.y = 18 - y * 8
      }
    }

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const time = clock.getElapsedTime()
      const scroll = scrollRef.current

      // Lerp mouse coordinates
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      // Floating breathing motion
      const floatY = Math.sin(time * 1.8) * 0.25

      if (phoneGroupRef.current) {
        phoneGroupRef.current.position.y = floatY

        // 3D Rotation matching the leak angle with interactive mouse tilt
        const targetRotY = Math.PI + mouseRef.current.x * 0.55 + scroll * Math.PI * 0.8
        const targetRotX = -mouseRef.current.y * 0.4 + Math.sin(time * 0.8) * 0.05
        const targetRotZ = mouseRef.current.x * 0.12

        phoneGroupRef.current.rotation.y += (targetRotY - phoneGroupRef.current.rotation.y) * 0.06
        phoneGroupRef.current.rotation.x += (targetRotX - phoneGroupRef.current.rotation.x) * 0.06
        phoneGroupRef.current.rotation.z += (targetRotZ - phoneGroupRef.current.rotation.z) * 0.06
      }

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameId)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [modelId])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        zIndex: 10,
      }}
    />
  )
}
