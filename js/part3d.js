// 3D billet scene — procedurally machined plate with anodized-titanium
// iridescence, rotating with scroll. Self-contained ES module, lazy-loaded by
// cinema.js only on desktop + WebGL. No external models, no jsm addons (the
// environment map is generated from a tiny emissive-box scene).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'

export function mountBillet(sceneEl) {
  const stage = sceneEl.querySelector('.billet-stage')
  const poster = sceneEl.querySelector('.billet-poster')
  if (!stage) return

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(stage.clientWidth, stage.clientHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  stage.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, stage.clientWidth / stage.clientHeight, 0.1, 50)
  camera.position.set(0, 1.5, 7.2)
  camera.lookAt(0, 0, 0)

  // ── Studio environment from emissive planes (drives the iridescence) ──
  const envScene = new THREE.Scene()
  const mkLight = (color, intensity, w, h, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    )
    m.material.color.multiplyScalar(intensity)
    m.position.set(...pos); m.rotation.set(...rot)
    envScene.add(m)
  }
  mkLight(0xffffff, 4.5, 12, 6, [0, 8, 0], [Math.PI / 2, 0, 0])       // big white softbox above
  mkLight(0xdfe8ff, 2.2, 8, 8, [-9, 2, 2], [0, Math.PI / 2, 0])       // cool fill left
  mkLight(0xfff1d8, 1.6, 8, 8, [9, 1, -2], [0, -Math.PI / 2, 0])      // warm kick right
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(envScene, 0.04).texture

  // ── The machined plate ─────────────────────────────────────
  const group = new THREE.Group()
  scene.add(group)

  const roundedRect = (w, h, r) => {
    const s = new THREE.Shape()
    s.moveTo(-w / 2 + r, -h / 2)
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
    return s
  }

  // anodized titanium — iridescent physical material
  const tiMat = new THREE.MeshPhysicalMaterial({
    color: 0xb9c3cf, metalness: 1.0, roughness: 0.34,
    iridescence: 0.9, iridescenceIOR: 1.7, iridescenceThicknessRange: [120, 620],
    clearcoat: 0.35, clearcoatRoughness: 0.25,
  })
  const pocketMat = new THREE.MeshPhysicalMaterial({
    color: 0x8f9aa7, metalness: 1.0, roughness: 0.55,
  })

  // billet body with chamfered (beveled) edges
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRect(4.4, 2.8, 0.35), {
      depth: 0.7, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 4, curveSegments: 24,
    }),
    tiMat
  )
  body.rotation.x = -Math.PI / 2
  group.add(body)

  // machined pocket (sunken inner plate)
  const pocket = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRect(3.1, 1.7, 0.28), {
      depth: 0.34, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 24,
    }),
    pocketMat
  )
  pocket.rotation.x = -Math.PI / 2
  pocket.position.y = 0.44
  group.add(pocket)

  // bored holes (dark cylinders reading as through-bores)
  const boreMat = new THREE.MeshStandardMaterial({ color: 0x2a313a, metalness: 0.8, roughness: 0.7 })
  ;[[-1.85, -1.05], [1.85, -1.05], [-1.85, 1.05], [1.85, 1.05]].forEach(([x, z]) => {
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 28), boreMat)
    bore.position.set(x, 0.35, z)
    group.add(bore)
  })
  // one center boss with bore
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.15, 40), tiMat)
  boss.position.y = 0.4
  group.add(boss)
  const bossBore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 28), boreMat)
  bossBore.position.y = 0.42
  group.add(bossBore)

  // soft contact shadow (radial-gradient canvas plane)
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 256
  const sctx = shadowCanvas.getContext('2d')
  const grad = sctx.createRadialGradient(128, 128, 20, 128, 128, 128)
  grad.addColorStop(0, 'rgba(23,28,34,0.32)'); grad.addColorStop(1, 'rgba(23,28,34,0)')
  sctx.fillStyle = grad; sctx.fillRect(0, 0, 256, 256)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.2
  scene.add(shadow)

  group.position.y = -0.1
  group.rotation.set(0.42, -0.6, 0)

  // ── Scroll-driven rotation + idle float ─────────────────────
  if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
    gsap.to(group.rotation, {
      y: Math.PI * 1.75, x: 0.18, ease: 'none',
      scrollTrigger: { trigger: sceneEl, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    })
  }

  let raf, t = 0
  const tick = () => {
    t += 0.008
    group.position.y = -0.1 + Math.sin(t) * 0.06
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  tick()
  if (poster) poster.style.display = 'none'

  // pause rendering when off-screen (battery/perf)
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { if (!raf) tick() }
      else { cancelAnimationFrame(raf); raf = null }
    })
  }).observe(stage)

  window.addEventListener('resize', () => {
    camera.aspect = stage.clientWidth / stage.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(stage.clientWidth, stage.clientHeight)
  })
}
