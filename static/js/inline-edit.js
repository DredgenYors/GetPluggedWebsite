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

  async function saveImage(field, file) {
    try {
      const fd = new FormData();
      fd.append("field", field);
      fd.append("file", file);
      const res = await fetch("/admin/inline-edit-image", {
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

  function startEditingImage(wrapper) {
    const field = wrapper.dataset.field;
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
      const result = await saveImage(field, file);
      wrapper.classList.remove("gp-edit-saving");

      if (result.ok) {
        if (wrapper.tagName === "IMG") {
          wrapper.src = result.url;
        } else {
          const existingImg = wrapper.querySelector("img");
          if (existingImg) {
            existingImg.src = result.url;
          } else {
            wrapper.innerHTML = "";
            const img = document.createElement("img");
            img.src = result.url;
            img.alt = "";
            wrapper.appendChild(img);
          }
        }
        showToast("Image updated");
      } else {
        showToast(result.error || "Couldn't upload", true);
      }
    });

    fileInput.click();
  }

  async function addEvent(button) {
    button.classList.add("gp-edit-saving");
    try {
      const res = await fetch("/admin/inline-add-event", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
      });
      const result = await res.json();
      if (result.ok && result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      showToast(result.error || "Couldn't add event", true);
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
        addEvent(addEventBtn);
      });
    }

    document.body.addEventListener("click", (e) => {
      if (!isEditMode()) return;

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
