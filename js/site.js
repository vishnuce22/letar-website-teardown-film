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
  nav.addEventListener('click', (e) => {
    // drawer accordions: the group parent toggles its sub-links instead
    // of navigating (the hub pages are reachable via their first sub-link)
    const parent = e.target.closest('.nav-parent')
    if (parent && matchMedia('(max-width: 1080px)').matches) {
      e.preventDefault()
      const group = parent.closest('.nav-group')
      nav.querySelectorAll('.nav-group.open').forEach((g) => { if (g !== group) g.classList.remove('open') })
      group.classList.toggle('open')
      return
    }
    if (e.target.closest('a')) setNav(false)
  })
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return
    if (e.target.closest('.nav') || e.target.closest('.nav-toggle')) return
    setNav(false) // tap anywhere else — including the dimmed backdrop — closes
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false) })
}

// ── Header glass: extra-transparent while at the very top ─────
// (film-header on the homepage keeps its own gradient scrim)
const siteHeader = document.querySelector('.site-header:not(.film-header)')
if (siteHeader) {
  const setGlass = () => siteHeader.classList.toggle('at-top', (window.scrollY || 0) < 24)
  addEventListener('scroll', setGlass, { passive: true })
  setGlass()
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

// ── certificate lightbox: click a framed document to view it full screen
//    at full quality; browser Back (or ✕ / Esc / backdrop) closes it ──
const certImgs = document.querySelectorAll('.frame-img img')
if (certImgs.length) {
  const box = document.createElement('div')
  box.className = 'lightbox'
  box.innerHTML = '<button class="lb-close" aria-label="Back">&larr; Back</button><img alt="" />'
  document.body.appendChild(box)
  const lbImg = box.querySelector('img')

  function openBox(src, alt) {
    lbImg.src = src
    lbImg.alt = alt || ''
    box.classList.add('open')
    document.body.style.overflow = 'hidden'
    history.pushState({ lightbox: true }, '')
  }
  function closeBox(viaHistory) {
    if (!box.classList.contains('open')) return
    box.classList.remove('open')
    document.body.style.overflow = ''
    if (!viaHistory && history.state && history.state.lightbox) history.back()
  }
  certImgs.forEach((img) => {
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', () => openBox(img.currentSrc || img.src, img.alt))
  })
  box.querySelector('.lb-close').addEventListener('click', () => closeBox(false))
  box.addEventListener('click', (e) => { if (e.target === box) closeBox(false) })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBox(false) })
  addEventListener('popstate', () => closeBox(true))
}
