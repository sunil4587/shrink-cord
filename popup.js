/**
 * ShrinkCord - Settings Manager
 */

(function () {
  "use strict";

  const formatSelect = document.getElementById("default-format");
  const sizeSelect = document.getElementById("default-size");
  const qualitySelect = document.getElementById("default-quality");
  const audioQualitySelect = document.getElementById("default-audio-quality");

  function saveSettings() {
    chrome.storage.local.set({
      format: formatSelect.value,
      targetMB: parseFloat(sizeSelect.value),
      quality: qualitySelect.value,
      audioQuality: audioQualitySelect.value
    });
  }

  chrome.storage.local.get(["format", "targetMB", "quality", "audioQuality"], (res) => {
    if (res.format) formatSelect.value = res.format;
    if (res.targetMB) sizeSelect.value = String(res.targetMB);
    if (res.quality) qualitySelect.value = res.quality;
    if (res.audioQuality) audioQualitySelect.value = res.audioQuality;
  });

  [formatSelect, sizeSelect, qualitySelect, audioQualitySelect].forEach((el) => {
    el.addEventListener("change", saveSettings);
  });
})();
