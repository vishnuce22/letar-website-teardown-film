// Professional jet aircraft animation — hero background
// Draws airliner silhouettes with swept wings, nacelles, winglets + contrails
(function () {
  const canvas = document.getElementById('particle-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0, planes = [], animId

  // Plane config: scale = size (depth illusion), y = 0..1 vertical fraction
  const CFG = [
    { scale: 1.00, speed: 0.55, y: 0.18, opacity: 0.22, color: '#1D4ED8' },
    { scale: 0.60, speed: 0.30, y: 0.40, opacity: 0.13, color: '#1E40AF' },
    { scale: 0.38, speed: 0.18, y: 0.62, opacity: 0.09, color: '#2563EB' },
    { scale: 0.78, speed: 0.42, y: 0.28, opacity: 0.17, color: '#1D4ED8' },
    { scale: 0.48, speed: 0.24, y: 0.52, opacity: 0.11, color: '#1E40AF' },
  ]

  function resize() {
    const r = canvas.getBoundingClientRect()
    W = canvas.width  = r.width  || window.innerWidth
    H = canvas.height = r.height || window.innerHeight
    planes.forEach((p, i) => { p.baseY = CFG[i].y * H })
  }

  function initPlanes() {
    planes = CFG.map((c, i) => ({
      x: (i / CFG.length) * W * 0.9 + W * 0.05,
      baseY: c.y * H,
      y: c.y * H,
      scale: c.scale,
      speed: c.speed,
      opacity: c.opacity,
      color: c.color,
      phase: i * 1.3,
      trail1: [],   // contrail from engine 1
      trail2: [],   // contrail from engine 2
    }))
  }

  // ─── Aircraft silhouette ──────────────────────────
  // Full commercial-jet profile drawn in local coords (nose at right = +x)
  // We mirror with ctx.scale(-sc, sc) so the jet faces LEFT (direction of travel)
  function drawJet(x, y, sc, alpha, color) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(-sc, sc)
    ctx.globalAlpha = alpha
    ctx.fillStyle = color

    // ── Fuselage ─────────────────────────────────
    // Tapered tube: pointed nose, slight under-belly, tapered tail
    ctx.beginPath()
    ctx.moveTo(65, 0)                                           // nose tip
    ctx.bezierCurveTo(62, -2.5, 52, -5.5, 32, -5.8)          // nose → cockpit
    ctx.bezierCurveTo(12, -6.0, -10, -5.8, -34, -5.2)        // fuselage body
    ctx.bezierCurveTo(-44, -4.8, -52, -3.2, -58, -1.2)       // tail cone top
    ctx.lineTo(-63, 0)                                         // tail tip
    ctx.lineTo(-58, 1.2)
    ctx.bezierCurveTo(-52, 3.2, -44, 4.8, -34, 5.2)
    ctx.bezierCurveTo(-10, 5.8, 12, 6.0, 32, 5.8)
    ctx.bezierCurveTo(52, 5.5, 62, 2.5, 65, 0)
    ctx.closePath()
    ctx.fill()

    // ── Main wings (swept ~33°) ──────────────────
    // Upper wing
    ctx.beginPath()
    ctx.moveTo(14, -5.8)    // root LE
    ctx.lineTo(-16, -34)    // tip LE
    ctx.lineTo(-20, -33)    // tip apex
    ctx.lineTo(-24, -31)    // tip TE
    ctx.lineTo(-6,  -5.8)   // root TE
    ctx.closePath()
    ctx.fill()

    // Lower wing (mirror)
    ctx.beginPath()
    ctx.moveTo(14,  5.8)
    ctx.lineTo(-16, 34)
    ctx.lineTo(-20, 33)
    ctx.lineTo(-24, 31)
    ctx.lineTo(-6,   5.8)
    ctx.closePath()
    ctx.fill()

    // Winglets — upswept tips (modern jet signature)
    ctx.beginPath()
    ctx.moveTo(-20, -33)
    ctx.lineTo(-23, -41)
    ctx.lineTo(-26, -40)
    ctx.lineTo(-23, -33)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-20,  33)
    ctx.lineTo(-23,  41)
    ctx.lineTo(-26,  40)
    ctx.lineTo(-23,  33)
    ctx.closePath()
    ctx.fill()

    // ── Engine nacelles under wings ──────────────
    // Each engine: elongated pod angled along wing sweep
    const eAngle = 0.52  // matches wing sweep angle

    // Engine 1 — upper wing, ~55% span out
    ctx.save()
    ctx.translate(-13, -19)
    ctx.rotate(-eAngle)
    ctx.beginPath()
    ctx.ellipse(0, 0, 10, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    // Inlet ring
    ctx.globalAlpha = alpha * 0.6
    ctx.beginPath()
    ctx.ellipse(9, 0, 2.8, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Engine 2 — lower wing
    ctx.save()
    ctx.translate(-13, 19)
    ctx.rotate(eAngle)
    ctx.beginPath()
    ctx.ellipse(0, 0, 10, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = alpha * 0.6
    ctx.beginPath()
    ctx.ellipse(9, 0, 2.8, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // ── Tail vertical fin ────────────────────────
    // Curved swept fin — very characteristic of modern jets
    ctx.beginPath()
    ctx.moveTo(-36, -5.2)                                     // fin root LE
    ctx.bezierCurveTo(-40, -10, -50, -20, -54, -25)          // fin leading edge (swept)
    ctx.bezierCurveTo(-55, -26, -55, -25, -55, -23)          // fin tip
    ctx.bezierCurveTo(-55, -20, -52, -12, -48, -5.2)         // fin trailing edge
    ctx.closePath()
    ctx.fill()

    // ── Horizontal stabilisers ───────────────────
    ctx.beginPath()
    ctx.moveTo(-46, -5)
    ctx.lineTo(-57, -14)
    ctx.lineTo(-60, -12)
    ctx.lineTo(-49,  -5)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-46,  5)
    ctx.lineTo(-57,  14)
    ctx.lineTo(-60,  12)
    ctx.lineTo(-49,   5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  // ─── Contrail from engine exhausts ───────────────
  // Two parallel fading trails originate from the engine positions
  function drawContrails(trail1, trail2, sc, alpha) {
    for (const trail of [trail1, trail2]) {
      if (trail.length < 3) continue
      const len = Math.min(trail.length, 110)
      for (let i = 1; i < len; i++) {
        const t = i / len
        const a = alpha * (1 - t) * 0.6
        if (a < 0.003) continue
        const p0 = trail[trail.length - i - 1]
        const p1 = trail[trail.length - i]
        if (!p0 || !p1) continue
        ctx.beginPath()
        ctx.strokeStyle = '#93C5FD'   // light blue-white contrail
        ctx.globalAlpha = a
        ctx.lineWidth = (1 - t) * 2.0 * sc
        ctx.lineCap = 'round'
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
    }
  }

  function update(t) {
    planes.forEach((p, i) => {
      p.x -= p.speed
      p.y = p.baseY + Math.sin(t * 0.00030 + p.phase) * 16 * p.scale

      // Engine exit positions in world coords (accounting for the scale(-sc,sc) flip)
      // In local coords the engines are at (-13, ±19) * scale
      // After scale(-sc, sc): world offset = (+13*sc, ±19*sc)
      const ex = p.x + 13 * p.scale
      const ey1 = p.y - 19 * p.scale
      const ey2 = p.y + 19 * p.scale

      p.trail1.push({ x: ex, y: ey1 })
      p.trail2.push({ x: ex, y: ey2 })
      if (p.trail1.length > 120) p.trail1.shift()
      if (p.trail2.length > 120) p.trail2.shift()

      if (p.x < -(80 * p.scale)) {
        p.x = W + 70 * p.scale
        p.baseY = (0.08 + Math.random() * 0.78) * H
        p.y = p.baseY
        p.trail1 = []
        p.trail2 = []
      }
    })
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    // Draw back-to-front (small = far = behind)
    const sorted = [...planes].sort((a, b) => a.scale - b.scale)
    sorted.forEach(p => drawContrails(p.trail1, p.trail2, p.scale, p.opacity))
    sorted.forEach(p => drawJet(p.x, p.y, p.scale, p.opacity, p.color))
  }

  function loop(t) {
    update(t)
    render()
    animId = requestAnimationFrame(loop)
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId)
    resize()
    animId = requestAnimationFrame(loop)
  })

  requestAnimationFrame(() => {
    resize()
    initPlanes()
    requestAnimationFrame(loop)
  })
})()
