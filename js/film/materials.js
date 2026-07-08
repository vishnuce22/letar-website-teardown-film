// Shared PBR materials + studio environment for the TITAN film.
// One env map drives every metal; the anodize ramp is the ti-grad made literal.
import * as THREE from 'three'

export function buildEnvironment(renderer) {
  const envScene = new THREE.Scene()
  // bright ambient world: without this, metal faces at grazing angles reflect
  // the env-scene's black void and the jet reads dark (violates the no-dark rule)
  envScene.background = new THREE.Color(0xccd6e2)
  const panel = (color, intensity, w, h, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    )
    m.material.color.multiplyScalar(intensity)
    m.position.set(...pos); m.rotation.set(...rot)
    envScene.add(m)
  }
  panel(0xfff1dc, 4.6, 14, 7, [0, 9, 0], [Math.PI / 2, 0, 0])   // key softbox — warmed toward the footage's golden hour
  panel(0xcfdfff, 2.3, 9, 9, [-10, 2, 2], [0, Math.PI / 2, 0])  // cool fill (icier)
  panel(0xffd9a0, 3.6, 9, 9, [10, 1, -2], [0, -Math.PI / 2, 0]) // warm kick (golden, strong — sells the sunset grade)
  panel(0xf2f5f8, 1.1, 20, 20, [0, -6, 0], [-Math.PI / 2, 0, 0])// bounce floor
  // dark studio flags: metals are mirrors — without dark bands to reflect,
  // machined aluminum reads as white paper. These never appear on screen,
  // only in reflections (page stays bright). Deepened: contrast in the
  // reflections is what separates "metal" from "plastic".
  panel(0x131a23, 1.0, 18, 3.4, [0, 0.4, -8], [0, 0, 0])        // back horizon band
  panel(0x1a222c, 1.0, 12, 2.8, [3, -1.6, 8], [0, Math.PI, 0])  // low front band
  panel(0x212a35, 1.0, 5, 7, [-8, 2.5, -6], [0, Math.PI / 4, 0])// corner flag
  panel(0x2c3542, 1.0, 16, 4.5, [0, 4.2, 9], [0, Math.PI, 0])   // camera-side band — darkens faces that look at the viewer
  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(envScene, 0.04).texture
  pmrem.dispose()
  return tex
}

export const M = {}
export function buildMaterials() {
  M.rawAluminum = new THREE.MeshPhysicalMaterial({
    color: 0xa7b0bb, metalness: 1.0, roughness: 0.4, envMapIntensity: 1.15, side: THREE.DoubleSide,
  })
  M.machined = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4ba, metalness: 1.0, roughness: 0.3, envMapIntensity: 1.25,
    // NO clearcoat: lacquer over metal is exactly the injection-molded-plastic
    // look. Brushed anisotropy instead — speculars streak along the tool marks.
    anisotropy: 0.55,
    side: THREE.DoubleSide, // DoubleSide: mirrored (scale −1) jet halves stay visible
  })
  // anodize target — chapter 7 lerps `machined` TOWARD these values
  M.anodizedParams = {
    iridescence: 0.95, iridescenceIOR: 1.7,
    thicknessMin: 140, thicknessMax: 900, roughness: 0.26,
  }
  M.steel = new THREE.MeshPhysicalMaterial({ color: 0x9aa4af, metalness: 1, roughness: 0.42, side: THREE.DoubleSide })
  M.dark = new THREE.MeshStandardMaterial({ color: 0x2a313a, metalness: 0.8, roughness: 0.7 })
  M.granite = new THREE.MeshStandardMaterial({ color: 0x353b44, metalness: 0.1, roughness: 0.85 })
  M.ruby = new THREE.MeshPhysicalMaterial({ color: 0xc22b4a, metalness: 0, roughness: 0.05, transmission: 0.4, thickness: 0.4 })
  M.wire = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: 0 })
  M.ghost = new THREE.MeshBasicMaterial({ color: 0xe8ecf0, transparent: true, opacity: 0.0 })
  // TRACE additions: the one brand accent (cheatline) + the hero-marking pulse
  M.accent = new THREE.MeshBasicMaterial({ color: 0x2563eb })
  M.wireHero = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: 0 })

  // machined-surface tool marks: procedural striated roughness map
  const cv = document.createElement('canvas'); cv.width = cv.height = 256
  const cx = cv.getContext('2d')
  cx.fillStyle = '#787878'; cx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 2) {
    const v = 65 + Math.floor(Math.random() * 150)   // higher contrast striations — visible tool marks
    cx.fillStyle = `rgb(${v},${v},${v})`
    cx.globalAlpha = 0.6
    cx.fillRect(0, y, 256, 1)
  }
  cx.globalAlpha = 0.3
  for (let i = 0; i < 40; i++) {
    const v = 70 + Math.floor(Math.random() * 130)
    cx.fillStyle = `rgb(${v},${v},${v})`
    cx.fillRect(Math.random() * 256, 0, 1 + Math.random() * 2, 256)
  }
  const rough = new THREE.CanvasTexture(cv)
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping
  rough.repeat.set(3, 3)
  M.machined.roughnessMap = rough
  M.machined.roughness = 0.36
}

// rounded-rect extrude helper (the house technique from part3d.js)
export function roundedPlate(w, h, r, depth, bevel = 0.08, mat = null) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -h / 2)
  s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 20,
  })
  const mesh = new THREE.Mesh(g, mat || M.machined)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}
