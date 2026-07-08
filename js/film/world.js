// TRACE world: every set piece for the 9-chapter film, built procedurally.
// Three stations — SKY (0,60,0): jet + terrain + clouds · BENCH (origin):
// billet/bracket/chips/dims · LAB (30,0,0): granite + CMM probe.
// Everything stays resident (total tris « budget); chapters toggle visibility
// and animate transforms via the master timeline in engine.js. All randomness
// is seeded (mulberry32) so every load — and every scrub — is deterministic.
import * as THREE from 'three'
import { M, roundedPlate } from './materials.js'

export const W = {} // world registry

// deterministic PRNG — the film must look identical on every load
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260708) // Tuesday's date, for luck

// ── HERO PART: approx of Letar's real twin-arm structural mount ──────────────
// Modeled loosely from the part photo on letarinc.com (public at photo level;
// no dimensions, no real part numbers). Base plate with two bushed bores, two
// tapered clevis arms with top bores, cross-web. Bare machined aluminum.
function bracketArmGeometry() {
  const s = new THREE.Shape()
  s.moveTo(-1.05, 0)
  s.lineTo(1.05, 0)
  s.lineTo(0.78, 0.55)
  s.quadraticCurveTo(0.5, 1.55, 0.44, 2.25)
  s.quadraticCurveTo(0.44, 2.95, 0, 3.02)
  s.quadraticCurveTo(-0.44, 2.95, -0.44, 2.25)
  s.quadraticCurveTo(-0.5, 1.55, -0.78, 0.55)
  s.closePath()
  const bore = new THREE.Path()
  bore.absarc(0, 2.38, 0.24, 0, Math.PI * 2, true)
  s.holes.push(bore)
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
    bevelSegments: 2, curveSegments: 24,
  })
}

export function buildBracket() {
  const g = new THREE.Group()

  // base: sculpted plate with two large bores (Shape.holes)
  const b = new THREE.Shape()
  b.moveTo(-1.6, -1.15)
  b.lineTo(1.6, -1.15)
  b.quadraticCurveTo(1.85, -1.15, 1.85, -0.9)
  b.lineTo(1.85, 0.9)
  b.quadraticCurveTo(1.85, 1.15, 1.6, 1.15)
  b.lineTo(-1.6, 1.15)
  b.quadraticCurveTo(-1.85, 1.15, -1.85, 0.9)
  b.lineTo(-1.85, -0.9)
  b.quadraticCurveTo(-1.85, -1.15, -1.6, -1.15)
  ;[[-0.85, 0], [0.85, 0]].forEach(([x, y]) => {
    const h = new THREE.Path()
    h.absarc(x, y, 0.36, 0, Math.PI * 2, true)
    b.holes.push(h)
  })
  const baseGeo = new THREE.ExtrudeGeometry(b, {
    depth: 0.46, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
    bevelSegments: 2, curveSegments: 24,
  })
  const base = new THREE.Mesh(baseGeo, M.machined)
  base.rotation.x = -Math.PI / 2 // lie flat; thickness along Y
  base.position.y = 0.46
  g.add(base)

  // bushings seated in the base bores
  ;[[-0.85, 0], [0.85, 0]].forEach(([x, z]) => {
    const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 28), M.steel)
    bush.position.set(x, 0.86, z) // protrudes past the base top like the real part
    g.add(bush)
    const boreDark = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.74, 24), M.dark)
    boreDark.position.set(x, 0.86, z)
    g.add(boreDark)
  })

  // corner pads + fastener-hole hints
  ;[[-1.55, -0.85], [1.55, -0.85], [-1.55, 0.85], [1.55, 0.85]].forEach(([x, z]) => {
    const pad = roundedPlate(0.5, 0.5, 0.12, 0.1, 0.03, M.machined)
    pad.position.set(x, 0.98, z)
    g.add(pad)
    const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16), M.dark)
    fh.position.set(x, 1.06, z)
    g.add(fh)
  })

  // twin clevis arms, canted slightly outward, mirrored across Z
  const armGeo = bracketArmGeometry()
  ;[-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(armGeo, M.machined)
    // center each 0.4-thick slab on z = ±0.55, cant tops OUTWARD
    arm.position.set(0, 0.42, side * 0.55 - 0.2)
    arm.rotation.x = side * 0.1
    g.add(arm)
    // boss ring around the top bore (follows the canted arm top)
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.56, 26), M.machined)
    boss.rotation.x = Math.PI / 2 + side * 0.1
    boss.position.set(0, 2.76, side * 0.78)
    g.add(boss)
    const topBore = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.62, 22), M.dark)
    topBore.rotation.x = Math.PI / 2 + side * 0.1
    topBore.position.set(0, 2.76, side * 0.78)
    g.add(topBore)
  })

  // cross-web between the arms
  const web = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.1, 0.72), M.machined)
  web.position.set(0, 1.15, 0)
  g.add(web)

  // shallow recess hints on the base (suggest pocketing)
  ;[[-0.85, 0.78], [0.85, -0.78]].forEach(([x, z]) => {
    const rec = roundedPlate(0.62, 0.5, 0.1, 0.05, 0.02, M.steel)
    rec.position.set(x, 0.97, z)
    g.add(rec)
  })

  return g // base bottom at y≈0, arms top ≈ y 3.0; footprint ~3.7 × 2.3
}

