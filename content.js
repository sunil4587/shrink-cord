/**
 * ShrinkCord - Content Script Controller
 * Intercepts oversized uploads (>20MB) on Discord Web and coordinates batch compression.
 */

(function () {
  "use strict";

  const { Compressor, UI } = window.ShrinkCord;
  const INTERCEPT_EVENTS = ["drop", "paste", "change"];
  const generatedFiles = new WeakSet();

  let cachedSettings = {};
  let activeCleanup = null;
  let activeModal = null;
  let fileQueue = [];
  let isQueueRunning = false;
  let queueTotal = 0;
  let queueCurrentIndex = 0;
  let detectedLimitBytes = Compressor.DISCORD_LIMIT_BYTES;
  let detectedTier = 0;
  let suppressNitroUntil = 0;

  window.addEventListener("message", function (event) {
    if (event.source === window && event.data?.type === "DSHRINK_AUTO_TIER") {
      if (typeof event.data.maxBytes === "number" && event.data.maxBytes > 0) {
        detectedLimitBytes = event.data.maxBytes;
        detectedTier = event.data.premiumType;
      }
    }
  });

  function isOversized(file) {
    return !generatedFiles.has(file) && Compressor.isMediaFile(file) && file.size > detectedLimitBytes;
  }

  window.dispatchEvent(new CustomEvent("dshrink:teardown"));

  function isExtensionValid() {
    try {
      return Boolean(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function loadSavedSettings(done) {
    let settled = false;
    const finish = (settings) => {
      if (settled) return;
      settled = true;
      if (settings && typeof settings === "object") {
        cachedSettings = { ...cachedSettings, ...settings };
      }
      done(cachedSettings);
    };

    if (!isExtensionValid()) {
      finish(cachedSettings);
      return;
    }

    try {
      if (!chrome?.storage?.local) {
        finish(cachedSettings);
        return;
      }
      chrome.storage.local.get(["targetMB", "quality", "audioQuality", "format"], (saved) => {
        try {
          if (chrome.runtime && chrome.runtime.lastError) {
            finish(cachedSettings);
            return;
          }
          finish(saved || {});
        } catch (err) {
          finish(cachedSettings);
        }
      });
    } catch (err) {
      finish(cachedSettings);
    }
  }

  function dismissDiscordDragOverlay(target) {
    try {
      [target, document.getElementById("app-mount"), document.body, document.documentElement, window].forEach((el) => {
        if (el && typeof el.dispatchEvent === "function") {
          el.dispatchEvent(new DragEvent("dragleave", { bubbles: true, cancelable: true }));
          el.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true }));
        }
      });
    } catch (e) {}
  }

  function attachToDiscord(blob, originalName, isAudio, format, customName, isSpoiler) {
    const isMp4 = !isAudio && format === "mp4";
    const ext = isAudio ? "wav" : (isMp4 ? "mp4" : "webm");
    const mimeType = isAudio ? "audio/wav" : (isMp4 ? "video/mp4" : "video/webm");
    let name = (customName && customName.trim())
      ? customName.trim()
      : `${(originalName || (isAudio ? "audio" : "video")).replace(/\.[^/.]+$/, "")}-compressed.${ext}`;
    const expectedExt = `.${ext}`;
    if (!name.toLowerCase().endsWith(expectedExt)) {
      name = `${name.replace(/\.[^/.]+$/, "")}${expectedExt}`;
    }
    if (isSpoiler && !name.startsWith("SPOILER_")) {
      name = `SPOILER_${name}`;
    } else if (!isSpoiler && name.startsWith("SPOILER_")) {
      name = name.replace(/^SPOILER_/, "");
    }
    const compressedFile = new File([blob], name, { type: mimeType });
    generatedFiles.add(compressedFile);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(compressedFile);

    const fileInput =
      document.querySelector('input.file-input[type="file"], form input[type="file"], input[type="file"][multiple]') ||
      document.querySelector('input[type="file"]:not([accept*="image/"])') ||
      document.querySelector('input[type="file"]');

    if (fileInput) {
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const chatBox = document.querySelector('[role="textbox"]') || document.querySelector('[contenteditable="true"]') || document.body;
    if (!chatBox) return;

    try {
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });
      chatBox.dispatchEvent(pasteEvent);
      if (pasteEvent.defaultPrevented) return;
    } catch (e) {}

    chatBox.dispatchEvent(new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer
    }));
  }

  function stopCleanup() {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
  }

  function stopActiveSession() {
    stopCleanup();
    if (activeModal) {
      activeModal.close();
      activeModal = null;
    }
  }

  function cancelAll() {
    fileQueue = [];
    isQueueRunning = false;
    queueTotal = 0;
    queueCurrentIndex = 0;
    stopActiveSession();
  }

  function enqueueFiles(files) {
    const list = Array.from(files).filter(isOversized);
    if (list.length === 0) return;

    if (!isQueueRunning) {
      queueTotal = list.length;
      queueCurrentIndex = 1;
      fileQueue = [...list];
      processNextInQueue();
    } else {
      queueTotal += list.length;
      fileQueue.push(...list);
    }
  }

  function processNextInQueue() {
    if (fileQueue.length === 0) {
      isQueueRunning = false;
      queueTotal = 0;
      queueCurrentIndex = 0;
      return;
    }

    isQueueRunning = true;
    const file = fileQueue.shift();
    const queueInfo = queueTotal > 1 ? { index: queueCurrentIndex++, total: queueTotal } : null;

    handleMediaFile(file, queueInfo, () => {
      setTimeout(processNextInQueue, 400);
    });
  }

  function handleMediaFile(file, queueInfo, onDone) {
    stopCleanup();
    const isAudio = Compressor.isAudioFile(file);

    function launch(defaults = {}) {
      activeModal = UI.openModal(file, {
        onStart: (options) => {
          const callbacks = {
            onProgress: (percent, status, subtext) => {
              if (activeModal) activeModal.updateProgress(percent, status, subtext);
            },
            onComplete: (compressedBlob, format) => {
              if (activeModal) activeModal.complete(compressedBlob, format);
              attachToDiscord(compressedBlob, file.name, isAudio, format, options.customName, options.isSpoiler);
              activeCleanup = null;
              activeModal = null;
              if (onDone) onDone();
            },
            onError: (err) => {
              if (activeModal) activeModal.error(err);
              activeCleanup = null;
            }
          };

          const maxDuration = (options.clip && options.clip !== "full") ? parseFloat(options.clip) : 0;

          activeCleanup = isAudio
            ? Compressor.compressAudio(file, options.targetMB, options.quality, maxDuration, callbacks, {
                audioBoost: options.audioBoost
              })
            : Compressor.compressVideo(
                file,
                options.targetMB,
                options.quality,
                maxDuration,
                callbacks,
                options.hostElement,
                options.format,
                {
                  muteAudio: options.muteAudio,
                  audioBoost: options.audioBoost
                }
              );
        },
        onCancel: () => {
          cancelAll();
        }
      }, defaults, queueInfo, { limitBytes: detectedLimitBytes, tier: detectedTier });
    }

    loadSavedSettings(launch);
  }

  const nitroShield = new MutationObserver(() => {
    if (!activeModal && !isQueueRunning && Date.now() > suppressNitroUntil) {
      return;
    }

    document.querySelectorAll('[role="dialog"], [class*="modal-"], [class*="layer-"]').forEach((dialog) => {
      if (dialog.closest("#dshrink-modal-root") || dialog.id === "dshrink-modal-root" || dialog.classList.contains("dshrink-modal")) {
        return;
      }
      const text = dialog.textContent || "";
      if (text.includes("exceeds the size limit") || text.includes("max file size is")) {
        const closeBtn = dialog.querySelector('button[aria-label="Close"], [class*="closeButton"], [class*="close-"]');
        if (closeBtn) closeBtn.click();
        else dialog.remove();
      }
    });
  });

  function teardownListeners() {
    try {
      cancelAll();
      INTERCEPT_EVENTS.forEach((evt) => window.removeEventListener(evt, interceptEvent, { capture: true }));
      window.removeEventListener("dragover", handleDragOver, { capture: true });
      window.removeEventListener("dshrink:teardown", teardownListeners);
      nitroShield.disconnect();
    } catch (err) {}
  }

  function handleDragOver(e) {
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
    }
  }

  function extractEventFiles(e) {
    if (e.dataTransfer?.files?.length > 0) return e.dataTransfer.files;
    if (e.clipboardData?.files?.length > 0) return e.clipboardData.files;
    if (e.target?.type === "file" && e.target.files?.length > 0) return e.target.files;
    return null;
  }

  function interceptEvent(e) {
    const files = extractEventFiles(e);
    if (!files || files.length === 0) return false;

    const oversized = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isOversized(file)) {
        oversized.push(file);
      }
    }

    if (oversized.length === 0) return false;

    suppressNitroUntil = Date.now() + 4000;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (e.type === "drop") {
      dismissDiscordDragOverlay(e.target);
    }
    if (e.target?.type === "file") {
      try { e.target.value = ""; } catch (err) {}
    }

    enqueueFiles(oversized);
    return true;
  }

  loadSavedSettings(() => {});
  window.addEventListener("dshrink:teardown", teardownListeners);
  INTERCEPT_EVENTS.forEach((evt) => window.addEventListener(evt, interceptEvent, { capture: true, passive: false }));
  window.addEventListener("dragover", handleDragOver, { capture: true, passive: false });

  try {
    nitroShield.observe(document.body, { childList: true, subtree: true });
  } catch (err) {}
})();
