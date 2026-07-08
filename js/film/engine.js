// RETIRED: no live page references this module. It is only ever loaded by a
// STALE CACHED copy of the pre-launch experience.html — if that happens,
// hand the visitor to the live site instead of playing the old film.
if (location.pathname.endsWith('experience.html')) location.replace('index.html')

// TRACE film engine — one canvas, one master scrubbed timeline, nine chapters.
// A business jet in flight comes apart; the camera follows one structural
// mount out of the airframe and reverse-engineers its making: certified
// billet → 5-axis mill → CMM proof → return to service.
// The camera never cuts; it travels (white-fade match cuts allowed).
// Scrub owns story time; all "life" (drift, blinks, breathing) is ambient
// per-frame motion that never touches timeline values — reverse-safe.
import * as THREE from 'three'
import { buildEnvironment, buildMaterials, M } from './materials.js'
import { buildWorld, W } from './world.js'

// Refresh-at-depth guard: browsers restore scroll on reload BEFORE the film
// engine measures its track, corrupting ScrollTrigger's start/end.
history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

const stageEl = document.getElementById('film-stage')
const canvasHost = document.getElementById('film-canvas')

// ── Renderer / scene / camera ─────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
renderer.setSize(innerWidth, innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.12
canvasHost.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.05, 400)

buildMaterials()
scene.environment = buildEnvironment(renderer)
buildWorld(scene)

// bench stays dark until the handoff (ch4) — nothing at origin before then
W.part.visible = false
W.motes.visible = false

// camera rig: authoritative, timeline-owned values. The render loop applies
// damped-follow + handheld drift + lens breathing ON TOP (never written back).
const rig = {
  px: 20, py: 66, pz: 40,
  tx: 0, ty: 60, tz: 0,
  fov: 38, roll: 0,
  fade: 0,
}

// ── Master timeline ───────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger)
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#film-scroll', start: 'top top', end: 'bottom bottom', scrub: 0.35,
  },
  defaults: { ease: 'none' },
})

const cap = (n) => `#cap-${n}`
const showCap = (n, at, dur = 0.5) => {
  tl.fromTo(cap(n), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: dur * 0.4 }, at)
  tl.to(cap(n), { opacity: 0, y: -20, duration: dur * 0.3 }, at + dur)
  const card = document.querySelector(`#cap-${n} .cap-card`)
  if (card) tl.fromTo(card, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: dur * 0.35 }, at + 0.09)
}
const dot = (i, at) => tl.call(setDot, [i], at)
function setDot(i) {
  document.querySelectorAll('.film-dots button').forEach((d, k) => d.classList.toggle('on', k === i))
}

// ══ CH0 · APPROACH — the jet in flight over the relief world ══
dot(0, 0)
tl.fromTo('#film-fade', { opacity: 1 }, { opacity: 0, duration: 0.35 }, 0)
tl.to(rig, { px: 14, py: 63.5, pz: 30, duration: 1 }, 0)
showCap(0, 0.18, 0.6)

// ══ CH1 · THE CIRCLE — descending spiral around the jet ══
dot(1, 1)
tl.to(rig, { px: 32, py: 62.6, pz: 4, roll: -0.05, duration: 0.34 }, 1)
tl.to(rig, { px: 2, py: 61.6, pz: -31, roll: -0.06, duration: 0.33 }, 1.34)
tl.to(rig, { px: -26, py: 61.6, pz: -8, roll: -0.02, duration: 0.33 }, 1.67)
tl.to(rig, { roll: 0, duration: 0.2 }, 2.0)
showCap(1, 1.3, 0.55)

