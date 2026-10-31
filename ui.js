/**
 * ShrinkCord - Modern Native Discord UI Component
 * 1:1 Discord Dark Theme modal matching Discord's official rich design system.
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
      width: 460px;
      max-width: 92vw;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dshrink-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
      padding: 22px 22px 18px 22px;
    }

    #dshrink-modal-root .dshrink-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.38);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #949ba4;
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
      margin-bottom: 12px;
    }

    #dshrink-modal-root .dshrink-hero-logo-box {
      position: relative;
      width: 44px;
      height: 44px;
      margin: 2px auto 8px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-hero-logo {
      position: relative;
      width: 44px;
      height: 44px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45));
    }

    #dshrink-modal-root .dshrink-badge {
      display: inline-block;
      background: #ffffff;
      color: #111214;
      font-family: var(--font-display, "gg sans", "ABC Ginto Normal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 10px;
      font-weight: 700;
      padding: 2.5px 10px;
      border-radius: 999px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    #dshrink-modal-root .dshrink-title {
      font-family: var(--font-display, "gg sans", "ABC Ginto Normal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 20px;
      font-weight: 800;
      line-height: 24px;
      color: #ffffff;
      margin-bottom: 4px;
      letter-spacing: -0.015em;
    }

    #dshrink-modal-root .dshrink-subtitle {
      font-size: 13px;
      line-height: 17px;
      color: #b5bac1;
      max-width: 390px;
    }

    #dshrink-modal-root .dshrink-file-card {
      background: rgba(17, 18, 20, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      padding: 9px 11px;
      display: flex;
      align-items: center;
      gap: 11px;
      margin-bottom: 12px;
    }

    #dshrink-modal-root .dshrink-thumb-box {
      width: 46px;
      height: 46px;
      border-radius: 7px;
      background: #111214;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    #dshrink-modal-root .dshrink-thumb-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #dshrink-modal-root .dshrink-thumb-cover canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    #dshrink-modal-root .dshrink-file-icon {
      width: 24px;
      height: 24px;
      display: block;
    }

    #dshrink-modal-root .dshrink-file-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    #dshrink-modal-root .dshrink-filename-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #f2f3f5;
      font-size: 13px;
      font-weight: 600;
      padding: 3px 7px;
      outline: none;
      transition: border-color 0.15s ease, background-color 0.15s ease;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #dshrink-modal-root .dshrink-filename-input:focus {
      border-color: #5865f2;
      background: rgba(0, 0, 0, 0.55);
    }

    #dshrink-modal-root .dshrink-filename-input:disabled {
      background: transparent;
      border-color: transparent;
      color: #949ba4;
      padding-left: 0;
    }

    #dshrink-modal-root .dshrink-file-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: #949ba4;
      white-space: nowrap;
    }

    #dshrink-modal-root .dshrink-meta-dot {
      color: #4e5058;
    }

    #dshrink-modal-root .dshrink-size-val {
      color: #dbdee1;
      font-weight: 600;
    }

    #dshrink-modal-root .dshrink-overlimit-tag {
      color: #f0b232;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    #dshrink-modal-root .dshrink-options-area {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }

    #dshrink-modal-root .dshrink-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    #dshrink-modal-root .dshrink-label {
      font-family: var(--font-display, "gg sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif) !important;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #b5bac1;
    }

    #dshrink-modal-root .dshrink-segment-group {
      position: relative;
      display: flex;
      background: #111214;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      user-select: none;
    }

    #dshrink-modal-root .dshrink-segment-glider {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      background: #35373c;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      z-index: 1;
    }

    #dshrink-modal-root .dshrink-segment-btn {
      position: relative;
      flex: 1;
      background: transparent;
      border: none;
      color: #949ba4;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 4px;
      border-radius: 6px;
      cursor: pointer;
      transition: color 0.15s ease;
      z-index: 2;
      text-align: center;
      white-space: nowrap;
    }

    #dshrink-modal-root .dshrink-segment-btn:hover {
      color: #dbdee1;
    }

    #dshrink-modal-root .dshrink-segment-btn.active {
      color: #ffffff;
      font-weight: 700;
    }

    #dshrink-modal-root .dshrink-toggles-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 3px 2px 0 2px;
    }

    #dshrink-modal-root .dshrink-check-item {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      color: #949ba4;
      transition: color 0.15s ease;
    }

    #dshrink-modal-root .dshrink-check-item:hover {
      color: #dbdee1;
    }

    #dshrink-modal-root .dshrink-checkbox-hidden {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    #dshrink-modal-root .dshrink-custom-check {
      width: 15px;
      height: 15px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    #dshrink-modal-root .dshrink-checkbox-hidden:checked + .dshrink-custom-check {
      background: #5865f2;
      border-color: #5865f2;
    }

    #dshrink-modal-root .dshrink-checkbox-hidden:checked + .dshrink-custom-check::after {
      content: "";
      display: block;
      width: 3.5px;
      height: 7px;
      border: solid #ffffff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) translate(-0.5px, -0.5px);
    }

    #dshrink-modal-root .dshrink-progress-card {
      background: rgba(17, 18, 20, 0.85);
      border: 1px solid rgba(88, 101, 242, 0.3);
      border-radius: 10px;
      padding: 14px;
      display: none;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
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
      margin-top: 10px;
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

    #dshrink-modal-root .dshrink-btn-cancel {
      flex: 1;
      width: 50%;
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
      width: 50%;
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
      from { transform: scale(0.96); opacity: 0; }
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

  function openModal(file, callbacks, defaults = {}, queueInfo = null, tierInfo = null) {
    const Compressor = window.ShrinkCord.Compressor;
    const { PRESETS } = Compressor;
    const isAudio = Compressor.isAudioFile(file);
    const resolved = Compressor.resolveSettings(defaults);

    const maxLimitBytes = tierInfo?.limitBytes || Compressor.DISCORD_LIMIT_BYTES;
    const tier = tierInfo?.tier || 0;
    const limitMB = Math.round(maxLimitBytes / (1024 * 1024));

    let selectedSize = (tier === 1 || tier === 3) ? 48.0 : (resolved.targetMB || 19.0);
    let selectedRes = isAudio ? resolved.audioQuality : resolved.videoQuality;
    let selectedFormat = resolved.format || "mp4";
    let selectedClip = "full";
    let isAborted = false;
    let isEncoding = false;
    let isCompleted = false;
    let mediaDuration = 0;
    const safeFileName = escapeHtml(file.name || (isAudio ? "audio" : "video"));

    let badgeText = "AUTO-SHRINK";
    if (queueInfo && queueInfo.total > 1) {
      badgeText = `QUEUE (${queueInfo.index} of ${queueInfo.total})`;
    } else if (tier === 2) {
      badgeText = "NITRO PRO SHRINKS (>500MB)";
    } else if (tier === 1 || tier === 3) {
      badgeText = "NITRO BASIC SHRINKS (>50MB)";
    } else if (isAudio) {
      badgeText = "AUDIO AUTO-SHRINK";
    }

    const subtitleText = `The max file size is ${limitMB}MB. Compress locally to send directly in chat.`;

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

        <div class="dshrink-hero">
          <div class="dshrink-hero-logo-box">
            <img class="dshrink-hero-logo" src="${LOGO_URL}" alt="ShrinkCord Logo" />
          </div>
          <span class="dshrink-badge">${badgeText}</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">${subtitleText}</p>
        </div>

        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            <div class="dshrink-thumb-cover" id="dshrink-thumb-cover">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
          </div>
          <div class="dshrink-file-details">
            <input type="text" class="dshrink-filename-input" id="dshrink-filename-input" value="${safeFileName}" placeholder="Filename" spellcheck="false" title="Click to rename" />
            <div class="dshrink-file-meta">
              <span class="dshrink-meta-item">
                ${ICONS.clock}
                <span id="dshrink-duration-val">--:--</span>
              </span>
              <span class="dshrink-meta-dot">&bull;</span>
              <span class="dshrink-meta-item">
                ${ICONS.file}
                <strong class="dshrink-size-val">${Compressor.formatBytes(file.size)}</strong>
              </span>
              <span class="dshrink-meta-dot">&bull;</span>
              <span class="dshrink-overlimit-tag">
                ${ICONS.warn}
                <span>Over ${limitMB}MB</span>
              </span>
            </div>
          </div>
        </div>

        <div class="dshrink-options-area" id="dshrink-options-area">
          ${!isAudio ? `
            <div class="dshrink-group" id="dshrink-clip-group" style="display: none;">
              <label class="dshrink-label">Clip Duration</label>
              <div class="dshrink-segment-group" id="dshrink-clip-segments">
                ${renderSegments(PRESETS.CLIPS, "full")}
              </div>
            </div>

            <div class="dshrink-group">
              <label class="dshrink-label">Output Format</label>
              <div class="dshrink-segment-group" id="dshrink-format-segments">
                ${renderSegments(PRESETS.FORMATS, selectedFormat)}
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

          <div class="dshrink-toggles-row">
            <label class="dshrink-check-item" title="Wrap media in Discord spoiler blur (SPOILER_)">
              <input type="checkbox" id="dshrink-spoiler-check" class="dshrink-checkbox-hidden" />
              <span class="dshrink-custom-check"></span>
              <span>Mark as Spoiler</span>
            </label>
            ${!isAudio ? `
              <label class="dshrink-check-item" title="Strip audio completely for silent clips & crisper video quality">
                <input type="checkbox" id="dshrink-mute-check" class="dshrink-checkbox-hidden" />
                <span class="dshrink-custom-check"></span>
                <span>Mute Audio (GIF)</span>
              </label>
            ` : ""}
            <label class="dshrink-check-item" title="Boost quiet mic and game volume by 2x (+6dB)">
              <input type="checkbox" id="dshrink-boost-check" class="dshrink-checkbox-hidden" />
              <span class="dshrink-custom-check"></span>
              <span>Boost Audio (2x)</span>
            </label>
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
          <a href="https://www.buymeacoffee.com/isaac4096" target="_blank" rel="noopener noreferrer" class="dshrink-tip-link">
            ☕ Buy me a coffee
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const closeBtn = root.querySelector("#dshrink-close-x");
    const cancelBtn = root.querySelector("#dshrink-cancel-btn");
    const backdrop = root.querySelector("#dshrink-backdrop");
    const startBtn = root.querySelector("#dshrink-start-btn");
    const thumbBox = root.querySelector("#dshrink-thumb-box");
    const durationVal = root.querySelector("#dshrink-duration-val");
    const optionsArea = root.querySelector("#dshrink-options-area");
    const progressCard = root.querySelector("#dshrink-progress-card");
    const statusText = root.querySelector("#dshrink-status-text");
    const percentageText = root.querySelector("#dshrink-percentage");
    const progressBar = root.querySelector("#dshrink-progress-bar");
    const subtextEl = root.querySelector("#dshrink-progress-subtext");
    const filenameInput = root.querySelector("#dshrink-filename-input");
    const spoilerCheck = root.querySelector("#dshrink-spoiler-check");
    const muteCheck = root.querySelector("#dshrink-mute-check");
    const boostCheck = root.querySelector("#dshrink-boost-check");
    const clipGroup = root.querySelector("#dshrink-clip-group");

    function close() {
      if (isAborted) return;
      isAborted = true;
      root.remove();
      callbacks.onCancel();
    }

    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    bindSegments(root.querySelector("#dshrink-size-segments"), (val) => {
      selectedSize = parseFloat(val);
    });

    const formatSegments = root.querySelector("#dshrink-format-segments");
    if (formatSegments) {
      bindSegments(formatSegments, (val) => {
        selectedFormat = val;
      });
    }

    bindSegments(root.querySelector("#dshrink-res-segments"), (val) => {
      selectedRes = val;
    });

    const clipSegments = root.querySelector("#dshrink-clip-segments");
    if (clipSegments) {
      bindSegments(clipSegments, (val) => {
        selectedClip = val;
      });
    }

    const metaMedia = document.createElement(isAudio ? "audio" : "video");
    metaMedia.preload = "metadata";
    const metaUrl = URL.createObjectURL(file);
    metaMedia.src = metaUrl;

    metaMedia.onloadedmetadata = () => {
      mediaDuration = metaMedia.duration;
      if (durationVal && Number.isFinite(mediaDuration) && mediaDuration > 0) {
        durationVal.textContent = Compressor.formatDuration(mediaDuration);

        // Only show clip option if video exceeds 60 seconds
        if (!isAudio && clipGroup && mediaDuration > 60) {
          clipGroup.style.display = "flex";
        }
      }

      if (!isAudio) {
        metaMedia.currentTime = Math.min(1.0, (mediaDuration || 2) / 2);
      }
    };

    if (!isAudio) {
      metaMedia.onseeked = () => {
        try {
          const cvs = document.createElement("canvas");
          cvs.width = 48;
          cvs.height = 48;
          const cx = cvs.getContext("2d");
          cx.drawImage(metaMedia, 0, 0, 48, 48);
          const thumbCover = root.querySelector("#dshrink-thumb-cover");
          if (thumbCover) {
            thumbCover.innerHTML = "";
            thumbCover.appendChild(cvs);
          }
        } catch (e) {}
        URL.revokeObjectURL(metaUrl);
      };
    }

    startBtn.addEventListener("click", () => {
      if (isEncoding || isCompleted) return;
      isEncoding = true;
      statusText.style.color = "";
      progressBar.style.width = "0%";
      percentageText.textContent = "0%";
      optionsArea.style.display = "none";
      progressCard.style.display = "flex";
      startBtn.disabled = true;
      if (filenameInput) filenameInput.disabled = true;

      callbacks.onStart({
        targetMB: selectedSize,
        quality: selectedRes,
        format: selectedFormat,
        clip: selectedClip,
        mediaDuration,
        hostElement: thumbBox,
        customName: filenameInput ? filenameInput.value : file.name,
        isSpoiler: Boolean(spoilerCheck && spoilerCheck.checked),
        muteAudio: Boolean(muteCheck && muteCheck.checked),
        audioBoost: Boolean(boostCheck && boostCheck.checked)
      });
    });

    return {
      updateProgress: (percent, status, subtext) => {
        if (isAborted) return;
        progressBar.style.width = `${percent}%`;
        percentageText.textContent = `${percent}%`;
        if (status) statusText.textContent = status;
        if (subtext) subtextEl.textContent = subtext;
      },
      complete: (blob, format) => {
        if (isAborted) return;
        isCompleted = true;
        isEncoding = false;
        progressBar.style.width = "100%";
        percentageText.textContent = "100%";
        statusText.textContent = "Done! Compressed successfully";
        subtextEl.textContent = `Size: ${Compressor.formatBytes(blob.size)} (${format.toUpperCase()}) &bull; Attaching...`;

        setTimeout(() => {
          if (!isAborted) {
            root.remove();
          }
        }, 400);
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
        if (filenameInput) filenameInput.disabled = false;
      },
      close
    };
  }

  window.ShrinkCord = window.ShrinkCord || {};
  window.ShrinkCord.UI = {
    openModal
  };
})();
