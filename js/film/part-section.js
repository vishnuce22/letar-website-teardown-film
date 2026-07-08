// THE PART — the one interactive 3D interlude in the video film.
// A sticky canvas inside a 320vh section: certified billet → CAM toolpaths
// draw themselves → the cut (morph + chips) → the finished twin-lug mount,
// Letar's real part, rotating under your mouse. Bench-only world (no jet/sky).
import * as THREE from 'three'
import { buildEnvironment, buildMaterials, M, roundedPlate } from './materials.js'
import { buildWorld, W } from './world.js'

const section = document.getElementById('part3d')
const host = document.getElementById('part3d-canvas')

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // sharpness for the hero 3D moment
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
host.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100)

buildMaterials()
scene.environment = buildEnvironment(renderer)
buildWorld(scene, { jet: false, sky: false, lab: false })

function size() {
  const w = host.clientWidth || innerWidth
  const h = host.clientHeight || innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
size()
addEventListener('resize', size)

// warm sun for the bench too
const sun = new THREE.DirectionalLight(0xffdfae, 1.6)
sun.position.set(20, 30, 18)
scene.add(sun)

// cool rim from the back-left: bright edge speculars sell "steel"
const rim = new THREE.DirectionalLight(0xdfeaff, 1.3)
rim.position.set(-18, 10, -14)
scene.add(rim)

// granite surface plate — the part SITS on something real (inspection-room
// language), instead of floating in a CAD-viewport void. Part bottom is at
// world y = −1.55 (bracket/billet offset in buildWorld), so plate top ≈ −1.57.
{
  const plate = roundedPlate(9, 6.5, 0.25, 0.6, 0.06, M.granite)
  plate.position.y = -2.17 // extrudes +y after roundedPlate's −90° X-rotation → top at −1.57
  scene.add(plate)
}

// soft contact shadow grounds the part onto the plate (no shadow maps needed)
{
  const cv = document.createElement('canvas'); cv.width = cv.height = 128
  const g = cv.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62)
  grad.addColorStop(0, 'rgba(26,32,40,0.32)')
  grad.addColorStop(1, 'rgba(26,32,40,0)')
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.56 // just above the plate top
  scene.add(shadow)
}

const rig = { px: -4.6, py: 5.6, pz: 14.4, tx: 0, ty: 0.6, tz: 0, fov: 36 }

// The interlude is a single snap screen now: the billet → CAM → cut → finished
// sequence AUTO-PLAYS when the scene snaps into view (was scroll-scrubbed over
// 260vh). This lets the whole page use mandatory snap — no free-scroll region.
const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
tl.timeScale(0.62) // ~3.4 timeline units → ~5.5s mini-movie on arrival
host.style.opacity = '1'
// play from the raw billet each time the scene becomes the dominant view
new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.intersectionRatio >= 0.6) tl.play(0)
    else if (e.intersectionRatio <= 0.05) tl.pause(0)
  })
}, { threshold: [0, 0.05, 0.6, 1] }).observe(section)

const pcap = (n) => `#pcap-${n}`
const showPcap = (n, at, dur = 0.5) => {
  tl.fromTo(pcap(n), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: dur * 0.4 }, at)
  tl.to(pcap(n), { opacity: 0, y: -20, duration: dur * 0.3 }, at + dur)
  const card = document.querySelector(`${pcap(n)} .cap-card`)
  if (card) tl.fromTo(card, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: dur * 0.35 }, at + 0.09)
}

// ── beat 0 (t 0–1): certified billet, dimension lines ──
tl.set(W.dims, { visible: true }, 0.1)
tl.fromTo(W.dims.children.map((d) => d.scale), { x: 0.001 }, { x: 1, duration: 0.35, stagger: 0.1 }, 0.15)
tl.to(rig, { px: -2.0, py: 4.8, pz: 12.6, duration: 1 }, 0)
tl.to(W.part.rotation, { y: -0.2, duration: 1 }, 0)
showPcap(0, 0.15, 0.6)

