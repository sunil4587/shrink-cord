/**
 * ShrinkCord - Popup Settings Logic
 */

document.addEventListener("DOMContentLoaded", function () {
  try {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) return;

    const bindings = [
      { id: "default-size", key: "targetMB" },
      { id: "default-quality", key: "quality" },
      { id: "default-audio-quality", key: "audioQuality" }
    ];

    chrome.storage.local.get(bindings.map((b) => b.key), function (items) {
      try {
        if (chrome.runtime && chrome.runtime.lastError) return;
        bindings.forEach(({ id, key }) => {
          const el = document.getElementById(id);
          if (!el) return;
          const val = items && items[key] ? String(items[key]) : "";
          if (Array.from(el.options).some((opt) => opt.value === val)) {
            el.value = val;
          }
          el.addEventListener("change", function () {
            try {
              chrome.storage.local.set({ [key]: el.value });
            } catch (e) {}
          });
        });
      } catch (e) {}
    });
  } catch (e) {}
});
