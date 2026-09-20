(function () {
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.content : null;
  if (!csrfToken) return;

  const EDIT_KEY = "gp_edit_mode";
  const isEditMode = () => sessionStorage.getItem(EDIT_KEY) === "1";

  function showToast(message, isError) {
    let toast = document.getElementById("gp-edit-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "gp-edit-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("gp-edit-toast-error", !!isError);
    toast.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function entityOf(el) {
    return {
      entity: el.dataset.entity || "settings",
      entityId: el.dataset.entityId || "",
    };
  }

  // Navigate to a server-provided redirect. When it's the same page (just a
  // different #hash, e.g. adding/removing a Stay Plugged In row from the
  // home page), setting location.href alone only scrolls - it doesn't
  // reload, so the new server-rendered HTML never arrives. Force a real
  // reload in that case; otherwise a normal cross-page navigation is fine.
  function goTo(redirect) {
    const url = new URL(redirect, window.location.origin);
    if (url.pathname === window.location.pathname) {
      window.location.hash = url.hash;
      window.location.reload();
    } else {
      window.location.href = redirect;
    }
  }

  async function saveField(el, value) {
    const { entity, entityId } = entityOf(el);
    const field = el.dataset.field;
    try {
      if (entity === "event") {
        const res = await fetch("/admin/inline-edit-event", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
          body: JSON.stringify({ event_id: entityId, field, value }),
        });
        return await res.json();
      }
      if (entity === "stay_plugged_row") {
        const res = await fetch("/admin/inline-edit-stay-plugged-row", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
          body: JSON.stringify({ row_id: entityId, field, value }),
        });
        return await res.json();
      }
      const res = await fetch("/admin/inline-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        body: JSON.stringify({ field, value }),
      });
      return await res.json();
    } catch (err) {
      return { ok: false, error: "Network error." };
    }
  }

  async function saveImage(wrapper, file) {
    const { entity, entityId } = entityOf(wrapper);
    try {
      const fd = new FormData();
      fd.append("file", file);
      let url;
      if (entity === "event") {
        url = `/admin/events/${entityId}/inline-edit-cover`;
      } else {
        fd.append("field", wrapper.dataset.field);
        url = "/admin/inline-edit-image";
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: fd,
      });
      return await res.json();
    } catch (err) {
      return { ok: false, error: "Network error." };
    }
  }

  // Find every other element on the page bound to the same entity+field, so
  // a value shown in more than one place (e.g. an event's date in the hero
  // and in the meta list) stays in sync without a page reload.
  function findSiblings(el) {
    const field = el.dataset.field;
    const { entity, entityId } = entityOf(el);
    return Array.from(document.querySelectorAll(`[data-field="${field}"]`)).filter((node) => {
      if (node === el) return false;
      const n = entityOf(node);
      return n.entity === entity && n.entityId === entityId;
    });
  }

  function startEditingText(el) {
    if (el.classList.contains("gp-editing")) return;

    const isMultiline = el.dataset.type === "textarea";
    const allowEmpty = el.dataset.allowEmpty === "true";
    const emptyPlaceholder = el.dataset.emptyPlaceholder || "";
    const original = el.textContent.trim();

    el.classList.add("gp-editing");
    el.contentEditable = "true";
    el.spellcheck = false;
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function onPaste(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, text);
    }

    function onKeydown(e) {
      if (!isMultiline && e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        el.textContent = original;
        el.blur();
      }
    }

    async function onBlur() {
      el.removeEventListener("paste", onPaste);
      el.removeEventListener("keydown", onKeydown);
      el.removeEventListener("blur", onBlur);
      el.contentEditable = "false";
      el.classList.remove("gp-editing");

      let newValue = el.textContent.trim();
      if (newValue === original) return;

      if (!newValue && !allowEmpty) {
        el.textContent = original;
        showToast("Can't be empty", true);
        return;
      }

      el.classList.add("gp-edit-saving");
      const result = await saveField(el, newValue);
      el.classList.remove("gp-edit-saving");

      if (result.ok) {
        const shown = result.value || emptyPlaceholder || result.value;
        el.textContent = shown;
        findSiblings(el).forEach((node) => { node.textContent = shown; });
        showToast("Saved");
      } else {
        el.textContent = original;
        showToast(result.error || "Couldn't save", true);
      }
    }

    el.addEventListener("paste", onPaste);
    el.addEventListener("keydown", onKeydown);
    el.addEventListener("blur", onBlur);
  }

  function startEditingDate(el) {
    if (el.classList.contains("gp-editing")) return;
    el.classList.add("gp-editing");

    const originalText = el.textContent.trim();
    const originalIso = el.dataset.value || "";

    const input = document.createElement("input");
    input.type = "date";
    input.className = "gp-edit-date-input";
    input.value = originalIso;

    el.insertAdjacentElement("afterend", input);
    el.style.display = "none";
    input.focus();
    if (input.showPicker) {
      try { input.showPicker(); } catch (err) { /* not supported everywhere */ }
    }

    let finished = false;
    async function finish(save) {
      if (finished) return;
      finished = true;
      input.removeEventListener("change", onChange);
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeydown);
      input.remove();
      el.style.display = "";
      el.classList.remove("gp-editing");

      if (!save || !input.value || input.value === originalIso) return;

      el.classList.add("gp-edit-saving");
      const result = await saveField(el, input.value);
      el.classList.remove("gp-edit-saving");

      if (result.ok) {
        el.textContent = result.value;
        el.dataset.value = input.value;
        findSiblings(el).forEach((node) => {
          node.textContent = result.value;
          node.dataset.value = input.value;
        });
        showToast("Saved");
      } else {
        el.textContent = originalText;
        showToast(result.error || "Couldn't save", true);
      }
    }

    const onChange = () => finish(true);
    const onBlur = () => finish(true);
    const onKeydown = (e) => { if (e.key === "Escape") finish(false); };

    input.addEventListener("change", onChange);
    input.addEventListener("blur", onBlur);
    input.addEventListener("keydown", onKeydown);
  }

  // An event's cover image also shows on its Gallery preview card back on
  // the home page - a plain <img> with no data-editable-image of its own,
  // so it needs its own sync instead of the generic findSiblings() path.
  function syncGalleryCardCover(entityId, url) {
    const card = document.querySelector(`.gp-gallery-card[data-event-id="${entityId}"]`);
    if (!card) return;

    const existingImg = card.querySelector("img");
    if (existingImg) {
      existingImg.src = url;
      return;
    }

    const placeholder = card.querySelector(".gp-gallery-card-placeholder");
    if (placeholder) placeholder.remove();

    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    card.insertBefore(img, card.firstChild);
  }

  function startEditingImage(wrapper) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/gif,image/webp";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      fileInput.remove();
      if (!file) return;

      wrapper.classList.add("gp-edit-saving");
      const result = await saveImage(wrapper, file);
      wrapper.classList.remove("gp-edit-saving");

      if (result.ok) {
        if (wrapper.tagName === "IMG") {
          wrapper.src = result.url;
        } else {
          const existingImg = wrapper.querySelector("img");
          if (existingImg) {
            existingImg.src = result.url;
          } else {
            // Clear old placeholder content, but keep any child explicitly
            // marked to persist (e.g. the event hero's "Edit Cover Image"
            // button) instead of wiping the wrapper wholesale.
            Array.from(wrapper.children).forEach((child) => {
              if (!child.hasAttribute("data-persist")) child.remove();
            });
            const img = document.createElement("img");
            img.src = result.url;
            img.alt = "";
            img.className = wrapper.dataset.imgClass || "";
            wrapper.insertBefore(img, wrapper.firstChild);
          }
        }
        const { entity, entityId } = entityOf(wrapper);
        if (entity === "event") syncGalleryCardCover(entityId, result.url);
        showToast("Image updated");
      } else {
        showToast(result.error || "Couldn't upload", true);
      }
    });

    fileInput.click();
  }

  async function createRecord(url, button, errorLabel) {
    button.classList.add("gp-edit-saving");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
      });
      const result = await res.json();
      if (result.ok && result.redirect) {
        goTo(result.redirect);
        return;
      }
      showToast(result.error || `Couldn't add ${errorLabel}`, true);
    } catch (err) {
      showToast("Network error", true);
    }
    button.classList.remove("gp-edit-saving");
  }

  async function deleteRecord(url, body, button, confirmMsg, errorLabel) {
    if (!window.confirm(confirmMsg)) return;

    button.classList.add("gp-edit-saving");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.ok && result.redirect) {
        goTo(result.redirect);
        return;
      }
      showToast(result.error || `Couldn't remove ${errorLabel}`, true);
    } catch (err) {
      showToast("Network error", true);
    }
    button.classList.remove("gp-edit-saving");
  }

  function setEditMode(on) {
    sessionStorage.setItem(EDIT_KEY, on ? "1" : "0");
    document.body.classList.toggle("gp-edit-mode", on);
    const btn = document.getElementById("gp-edit-toggle");
    if (btn) btn.textContent = on ? "Exit Edit Mode" : "Edit Page";
    const banner = document.getElementById("gp-edit-banner");
    if (banner) banner.classList.toggle("show", on);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setEditMode(isEditMode());

    const toggleBtn = document.getElementById("gp-edit-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        setEditMode(!isEditMode());
      });
    }

    const addEventBtn = document.getElementById("gp-add-event");
    if (addEventBtn) {
      addEventBtn.addEventListener("click", (e) => {
        e.preventDefault();
        createRecord("/admin/inline-add-event", addEventBtn, "event");
      });
    }

    const addRowBtn = document.getElementById("gp-add-stay-plugged-row");
    if (addRowBtn) {
      addRowBtn.addEventListener("click", (e) => {
        e.preventDefault();
        createRecord("/admin/inline-add-stay-plugged-row", addRowBtn, "row");
      });
    }

    // Add Photo, Remove Photo, and Delete Event are wired via the delegated
    // click handler below (not looked up here) since this event page's
    // content can also be injected later into the Gallery's popup modal.
    async function addEventPhoto(button) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/png,image/jpeg,image/gif,image/webp";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.remove();
        if (!file) return;

        button.classList.add("gp-edit-saving");
        const fd = new FormData();
        fd.append("file", file);
        let result;
        try {
          const res = await fetch(`/admin/events/${button.dataset.eventId}/inline-add-photo`, {
            method: "POST",
            headers: { "X-CSRFToken": csrfToken },
            body: fd,
          });
          result = await res.json();
        } catch (err) {
          result = { ok: false, error: "Network error." };
        }
        button.classList.remove("gp-edit-saving");

        if (result.ok) {
          const grid = document.getElementById("gp-event-recap-grid");
          const emptyNote = document.getElementById("gp-event-recap-empty");
          const item = document.createElement("div");
          item.className = "gp-event-recap-item";
          item.innerHTML =
            `<a href="${result.url}" target="_blank" rel="noopener noreferrer">` +
            `<img src="${result.url}" alt="" loading="lazy"></a>` +
            `<button type="button" class="gp-event-recap-remove" data-media-id="${result.media_id}" title="Remove photo">&times;</button>`;
          grid.appendChild(item);
          grid.hidden = false;
          if (emptyNote) emptyNote.hidden = true;
          grid.scrollTo({ left: grid.scrollWidth, behavior: "smooth" });
          showToast("Photo added");
        } else {
          showToast(result.error || "Couldn't upload", true);
        }
      });

      fileInput.click();
    }

    async function removeEventPhoto(button) {
      if (!window.confirm("Remove this photo?")) return;

      button.classList.add("gp-edit-saving");
      let result;
      try {
        const res = await fetch(`/admin/media/${button.dataset.mediaId}/inline-delete`, {
          method: "POST",
          headers: { "X-CSRFToken": csrfToken },
        });
        result = await res.json();
      } catch (err) {
        result = { ok: false, error: "Network error." };
      }

      if (result.ok) {
        const item = button.closest(".gp-event-recap-item");
        const grid = item ? item.parentElement : null;
        if (item) item.remove();
        if (grid && !grid.children.length) {
          grid.hidden = true;
          const emptyNote = document.getElementById("gp-event-recap-empty");
          if (emptyNote) emptyNote.hidden = false;
        }
        showToast("Photo removed");
      } else {
        button.classList.remove("gp-edit-saving");
        showToast(result.error || "Couldn't remove photo", true);
      }
    }

    document.body.addEventListener("change", async (e) => {
      const toggle = e.target.closest(".gp-row-link-toggle");
      if (!toggle) return;

      toggle.disabled = true;
      try {
        const res = await fetch("/admin/inline-toggle-stay-plugged-row-link", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
          body: JSON.stringify({ row_id: toggle.dataset.rowId }),
        });
        const result = await res.json();
        if (result.ok && result.redirect) {
          goTo(result.redirect);
          return;
        }
        toggle.checked = !toggle.checked;
        showToast(result.error || "Couldn't update", true);
      } catch (err) {
        toggle.checked = !toggle.checked;
        showToast("Network error", true);
      }
      toggle.disabled = false;
    });

    document.body.addEventListener("click", (e) => {
      if (!isEditMode()) return;

      const removeRowBtn = e.target.closest(".gp-next-row-remove");
      if (removeRowBtn) {
        e.preventDefault();
        deleteRecord(
          "/admin/inline-delete-stay-plugged-row",
          { row_id: removeRowBtn.dataset.rowId },
          removeRowBtn,
          "Remove this row?",
          "row"
        );
        return;
      }

      const addPhotoBtn = e.target.closest(".gp-event-recap-add");
      if (addPhotoBtn) {
        e.preventDefault();
        addEventPhoto(addPhotoBtn);
        return;
      }

      const removePhotoBtn = e.target.closest(".gp-event-recap-remove");
      if (removePhotoBtn) {
        e.preventDefault();
        removeEventPhoto(removePhotoBtn);
        return;
      }

      const deleteEventBtn = e.target.closest("#gp-delete-event");
      if (deleteEventBtn) {
        e.preventDefault();
        deleteRecord(
          "/admin/inline-delete-event",
          { event_id: deleteEventBtn.dataset.eventId },
          deleteEventBtn,
          "Delete this event? This can't be undone.",
          "event"
        );
        return;
      }

      const imgWrap = e.target.closest("[data-editable-image]");
      if (imgWrap) {
        e.preventDefault();
        startEditingImage(imgWrap);
        return;
      }

      const textEl = e.target.closest("[data-editable]");
      if (textEl && !textEl.classList.contains("gp-editing")) {
        e.preventDefault();
        if (textEl.dataset.type === "date") {
          startEditingDate(textEl);
        } else {
          startEditingText(textEl);
        }
      }
    });
  });
})();
