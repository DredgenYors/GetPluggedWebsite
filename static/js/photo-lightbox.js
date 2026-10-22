(function () {
  const overlay = document.getElementById("gp-photo-lightbox");
  const img = document.getElementById("gp-photo-lightbox-img");
  if (!overlay || !img) return;

  function closeLightbox() {
    overlay.hidden = true;
    img.src = "";
    document.body.classList.remove("gp-photo-lightbox-open");
  }

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || "";
    overlay.hidden = false;
    document.body.classList.add("gp-photo-lightbox-open");
  }

  // Delegated on document (not bound per-link) so this also covers photos
  // added later via inline-edit's add-photo flow, and recap grids injected
  // into the gallery modal's fetched event markup.
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".gp-event-recap-item a");
    if (link) {
      e.preventDefault();
      openLightbox(link.href, link.querySelector("img")?.alt || "");
      return;
    }

    if (overlay.hidden) return;

    // Anything inside the overlay that isn't the image itself counts as
    // "outside the image" - the backdrop and the close button.
    if (e.target !== img) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeLightbox();
  });
})();
