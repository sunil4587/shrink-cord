// DiscordShrink - Content Script (Ultra-Fast, Rock-Solid, Instantly Cancellable)

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024; // 19 MB (Safety margin below 20MB)
  let activeModalHost = null;

  console.log("%c⚡ DiscordShrink v1.2 Active!", "background: #5865F2; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;");

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
      background-color: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(12px);
      animation: dshrink-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dshrink-modal {
      position: relative;
      background: #313338;
      color: #dbdee1;
      width: 92%;
      max-width: 480px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
    }

    .dshrink-header {
      padding: 22px 24px 16px 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .dshrink-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dshrink-icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(88, 101, 242, 0.25), rgba(88, 101, 242, 0.1));
      border: 1px solid rgba(88, 101, 242, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dshrink-icon-badge svg {
      width: 22px;
      height: 22px;
      fill: #5865f2;
    }

    .dshrink-header-text h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
      line-height: 1.2;
    }

    .dshrink-header-text p {
      font-size: 13px;
      color: #949ba4;
      margin-top: 3px;
    }

    .dshrink-close-btn {
      background: transparent;
      border: none;
      color: #80848e;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .dshrink-close-btn:hover {
      color: #dbdee1;
      background: rgba(255, 255, 255, 0.08);
    }

    .dshrink-close-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .dshrink-body {
      padding: 0 24px 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dshrink-file-card {
      background: #2b2d31;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid rgba(255, 255, 255, 0.06);
      gap: 10px;
    }

    .dshrink-file-card-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .dshrink-file-card-left svg {
      width: 20px;
      height: 20px;
      fill: #b5bac1;
      flex-shrink: 0;
    }

    .dshrink-filename {
      font-size: 13px;
      font-weight: 600;
      color: #f2f3f5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dshrink-pill-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .dshrink-size-pill {
      font-size: 11px;
      font-weight: 700;
      color: #f23f43;
      background: rgba(242, 63, 67, 0.15);
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(242, 63, 67, 0.3);
    }

    .dshrink-duration-pill {
      font-size: 11px;
      font-weight: 600;
      color: #b5bac1;
      background: rgba(255, 255, 255, 0.07);
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .dshrink-warn-box {
      background: rgba(240, 178, 50, 0.1);
      border: 1px solid rgba(240, 178, 50, 0.3);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: #f0b232;
      line-height: 1.4;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .dshrink-warn-box svg {
      width: 16px;
      height: 16px;
      fill: #f0b232;
      flex-shrink: 0;
      margin-top: 1px;
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
      letter-spacing: 0.6px;
      color: #b5bac1;
    }

    .dshrink-select-wrapper {
      position: relative;
      width: 100%;
    }

    .dshrink-select {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      background: #1e1f22;
      color: #f2f3f5;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 11px 14px;
      padding-right: 36px;
      font-size: 13.5px;
      font-weight: 500;
      outline: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .dshrink-select:hover {
      border-color: rgba(255, 255, 255, 0.16);
    }

    .dshrink-select:focus {
      border-color: #5865f2;
      box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.25);
    }

    .dshrink-select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      width: 14px;
      height: 14px;
      fill: #80848e;
    }

    .dshrink-progress-card {
      display: none;
      background: #2b2d31;
      border-radius: 10px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      flex-direction: column;
      gap: 12px;
    }

    .dshrink-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
    }

    .dshrink-progress-status {
      color: #dbdee1;
    }

    .dshrink-progress-pct {
      color: #23a55a;
      font-weight: 700;
    }

    .dshrink-progress-track {
      width: 100%;
      height: 8px;
      background: #1e1f22;
      border-radius: 999px;
      overflow: hidden;
    }

    .dshrink-progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #5865f2, #23a55a);
      border-radius: 999px;
      transition: width 0.2s ease;
    }

    .dshrink-footer {
      padding: 16px 24px;
      background: #2b2d31;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .dshrink-btn-cancel {
      background: transparent;
      color: #f2f3f5;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      padding: 10px 18px;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .dshrink-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.07);
      color: #fa777c;
    }

    .dshrink-btn-primary {
      background: #5865f2;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      padding: 11px 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35);
    }

    .dshrink-btn-primary:hover {
      background: #4752c4;
      box-shadow: 0 4px 16px rgba(88, 101, 242, 0.5);
    }

    .dshrink-btn-primary:disabled {
      background: #35373c !important;
      color: #80848e !important;
      box-shadow: none !important;
      cursor: not-allowed;
    }

    @keyframes dshrink-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dshrink-scale-in {
      from { transform: scale(0.92); opacity: 0; }
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
          <div class="dshrink-header-left">
            <div class="dshrink-icon-badge">
              <svg viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </div>
            <div class="dshrink-header-text">
              <h2>DiscordShrink Video Optimizer</h2>
              <p>Compress locally to fit Discord's 20MB limit</p>
            </div>
          </div>
          <button class="dshrink-close-btn" id="dshrink-close-x" aria-label="Close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        
        <div class="dshrink-body">
          <div class="dshrink-file-card">
            <div class="dshrink-file-card-left">
              <svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
              <span class="dshrink-filename" title="${originalFile.name}">${originalFile.name}</span>
            </div>
            <div class="dshrink-pill-group">
              <span class="dshrink-duration-pill" id="dshrink-duration-pill">Loading...</span>
              <span class="dshrink-size-pill">${formatBytes(originalFile.size)}</span>
            </div>
          </div>

          <div id="dshrink-warn-container" style="display: none;"></div>

          <div id="dshrink-options-area" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="dshrink-field" id="dshrink-clip-field" style="display: none;">
              <label class="dshrink-field-label">Length to Share</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-clip-length">
                  <option value="60" selected>⚡ Highlight Clip (First 60s) — Instant (~10s encode)</option>
                  <option value="30">⚡ Quick Clip (First 30s) — Ultra-Fast (~5s encode)</option>
                  <option value="120">⚡ Extended Clip (First 2 min) — (~20s encode)</option>
                  <option value="full">Full Video (Slow — takes several minutes)</option>
                </select>
                <svg class="dshrink-select-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>

            <div class="dshrink-field">
              <label class="dshrink-field-label">Target File Size</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-target-size">
                  <option value="19.0" selected>19.0 MB — Discord Safe Limit (Guaranteed)</option>
                  <option value="15.0">15.0 MB — Safe Buffer / Mobile</option>
                  <option value="8.0">8.0 MB — Legacy Discord Size</option>
                </select>
                <svg class="dshrink-select-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>

            <div class="dshrink-field">
              <label class="dshrink-field-label">Resolution & Speed</label>
              <div class="dshrink-select-wrapper">
                <select class="dshrink-select" id="dshrink-resolution">
                  <option value="720" selected>720p HD (Best balance of speed & quality)</option>
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
            <span>⚡ Squeeze & Attach</span>
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

      // If video is longer than 2 minutes (like the user's 50-minute sample)
      if (videoDuration > 120) {
        clipField.style.display = "flex";
        warnContainer.style.display = "block";
        warnContainer.innerHTML = `
          <div class="dshrink-warn-box">
            <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <div>
              <strong>Long video detected (${formatDuration(videoDuration)}).</strong><br/>
              Discord clips work best at 60s. We recommend clipping to attach in seconds.
            </div>
          </div>
        `;
      }
    };

    probeVideo.onerror = () => {
      durationPill.textContent = "Video";
      URL.revokeObjectURL(probeUrl);
    };

    // INSTANT CANCEL - NEVER FREEZES
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
      cancelBtn.textContent = "Cancel Processing";

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
          statusText.textContent = `Attached ${formatBytes(compressedBlob.size)} to Discord!`;

          setTimeout(() => {
            if (!isAborted) {
              attachToDiscord(compressedBlob, originalFile.name);
              cancelAndClose();
            }
          }, 350);
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
    callbacks.onProgress(5, "Analyzing video stream...");

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
      const targetBytes = targetMB * 1024 * 1024 * 0.95; // 5% safe buffer
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / targetDuration);
      let videoBitrate = Math.max(180000, totalBitrate - 96000);

      callbacks.onProgress(15, `Encoding at high speed (${width}x${height})...`);

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
      videoEl.playbackRate = 4.0; // 4x speed encoding!
      videoEl.play();

      function drawFrame() {
        if (isStopped) return;

        if (videoEl.currentTime >= targetDuration || videoEl.ended || videoEl.paused) {
          callbacks.onProgress(98, "Finishing video...");
          recorder.stop();
          return;
        }

        ctx.drawImage(videoEl, 0, 0, width, height);

        const currentProgress = 15 + (videoEl.currentTime / targetDuration) * 80;
        callbacks.onProgress(
          currentProgress,
          `Optimizing: ${(videoEl.currentTime).toFixed(0)}s / ${targetDuration.toFixed(0)}s`
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
