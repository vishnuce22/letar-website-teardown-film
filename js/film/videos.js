// TRACE video chapters — sticky-hold scrollytelling on NATIVE scroll.
// Desktop (≥861px): each chapter's 100vh frame pins while its clip plays;
// chapter changes ride the sticky stack (the incoming frame slides over the
// outgoing one) — no scroll-jacking, no per-tick opacity scrubbing, exactly
// one video decoding at a time. Phones + reduced-motion: fully static — CSS
// shows posters + captions in normal flow and no video ever loads.
//
// Removed deliberately (all four caused reported scroll bugs — don't re-add):
//  · JS "settle-snap" (scrollTo after input-quiet) — fought wheel/touch momentum
//  · GSAP scrub timelines fading video opacity per scroll tick — compositing jank
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const desktop = matchMedia('(min-width: 861px)').matches
const filmActive = !reduced // films play on phones too (muted+playsinline)

const chapters = [...document.querySelectorAll('.vchap')]
const frames = chapters.map((c) => c.querySelector('.vchap-frame') || c)
const dots = [...document.querySelectorAll('.film-dots button')]

if (filmActive) {
  // lazy-load a chapter's video just before it's needed
  const loader = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      const v = e.target.querySelector('video')
      if (v && !v.src) {
        v.src = e.target.dataset.video
        v.load()
      }
      loader.unobserve(e.target)
    })
  }, { rootMargin: '120% 0px' })

  // play/pause + caption reveal — observed on the pinned frame. Pause the
  // moment a frame stops being the dominant scene: one video decodes at a time.
  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const frame = e.target
      const sec = frame.closest('.vchap')
      const v = frame.querySelector('video')
      if (e.intersectionRatio >= 0.45) {
        sec.classList.add('on')
        if (v && !v.src && sec.dataset.video) { v.src = sec.dataset.video; v.load() } // beat the lazy-loader race
        if (v) v.play().catch(() => {})
        const i = frames.indexOf(frame)
        if (i >= 0) dots.forEach((d, k) => d.classList.toggle('on', k === i))
      } else {
        sec.classList.remove('on')
        if (v) v.pause()
      }
    })
  }, { threshold: [0, 0.45, 1] })

  chapters.forEach((c) => loader.observe(c))
  frames.forEach((f) => player.observe(f))

}

// Hero push-in: as you scroll off CH0, the caption rises toward screen center
// and zooms (scale up) while fading — a 3D forward motion synced with the jet's
// zoom that pulls the eye down and urges the scroll. Driven DIRECTLY from the
// exact scroll position (not a lagged ScrollTrigger scrub) so it is fully
// deterministic: at the top it is always at rest, even when the snap deck
// brings you back UP to the hero (the scrub-lag left it stuck mid-fade before).
// Desktop + motion-OK only; mobile/reduced-motion keep the static CSS caption.
if (filmActive && desktop) {
  const hero = document.getElementById('vc0')
  const heroCap = hero && hero.querySelector('.vcap')
  if (heroCap) {
    // cache the height — reading offsetHeight every scroll frame forced a layout
    // (layout thrashing) that showed up as jank in the profiler.
    let heroH = hero.offsetHeight
    addEventListener('resize', () => { heroH = hero.offsetHeight }, { passive: true })
    let queued = false
    const apply = () => {
      queued = false
      const p = Math.min(Math.max(scrollY / heroH, 0), 1) // 0 at rest → 1 as it exits
      heroCap.style.transform = `translateX(-50%) translate3d(0, ${(-innerHeight * 0.52 * p).toFixed(1)}px, 0) scale(${(1 + 0.18 * p).toFixed(3)})`
      heroCap.style.opacity = (1 - p).toFixed(3)
    }
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(apply) } }, { passive: true })
    apply() // set the rest state immediately
  }
}

// typed CMM readings when the proof chapter's frame arrives (all breakpoints —
// on phones the captions are static-visible and the type-in still reads)
const proofFrame = document.querySelector('#vc-proof .vchap-frame')
if (proofFrame) {
  const typer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.intersectionRatio < 0.45) return
      proofFrame.querySelectorAll('.reading').forEach((r, i) => {
        setTimeout(() => r.classList.add('typed'), 600 + i * 700)
      })
      typer.disconnect()
    })
  }, { threshold: 0.45 })
  typer.observe(proofFrame)
}

// two-act chapters: any .vchap[data-act2] swaps to its second caption when
// the film clock passes the mark (the white-flash moment in the edit)
document.querySelectorAll('.vchap[data-act2]').forEach((sec) => {
  const v = sec.querySelector('video')
  if (!v) return
  const acts = ['act2', 'act3', 'act4'].filter((k) => isFinite(parseFloat(sec.dataset[k])))
  if (!acts.length) return
  v.addEventListener('timeupdate', () => {
    acts.forEach((k) => sec.classList.toggle(k, v.currentTime >= parseFloat(sec.dataset[k])))
  })
})