// ══ CH2 · THE TEARDOWN — the world falls away; the jet comes apart ══
dot(2, 2)
tl.to(rig, { px: 12, py: 67, pz: 34, tx: -3, ty: 59.6, fov: 44, duration: 1 }, 2)
// world falls away
tl.to(W.terrain.material, { opacity: 0, duration: 0.5 }, 2.05)
tl.to(W.contours.material, { opacity: 0, duration: 0.4 }, 2.05)
tl.to(W.jetShadow.material, { opacity: 0, duration: 0.35 }, 2.05)
tl.to(W.terrain.position, { y: -70, duration: 0.9 }, 2.05)
tl.to(W.contours.position, { y: -70, duration: 0.9 }, 2.05)
W.clouds.forEach((c, i) => tl.to(c.position, { y: c.position.y - 34, duration: 0.8 }, 2.05 + (i % 4) * 0.02))
if (W.clouds.length) tl.to(W.clouds[0].children[0].material, { opacity: 0, duration: 0.5 }, 2.1)
tl.to(scene.fog, { near: 300, far: 500, duration: 0.5 }, 2.05)
// staggered explode: proxy cloud → panels → nacelles → tail group → wings → fuselage
{
  const at = (p, i) => {
    if (i >= 19 && i <= 36) return 2.05 + (i - 19) * 0.012 // proxies
    if (i >= 12 && i <= 18) return 2.2 + (i - 12) * 0.02   // panels
    if (i === 9 || i === 10) return 2.35                    // nacelles
    if (i === 8) return 2.42                                // bullet
    if (i === 7) return 2.48                                // hstab
    if (i === 6) return 2.54                                // vstab
    if (i === 11) return 2.5                                // belly
    if (i === 4 || i === 5) return 2.62                     // wings
    if (i === 37) return 2.3                                // hero (early, gentle)
    return 2.72 + i * 0.02                                  // fuselage rings
  }
  W.jetPieces.forEach((p, i) => {
    const h = p.userData.home, e = p.userData.explode, s = p.userData.spin
    const t0 = at(p, i)
    tl.to(p.position, { x: h.x + e.x, y: h.y + e.y, z: h.z + e.z, duration: 0.6 }, t0)
    tl.to(p.rotation, { x: s.x, y: s.y, z: s.z, duration: 1.5 }, t0 + 0.04)
  })
}
showCap(2, 2.35, 0.55)

// ══ CH3 · THE ONE — weave to the hero bracket ══
dot(3, 3)
tl.to(rig, { px: 5, py: 59.6, pz: 11, tx: -1.6, ty: 57.6, tz: 5, fov: 38, duration: 0.5 }, 3)
tl.to(rig, { px: 0.6, py: 58.3, pz: 8.6, ty: 57.4, duration: 0.5 }, 3.5)
// wireframe pulse marks it
tl.set(W.heroWire, { visible: true }, 3.25)
tl.fromTo(M.wireHero, { opacity: 0 }, { opacity: 0.85, duration: 0.18 }, 3.3)
tl.to(M.wireHero, { opacity: 0, duration: 0.2 }, 3.62)
tl.set(W.heroWire, { visible: false }, 3.95)
showCap(3, 3.3, 0.6)

// ══ CH4 · THE HANDOFF — match cut through white; scale jump vanishes ══
dot(4, 4)
tl.to(rig, { px: -0.6, py: 57.9, pz: 6.8, tx: -1.6, ty: 57.35, tz: 5.0, fov: 30, duration: 0.6 }, 4)
tl.to('#film-fade', { opacity: 1, duration: 0.18 }, 4.6)
// teleport to the bench during the white
tl.set(rig, { px: 2.5, py: 2.6, pz: 7.5, tx: 0, ty: 0.3, tz: 0, fov: 34, roll: 0 }, 4.8)
tl.set(W.part, { visible: true }, 4.8)
tl.set(W.motes, { visible: true }, 4.8)
tl.set(W.billet, { visible: false }, 4.8)
tl.set(W.bracket, { visible: true }, 4.8)
tl.to('#film-fade', { opacity: 0, duration: 0.2 }, 4.85)
tl.to(rig, { pz: 8.6, duration: 0.3 }, 4.85) // motion carries through the cut
tl.to(W.part.rotation, { y: -0.9, duration: 1.1 }, 4.85)
showCap(4, 4.92, 0.5)

