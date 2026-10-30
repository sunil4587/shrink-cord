/**
 * DiscordShrink - Modern Native Discord UI Component
 * 1:1 Discord Dark Theme modal matching Discord's official design system.
 */

(function () {
  "use strict";

  const LOGO_URL = chrome.runtime.getURL("icons/logo.png");
  const STYLE_ID = "dshrink-modal-styles";

  // Official Discord & Custom Vector Icons
  const ICONS = {
    zap: `<svg class="dshrink-btn-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    file: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 1.5L18.5 8H14zM6 20V4h6v6h6v10z"/></svg>`,
    audio: `<svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    video: `<svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`
  };

  const MODAL_CSS = `
    #dshrink-modal-root {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
      font-family: var(--font-primary, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    #dshrink-modal-root *,
    #dshrink-modal-root button,
    #dshrink-modal-root input,
    #dshrink-modal-root span,
    #dshrink-modal-root p,
    #dshrink-modal-root h2,
    #dshrink-modal-root label {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--font-primary, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #dshrink-modal-root .dshrink-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      animation: dshrink-fade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    #dshrink-modal-root .dshrink-modal {
      position: relative;
      background: radial-gradient(ellipse 110% 70% at 50% -10%, #321847 0%, #202225 65%, #1e1f22 100%);
      color: #dbdee1;
      width: 472px;
      max-width: 92vw;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
      padding: 24px 24px 20px 24px;
    }

    #dshrink-modal-root .dshrink-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.38);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #949ba4;
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

    #dshrink-modal-root .dshrink-close-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    #dshrink-modal-root .dshrink-close-btn:active {
      transform: scale(0.95);
    }

    #dshrink-modal-root .dshrink-close-btn svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
      display: block;
    }

    /* Pre-Start Hero State */
    #dshrink-modal-root .dshrink-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }

    #dshrink-modal-root .dshrink-hero-logo-box {
      position: relative;
      width: 108px;
      height: 82px;
      margin: 0 auto 12px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-hero-logo-box::before {
      content: "";
      position: absolute;
      inset: -16px -22px;
      background: radial-gradient(ellipse 70% 70% at 50% 50%, rgba(168, 85, 247, 0.45) 0%, rgba(88, 101, 242, 0.22) 55%, transparent 75%);
      border-radius: 50%;
      pointer-events: none;
      filter: blur(12px);
    }

    #dshrink-modal-root .dshrink-hero-logo {
      position: relative;
      width: 104px;
      height: 76px;
      object-fit: contain;
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.5));
    }

    #dshrink-modal-root .dshrink-badge {
      display: inline-block;
      background: #ffffff;
      color: #111214;
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 12px;
      border-radius: 999px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      margin-bottom: 10px;
    }

    #dshrink-modal-root .dshrink-title {
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 8px;
      text-align: center;
    }

    #dshrink-modal-root .dshrink-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: #949ba4;
      line-height: 1.45;
      max-width: 400px;
      text-align: center;
    }

    /* Encoding/Progress Header State */
    #dshrink-modal-root .dshrink-hero-progress {
      display: none;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      margin-bottom: 16px;
      width: 100%;
    }

    #dshrink-modal-root .dshrink-progress-title {
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }

    #dshrink-modal-root .dshrink-progress-subtitle {
      font-size: 13.5px;
      color: #949ba4;
    }

    /* Media File Card */
    #dshrink-modal-root .dshrink-file-card {
      background: #232428;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    #dshrink-modal-root .dshrink-thumb-box {
      width: 44px;
      height: 34px;
      background: #1e1f22;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    #dshrink-modal-root .dshrink-thumb-box canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    #dshrink-modal-root .dshrink-file-icon {
      width: 18px;
      height: 18px;
      stroke: #5865f2;
    }

    #dshrink-modal-root .dshrink-file-details {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    #dshrink-modal-root .dshrink-filename {
      font-size: 13.5px;
      font-weight: 600;
      color: #f2f3f5;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #dshrink-modal-root .dshrink-file-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #949ba4;
      font-weight: 500;
    }

    #dshrink-modal-root .dshrink-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    #dshrink-modal-root .dshrink-meta-dot {
      color: #4e5058;
    }

    #dshrink-modal-root .dshrink-size-val {
      color: #dbdee1;
      font-weight: 600;
    }

    #dshrink-modal-root .dshrink-overlimit-badge {
      display: none;
      font-size: 10px;
      font-weight: 700;
      color: #fa777c;
      background: rgba(242, 63, 67, 0.15);
      border: 1px solid rgba(242, 63, 67, 0.35);
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 4px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      vertical-align: middle;
    }

    /* Option Selectors */
    #dshrink-modal-root .dshrink-options-area {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    #dshrink-modal-root .dshrink-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #dshrink-modal-root .dshrink-label {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #b5bac1;
    }

    #dshrink-modal-root .dshrink-segment-group {
      display: flex;
      background: #1e1f22;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    #dshrink-modal-root .dshrink-segment-btn {
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

    #dshrink-modal-root .dshrink-segment-btn:hover {
      color: #dbdee1;
      background: rgba(255, 255, 255, 0.04);
    }

    #dshrink-modal-root .dshrink-segment-btn.active {
      background: #35373c;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    #dshrink-modal-root .dshrink-notice {
      background: rgba(240, 178, 50, 0.1);
      border-left: 3px solid #f0b232;
      border-radius: 0 6px 6px 0;
      padding: 8px 12px;
      font-size: 12px;
      color: #dbdee1;
      line-height: 16px;
      margin-bottom: 12px;
    }

    /* Progress Display */
    #dshrink-modal-root .dshrink-progress-card {
      display: none;
      background: #232428;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    #dshrink-modal-root .dshrink-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
    }

    #dshrink-modal-root .dshrink-progress-status {
      color: #f2f3f5;
      font-weight: 600;
    }

    #dshrink-modal-root .dshrink-progress-pct {
      color: #5865f2;
      font-weight: 700;
      font-size: 13.5px;
    }

    #dshrink-modal-root .dshrink-progress-track {
      width: 100%;
      height: 6px;
      background: #1e1f22;
      border-radius: 3px;
      overflow: hidden;
    }

    #dshrink-modal-root .dshrink-progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #5865f2, #9b59b6);
      border-radius: 3px;
      box-shadow: 0 0 10px rgba(155, 89, 182, 0.5);
      transition: width 0.15s ease;
    }

    #dshrink-modal-root .dshrink-progress-subtext {
      font-size: 12px;
      color: #949ba4;
    }

    /* Footer Controls */
    #dshrink-modal-root .dshrink-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #dshrink-modal-root .dshrink-btn-cancel {
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

    #dshrink-modal-root .dshrink-btn-cancel:hover {
      background: #404249;
    }

    #dshrink-modal-root .dshrink-btn-primary {
      flex: 1.25;
      background: #ffffff;
      color: #060607;
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
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
      box-shadow: 0 0 18px rgba(168, 85, 247, 0.45), 0 0 32px rgba(88, 101, 242, 0.35);
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    #dshrink-modal-root .dshrink-btn-primary:hover {
      background: #f2f3f5;
      box-shadow: 0 0 24px rgba(168, 85, 247, 0.65), 0 0 42px rgba(88, 101, 242, 0.5);
      transform: translateY(-1px);
    }

    #dshrink-modal-root .dshrink-btn-primary:active {
      transform: translateY(0);
    }

    #dshrink-modal-root .dshrink-btn-primary:disabled {
      background: #2b2d31 !important;
      color: #80848e !important;
      box-shadow: none !important;
      cursor: not-allowed;
      transform: none !important;
    }

    #dshrink-modal-root .dshrink-btn-icon {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
      fill: currentColor;
      display: block;
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

  function ensureStylesInjected() {
    if (!document.getElementById(STYLE_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      styleEl.textContent = MODAL_CSS;
      document.head.appendChild(styleEl);
    }
  }

  // DRY helper for segmented button groups
  function bindSegments(container, onSelect) {
    if (!container) return;
    const buttons = container.querySelectorAll(".dshrink-segment-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        onSelect(btn.getAttribute("data-val"));
      });
    });
  }

  /**
   * Opens the DiscordShrink modal attached natively to Discord's DOM.
   * Returns a controller to update progress, report errors, or close the modal.
   */
  function openModal(file, callbacks, defaults = {}) {
    const Compressor = window.DiscordShrink.Compressor;
    const isAudio = Compressor.isAudioFile(file);

    let isAborted = false;
    let selectedClip = "full";
    let selectedSize = defaults.targetMB ? parseFloat(defaults.targetMB) : 19.0;
    let selectedRes = defaults.quality || (isAudio ? "32000" : "720");
    let mediaDuration = 0;

    ensureStylesInjected();

    // Clean up any existing instance
    const existing = document.getElementById("dshrink-modal-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "dshrink-modal-root";

    root.innerHTML = `
      <div class="dshrink-backdrop" id="dshrink-backdrop"></div>
      <div class="dshrink-modal" role="dialog" aria-modal="true">
        <button class="dshrink-close-btn" id="dshrink-close-x" aria-label="Close" title="Close">
          ${ICONS.close}
        </button>

        <!-- Initial Pre-start Hero Header -->
        <div class="dshrink-hero" id="dshrink-hero-pre">
          <div class="dshrink-hero-logo-box">
            <img class="dshrink-hero-logo" src="${LOGO_URL}" alt="DiscordShrink Logo" />
          </div>
          <span class="dshrink-badge">${isAudio ? "AUDIO AUTO-SHRINK" : "AUTO-SHRINK"}</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">The max file size is 20MB. Compress locally to send directly in chat.</p>
        </div>

        <!-- Progress Header (shown during encoding) -->
        <div class="dshrink-hero-progress" id="dshrink-hero-progress">
          <h2 class="dshrink-progress-title">Compress ${isAudio ? "Audio" : "Video"}</h2>
          <p class="dshrink-progress-subtitle">Fits Discord's 20MB limit without Nitro</p>
        </div>
        
        <!-- Media File Card -->
        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            ${isAudio ? ICONS.audio : ICONS.video}
          </div>
          <div class="dshrink-file-details">
            <span class="dshrink-filename" title="${file.name}">${file.name}</span>
            <div class="dshrink-file-meta">
              <span class="dshrink-meta-item">
                ${ICONS.clock}
                <span id="dshrink-duration-val">--:--</span>
              </span>
              <span class="dshrink-meta-dot">•</span>
              <span class="dshrink-meta-item">
                ${ICONS.file}
                <strong class="dshrink-size-val">${Compressor.formatBytes(file.size)}</strong>
              </span>
              <span class="dshrink-overlimit-badge" id="dshrink-overlimit-badge">Over 20 MB</span>
            </div>
          </div>
        </div>

        <div id="dshrink-warn-container" style="display: none;"></div>

        <!-- Compression Settings -->
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
              <button type="button" class="dshrink-segment-btn ${selectedSize === 19.0 ? 'active' : ''}" data-val="19.0">19 MB (Discord)</button>
              <button type="button" class="dshrink-segment-btn ${selectedSize === 15.0 ? 'active' : ''}" data-val="15.0">15 MB (Mobile)</button>
              <button type="button" class="dshrink-segment-btn ${selectedSize === 8.0 ? 'active' : ''}" data-val="8.0">8 MB (Legacy)</button>
            </div>
          </div>

          <div class="dshrink-group">
            <label class="dshrink-label">${isAudio ? "Audio Quality" : "Video Quality"}</label>
            <div class="dshrink-segment-group" id="dshrink-res-segments">
              ${isAudio ? `
                <button type="button" class="dshrink-segment-btn ${selectedRes === '32000' ? 'active' : ''}" data-val="32000">Studio (32kHz)</button>
                <button type="button" class="dshrink-segment-btn ${selectedRes === '22050' ? 'active' : ''}" data-val="22050">High (22kHz)</button>
                <button type="button" class="dshrink-segment-btn ${selectedRes === 'voice' ? 'active' : ''}" data-val="voice">Voice (Mono)</button>
              ` : `
                <button type="button" class="dshrink-segment-btn ${selectedRes === '720' ? 'active' : ''}" data-val="720">720p HD</button>
                <button type="button" class="dshrink-segment-btn ${selectedRes === '480' ? 'active' : ''}" data-val="480">480p SD</button>
                <button type="button" class="dshrink-segment-btn ${selectedRes === 'original' ? 'active' : ''}" data-val="original">Source</button>
              `}
            </div>
          </div>
        </div>

        <!-- Live Progress Feedback -->
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
            ${ICONS.zap}
            <span>Compress & Attach</span>
          </button>
        </div>
      </div>
    `;

    const mountPoint = document.getElementById("app-mount") || document.body;
    mountPoint.appendChild(root);

    const cancelBtn = root.querySelector("#dshrink-cancel-btn");
    const closeX = root.querySelector("#dshrink-close-x");
    const backdrop = root.querySelector("#dshrink-backdrop");
    const startBtn = root.querySelector("#dshrink-start-btn");
    const optionsArea = root.querySelector("#dshrink-options-area");
    const progressCard = root.querySelector("#dshrink-progress-card");
    const progressBar = root.querySelector("#dshrink-progress-bar");
    const statusText = root.querySelector("#dshrink-status-text");
    const percentageText = root.querySelector("#dshrink-percentage");
    const subtextEl = root.querySelector("#dshrink-progress-subtext");
    const durationVal = root.querySelector("#dshrink-duration-val");
    const thumbBox = root.querySelector("#dshrink-thumb-box");
    const warnContainer = root.querySelector("#dshrink-warn-container");
    const clipGroup = root.querySelector("#dshrink-clip-group");
    const fullBtn = root.querySelector("#dshrink-full-btn");
    const heroPre = root.querySelector("#dshrink-hero-pre");
    const heroProgress = root.querySelector("#dshrink-hero-progress");
    const overlimitBadge = root.querySelector("#dshrink-overlimit-badge");

    if (!isAudio) {
      bindSegments(root.querySelector("#dshrink-clip-segments"), (val) => {
        selectedClip = val === "full" ? "full" : parseFloat(val);
      });
    }
    bindSegments(root.querySelector("#dshrink-size-segments"), (val) => {
      selectedSize = parseFloat(val);
    });
    bindSegments(root.querySelector("#dshrink-res-segments"), (val) => {
      selectedRes = val;
    });

    // Probe duration and preview
    Compressor.probeMedia(file, isAudio).then(({ duration, thumbnailCanvas }) => {
      if (isAborted) return;
      mediaDuration = duration;
      const formatted = Compressor.formatDuration(duration);
      durationVal.textContent = formatted;

      if (fullBtn) {
        fullBtn.textContent = `Full (${formatted})`;
      }

      if (!isAudio) {
        if (duration > 120) {
          if (clipGroup) clipGroup.style.display = "flex";
          selectedClip = 60;
          warnContainer.style.display = "block";
          warnContainer.innerHTML = `
            <div class="dshrink-notice">
              Long video detected (${formatted}). 60s clip is pre-selected for fast compression.
            </div>
          `;
        }
        if (thumbnailCanvas && thumbBox) {
          thumbBox.innerHTML = "";
          thumbBox.appendChild(thumbnailCanvas);
        }
      }
    });

    function close() {
      isAborted = true;
      window.removeEventListener("keydown", keyHandler);
      root.remove();
      if (callbacks.onCancel) callbacks.onCancel();
    }

    function keyHandler(e) {
      if (e.key === "Escape") close();
    }

    cancelBtn.addEventListener("click", close);
    closeX.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    window.addEventListener("keydown", keyHandler);

    startBtn.addEventListener("click", function () {
      heroPre.style.display = "none";
      heroProgress.style.display = "flex";
      overlimitBadge.style.display = "inline-block";
      optionsArea.style.display = "none";
      warnContainer.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;

      callbacks.onStart({
        targetMB: selectedSize,
        quality: selectedRes,
        clip: selectedClip,
        mediaDuration
      });
    });

    return {
      updateProgress: (percent, status, subtext) => {
        if (isAborted) return;
        progressBar.style.width = percent + "%";
        percentageText.textContent = Math.round(percent) + "%";
        if (status) statusText.textContent = status;
        if (subtext) subtextEl.textContent = subtext;
      },
      complete: (blob) => {
        if (isAborted) return;
        progressBar.style.width = "100%";
        percentageText.textContent = "100%";
        statusText.textContent = `Attached ${Compressor.formatBytes(blob.size)} to Discord`;
        subtextEl.textContent = isAudio ? "Audio ready" : "Audio and video ready";
        setTimeout(() => {
          if (!isAborted) close();
        }, 350);
      },
      error: (err) => {
        if (isAborted) return;
        statusText.textContent = "Error: " + err.message;
        startBtn.disabled = false;
      },
      close
    };
  }

  // Export to namespace
  window.DiscordShrink = window.DiscordShrink || {};
  window.DiscordShrink.UI = {
    openModal
  };
})();
