// DiscordShrink - Content Script (Self-Contained Shadow DOM & Interception)

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024; // 19 MB
  let activeModalHost = null;

  console.log("%c⚡ DiscordShrink v1.0.0 Active!", "background: #5865F2; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;");

  const MODAL_CSS = `
    :host {
      all: initial;
      font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
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
    .dshrink-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      animation: dshrink-fade-in 0.2s ease;
    }
    .dshrink-modal {
      position: relative;
      background-color: #313338;
      color: #dbdee1;
      width: 90%;
      max-width: 440px;
      border-radius: 8px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 10;
    }
    .dshrink-header {
      padding: 16px 20px;
      background-color: #2b2d31;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .dshrink-icon {
      width: 28px;
      height: 28px;
      fill: #5865f2;
      flex-shrink: 0;
    }
    .dshrink-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .dshrink-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dshrink-file-info {
      background-color: #2b2d31;
      border-radius: 6px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .dshrink-filename {
      font-size: 13px;
      font-weight: 600;
      color: #f2f3f5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }
    .dshrink-filesize {
      font-size: 12px;
      font-weight: 700;
      color: #fa777c;
      background-color: rgba(250, 119, 124, 0.12);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .dshrink-option-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dshrink-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #b5bac1;
    }
    .dshrink-select {
      background-color: #1e1f22;
      color: #dbdee1;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      cursor: pointer;
    }
    .dshrink-select:focus {
      border-color: #5865f2;
    }
    .dshrink-progress-container {
      display: none;
      flex-direction: column;
      gap: 8px;
    }
    .dshrink-progress-bar-bg {
      width: 100%;
      height: 8px;
      background-color: #1e1f22;
      border-radius: 4px;
      overflow: hidden;
    }
    .dshrink-progress-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #5865f2, #23a55a);
      transition: width 0.2s ease;
    }
    .dshrink-progress-text {
      font-size: 12px;
      font-weight: 600;
      color: #949ba4;
      display: flex;
      justify-content: space-between;
    }
    .dshrink-footer {
      padding: 16px 20px;
      background-color: #2b2d31;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .dshrink-btn {
      padding: 10px 18px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: background-color 0.15s ease;
    }
    .dshrink-btn-cancel {
      background-color: transparent;
      color: #ffffff;
    }
    .dshrink-btn-cancel:hover {
      text-decoration: underline;
    }
    .dshrink-btn-primary {
      background-color: #5865f2;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dshrink-btn-primary:hover {
      background-color: #4752c4;
    }
    .dshrink-btn-primary:disabled {
      background-color: #35373c;
      color: #80848e;
      cursor: not-allowed;
    }
    @keyframes dshrink-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes dshrink-scale-in {
      from { transform: scale(0.95); opacity: 0; }
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

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("video/")) return true;
    const name = file.name ? file.name.toLowerCase() : "";
    return /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v|3gp)$/i.test(name);
  }

  // Intercept on BOTH window and document in capture phase
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

  ["dragenter", "dragover"].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      e.preventDefault();
    }, true);
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
        e.target.value = ""; // clear input
      }
    }
  }, true);

  function openShrinkModal(originalFile) {
    if (activeModalHost) {
      activeModalHost.remove();
      activeModalHost = null;
    }

    const host = document.createElement("div");
    host.id = "discord-shrink-host";
    const shadow = host.attachShadow({ mode: "open" });

    // Inject styles directly into shadow root
    const styleEl = document.createElement("style");
    styleEl.textContent = MODAL_CSS;
    shadow.appendChild(styleEl);

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
              <option value="19.0" selected>19.0 MB (Discord Free Safe Limit)</option>
              <option value="15.0">15.0 MB (WhatsApp Friendly)</option>
              <option value="7.5">7.5 MB (Ultra Compact)</option>
            </select>

            <label class="dshrink-label" style="margin-top: 8px;">Resolution Quality</label>
            <select class="dshrink-select" id="dshrink-resolution">
              <option value="720" selected>Auto 720p (Recommended)</option>
              <option value="480">480p (Fastest)</option>
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
          statusText.textContent = `Attached ${formatBytes(compressedBlob.size)} video!`;

          setTimeout(() => {
            attachToDiscord(compressedBlob, originalFile.name);
            closeModal();
          }, 400);
        },
        onError: (err) => {
          statusText.textContent = "Error: " + err.message;
          startBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      });
    });
  }

  function compressVideo(file, targetMB, resolutionSetting, callbacks) {
    callbacks.onProgress(5, "Reading video metadata...");

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

      if (resolutionSetting === "720" && height > 720) {
        width = Math.round((width * 720) / height);
        height = 720;
      } else if (resolutionSetting === "480" && height > 480) {
        width = Math.round((width * 480) / height);
        height = 480;
      }

      if (width % 2 !== 0) width--;
      if (height % 2 !== 0) height--;

      const targetBytes = targetMB * 1024 * 1024;
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / duration);
      const audioBitrate = 96000;
      let videoBitrate = Math.floor(totalBitrate - audioBitrate);
      if (videoBitrate < 120000) videoBitrate = 120000;

      callbacks.onProgress(15, `Encoding at ${Math.round(videoBitrate / 1000)} kbps (${width}x${height})...`);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);

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

  function attachToDiscord(blob, originalName) {
    const cleanName = originalName.replace(/\.[^/.]+$/, "") + "-compressed.webm";
    const compressedFile = new File([blob], cleanName, { type: "video/webm" });

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
})();
