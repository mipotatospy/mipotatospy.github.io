(() => {
    const track = document.getElementById("triTrack");
    const prev = document.getElementById("triPrev");
    const next = document.getElementById("triNext");
    if (!track || !prev || !next) return;
  
    const items = Array.from(track.querySelectorAll(".tri-item"));
    let start = 0; // left-most visible index (focused)
  
    function gapPx() {
      const g = getComputedStyle(track).gap || "0px";
      return parseFloat(g) || 0;
    }
  
    function applyClasses() {
      items.forEach((el, i) => {
        el.classList.toggle("is-focused", i === start);
  
        // optional: only the 3 visible items are interactive
        const visible = i >= start && i <= start + 2;
        el.style.pointerEvents = visible ? "auto" : "none";
      });
    }
  
    function updateTransform() {
      const gap = gapPx();
  
      // Because item widths are constant (layout width),
      // we can translate exactly by (start * (itemWidth + gap))
      const itemW = items[0]?.offsetWidth || 0; // offsetWidth ignores transform
      // const x = start * (itemW + gap)
  
      // ✅ Focused image left edge touches viewport left edge
      const x = focused.offsetLeft;

      track.style.transform = `translateX(${-x}px)`;
    }
  
    function render() {
      applyClasses();
      updateTransform();
    }
  
    next.addEventListener("click", () => {
      start = Math.min(start + 1, items.length - 3);
      render();
    });
  
    prev.addEventListener("click", () => {
      start = Math.max(start - 1, 0);
      render();
    });
  
    window.addEventListener("resize", render);
  
    render();
  })();
  