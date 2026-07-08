// Letar site behavior: mobile nav, scroll reveal, stat count-up.
// Forms are handled separately by supabase-client.js (contact page only).

// Reveal styles only activate when JS is confirmed running (fail-open).
document.documentElement.classList.add('js')

// ── Mobile nav ────────────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle')
const nav = document.querySelector('.nav')
if (toggle && nav) {
  const setNav = (open) => {
    nav.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }
  toggle.addEventListener('click', (e) => {
    e.stopPropagation()
    setNav(!nav.classList.contains('open'))
  })
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false) })
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return
    if (e.target.closest('.nav') || e.target.closest('.nav-toggle')) return
    setNav(false) // tap anywhere else — including the dimmed backdrop — closes
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false) })
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Scroll reveal ─────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal')
if (reduced) {
  revealEls.forEach((el) => el.classList.add('in'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  revealEls.forEach((el) => io.observe(el))
}

// ── Stat count-up (runs once when visible) ────────────────────
const counters = document.querySelectorAll('[data-count]')
function runCounter(el) {
  const target = parseInt(el.dataset.count, 10)
  const unit = el.querySelector('.unit')
  const start = performance.now()
  const dur = 1100
  function tick(now) {
    const p = Math.min((now - start) / dur, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    const val = String(Math.round(target * eased))
    el.childNodes[0].nodeValue = val
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
if (reduced) {
  counters.forEach((el) => { el.childNodes[0].nodeValue = el.dataset.count })
} else {
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCounter(e.target)
          cio.unobserve(e.target)
        }
      })
    },
    { threshold: 0.4 }
  )
  counters.forEach((el) => cio.observe(el))
}
