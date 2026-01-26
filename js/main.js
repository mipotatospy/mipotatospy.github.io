const _app = {
  startScale: 0.55,
  endScale: 1.1,

  homeScaleStart: 4.0,
  homeScaleEnd: 1.15,

  homeYStart: 200,
  homeYEnd: 130,

  ticking: false,
  section: null,
  video: null,
  navHome: null,

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  getNavH() {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--navH")
      .trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  },

  update() {
    _app.ticking = false;

    const section = _app.section;
    const video = _app.video;
    const navHome = _app.navHome;
    if (!section || !video || !navHome) return;

    const rect = section.getBoundingClientRect();
    const navH = _app.getNavH();

    const stickyViewportH = window.innerHeight - navH;
    const scrollable = section.offsetHeight - stickyViewportH;

    const progressedPx = _app.clamp(-rect.top, 0, scrollable);
    const t = scrollable > 0 ? progressedPx / scrollable : 1;

    // smoothstep easing
    const ease = t * t * (3 - 2 * t);

    // Video scale
    const vScale = _app.startScale + (_app.endScale - _app.startScale) * ease;
    video.style.transform = `scale(${vScale})`;

    // Optional: toggle "full" state for border-radius rule
    section.classList.toggle("is-full", ease > 0.98);

    // Home title scale + position
    const hScale =
      _app.homeScaleStart +
      (_app.homeScaleEnd - _app.homeScaleStart) * ease;

    const hY =
      _app.homeYStart +
      (_app.homeYEnd - _app.homeYStart) * ease;

    // Set vars on the element (works because .nav-home uses var() on itself)
    navHome.style.setProperty("--homeScale", hScale.toFixed(3));
    navHome.style.setProperty("--homeY", `${hY.toFixed(1)}px`);
  },

  onScroll() {
    if (_app.ticking) return;
    _app.ticking = true;
    window.requestAnimationFrame(_app.update);
  },

  slideInAnimation() {
    const rows = document.querySelectorAll(".row");
    if (!rows.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.75 } // 0.75 is often too strict on shorter blocks
    );

    rows.forEach((row) => io.observe(row));
  },

  openPopup () {
    const body = document.body;

  function getActiveModal() {
    return document.querySelector('.gi-modal.active');
  }

  function openModal(modal) {
    if (!modal) return;

    // close any open modal first
    const current = getActiveModal();
    if (current && current !== modal) closeModal(current);

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('gi-modal-open');

    // optional: focus close button for accessibility
    const closeBtn = modal.querySelector('.gi-modal-close');
    closeBtn && closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    // if no other modal is open, unlock body scroll
    if (!getActiveModal()) body.classList.remove('gi-modal-open');
  }

  // OPEN: click any element with [data-modal]
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal]');
    if (!trigger) return;

    e.preventDefault();
    const modalId = trigger.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    openModal(modal);
  });

  // CLOSE: click overlay or close button
  document.addEventListener('click', (e) => {
    const modal = e.target.closest('.gi-modal.active');
    if (!modal) return;

    if (e.target.closest('.gi-modal-close') || e.target.classList.contains('gi-modal-overlay')) {
      e.preventDefault();
      closeModal(modal);
    }
  });

  // CLOSE: ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = getActiveModal();
    if (modal) closeModal(modal);
  });
  },

  tabManager() {
      const root = document.getElementById('participate');
      if(!root) return;
  
      const tabs   = Array.from(root.querySelectorAll('.gi-tab'));
      const panels = Array.from(root.querySelectorAll('.gi-panel'));
  
      function setActive(key, focusPanel=false){
        tabs.forEach(t=>{
          const on = t.dataset.target === key;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
        });
  
        panels.forEach(p=>{
          const on = p.dataset.key === key;
          p.classList.toggle('is-active', on);
          p.hidden = !on;
        });
  
        if(focusPanel){
          const panel = panels.find(p=>p.dataset.key === key);
          if(panel) panel.focus({preventScroll:true});
        }
      }
  
      // init hidden states for a11y
      panels.forEach(p => p.hidden = !p.classList.contains('is-active'));
  
      // click
      tabs.forEach(t=>{
        t.addEventListener('click', (e)=>{
          // If user CMD/CTRL clicks, open the related page
          if(e.metaKey || e.ctrlKey){
            const href = t.dataset.href;
            if(href) window.open(href, '_blank', 'noopener');
            return;
          }
          setActive(t.dataset.target);
        });
  
        // keyboard support (tabs pattern)
        t.addEventListener('keydown', (e)=>{
          const i = tabs.indexOf(t);
          if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){
            e.preventDefault();
            const next = tabs[(i+1) % tabs.length];
            next.focus();
            setActive(next.dataset.target);
          }
          if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){
            e.preventDefault();
            const prev = tabs[(i-1 + tabs.length) % tabs.length];
            prev.focus();
            setActive(prev.dataset.target);
          }
          if(e.key === 'Home'){
            e.preventDefault();
            tabs[0].focus();
            setActive(tabs[0].dataset.target);
          }
          if(e.key === 'End'){
            e.preventDefault();
            tabs[tabs.length-1].focus();
            setActive(tabs[tabs.length-1].dataset.target);
          }
          // Enter/Space activates + focuses panel
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            setActive(t.dataset.target, true);
          }
        });
      });
  
      // Optional: deep-link with ?tab=speaker
      const url = new URL(window.location.href);
      const key = url.searchParams.get('tab');
      if(key && panels.some(p=>p.dataset.key === key)){
        setActive(key);
      }
  },

  carouselManager () {
      const root = document.querySelector('.sc');
      if (!root) return;
    
      const viewport = root.querySelector('[data-sc-viewport]');
      const track = root.querySelector('[data-sc-track]');
      const btnPrev = root.querySelector('[data-sc-prev]');
      const btnNext = root.querySelector('[data-sc-next]');
      const dotsWrap = root.querySelector('[data-sc-dots]');
      const cards = Array.from(track.children);
    
      // --- helpers ---
      const cardStep = () => {
        const first = cards[0];
        if (!first) return 300;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        return first.getBoundingClientRect().width + gap;
      };
    
      function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
    
      function setButtons(){
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 1;
        btnPrev.disabled = viewport.scrollLeft <= 0;
        btnNext.disabled = viewport.scrollLeft >= maxScroll;
      }
    
      // --- dots ---
      function buildDots(){
        dotsWrap.innerHTML = '';
        cards.forEach((_, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'sc-dot';
          b.setAttribute('aria-label', `Go to item ${i + 1}`);
          b.addEventListener('click', () => {
            viewport.scrollTo({ left: i * cardStep(), behavior: 'smooth' });
          });
          dotsWrap.appendChild(b);
        });
      }
    
      function setActiveDot(){
        const step = cardStep();
        const i = clamp(Math.round(viewport.scrollLeft / step), 0, cards.length - 1);
        dotsWrap.querySelectorAll('.sc-dot').forEach((d, idx) => {
          d.classList.toggle('is-active', idx === i);
        });
      }
    
      // --- arrows ---
      btnPrev.addEventListener('click', () => {
        viewport.scrollBy({ left: -cardStep(), behavior: 'smooth' });
      });
      btnNext.addEventListener('click', () => {
        viewport.scrollBy({ left: cardStep(), behavior: 'smooth' });
      });
    
      // --- keyboard (when viewport focused) ---
      viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); btnNext.click(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); btnPrev.click(); }
      });
    
      // --- drag to scroll (mouse + touch) ---
      let isDown = false, startX = 0, startScroll = 0;
    
      viewport.addEventListener('pointerdown', (e) => {
        isDown = true;
        viewport.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startScroll = viewport.scrollLeft;
        viewport.style.scrollBehavior = 'auto'; // avoid fighting smooth while dragging
      });
    
      viewport.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        viewport.scrollLeft = startScroll - dx;
      });
    
      function endDrag(){
        if (!isDown) return;
        isDown = false;
        viewport.style.scrollBehavior = 'smooth';
        setButtons();
        setActiveDot();
      }
    
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      viewport.addEventListener('pointerleave', endDrag);
    
      // --- sync UI on scroll (throttled) ---
      let raf = null;
      viewport.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          setButtons();
          setActiveDot();
        });
      });
    
      // init
      buildDots();
      setButtons();
      setActiveDot();
    
      // update on resize
      window.addEventListener('resize', () => {
        setButtons();
        setActiveDot();
      });
  },

  carouselManager2(){
    const carousels = document.querySelectorAll('.hc-right');

  carousels.forEach((root) => {
    const viewport = root.querySelector('[data-hc-viewport]');
    const track = root.querySelector('[data-hc-track]');
    const prev = root.querySelector('[data-hc-prev]');
    const next = root.querySelector('[data-hc-next]');

    if (!viewport || !track || !prev || !next) return;

    const items = Array.from(track.children);

    const step = () => {
      const first = items[0];
      if (!first) return 300;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return first.getBoundingClientRect().width + gap;
    };

    function setButtons(){
      const maxScroll = viewport.scrollWidth - viewport.clientWidth - 1;
      prev.disabled = viewport.scrollLeft <= 0;
      next.disabled = viewport.scrollLeft >= maxScroll;
    }

    prev.addEventListener('click', () => {
      viewport.scrollBy({ left: -step(), behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
      viewport.scrollBy({ left:  step(), behavior: 'smooth' });
    });

    // keyboard (when focused)
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev.click(); }
    });

    // drag to scroll (mouse + touch)
    let down = false, startX = 0, startScroll = 0;

    viewport.addEventListener('pointerdown', (e) => {
      down = true;
      viewport.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.style.scrollBehavior = 'auto';
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!down) return;
      viewport.scrollLeft = startScroll - (e.clientX - startX);
    });

    function end(){
      if (!down) return;
      down = false;
      viewport.style.scrollBehavior = 'smooth';
      setButtons();
    }

    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('pointerleave', end);

    // optional: vertical wheel -> horizontal scroll (nice on desktop)
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        viewport.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // sync buttons on scroll (throttled)
    let raf = null;
    viewport.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setButtons();
      });
    });

    // init
    setButtons();
    window.addEventListener('resize', setButtons);
  });
  },

  main() {
    _app.section = document.getElementById("growVideo");
    _app.video = _app.section?.querySelector(".vid");
    _app.navHome = document.getElementById("navHome");

    if (!_app.section || !_app.video || !_app.navHome) return;

    _app.slideInAnimation();

    window.addEventListener("scroll", _app.onScroll, { passive: true });
    window.addEventListener("resize", _app.onScroll);

    _app.update(); // set initial state
    _app.openPopup();
    _app.tabManager();
    _app.carouselManager();
    _app.carouselManager2();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  _app.main();
  window.initFocusCarousels?.();
});

