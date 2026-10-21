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

    let looping = false;
    let cloneNodes = [];
    let loopWidth = 0;
    let wasEditMode = isEditMode();
    let itemWidth = 0;
    let slotWidth = 0;
    let trackOffset = 0;

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

      // Populate itemWidth/slotWidth from the current (clone-free) real
      // items before using them below.
      measure();
      const realGroupWidth = items.length * slotWidth;
      if (!realGroupWidth) return;

      // One loop-group (the real items) must stay wider than the viewport,
      // or the wraparound math breaks: the browser silently clamps
      // scrollLeft at its own max before the wraparound check below ever
      // gets a chance to fire, permanently pinning the carousel at
      // max-scroll with nothing able to recover it on its own (this is
      // exactly what "shifted right and stuck until reload" was - zooming
      // changed the viewport width enough to cross this threshold). Repeat
      // the real items enough times to keep a safe margin at the current
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
      // Reading that corrupted whichever width track.children[0] happened
      // to have at that instant (usually scaled down, since index 0 is
      // rarely centered) into itemWidth/slotWidth - which is what caused
      // centering to land wrong by an inconsistent amount after a resize.
      // offsetWidth always reflects the untransformed layout box.
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
      // left it out of range (this is what fixes - and future-proofs
      // against - scrollLeft getting silently clamped by the browser and
      // stuck somewhere that never satisfies the tick loop's own
      // wraparound check on its own).
      if (loopWidth > 0) {
        viewport.scrollLeft = ((viewport.scrollLeft % loopWidth) + loopWidth) % loopWidth;
      }

      // Centering normally works by scrolling, but that only has anything
      // to work with when the content actually overflows the viewport. A
      // handful of items (common for Recap Photos - plenty of events have
      // fewer than minLoop) can be narrower than the viewport entirely, in
      // which case there's no scrollable range at all: scrollLeft just
      // gets clamped to 0 by the browser, leaving everything stuck against
      // the left edge with a dead gap on the right, and nothing is ever
      // actually off-center for the depth effect to react to. When that's
      // the case, shift the track itself with a left margin instead, sized
      // so the middle item's center still lands on the viewport's center -
      // margin rather than CSS justify-content:center, because the latter
      // has a well-known quirk of clipping the *start* of content that
      // does overflow, which would break the normal scrolling case.
      const items = realItems();
      let newTrackOffset = 0;
      if (!looping && items.length && slotWidth) {
        const realWidth = items.length * slotWidth - (slotWidth - itemWidth);
        const extra = viewport.clientWidth - realWidth;
        if (extra > 0) newTrackOffset = extra / 2;
      }
      // Rounded to a whole pixel, and only written when it actually
      // changes - ResizeObserver is watching viewport, and setting a
      // fractional-pixel margin here can perturb viewport's own computed
      // clientWidth by a rounding hair, which re-fires the observer, which
      // recomputes this again slightly differently, forever: an infinite
      // feedback loop oscillating between two near-identical states (this
      // is what was visible as the images "jittering"). Rounding collapses
      // those near-identical values to the same integer, and skipping the
      // write when nothing really changed stops it from ever starting.
      newTrackOffset = Math.round(newTrackOffset);
      if (newTrackOffset !== trackOffset) {
        trackOffset = newTrackOffset;
        track.style.marginLeft = trackOffset ? `${trackOffset}px` : "";
      }
    }

    // Puts the middle real item (by index - the true center for an odd
    // count) directly in the viewport's center. Used on first render (so
    // the carousel never opens with a gap straddling the center instead of
    // an actual item) and after a resize/zoom, where snapping back to a
    // clean centered state is preferable to wherever scrollLeft's old
    // value happens to land under the new measurements.
    function centerOnMiddleItem() {
      const items = realItems();
      if (!items.length || !slotWidth) return;
      const middleIndex = Math.floor(items.length / 2);
      const itemCenter = trackOffset + middleIndex * slotWidth + itemWidth / 2;
      viewport.scrollLeft = itemCenter - viewport.clientWidth / 2;
    }

    // Coverflow depth pass: run every frame regardless of what moved
    // scrollLeft (auto-drift, a manual drag, or an arrow's smooth-scroll),
    // so there's one source of truth - the current scroll position - rather
    // than separate depth logic per interaction type. Positions are
    // computed from each item's index and the cached slotWidth, not from a
    // live getBoundingClientRect() per item, to keep this cheap at 60fps.
    function updateTransforms() {
      if (!slotWidth) return;
      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const children = track.children;
      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        const itemCenter = trackOffset + i * slotWidth + itemWidth / 2;
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
    // order assumed (e.g. a drag that ends outside the element), which is
    // exactly what caused the drift to randomly stop or stutter. :hover and
    // :focus-within can't get stuck - they always reflect the real cursor/
    // focus position, including for the whole duration of a manual drag.
    let lastTime = null;
    let arrowPauseUntil = 0;

    function tick(time) {
      if (lastTime == null) lastTime = time;
      // Cap dt so a long gap (tab backgrounded, rAF throttled) can't make
      // the next frame jump forward a large distance all at once.
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const shouldDrift =
        looping &&
        time >= arrowPauseUntil &&
        document.visibilityState === "visible" &&
        !root.matches(":hover") &&
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
      // Briefly hold off auto-drift so it doesn't fight the smooth-scroll
      // animation below - self-expiring, so it can't get stuck either.
      arrowPauseUntil = performance.now() + 500;
      viewport.scrollBy({ left: direction * (slotWidth || 260), behavior: "smooth" });
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
        destroyClones();
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
    // already coalesced into a single callback by the browser - no manual
    // debounce/rAF-delay needed on top (that extra frame of indirection
    // was itself still a chance for a value to be read before a sudden,
    // large zoom jump had fully reflowed, which is what caused the
    // recenter to consistently land wrong instead of just not happening).
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
