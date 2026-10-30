/**
 * DiscordShrink - Popup Settings Logic
 */

document.addEventListener("DOMContentLoaded", function () {
  const defaultSize = document.getElementById("default-size");
  const defaultQuality = document.getElementById("default-quality");

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["targetMB", "quality"], function (items) {
      if (items.targetMB && defaultSize) defaultSize.value = items.targetMB;
      if (items.quality && defaultQuality) defaultQuality.value = items.quality;
    });

    if (defaultSize) {
      defaultSize.addEventListener("change", function () {
        chrome.storage.local.set({ targetMB: defaultSize.value });
      });
    }

    if (defaultQuality) {
      defaultQuality.addEventListener("change", function () {
        chrome.storage.local.set({ quality: defaultQuality.value });
      });
    }
  }
});
