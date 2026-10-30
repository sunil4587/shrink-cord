// DiscordShrink - Content Script (Native Discord Segmented Controls & Sleek UI)

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
      background-color: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(5px);
      animation: dshrink-fade 0.15s ease-out;
    }

    .dshrink-modal {
      position: relative;
      background: #313338;
      color: #dbdee1;
      width: 460px;
      max-width: 92vw;
      border-radius: 5px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale 0.15s ease-out;
      z-index: 10;
    }

    .dshrink-header {
      padding: 16px 20px 14px 20px;
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

    .dshrink-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dshrink-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #b5bac1;
    }

    /* Professional Discord Segmented Controls */
    .dshrink-segment-group {
      display: flex;
      background: #1e1f22;
      border-radius: 4px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .dshrink-segment-btn {
      flex: 1;
      padding: 8px 6px;
      font-size: 12.5px;
      font-weight: 500;
      border-radius: 3px;
      border: none;
      background: transparent;
      color: #949ba4;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: all 0.12s ease;
      user-select: none;
    }

    .dshrink-segment-btn:hover {
      color: #dbdee1;
      background: rgba(255, 255, 255, 0.05);
    }

    .dshrink-segment-btn.active {
      background: #35373c;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
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
      font-size: 12.5px;
      font-weight: 600;
    }

    .dshrink-progress-status {
      color: #dbdee1;
    }

    .dshrink-progress-pct {
      color: #5865f2;
      font-weight: 700;
    }

    .dshrink-progress-track {
      width: 100%;
      height: 6px;
      background: #1e1f22;
      border-radius: 3px;
      overflow: hidden;
    }

    .dshrink-progress-bar {
      width: 0%;
      height: 100%;
      background: #5865f2;
      border-radius: 3px;
      transition: width 0.15s ease;
    }

    .dshrink-progress-subtext {
      font-size: 11.5px;
      color: #949ba4;
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
    let selectedClip = 60; // default 60s
    let selectedSize = 19.0;
    let selectedRes = "720";
    let videoDuration = 0;

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
            <p>Fits Discord's 20MB limit without Nitro</p>
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
            <div class="dshrink-group" id="dshrink-clip-group" style="display: none;">
              <label class="dshrink-label">Clip Duration</label>
              <div class="dshrink-segment-group" id="dshrink-clip-segments">
                <button type="button" class="dshrink-segment-btn active" data-val="60">60s Clip</button>
                <button type="button" class="dshrink-segment-btn" data-val="30">30s Clip</button>
                <button type="button" class="dshrink-segment-btn" data-val="120">2 Mins</button>
                <button type="button" class="dshrink-segment-btn" data-val="full">Full Video</button>
              </div>
            </div>

            <div class="dshrink-group">
              <label class="dshrink-label">Target File Size</label>
              <div class="dshrink-segment-group" id="dshrink-size-segments">
                <button type="button" class="dshrink-segment-btn active" data-val="19.0">19 MB (Discord)</button>
                <button type="button" class="dshrink-segment-btn" data-val="15.0">15 MB (Mobile)</button>
                <button type="button" class="dshrink-segment-btn" data-val="8.0">8 MB (Legacy)</button>
              </div>
            </div>

            <div class="dshrink-group">
              <label class="dshrink-label">Quality</label>
              <div class="dshrink-segment-group" id="dshrink-res-segments">
                <button type="button" class="dshrink-segment-btn active" data-val="720">720p HD</button>
                <button type="button" class="dshrink-segment-btn" data-val="480">480p SD</button>
                <button type="button" class="dshrink-segment-btn" data-val="original">Source</button>
              </div>
            </div>
          </div>

          <div class="dshrink-progress-card" id="dshrink-progress-card">
            <div class="dshrink-progress-header">
              <span class="dshrink-progress-status" id="dshrink-status-text">Encoding video...</span>
              <span class="dshrink-progress-pct" id="dshrink-percentage">0%</span>
            </div>
            <div class="dshrink-progress-track">
              <div class="dshrink-progress-bar" id="dshrink-progress-bar"></div>
            </div>
            <span class="dshrink-progress-subtext" id="dshrink-progress-subtext">Optimizing frames at high speed...</span>
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
    const subtextEl = shadow.getElementById("dshrink-progress-subtext");
    const durationPill = shadow.getElementById("dshrink-duration-pill");
    const warnContainer = shadow.getElementById("dshrink-warn-container");
    const clipGroup = shadow.getElementById("dshrink-clip-group");

    // Segment helper
    function setupSegments(containerId, onSelect) {
      const parent = shadow.getElementById(containerId);
      const buttons = parent.querySelectorAll(".dshrink-segment-btn");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          onSelect(btn.getAttribute("data-val"));
        });
      });
    }

    setupSegments("dshrink-clip-segments", (val) => {
      selectedClip = val === "full" ? "full" : parseFloat(val);
    });

    setupSegments("dshrink-size-segments", (val) => {
      selectedSize = parseFloat(val);
    });

    setupSegments("dshrink-res-segments", (val) => {
      selectedRes = val;
    });

    // Probe duration
    const probeVideo = document.createElement("video");
    probeVideo.preload = "metadata";
    probeVideo.muted = true;
    const probeUrl = URL.createObjectURL(originalFile);
    probeVideo.src = probeUrl;

    probeVideo.onloadedmetadata = () => {
      videoDuration = probeVideo.duration || 0;
      durationPill.textContent = formatDuration(videoDuration);
      URL.revokeObjectURL(probeUrl);

      // If video is longer than 2 minutes, show clip selector by default
      if (videoDuration > 120) {
        clipGroup.style.display = "flex";
        selectedClip = 60; // 60s clip by default
        warnContainer.style.display = "block";
        warnContainer.innerHTML = `
          <div class="dshrink-notice">
            Long video detected (${formatDuration(videoDuration)}). Clipping to 60s is selected for fast encoding.
          </div>
        `;
      } else {
        selectedClip = videoDuration;
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

    const keyHandler = (e) => {
      if (e.key === "Escape") {
        cancelAndClose();
        window.removeEventListener("keydown", keyHandler);
      }
    };
    window.addEventListener("keydown", keyHandler);

    startBtn.addEventListener("click", function () {
      let maxDuration = 60;
      if (videoDuration > 0) {
        if (selectedClip === "full") {
          maxDuration = videoDuration;
        } else {
          maxDuration = Math.min(parseFloat(selectedClip), videoDuration);
        }
      } else {
        maxDuration = 60;
      }

      optionsArea.style.display = "none";
      warnContainer.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;
      cancelBtn.textContent = "Cancel";

      cleanupFn = compressVideo(originalFile, selectedSize, selectedRes, maxDuration, {
        onProgress: (percent, status, subtext) => {
          if (isAborted) return;
          progressBar.style.width = percent + "%";
          percentageText.textContent = Math.round(percent) + "%";
          if (status) statusText.textContent = status;
          if (subtext) subtextEl.textContent = subtext;
        },
        onComplete: (compressedBlob) => {
          if (isAborted) return;
          progressBar.style.width = "100%";
          percentageText.textContent = "100%";
          statusText.textContent = `Attached ${formatBytes(compressedBlob.size)} to Discord`;
          subtextEl.textContent = "Completed successfully";

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
    callbacks.onProgress(5, "Analyzing video stream...", "Preparing encoder...");

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

      const targetBytes = targetMB * 1024 * 1024 * 0.95;
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / targetDuration);
      let videoBitrate = Math.max(180000, totalBitrate - 96000);

      callbacks.onProgress(15, `Encoding video...`, `Target: ${width}x${height} • Limit: ${targetMB} MB`);

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
          callbacks.onProgress(98, "Finalizing file...", "Attaching to Discord...");
          recorder.stop();
          return;
        }

        ctx.drawImage(videoEl, 0, 0, width, height);

        const currentProgress = 15 + (videoEl.currentTime / targetDuration) * 80;
        const currentSec = Math.floor(videoEl.currentTime);
        const totalSec = Math.floor(targetDuration);
        const remaining = Math.max(0, Math.round((totalSec - currentSec) / 4));

        callbacks.onProgress(
          currentProgress,
          `Encoding: ${currentSec}s / ${totalSec}s`,
          `Running at 4x speed • ~${remaining}s remaining`
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
