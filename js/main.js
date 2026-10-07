const _app = {
  startScale: 0.55,
  endScale: 1.1,

  homeScaleStart: 0.8,
  homeScaleEnd: 0.3,

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

      const logo = document.getElementById("navHomeLogo");

      // whole-pixel translate to reduce blur
      navHome.style.setProperty("--homeY", `${Math.round(hY)}px`);
      navHome.style.setProperty("--homeScale", hScale.toFixed(3));
      
      // Safari repaint nudge (only when we have the img)
      // if (logo) {
      //   logo.style.transform = `translateZ(0) scale(${hScale.toFixed(9)})`;
      // }
      const inner = navHome.querySelector('.nav-home-inner');
      if (inner) {
        inner.style.transform = `translateZ(0) scale(${hScale.toFixed(3)})`;
      }

    // Set vars on the element (works because .nav-home uses var() on itself)
    navHome.style.setProperty("--homeScale", hScale.toFixed(9));
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
    const counter = document.createElement('div');
    counter.className = 'hc-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');
    root.appendChild(counter);

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

    function setGalleryState(){
      const current = Math.max(0, Math.min(items.length - 1, Math.round(viewport.scrollLeft / step())));
      items.forEach((item, index) => item.classList.toggle('is-current', index === current));
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
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
      setGalleryState();
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
        setGalleryState();
      });
    });

    // init
    setButtons();
    setGalleryState();
    window.addEventListener('resize', () => {
      setButtons();
      setGalleryState();
    });
  });
  },

  isMobile() { return window.matchMedia("(max-width: 768px)").matches; },
  applyHomeConfig() {
    if (_app.isMobile()) {
      _app.homeScaleStart = 0.80;
      _app.homeScaleEnd   = 0.30;
      _app.homeYStart     = 200;
      _app.homeYEnd       = 130;
    } else {
      // 👇 put your original DESKTOP values here
      _app.homeScaleStart = 0.55;  // example
      _app.homeScaleEnd   = 0.20;  // example
      _app.homeYStart     = 160;   // example
      _app.homeYEnd       = 110;   // example
    }
  },

  main() {
    _app.applyHomeConfig();
    _app.section = document.getElementById("growVideo");
    _app.video = _app.section?.querySelector(".vid");
    _app.navHome = document.getElementById("navHome");

    // if (!_app.section || !_app.video || !_app.navHome) return;

    _app.slideInAnimation();

    // window.addEventListener("scroll", _app.onScroll, { passive: true });

    // window.addEventListener("resize", () => {
    //   _app.applyHomeConfig();
    //   _app.onScroll();
    // });

    // _app.update(); 
    _app.openPopup();
    _app.tabManager();
    _app.carouselManager();
    _app.carouselManager2();
  },
};

