(function () {
  // How far (in % of the rail's own height) each tile overlaps the one
  // above it - matches the fade distance below, so the blend zone and the
  // physical overlap line up exactly.
  const OVERLAP_PCT = 6;

  function layoutRail(rail) {
    const tiles = Array.from(rail.querySelectorAll(".gp-margin-deco-tile"));
    const n = tiles.length;
    if (!n) return;

    // Evenly spaced tile tops across the rail, each stretched past its own
    // slot by OVERLAP_PCT so it overlaps the next tile - except the last,
    // which only runs to the bottom of the rail (nothing below it to
    // overlap into).
    const step = 100 / n;
    tiles.forEach((tile, i) => {
      const top = i * step;
      const isLast = i === n - 1;
      const height = isLast ? 100 - top : step + OVERLAP_PCT;
      tile.style.top = top + "%";
      tile.style.height = height + "%";

      const img = tile.querySelector("img");
      if (!img) return;
      if (i === 0) {
        // The first tile anchors the top of the rail - nothing above it to
        // blend from, so it stays fully opaque.
        img.style.maskImage = "";
        img.style.webkitMaskImage = "";
      } else {
        // Fade in over this tile's own top OVERLAP_PCT-of-the-rail, expressed
        // as a percentage of the TILE's own height (mask-image gradients are
        // relative to the element they're on), so it blends into whatever
        // is behind it in that overlap zone instead of cutting across it.
        const stop = Math.min(95, (OVERLAP_PCT / height) * 100);
        const gradient = `linear-gradient(to bottom, transparent, black ${stop}%)`;
        img.style.maskImage = gradient;
        img.style.webkitMaskImage = gradient;
      }
    });
  }

  function layoutAll() {
    document.querySelectorAll(".gp-margin-deco").forEach(layoutRail);
  }

  // Exposed so inline-edit.js can re-run this immediately after an admin
  // adds or removes an image, without a page reload.
  window.gpLayoutMarginDeco = layoutAll;
  document.addEventListener("DOMContentLoaded", layoutAll);
})();