// ── JET: generic unbranded business jet (T-tail, swept wings, aft nacelles) ──
W.jetPieces = []
function jetPiece(obj, explode, spinAmt = 0.35) {
  obj.userData.home = obj.position.clone()
  obj.userData.explode = explode.clone()
  obj.userData.spin = {
    x: (rand() - 0.5) * spinAmt, y: (rand() - 0.5) * spinAmt, z: (rand() - 0.5) * spinAmt,
  }
  W.jetPieces.push(obj)
  return obj
}

// fuselage radius at axis position x (nose +15 → tail −15)
function fuseRadius(x) {
  if (x > 9) { // ogive nose 15→9
    const t = (15 - x) / 6
    return 1.55 * Math.pow(Math.sin((Math.PI / 2) * Math.min(t, 1)), 0.75)
  }
  if (x > -7) return 1.55 // barrel
  const t = (x + 7) / -8 // tail cone −7→−15
  return 1.55 * (1 - t) + 0.32 * t
}

// one fuselage section as a lathe (axis +X), with steel bulkhead caps
function fuseSection(x0, x1, capStart, capEnd) {
  const grp = new THREE.Group()
  const pts = []
  const N = 14
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N
    pts.push(new THREE.Vector2(Math.max(fuseRadius(x), 0.02), x - x0))
  }
  const lathe = new THREE.Mesh(new THREE.LatheGeometry(pts, 42), M.machined)
  lathe.rotation.z = -Math.PI / 2 // lathe axis Y → +X
  grp.add(lathe)
  const cap = (x, r) => {
    const c = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 36), M.steel)
    c.rotation.y = Math.PI / 2
    c.position.x = x - x0
    grp.add(c)
  }
  if (capStart) cap(x0 + 0.001, fuseRadius(x0))
  if (capEnd) cap(x1 - 0.001, fuseRadius(x1))
  grp.position.x = x0
  return grp
}

// planform extrude (wings/stabs): rootChord & tipChord along X, span along Y
function planform(rootChord, tipChord, span, sweep, depth = 0.3, bevel = 0.1) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(-sweep, span)
  s.lineTo(-sweep - tipChord, span)
  s.lineTo(-rootChord, 0)
  s.closePath()
  return new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8,
  })
}

