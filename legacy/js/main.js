// Navigation, mobile menu, smooth scroll, active section tracking
(function () {
  const nav = document.getElementById('nav')
  const hamburger = document.querySelector('.nav-hamburger')
  const mobileNav = document.querySelector('.nav-mobile')
  const overlay = document.querySelector('.nav-overlay')
  const mobileClose = document.querySelector('.mobile-close')

  // ── F-35 hero parallax (moves slower than content on scroll) ──
  const heroBgImg = document.querySelector('.hero-photo-bg img')
  if (heroBgImg) {
    window.addEventListener('scroll', () => {
      // clamp so image doesn't shift past bottom of hero
      const y = Math.min(window.scrollY, window.innerHeight)
      heroBgImg.style.transform = `scale(1) translateY(${y * 0.28}px)`
    }, { passive: true })
  }

  // ── Active-nav targets ──
  // Declared BEFORE onScroll() runs below. onScroll() calls updateActiveNav()
  // on first paint, which reads these — const has a temporal dead zone, so if
  // they were declared further down (as before) the first call threw
  // "Cannot access 'sections' before initialization", aborting the whole
  // script and silently killing the industry tabs + counters.
  const sections = document.querySelectorAll('section[id], div[id]')
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]')

  // ── Nav scroll glass effect ──
  function onScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled')
    } else {
      nav.classList.remove('scrolled')
    }
    updateActiveNav()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ── Mobile menu ──
  function openMenu() {
    hamburger.classList.add('open')
    mobileNav.classList.add('open')
    overlay.classList.add('open')
    document.body.style.overflow = 'hidden'
  }
  function closeMenu() {
    hamburger.classList.remove('open')
    mobileNav.classList.remove('open')
    overlay.classList.remove('open')
    document.body.style.overflow = ''
  }
  if (hamburger) hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu()
  })
  if (overlay) overlay.addEventListener('click', closeMenu)
  document.querySelectorAll('.nav-mobile a').forEach(a => a.addEventListener('click', closeMenu))

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'))
      if (!target) return
      e.preventDefault()
      const navH = nav ? nav.offsetHeight : 0
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16
      window.scrollTo({ top, behavior: 'smooth' })
    })
  })

  // ── Active nav section highlighting ── (sections/navLinks declared up top)
  function updateActiveNav() {
    let current = ''
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top
      if (top <= 100) current = sec.id
    })
    navLinks.forEach(link => {
      link.classList.remove('active')
      if (link.getAttribute('href') === '#' + current) link.classList.add('active')
    })
  }

  // ── Drag-to-scroll on horizontal machine list ──
  const machineScroll = document.querySelector('.machines-scroll-wrap')
  if (machineScroll) {
    let isDown = false, startX, scrollLeft
    machineScroll.addEventListener('mousedown', e => {
      isDown = true
      startX = e.pageX - machineScroll.offsetLeft
      scrollLeft = machineScroll.scrollLeft
      machineScroll.style.cursor = 'grabbing'
    })
    machineScroll.addEventListener('mouseleave', () => { isDown = false; machineScroll.style.cursor = '' })
    machineScroll.addEventListener('mouseup', () => { isDown = false; machineScroll.style.cursor = '' })
    machineScroll.addEventListener('mousemove', e => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - machineScroll.offsetLeft
      machineScroll.scrollLeft = scrollLeft - (x - startX)
    })
  }

  // ── File drop zone ──
  const dropZone = document.querySelector('.drop-zone')
  const fileInput = document.getElementById('file-input')
  const fileLabel = document.getElementById('file-label')

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click())
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover') })
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'))
    dropZone.addEventListener('drop', e => {
      e.preventDefault()
      dropZone.classList.remove('dragover')
      const file = e.dataTransfer.files[0]
      if (file) {
        fileInput.files = e.dataTransfer.files
        if (fileLabel) fileLabel.textContent = file.name
      }
    })
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0]
      if (file && fileLabel) fileLabel.textContent = file.name
    })
  }

  // ── Notify-me form (index.html LetraOS section) ──
  const notifyForm = document.getElementById('notify-form')
  if (notifyForm) {
    notifyForm.addEventListener('submit', async e => {
      e.preventDefault()
      const email = notifyForm.querySelector('input[type="email"]').value.trim()
      if (!email) return
      const btn = notifyForm.querySelector('button')
      btn.disabled = true
      btn.textContent = 'Saving…'
      try {
        await window.letar.saveLead(email)
        btn.textContent = 'You\'re on the list!'
        btn.style.background = 'var(--green)'
        notifyForm.querySelector('input').value = ''
      } catch {
        btn.disabled = false
        btn.textContent = 'Notify Me'
      }
    })
  }

  // ── Industry Tabs ──
  const tabBtns = document.querySelectorAll('.tab-btn')
  const tabPanels = document.querySelectorAll('.tab-panel')
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false') })
      tabPanels.forEach(p => p.classList.remove('active'))
      btn.classList.add('active')
      btn.setAttribute('aria-selected', 'true')
      const panel = document.getElementById('tab-' + target)
      if (panel) panel.classList.add('active')
    })
  })

  // ── Counter animation (scroll-triggered count-up) ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10)
    const suffix = el.dataset.suffix || ''
    if (isNaN(target)) return
    const duration = 1600
    const step = 16
    const increment = target / (duration / step)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      el.textContent = Math.floor(current) + (current >= target ? suffix : '')
      if (current >= target) clearInterval(timer)
    }, step)
  }

  const counterEls = document.querySelectorAll('.counter-num[data-count]')
  if (counterEls.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target)
          counterObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.4 })
    counterEls.forEach(el => counterObserver.observe(el))
  }
})()
