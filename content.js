/**
 * ShrinkCord - Content Script Controller
 * Intercepts oversized uploads (>20MB) on Discord Web and bridges UI with Compressor.
 */

(function () {
  "use strict";

  const { Compressor, UI } = window.ShrinkCord;
  const INTERCEPT_EVENTS = ["drop", "paste", "change"];
  const generatedFiles = new WeakSet();
  let cachedSettings = {};
  let activeCleanup = null;
  let activeModal = null;

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
      chrome.storage.local.get(["targetMB", "quality", "audioQuality"], (saved) => {
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

  function attachToDiscord(blob, originalName, isAudio) {
    const ext = isAudio ? "wav" : "webm";
    const mimeType = isAudio ? "audio/wav" : "video/webm";
    const baseName = (originalName || (isAudio ? "audio" : "video")).replace(/\.[^/.]+$/, "");
    const compressedFile = new File([blob], `${baseName}-compressed.${ext}`, { type: mimeType });
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

  function handleMediaFile(file) {
    stopActiveSession();
    const isAudio = Compressor.isAudioFile(file);

    function launch(defaults = {}) {
      activeModal = UI.openModal(file, {
        onStart: (options) => {
          const callbacks = {
            onProgress: (percent, status, subtext) => {
              if (activeModal) activeModal.updateProgress(percent, status, subtext);
            },
            onComplete: (compressedBlob) => {
              if (activeModal) activeModal.complete(compressedBlob);
              attachToDiscord(compressedBlob, file.name, isAudio);
              activeCleanup = null;
              activeModal = null;
            },
            onError: (err) => {
              if (activeModal) activeModal.error(err);
              activeCleanup = null;
            }
          };

          const maxDuration = (options.clip && options.clip !== "full") ? parseFloat(options.clip) : 0;

          activeCleanup = isAudio
            ? Compressor.compressAudio(file, options.targetMB, options.quality, maxDuration, callbacks)
            : Compressor.compressVideo(file, options.targetMB, options.quality, maxDuration, callbacks, options.hostElement);
        },
        onCancel: () => {
          stopCleanup();
          activeModal = null;
        }
      }, defaults);
    }

    loadSavedSettings(launch);
  }

  const nitroShield = new MutationObserver(() => {
    document.querySelectorAll('[role="dialog"], [class*="modal-"], [class*="layer-"]').forEach((dialog) => {
      if (dialog.closest("#dshrink-modal-root") || dialog.id === "dshrink-modal-root" || dialog.classList.contains("dshrink-modal")) {
        return;
      }
      const text = dialog.textContent || "";
      if (text.includes("exceeds the size limit") || text.includes("max file size is 20MB")) {
        const closeBtn = dialog.querySelector('button[aria-label="Close"], [class*="closeButton"], [class*="close-"]');
        if (closeBtn) closeBtn.click();
        else dialog.remove();
      }
    });
  });

  function teardownListeners() {
    try {
      stopActiveSession();
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
    if (!files) return false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!generatedFiles.has(file) && Compressor.isMediaFile(file) && file.size > Compressor.DISCORD_LIMIT_BYTES) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (e.type === "drop") {
          dismissDiscordDragOverlay(e.target);
        }
        if (e.target?.type === "file") {
          try { e.target.value = ""; } catch (err) {}
        }
        handleMediaFile(file);
        return true;
      }
    }
    return false;
  }

  loadSavedSettings(() => {});
  window.addEventListener("dshrink:teardown", teardownListeners);
  INTERCEPT_EVENTS.forEach((evt) => window.addEventListener(evt, interceptEvent, { capture: true, passive: false }));
  window.addEventListener("dragover", handleDragOver, { capture: true, passive: false });

  try {
    nitroShield.observe(document.body, { childList: true, subtree: true });
  } catch (err) {}
})();
