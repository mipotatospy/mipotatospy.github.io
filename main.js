const _app = {
  startScale: 0.55,
  endScale: 1.1,

  homeScaleStart: 4.0,
  homeScaleEnd: 1.15,

  homeYStart: 200,
  homeYEnd: 6,

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
      { threshold: 0.25 } // 0.75 is often too strict on shorter blocks
    );

    rows.forEach((row) => io.observe(row));
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
  },
};

document.addEventListener("DOMContentLoaded", _app.main);
