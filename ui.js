/**
 * DiscordShrink - Native Discord Nitro UI Component
 * 1:1 Discord Dark Theme modal rendered within an isolated Shadow DOM.
 */

(function () {
  "use strict";

  const NITRO_HERO_URL = chrome.runtime.getURL("icons/nitro_hero.png");

  // Official Discord Vector Icons
  const ICONS = {
    nitro: `<svg class="dshrink-btn-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M8.29 20.251c.392.052.793.08 1.202.08 5.093 0 9.235-4.129 9.249-9.221a9.208 9.208 0 0 0-.258-2.185l-2.09 2.083a6.837 6.837 0 0 1 .18 1.554 6.942 6.942 0 0 1-6.94 6.941c-.427 0-.84-.044-1.242-.12l-.101-.872zm-2.072-3.155c-.452-.77-.768-1.627-.92-2.544l1.393-.243c.123.75.38 1.45.748 2.078l-1.221.709zm-1.04-4.877c.026-.82.193-1.603.486-2.327l1.32.553a6.868 6.868 0 0 0-.411 1.956l-1.395-.182zm1.61-4.492c.62-.731 1.39-1.326 2.26-1.737l.63 1.282a6.88 6.88 0 0 0-1.848 1.42l-1.042-.965zm3.764-2.48a9.23 9.23 0 0 1 2.375-.314c1.192 0 2.32.227 3.355.642l-.565 1.314a7.804 7.804 0 0 0-2.79-.536c-.722 0-1.417.098-2.077.281l-.298-1.387zm-1.84 8.795a2.535 2.535 0 0 1 2.535-2.535c.49 0 .947.14 1.334.382l4.636-4.637a9.227 9.227 0 0 0-3.435-1.427l-.317 1.478a7.818 7.818 0 0 0-.968.106l4.032 4.031a2.535 2.535 0 0 1-2.782 4.142l-2.02 2.02a2.533 2.533 0 0 1-3.015-3.56zm2.535-.875a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 10.59V7a1 1 0 0 0-2 0v5a1 1 0 0 0 .29.71l3 3a1 1 0 0 0 1.42-1.42z"/></svg>`,
    file: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 1.5L18.5 8H14zM6 20V4h6v6h6v10z"/></svg>`,
    audio: `<svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    video: `<svg class="dshrink-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`
  };

  function getDiscordFontFaces() {
    let css = "";
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const rules = document.styleSheets[i].cssRules || [];
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].type === CSSRule.FONT_FACE_RULE || (rules[j].cssText && rules[j].cssText.includes("gg sans"))) {
              css += rules[j].cssText + "\n";
            }
          }
        } catch (err) {}
      }
    } catch (e) {}

    css += `
      @font-face {
        font-family: "gg sans";
        font-style: normal;
        font-weight: 400;
        src: url("https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-400.woff2") format("woff2");
      }
      @font-face {
        font-family: "gg sans";
        font-style: normal;
        font-weight: 500;
        src: url("https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-500.woff2") format("woff2");
      }
      @font-face {
        font-family: "gg sans";
        font-style: normal;
        font-weight: 600;
        src: url("https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-600.woff2") format("woff2");
      }
      @font-face {
        font-family: "gg sans";
        font-style: normal;
        font-weight: 700;
        src: url("https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-700.woff2") format("woff2");
      }
      @font-face {
        font-family: "gg sans";
        font-style: normal;
        font-weight: 800;
        src: url("https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-800.woff2") format("woff2");
      }
    `;
    return css;
  }

  const MODAL_CSS = `
    :host {
      z-index: 2147483647 !important;
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
      font-family: var(--font-primary, "gg sans", "Noto Sans", sans-serif) !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    *, button, input, select, textarea, span, p, h1, h2, h3, div, label {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", sans-serif) !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .dshrink-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      animation: dshrink-fade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dshrink-modal {
      position: relative;
      background: radial-gradient(ellipse 110% 70% at 50% -10%, #361b4d 0%, #202225 65%, #1e1f22 100%);
      color: #dbdee1;
      width: 480px;
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

    .dshrink-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.35);
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

    .dshrink-close-btn:hover {
      background: rgba(255, 255, 255, 0.15);
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

    .dshrink-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }

    .dshrink-hero-art-box {
      position: relative;
      width: 210px;
      height: 160px;
      margin: 0 auto 6px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dshrink-hero-art-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black 65%, transparent 100%);
      mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black 65%, transparent 100%);
      filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.5));
    }

    .dshrink-badge {
      display: inline-block;
      background: #ffffff;
      color: #111214;
      font-family: var(--font-display, "gg sans", sans-serif) !important;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 12px;
      border-radius: 999px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      margin-bottom: 10px;
    }

    .dshrink-title {
      font-family: var(--font-display, "gg sans", sans-serif) !important;
      font-size: 24px;
      font-weight: 700;
      color: var(--header-primary, #ffffff);
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .dshrink-subtitle {
      font-family: var(--font-primary, "gg sans", sans-serif) !important;
      font-size: 14px;
      font-weight: 400;
      color: var(--text-muted, #949ba4);
      line-height: 1.45;
      max-width: 400px;
    }

    .dshrink-file-card {
      background: #232428;
      border: 1px solid rgba(255, 255, 255, 0.06);
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
      border-radius: 6px;
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
      letter-spacing: -0.01em;
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
      font-weight: 500;
    }

    .dshrink-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .dshrink-meta-dot {
      color: #4e5058;
    }

    .dshrink-size-val {
      color: #dbdee1;
      font-weight: 600;
    }

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
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #b5bac1;
      margin-bottom: 2px;
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
      border-radius: 0 6px 6px 0;
      padding: 8px 12px;
      font-size: 12px;
      color: #dbdee1;
      line-height: 16px;
      margin-bottom: 12px;
    }

    .dshrink-progress-card {
      display: none;
      background: #232428;
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
      font-weight: 600;
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

    .dshrink-btn-primary {
      flex: 1.25;
      background: #ffffff;
      color: #060607;
      font-family: var(--font-display, "gg sans", sans-serif) !important;
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
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.4), 0 0 30px rgba(235, 69, 158, 0.35), 0 0 40px rgba(88, 101, 242, 0.35);
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    .dshrink-btn-primary:hover {
      background: #f2f3f5;
      box-shadow: 0 0 26px rgba(0, 212, 255, 0.6), 0 0 38px rgba(235, 69, 158, 0.5), 0 0 50px rgba(88, 101, 242, 0.5);
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

    .dshrink-btn-icon {
      width: 19px;
      height: 19px;
      flex-shrink: 0;
      fill: #060607;
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

  // DRY helper for segmented buttons
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
   * Opens the DiscordShrink modal.
   * Returns a controller to update progress, report errors, or close the modal.
   */
  function openModal(file, callbacks) {
    const Compressor = window.DiscordShrink.Compressor;
    const isAudio = Compressor.isAudioFile(file);

    let isAborted = false;
    let selectedClip = "full";
    let selectedSize = 19.0;
    let selectedRes = isAudio ? "32000" : "720";
    let mediaDuration = 0;

    const host = document.createElement("div");
    host.id = "discord-shrink-host";
    const shadow = host.attachShadow({ mode: "open" });

    const styleEl = document.createElement("style");
    styleEl.textContent = getDiscordFontFaces() + "\n" + MODAL_CSS;
    shadow.appendChild(styleEl);

    const container = document.createElement("div");
    container.innerHTML = `
      <div class="dshrink-backdrop" id="dshrink-backdrop"></div>
      <div class="dshrink-modal" role="dialog" aria-modal="true">
        <button class="dshrink-close-btn" id="dshrink-close-x" aria-label="Close" title="Close">
          ${ICONS.close}
        </button>

        <div class="dshrink-hero">
          <div class="dshrink-hero-art-box">
            <img class="dshrink-hero-art-img" src="${NITRO_HERO_URL}" alt="Discord Nitro Size Limit" />
          </div>
          <span class="dshrink-badge">${isAudio ? "AUDIO AUTO-SHRINK" : "AUTO-SHRINK"}</span>
          <h2 class="dshrink-title">Uh oh, this file exceeds the size limit.</h2>
          <p class="dshrink-subtitle">The max file size is 20MB. Compress locally to send directly in chat.</p>
        </div>
        
        <div class="dshrink-file-card">
          <div class="dshrink-thumb-box" id="dshrink-thumb-box">
            ${isAudio ? ICONS.audio : ICONS.video}
          </div>
          <div class="dshrink-file-details">
            <span class="dshrink-filename" title="${file.name}">${file.name}</span>
            <div class="dshrink-file-meta">
              <span class="dshrink-meta-item">
                ${ICONS.clock}
                <span id="dshrink-duration-val">Reading length...</span>
              </span>
              <span class="dshrink-meta-dot">•</span>
              <span class="dshrink-meta-item">
                ${ICONS.file}
                <strong class="dshrink-size-val">${Compressor.formatBytes(file.size)}</strong>
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
            ${ICONS.nitro}
            <span>Compress & Attach</span>
          </button>
        </div>
      </div>
    `;

    shadow.appendChild(container);
    document.body.appendChild(host);

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

    if (!isAudio) {
      bindSegments(shadow.getElementById("dshrink-clip-segments"), (val) => {
        selectedClip = val === "full" ? "full" : parseFloat(val);
      });
    }
    bindSegments(shadow.getElementById("dshrink-size-segments"), (val) => {
      selectedSize = parseFloat(val);
    });
    bindSegments(shadow.getElementById("dshrink-res-segments"), (val) => {
      selectedRes = val;
    });

    // Probe media duration & thumbnail
    Compressor.probeMedia(file, isAudio).then(({ duration, thumbnailCanvas }) => {
      if (isAborted) return;
      mediaDuration = duration;
      const formatted = Compressor.formatDuration(duration);
      durationVal.textContent = `Length: ${formatted}`;

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
      host.remove();
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
