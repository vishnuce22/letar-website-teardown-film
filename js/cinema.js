// Scroll-cinema choreography (index.html) — GSAP ScrollTrigger + Lenis.
// Degradation ladder: reduced-motion → nothing animates (site.js reveals all);
// mobile (<861px) → no pinning, rails become native swipe; no GSAP (CDN down)
// → static page, content fully visible.

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = window.matchMedia('(max-width: 860px)').matches
  if (reduced || typeof gsap === 'undefined') return

  gsap.registerPlugin(ScrollTrigger)

  // ── Smooth scroll (desktop only) ────────────────────────────
  if (!mobile && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: 0.11 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  // ── Progress rail ───────────────────────────────────────────
  const fill = document.querySelector('.progress-rail .fill')
  if (fill) {
    gsap.to(fill, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    })
  }

  // ── Hero: staggered line reveal + slow media zoom ───────────
  gsap.from('.cine-hero h1 .line > span', {
    yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.12, delay: 0.15,
  })
  gsap.from('.cine-hero .lede, .cine-hero .hero-ctas, .cine-hero .hero-titleblock', {
    y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.55,
  })
  const heroMedia = document.querySelector('.cine-hero .hero-media')
  if (heroMedia) {
    gsap.fromTo(heroMedia, { scale: 1.08 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.cine-hero', start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  // ── Process strip: pin + horizontal scrub (desktop) ─────────
  const track = document.querySelector('.process-track')
  if (track && !mobile) {
    const pan = () => -(track.scrollWidth - window.innerWidth + 48)
    gsap.to(track, {
      x: pan, ease: 'none',
      scrollTrigger: {
        trigger: '.process-scene', start: 'top top',
        end: () => '+=' + (track.scrollWidth - window.innerWidth + 400),
        pin: '.process-pin', scrub: 0.4, invalidateOnRefresh: true,
      },
    })
  }

  // ── Markets rail: gentle drift (desktop) ────────────────────
  const markets = document.querySelector('.markets-track')
  if (markets && !mobile) {
    gsap.to(markets, {
      x: () => -(markets.scrollWidth - window.innerWidth + 48), ease: 'none',
      scrollTrigger: {
        trigger: '.markets-scene', start: 'top 20%',
        end: () => '+=' + (markets.scrollWidth - window.innerWidth), scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
  }

  // ── Card 3D tilt on pointer ─────────────────────────────────
  if (!mobile) {
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 7 + 'deg')
        card.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 7 + 'deg')
      })
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg')
        card.style.setProperty('--ry', '0deg')
      })
    })
  }

  // ── 3D billet scene: lazy-load Three.js module on approach ──
  const billet = document.querySelector('.billet-scene')
  if (billet && !mobile && window.WebGLRenderingContext) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        import('./part3d.js')
          .then((m) => m.mountBillet(billet))
          .catch(() => {}) // poster stays — fail-open
      }
    }, { rootMargin: '600px' })
    io.observe(billet)
  }
  // Callouts fade with scroll progress even without the 3D module
  document.querySelectorAll('.billet-callout').forEach((c) => {
    gsap.to(c, {
      opacity: 1, y: -6, duration: 0.4,
      scrollTrigger: {
        trigger: '.billet-scene',
        start: 'top ' + (30 - parseFloat(c.dataset.at || 0.3) * 20) + '%',
        toggleActions: 'play none none reverse',
      },
    })
  })

  // ── Media upgrade: swap posters for Seedance clips when files exist ──
  document.querySelectorAll('[data-video]').forEach(async (host) => {
    const src = host.dataset.video
    try {
      const head = await fetch(src, { method: 'HEAD' })
      if (!head.ok) return
      const img = host.querySelector('img')
      const video = document.createElement('video')
      video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true
      video.preload = 'metadata'
      if (img) video.poster = img.currentSrc || img.src
      video.src = src
      video.className = img ? img.className || 'vid-cover' : 'vid-cover'
      if (!video.className) video.className = 'vid-cover'
      video.addEventListener('canplay', () => {
        if (img) img.replaceWith(video)
        else host.prepend(video)
        video.play().catch(() => {})
      }, { once: true })
      video.load()
    } catch (_) { /* offline or missing — poster remains */ }
  })
})()
