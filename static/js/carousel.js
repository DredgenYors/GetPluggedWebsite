(function () {
  const PX_PER_SEC = 40;
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Coverflow-style depth effect: tuned per "slot" of distance from the
  // viewport's center (1 slot = one item-width-plus-gap away), clamped at
  // MAX_SLOTS so far-off items don't keep rotating/shrinking indefinitely.
  const MAX_SLOTS = 3;
  const ROTATE_DEG_PER_SLOT = 20;
  const SCALE_PER_SLOT = 0.1;
  const MIN_SCALE = 0.72;
  const DEPTH_PX_PER_SLOT = 60;
  const BRIGHTNESS_PER_SLOT = 0.08;
  const MIN_BRIGHTNESS = 0.72;
  const MAX_REPEATS = 8;

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

    // The single source of truth for "is this a real, functioning
    // carousel right now". Below minLoop items, nothing here applies at
    // all - no transforms, no drift, no arrows - it's just a plain static
    // row (exactly like Recap Photos looked before the coverflow effect
    // existed). Once there's enough content to loop, the full treatment
    // kicks in and behaves identically to the Gallery carousel. This
    // split exists specifically so the few-items case can never run any
    // of the JS-driven positioning that caused the earlier centering bugs
    // and the jitter - there's no code path left that can misbehave,
    // because there's no code running on it at all.
    let looping = false;
    let cloneNodes = [];
    let loopWidth = 0;
    let wasEditMode = isEditMode();
    let itemWidth = 0;
    let slotWidth = 0;

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

    // Strips every trace of the carousel treatment back to a plain,
    // untouched row - used both when there isn't enough content to loop,
    // and as the first step whenever clones are being rebuilt.
    function resetToStatic() {
      cloneNodes.forEach((el) => el.remove());
      cloneNodes = [];
      looping = false;
      loopWidth = 0;
      viewport.scrollLeft = 0;
      track.style.marginLeft = "";
      Array.from(track.children).forEach((item) => {
        item.style.transform = "";
        item.style.filter = "";
        item.style.zIndex = "";
      });
      root.classList.remove("gp-carousel-active");
    }

    function buildClones() {
      resetToStatic();
      const items = realItems();
      if (REDUCE_MOTION || items.length < minLoop) return;

      // Populate itemWidth/slotWidth from the current (clone-free) real
      // items before using them below.
      measure();
      const realGroupWidth = items.length * slotWidth;
      if (!realGroupWidth) return;

      // One loop-group (the real items) must stay wider than the viewport,
      // or the wraparound math breaks: the browser silently clamps
      // scrollLeft at its own max before the wraparound check below ever
      // gets a chance to fire, permanently pinning the carousel at
      // max-scroll with nothing able to recover it on its own. Repeat the
      // real items enough times to keep a safe margin at the current
      // viewport width - recomputed on every resize, so this stays safe
      // across zoom/resize too.
      const targetWidth = viewport.clientWidth * 1.5;
      // Capped as a sanity backstop - an unexpectedly huge clientWidth
      // reading (e.g. a resize event firing mid-transition, before layout
      // has fully settled, so this read doesn't reflect the final size)
      // should never be able to balloon this into hundreds of DOM nodes.
      const repeats = Math.min(MAX_REPEATS, Math.max(1, Math.ceil(targetWidth / realGroupWidth)));

      for (let r = 0; r < repeats; r++) {
        items.forEach((item) => {
          const clone = cloneOf(item);
          cloneNodes.push(clone);
          track.appendChild(clone);
        });
      }
      looping = true;
      root.classList.add("gp-carousel-active");
    }

    function measure() {
      // Cache item width/gap from actual rendered layout - measured here
      // (init, resize, clone rebuild) rather than every frame, since all
      // items share the same size and this avoids forcing a layout read
      // 60 times a second just to position things in 3D space.
      //
      // offsetWidth, not getBoundingClientRect() - every item already has
      // the coverflow transform applied by the time this runs (the tick
      // loop is continuously running), and getBoundingClientRect() reports
      // the visually rotated/scaled box, not the true CSS layout width.
      const first = track.children[0];
      if (first) {
        itemWidth = first.offsetWidth;
        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || "12") || 12;
        slotWidth = itemWidth + gap;
      }

      // The wraparound distance is always exactly one real-items-group
      // width, regardless of how many repeated clone groups exist in the
      // track (those exist purely to keep enough content on screen - see
      // buildClones above).
      loopWidth = looping ? realItems().length * slotWidth : 0;

      // Defensively re-normalize scrollLeft into a valid [0, loopWidth)
      // range every time measurements are refreshed, regardless of what
      // left it out of range.
      if (loopWidth > 0) {
        viewport.scrollLeft = ((viewport.scrollLeft % loopWidth) + loopWidth) % loopWidth;
      }
    }

    // Puts the middle real item (by index - the true center for an odd
    // count) directly in the viewport's center. Only meaningful once
    // looping (there's nothing to scroll to otherwise).
    function centerOnMiddleItem() {
      if (!looping) return;
      const items = realItems();
      if (!items.length || !slotWidth) return;
      const middleIndex = Math.floor(items.length / 2);
      const itemCenter = middleIndex * slotWidth + itemWidth / 2;
      viewport.scrollLeft = itemCenter - viewport.clientWidth / 2;
    }

    // Coverflow depth pass: run every frame regardless of what moved
    // scrollLeft (auto-drift, a manual drag, or an arrow's smooth-scroll),
    // so there's one source of truth - the current scroll position - rather
    // than separate depth logic per interaction type. Positions are
    // computed from each item's index and the cached slotWidth, not from a
    // live getBoundingClientRect() per item, to keep this cheap at 60fps.
    // Only ever called while looping.
    function updateTransforms() {
      if (!slotWidth) return;
      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const children = track.children;
      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        const itemCenter = i * slotWidth + itemWidth / 2;
        const rawSlots = (itemCenter - viewportCenter) / slotWidth;
        const slots = Math.max(-MAX_SLOTS, Math.min(MAX_SLOTS, rawSlots));
        const abs = Math.abs(slots);

        const rotateY = -slots * ROTATE_DEG_PER_SLOT;
        const scale = Math.max(MIN_SCALE, 1 - abs * SCALE_PER_SLOT);
        const depth = -abs * DEPTH_PX_PER_SLOT;
        const brightness = Math.max(MIN_BRIGHTNESS, 1 - abs * BRIGHTNESS_PER_SLOT);

        item.style.transform =
          `translateZ(${depth}px) rotateY(${rotateY}deg) scale(${scale})`;
        item.style.filter = `brightness(${brightness})`;
        item.style.zIndex = String(1000 - Math.round(abs * 100));
      }
    }

    // Pause state is read live from the DOM every frame (:hover, :focus-
    // within) rather than tracked as a flag toggled by mouseenter/leave/
    // pointerdown/up listeners - that earlier approach could get stuck
    // "paused" forever whenever a pair of events didn't fire in the exact
    // order assumed (e.g. a drag that ends outside the element). :hover
    // and :focus-within can't get stuck - they always reflect the real
    // cursor/focus position, including for the whole duration of a drag.
    let lastTime = null;
    let arrowPauseUntil = 0;

    function tick(time) {
      if (!looping) {
        lastTime = null;
        requestAnimationFrame(tick);
        return;
      }

      if (lastTime == null) lastTime = time;
      // Cap dt so a long gap (tab backgrounded, rAF throttled) can't make
      // the next frame jump forward a large distance all at once.
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Hover-pause is scoped to the viewport (the photos themselves),
      // not the whole root - the prev/next arrows are also descendants of
      // root, so checking root:hover here would mean the cursor merely
      // resting on an arrow after a click holds the pause indefinitely,
      // defeating the self-expiring arrowPauseUntil timer below.
      const shouldDrift =
        time >= arrowPauseUntil &&
        document.visibilityState === "visible" &&
        !viewport.matches(":hover") &&
        !root.matches(":focus-within");

      if (shouldDrift) {
        viewport.scrollLeft += PX_PER_SEC * dt;
        if (loopWidth > 0 && viewport.scrollLeft >= loopWidth) {
          viewport.scrollLeft -= loopWidth;
        }
      }
      updateTransforms();
      requestAnimationFrame(tick);
    }

    function step(direction) {
      if (!looping) return;
      // Briefly hold off auto-drift so it doesn't fight the smooth-scroll
      // animation below - self-expiring, so it can't get stuck either.
      arrowPauseUntil = performance.now() + 500;
      viewport.scrollBy({ left: direction * (slotWidth || 260), behavior: "smooth" });
    }

    // Clicking a button leaves it focused, which would otherwise hold
    // root:focus-within true indefinitely - the same kind of stuck pause
    // the hover check above has to guard against, but via focus instead of
    // hover. Blurring right after the click lets the arrow's own 500ms
    // timed pause (set inside step()) be what resumes drift, rather than
    // waiting on focus to move elsewhere (e.g. a click outside the carousel).
    if (prevBtn) prevBtn.addEventListener("click", () => { step(-1); prevBtn.blur(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { step(1); nextBtn.blur(); });

    // Edit Mode can be toggled on this same page without a reload. Entering
    // it tears down any clones immediately, since the add/remove-photo
    // controls splice the real item list directly and must never find a
    // stale clone in their way. Leaving it rebuilds from whatever the real
    // list looks like now (photos may have been added/removed meanwhile) -
    // which is also the point where a handful of photos that just crossed
    // the minLoop threshold turns into a real carousel, or vice versa.
    const editModeObserver = new MutationObserver(() => {
      const nowEditMode = isEditMode();
      if (nowEditMode === wasEditMode) return;
      wasEditMode = nowEditMode;
      if (nowEditMode) {
        resetToStatic();
      } else {
        buildClones();
      }
      measure();
    });
    editModeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // The safe repeat count depends on the current viewport width, so any
    // width change (including a browser zoom change) needs to rebuild the
    // clone set, not just re-measure it. ResizeObserver rather than
    // window's "resize" event: its callback fires only after layout has
    // actually settled and hands back the element's real content-box size
    // directly, and multiple size changes within one rendering frame are
    // already coalesced into a single callback by the browser.
    const resizeObserver = new ResizeObserver(() => {
      if (!isEditMode()) buildClones();
      measure();
      centerOnMiddleItem();
    });
    resizeObserver.observe(viewport);

    if (!isEditMode()) buildClones();
    measure();
    centerOnMiddleItem();
    requestAnimationFrame(tick);
  }

  function initAll(root) {
    (root || document).querySelectorAll("[data-carousel]").forEach(initCarousel);
  }

  window.gpInitCarousels = initAll;
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