async function loadProducts() {
  const API_URL = "https://dry-sound-a11d.micaela-8e6.workers.dev/api/products";
  const container = document.getElementById("products-container");

  if (!container) return;

  container.setAttribute("aria-busy", "true");
  container.innerHTML = '<p class="shop-status">Loading products…</p>';

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const products = data.products || [];

    container.innerHTML = "";

    if (!products.length) {
      container.setAttribute("aria-busy", "false");
      container.innerHTML = '<p class="shop-status">No products are currently available.</p>';
      return;
    }

    products.forEach(p => {
      const price = (p.amount / 100).toFixed(2);
      const currency = (p.currency || "usd").toUpperCase();

      const card = document.createElement("div");
      card.className = "stripe-product-card";

      card.innerHTML = `
        <img class="stripe-product-image" src="${p.image || ""}" alt="${p.product_name}">
        <div class="stripe-product-text-content">
          <h2 class="stripe-product-title">${p.product_name}</h2>
          <p class="stripe-product-price">$${price} ${currency}</p>
          <p class="stripe-product-description">${p.product_description || ""}</p>
          <button class="stripe-product-button" data-price="${p.price_id}" type="button" disabled>
            SOLD OUT!
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    container.setAttribute("aria-busy", "false");

  } catch (err) {
    console.error(err);
    container.setAttribute("aria-busy", "false");
    container.innerHTML = '<p class="shop-status shop-status--error">Products could not be loaded. Please try again later.</p>';
  }
}

// document.addEventListener("DOMContentLoaded", loadProducts);

function initMobileMenu(){
  const header = document.getElementById('siteNav');
  const btn = document.querySelector('.nav-burger');
  const menu = document.getElementById('mobileMenu');
  if(!header || !btn || !menu) return;

  const links = [...menu.querySelectorAll('a')];
  let previouslyFocused = null;

  links.forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/index\.html$/, '');
    const pagePath = window.location.pathname.replace(/index\.html$/, '');
    if (linkPath === pagePath) link.setAttribute('aria-current', 'page');
  });

  function open(){
    previouslyFocused = document.activeElement;
    header.classList.add('is-menu-open');
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    requestAnimationFrame(() => {
      (menu.querySelector('[aria-current="page"]') || links[0])?.focus();
    });
  }

  function close({ returnFocus = false } = {}){
    header.classList.remove('is-menu-open');
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (returnFocus && previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? close({ returnFocus: true }) : open();
  });

  // close when tapping a link
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });

  // close when clicking outside the header
  document.addEventListener('click', (e) => {
    if (menu.hidden) return;
    if (e.target.closest('#siteNav')) return;
    close();
  });

  // close on ESC
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close({ returnFocus: true });
      return;
    }

    if (e.key === 'Tab') {
      const focusable = [btn, ...links];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // close on resize to desktop
  window.addEventListener('resize', () => {
    if(window.matchMedia('(min-width: 769px)').matches) close();
  });

  // ensure starting state
  close();
}

function initSocialRail() {
  if (document.querySelector('.social-rail')) return;

  const rail = document.createElement('nav');
  rail.className = 'social-rail';
  rail.setAttribute('aria-label', 'Social media');
  rail.innerHTML = `
    <a href="https://www.instagram.com/womeninwineandspiritsglobal?utm_source=ig_web_button_share_sheet&amp;stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Women in Wine and Spirits on Instagram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>
    </a>
    <a href="https://www.linkedin.com/company/womeninwineandspirits/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="Women in Wine and Spirits on LinkedIn">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.34 3.5A2.34 2.34 0 1 1 .66 3.5a2.34 2.34 0 0 1 4.68 0ZM.95 7h4.78v15H.95V7Zm7.69 0h4.58v2.05h.07c.63-1.21 2.2-2.49 4.52-2.49 4.84 0 5.74 3.19 5.74 7.34V22h-4.77v-7.18c0-1.71-.04-3.92-2.39-3.92-2.39 0-2.76 1.87-2.76 3.79V22H8.64V7Z"/></svg>
    </a>`;
  document.body.appendChild(rail);
}

function initProducerDialogs() {
  const triggers = document.querySelectorAll('.producer-card__trigger[aria-controls]');
  if (!triggers.length) return;

  let returnFocusTo = null;

  const closeDialog = dialog => {
    if (dialog?.open) dialog.close();
  };

  triggers.forEach(trigger => {
    const dialog = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!(dialog instanceof HTMLDialogElement)) return;

    trigger.addEventListener('click', () => {
      returnFocusTo = trigger;
      dialog.showModal();
      document.body.classList.add('producer-modal-open');
    });

    dialog.querySelectorAll('[data-producer-close]').forEach(button => {
      button.addEventListener('click', () => closeDialog(dialog));
    });

    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('producer-modal-open');
      if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus();
      returnFocusTo = null;
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!(form instanceof HTMLFormElement)) return;

  const submitButton = form.querySelector('[data-contact-submit]');
  const status = form.querySelector('[data-contact-status]');
  if (!(submitButton instanceof HTMLButtonElement) || !(status instanceof HTMLElement)) return;

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || submitButton.disabled) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    setStatus('Sending your message…');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree returned ${response.status}`);

      form.reset();
      setStatus('Thank you. Your message has been sent successfully.', 'success');
      cookieConsent.track('contact_form_submit', { form_name: 'homepage_contact' });
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('Your message could not be sent. Please try again or email info@womeninwineandspirit.com.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send';
    }
  });
}