// ══ CH5 · REVERSE-ENGINEERED — run the process backward to the billet ══
dot(5, 5)
tl.to(rig, { px: -3.8, py: 5.0, pz: 11.5, ty: 0.6, duration: 1 }, 5)
tl.to(M.wire, { opacity: 0.9, duration: 0.3 }, 5.05)
tl.to(W.bracket.scale, { x: 0.985, y: 0.9, z: 0.985, duration: 0.3 }, 5.22)
tl.set(W.bracket, { visible: false }, 5.5)
tl.set(W.billet, { visible: true }, 5.3)
tl.fromTo(W.billet.scale, { y: 0.001 }, { y: 1, duration: 0.35 }, 5.3)
tl.to(M.wire, { opacity: 0, duration: 0.3 }, 5.55)
tl.set(W.dims, { visible: true }, 5.45)
tl.fromTo(W.dims.children.map((d) => d.scale), { x: 0.001 }, { x: 1, duration: 0.35, stagger: 0.1 }, 5.5)
tl.to(W.part.rotation, { y: 0.15, duration: 1 }, 5)
showCap(5, 5.35, 0.55)

// ══ CH6 · THE MACHINE — toolpaths, the cut, the chips ══
dot(6, 6)
tl.set(W.dims, { visible: false }, 6.04)
tl.to(rig, { px: 1.4, py: 5.8, pz: 8.8, tx: 0, ty: 0.2, tz: 0, fov: 34, duration: 1 }, 6)
tl.to(W.part.rotation, { y: -1.3, x: 0.5, duration: 1 }, 6)
// CAM toolpath draws itself over the billet, then the cut happens
tl.set(W.toolpath, { visible: true }, 6.02)
{
  const draw = { n: 0 }
  tl.to(draw, {
    n: W.toolpathCount, duration: 0.3,
    onUpdate: () => W.toolpath.geometry.setDrawRange(0, Math.floor(draw.n)),
  }, 6.05)
}
tl.to(W.toolpath.material, { opacity: 0, duration: 0.15 }, 6.42)
tl.set(W.toolpath, { visible: false }, 6.6)
// morph: wire flickers, machined bracket materializes, billet collapses
tl.to(M.wire, { opacity: 0.9, duration: 0.25 }, 6.3)
tl.set(W.bracket, { visible: true }, 6.45)
tl.fromTo(W.bracket.scale, { x: 0.985, y: 0.9, z: 0.985 }, { x: 1, y: 1, z: 1, duration: 0.4 }, 6.45)
tl.to(M.wire, { opacity: 0, duration: 0.3 }, 6.52)
tl.to(W.billet.scale, { y: 0.001, duration: 0.3 }, 6.5)
tl.set(W.billet, { visible: false }, 6.85)
// chips burst (hoisted allocations — no per-tick garbage)
tl.set(W.chips, { visible: true }, 6.5)
{
  const mtx = new THREE.Matrix4()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3()
  const sim = { t: 0 }
  tl.to(sim, {
    t: 1, duration: 0.55,
    onUpdate: () => {
      const t = sim.t
      W.chipSeeds.forEach((s, i) => {
        pos.copy(s.o).addScaledVector(s.v, t)
        pos.y -= 2.2 * t * t
        mtx.makeRotationY(t * 6 * s.s)
        mtx.setPosition(pos)
        scl.setScalar(Math.max(1 - t * 0.6, 0.05))
        mtx.scale(scl)
        W.chips.setMatrixAt(i, mtx)
      })
      W.chips.instanceMatrix.needsUpdate = true
    },
  }, 6.5)
}
tl.set(W.chips, { visible: false }, 7.0)
tl.to(W.part.rotation, { y: -2.2, duration: 0.45 }, 6.5)
showCap(6, 6.22, 0.6)
// macro push toward the base bore → white
tl.to(rig, { py: 2.2, pz: 4.0, ty: -0.2, fov: 28, duration: 0.2 }, 6.74)
tl.to(rig, { py: 1.1, pz: 2.0, ty: -0.4, fov: 23, duration: 0.12 }, 6.9)
tl.to('#film-fade', { opacity: 1, duration: 0.2 }, 6.94)

