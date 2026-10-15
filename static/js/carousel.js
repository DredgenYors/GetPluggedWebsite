(function () {
  const PX_PER_SEC = 40;
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isEditMode() {
    return document.body.classList.contains("gp-edit-mode");
  }

  function initCarousel(root) {
    if (root.dataset.carouselReady) return;
    root.dataset.carouselReady = "1";

    const track = root.querySelector("[data-carousel-track]");
    const viewport = root.querySelector(".gp-carousel-viewport");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    if (!track || !viewport) return;

    const minLoop = parseInt(root.dataset.carouselMinLoop || "5", 10);

    let looping = false;
    let cloneNodes = [];
    let loopWidth = 0;
    let wasEditMode = isEditMode();

    function cloneOf(item) {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      return clone;
    }

    // Real (non-clone) items currently in the track - always safe to read,
    // since clones only ever exist outside Edit Mode (see buildClones/
    // destroyClones below), and the add/remove-photo controls that mutate
    // this list live are only usable while Edit Mode is on.
    function realItems() {
      return Array.from(track.children).filter((el) => !cloneNodes.includes(el));
    }

    function destroyClones() {
      cloneNodes.forEach((el) => el.remove());
      cloneNodes = [];
      looping = false;
    }

    function buildClones() {
      destroyClones();
      const items = realItems();
      if (REDUCE_MOTION || items.length < minLoop) return;
      cloneNodes = items.map(cloneOf);
      cloneNodes.forEach((clone) => track.appendChild(clone));
      looping = true;
    }

    function measure() {
      loopWidth = looping ? track.scrollWidth / 2 : 0;
    }

    let paused = isEditMode();
    let lastTime = null;

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
      const item = realItems()[0];
      const itemWidth = item ? item.getBoundingClientRect().width : 260;
      const trackStyle = window.getComputedStyle(track);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || "12") || 12;
      viewport.scrollBy({ left: direction * (itemWidth + gap), behavior: "smooth" });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));

    // Edit Mode can be toggled on this same page without a reload. Entering
    // it tears down any clones immediately, since the add/remove-photo
    // controls splice the real item list directly and must never find a
    // stale clone in their way. Leaving it rebuilds from whatever the real
    // list looks like now (photos may have been added/removed meanwhile).
    const editModeObserver = new MutationObserver(() => {
      const nowEditMode = isEditMode();
      if (nowEditMode === wasEditMode) return;
      wasEditMode = nowEditMode;
      if (nowEditMode) {
        pause();
        destroyClones();
      } else {
        buildClones();
        resume();
      }
      measure();
    });
    editModeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", measure);

    if (!isEditMode()) buildClones();
    measure();
    requestAnimationFrame(tick);
  }

  function initAll(root) {
    (root || document).querySelectorAll("[data-carousel]").forEach(initCarousel);
  }

  window.gpInitCarousels = initAll;
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
