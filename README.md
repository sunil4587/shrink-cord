# ⚡ DiscordShrink

> **Automatically catch oversized videos on Discord Web and shrink them under 25MB right in your browser.**  
> *100% Client-Side • Zero Cloud Uploads • Open Source (GPLv3) • Zero Telemetry*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-success?style=flat-square)](#privacy--security)

---

## 😤 The Problem
You record a quick 45-second gaming clip or screen recording on your computer (**68MB**). You drag it into Discord, only to be slapped with the annoying red error:
> ❌ **"Your file is too powerful! Max file size is 25.00 MiB."**

You are forced to open a shady third-party website, wait for slow uploads, watch scam ads, download the converted file, and drag it back into Discord.

## ⚡ The Solution
**DiscordShrink** silently watches for video drop and paste events on `discord.com`. 

When you drop or paste any video larger than 25MB:
1. **It catches the file instantly** before Discord throws an error.
2. A sleek, Discord-native modal pops up asking if you want to auto-shrink to **24MB**.
3. It compresses the video **locally in your browser** using WebAssembly.
4. It **automatically attaches** the clean, 24MB video back into your Discord message box ready to send!

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
   git clone https://github.com/yourusername/discord-shrink.git
   ```
2. Open **Google Chrome**, **Brave**, or **Microsoft Edge**.
3. Navigate to `chrome://extensions/` in your address bar.
4. Toggle **"Developer mode"** ON in the top-right corner.
5. Click **"Load unpacked"** in the top-left corner.
6. Select the `discord-shrink` folder.
7. Open [Discord Web](https://discord.com/app), drag any video larger than 25MB into a chat, and watch the magic happen!

---

## ⚙️ Configuration
Click the DiscordShrink icon in your Chrome toolbar to customize:
* **Default Target Size:** `24.0 MB` (Discord Free default), `15.0 MB` (WhatsApp), or `7.5 MB`.
* **Resolution Mode:** Auto 720p (recommended balance), 480p (fastest encode), or Keep Original.

---

## 🗺️ Roadmap
- [x] Manifest V3 content script interception on Discord Web.
- [x] Discord dark-mode styled Shadow DOM modal.
- [x] Automatic bitrate & resolution calculator.
- [ ] Vencord / BetterDiscord plugin port for the standalone Desktop client.
- [ ] Firefox Add-on release.

---

## 📄 License
This project is licensed under the **GNU General Public License v3.0 (GPLv3)** — see the [LICENSE](LICENSE) file for details.
