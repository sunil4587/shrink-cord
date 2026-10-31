/**
 * ShrinkCord - Modern Native Discord UI Component
 * 1:1 Discord Dark Theme modal matching Discord's official design system.
 */

(function () {
  "use strict";

  const LOGO_URL = (function () {
    try {
      return (typeof chrome !== "undefined" && chrome?.runtime?.getURL)
        ? chrome.runtime.getURL("icons/logo.png")
        : "";
    } catch (e) {
      return "";
    }
  })();
  const STYLE_ID = "dshrink-modal-styles";

  const ICONS = {
    zap: `<svg class="dshrink-btn-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    file: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 1.5L18.5 8H14zM6 20V4h6v6h6v10z"/></svg>`,
    warn: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10h2v4h-2zm0 6h2v2h-2z"/></svg>`,
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

    #dshrink-modal-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
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
      background: radial-gradient(ellipse 110% 70% at 50% -10%, #262c66 0%, #202225 65%, #1e1f22 100%);
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

    #dshrink-modal-root .dshrink-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 14px;
    }

    #dshrink-modal-root .dshrink-hero-logo-box {
      position: relative;
      width: 46px;
      height: 46px;
      margin: 2px auto 10px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-hero-logo {
      position: relative;
      width: 46px;
      height: 46px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45));
    }

    #dshrink-modal-root .dshrink-badge {
      display: inline-block;
      background: #ffffff;
      color: #111214;
      font-family: var(--font-display, "gg sans", "ABC Ginto Normal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2.5px 10px;
      border-radius: 999px;
      letter-spacing: 0.08em;
      line-height: 14px;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
      margin-bottom: 9px;
    }

    #dshrink-modal-root .dshrink-title {
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 6px;
      text-align: center;
    }

    #dshrink-modal-root .dshrink-subtitle {
      font-size: 13.5px;
      font-weight: 400;
      color: #949ba4;
      line-height: 1.45;
      max-width: 400px;
      text-align: center;
    }

    #dshrink-modal-root .dshrink-file-card {
      background: #232428;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    #dshrink-modal-root .dshrink-thumb-box {
      position: relative;
      width: 44px;
      height: 38px;
      background: #1e1f22;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    #dshrink-modal-root .dshrink-thumb-cover {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      background: #1e1f22;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-thumb-box canvas {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      background: #1e1f22;
    }

    #dshrink-modal-root .dshrink-file-icon {
      width: 18px;
      height: 18px;
      stroke: #5865f2;
    }

    #dshrink-modal-root .dshrink-file-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      flex: 1;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-filename {
      font-size: 13.5px;
      font-weight: 600;
      color: #f2f3f5;
      letter-spacing: -0.01em;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      display: block;
    }

    #dshrink-modal-root .dshrink-file-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #949ba4;
      font-weight: 500;
      line-height: 1.25;
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

    #dshrink-modal-root .dshrink-overlimit-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      color: #f0b232;
      white-space: nowrap;
    }

    #dshrink-modal-root .dshrink-overlimit-tag svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
      fill: currentColor;
    }

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
      position: relative;
      display: flex;
      background: #1e1f22;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }

    #dshrink-modal-root .dshrink-segment-glider {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      background: #35373c;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      pointer-events: none;
      z-index: 0;
      will-change: transform;
      transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
    }

    #dshrink-modal-root .dshrink-segment-btn {
      position: relative;
      z-index: 1;
      flex: 1;
      padding: 8px 6px;
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
      transition: color 0.22s ease, transform 0.15s ease;
      user-select: none;
    }

    #dshrink-modal-root .dshrink-segment-btn:hover {
      color: #dbdee1;
    }

    #dshrink-modal-root .dshrink-segment-btn:active {
      transform: scale(0.97);
    }

    #dshrink-modal-root .dshrink-segment-btn.active {
      color: #ffffff;
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
      background: linear-gradient(90deg, #5865f2, #7983f5);
      border-radius: 3px;
      box-shadow: 0 0 10px rgba(88, 101, 242, 0.55);
      transition: width 0.15s ease;
    }

    #dshrink-modal-root .dshrink-progress-subtext {
      font-size: 12px;
      color: #949ba4;
    }

    #dshrink-modal-root .dshrink-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #dshrink-modal-root .dshrink-tip-row {
      margin-top: 12px;
      text-align: center;
    }

    #dshrink-modal-root .dshrink-tip-link {
      font-size: 11.5px;
      color: #949ba4;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: color 0.15s ease;
    }

    #dshrink-modal-root .dshrink-tip-link:hover {
      color: #ffdd00;
      text-decoration: underline;
    }

    #dshrink-modal-root .dshrink-tip-dot {
      color: #4e5058;
      margin: 0 4px;
      font-size: 11px;
    }

    #dshrink-modal-root .dshrink-btn-cancel {
      flex: 1;
      background: #35373c;
      color: #ffffff;
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
      flex: 1;
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
      box-shadow: 0 0 18px rgba(104, 117, 245, 0.45), 0 0 32px rgba(88, 101, 242, 0.35);
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    #dshrink-modal-root .dshrink-btn-primary:hover {
      background: #f2f3f5;
      box-shadow: 0 0 24px rgba(104, 117, 245, 0.65), 0 0 42px rgba(88, 101, 242, 0.5);
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

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureStylesInjected() {
    if (!document.getElementById(STYLE_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      styleEl.textContent = MODAL_CSS;
      document.head.appendChild(styleEl);
    }
  }

  function getGliderTransform(idx) {
    return `translateX(calc(${idx * 100}% + ${idx * 3}px))`;
  }

  function renderSegments(items, activeVal) {
    const count = items.length;
    let activeIdx = items.findIndex(
      ({ val }) => Number(val) === Number(activeVal) || String(val) === String(activeVal)
    );
    if (activeIdx < 0) activeIdx = 0;

    const gliderStyle = `width: calc((100% - 6px - ${(count - 1) * 3}px) / ${count}); transform: ${getGliderTransform(activeIdx)};`;
    const buttonsHtml = items
      .map(({ val, label, id }, idx) => {
        const isActive = idx === activeIdx;
        return `<button type="button" class="dshrink-segment-btn${isActive ? " active" : ""}" data-val="${val}"${id ? ` id="${id}"` : ""}>${label}</button>`;
      })
      .join("");

    return `<div class="dshrink-segment-glider" style="${gliderStyle}"></div>${buttonsHtml}`;
  }

  function bindSegments(container, onSelect) {
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll(".dshrink-segment-btn"));
    const glider = container.querySelector(".dshrink-segment-glider");
    buttons.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (glider) {
          glider.style.transform = getGliderTransform(idx);
        }
        onSelect(btn.getAttribute("data-val"));
      });
    });
  }

  function openModal(file, callbacks, defaults = {}) {
    const Compressor = window.ShrinkCord.Compressor;
    const { PRESETS } = Compressor;
    const isAudio = Compressor.isAudioFile(file);
    const resolved = Compressor.resolveSettings(defaults);

    let selectedSize = resolved.targetMB;
    let selectedRes = isAudio ? resolved.audioQuality : resolved.videoQuality;
    let selectedClip = "full";
    let isAborted = false;
    let isEncoding = false;
    let isCompleted = false;
    let userSelectedClip = false;
    let mediaDuration = 0;
    const safeFileName = escapeHtml(file.name || (isAudio ? "audio" : "video"));

    ensureStylesInjected();

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

        <div class="dshrink-hero" id="dshrink-hero">
          <div class="dshrink-hero-logo-box">
            <img class="dshrink-hero-logo" src="${LOGO_URL}" alt="ShrinkCord Logo" />
          </div>
          <span class="dshrink-badge">${isAudio ? "AUDIO AUTO-SHRINK" : "AUTO-SHRINK"}</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">The max file size is 20MB. Compress locally to send directly in chat.</p>
        </div>

        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            <div class="dshrink-thumb-cover" id="dshrink-thumb-cover">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
          </div>
          <div class="dshrink-file-details">
            <span class="dshrink-filename" title="${safeFileName}">${safeFileName}</span>
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
              <span class="dshrink-meta-dot">•</span>
              <span class="dshrink-overlimit-tag">
                ${ICONS.warn}
                <span>Over 20MB</span>
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
                ${renderSegments(PRESETS.CLIPS, "60")}
              </div>
            </div>
          ` : ""}

          <div class="dshrink-group">
            <label class="dshrink-label">Target File Size</label>
            <div class="dshrink-segment-group" id="dshrink-size-segments">
              ${renderSegments(PRESETS.SIZES, selectedSize)}
            </div>
          </div>

          <div class="dshrink-group">
            <label class="dshrink-label">${isAudio ? "Audio Quality" : "Video Quality"}</label>
            <div class="dshrink-segment-group" id="dshrink-res-segments">
              ${renderSegments(isAudio ? PRESETS.AUDIO_QUALITIES : PRESETS.VIDEO_QUALITIES, selectedRes)}
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
            ${ICONS.zap}
            <span>Compress</span>
          </button>
        </div>

        <div class="dshrink-tip-row">
          <a href="https://www.buymeacoffee.com/sunil4587" target="_blank" rel="noopener noreferrer" class="dshrink-tip-link">
            <span>☕</span>
            <span>Buy me a coffee</span>
          </a>
          <span class="dshrink-tip-dot">•</span>
          <a href="https://rzp.io/rzp/ndplY1j" target="_blank" rel="noopener noreferrer" class="dshrink-tip-link">
            <span>🇮🇳</span>
            <span>Tip via UPI</span>
          </a>
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
    const thumbCover = root.querySelector("#dshrink-thumb-cover");
    const warnContainer = root.querySelector("#dshrink-warn-container");
    const clipGroup = root.querySelector("#dshrink-clip-group");
    const fullBtn = root.querySelector("#dshrink-full-btn");

    if (!isAudio) {
      bindSegments(root.querySelector("#dshrink-clip-segments"), (val) => {
        userSelectedClip = true;
        selectedClip = val === "full" ? "full" : parseFloat(val);
      });
    }
    bindSegments(root.querySelector("#dshrink-size-segments"), (val) => {
      selectedSize = parseFloat(val);
    });
    bindSegments(root.querySelector("#dshrink-res-segments"), (val) => {
      selectedRes = val;
    });

    Compressor.probeMedia(file, isAudio).then(({ duration, thumbnailCanvas }) => {
      if (isAborted) return;
      mediaDuration = duration;
      const formatted = Compressor.formatDuration(duration);
      durationVal.textContent = formatted;

      if (fullBtn) {
        fullBtn.textContent = `Full (${formatted})`;
      }

      if (!isAudio) {
        if (duration > 120 && !isEncoding) {
          if (clipGroup) clipGroup.style.display = "flex";
          if (!userSelectedClip) {
            selectedClip = 60;
          }
          warnContainer.style.display = "block";
          warnContainer.innerHTML = `<div class="dshrink-notice">Long video detected (${formatted}). 60s clip is pre-selected for fast compression.</div>`;
        }
        if (thumbnailCanvas && thumbCover) {
          thumbCover.innerHTML = "";
          thumbCover.appendChild(thumbnailCanvas);
        }
      }
    });

    function close() {
      if (isAborted) return;
      isAborted = true;
      isEncoding = false;
      window.removeEventListener("keydown", keyHandler);
      root.remove();
      if (!isCompleted && callbacks.onCancel) {
        callbacks.onCancel();
      }
    }

    function keyHandler(e) {
      if (e.key === "Escape") close();
    }

    cancelBtn.addEventListener("click", close);
    closeX.addEventListener("click", close);
    backdrop.addEventListener("click", () => {
      if (!isEncoding) close();
    });
    window.addEventListener("keydown", keyHandler);

    startBtn.addEventListener("click", function () {
      isEncoding = true;
      statusText.style.color = "";
      progressBar.style.width = "0%";
      percentageText.textContent = "0%";
      optionsArea.style.display = "none";
      warnContainer.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;

      callbacks.onStart({
        targetMB: selectedSize,
        quality: selectedRes,
        clip: selectedClip,
        mediaDuration,
        hostElement: thumbBox
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
        isEncoding = false;
        isCompleted = true;
        window.removeEventListener("keydown", keyHandler);
        progressBar.style.width = "100%";
        percentageText.textContent = "100%";
        statusText.textContent = `Attached ${Compressor.formatBytes(blob.size)} to Discord`;
        subtextEl.textContent = isAudio ? "Audio ready" : "Audio and video ready";
        setTimeout(() => {
          if (!isAborted) {
            isAborted = true;
            root.remove();
          }
        }, 350);
      },
      error: (err) => {
        if (isAborted) return;
        isEncoding = false;
        statusText.style.color = "#f23f43";
        statusText.textContent = "Error: " + (err && err.message ? err.message : "Compression failed");
        percentageText.textContent = "!";
        progressBar.style.width = "0%";
        subtextEl.textContent = "Adjust settings above and try again.";
        optionsArea.style.display = "flex";
        startBtn.disabled = false;
      },
      close
    };
  }

  window.ShrinkCord = window.ShrinkCord || {};
  window.ShrinkCord.UI = {
    openModal
  };
})();
