(function () {
  const PX_PER_SEC = 40;
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isEditMode() {
    return document.body.classList.contains("gp-edit-mode");
  }

  function initCarousel(root) {
    const track = root.querySelector("[data-carousel-track]");
    const viewport = root.querySelector(".gp-carousel-viewport");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    if (!track || !viewport) return;

    const minLoop = parseInt(root.dataset.carouselMinLoop || "5", 10);
    const originalItems = Array.from(track.children);

    // Only loop/auto-drift when there's enough content for it to feel like a
    // loop rather than a jarring jump - otherwise just leave it as a plain,
    // manually-scrollable row with no clones and no motion.
    const looping = !REDUCE_MOTION && originalItems.length >= minLoop;
    if (looping) {
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("tabindex", "-1");
        clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        track.appendChild(clone);
      });
    }

    let paused = isEditMode();
    let lastTime = null;
    let loopWidth = 0;

    function measure() {
      loopWidth = looping ? track.scrollWidth / 2 : 0;
    }

    function pause() {
      paused = true;
    }
    function resume() {
      if (!isEditMode()) paused = false;
    }

    function tick(time) {
      if (lastTime == null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!paused && looping && document.visibilityState === "visible") {
        viewport.scrollLeft += PX_PER_SEC * dt;
        if (loopWidth > 0 && viewport.scrollLeft >= loopWidth) {
          viewport.scrollLeft -= loopWidth;
        }
      }
      requestAnimationFrame(tick);
    }

    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", (e) => {
      if (!root.contains(e.relatedTarget)) resume();
    });
    // A user actively dragging/swiping the track shouldn't fight the
    // auto-drift - pause for the duration of the gesture.
    viewport.addEventListener("pointerdown", pause);
    viewport.addEventListener("pointerup", resume);
    viewport.addEventListener("pointercancel", resume);

    function step(direction) {
      pause();
      const card = track.querySelector(".gp-gallery-card");
      const cardWidth = card ? card.getBoundingClientRect().width : 260;
      const trackStyle = window.getComputedStyle(track);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || "12") || 12;
      viewport.scrollBy({ left: direction * (cardWidth + gap), behavior: "smooth" });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));

    // Edit Mode can be toggled on this same page without a reload - stop
    // auto-drift the moment it's on, rather than waiting for a hover.
    const editModeObserver = new MutationObserver(() => {
      if (isEditMode()) pause();
    });
    editModeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", measure);

    measure();
    if (looping) requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-carousel]").forEach(initCarousel);
  });
})();