export function buildJet(scene) {
  W.jetPivot = new THREE.Group()
  W.jetPivot.position.set(0, 60, 0)
  W.jet = new THREE.Group()
  W.jetPivot.add(W.jet)
  scene.add(W.jetPivot)

  // ── fuselage: 4 sections, spread along X on explode ──
  const nose = jetPiece(fuseSection(9, 15, true, false), new THREE.Vector3(6, 1.2, 0), 0.2)
  const fwd = jetPiece(fuseSection(1, 9, true, true), new THREE.Vector3(2.5, 0.4, -1.5), 0.15)
  const aft = jetPiece(fuseSection(-7, 1, true, true), new THREE.Vector3(-2.5, -0.6, 1.5), 0.15)
  const tail = jetPiece(fuseSection(-15, -7, false, true), new THREE.Vector3(-6.5, 1.8, 0), 0.2)
  W.jet.add(nose, fwd, aft, tail)

  // windows (parented to mid sections so they travel with the teardown)
  const winGeo = new THREE.PlaneGeometry(0.26, 0.38)
  ;[fwd, aft].forEach((sec) => {
    ;[-1, 1].forEach((side) => {
      const wins = new THREE.InstancedMesh(winGeo, M.dark, 8)
      const mtx = new THREE.Matrix4()
      for (let i = 0; i < 8; i++) {
        const lx = 0.8 + i * 0.85
        // face outward: +Z side faces +Z (no rotation), −Z side faces −Z (π)
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, side > 0 ? 0 : Math.PI, 0))
        mtx.compose(new THREE.Vector3(lx, 0.55, side * 1.47), q, new THREE.Vector3(1, 1, 1))
        wins.setMatrixAt(i, mtx)
      }
      sec.add(wins)
    })
    // cheatline — the one brand accent (thin blue line, no logos)
    ;[-1, 1].forEach((side) => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.11, 0.02), M.accent)
      line.position.set(4.0, 0.12, side * 1.555)
      sec.add(line)
    })
  })

  // windscreen: two raked dark quads on the upper nose
  ;[-1, 1].forEach((side) => {
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.5), M.dark)
    ws.position.set(2.35, 1.0, side * 0.52)
    ws.rotation.set(side * -0.35, side * 0.55, 0)
    nose.add(ws)
  })

  // ── wings: build ONE (+Z) side, mirror the other with scale.z = −1 ──
  W.wingInner = []
  const mkWingInner = () => {
    const inner = new THREE.Group()
    const wing = new THREE.Mesh(planform(6.2, 1.7, 12, 7.5, 0.3, 0.12), M.machined)
    wing.rotation.x = Math.PI / 2 // shape +Y span → +Z
    inner.add(wing)
    // winglet at the tip, rotated up ~75°
    const wl = new THREE.Mesh(planform(1.5, 0.7, 2.1, 1.1, 0.16, 0.06), M.machined)
    wl.rotation.x = Math.PI / 2
    wl.rotation.z = 0
    wl.position.set(-7.5, 0.1, 11.9)
    wl.rotation.x = Math.PI / 2 - 1.31 // stand it up
    inner.add(wl)
    // aileron embedded at the trailing edge
    const ail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 3.0), M.steel)
    ail.position.set(-8.15, 0.12, 9.4)
    inner.add(ail)
    inner.rotation.x = -0.052 // dihedral ~3° (+Z tip up; mirror flips it correctly)
    return { inner, ail }
  }
  ;[1, -1].forEach((side) => {
    const piece = new THREE.Group()
    piece.position.set(-0.5, -0.85, 0)
    const { inner, ail } = mkWingInner()
    piece.add(inner)
    if (side < 0) piece.scale.z = -1 // mirror (materials are DoubleSide)
    // nav light: green right (+Z), red left (−Z)
    const nav = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: side > 0 ? 0x2ecc71 : 0xd83a3a })
    )
    nav.position.set(-8.6, 0.75, 11.95)
    inner.add(nav)
    ;(side > 0 ? (W.navRight = nav) : (W.navLeft = nav))
    W.wingInner.push({ inner, ail, side })
    jetPiece(piece, new THREE.Vector3(-1.2, -2.6, side * 5.5), 0.22)
    W.jet.add(piece)
  })

  // ── T-tail: vertical stab, horizontal stab, tail bullet + strobe ──
  const vstab = new THREE.Group()
  vstab.position.set(-10.6, 0.9, 0)
  const vs = new THREE.Mesh(planform(4.0, 2.0, 5.6, 3.2, 0.26, 0.1), M.machined)
  vstab.add(vs)
  jetPiece(vstab, new THREE.Vector3(-2.5, 4.2, -1.2), 0.25)
  W.jet.add(vstab)

  const hstab = new THREE.Group()
  hstab.position.set(-13.2, 6.6, 0)
  ;[1, -1].forEach((side) => {
    const wrap = new THREE.Group()
    const hs = new THREE.Mesh(planform(2.4, 1.1, 4.9, 2.2, 0.2, 0.08), M.machined)
    hs.rotation.x = Math.PI / 2
    wrap.add(hs)
    if (side < 0) wrap.scale.z = -1 // proper mirror (DoubleSide materials)
    hstab.add(wrap)
  })
  // elevator hint (ambient target)
  W.elevator = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 7.6), M.steel)
  W.elevator.position.set(-2.7, 0, 0)
  hstab.add(W.elevator)
  jetPiece(hstab, new THREE.Vector3(-1.5, 5.5, 1.6), 0.25)
  W.jet.add(hstab)

  const bullet = new THREE.Group()
  bullet.position.set(-12.9, 6.6, 0)
  const bl = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.5, 6, 16), M.steel)
  bl.rotation.z = Math.PI / 2
  bullet.add(bl)
  W.strobe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  W.strobe.position.set(-1.1, 0, 0)
  bullet.add(W.strobe)
  jetPiece(bullet, new THREE.Vector3(-3.5, 6.8, 0), 0.3)
  W.jet.add(bullet)

  // ── nacelles (aft-mounted, capsule + intake ring + exhaust cone) ──
  ;[-1, 1].forEach((side) => {
    const nac = new THREE.Group()
    nac.position.set(-8.6, 0.95, side * 2.45)
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 2.6, 8, 24), M.machined)
    body.rotation.z = Math.PI / 2
    nac.add(body)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 12, 36), M.steel)
    ring.rotation.y = Math.PI / 2
    ring.position.x = 2.1
    nac.add(ring)
    const intake = new THREE.Mesh(new THREE.CircleGeometry(0.74, 28), M.dark)
    intake.rotation.y = Math.PI / 2
    intake.position.x = 2.06
    nac.add(intake)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 22), M.steel)
    cone.rotation.z = Math.PI / 2
    cone.position.x = -1.9
    nac.add(cone)
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.2), M.machined)
    pylon.position.set(0, -0.15, side * -1.0)
    nac.add(pylon)
    jetPiece(nac, new THREE.Vector3(-3.2, 1.6, side * 3.4), 0.25)
    W.jet.add(nac)
  })

  // belly fairing
  const belly = new THREE.Group()
  belly.position.set(-1.2, -1.25, 0)
  const bf = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 4.4, 6, 18), M.rawAluminum)
  bf.rotation.z = Math.PI / 2
  bf.scale.y = 0.55
  belly.add(bf)
  jetPiece(belly, new THREE.Vector3(0.5, -3.4, 0), 0.2)
  W.jet.add(belly)

  // access panels tangent to skin
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Group()
    const plate = roundedPlate(0.8 + rand() * 0.5, 0.5 + rand() * 0.3, 0.08, 0.03, 0.01, M.rawAluminum)
    p.add(plate)
    const a = rand() * Math.PI * 2
    const x = -6 + rand() * 12
    const r = fuseRadius(x) + 0.03
    p.position.set(x, Math.cos(a) * r, Math.sin(a) * r)
    p.rotation.x = a
    jetPiece(p, new THREE.Vector3((rand() - 0.5) * 3, 2 + rand() * 2.5, (rand() - 0.5) * 6), 0.5)
    W.jet.add(p)
  }

  // component proxies hidden inside the airframe → the teardown "cloud"
  const mkFastener = () => {
    const f = new THREE.Group()
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 6), M.steel)
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 12), M.steel)
    shank.position.y = -0.24
    f.add(head, shank)
    return f
  }
  for (let i = 0; i < 18; i++) {
    let obj
    const kind = i % 3
    if (kind === 0) obj = mkFastener()
    else if (kind === 1) {
      obj = new THREE.Group()
      obj.add(roundedPlate(0.5 + rand() * 0.4, 0.35 + rand() * 0.3, 0.06, 0.08, 0.02, M.rawAluminum))
    } else {
      obj = new THREE.Group()
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 26, Math.PI), M.steel)
      obj.add(arc)
    }
    const x = -9 + rand() * 17
    obj.position.set(x, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8)
    const a = rand() * Math.PI * 2
    const rr = 3.5 + rand() * 3.5
    jetPiece(obj, new THREE.Vector3((rand() - 0.5) * 4, Math.cos(a) * rr * 0.6, Math.sin(a) * rr), 0.9)
    W.jet.add(obj)
  }

  // ── the HERO: mini bracket under the left wing root ──
  W.heroProxy = buildBracket()
  W.heroProxy.scale.setScalar(0.15)
  W.heroProxy.position.set(-2.2, -1.05, 2.6)
  W.heroProxy.rotation.set(0.35, -0.5, 0) // match bench orientation for the cut
  jetPiece(W.heroProxy, new THREE.Vector3(0.6, -1.6, 2.4), 0.0)
  W.heroProxy.userData.spin = { x: 0, y: 0, z: 0 } // hero stays readable
  W.jet.add(W.heroProxy)
  // wireframe pulse clone marking the hero — parked at the hero's EXPLODED
  // location (home + explode), since the pulse plays mid-teardown in ch3
  W.heroWire = buildBracket()
  W.heroWire.traverse((o) => { if (o.isMesh) o.material = M.wireHero })
  W.heroWire.scale.setScalar(0.16)
  W.heroWire.position.set(-1.6, -2.65, 5.0)
  W.heroWire.rotation.set(0.35, -0.5, 0)
  W.heroWire.visible = false
  W.jet.add(W.heroWire)
}

