// DiscordShrink - Content Script (DOM Interception, Shadow DOM & Video Compressor)

(function () {
  "use strict";

  const DISCORD_FREE_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MB
  let activeModalHost = null;

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("video/")) return true;
    const name = file.name.toLowerCase();
    return /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v)$/i.test(name);
  }

  // Intercept Drag & Drop anywhere on Discord Web
  window.addEventListener(
    "drop",
    function (event) {
      if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0) return;
      const file = event.dataTransfer.files[0];

      if (isVideoFile(file) && file.size > DISCORD_FREE_LIMIT_BYTES) {
        event.preventDefault();
        event.stopPropagation();
        openShrinkModal(file);
      }
    },
    true // Capture phase to intercept before Discord's React listeners
  );

  // Intercept Paste events (e.g. copied video or screen recording clip)
  window.addEventListener(
    "paste",
    function (event) {
      if (!event.clipboardData || !event.clipboardData.files || event.clipboardData.files.length === 0) return;
      const file = event.clipboardData.files[0];

      if (isVideoFile(file) && file.size > DISCORD_FREE_LIMIT_BYTES) {
        event.preventDefault();
        event.stopPropagation();
        openShrinkModal(file);
      }
    },
    true
  );

  function openShrinkModal(originalFile) {
    if (activeModalHost) {
      activeModalHost.remove();
      activeModalHost = null;
    }

    // Create custom host element and attach Shadow DOM for 100% CSS isolation
    const host = document.createElement("div");
    host.id = "discord-shrink-host";
    const shadow = host.attachShadow({ mode: "open" });

    // Load styles
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = chrome.runtime.getURL("styles.css");
    shadow.appendChild(styleLink);

    // Modal HTML
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="dshrink-backdrop" id="dshrink-backdrop"></div>
      <div class="dshrink-modal" role="dialog" aria-modal="true">
        <div class="dshrink-header">
          <svg class="dshrink-icon" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <h2 class="dshrink-title">DiscordShrink Video Optimizer</h2>
        </div>
        
        <div class="dshrink-body">
          <div class="dshrink-file-info">
            <span class="dshrink-filename" title="${originalFile.name}">${originalFile.name}</span>
            <span class="dshrink-filesize">${formatBytes(originalFile.size)} (Too Big)</span>
          </div>

          <div class="dshrink-option-group" id="dshrink-options">
            <label class="dshrink-label">Target File Size</label>
            <select class="dshrink-select" id="dshrink-target-size">
              <option value="23.8" selected>23.8 MB (Discord Free Safe Limit)</option>
              <option value="15.0">15.0 MB (WhatsApp & Mobile Friendly)</option>
              <option value="7.5">7.5 MB (Ultra Compact)</option>
            </select>

            <label class="dshrink-label" style="margin-top: 8px;">Resolution Quality</label>
            <select class="dshrink-select" id="dshrink-resolution">
              <option value="720" selected>Auto 720p (Recommended balance)</option>
              <option value="480">480p (Fastest encode)</option>
              <option value="original">Keep Original</option>
            </select>
          </div>

          <div class="dshrink-progress-container" id="dshrink-progress-container">
            <div class="dshrink-progress-bar-bg">
              <div class="dshrink-progress-bar-fill" id="dshrink-progress-bar"></div>
            </div>
            <div class="dshrink-progress-text">
              <span id="dshrink-status-text">Analyzing video...</span>
              <span id="dshrink-percentage">0%</span>
            </div>
          </div>
        </div>

        <div class="dshrink-footer">
          <button class="dshrink-btn dshrink-btn-cancel" id="dshrink-cancel-btn">Cancel</button>
          <button class="dshrink-btn dshrink-btn-primary" id="dshrink-start-btn">
            <span>⚡ Squeeze & Attach</span>
          </button>
        </div>
      </div>
    `;

    shadow.appendChild(container);
    document.body.appendChild(host);
    activeModalHost = host;

    // Element references
    const cancelBtn = shadow.getElementById("dshrink-cancel-btn");
    const backdrop = shadow.getElementById("dshrink-backdrop");
    const startBtn = shadow.getElementById("dshrink-start-btn");
    const optionsSection = shadow.getElementById("dshrink-options");
    const progressContainer = shadow.getElementById("dshrink-progress-container");
    const progressBar = shadow.getElementById("dshrink-progress-bar");
    const statusText = shadow.getElementById("dshrink-status-text");
    const percentageText = shadow.getElementById("dshrink-percentage");
    const targetSizeSelect = shadow.getElementById("dshrink-target-size");
    const resolutionSelect = shadow.getElementById("dshrink-resolution");

    function closeModal() {
      if (activeModalHost) {
        activeModalHost.remove();
        activeModalHost = null;
      }
    }

    cancelBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    startBtn.addEventListener("click", function () {
      const targetMB = parseFloat(targetSizeSelect.value);
      const resolution = resolutionSelect.value;

      // Switch to progress UI
      optionsSection.style.display = "none";
      progressContainer.style.display = "flex";
      startBtn.disabled = true;
      cancelBtn.disabled = true;

      compressVideo(originalFile, targetMB, resolution, {
        onProgress: (percent, status) => {
          progressBar.style.width = percent + "%";
          percentageText.textContent = Math.round(percent) + "%";
          if (status) statusText.textContent = status;
        },
        onComplete: (compressedBlob) => {
          progressBar.style.width = "100%";
          percentageText.textContent = "100%";
          statusText.textContent = `Attached ${formatBytes(compressedBlob.size)} video to Discord!`;

          setTimeout(() => {
            attachToDiscord(compressedBlob, originalFile.name);
            closeModal();
          }, 500);
        },
        onError: (err) => {
          statusText.textContent = "Error: " + err.message;
          startBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      });
    });
  }

  // High-Speed Client-Side Video Compressor
  function compressVideo(file, targetMB, resolutionSetting, callbacks) {
    callbacks.onProgress(5, "Reading video duration & dimensions...");

    const videoEl = document.createElement("video");
    videoEl.preload = "auto";
    videoEl.muted = true;
    videoEl.playsInline = true;
    const fileUrl = URL.createObjectURL(file);
    videoEl.src = fileUrl;

    videoEl.onloadedmetadata = function () {
      const duration = videoEl.duration || 30;
      let width = videoEl.videoWidth || 1280;
      let height = videoEl.videoHeight || 720;

      // Adjust resolution if selected
      if (resolutionSetting === "720" && height > 720) {
        width = Math.round((width * 720) / height);
        height = 720;
      } else if (resolutionSetting === "480" && height > 480) {
        width = Math.round((width * 480) / height);
        height = 480;
      }

      // Ensure even dimensions for codecs
      if (width % 2 !== 0) width--;
      if (height % 2 !== 0) height--;

      // Calculate Target Bitrate
      const targetBytes = targetMB * 1024 * 1024;
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / duration);
      const audioBitrate = 96000; // 96 kbps
      let videoBitrate = Math.floor(totalBitrate - audioBitrate);

      if (videoBitrate < 120000) videoBitrate = 120000; // Min safe bitrate

      callbacks.onProgress(15, `Encoding at ${Math.round(videoBitrate / 1000)} kbps (${width}x${height})...`);

      // Canvas Transcoder Pipeline
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Capture canvas stream at 30fps
      const stream = canvas.captureStream(30);

      // Check supported MIME types in Chrome
      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: videoBitrate,
        audioBitsPerSecond: audioBitrate
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(fileUrl);
        const finalBlob = new Blob(chunks, { type: "video/webm" });
        callbacks.onComplete(finalBlob);
      };

      recorder.start(100);

      // Play through video at up to 2x speed for faster encoding
      videoEl.playbackRate = 2.0;
      videoEl.play();

      function drawFrame() {
        if (videoEl.paused || videoEl.ended) return;
        ctx.drawImage(videoEl, 0, 0, width, height);

        const currentProgress = 15 + (videoEl.currentTime / duration) * 80;
        callbacks.onProgress(currentProgress, `Compressing... ${(videoEl.currentTime).toFixed(0)}s / ${duration.toFixed(0)}s`);

        requestAnimationFrame(drawFrame);
      }

      videoEl.onplay = () => requestAnimationFrame(drawFrame);

      videoEl.onended = () => {
        callbacks.onProgress(98, "Finalizing compressed file...");
        recorder.stop();
      };
    };

    videoEl.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      callbacks.onError(new Error("Unable to decode video format."));
    };
  }

  // Injects the compressed file back into Discord's native upload box
  function attachToDiscord(blob, originalName) {
    const cleanName = originalName.replace(/\.[^/.]+$/, "") + "-compressed.webm";
    const compressedFile = new File([blob], cleanName, { type: "video/webm" });

    // 1. Look for Discord's hidden file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // 2. Alternative: Dispatch synthetic drop event onto chat textbox
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

  console.log("⚡ DiscordShrink v1.0.0 initialized and ready.");
})();