// ══ CH7 · THE PROOF — CMM on granite ══
dot(7, 7)
tl.set(W.lab, { visible: true }, 7.02)
tl.set(W.part, { visible: false }, 7.02)
tl.set(rig, { px: 30, py: 3.6, pz: 9.2, tx: 30, ty: 0.4, tz: 0, fov: 36, roll: 0 }, 7.02)
tl.to('#film-fade', { opacity: 0, duration: 0.25 }, 7.06)
tl.to(rig, { px: 32.2, py: 2.5, pz: 6.2, duration: 0.9 }, 7.06)
tl.to(W.labPart.rotation, { y: 0.95, duration: 0.9 }, 7.06)
// probe triple-tap synced to the typed readings in the glass card
;[0, 1, 2].forEach((i) => {
  tl.to(W.probe.position, { y: 2.42, duration: 0.06 }, 7.25 + i * 0.2)
  tl.to(W.probe.position, { y: 2.6, duration: 0.09 }, 7.33 + i * 0.2)
  tl.call(() => {
    const r = document.querySelectorAll('#cap-7 .reading')[i]
    if (r) r.classList.add('typed')
  }, [], 7.3 + i * 0.2)
})
showCap(7, 7.18, 0.75)
// anodize shimmer on the lab bracket (the ti-grad, literal)
{
  const ano = { t: 0 }
  tl.to(ano, {
    t: 1, duration: 0.5,
    onUpdate: () => {
      const m = W.labPartMat
      m.iridescence = M.anodizedParams.iridescence * ano.t
      m.iridescenceIOR = M.anodizedParams.iridescenceIOR
      m.iridescenceThicknessRange = [M.anodizedParams.thicknessMin, M.anodizedParams.thicknessMax]
      m.roughness = 0.3 - 0.04 * ano.t
    },
  }, 7.45)
}

// ══ CH8 · RETURN TO SERVICE — the jet knits itself back together ══
dot(8, 8)
tl.to('#film-fade', { opacity: 1, duration: 0.18 }, 7.96)
tl.set(rig, { px: -34, py: 64, pz: 44, tx: 0, ty: 60, tz: 0, fov: 42, roll: 0 }, 8.02)
tl.set(W.lab, { visible: false }, 8.02)
// the world returns
tl.to(W.terrain.position, { y: -21, duration: 0.5 }, 8.04)
tl.to(W.contours.position, { y: -20.92, duration: 0.5 }, 8.04)
tl.to(W.terrain.material, { opacity: 1, duration: 0.5 }, 8.08)
tl.to(W.contours.material, { opacity: 0.05, duration: 0.5 }, 8.08)
tl.to(W.jetShadow.material, { opacity: 1, duration: 0.5 }, 8.12)
W.clouds.forEach((c, i) => tl.to(c.position, { y: -13.5 + (i % 5), duration: 0.5 }, 8.05 + (i % 4) * 0.02))
if (W.clouds.length) tl.to(W.clouds[0].children[0].material, { opacity: 0.94, duration: 0.4 }, 8.1)
tl.to(scene.fog, { near: 95, far: 215, duration: 0.5 }, 8.05)
// reassemble, reverse stagger
W.jetPieces.forEach((p, i) => {
  const h = p.userData.home
  const t0 = 8.06 + ((W.jetPieces.length - i) % 12) * 0.022
  tl.to(p.position, { x: h.x, y: h.y, z: h.z, duration: 0.45 }, t0)
  tl.to(p.rotation, { x: 0, y: 0, z: 0, duration: 0.4 }, t0)
})
tl.to('#film-fade', { opacity: 0, duration: 0.22 }, 8.06)
tl.to(rig, { px: -48, py: 66.5, pz: 58, duration: 0.9 }, 8.06)
showCap(8, 8.3, 0.55)

// hand off to the DOM landing: fade the canvas out at the very end
tl.to('#film-stage', { opacity: 0, duration: 0.25 }, 8.72)
tl.set(stageEl, { pointerEvents: 'none' }, 8.9)

