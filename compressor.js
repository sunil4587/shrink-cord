/**
 * ShrinkCord - Core Media Compression Engine
 * Pure client-side transcoding pipeline for video and audio.
 */

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024;
  const STANDARD_SAMPLE_RATES = [44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000];
  const VIDEO_EXT_RE = /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v|3gp|m4p|mpg|mpeg)$/i;
  const AUDIO_EXT_RE = /\.(mp3|wav|flac|m4a|aac|ogg|opus|wma|aiff|alac|oga)$/i;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  const PRESETS = {
    CLIPS: [
      { val: "30", label: "30s Clip" },
      { val: "60", label: "60s Clip" },
      { val: "120", label: "2 Mins" },
      { val: "full", label: "Full Video", id: "dshrink-full-btn" }
    ],
    SIZES: [
      { val: 19.0, label: "19 MB (Discord)" },
      { val: 15.0, label: "15 MB (Balanced)" },
      { val: 8.0, label: "8 MB (Legacy)" }
    ],
    VIDEO_QUALITIES: [
      { val: "1080", label: "1080p FHD" },
      { val: "720", label: "720p HD" },
      { val: "480", label: "480p SD" }
    ],
    AUDIO_QUALITIES: [
      { val: "32000", label: "Studio (32kHz)" },
      { val: "22050", label: "High (22kHz)" },
      { val: "voice", label: "Voice (Mono)" }
    ]
  };

  function resolveSettings(saved = {}) {
    const size = parseFloat(saved.targetMB);
    const vidQual = String(saved.quality || "");
    const audQual = String(saved.audioQuality || saved.quality || "");
    return {
      targetMB: PRESETS.SIZES.some((s) => s.val === size) ? size : 19.0,
      videoQuality: PRESETS.VIDEO_QUALITIES.some((q) => q.val === vidQual) ? vidQual : "1080",
      audioQuality: PRESETS.AUDIO_QUALITIES.some((q) => q.val === audQual) ? audQual : "32000"
    };
  }

  function formatBytes(bytes) {
    if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDuration(seconds) {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }

  function matchesMedia(file, mimePrefix, extRegex) {
    return Boolean(
      file &&
      ((file.type && file.type.startsWith(mimePrefix)) || (file.name && extRegex.test(file.name)))
    );
  }

  function isVideoFile(file) {
    return matchesMedia(file, "video/", VIDEO_EXT_RE);
  }

  function isAudioFile(file) {
    return matchesMedia(file, "audio/", AUDIO_EXT_RE);
  }

  function isMediaFile(file) {
    return isVideoFile(file) || isAudioFile(file);
  }

  function isValidDuration(dur) {
    return Number.isFinite(dur) && dur > 0 && dur < 1e100;
  }

  function releaseMediaElement(el) {
    if (!el) return;
    el.pause();
    el.removeAttribute("src");
    el.load();
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function closeAudioContext(ctx) {
    if (ctx && ctx.state !== "closed") {
      try { ctx.close().catch(() => {}); } catch (e) {}
    }
  }

  function probeMedia(file, isAudio) {
    return new Promise((resolve) => {
      const el = document.createElement(isAudio ? "audio" : "video");
      el.preload = "auto";
      el.muted = true;
      const url = URL.createObjectURL(file);
      el.src = url;

      let settled = false;
      const finish = (duration, thumbnailCanvas = null) => {
        if (settled) return;
        settled = true;
        releaseMediaElement(el);
        URL.revokeObjectURL(url);
        resolve({ duration: isValidDuration(duration) ? duration : 0, thumbnailCanvas });
      };

      const captureThumbnail = (duration) => {
        if (isAudio) {
          finish(duration, null);
          return;
        }
        try {
          el.currentTime = isValidDuration(duration) ? Math.min(1.0, duration * 0.1) : 0.1;
          el.onseeked = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 48;
              canvas.height = 36;
              const ctx = canvas.getContext("2d");
              const vw = el.videoWidth || 48;
              const vh = el.videoHeight || 36;
              const scale = Math.max(48 / vw, 36 / vh);
              const dw = vw * scale;
              const dh = vh * scale;
              ctx.drawImage(el, (48 - dw) / 2, (36 - dh) / 2, dw, dh);
              finish(duration, canvas);
            } catch (err) {
              finish(duration, null);
            }
          };
        } catch (e) {
          finish(duration, null);
        }
      };

      el.onloadedmetadata = () => {
        if (!isValidDuration(el.duration)) {
          el.ondurationchange = () => {
            if (isValidDuration(el.duration)) {
              el.ondurationchange = null;
              captureThumbnail(el.duration);
            }
          };
          try {
            el.currentTime = 1e101;
          } catch (e) {
            captureThumbnail(0);
          }
          return;
        }
        captureThumbnail(el.duration);
      };

      el.onerror = () => finish(0, null);
      setTimeout(() => finish(el.duration, null), 3000);
    });
  }

  function audioBufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numFrames = buffer.length;
    const dataSize = numFrames * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
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
    view.setUint16(20, 1, true);
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
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  function compressAudio(file, targetMB, qualitySetting, maxDuration, callbacks) {
    let isStopped = false;

    callbacks.onProgress(15, "Decoding audio file...", "Reading audio samples...");

    file.arrayBuffer().then(async (arrayBuffer) => {
      if (isStopped) return;

      let audioCtx = null;
      try {
        audioCtx = new AudioContextClass();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        closeAudioContext(audioCtx);
        audioCtx = null;

        if (isStopped) return;

        callbacks.onProgress(45, "Resampling audio...", `Optimizing sample rate to fit ${targetMB}MB...`);

        const totalDuration = decodedBuffer.duration;
        let duration = (maxDuration && maxDuration > 0 && maxDuration < totalDuration) ? maxDuration : totalDuration;
        const targetBytes = (targetMB * 1024 * 1024 * 0.94) - 44;

        let channels = qualitySetting === "voice" ? 1 : Math.min(2, decodedBuffer.numberOfChannels);
        const preferredRate = (qualitySetting === "voice" || qualitySetting === "22050") ? 22050 : 32000;
        let sampleRate = preferredRate;

        const fitsTarget = (rate, ch) => duration * rate * ch * 2 <= targetBytes;

        if (!fitsTarget(sampleRate, channels)) {
          const stereoMatch = STANDARD_SAMPLE_RATES.find((r) => r <= preferredRate && r >= 22050 && fitsTarget(r, channels));
          if (stereoMatch) {
            sampleRate = stereoMatch;
          } else {
            channels = 1;
            sampleRate = STANDARD_SAMPLE_RATES.find((r) => r <= preferredRate && fitsTarget(r, 1)) || 8000;
          }

          if (!fitsTarget(sampleRate, channels)) {
            duration = Math.floor(targetBytes / (sampleRate * channels * 2));
          }
        }

        const frameCount = Math.max(1, Math.ceil(duration * sampleRate));
        const offlineCtx = new OfflineAudioContext(channels, frameCount, sampleRate);

        const source = offlineCtx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0, 0, duration);

        const renderedBuffer = await offlineCtx.startRendering();

        if (isStopped) return;

        callbacks.onProgress(85, "Encoding audio...", "Generating Discord-ready audio...");
        const wavBlob = audioBufferToWavBlob(renderedBuffer);

        callbacks.onProgress(100, "Audio ready!", "Attaching to Discord...");
        callbacks.onComplete(wavBlob);
      } catch (err) {
        closeAudioContext(audioCtx);
        if (!isStopped) {
          callbacks.onError(new Error("Audio decoding failed: " + err.message));
        }
      }
    }).catch((err) => {
      if (!isStopped) {
        callbacks.onError(new Error("Unable to read audio file: " + err.message));
      }
    });

    return function cleanup() {
      isStopped = true;
    };
  }

  function compressVideo(file, targetMB, resolutionSetting, maxDuration, callbacks, hostElement) {
    callbacks.onProgress(5, "Preparing video & audio stream...", "Initializing media pipeline...");

    const videoEl = document.createElement("video");
    videoEl.preload = "auto";
    videoEl.crossOrigin = "anonymous";
    videoEl.playsInline = true;
    videoEl.muted = false;
    videoEl.volume = 1.0;
    if (hostElement) {
      videoEl.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 1; z-index: 1; pointer-events: none;";
      hostElement.appendChild(videoEl);
    } else {
      videoEl.style.cssText = "position: fixed; bottom: 4px; right: 4px; width: 64px; height: 48px; opacity: 0.01; z-index: 2147483647; pointer-events: none;";
      document.body.appendChild(videoEl);
    }

    const fileUrl = URL.createObjectURL(file);
    videoEl.src = fileUrl;

    let isStopped = false;
    let rvfcId = null;
    let animFrameId = null;
    let fallbackInterval = null;
    let frameCounter = 0;
    let recorder = null;
    let audioCtx = null;
    let isFinishing = false;

    function stopFrameLoop() {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (rvfcId && "cancelVideoFrameCallback" in videoEl) {
        try { videoEl.cancelVideoFrameCallback(rvfcId); } catch (e) {}
        rvfcId = null;
      }
    }

    function cleanup() {
      if (isStopped) return;
      isStopped = true;
      stopFrameLoop();
      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch (e) {}
      }
      releaseMediaElement(videoEl);
      closeAudioContext(audioCtx);
      URL.revokeObjectURL(fileUrl);
    }

    videoEl.onloadedmetadata = function () {
      if (isStopped) return;

      const rawDuration = isValidDuration(videoEl.duration)
        ? videoEl.duration
        : Math.max(10, Math.min(300, file.size / (512 * 1024)));
      const duration = (maxDuration && maxDuration > 0) ? Math.min(rawDuration, maxDuration) : rawDuration;

      const targetTotalBits = targetMB * 8 * 1024 * 1024 * 0.92;
      const totalAvailableBps = Math.floor(targetTotalBits / Math.max(1, duration));
      const audioBps = totalAvailableBps < 250000 ? 48000 : (totalAvailableBps < 500000 ? 64000 : 96000);
      const videoBps = Math.max(80000, Math.min(totalAvailableBps - audioBps, 8500000));

      let targetWidth = videoEl.videoWidth || 1920;
      let targetHeight = videoEl.videoHeight || 1080;
      let maxShortEdge = parseInt(resolutionSetting, 10) || 1080;

      if (videoBps < 220000 && maxShortEdge > 360) maxShortEdge = 360;
      else if (videoBps < 450000 && maxShortEdge > 480) maxShortEdge = 480;
      else if (videoBps < 900000 && maxShortEdge > 720) maxShortEdge = 720;

      const currentShortEdge = Math.min(targetWidth, targetHeight);
      if (currentShortEdge > maxShortEdge) {
        const scale = maxShortEdge / currentShortEdge;
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      targetWidth = Math.max(2, targetWidth & ~1);
      targetHeight = Math.max(2, targetHeight & ~1);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const canvasStream = canvas.captureStream(30);
      const videoTrack = canvasStream.getVideoTracks()[0];
      const combinedTracks = videoTrack ? [videoTrack] : [];

      try {
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const sourceNode = audioCtx.createMediaElementSource(videoEl);
          const destinationNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destinationNode);

          const muteGain = audioCtx.createGain();
          muteGain.gain.value = 0.0;
          sourceNode.connect(muteGain);
          muteGain.connect(audioCtx.destination);

          const aTrack = destinationNode.stream.getAudioTracks()[0];
          if (aTrack) combinedTracks.push(aTrack);
        }
      } catch (audioErr) {
        videoEl.muted = true;
      }

      const combinedStream = new MediaStream(combinedTracks);
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";

      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: videoBps,
          audioBitsPerSecond: audioBps
        });
      } catch (recErr) {
        callbacks.onError(new Error("Browser does not support encoding: " + recErr.message));
        cleanup();
        return;
      }

      const chunks = [];
      recorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = function (e) {
        if (isStopped || isFinishing) return;
        callbacks.onError(new Error((e && e.error && e.error.message) || "MediaRecorder encoding failed"));
        cleanup();
      };

      function finishRecording() {
        if (isFinishing || isStopped) return;
        isFinishing = true;
        stopFrameLoop();

        videoEl.pause();
        ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
        callbacks.onProgress(98, "Finalizing compressed video...", "Patching metadata and attaching...");

        if (recorder && recorder.state !== "inactive") {
          recorder.onstop = async function () {
            combinedStream.getTracks().forEach((track) => track.stop());

            if (chunks.length > 0) {
              let finalBlob = new Blob(chunks, { type: mimeType });
              try {
                const recordedMs = Math.round(Math.min(videoEl.currentTime || duration, duration) * 1000);
                const patcher = window.ysFixWebmDuration || window.fixWebmDuration;
                if (recordedMs > 0 && typeof patcher === "function") {
                  const patched = await patcher(finalBlob, recordedMs, { logger: false });
                  if (patched && patched.size > 0) finalBlob = patched;
                }
              } catch (err) {}
              callbacks.onComplete(finalBlob);
            } else {
              callbacks.onError(new Error("Compression failed: empty output"));
            }
            cleanup();
          };
          recorder.stop();
        } else {
          cleanup();
        }
      }

      function drawCurrentFrame() {
        if (isStopped || isFinishing || videoEl.paused || videoEl.ended) return;

        if (videoEl.currentTime >= duration || videoEl.ended) {
          finishRecording();
          return;
        }

        ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
        ctx.fillStyle = (frameCounter++ % 2 === 0) ? "rgba(0,0,0,0.01)" : "rgba(0,0,0,0.02)";
        ctx.fillRect(0, 0, 1, 1);

        if (videoTrack && typeof videoTrack.requestFrame === "function") {
          try { videoTrack.requestFrame(); } catch (e) {}
        }

        const percent = Math.min(95, Math.max(5, (videoEl.currentTime / duration) * 95));
        const currentSec = Math.floor(videoEl.currentTime);
        const totalSec = Math.floor(duration);

        callbacks.onProgress(
          percent,
          `Encoding: ${currentSec}s / ${totalSec}s`,
          `HD video & audio in sync • ~${Math.max(0, totalSec - currentSec)}s left`
        );
      }

      function scheduleNextFrame() {
        if ("requestVideoFrameCallback" in videoEl) {
          rvfcId = videoEl.requestVideoFrameCallback(onVideoFrame);
        } else {
          animFrameId = requestAnimationFrame(onVideoFrame);
        }
      }

      function onVideoFrame() {
        if (isStopped || isFinishing) return;
        drawCurrentFrame();
        scheduleNextFrame();
      }

      function resumeAudioContext() {
        if (audioCtx && audioCtx.state === "suspended") {
          try { audioCtx.resume(); } catch (e) {}
        }
      }

      videoEl.onended = finishRecording;
      videoEl.playbackRate = 1.0;
      videoEl.currentTime = 0;

      videoEl.onplay = function () {
        resumeAudioContext();
        if (recorder && recorder.state === "inactive") {
          recorder.start();
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            if (!isStopped && !isFinishing && !videoEl.paused && !videoEl.ended) {
              drawCurrentFrame();
            }
          }, 33);
        }
        scheduleNextFrame();
      };

      resumeAudioContext();
      videoEl.play().catch(function (err) {
        callbacks.onError(new Error("Unable to decode video: " + err.message));
        cleanup();
      });
    };

    videoEl.onerror = function () {
      callbacks.onError(new Error("Video playback failed. Format may be unsupported."));
      cleanup();
    };

    return cleanup;
  }

  window.ShrinkCord = window.ShrinkCord || {};
  window.ShrinkCord.Compressor = {
    DISCORD_LIMIT_BYTES,
    PRESETS,
    resolveSettings,
    formatBytes,
    formatDuration,
    isVideoFile,
    isAudioFile,
    isMediaFile,
    probeMedia,
    audioBufferToWavBlob,
    compressAudio,
    compressVideo
  };
})();