// ── SKY: bright engineering-relief terrain + contour grid + clouds ───────────
export function buildSky(scene) {
  W.sky = new THREE.Group()
  W.sky.position.set(0, 60, 0)
  scene.add(W.sky)

  // value-noise heightfield (deterministic)
  const GRID = 24
  const noiseGrid = []
  for (let i = 0; i <= GRID; i++) {
    noiseGrid.push([])
    for (let j = 0; j <= GRID; j++) noiseGrid[i].push(rand())
  }
  const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t))
  const noise2 = (u, v) => {
    const iu = Math.min(Math.floor(u), GRID - 1), iv = Math.min(Math.floor(v), GRID - 1)
    const fu = u - iu, fv = v - iv
    return lerp(
      lerp(noiseGrid[iu][iv], noiseGrid[iu + 1][iv], fu),
      lerp(noiseGrid[iu][iv + 1], noiseGrid[iu + 1][iv + 1], fu), fv
    )
  }

  const SEG = 96, SIZE = 260
  const tGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
  const pos = tGeo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const lo = new THREE.Color(0xa9c7e6) // valley — soft lake blue
  const mid = new THREE.Color(0xd9e5f0)
  const hi = new THREE.Color(0xfbfcfe)  // ridge — near-white
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const u = ((x / SIZE) + 0.5) * GRID, v = ((y / SIZE) + 0.5) * GRID
    let h = noise2(u, v) * 0.62 + noise2(u * 2.7 % GRID, v * 2.7 % GRID) * 0.28 + noise2(u * 6.1 % GRID, v * 6.1 % GRID) * 0.1
    h = Math.pow(h, 1.4)
    pos.setZ(i, h * 9)
    const c = h < 0.42 ? lo.clone().lerp(mid, h / 0.42) : mid.clone().lerp(hi, (h - 0.42) / 0.58)
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
  }
  tGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  tGeo.computeVertexNormals()
  const tMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, transparent: true })
  W.terrain = new THREE.Mesh(tGeo, tMat)
  W.terrain.rotation.x = -Math.PI / 2
  W.terrain.position.y = -21
  W.sky.add(W.terrain)

  // contour grid: same heightfield as faint blue wireframe (engineering-map read)
  const cMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: 0.1 })
  W.contours = new THREE.Mesh(tGeo.clone(), cMat)
  W.contours.rotation.x = -Math.PI / 2
  W.contours.position.y = -20.92
  W.sky.add(W.contours)

  // clouds: flattened white blob clusters between terrain and jet
  W.clouds = []
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.94 })
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Group()
    const n = 3 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1.6 + rand() * 2.4, 14, 12), cloudMat)
      s.position.set((rand() - 0.5) * 6, (rand() - 0.5) * 0.9, (rand() - 0.5) * 3.4)
      s.scale.y = 0.32 + rand() * 0.12
      c.add(s)
    }
    c.position.set((rand() - 0.5) * 190, -13.5 + rand() * 5.5, (rand() - 0.5) * 190)
    W.clouds.push(c)
    W.sky.add(c)
  }

  // soft blob shadow grounding the jet on the terrain
  const shCv = document.createElement('canvas'); shCv.width = shCv.height = 128
  const shx = shCv.getContext('2d')
  const grad = shx.createRadialGradient(64, 64, 6, 64, 64, 62)
  grad.addColorStop(0, 'rgba(60,72,88,0.34)')
  grad.addColorStop(1, 'rgba(60,72,88,0)')
  shx.fillStyle = grad; shx.fillRect(0, 0, 128, 128)
  const shTex = new THREE.CanvasTexture(shCv)
  W.jetShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 15),
    new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })
  )
  W.jetShadow.rotation.x = -Math.PI / 2
  W.jetShadow.position.y = -14.4
  W.sky.add(W.jetShadow)

  // horizon dissolve — fog far past the bench/lab distances so it never dulls them
  scene.fog = new THREE.Fog(0xeff5fb, 95, 215)
}

