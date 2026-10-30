/**
 * DiscordShrink - Content Script Controller
 * Intercepts oversized uploads (>20MB) on Discord Web and bridges UI with Compressor.
 */

(function () {
  "use strict";

  const { Compressor, UI } = window.DiscordShrink;
  let activeCleanup = null;
  let activeModal = null;

  console.log("%cDiscordShrink Active (Video + Audio)", "color: #5865F2; font-weight: bold;");

  /**
   * Attaches the compressed file to Discord's chat input.
   */
  function attachToDiscord(blob, originalName, isAudio) {
    const ext = isAudio ? "wav" : "webm";
    const mimeType = isAudio ? "audio/wav" : "video/webm";
    const cleanName = originalName.replace(/\.[^/.]+$/, "") + "-compressed." + ext;
    const compressedFile = new File([blob], cleanName, { type: mimeType });

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const chatBox = document.querySelector('[role="textbox"]') || document.querySelector('[contenteditable="true"]');
    if (chatBox) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      chatBox.dispatchEvent(dropEvent);
    }
  }

  /**
   * Opens the compression modal and connects it to the appropriate compression engine.
   */
  function handleMediaFile(file) {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
    if (activeModal) {
      activeModal.close();
      activeModal = null;
    }

    const isAudio = Compressor.isAudioFile(file);

    function launch(defaults = {}) {
      activeModal = UI.openModal(file, {
        onStart: (options) => {
          const callbacks = {
            onProgress: (percent, status, subtext) => {
              activeModal.updateProgress(percent, status, subtext);
            },
            onComplete: (compressedBlob) => {
              activeModal.complete(compressedBlob);
              attachToDiscord(compressedBlob, file.name, isAudio);
              activeCleanup = null;
              activeModal = null;
            },
            onError: (err) => {
              activeModal.error(err);
              activeCleanup = null;
            }
          };

          if (isAudio) {
            let maxDuration = 0;
            if (options.mediaDuration > 0 && options.clip !== "full") {
              maxDuration = Math.min(parseFloat(options.clip), options.mediaDuration);
            }
            activeCleanup = Compressor.compressAudio(
              file,
              options.targetMB,
              options.quality,
              maxDuration,
              callbacks
            );
          } else {
            let maxDuration = 60;
            if (options.mediaDuration > 0) {
              maxDuration = options.clip === "full" ? options.mediaDuration : Math.min(parseFloat(options.clip), options.mediaDuration);
            }
            activeCleanup = Compressor.compressVideo(
              file,
              options.targetMB,
              options.quality,
              maxDuration,
              callbacks
            );
          }
        },
        onCancel: () => {
          if (activeCleanup) {
            activeCleanup();
            activeCleanup = null;
          }
          activeModal = null;
        }
      }, defaults);
    }

    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["targetMB", "quality"], (saved) => {
        launch(saved || {});
      });
    } else {
      launch();
    }
  }

  /**
   * Capture phase event interceptor for files exceeding Discord's free limit.
   */
  function interceptEvent(e) {
    let files = null;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      files = e.dataTransfer.files;
    } else if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      files = e.clipboardData.files;
    } else if (e.target && e.target.type === "file" && e.target.files && e.target.files.length > 0) {
      files = e.target.files;
    }

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (Compressor.isMediaFile(file) && file.size > Compressor.DISCORD_LIMIT_BYTES) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (e.target && e.target.type === "file") {
            try { e.target.value = ""; } catch (err) {}
          }
          handleMediaFile(file);
          return true;
        }
      }
    }
    return false;
  }

  // Intercept drag, drop, paste, and file input changes
  [window, document].forEach((target) => {
    target.addEventListener("drop", interceptEvent, { capture: true, passive: false });
    target.addEventListener("paste", interceptEvent, { capture: true, passive: false });
    target.addEventListener("change", interceptEvent, { capture: true, passive: false });
    target.addEventListener("dragover", (e) => { e.preventDefault(); }, { capture: true, passive: false });
    target.addEventListener("dragenter", (e) => { e.preventDefault(); }, { capture: true, passive: false });
  });

  // Automated Nitro Paywall Shield
  const nitroShield = new MutationObserver(() => {
    const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal-"], [class*="layer-"]');
    dialogs.forEach((dialog) => {
      // Guard against our own modal
      if (dialog.closest("#dshrink-modal-root") || dialog.id === "dshrink-modal-root" || dialog.classList.contains("dshrink-modal")) {
        return;
      }
      const text = dialog.textContent || "";
      if (text.includes("exceeds the size limit") || text.includes("max file size is 20MB")) {
        const closeBtn = dialog.querySelector('button[aria-label="Close"], [class*="closeButton"], [class*="close-"]');
        if (closeBtn) {
          closeBtn.click();
        } else {
          dialog.remove();
        }
      }
    });
  });

  try {
    nitroShield.observe(document.body, { childList: true, subtree: true });
  } catch (err) {}
})();
