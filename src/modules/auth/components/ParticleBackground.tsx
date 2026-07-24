import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: 'blue' | 'yellow'
  pulse: number
  pulseSpeed: number
}

const NODE_COUNT = 70
const LINK_DISTANCE = 140
const MOUSE_INFLUENCE = 220

const COLORS = {
  blue: { core: '#7AADE6', glow: 'rgba(82, 144, 218, 0.5)', line: 'rgba(53, 117, 196, 0.4)' },
  yellow: { core: '#F5C830', glow: 'rgba(232, 184, 32, 0.45)', line: 'rgba(212, 160, 8, 0.35)' },
}

/**
 * Neural mesh with strong cursor interaction — particles swirl & follow the mouse.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false })
  const frameRef = useRef(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = canvas.parentElement
    if (!container) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = container.clientWidth * dpr
      canvas.height = container.clientHeight * dpr
      canvas.style.width = `${container.clientWidth}px`
      canvas.style.height = `${container.clientHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawnNodes = (w: number, h: number) => {
      nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1.2,
        hue: Math.random() > 0.35 ? 'blue' : 'yellow',
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
      }))
    }

    resize()
    spawnNodes(container.clientWidth, container.clientHeight)

    const onResize = () => {
      resize()
      spawnNodes(container.clientWidth, container.clientHeight)
    }

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current.targetX = clientX - rect.left
      mouseRef.current.targetY = clientY - rect.top
      mouseRef.current.active = true
    }

    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateMouse(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('resize', onResize)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onLeave)
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onLeave)

    const drawNode = (node: Node, x: number, y: number) => {
      const palette = COLORS[node.hue]
      const pulse = 0.85 + Math.sin(node.pulse) * 0.15
      const r = node.radius * pulse

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 6)
      gradient.addColorStop(0, palette.glow)
      gradient.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(x, y, r * 6, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = palette.core
      ctx.shadowBlur = 12
      ctx.shadowColor = palette.core
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const animate = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      timeRef.current += 0.016

      const mouse = mouseRef.current
      mouse.x += (mouse.targetX - mouse.x) * 0.12
      mouse.y += (mouse.targetY - mouse.y) * 0.12

      ctx.clearRect(0, 0, w, h)

      const nodes = nodesRef.current
      const positions: { x: number; y: number; node: Node }[] = []

      for (const node of nodes) {
        node.pulse += node.pulseSpeed

        if (mouse.active) {
          const dx = mouse.x - node.x
          const dy = mouse.y - node.y
          const dist = Math.hypot(dx, dy)

          if (dist > 0 && dist < MOUSE_INFLUENCE) {
            const t = 1 - dist / MOUSE_INFLUENCE
            const strength = t * t

            // Pull toward cursor
            node.vx += (dx / dist) * strength * 0.35
            node.vy += (dy / dist) * strength * 0.35

            // Orbit swirl around cursor
            node.vx += (-dy / dist) * strength * 0.18
            node.vy += (dx / dist) * strength * 0.18
          }
        }

        node.vx += Math.sin(timeRef.current * 0.3 + node.pulse) * 0.002
        node.vy += Math.cos(timeRef.current * 0.25 + node.pulse) * 0.002
        node.vx *= 0.96
        node.vy *= 0.96

        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > w) node.vx *= -1
        if (node.y < 0 || node.y > h) node.vy *= -1
        node.x = Math.max(0, Math.min(w, node.x))
        node.y = Math.max(0, Math.min(h, node.y))

        positions.push({ x: node.x, y: node.y, node })
      }

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i]
          const b = positions[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.55
            const lineColor = a.node.hue === b.node.hue
              ? COLORS[a.node.hue].line
              : 'rgba(147, 184, 232, 0.2)'

            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = lineColor.replace(/[\d.]+\)$/, `${alpha})`)
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      if (mouse.active) {
        for (const { x, y } of positions) {
          const dist = Math.hypot(mouse.x - x, mouse.y - y)
          if (dist < LINK_DISTANCE * 1.4) {
            const alpha = (1 - dist / (LINK_DISTANCE * 1.4)) * 0.85
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(x, y)
            ctx.strokeStyle = `rgba(245, 215, 110, ${alpha * 0.55})`
            ctx.lineWidth = 1.2
            ctx.stroke()
          }
        }

        const hubGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 55)
        hubGlow.addColorStop(0, 'rgba(245, 215, 110, 0.22)')
        hubGlow.addColorStop(0.5, 'rgba(107, 159, 212, 0.08)')
        hubGlow.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 55, 0, Math.PI * 2)
        ctx.fillStyle = hubGlow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 244, 214, 0.9)'
        ctx.shadowBlur = 16
        ctx.shadowColor = '#F5C830'
        ctx.fill()
        ctx.shadowBlur = 0
      }

      for (const { x, y, node } of positions) {
        drawNode(node, x, y)
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', onResize)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onLeave)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onLeave)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}