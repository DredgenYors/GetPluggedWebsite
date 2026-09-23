(function () {
  const overlay = document.getElementById("gp-gallery-modal-overlay");
  const contentRoot = document.getElementById("gp-gallery-modal-content");
  if (!overlay || !contentRoot) return;

  function closeModal() {
    overlay.hidden = true;
    contentRoot.innerHTML = "";
    document.body.classList.remove("gp-modal-open");
  }

  function openModal(url) {
    fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" }, cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load event");
        return res.text();
      })
      .then((html) => {
        contentRoot.innerHTML = html;
        overlay.hidden = false;
        overlay.scrollTop = 0;
        document.body.classList.add("gp-modal-open");
      })
      .catch(() => {
        window.location.href = url.replace(/\/modal$/, "");
      });
  }

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".gp-gallery-card");
    if (card && !card.classList.contains("gp-gallery-add")) {
      const href = card.getAttribute("href");
      if (href) {
        e.preventDefault();
        openModal(href + "/modal");
      }
      return;
    }

    if (overlay.hidden) return;

    if (e.target === overlay || e.target === contentRoot) {
      closeModal();
      return;
    }

    if (e.target.closest(".gp-modal-close") || e.target.closest(".gp-modal-back")) {
      e.preventDefault();
      closeModal();
      return;
    }

    // Any other in-modal link that points back at this same page (e.g.
    // "Connect with us" -> /#contact) should close the popup first, then
    // let the hash navigation scroll the real page underneath it.
    const link = e.target.closest("a");
    if (link && contentRoot.contains(link)) {
      const url = new URL(link.href, window.location.origin);
      if (url.pathname === window.location.pathname && url.hash) {
        e.preventDefault();
        closeModal();
        window.location.hash = url.hash;
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeModal();
  });
})();
