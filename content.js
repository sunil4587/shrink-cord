// DiscordShrink - Content Script (Professional, Sleek, Native Discord Styling)

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024; // 19 MB (Safety margin below 20MB)
  let activeModalHost = null;

  console.log("%cDiscordShrink Active", "color: #5865F2; font-weight: bold;");

  const MODAL_CSS = `
    :host {
      all: initial;
      font-family: "gg sans", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      z-index: 2147483647 !important;
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .dshrink-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      animation: dshrink-fade 0.15s ease-out;
    }

    .dshrink-modal {
      position: relative;
      background: #313338;
      color: #dbdee1;
      width: 440px;
      max-width: 90vw;
      border-radius: 5px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale 0.15s ease-out;
      z-index: 10;
    }

    .dshrink-header {
      padding: 16px 20px 12px 20px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .dshrink-header-text h2 {
      font-size: 18px;
      font-weight: 700;
      color: #f2f3f5;
      line-height: 22px;
      letter-spacing: -0.1px;
    }

    .dshrink-header-text p {
      font-size: 13px;
      color: #949ba4;
      margin-top: 3px;
      line-height: 16px;
    }

    .dshrink-close-btn {
      background: transparent;
      border: none;
      color: #949ba4;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.12s ease;
    }

    .dshrink-close-btn:hover {
      color: #f2f3f5;
    }

    .dshrink-close-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .dshrink-body {
      padding: 0 20px 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .dshrink-file-row {
      background: #2b2d31;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .dshrink-filename {
      font-size: 13px;
      font-weight: 600;
      color: #f2f3f5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .dshrink-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .dshrink-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.2px;
    }

    .dshrink-tag-size {
      color: #f23f43;
      background: rgba(242, 63, 67, 0.15);
      border: 1px solid rgba(242, 63, 67, 0.25);
    }

    .dshrink-tag-duration {
      color: #949ba4;
      background: #1e1f22;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .dshrink-notice {
      background: #2b2d31;
      border-left: 3px solid #f0b232;
      border-radius: 0 3px 3px 0;
      padding: 8px 12px;
      font-size: 12px;
      color: #dbdee1;
      line-height: 16px;
    }

    .dshrink-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dshrink-field-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #b5bac1;
    }

    .dshrink-select-wrapper {
      position: relative;
      width: 100%;
    }

    .dshrink-select {
      width: 100%;
      height: 38px;
      appearance: none;
      -webkit-appearance: none;
      background: #1e1f22;
      color: #dbdee1;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      padding: 0 32px 0 12px;
      font-size: 13.5px;
      font-weight: 500;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .dshrink-select:hover {
      border-color: rgba(255, 255, 255, 0.18);
    }

    .dshrink-select:focus {
      border-color: #5865f2;
    }

    .dshrink-select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      width: 12px;
      height: 12px;
      fill: #80848e;
    }

    .dshrink-progress-card {
      display: none;
      background: #2b2d31;
      border-radius: 4px;
      padding: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      flex-direction: column;
      gap: 10px;
    }

    .dshrink-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
    }

    .dshrink-progress-status {
      color: #949ba4;
    }

    .dshrink-progress-pct {
      color: #5865f2;
      font-weight: 700;
    }

    .dshrink-progress-track {
      width: 100%;
      height: 5px;
      background: #1e1f22;
      border-radius: 2px;
      overflow: hidden;
    }

    .dshrink-progress-bar {
      width: 0%;
      height: 100%;
      background: #5865f2;
      border-radius: 2px;
      transition: width 0.15s ease;
    }

    .dshrink-footer {
      padding: 14px 20px;
      background: #2b2d31;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .dshrink-btn-cancel {
      background: transparent;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 3px;
      transition: text-decoration 0.12s ease;
    }

    .dshrink-btn-cancel:hover {
      text-decoration: underline;
    }

    .dshrink-btn-primary {
      background: #5865f2;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 3px;
      height: 38px;
      padding: 0 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease;
    }

    .dshrink-btn-primary:hover {
      background: #4752c4;
    }

    .dshrink-btn-primary:disabled {
      background: #35373c !important;
      color: #80848e !important;
      cursor: not-allowed;
    }

    @keyframes dshrink-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dshrink-scale {
      from { transform: scale(0.97); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("video/")) return true;
    const name = file.name ? file.name.toLowerCase() : "";
    return /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v|3gp)$/i.test(name);
  }

  function handleIncomingFiles(fileList, eventToCancel) {
    if (!fileList || fileList.length === 0) return false;
    const file = fileList[0];

    if (isVideoFile(file) && file.size > DISCORD_LIMIT_BYTES) {
      if (eventToCancel) {
        eventToCancel.preventDefault();
        eventToCancel.stopPropagation();
      }
      openShrinkModal(file);
      return true;
    }
    return false;
  }

  // Intercept drop events on Discord
  ["dragenter", "dragover"].forEach((evt) => {
    window.addEventListener(evt, (e) => e.preventDefault(), true);
  });

  window.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) {
      handleIncomingFiles(e.dataTransfer.files, e);
    }
  }, true);

  window.addEventListener("paste", (e) => {
    if (e.clipboardData && e.clipboardData.files) {
      handleIncomingFiles(e.clipboardData.files, e);
    }
  }, true);

  document.addEventListener("change", (e) => {
    if (e.target && e.target.type === "file" && e.target.files) {
      if (handleIncomingFiles(e.target.files, e)) {
        e.target.value = "";
      }
    }
  }, true);

  function openShrinkModal(originalFile) {
    if (activeModalHost) {
      activeModalHost.remove();
      activeModalHost = null;
    }

    let isAborted = false;
    let cleanupFn = null;

    const host = document.createElement("div");
    host.id = "discord-shrink-host";
    const shadow = host.attachShadow({ mode: "open" });

    const styleEl = document.createElement("style");
    styleEl.textContent = MODAL_CSS;
    shadow.appendChild(styleEl);

    const container = document.createElement("div");
    container.innerHTML = `
      <div class="dshrink-backdrop" id="dshrink-backdrop"></div>
      <div class="dshrink-modal" role="dialog" aria-modal="true">
        <div class="dshrink-header">
          <div class="dshrink-header-text">
            <h2>Compress Video</h2>
            <p>File exceeds Discord's 20MB limit. Optimize to attach.</p>
          </div>
          <button class="dshrink-close-btn" id="dshrink-close-x" aria-label="Close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        
        <div class="dshrink-body">
          <div class="dshrink-file-row">
            <span class="dshrink-filename" title="${originalFile.name}">${originalFile.name}</span>
            <div class="dshrink-tags">
              <span class="dshrink-tag dshrink-tag-duration" id="dshrink-duration-pill">Loading...</span>
              <span class="dshrink-tag dshrink-tag-size">${formatBytes(originalFile.size)}</span>
            </div>
          </div>

          <div id="dshrink-warn-container" style="display: none;"></div>

          <div id="dshrink-options-area" style="display: flex; flex-direction: column; gap: 12px;">
            <div class="dshrink-field" id="dshrink-clip-field" style="display: none;">
              <label class="dshrink-field-label">Clip Length</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-clip-length">
                  <option value="60" selected>First 60 seconds (Recommended clip)</option>
                  <option value="30">First 30 seconds (Quick clip)</option>
                  <option value="120">First 2 minutes (Extended)</option>
                  <option value="full">Full video (Takes longer)</option>
                </select>
                <svg class="dshrink-select-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>

            <div class="dshrink-field">
              <label class="dshrink-field-label">Target File Size</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-target-size">
                  <option value="19.0" selected>19.0 MB — Discord Limit (Guaranteed)</option>
                  <option value="15.0">15.0 MB — Mobile & Low Bandwidth</option>
                  <option value="8.0">8.0 MB — Legacy Discord Limit</option>
                </select>
                <svg class="dshrink-select-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>

            <div class="dshrink-field">
              <label class="dshrink-field-label">Resolution</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-resolution">
                  <option value="720" selected>720p HD (Balanced)</option>
                  <option value="480">480p SD (Fastest)</option>
                  <option value="original">Original Resolution</option>
                </select>
                <svg class="dshrink-select-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>
          </div>

          <div class="dshrink-progress-card" id="dshrink-progress-card">
            <div class="dshrink-progress-header">
              <span class="dshrink-progress-status" id="dshrink-status-text">Compressing video...</span>
              <span class="dshrink-progress-pct" id="dshrink-percentage">0%</span>
            </div>
            <div class="dshrink-progress-track">
              <div class="dshrink-progress-bar" id="dshrink-progress-bar"></div>
            </div>
          </div>
        </div>

        <div class="dshrink-footer">
          <button class="dshrink-btn-cancel" id="dshrink-cancel-btn">Cancel</button>
          <button class="dshrink-btn-primary" id="dshrink-start-btn">
            <span>Compress & Attach</span>
          </button>
        </div>
      </div>
    `;

    shadow.appendChild(container);
    document.body.appendChild(host);
    activeModalHost = host;

    const cancelBtn = shadow.getElementById("dshrink-cancel-btn");
    const closeX = shadow.getElementById("dshrink-close-x");
    const backdrop = shadow.getElementById("dshrink-backdrop");
    const startBtn = shadow.getElementById("dshrink-start-btn");
    const optionsArea = shadow.getElementById("dshrink-options-area");
    const progressCard = shadow.getElementById("dshrink-progress-card");
    const progressBar = shadow.getElementById("dshrink-progress-bar");
    const statusText = shadow.getElementById("dshrink-status-text");
    const percentageText = shadow.getElementById("dshrink-percentage");
    const durationPill = shadow.getElementById("dshrink-duration-pill");
    const warnContainer = shadow.getElementById("dshrink-warn-container");
    const clipField = shadow.getElementById("dshrink-clip-field");
    const clipLengthSelect = shadow.getElementById("dshrink-clip-length");
    const targetSizeSelect = shadow.getElementById("dshrink-target-size");
    const resolutionSelect = shadow.getElementById("dshrink-resolution");

    let videoDuration = 0;
    const probeVideo = document.createElement("video");
    probeVideo.preload = "metadata";
    probeVideo.muted = true;
    const probeUrl = URL.createObjectURL(originalFile);
    probeVideo.src = probeUrl;

    probeVideo.onloadedmetadata = () => {
      videoDuration = probeVideo.duration || 0;
      durationPill.textContent = formatDuration(videoDuration);
      URL.revokeObjectURL(probeUrl);

      // If video is longer than 2 minutes
      if (videoDuration > 120) {
        clipField.style.display = "flex";
        warnContainer.style.display = "block";
        warnContainer.innerHTML = `
          <div class="dshrink-notice">
            Long video detected (${formatDuration(videoDuration)}). Selecting a 60s clip is recommended for fast encoding.
          </div>
        `;
      }
    };

    probeVideo.onerror = () => {
      durationPill.textContent = "Video";
      URL.revokeObjectURL(probeUrl);
    };

    // INSTANT CANCEL
    function cancelAndClose() {
      isAborted = true;
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
      if (activeModalHost) {
        activeModalHost.remove();
        activeModalHost = null;
      }
    }

    cancelBtn.addEventListener("click", cancelAndClose);
    closeX.addEventListener("click", cancelAndClose);
    backdrop.addEventListener("click", cancelAndClose);

    // ESC key closes modal
    const keyHandler = (e) => {
      if (e.key === "Escape") {
        cancelAndClose();
        window.removeEventListener("keydown", keyHandler);
      }
    };
    window.addEventListener("keydown", keyHandler);

    startBtn.addEventListener("click", function () {
      const targetMB = parseFloat(targetSizeSelect.value);
      const resolutionSetting = resolutionSelect.value;
      
      let maxDuration = videoDuration || 60;
      if (videoDuration > 120) {
        const clipChoice = clipLengthSelect.value;
        if (clipChoice !== "full") {
          maxDuration = Math.min(parseFloat(clipChoice), videoDuration);
        }
      }

      optionsArea.style.display = "none";
      warnContainer.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;
      cancelBtn.textContent = "Cancel";

      cleanupFn = compressVideo(originalFile, targetMB, resolutionSetting, maxDuration, {
        onProgress: (percent, status) => {
          if (isAborted) return;
          progressBar.style.width = percent + "%";
          percentageText.textContent = Math.round(percent) + "%";
          if (status) statusText.textContent = status;
        },
        onComplete: (compressedBlob) => {
          if (isAborted) return;
          progressBar.style.width = "100%";
          percentageText.textContent = "100%";
          statusText.textContent = `Attached ${formatBytes(compressedBlob.size)} to Discord`;

          setTimeout(() => {
            if (!isAborted) {
              attachToDiscord(compressedBlob, originalFile.name);
              cancelAndClose();
            }
          }, 300);
        },
        onError: (err) => {
          if (isAborted) return;
          statusText.textContent = "Error: " + err.message;
          startBtn.disabled = false;
        }
      });
    });
  }

  function compressVideo(file, targetMB, resolutionSetting, maxDuration, callbacks) {
    callbacks.onProgress(5, "Analyzing video...");

    const videoEl = document.createElement("video");
    videoEl.preload = "auto";
    videoEl.muted = true;
    videoEl.playsInline = true;
    const fileUrl = URL.createObjectURL(file);
    videoEl.src = fileUrl;

    let isStopped = false;
    let recorder = null;

    function cleanup() {
      isStopped = true;
      try {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (e) {}
      try {
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch (e) {}
      URL.revokeObjectURL(fileUrl);
    }

    videoEl.onloadedmetadata = function () {
      if (isStopped) return;
      const fullDuration = videoEl.duration || 30;
      const targetDuration = Math.min(maxDuration, fullDuration);

      let width = videoEl.videoWidth || 1280;
      let height = videoEl.videoHeight || 720;

      if (resolutionSetting === "720" && height > 720) {
        width = Math.round((width * 720) / height);
        height = 720;
      } else if (resolutionSetting === "480" && height > 480) {
        width = Math.round((width * 480) / height);
        height = 480;
      }
      if (width % 2 !== 0) width--;
      if (height % 2 !== 0) height--;

      // Calculate bitrate to strictly fit target size
      const targetBytes = targetMB * 1024 * 1024 * 0.95;
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / targetDuration);
      let videoBitrate = Math.max(180000, totalBitrate - 96000);

      callbacks.onProgress(15, `Encoding (${width}x${height})...`);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(24);

      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: videoBitrate
        });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(fileUrl);
        if (!isStopped) {
          const finalBlob = new Blob(chunks, { type: "video/webm" });
          callbacks.onComplete(finalBlob);
        }
      };

      recorder.start(100);
      videoEl.playbackRate = 4.0; // 4x speed encoding
      videoEl.play();

      function drawFrame() {
        if (isStopped) return;

        if (videoEl.currentTime >= targetDuration || videoEl.ended || videoEl.paused) {
          callbacks.onProgress(98, "Finalizing...");
          recorder.stop();
          return;
        }

        ctx.drawImage(videoEl, 0, 0, width, height);

        const currentProgress = 15 + (videoEl.currentTime / targetDuration) * 80;
        callbacks.onProgress(
          currentProgress,
          `Encoding: ${(videoEl.currentTime).toFixed(0)}s / ${targetDuration.toFixed(0)}s`
        );

        requestAnimationFrame(drawFrame);
      }

      videoEl.onplay = () => requestAnimationFrame(drawFrame);
    };

    videoEl.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      if (!isStopped) callbacks.onError(new Error("Unable to decode video format."));
    };

    return cleanup;
  }

  function attachToDiscord(blob, originalName) {
    const cleanName = originalName.replace(/\.[^/.]+$/, "") + "-compressed.webm";
    const compressedFile = new File([blob], cleanName, { type: "video/webm" });

    // Method 1: Discord's native hidden file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // Method 2: Drop on active chat box
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
})();