// ── BENCH + LAB + shafts (the making of the part) ─────────────────────────────
function buildShafts(x, y, z, scale = 1) {
  const grp = new THREE.Group()
  const shaftCv = document.createElement('canvas'); shaftCv.width = 64; shaftCv.height = 512
  const sc = shaftCv.getContext('2d')
  const g = sc.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  sc.fillStyle = g; sc.fillRect(0, 0, 64, 512)
  const shaftTex = new THREE.CanvasTexture(shaftCv)
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry((1.6 + i * 0.7) * scale, 14 * scale),
      new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
    )
    s.position.set(-3 * scale + i * 2.1 * scale, 4 * scale, -3 * scale - i * scale)
    s.rotation.z = -0.18
    grp.add(s)
  }
  grp.position.set(x, y, z)
  return grp
}

export function buildWorld(scene, opts = {}) {
  const { jet = true, sky = true, lab = true } = opts
  // ── BENCH: billet ↔ bracket morph anchor at origin ──
  W.part = new THREE.Group()
  scene.add(W.part)

  // raw billet block (bracket stock — must fully envelop the machined part)
  W.billet = roundedPlate(3.9, 2.5, 0.12, 3.55, 0.05, M.rawAluminum)
  W.billet.position.y = -1.55
  W.part.add(W.billet)

  // the machined hero bracket (reveal target)
  W.bracket = buildBracket()
  W.bracket.position.y = -1.55
  W.bracket.visible = false
  W.part.add(W.bracket)

  // blueprint wireframe of the bracket (morph flicker)
  W.wireShell = buildBracket()
  W.wireShell.traverse((o) => { if (o.isMesh) o.material = M.wire })
  W.wireShell.scale.setScalar(1.01)
  W.wireShell.position.y = -1.55
  W.part.add(W.wireShell)

  // CAM toolpath polyline over the billet (ch6 pre-morph beat)
  const tpPts = []
  const rows = 9
  for (let r = 0; r <= rows; r++) {
    const z = -1.05 + (2.1 * r) / rows
    const x0 = r % 2 === 0 ? -1.7 : 1.7
    tpPts.push(new THREE.Vector3(x0, 3.68, z), new THREE.Vector3(-x0, 3.68, z))
  }
  const tpGeo = new THREE.BufferGeometry().setFromPoints(tpPts)
  W.toolpath = new THREE.Line(tpGeo, new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.9 }))
  W.toolpath.position.y = -1.55
  W.toolpath.visible = false
  W.toolpathCount = tpPts.length
  W.toolpath.geometry.setDrawRange(0, 0)
  W.part.add(W.toolpath)

  // chips burst — instanced tiny tetra "chips"
  const chipGeo = new THREE.TetrahedronGeometry(0.05)
  W.chips = new THREE.InstancedMesh(chipGeo, M.machined.clone(), 140)
  W.chips.visible = false
  W.chipSeeds = []
  for (let i = 0; i < 140; i++) {
    const a = rand() * Math.PI * 2, r = 0.3 + rand() * 0.4
    W.chipSeeds.push({
      o: new THREE.Vector3(Math.cos(a) * r, 0.7, Math.sin(a) * r),
      v: new THREE.Vector3((rand() - 0.5) * 3.4, 1.5 + rand() * 2.4, (rand() - 0.5) * 3.4),
      s: 0.5 + rand(),
    })
  }
  W.part.add(W.chips)

  // dimension lines above the billet
  W.dims = new THREE.Group(); W.dims.visible = false
  const dimMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.85 })
  const mkDim = (from, to) => {
    const dir = new THREE.Vector3().subVectors(to, from)
    const len = dir.length()
    const line = new THREE.Mesh(new THREE.BoxGeometry(len, 0.015, 0.015), dimMat)
    line.position.copy(from).addScaledVector(dir, 0.5)
    line.lookAt(to); line.rotateY(Math.PI / 2)
    W.dims.add(line)
  }
  mkDim(new THREE.Vector3(-1.95, 2.35, 1.4), new THREE.Vector3(1.95, 2.35, 1.4))
  mkDim(new THREE.Vector3(2.25, 2.35, -1.15), new THREE.Vector3(2.25, 2.35, 1.15))
  W.part.add(W.dims)

  // dust motes in the bench air (ambient drift in engine)
  const moteGeo = new THREE.BufferGeometry()
  const motePos = new Float32Array(60 * 3)
  for (let i = 0; i < 60; i++) {
    motePos[i * 3] = (rand() - 0.5) * 10
    motePos[i * 3 + 1] = -1 + rand() * 6
    motePos[i * 3 + 2] = (rand() - 0.5) * 8
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
  W.motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xaebccb, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false,
  }))
  scene.add(W.motes)

  // ── LAB: granite + CMM probe + bracket clone ──
  if (lab) {
  W.lab = new THREE.Group()
  W.lab.position.set(30, 0, 0)
  W.lab.visible = false
  const granite = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 6), M.granite)
  granite.position.y = -1.15
  W.lab.add(granite)
  W.labPart = buildBracket()
  W.labPart.scale.setScalar(0.72)
  W.labPart.position.y = -0.75
  W.labPart.rotation.y = -0.6
  // independent material so the anodize lerp doesn't touch the bench bracket
  const labMat = M.machined.clone()
  W.labPart.traverse((o) => { if (o.isMesh && o.material === M.machined) o.material = labMat })
  W.labPartMat = labMat
  W.lab.add(W.labPart)
  W.probe = new THREE.Group()
  const stylus = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 16), M.steel)
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), M.ruby)
  tip.position.y = -1.15
  W.probe.add(stylus, tip)
  W.probe.position.set(0.35, 2.6, 0.3)
  W.lab.add(W.probe)
  // CMM inspection light
  const labLight = new THREE.PointLight(0xffffff, 26, 26)
  labLight.position.set(1.5, 6, 3)
  W.lab.add(labLight)
  scene.add(W.lab)
  }

  // light shafts at the bench
  W.shafts = buildShafts(0, 0, 0)
  scene.add(W.shafts)

  // ── SKY + JET ──
  if (sky) buildSky(scene)
  if (jet) buildJet(scene)

  // sun — warm directional against the cool env fill: gives the aluminum its
  // champagne-vs-ice color interplay (color WITHOUT darkness)
  const sun = new THREE.DirectionalLight(0xffdfae, 2.2)
  sun.position.set(45, 120, 35)
  scene.add(sun)

  W.part.rotation.set(0.35, -0.5, 0)
  return W
}