const cookieConsent = {
  key: 'wiws-cookie-consent',
  policyVersion: '1.0',
  measurementId: 'G-EGB87WD7LM',
  previousFocus: null,

  read() {
    try {
      const value = JSON.parse(localStorage.getItem(this.key));
      if (!value || value.policyVersion !== this.policyVersion) return null;
      return value;
    } catch {
      return null;
    }
  },

  write(analytics) {
    const value = {
      analytics: Boolean(analytics),
      timestamp: new Date().toISOString(),
      policyVersion: this.policyVersion
    };
    localStorage.setItem(this.key, JSON.stringify(value));
    return value;
  },

  loadAnalytics() {
    if (document.querySelector('[data-google-analytics]')) return;

    window[`ga-disable-${this.measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    script.dataset.googleAnalytics = 'true';
    document.head.appendChild(script);
  },

  deleteAnalyticsCookies() {
    window[`ga-disable-${this.measurementId}`] = true;
    const cookieNames = document.cookie
      .split(';')
      .map(cookie => cookie.split('=')[0].trim())
      .filter(name => name === '_ga' || name.startsWith('_ga_'));
    const hostParts = window.location.hostname.split('.');
    const domains = ['', window.location.hostname];

    if (hostParts.length > 1) domains.push(`.${hostParts.slice(-2).join('.')}`);

    cookieNames.forEach(name => {
      domains.forEach(domain => {
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax`;
      });
    });
  },

  track(eventName, parameters = {}) {
    if (!this.read()?.analytics || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, parameters);
  },

  init() {
    const banner = document.getElementById('cookieBanner');
    const modal = document.getElementById('cookieModal');
    const analyticsToggle = document.getElementById('analyticsConsent');
    if (!banner || !modal || !analyticsToggle) return;

    const openSettings = () => {
      this.previousFocus = document.activeElement;
      analyticsToggle.checked = Boolean(this.read()?.analytics);
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cookie-modal-open');
      analyticsToggle.focus();
    };

    const closeSettings = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cookie-modal-open');
      if (this.previousFocus instanceof HTMLElement) this.previousFocus.focus();
    };

    const applyChoice = (analytics) => {
      const previouslyAllowed = Boolean(this.read()?.analytics);
      this.write(analytics);
      banner.hidden = true;
      closeSettings();

      if (analytics) {
        this.loadAnalytics();
      } else {
        this.deleteAnalyticsCookies();
        if (previouslyAllowed) window.location.reload();
      }
    };

    document.querySelectorAll('[data-cookie-accept]').forEach(button => {
      button.addEventListener('click', () => applyChoice(true));
    });
    document.querySelectorAll('[data-cookie-reject]').forEach(button => {
      button.addEventListener('click', () => applyChoice(false));
    });
    document.querySelectorAll('[data-cookie-manage], [data-cookie-settings]').forEach(button => {
      button.addEventListener('click', openSettings);
    });
    document.querySelectorAll('[data-cookie-close]').forEach(button => {
      button.addEventListener('click', closeSettings);
    });
    document.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
      applyChoice(analyticsToggle.checked);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) closeSettings();
    });

    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) {
        this.track('outbound_link_click', {
          link_url: url.href,
          link_text: link.textContent.trim().slice(0, 100)
        });
      }
    });

    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-modal]');
      if (!trigger) return;
      this.track('participation_form_open', {
        form_name: trigger.getAttribute('data-modal')
      });
    });

    const saved = this.read();
    if (!saved) {
      banner.hidden = false;
    } else if (saved.analytics) {
      this.loadAnalytics();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  cookieConsent.init();
  loadProducts();
  initMobileMenu();
  initSocialRail();
  initProducerDialogs();
  initContactForm();
  _app.main();
});
