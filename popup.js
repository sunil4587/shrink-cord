/**
 * ShrinkCord - Settings Manager
 */

(function () {
  "use strict";

  const controls = {
    format: document.getElementById("default-format"),
    targetMB: document.getElementById("default-size"),
    quality: document.getElementById("default-quality")
  };

  function saveSettings() {
    const payload = {};
    if (controls.format) payload.format = controls.format.value;
    if (controls.targetMB) payload.targetMB = parseFloat(controls.targetMB.value);
    if (controls.quality) payload.quality = controls.quality.value;
    chrome.storage.local.set(payload);
  }

  chrome.storage.local.get(["format", "targetMB", "quality"], (res) => {
    if (!res) return;
    if (res.format && controls.format) controls.format.value = res.format;
    if (res.targetMB && controls.targetMB) controls.targetMB.value = String(res.targetMB);
    if (res.quality && controls.quality) controls.quality.value = res.quality;
  });

  Object.values(controls).forEach((el) => {
    if (el) el.addEventListener("change", saveSettings);
  });
})();
