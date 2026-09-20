(function () {
  const overlay = document.getElementById("gp-gallery-modal-overlay");
  const contentRoot = document.getElementById("gp-gallery-modal-content");
  if (!overlay || !contentRoot) return;

  const isEditMode = () => sessionStorage.getItem("gp_edit_mode") === "1";

  function closeModal() {
    overlay.hidden = true;
    contentRoot.innerHTML = "";
    document.body.classList.remove("gp-modal-open");
  }

  function openModal(url) {
    fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
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
    if (card && !card.classList.contains("gp-gallery-add") && !isEditMode()) {
      const href = card.getAttribute("href");
      if (href) {
        e.preventDefault();
        openModal(href + "/modal");
      }
      return;
    }

    if (!overlay.hidden) {
      if (e.target === overlay || e.target === contentRoot) {
        closeModal();
        return;
      }
      if (e.target.closest(".gp-modal-close") || e.target.closest(".gp-modal-back")) {
        e.preventDefault();
        closeModal();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeModal();
  });
})();
