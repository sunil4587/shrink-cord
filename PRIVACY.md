# Privacy Policy for ShrinkCord

**Last Updated:** October 2026

ShrinkCord ("we", "our", or "the extension") is an open-source browser extension designed to help Discord Web users compress oversized media files locally. We believe in absolute privacy and zero data collection.

---

### 1. Zero Data Collection & Zero Telemetry
* ShrinkCord **does not collect, log, track, or transmit** any personal identification information, browsing history, Discord messages, tokens, or credentials.
* No telemetry, analytics (e.g. Google Analytics), tracking pixels, or third-party SDKs are embedded in the extension.

### 2. 100% Client-Side Processing
* All media compression (video downscaling, audio re-encoding) runs **entirely inside your local browser** via hardware-accelerated Canvas and Web Audio APIs.
* Your files **never leave your device**. No media files are ever uploaded to any external server or cloud service.

### 3. Storage API Usage
* The `chrome.storage` API is used solely on your local device to save your UI preferences (such as your chosen target file size preset, format, and video resolution preset).
* This data remains strictly in your browser and is never synced or shared remotely.

### 4. Discord Interaction
* ShrinkCord operates strictly on `discord.com` to intercept drop and paste events for files exceeding 20MB.
* It does not inspect, read, or store Discord chat messages, user tokens, server details, or private communications.

### 5. Open Source
ShrinkCord is free and open-source software under the GNU General Public License v3.0 (GPLv3). The full source code is publicly auditable at:  
https://github.com/Isaac4096/shrink-cord

### 6. Contact
For any questions or privacy inquiries, open an issue on [GitHub Issues](https://github.com/Isaac4096/shrink-cord/issues).
