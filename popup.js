// DiscordShrink - Popup Settings Logic

document.addEventListener("DOMContentLoaded", function () {
  const defaultTarget = document.getElementById("default-target");
  const defaultResolution = document.getElementById("default-resolution");

  // Load saved user preferences
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["targetMB", "resolution"], function (items) {
      if (items.targetMB) defaultTarget.value = items.targetMB;
      if (items.resolution) defaultResolution.value = items.resolution;
    });

    // Save changes automatically
    defaultTarget.addEventListener("change", function () {
      chrome.storage.local.set({ targetMB: defaultTarget.value });
    });

    defaultResolution.addEventListener("change", function () {
      chrome.storage.local.set({ resolution: defaultResolution.value });
    });
  }
});
