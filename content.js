// DiscordShrink - Content Script (Native Discord Nitro Design + Video & Audio Support)

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024; // 19 MB (Safety margin below 20MB)
  let activeModalHost = null;

  const LOGO_DATA_URL = 'data:image/png;base64,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';

  console.log("%cDiscordShrink Active (Video + Audio)", "color: #5865F2; font-weight: bold;");

  const MODAL_CSS = `
    :host {
      all: initial;
      font-family: "gg sans", "Noto Sans", "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
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
      color: #b5bac1;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 20;
      padding: 0;
    }

    .dshrink-close-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .dshrink-close-btn:active {
      transform: scale(0.95);
    }

    .dshrink-close-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      display: block;
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

    .dshrink-hero-glow-wrap {
      position: relative;
      width: 88px;
      height: 88px;
      margin: 0 auto 12px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dshrink-hero-glow {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(138, 92, 246, 0.5) 0%, rgba(235, 69, 158, 0.25) 50%, transparent 70%);
      filter: blur(14px);
      animation: dshrink-glow-pulse 3s ease-in-out infinite alternate;
    }

    @keyframes dshrink-glow-pulse {
      0% { transform: scale(0.9); opacity: 0.6; }
      100% { transform: scale(1.15); opacity: 1; }
    }

    .dshrink-hero-logo {
      position: relative;
      width: 80px;
      height: 80px;
      object-fit: contain;
      filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5));
      z-index: 2;
      animation: dshrink-float 3.5s ease-in-out infinite alternate;
    }

    @keyframes dshrink-float {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-4px); }
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
      background: #1e1f22;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .dshrink-segment-btn {
      flex: 1;
      padding: 8px 6px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.01em;
      border-radius: 6px;
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
      color: #dbdee1;
      background: rgba(255, 255, 255, 0.04);
    }

    .dshrink-segment-btn.active {
      background: #35373c;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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
      flex: 0.9;
      background: #35373c;
      color: #ffffff;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.01em;
      border: none;
      border-radius: 8px;
      height: 44px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease;
      user-select: none;
    }

    .dshrink-btn-cancel:hover {
      background: #404249;
    }

    /* Glowing Hero Button */
    .dshrink-btn-primary {
      flex: 1.25;
      background: #ffffff;
      color: #060607;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
      border: none;
      border-radius: 8px;
      height: 44px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 0 16px rgba(88, 101, 242, 0.5), 0 0 26px rgba(235, 69, 158, 0.35);
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    .dshrink-btn-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      fill: #060607;
      display: block;
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

  function isAudioFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("audio/")) return true;
    const name = file.name ? file.name.toLowerCase() : "";
    return /\.(mp3|wav|flac|m4a|aac|ogg|opus|wma|aiff|alac|oga)$/i.test(name);
  }

  function isMediaFile(file) {
    return isVideoFile(file) || isAudioFile(file);
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
        if (isMediaFile(file) && file.size > DISCORD_LIMIT_BYTES) {
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

    const isAudio = isAudioFile(originalFile);
    let isAborted = false;
    let cleanupFn = null;
    let selectedClip = "full";
    let selectedSize = 19.0;
    let selectedRes = isAudio ? "32000" : "720";
    let mediaDuration = 0;

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
          <div class="dshrink-hero-glow-wrap">
            <div class="dshrink-hero-glow"></div>
            <img class="dshrink-hero-logo" src="${LOGO_DATA_URL}" alt="DiscordShrink" />
          </div>

          <span class="dshrink-badge">${isAudio ? "AUDIO AUTO-SHRINK" : "AUTO-SHRINK"}</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">The max file size is 20MB. Compress locally to send directly in chat.</p>
        </div>
        
        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            ${isAudio ? `
              <svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            ` : `
              <svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/>
                <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
              </svg>
            `}
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
          ${!isAudio ? `
            <div class="dshrink-group" id="dshrink-clip-group" style="display: none;">
              <label class="dshrink-label">Clip Duration</label>
              <div class="dshrink-segment-group" id="dshrink-clip-segments">
                <button type="button" class="dshrink-segment-btn active" data-val="60">60s Clip</button>
                <button type="button" class="dshrink-segment-btn" data-val="30">30s Clip</button>
                <button type="button" class="dshrink-segment-btn" data-val="120">2 Mins</button>
                <button type="button" class="dshrink-segment-btn" data-val="full" id="dshrink-full-btn">Full Video</button>
              </div>
            </div>
          ` : ""}

          <div class="dshrink-group">
            <label class="dshrink-label">Target File Size</label>
            <div class="dshrink-segment-group" id="dshrink-size-segments">
              <button type="button" class="dshrink-segment-btn active" data-val="19.0">19 MB (Discord)</button>
              <button type="button" class="dshrink-segment-btn" data-val="15.0">15 MB (Mobile)</button>
              <button type="button" class="dshrink-segment-btn" data-val="8.0">8 MB (Legacy)</button>
            </div>
          </div>

          <div class="dshrink-group">
            <label class="dshrink-label">${isAudio ? "Audio Quality" : "Video Quality"}</label>
            <div class="dshrink-segment-group" id="dshrink-res-segments">
              ${isAudio ? `
                <button type="button" class="dshrink-segment-btn active" data-val="32000">Studio (32kHz)</button>
                <button type="button" class="dshrink-segment-btn" data-val="22050">High (22kHz)</button>
                <button type="button" class="dshrink-segment-btn" data-val="voice">Voice (Mono)</button>
              ` : `
                <button type="button" class="dshrink-segment-btn active" data-val="720">720p HD</button>
                <button type="button" class="dshrink-segment-btn" data-val="480">480p SD</button>
                <button type="button" class="dshrink-segment-btn" data-val="original">Source</button>
              `}
            </div>
          </div>
        </div>

        <div class="dshrink-progress-card" id="dshrink-progress-card">
          <div class="dshrink-progress-header">
            <span class="dshrink-progress-status" id="dshrink-status-text">Encoding media...</span>
            <span class="dshrink-progress-pct" id="dshrink-percentage">0%</span>
          </div>
          <div class="dshrink-progress-track">
            <div class="dshrink-progress-bar" id="dshrink-progress-bar"></div>
          </div>
          <span class="dshrink-progress-subtext" id="dshrink-progress-subtext">Optimizing media stream...</span>
        </div>

        <div class="dshrink-footer">
          <button class="dshrink-btn-cancel" id="dshrink-cancel-btn">Cancel</button>
          <button class="dshrink-btn-primary" id="dshrink-start-btn">
            <svg class="dshrink-btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-2 8 11-13h-8l3-7z"/>
            </svg>
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
    const durationVal = shadow.getElementById("dshrink-duration-val");
    const thumbBox = shadow.getElementById("dshrink-thumb-box");
    const warnContainer = shadow.getElementById("dshrink-warn-container");
    const clipGroup = shadow.getElementById("dshrink-clip-group");
    const fullBtn = shadow.getElementById("dshrink-full-btn");

    function setupSegments(containerId, onSelect) {
      const parent = shadow.getElementById(containerId);
      if (!parent) return;
      const buttons = parent.querySelectorAll(".dshrink-segment-btn");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          onSelect(btn.getAttribute("data-val"));
        });
      });
    }

    if (!isAudio) {
      setupSegments("dshrink-clip-segments", (val) => {
        selectedClip = val === "full" ? "full" : parseFloat(val);
      });
    }

    setupSegments("dshrink-size-segments", (val) => {
      selectedSize = parseFloat(val);
    });

    setupSegments("dshrink-res-segments", (val) => {
      selectedRes = val;
    });

    // Probe duration
    const probeEl = document.createElement(isAudio ? "audio" : "video");
    probeEl.preload = "auto";
    probeEl.muted = true;
    const probeUrl = URL.createObjectURL(originalFile);
    probeEl.src = probeUrl;

    probeEl.onloadedmetadata = () => {
      mediaDuration = probeEl.duration || 0;
      const formatted = formatDuration(mediaDuration);
      durationVal.textContent = `Length: ${formatted}`;

      if (fullBtn) {
        fullBtn.textContent = `Full (${formatted})`;
      }

      if (!isAudio) {
        if (mediaDuration > 120) {
          if (clipGroup) clipGroup.style.display = "flex";
          selectedClip = 60;
          warnContainer.style.display = "block";
          warnContainer.innerHTML = `
            <div class="dshrink-notice">
              Long video detected (${formatted}). 60s clip is pre-selected for fast compression.
            </div>
          `;
        } else {
          selectedClip = "full";
        }

        try {
          probeEl.currentTime = Math.min(1.0, mediaDuration * 0.1);
          probeEl.onseeked = () => {
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = 48;
            thumbCanvas.height = 36;
            const ctx = thumbCanvas.getContext("2d");
            ctx.drawImage(probeEl, 0, 0, 48, 36);
            thumbBox.innerHTML = "";
            thumbBox.appendChild(thumbCanvas);
            URL.revokeObjectURL(probeUrl);
          };
        } catch (e) {
          URL.revokeObjectURL(probeUrl);
        }
      } else {
        URL.revokeObjectURL(probeUrl);
      }
    };

    probeEl.onerror = () => {
      durationVal.textContent = isAudio ? "Length: Audio" : "Length: Video";
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
      optionsArea.style.display = "none";
      warnContainer.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;
      cancelBtn.textContent = "Cancel";

      const commonCallbacks = {
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
          subtextEl.textContent = isAudio ? "Audio ready" : "Audio and video ready";

          setTimeout(() => {
            if (!isAborted) {
              attachToDiscord(compressedBlob, originalFile.name, isAudio);
              cancelAndClose();
            }
          }, 350);
        },
        onError: (err) => {
          if (isAborted) return;
          statusText.textContent = "Error: " + err.message;
          startBtn.disabled = false;
        }
      };

      if (isAudio) {
        let maxDuration = 0;
        if (mediaDuration > 0 && selectedClip !== "full") {
          maxDuration = Math.min(parseFloat(selectedClip), mediaDuration);
        }
        cleanupFn = compressAudio(originalFile, selectedSize, selectedRes, maxDuration, commonCallbacks);
      } else {
        let maxDuration = 60;
        if (mediaDuration > 0) {
          if (selectedClip === "full") {
            maxDuration = mediaDuration;
          } else {
            maxDuration = Math.min(parseFloat(selectedClip), mediaDuration);
          }
        } else {
          maxDuration = 60;
        }
        cleanupFn = compressVideo(originalFile, selectedSize, selectedRes, maxDuration, commonCallbacks);
      }
    });
  }

  // Fast Sub-Second Audio Compression via Web Audio API + Offline Resampler
  function compressAudio(file, targetMB, qualitySetting, maxDuration, callbacks) {
    let isStopped = false;

    callbacks.onProgress(15, "Decoding audio file...", "Reading audio samples...");

    file.arrayBuffer().then(async (arrayBuffer) => {
      if (isStopped) return;

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close();

        if (isStopped) return;

        callbacks.onProgress(45, "Resampling audio...", "Optimizing sample rate to fit 19MB...");

        const totalDuration = decodedBuffer.duration;
        let duration = (maxDuration && maxDuration > 0 && maxDuration < totalDuration) ? maxDuration : totalDuration;
        const targetBytes = targetMB * 1024 * 1024 * 0.92;

        let channels = qualitySetting === "voice" ? 1 : Math.min(2, decodedBuffer.numberOfChannels);
        let sampleRate = 32000;
        if (qualitySetting === "voice" || qualitySetting === "22050") {
          sampleRate = 22050;
        } else if (qualitySetting === "32000") {
          sampleRate = 32000;
        }

        // Guarantee output size strictly under targetBytes using standard sample rates
        const standardRates = [44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000];
        if (duration * sampleRate * channels * 2 > targetBytes) {
          if (duration * 8000 * channels * 2 > targetBytes && channels > 1) {
            channels = 1;
          }
          let chosenRate = 8000;
          for (const rate of standardRates) {
            if (duration * rate * channels * 2 <= targetBytes) {
              chosenRate = rate;
              break;
            }
          }
          sampleRate = chosenRate;

          // If even 8000Hz mono exceeds targetBytes, cap the rendered duration to fit target
          if (duration * sampleRate * channels * 2 > targetBytes) {
            duration = Math.floor(targetBytes / (sampleRate * channels * 2));
          }
        }

        // Resample in ~100ms with OfflineAudioContext
        const offlineCtx = new OfflineAudioContext(
          channels,
          Math.ceil(duration * sampleRate),
          sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();

        if (isStopped) return;

        callbacks.onProgress(85, "Encoding audio...", "Generating Discord-ready audio...");

        // Generate pristine 16-bit WAV PCM Blob
        const wavBlob = audioBufferToWavBlob(renderedBuffer);

        callbacks.onProgress(100, "Audio ready!", "Attaching to Discord...");
        callbacks.onComplete(wavBlob);
      } catch (err) {
        callbacks.onError(new Error("Audio decoding failed: " + err.message));
      }
    }).catch((err) => {
      callbacks.onError(new Error("Unable to read audio file: " + err.message));
    });

    return function cleanup() {
      isStopped = true;
    };
  }

  // Pure Vanilla WAV PCM 16-bit Encoder (0.02s execution)
  function audioBufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numFrames = buffer.length;
    const dataSize = numFrames * blockAlign;
    const bufferLength = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < numFrames; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
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

        try {
          ctx.drawImage(videoEl, 0, 0, width, height);
        } catch (e) {}

        try {
          if (recorder && recorder.state === "recording") {
            recorder.requestData();
          }
        } catch (e) {}

        try {
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch (e) {}

        try {
          if (combinedStream) {
            combinedStream.getTracks().forEach((track) => track.stop());
          }
        } catch (e) {}

        setTimeout(() => {
          if (!isCompleted) {
            emitComplete();
          }
        }, 400);
      }

      function drawFrame() {
        if (isStopped || isFinished) return;

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
})();
