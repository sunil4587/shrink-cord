// DiscordShrink - Content Script (Native Discord Nitro Modal Design 1:1)

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
      background-color: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      animation: dshrink-fade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Exact Discord Nitro Modal Styling */
    .dshrink-modal {
      position: relative;
      background: radial-gradient(ellipse 100% 80% at 50% -10%, #351c4e 0%, #202225 65%, #1e1f22 100%);
      color: #dbdee1;
      width: 480px;
      max-width: 92vw;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
      padding: 28px 24px 22px 24px;
    }

    /* Circular Rounded Close Button */
    .dshrink-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #dbdee1;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 20;
    }

    .dshrink-close-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      transform: scale(1.06);
    }

    .dshrink-close-btn:active {
      transform: scale(0.92);
    }

    .dshrink-close-btn svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Hero Center Section */
    .dshrink-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }

    .dshrink-hero-art {
      width: 140px;
      height: 95px;
      margin-bottom: 12px;
      filter: drop-shadow(0 10px 20px rgba(235, 69, 158, 0.35));
    }

    .dshrink-badge {
      background: #ffffff;
      color: #1e1f22;
      font-size: 10.5px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      margin-bottom: 8px;
    }

    .dshrink-title {
      font-size: 21px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.2px;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .dshrink-subtitle {
      font-size: 13.5px;
      color: #b5bac1;
      line-height: 1.45;
      max-width: 380px;
    }

    /* File Information Card */
    .dshrink-file-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .dshrink-thumb-box {
      width: 44px;
      height: 34px;
      background: #1e1f22;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .dshrink-thumb-box canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .dshrink-file-icon {
      width: 18px;
      height: 18px;
      stroke: #5865f2;
    }

    .dshrink-file-details {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    .dshrink-filename {
      font-size: 13.5px;
      font-weight: 600;
      color: #f2f3f5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dshrink-file-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #949ba4;
    }

    .dshrink-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .dshrink-meta-item svg {
      width: 12px;
      height: 12px;
      stroke: #949ba4;
    }

    .dshrink-meta-dot {
      color: #4e5058;
    }

    .dshrink-size-val {
      color: #dbdee1;
      font-weight: 600;
    }

    /* Options Section */
    .dshrink-options-area {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
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
      letter-spacing: 0.5px;
      color: #b5bac1;
    }

    .dshrink-segment-group {
      display: flex;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 6px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .dshrink-segment-btn {
      flex: 1;
      padding: 7px 6px;
      font-size: 12.5px;
      font-weight: 500;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: #949ba4;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    .dshrink-segment-btn:hover {
      color: #f2f3f5;
      background: rgba(255, 255, 255, 0.05);
    }

    .dshrink-segment-btn.active {
      background: #35373c;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .dshrink-notice {
      background: rgba(240, 178, 50, 0.1);
      border-left: 3px solid #f0b232;
      border-radius: 0 4px 4px 0;
      padding: 8px 12px;
      font-size: 12px;
      color: #dbdee1;
      line-height: 16px;
      margin-bottom: 12px;
    }

    /* Progress Card */
    .dshrink-progress-card {
      display: none;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .dshrink-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
    }

    .dshrink-progress-status {
      color: #f2f3f5;
    }

    .dshrink-progress-pct {
      color: #5865f2;
      font-weight: 700;
      font-size: 13.5px;
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
      background: linear-gradient(90deg, #5865f2, #eb459e);
      border-radius: 3px;
      box-shadow: 0 0 10px rgba(235, 69, 158, 0.5);
      transition: width 0.15s ease;
    }

    .dshrink-progress-subtext {
      font-size: 12px;
      color: #949ba4;
    }

    /* Exact Nitro Modal Buttons */
    .dshrink-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dshrink-btn-cancel {
      flex: 1;
      background: #35373c;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      height: 44px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease;
    }

    .dshrink-btn-cancel:hover {
      background: #404249;
    }

    /* Glowing Hero Button */
    .dshrink-btn-primary {
      flex: 1.25;
      background: #ffffff;
      color: #060607;
      font-size: 14px;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      height: 44px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 0 16px rgba(88, 101, 242, 0.6), 0 0 24px rgba(235, 69, 158, 0.4);
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dshrink-btn-primary:hover {
      box-shadow: 0 0 22px rgba(88, 101, 242, 0.8), 0 0 32px rgba(235, 69, 158, 0.65);
      transform: translateY(-1px);
    }

    .dshrink-btn-primary:active {
      transform: translateY(0);
    }

    .dshrink-btn-primary:disabled {
      background: #35373c !important;
      color: #80848e !important;
      box-shadow: none !important;
      cursor: not-allowed;
      transform: none !important;
    }

    @keyframes dshrink-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dshrink-scale {
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
    return /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v|3gp|m4p|mpg|mpeg)$/i.test(name);
  }

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
        if (isVideoFile(file) && file.size > DISCORD_LIMIT_BYTES) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (e.target && e.target.type === "file") {
            try { e.target.value = ""; } catch (err) {}
          }
          openShrinkModal(file);
          return true;
        }
      }
    }
    return false;
  }

  // Intercept at both window and document levels with capture phase & stopImmediatePropagation
  [window, document].forEach((target) => {
    target.addEventListener("drop", interceptEvent, { capture: true, passive: false });
    target.addEventListener("paste", interceptEvent, { capture: true, passive: false });
    target.addEventListener("change", interceptEvent, { capture: true, passive: false });
    target.addEventListener("dragover", (e) => {
      e.preventDefault();
    }, { capture: true, passive: false });
    target.addEventListener("dragenter", (e) => {
      e.preventDefault();
    }, { capture: true, passive: false });
  });

  // Automated Nitro Paywall Shield
  const nitroShield = new MutationObserver(() => {
    const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal-"], [class*="layer-"]');
    dialogs.forEach((dialog) => {
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

  function openShrinkModal(originalFile) {
    if (activeModalHost) {
      activeModalHost.remove();
      activeModalHost = null;
    }

    let isAborted = false;
    let cleanupFn = null;
    let selectedClip = "full";
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
        <button class="dshrink-close-btn" id="dshrink-close-x" aria-label="Close" title="Close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>

        <div class="dshrink-hero">
          <!-- 3D Nitro-Style Glowing Folder Graphic -->
          <svg class="dshrink-hero-art" viewBox="0 0 200 130">
            <defs>
              <linearGradient id="nitro-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5865F2" />
                <stop offset="50%" stop-color="#eb459e" />
                <stop offset="100%" stop-color="#00d4ff" />
              </linearGradient>
              <linearGradient id="cloud-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a855f7" />
                <stop offset="100%" stop-color="#ec4899" />
              </linearGradient>
            </defs>
            <polygon points="50,45 130,10 160,35 90,75" fill="#2c1f4a" opacity="0.85" />
            <polygon points="70,30 145,5 125,100 50,115" fill="#1e1533" stroke="url(#nitro-g1)" stroke-width="2.5" />
            <polygon points="75,34 140,12 122,95 57,108" fill="url(#nitro-g1)" opacity="0.9" />
            <polygon points="98,38 114,32 108,55 116,52 95,85 98,62 90,65" fill="#ffffff" />
            <polygon points="40,95 115,80 135,115 60,125" fill="#2b1a4a" opacity="0.8" />
            <ellipse cx="60" cy="100" rx="30" ry="12" fill="url(#cloud-g)" opacity="0.6" />
            <ellipse cx="140" cy="85" rx="26" ry="10" fill="url(#cloud-g)" opacity="0.5" />
            <ellipse cx="110" cy="110" rx="35" ry="14" fill="#a855f7" opacity="0.7" />
          </svg>

          <span class="dshrink-badge">AUTO-SHRINK</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">The max file size is 20MB. Compress locally to send directly in chat.</p>
        </div>
        
        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            <svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 8-6 4 6 4V8Z"/>
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
          </div>
          <div class="dshrink-file-details">
            <span class="dshrink-filename" title="${originalFile.name}">${originalFile.name}</span>
            <div class="dshrink-file-meta">
              <span class="dshrink-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span id="dshrink-duration-val">Reading length...</span>
              </span>
              <span class="dshrink-meta-dot">•</span>
              <span class="dshrink-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <strong class="dshrink-size-val">${formatBytes(originalFile.size)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div id="dshrink-warn-container" style="display: none;"></div>

        <div class="dshrink-options-area" id="dshrink-options-area">
          <div class="dshrink-group" id="dshrink-clip-group" style="display: none;">
            <label class="dshrink-label">Clip Duration</label>
            <div class="dshrink-segment-group" id="dshrink-clip-segments">
              <button type="button" class="dshrink-segment-btn active" data-val="60">60s Clip</button>
              <button type="button" class="dshrink-segment-btn" data-val="30">30s Clip</button>
              <button type="button" class="dshrink-segment-btn" data-val="120">2 Mins</button>
              <button type="button" class="dshrink-segment-btn" data-val="full" id="dshrink-full-btn">Full Video</button>
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
          <span class="dshrink-progress-subtext" id="dshrink-progress-subtext">Optimizing frames and audio...</span>
        </div>

        <div class="dshrink-footer">
          <button class="dshrink-btn-cancel" id="dshrink-cancel-btn">Cancel</button>
          <button class="dshrink-btn-primary" id="dshrink-start-btn">
            <span>⚡ Compress & Attach</span>
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
    const durationVal = shadow.getElementById("dshrink-duration-val");
    const thumbBox = shadow.getElementById("dshrink-thumb-box");
    const warnContainer = shadow.getElementById("dshrink-warn-container");
    const clipGroup = shadow.getElementById("dshrink-clip-group");
    const fullBtn = shadow.getElementById("dshrink-full-btn");

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

    // Probe duration and capture live thumbnail
    const probeVideo = document.createElement("video");
    probeVideo.preload = "auto";
    probeVideo.muted = true;
    probeVideo.playsInline = true;
    const probeUrl = URL.createObjectURL(originalFile);
    probeVideo.src = probeUrl;

    probeVideo.onloadedmetadata = () => {
      videoDuration = probeVideo.duration || 0;
      const formatted = formatDuration(videoDuration);
      durationVal.textContent = `Length: ${formatted}`;

      if (fullBtn) {
        fullBtn.textContent = `Full (${formatted})`;
      }

      // If video is longer than 2 minutes, show clip options and default to 60s
      if (videoDuration > 120) {
        clipGroup.style.display = "flex";
        selectedClip = 60; // default 60s clip for long videos
        warnContainer.style.display = "block";
        warnContainer.innerHTML = `
          <div class="dshrink-notice">
            Long video detected (${formatted}). 60s clip is pre-selected for fast compression.
          </div>
        `;
      } else {
        selectedClip = "full"; // for short videos (e.g. 30s), keep full video!
      }

      // Capture a thumbnail from the video
      try {
        probeVideo.currentTime = Math.min(1.0, videoDuration * 0.1);
        probeVideo.onseeked = () => {
          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = 48;
          thumbCanvas.height = 36;
          const ctx = thumbCanvas.getContext("2d");
          ctx.drawImage(probeVideo, 0, 0, 48, 36);
          thumbBox.innerHTML = "";
          thumbBox.appendChild(thumbCanvas);
          URL.revokeObjectURL(probeUrl);
        };
      } catch (e) {
        URL.revokeObjectURL(probeUrl);
      }
    };

    probeVideo.onerror = () => {
      durationVal.textContent = "Length: Video";
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
          subtextEl.textContent = "Audio and video ready";

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
    callbacks.onProgress(5, "Preparing video & audio stream...", "Initializing audio pipeline...");

    const videoEl = document.createElement("video");
    videoEl.preload = "auto";
    videoEl.crossOrigin = "anonymous";
    videoEl.playsInline = true;
    videoEl.muted = false;
    videoEl.volume = 1.0;
    const fileUrl = URL.createObjectURL(file);
    videoEl.src = fileUrl;

    let isStopped = false;
    let recorder = null;
    let audioCtx = null;
    let audioTrack = null;
    let combinedStream = null;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        const sourceNode = audioCtx.createMediaElementSource(videoEl);
        const destNode = audioCtx.createMediaStreamDestination();
        sourceNode.connect(destNode);
        const tracks = destNode.stream.getAudioTracks();
        if (tracks && tracks.length > 0) {
          audioTrack = tracks[0];
        }
      }
    } catch (err) {
      console.warn("Audio extraction fallback:", err);
    }

    function cleanup() {
      isStopped = true;
      try {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (e) {}
      try {
        if (audioCtx && audioCtx.state !== "closed") {
          audioCtx.close();
        }
      } catch (e) {}
      try {
        if (combinedStream) {
          combinedStream.getTracks().forEach((t) => t.stop());
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

      const targetBytes = targetMB * 1024 * 1024 * 0.93;
      const totalBits = targetBytes * 8;
      const totalBitrate = Math.floor(totalBits / targetDuration);
      const audioBitrate = audioTrack ? 128000 : 0;
      let videoBitrate = Math.max(250000, totalBitrate - audioBitrate);

      callbacks.onProgress(10, `Optimizing media streams...`, `Encoding ${width}x${height} with stereo audio`);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      const canvasStream = canvas.captureStream(30);

      const outputTracks = [canvasStream.getVideoTracks()[0]];
      if (audioTrack) {
        outputTracks.push(audioTrack);
      }
      combinedStream = new MediaStream(outputTracks);

      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType: mimeType,
          videoBitsPerSecond: videoBitrate,
          audioBitsPerSecond: 128000
        });
      } catch (e) {
        recorder = new MediaRecorder(combinedStream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      let isCompleted = false;

      function emitComplete() {
        if (isCompleted || isStopped) return;
        isCompleted = true;
        cleanup();
        const finalBlob = new Blob(chunks, { type: "video/webm" });
        callbacks.onComplete(finalBlob);
      }

      recorder.onstop = () => {
        emitComplete();
      };

      recorder.start(100);

      videoEl.playbackRate = 1.0;
      videoEl.currentTime = 0;
      
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video play error:", err);
        });
      }

      let isFinished = false;

      function finishEncoding() {
        if (isFinished) return;
        isFinished = true;
        callbacks.onProgress(98, "Finalizing compressed video...", "Attaching to Discord...");

        // 1. Force a final canvas frame tick so captureStream does not freeze in Chromium
        try {
          ctx.drawImage(videoEl, 0, 0, width, height);
        } catch (e) {}

        // 2. Request data to flush any remaining buffer
        try {
          if (recorder && recorder.state === "recording") {
            recorder.requestData();
          }
        } catch (e) {}

        // 3. Stop recorder cleanly
        try {
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch (e) {}

        // 4. Stop all combinedStream tracks to signal EOF to browser encoder
        try {
          if (combinedStream) {
            combinedStream.getTracks().forEach((track) => track.stop());
          }
        } catch (e) {}

        // 5. Zero-Hang Failsafe: If Chromium's onstop lags past 400ms, force emitComplete immediately!
        setTimeout(() => {
          if (!isCompleted) {
            emitComplete();
          }
        }, 400);
      }

      function drawFrame() {
        if (isStopped || isFinished) return;

        // Check if finished
        if (videoEl.ended || videoEl.currentTime >= targetDuration) {
          finishEncoding();
          return;
        }

        ctx.drawImage(videoEl, 0, 0, width, height);

        const currentSec = videoEl.currentTime;
        const currentProgress = 10 + (currentSec / targetDuration) * 88;
        const remainingSec = Math.max(0, Math.ceil(targetDuration - currentSec));

        callbacks.onProgress(
          currentProgress,
          `Encoding: ${Math.floor(currentSec)}s / ${Math.floor(targetDuration)}s`,
          audioTrack 
            ? `HD video & audio in sync • ~${remainingSec}s left` 
            : `HD video • ~${remainingSec}s left`
        );

        requestAnimationFrame(drawFrame);
      }

      videoEl.onplay = () => requestAnimationFrame(drawFrame);
      videoEl.onended = () => finishEncoding();
    };

    videoEl.onerror = () => {
      cleanup();
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
