// Scroll reveals + counter animation
(function () {
  // ── IntersectionObserver for .reveal elements ──
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => io.observe(el))

  // ── Counter animation ──
  const counters = document.querySelectorAll('[data-count]')
  if (counters.length === 0) return

  const counterIO = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const target = parseInt(el.dataset.count, 10)
        const suffix = el.dataset.suffix || ''
        const prefix = el.dataset.prefix || ''
        const duration = 1800
        const startTime = performance.now()

        function tick(now) {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          const current = Math.round(eased * target)
          el.textContent = prefix + current + suffix
          if (progress < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
        counterIO.unobserve(el)
      })
    },
    { threshold: 0.5 }
  )

  counters.forEach(el => counterIO.observe(el))

  // ── Staggered children: add .reveal to each child ──
  document.querySelectorAll('.stagger').forEach(parent => {
    Array.from(parent.children).forEach(child => {
      if (!child.classList.contains('reveal')) {
        child.classList.add('reveal')
        io.observe(child)
      }
    })
  })
})()