// ── beat 1 (t 1–2): CAM toolpaths draw themselves ──
tl.set(W.dims, { visible: false }, 1.05)
tl.set(W.toolpath, { visible: true }, 1.02)
{
  const draw = { n: 0 }
  tl.to(draw, {
    n: W.toolpathCount, duration: 0.55,
    onUpdate: () => W.toolpath.geometry.setDrawRange(0, Math.floor(draw.n)),
  }, 1.05)
}
tl.to(rig, { px: 2.4, py: 6.2, pz: 8.6, ty: 0.3, duration: 1 }, 1)
tl.to(W.part.rotation, { y: -0.9, duration: 1 }, 1)
showPcap(1, 1.2, 0.6)
tl.to(W.toolpath.material, { opacity: 0, duration: 0.2 }, 1.82)
tl.set(W.toolpath, { visible: false }, 2.05)

// ── beat 2 (t 2–3.2): the cut — morph + chips → finished part ──
tl.to(M.wire, { opacity: 0.9, duration: 0.25 }, 2.05)
tl.set(W.bracket, { visible: true }, 2.2)
tl.fromTo(W.bracket.scale, { x: 0.985, y: 0.9, z: 0.985 }, { x: 1, y: 1, z: 1, duration: 0.4 }, 2.2)
tl.to(M.wire, { opacity: 0, duration: 0.3 }, 2.3)
tl.to(W.billet.scale, { y: 0.001, duration: 0.35 }, 2.25)
tl.set(W.billet, { visible: false }, 2.65)
tl.set(W.chips, { visible: true }, 2.25)
{
  const mtx = new THREE.Matrix4(), pos = new THREE.Vector3(), scl = new THREE.Vector3()
  const sim = { t: 0 }
  tl.to(sim, {
    t: 1, duration: 0.55,
    onUpdate: () => {
      W.chipSeeds.forEach((s, i) => {
        pos.copy(s.o).addScaledVector(s.v, sim.t)
        pos.y -= 2.2 * sim.t * sim.t
        mtx.makeRotationY(sim.t * 6 * s.s)
        mtx.setPosition(pos)
        scl.setScalar(Math.max(1 - sim.t * 0.6, 0.05))
        mtx.scale(scl)
        W.chips.setMatrixAt(i, mtx)
      })
      W.chips.instanceMatrix.needsUpdate = true
    },
  }, 2.25)
}
tl.set(W.chips, { visible: false }, 2.85)
tl.to(rig, { px: 3.4, py: 3.4, pz: 8.8, ty: 0.2, fov: 33, duration: 1.2 }, 2)
tl.to(W.part.rotation, { y: -2.2, x: 0.42, duration: 1.2 }, 2)
showPcap(2, 2.35, 0.65)

// ── render loop: damped camera + mouse parallax + motes (bench ambience) ──
const look = new THREE.Vector3()
const sm = { ...rig }
let mx = 0, my = 0, smx = 0, smy = 0
addEventListener('pointermove', (e) => {
  mx = (e.clientX / innerWidth - 0.5) * 2
  my = (e.clientY / innerHeight - 0.5) * 2
})
let last = performance.now(), visible = false
// only render when this scene is actually on-screen (was 50% early, so it ran
// on the neighbouring video chapters and fought the HD video for the GPU).
// This gating is a pure win — it costs zero visual quality.
new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { rootMargin: '0px' }).observe(section)

function render(now) {
  requestAnimationFrame(render)
  if (!visible) { last = now; return } // don't burn GPU off-screen
  const dt = Math.min((now - last) / 1000, 0.1); last = now
  const t = now * 0.001
  const k = 1 - Math.exp(-dt / 0.04)
  for (const key of ['px', 'py', 'pz', 'tx', 'ty', 'tz', 'fov']) sm[key] += (rig[key] - sm[key]) * k
  smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04
  const hx = Math.sin(t * 0.9) * 0.015 + Math.sin(t * 1.7 + 1.3) * 0.01
  camera.position.set(sm.px + hx, sm.py + Math.sin(t * 1.1) * 0.012, sm.pz)
  look.set(sm.tx + smx * 0.35 + hx * 0.5, sm.ty - smy * 0.25, sm.tz)
  camera.lookAt(look)
  camera.fov = sm.fov + Math.sin(t * 0.6) * 0.25
  camera.updateProjectionMatrix()
  W.motes.rotation.y = t * 0.02
  renderer.render(scene, camera)
}
requestAnimationFrame(render)
