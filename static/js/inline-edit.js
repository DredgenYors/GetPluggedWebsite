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

  // contentEditable's default Enter behavior wraps each line in its own
  // <div>/<p>, and plain el.textContent silently drops the boundary between
  // sibling block elements - "line one[Enter]line two" reads back as
  // "line onetwo" with the break gone. Force <br> as the paragraph
  // separator so multi-line fields are readable via a childNodes walk that
  // turns each <br> into an explicit "\n" instead.
  function getEditableValue(el, isMultiline) {
    if (!isMultiline) return el.textContent.trim();
    let text = "";
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeName === "BR") {
        text += "\n";
      } else {
        text += node.textContent;
      }
    });
    return text.trim();
  }

  // execCommand("insertHTML", ..., "<br>") inserts the element but doesn't
  // reliably leave the cursor positioned after it in every context (text
  // typed right after can land before the break instead of following it) -
  // insert via Range/Selection directly and place the caret ourselves so
  // it's exact regardless of that quirk.
  function insertLineBreakAtCaret() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement("br");
    range.insertNode(br);
    range.setStartAfter(br);
    range.setEndAfter(br);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertTextAtCaret(text) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function startEditingText(el) {
    if (el.classList.contains("gp-editing")) return;

    const isMultiline = el.dataset.type === "textarea";
    const allowEmpty = el.dataset.allowEmpty === "true";
    const emptyPlaceholder = el.dataset.emptyPlaceholder || "";
    const original = getEditableValue(el, isMultiline);

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
      if (isMultiline) {
        const lines = text.split(/\r\n|\r|\n/);
        lines.forEach((line, i) => {
          if (i > 0) insertLineBreakAtCaret();
          if (line) insertTextAtCaret(line);
        });
      } else {
        insertTextAtCaret(text);
      }
    }

    function onKeydown(e) {
      if (!isMultiline && e.key === "Enter") {
        e.preventDefault();
        el.blur();
        return;
      }
      if (isMultiline && e.key === "Enter") {
        e.preventDefault();
        insertLineBreakAtCaret();
        return;
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

      let newValue = getEditableValue(el, isMultiline);
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
  function syncGalleryCardCover(entityId, url, focusX, focusY) {
    const card = document.querySelector(`.gp-gallery-card[data-event-id="${entityId}"]`);
    if (!card) return;

    const objectPosition = focusX != null && focusY != null ? `${focusX}% ${focusY}%` : null;

    const existingImg = card.querySelector("img");
    if (existingImg) {
      existingImg.src = url;
      if (objectPosition) existingImg.style.objectPosition = objectPosition;
      return;
    }

    const placeholder = card.querySelector(".gp-gallery-card-placeholder");
    if (placeholder) placeholder.remove();

    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    if (objectPosition) img.style.objectPosition = objectPosition;
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
        // A freshly uploaded cover resets to a centered focus point
        // server-side (a new photo's important content is never guaranteed
        // to be where the old one's was) - mirror that here.
        const objectPosition = result.focus_x != null ? `${result.focus_x}% ${result.focus_y}%` : null;

        if (wrapper.tagName === "IMG") {
          wrapper.src = result.url;
          if (objectPosition) wrapper.style.objectPosition = objectPosition;
        } else {
          const existingImg = wrapper.querySelector("img");
          if (existingImg) {
            existingImg.src = result.url;
            if (objectPosition) existingImg.style.objectPosition = objectPosition;
          } else {
            // Clear old placeholder content, but keep any child explicitly
            // marked to persist (e.g. the event hero's edit controls)
            // instead of wiping the wrapper wholesale.
            Array.from(wrapper.children).forEach((child) => {
              if (!child.hasAttribute("data-persist")) child.remove();
            });
            const img = document.createElement("img");
            img.src = result.url;
            img.alt = "";
            img.className = wrapper.dataset.imgClass || "";
            if (objectPosition) img.style.objectPosition = objectPosition;
            wrapper.insertBefore(img, wrapper.firstChild);
          }
        }
        if (result.focus_x != null) {
          wrapper.dataset.focusX = result.focus_x;
          wrapper.dataset.focusY = result.focus_y;
        }

        // The very first cover a placeholder-state event gets won't have an
        // "Adjust Focus" button yet (it's only server-rendered once there's
        // a cover to adjust) - add it now instead of requiring a reload.
        const controls = wrapper.querySelector(".gp-event-hero-controls");
        if (controls && !controls.querySelector(".gp-event-hero-cover-focus")) {
          const focusBtn = document.createElement("button");
          focusBtn.type = "button";
          focusBtn.className = "gp-event-hero-cover-focus";
          focusBtn.setAttribute("data-persist", "");
          focusBtn.textContent = "Adjust Focus";
          controls.appendChild(focusBtn);
        }

        const { entity, entityId } = entityOf(wrapper);
        if (entity === "event") syncGalleryCardCover(entityId, result.url, result.focus_x, result.focus_y);
        showToast("Image updated");
      } else {
        showToast(result.error || "Couldn't upload", true);
      }
    });

    fileInput.click();
  }

  function startAdjustingFocus(wrapper) {
    const img = wrapper.querySelector("img");
    if (!img) return;

    // The crop box needs to know the actual shape it's being cropped into -
    // measure the real hero container before it gets covered by the picker.
    const heroRect = wrapper.getBoundingClientRect();
    const targetAR = heroRect.width / heroRect.height;

    const { entity, entityId } = entityOf(wrapper);
    const overlay = document.createElement("div");
    overlay.className = "gp-focus-picker-overlay";
    overlay.innerHTML =
      '<div class="gp-focus-picker-box">' +
      '<p class="gp-focus-picker-hint">Drag the green box (or scroll over the photo) to choose what stays in view when it gets cropped. Exit when you\'re done.</p>' +
      '<div class="gp-focus-picker-imgwrap">' +
      `<img src="${img.src}" alt="">` +
      '<div class="gp-focus-picker-crop"></div>' +
      "</div>" +
      '<div class="gp-focus-picker-footer">' +
      '<button type="button" class="gp-focus-picker-exit">Exit</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    const pickerImg = overlay.querySelector(".gp-focus-picker-imgwrap img");
    const imgWrap = overlay.querySelector(".gp-focus-picker-imgwrap");
    const cropBox = overlay.querySelector(".gp-focus-picker-crop");

    // How much of the image (0-1) survives an object-fit:cover crop into
    // targetAR: whichever axis is "extra" relative to the target shape gets
    // trimmed, the other stays fully visible - mirrors the browser's own
    // object-fit:cover + object-position math exactly.
    let visibleFracX = 1;
    let visibleFracY = 1;
    let posX = parseFloat(wrapper.dataset.focusX || "50");
    let posY = parseFloat(wrapper.dataset.focusY || "50");

    function applyBox() {
      const left = (posX / 100) * (1 - visibleFracX) * 100;
      const top = (posY / 100) * (1 - visibleFracY) * 100;
      cropBox.style.left = left + "%";
      cropBox.style.top = top + "%";
      cropBox.style.width = visibleFracX * 100 + "%";
      cropBox.style.height = visibleFracY * 100 + "%";
    }

    function layoutBox() {
      const naturalW = pickerImg.naturalWidth;
      const naturalH = pickerImg.naturalHeight;
      if (!naturalW || !naturalH) return;
      const imgAR = naturalW / naturalH;

      if (imgAR >= targetAR) {
        visibleFracX = targetAR / imgAR;
        visibleFracY = 1;
      } else {
        visibleFracX = 1;
        visibleFracY = imgAR / targetAR;
      }
      applyBox();
    }

    if (pickerImg.complete) {
      layoutBox();
    } else {
      pickerImg.addEventListener("load", layoutBox, { once: true });
    }

    function cleanup() {
      overlay.remove();
      document.removeEventListener("keydown", onKeydown);
    }

    function onKeydown(e) {
      if (e.key === "Escape") cleanup();
    }
    document.addEventListener("keydown", onKeydown);

    overlay.querySelector(".gp-focus-picker-exit").addEventListener("click", cleanup);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup();
    });

    let saveTimer = null;
    function queueSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        let result;
        try {
          const url =
            entity === "event"
              ? `/admin/events/${entityId}/inline-edit-cover-focus`
              : "/admin/inline-edit-image-focus";
          const body =
            entity === "event"
              ? { x: posX, y: posY }
              : { field: wrapper.dataset.field, x: posX, y: posY };
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
            body: JSON.stringify(body),
          });
          result = await res.json();
        } catch (err) {
          result = { ok: false, error: "Network error." };
        }

        if (result.ok) {
          const objectPosition = `${result.x}% ${result.y}%`;
          img.style.objectPosition = objectPosition;
          wrapper.dataset.focusX = result.x;
          wrapper.dataset.focusY = result.y;
          if (entity === "event") syncGalleryCardCover(entityId, img.src, result.x, result.y);
        } else {
          showToast(result.error || "Couldn't save", true);
        }
      }, 300);
    }

    // Moving the box a given number of image-relative percentage points
    // means moving posX/posY by more than that within the "slack" range
    // (a fully-covered axis has no room to move at all) - matches the
    // inverse of the left/top formula in applyBox().
    function nudge(deltaXPct, deltaYPct) {
      if (visibleFracX < 1) {
        posX = Math.min(100, Math.max(0, posX + deltaXPct / (1 - visibleFracX)));
      }
      if (visibleFracY < 1) {
        posY = Math.min(100, Math.max(0, posY + deltaYPct / (1 - visibleFracY)));
      }
      applyBox();
      queueSave();
    }

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    imgWrap.addEventListener("pointerdown", (e) => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      cropBox.classList.add("dragging");
      imgWrap.setPointerCapture(e.pointerId);
    });

    imgWrap.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const rect = pickerImg.getBoundingClientRect();
      const deltaXPct = ((e.clientX - dragStartX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - dragStartY) / rect.height) * 100;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      nudge(deltaXPct, deltaYPct);
    });

    function endDrag() {
      dragging = false;
      cropBox.classList.remove("dragging");
    }
    imgWrap.addEventListener("pointerup", endDrag);
    imgWrap.addEventListener("pointercancel", endDrag);

    imgWrap.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        // A single mouse-wheel notch is a much bigger delta than a
        // trackpad's continuous scroll, and it's already amplified by
        // nudge() dividing by the slack range - damp it so one notch is a
        // small step rather than jumping most of the way across.
        const WHEEL_SENSITIVITY = 0.15;
        const rect = pickerImg.getBoundingClientRect();
        const deltaXPct = (e.deltaX / rect.width) * 100 * WHEEL_SENSITIVITY;
        const deltaYPct = (e.deltaY / rect.height) * 100 * WHEEL_SENSITIVITY;
        nudge(deltaXPct, deltaYPct);
      },
      { passive: false }
    );
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

    // Below the nav's 1500px breakpoint, "Edit Page" lives inside the
    // collapsible hamburger menu - clicking it isn't a real navigation, so
    // Bootstrap's own collapse-on-link-click behavior never kicks in, and
    // the menu is left open on top of the whole page (nothing underneath
    // it is clickable) until the admin notices and closes it manually.
    // Close it explicitly here so entering/exiting Edit Mode this way
    // doesn't leave the page unusable.
    const navLinks = document.getElementById("gpNavLinks");
    if (navLinks && window.bootstrap && window.bootstrap.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(navLinks, { toggle: false }).hide();
    }
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

    // Disables (and relabels) a margin rail's Add button once it's at the
    // server-enforced limit, so the control itself reflects the cap instead
    // of only finding out by having a click rejected.
    function updateMarginAddState(rail) {
      const addBtn = rail.querySelector(".gp-margin-deco-add");
      if (!addBtn) return;
      const limit = parseInt(rail.dataset.marginLimit || "6", 10);
      const count = rail.querySelectorAll(".gp-margin-deco-tile").length;
      const atLimit = count >= limit;
      addBtn.disabled = atLimit;
      addBtn.title = atLimit ? `Limit of ${limit} images reached` : "Add image";
    }

    async function addMarginImage(button) {
      const side = button.dataset.side;
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
          const res = await fetch(`/admin/margin-images/${side}/inline-add-photo`, {
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
          const rail = button.closest(".gp-margin-deco");
          const tile = document.createElement("div");
          tile.className = "gp-margin-deco-tile";
          tile.dataset.imageId = result.media_id;
          tile.innerHTML =
            `<img src="${result.url}" alt="" aria-hidden="true">` +
            `<button type="button" class="gp-margin-deco-edit" data-image-id="${result.media_id}" title="Change image">Edit</button>` +
            `<button type="button" class="gp-margin-deco-remove" data-image-id="${result.media_id}" title="Remove image">&times;</button>`;
          rail.insertBefore(tile, button);
          if (window.gpLayoutMarginDeco) window.gpLayoutMarginDeco();
          updateMarginAddState(rail);
          showToast("Image added");
        } else {
          showToast(result.error || "Couldn't upload", true);
        }
      });

      fileInput.click();
    }

    // Replaces one tile's photo in place - same spot in the collage,
    // unlike add (appends a new tile) or remove (deletes one).
    async function editMarginImage(button) {
      const imageId = button.dataset.imageId;
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
          const res = await fetch(`/admin/margin-images/${imageId}/inline-edit`, {
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
          const tile = button.closest(".gp-margin-deco-tile");
          const img = tile ? tile.querySelector("img") : null;
          if (img) img.src = result.url;
          showToast("Image updated");
        } else {
          showToast(result.error || "Couldn't upload", true);
        }
      });

      fileInput.click();
    }

    async function removeMarginImage(button) {
      if (!window.confirm("Remove this image?")) return;

      button.classList.add("gp-edit-saving");
      let result;
      try {
        const res = await fetch(`/admin/margin-images/${button.dataset.imageId}/inline-delete`, {
          method: "POST",
          headers: { "X-CSRFToken": csrfToken },
        });
        result = await res.json();
      } catch (err) {
        result = { ok: false, error: "Network error." };
      }

      if (result.ok) {
        const tile = button.closest(".gp-margin-deco-tile");
        const rail = tile ? tile.closest(".gp-margin-deco") : null;
        if (tile) tile.remove();
        if (window.gpLayoutMarginDeco) window.gpLayoutMarginDeco();
        if (rail) updateMarginAddState(rail);
        showToast("Image removed");
      } else {
        button.classList.remove("gp-edit-saving");
        showToast(result.error || "Couldn't remove image", true);
      }
    }

    document.querySelectorAll(".gp-margin-deco").forEach(updateMarginAddState);

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

      const addMarginBtn = e.target.closest(".gp-margin-deco-add");
      if (addMarginBtn) {
        e.preventDefault();
        if (!addMarginBtn.disabled) addMarginImage(addMarginBtn);
        return;
      }

      const editMarginBtn = e.target.closest(".gp-margin-deco-edit");
      if (editMarginBtn) {
        e.preventDefault();
        editMarginImage(editMarginBtn);
        return;
      }

      const removeMarginBtn = e.target.closest(".gp-margin-deco-remove");
      if (removeMarginBtn) {
        e.preventDefault();
        removeMarginImage(removeMarginBtn);
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

      const focusBtn = e.target.closest(".gp-event-hero-cover-focus");
      if (focusBtn) {
        e.preventDefault();
        const heroWrap = focusBtn.closest("[data-editable-image]");
        if (heroWrap) startAdjustingFocus(heroWrap);
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
