// THREE THEATERS — pinned scroll choreography.
// Three looping panel videos (FLOOR · SKY · ORBIT) fall into rhythm as you
// scroll, then the dividers slide away and the scene merges into one frame.
//
// Phase A (0–28%):  panels loop at 0.9 / 1.0 / 1.1 playbackRate — independent.
// Phase B (28–50%): rates ease to 1.0 and loop phases lock (PLL-style gentle
//                   rate corrections — never currentTime seeks, no stutter).
// Phase C (50–74%): dividers slide away, panels crossfade to the merge clip.
// Focus  (68–86%):  the merge scene blurs + dims back (--focus veil) and the
//                   Letar lockup takes the frame.
// Hold   (86–100%): nothing moves — the finished card sits before unpinning.
//
// Desktop + motion-OK only. Phones and reduced-motion get the static CSS
// fallback (posters + cards, no pinning, no video downloads) — same pattern
// as the previous film (see videos.js history).
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const active = matchMedia('(min-width: 861px)').matches && !reduced

const section = document.getElementById('theaters')

// phones (motion OK): no pinned choreography — the three panel loops just
// play in place as you scroll past them; lazy src, pause off-screen
if (section && !active && !reduced) {
  const vids = [...section.querySelectorAll('.th-panel video, .th-merge video')]
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target
      if (e.isIntersecting) {
        if (!v.src && v.dataset.video) { v.src = v.dataset.video; v.load() }
        v.play().catch(() => {})
      } else { v.pause() }
    })
  }, { threshold: 0.25 })
  vids.forEach((v) => io.observe(v))
}

if (section && active) {
  const stage = section.querySelector('.th-stage')
  const panels = [...section.querySelectorAll('.th-panel')]
  const videos = panels.map((p) => p.querySelector('video'))
  const baseRates = panels.map((p) => parseFloat(p.dataset.rate) || 1)
  const dividers = [...section.querySelectorAll('.th-divider')]
  const mergeWrap = section.querySelector('.th-merge')
  const mergeVideo = mergeWrap && mergeWrap.querySelector('video')
  const finalCap = section.querySelector('.th-final')

  let inView = false

  // lazy-load all theater videos just before the section arrives; if the
  // section is already on screen when the src lands, start playback then
  // (the play/pause observer only reacts to visibility CHANGES).
  const loader = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      videos.concat(mergeVideo ? [mergeVideo] : []).forEach((v, i) => {
        if (v && !v.src && v.dataset.video) {
          v.src = v.dataset.video
          v.load()
          if (inView && v !== mergeVideo) {
            v.playbackRate = baseRates[i] || 1
            v.play().catch(() => {})
          }
        }
      })
      loader.disconnect()
    })
  }, { rootMargin: '80% 0px' })
  loader.observe(section)

  // play/pause with section visibility — three small loops decode at once,
  // which is why the encodes are kept ≤6 MB / 1080p (see plan)
  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      inView = e.isIntersecting
      videos.forEach((v, i) => {
        if (!v || !v.src) return
        if (inView) { v.playbackRate = baseRates[i]; v.play().catch(() => {}) }
        else v.pause()
      })
      if (!inView && mergeVideo) mergeVideo.pause()
    })
  }, { threshold: 0.05 })
  player.observe(section)

  const clamp = (x, a, b) => Math.min(Math.max(x, a), b)
  const ease = (t) => t * t * (3 - 2 * t) // smoothstep

  let mergeStarted = false
  let queued = false

  function apply() {
    queued = false
    const r = section.getBoundingClientRect()
    const runway = r.height - innerHeight
    const p = runway > 0 ? clamp(-r.top / runway, 0, 1) : 0

    // ── Phase B: ease rates to 1.0 + phase-lock to the SKY (middle) loop ──
    const tb = ease(clamp((p - 0.28) / 0.22, 0, 1))
    const master = videos[1]
    const L = master && master.duration ? master.duration : 0
    videos.forEach((v, i) => {
      if (!v || !v.duration) return
      let rate = baseRates[i] + (1 - baseRates[i]) * tb
      if (tb > 0 && L && i !== 1) {
        // PLL: nudge the rate toward zero phase error against the master
        const phase = v.currentTime % L
        const target = master.currentTime % L
        let err = target - phase
        if (err > L / 2) err -= L
        if (err < -L / 2) err += L
        rate *= 1 + clamp(err * 0.09, -0.12, 0.12) * tb
      }
      v.playbackRate = rate
    })

    // divider treatment through B: thin + amber glow
    dividers.forEach((d) => d.style.setProperty('--sync', tb.toFixed(3)))

    // ── Phase C: dividers slide away, panels fade, merge takes the frame ──
    const tc = ease(clamp((p - 0.5) / 0.24, 0, 1))
    stage.style.setProperty('--merge', tc.toFixed(3))
    // focus pull: the merge scene recedes behind a vignette veil while the
    // lockup card arrives — same scroll-driven var mechanism as --merge
    const tf = ease(clamp((p - 0.68) / 0.18, 0, 1))
    stage.style.setProperty('--focus', tf.toFixed(3))
    if (tc > 0 && mergeVideo && !mergeStarted && mergeVideo.src) {
      mergeStarted = true
      // play once and hold the final frame — the resolved scene stays put
      // (onended assignment is idempotent, so replays re-arm the hold)
      mergeVideo.onended = () => {
        mergeVideo.currentTime = Math.max(0, mergeVideo.duration - 0.05)
        mergeVideo.pause()
      }
      mergeVideo.play().catch(() => {})
    }
    if (p < 0.45 && mergeStarted && mergeVideo) {
      // scrolled well back up — reset so the merge can play again (hysteresis:
      // jiggling at the tc boundary must not restart the clip)
      mergeStarted = false
      mergeVideo.pause()
      mergeVideo.currentTime = 0
    }
    // card opacity rides --focus in CSS; the class only gates pointer-events
    if (finalCap) finalCap.classList.toggle('on', tf > 0.5)
  }

  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(apply) } }, { passive: true })
  addEventListener('resize', () => { if (!queued) { queued = true; requestAnimationFrame(apply) } }, { passive: true })
  apply()
}
