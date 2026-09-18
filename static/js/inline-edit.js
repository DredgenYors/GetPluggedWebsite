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

  async function saveField(field, value) {
    try {
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

  function startEditingText(el) {
    if (el.classList.contains("gp-editing")) return;

    const field = el.dataset.field;
    const isMultiline = el.dataset.type === "textarea";
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

      const newValue = el.textContent.trim();
      if (newValue === original) return;

      if (!newValue) {
        el.textContent = original;
        showToast("Can't be empty", true);
        return;
      }

      el.classList.add("gp-edit-saving");
      const result = await saveField(field, newValue);
      el.classList.remove("gp-edit-saving");

      if (result.ok) {
        el.textContent = result.value;
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
        startEditingText(textEl);
      }
    });
  });
})();