// ── Render loop: damped cinema camera + ambient life ─────────
const fadeEl = document.getElementById('film-fade')
void fadeEl // (fade is driven by the timeline via selector)
const look = new THREE.Vector3()
const sm = { px: rig.px, py: rig.py, pz: rig.pz, tx: rig.tx, ty: rig.ty, tz: rig.tz, fov: rig.fov }
let mx = 0, my = 0, smx = 0, smy = 0
addEventListener('pointermove', (e) => {
  mx = (e.clientX / innerWidth - 0.5) * 2
  my = (e.clientY / innerHeight - 0.5) * 2
})
let last = performance.now()
function render(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now
  const t = now * 0.001
  // damped follow (cinematic inertia; scrub still feels immediate)
  const k = 1 - Math.exp(-dt / 0.04)
  sm.px += (rig.px - sm.px) * k; sm.py += (rig.py - sm.py) * k; sm.pz += (rig.pz - sm.pz) * k
  sm.tx += (rig.tx - sm.tx) * k; sm.ty += (rig.ty - sm.ty) * k; sm.tz += (rig.tz - sm.tz) * k
  sm.fov += (rig.fov - sm.fov) * k
  // handheld micro-drift + mouse parallax (damped)
  const hx = Math.sin(t * 0.9) * 0.02 + Math.sin(t * 1.7 + 1.3) * 0.012
  const hy = Math.sin(t * 1.15 + 0.7) * 0.016 + Math.sin(t * 2.3) * 0.008
  smx += (mx - smx) * 0.03; smy += (my - smy) * 0.03
  camera.position.set(sm.px + hx, sm.py + hy, sm.pz)
  look.set(sm.tx + smx * 0.3 + hx * 0.5, sm.ty - smy * 0.2 + hy * 0.5, sm.tz)
  camera.lookAt(look)
  camera.rotation.z += rig.roll // banked orbit
  camera.fov = sm.fov + Math.sin(t * 0.6) * 0.28 // lens breathing
  camera.updateProjectionMatrix()

  // ambient life — never timeline-owned
  W.jetPivot.rotation.z = Math.sin(t * 0.3) * 0.015
  W.jetPivot.position.y = 60 + Math.sin(t * 0.23) * 0.12
  if (W.strobe) {
    const on = t % 1.4 < 0.08
    W.strobe.material.color.setScalar(on ? 6 : 0.5)
  }
  if (W.navLeft) W.navLeft.material.color.setRGB(1.2 + 0.8 * Math.sin(t * 2), 0.12, 0.12)
  if (W.navRight) W.navRight.material.color.setRGB(0.06, 1.1 + 0.7 * Math.sin(t * 2), 0.2)
  W.wingInner.forEach(({ inner, ail, side }) => {
    inner.rotation.x = -0.052 + Math.sin(t * 0.7 + side) * 0.006 // wing flex
    ail.rotation.z = Math.sin(t * 1.3 + side * 2) * 0.05          // aileron trim
  })
  if (W.elevator) W.elevator.rotation.z = Math.sin(t * 0.9) * 0.04
  // flight drift: terrain + cloud parallax (wrap-around)
  W.terrain.position.x = ((t * 2.0) % 40) - 20
  W.contours.position.x = W.terrain.position.x
  W.clouds.forEach((c, i) => {
    c.position.x -= (0.05 + (i % 3) * 0.016)
    if (c.position.x < -115) c.position.x = 115
  })
  W.motes.rotation.y = t * 0.02 // slow dust drift

  renderer.render(scene, camera)
  requestAnimationFrame(render)
}
requestAnimationFrame(render)

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

// smooth scroll on desktop
if (typeof Lenis !== 'undefined' && matchMedia('(min-width: 861px)').matches) {
  const lenis = new Lenis({ lerp: 0.16 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((tt) => lenis.raf(tt * 1000))
  gsap.ticker.lagSmoothing(0)
}

addEventListener('load', () => ScrollTrigger.refresh())

document.documentElement.classList.add('film-ready')
