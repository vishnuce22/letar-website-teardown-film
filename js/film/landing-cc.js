// THE SYSTEM — LetarOS Command Center, resurrected from the TITAN film and
// upgraded: the floating dashboard over a glowing machine-tile floor, breathing
// behind the landing invitation. Abstract data only (ITAR-safe, no real WOs).
import * as THREE from 'three'

const host = document.getElementById('landing-cc')
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120)

  // ── shop floor + 26 machine tiles ──
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 42),
    new THREE.MeshBasicMaterial({ color: 0xe8ecf0 })
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  const tiles = []
  for (let i = 0; i < 26; i++) {
    const t = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.7),
      new THREE.MeshBasicMaterial({ color: i % 5 === 3 ? 0x178a50 : 0x2563eb, transparent: true, opacity: 0.25 })
    )
    t.rotation.x = -Math.PI / 2
    t.position.set((i % 7) * 4.4 - 13.2, 0.02, Math.floor(i / 7) * 4.6 - 8)
    t.userData.phase = Math.random() * Math.PI * 2
    t.userData.speed = 0.5 + Math.random() * 0.9
    tiles.push(t)
    scene.add(t)
  }

  // ── the panel: hi-res abstract Command Center ──
  const cv = document.createElement('canvas')
  cv.width = 2048; cv.height = 1280
  const cx = cv.getContext('2d')
  cx.fillStyle = '#F7F9FB'; cx.fillRect(0, 0, 2048, 1280)
  cx.fillStyle = '#171C22'; cx.font = '700 92px Inter, sans-serif'
  cx.fillText('LetarOS · Command Center', 96, 172)
  cx.font = '500 44px monospace'; cx.fillStyle = '#56616D'
  cx.fillText('LIVE · 26 MACHINES · SHIFT DAY', 96, 248)
  // status tiles
  const groups = [['#178A50', 14], ['#2563EB', 6], ['#C9A227', 4], ['#8E99A6', 2]]
  let x = 96
  groups.forEach(([c, n]) => {
    for (let i = 0; i < n; i++) {
      cx.fillStyle = c; cx.globalAlpha = 0.88
      cx.beginPath(); cx.roundRect(x, 330, 112, 80, 12); cx.fill()
      x += 136
      if (x > 1860) x = 96
    }
  })
  cx.globalAlpha = 1
  // work-order lanes (abstract bars, colored state edge)
  const laneColors = ['#178A50', '#2563EB', '#178A50', '#C9A227', '#2563EB']
  for (let r = 0; r < 5; r++) {
    const y = 500 + r * 140
    cx.fillStyle = '#FFFFFF'
    cx.beginPath(); cx.roundRect(96, y, 1856, 108, 14); cx.fill()
    cx.fillStyle = laneColors[r]
    cx.beginPath(); cx.roundRect(96, y, 20, 108, 7); cx.fill()
    cx.fillStyle = '#DEE4EA'
    cx.beginPath(); cx.roundRect(160, y + 34, 620 + (r * 180) % 800, 40, 8); cx.fill()
    cx.fillStyle = '#8E99A6'
    cx.beginPath(); cx.roundRect(1600, y + 34, 260, 40, 8); cx.fill()
  }
  const panelTex = new THREE.CanvasTexture(cv)
  panelTex.anisotropy = 8
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(14.4, 9),
    new THREE.MeshBasicMaterial({ map: panelTex, transparent: true, opacity: 0.96 })
  )
  panel.position.set(0, 6.4, -13)
  scene.add(panel)

  function size() {
    const w = host.clientWidth || innerWidth
    const h = host.clientHeight || 600
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  size()
  addEventListener('resize', size)

  let mx = 0, smx = 0
  addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth - 0.5) * 2 })

  const look = new THREE.Vector3(0, 3.4, -6)
  camera.position.set(0, 8.5, 20)
  camera.lookAt(look)

  if (reduced) {
    tiles.forEach((t) => { t.material.opacity = 0.35 })
    renderer.render(scene, camera)
  } else {
    let visible = false
    // render only when actually on-screen (was 25% early) — a zero-cost win
    new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { rootMargin: '0px' }).observe(host)
    const render = (now) => {
      requestAnimationFrame(render)
      if (!visible) return
      const t = now * 0.001
      tiles.forEach((tile) => {
        tile.material.opacity = 0.18 + 0.4 * Math.abs(Math.sin(t * tile.userData.speed + tile.userData.phase))
      })
      panel.position.y = 6.4 + Math.sin(t * 0.55) * 0.16
      panel.rotation.y = Math.sin(t * 0.3) * 0.02
      smx += (mx - smx) * 0.03
      camera.position.x = smx * 1.6
      camera.position.y = 8.5 + Math.sin(t * 0.4) * 0.12
      camera.lookAt(look.x + smx * 0.8, look.y, look.z)
      renderer.render(scene, camera)
    }
    requestAnimationFrame(render)
  }
}
