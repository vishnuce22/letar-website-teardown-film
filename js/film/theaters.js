// THREE THEATERS — two snap chapters, teardown-deck style.
// Chapter 1: the three panel loops (FLOOR · SKY · ORBIT) play side by side at
// their own rates (0.9 / 1.0 / 1.1 — the rhythm). Chapter 2: the merge film
// plays on arrival; at mid-clip the section gains .merged — CSS dims the film
// and raises the lockup card, dead-centered in the same grid cell.
//
// One IO-driven path for desktop AND phones (phones just stack the chapters).
// Reduced-motion: fully static CSS fallback — posters, no video downloads.
//
// Removed deliberately (the old scroll-scrubbed build — don't re-add):
//  · 220vh runway + sticky stage + --merge/--focus/--sync scroll vars
//  · PLL rate-locking phases — the owner wants chaptered scroll, not scrub
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

const section = document.getElementById('theaters')

if (section && !reduced) {
  // panel loops: lazy src, play at the panel's rate on screen, pause off
  const panelVids = [...section.querySelectorAll('.th-panel video')]
  const panels = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target
      if (e.isIntersecting) {
        if (!v.src && v.dataset.video) { v.src = v.dataset.video; v.load() }
        v.playbackRate = parseFloat(v.closest('.th-panel').dataset.rate) || 1
        v.play().catch(() => {})
      } else { v.pause() }
    })
  }, { threshold: 0.25 })
  panelVids.forEach((v) => panels.observe(v))

  const mergeWrap = section.querySelector('.th-merge')
  const mergeV = mergeWrap && mergeWrap.querySelector('video')
  if (mergeV) {
    const reveal = () => section.classList.add('merged')

    // the card rises at MID-clip (owner: "midhalf bring up the logo card"),
    // with a fixed floor so a missing duration can't stall the reveal
    mergeV.addEventListener('timeupdate', () => {
      const half = (isFinite(mergeV.duration) && mergeV.duration > 0)
        ? mergeV.duration / 2 : 3
      if (mergeV.currentTime >= half) reveal()
    })
    mergeV.addEventListener('ended', reveal)

    let armed = false
    const player = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.intersectionRatio >= 0.5) {
          if (!mergeV.src && mergeV.dataset.video) { mergeV.src = mergeV.dataset.video; mergeV.load() }
          mergeV.play().catch(() => {})
          // safety: data-saver browsers that refuse playback still get the card
          if (!armed) { armed = true; setTimeout(reveal, 9000) }
        } else {
          mergeV.pause()
        }
      })
    }, { threshold: [0, 0.5, 1] })
    player.observe(mergeWrap)

    // fast scrollers who blow past the merge must not land on an empty card
    const cardEl = section.querySelector('.th-final')
    if (cardEl) {
      const armCard = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          if (mergeV.ended) reveal()
          else setTimeout(reveal, 3500)
          armCard.disconnect()
        })
      }, { threshold: 0.3 })
      armCard.observe(cardEl)
    }
  }
}
