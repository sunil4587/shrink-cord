# ⚡ ShrinkCord

> **Automatically catch oversized videos and audio on Discord Web and shrink them under 20MB right in your browser.**  
> *100% Client-Side • Zero Cloud Uploads • Open Source (GPLv3) • Zero Telemetry*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-success?style=flat-square)](#privacy--security)

<br/>

<p align="center">
  <img src="assets/preview.png" alt="ShrinkCord Setup Modal" width="48%" />
  &nbsp;&nbsp;
  <img src="assets/progress.png" alt="ShrinkCord Live Transcoding" width="48%" />
</p>
<p align="center">
  <em>Left: Auto-detection with size &amp; resolution presets • Right: Live client-side transcoding with synchronized AV</em>
</p>

---

## 😤 The Problem
You record a gaming clip or audio track on your computer. You drag it into Discord, only to be slapped with the paywall:
> ❌ **"Uh oh, this file exceeds the size limit. The max file size is 20MB."**

## ⚡ The Solution
**ShrinkCord** silently intercepts media drop and paste events on `discord.com`:
1. **Catches oversized media instantly** before Discord triggers the Nitro paywall.
2. A 1:1 Discord Nitro-style modal allows shrinking to **19MB** with custom presets.
3. Compresses video and audio **locally in your browser** at hardware speeds.
4. **Automatically attaches** the compressed file back into your Discord message box ready to send!

---

## 🔒 Privacy & Security First
* **Zero Cloud Servers:** Your videos **never leave your machine**. There is no backend server.
* **Zero Tracking / Telemetry:** No analytics, no Google Analytics, no tracking pixels.
* **Safe for Discord:** Does not use Discord user tokens, does not interact with Discord bots, and does not violate Discord Terms of Service. It simply feeds a valid, smaller file into the standard upload field.

---

## 🛠️ Installation (Developer / Unpacked Mode)

Until the extension is published on the Chrome Web Store, you can install it locally in **10 seconds**:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/sunil4587/shrink-cord.git
   ```
2. Open **Google Chrome**, **Brave**, or **Microsoft Edge**.
3. Navigate to `chrome://extensions/` in your address bar.
4. Toggle **"Developer mode"** ON in the top-right corner.
5. Click **"Load unpacked"** in the top-left corner.
6. Select the shrink-cord folder.
7. Open [Discord Web](https://discord.com/app), drag any video or audio file larger than 20MB into a chat, and watch the magic happen!

---

## ⚙️ Configuration
Click the ShrinkCord icon in your Chrome toolbar to customize:
* **Default Target Size:** `19.0 MB` (Discord Free safe limit), `15.0 MB` (Mobile / WhatsApp), or `8.0 MB` (Legacy).
* **Default Video Quality:** `1080p FHD` (crisp quality), `720p HD` (balanced), or `480p SD` (compact).
* **Default Audio Quality:** `Studio (32kHz)`, `High (22kHz)`, or `Voice (Mono)`.

---

## 🗺️ Roadmap
- [x] Manifest V3 content script interception on Discord Web.
- [x] Native Discord dark-mode styled modal with live preview.
- [x] Automatic bitrate, sample rate & resolution calculator with WebM duration patching.
- [ ] Vencord / BetterDiscord plugin port for the standalone Desktop client.
- [ ] Firefox Add-on release.

---

## 📄 License
This project is licensed under the **GNU General Public License v3.0 (GPLv3)** — see the [LICENSE](LICENSE) file for details.
