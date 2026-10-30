/**
 * DiscordShrink - Core Media Compression Engine
 * Pure client-side transcoding pipeline for video and audio.
 */

(function () {
  "use strict";

  const DISCORD_LIMIT_BYTES = 19 * 1024 * 1024;
  const STANDARD_SAMPLE_RATES = [44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000];

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

  /**
   * Probe media duration and thumbnail
   */
  function probeMedia(file, isAudio) {
    return new Promise((resolve) => {
      const el = document.createElement(isAudio ? "audio" : "video");
      el.preload = "auto";
      el.muted = true;
      const url = URL.createObjectURL(file);
      el.src = url;

      let settled = false;
      const cleanup = () => {
        if (!settled) {
          settled = true;
          URL.revokeObjectURL(url);
        }
      };

      el.onloadedmetadata = () => {
        const duration = el.duration || 0;
        if (isAudio) {
          cleanup();
          resolve({ duration, thumbnailCanvas: null });
        } else {
          try {
            el.currentTime = Math.min(1.0, duration * 0.1);
            el.onseeked = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 48;
              canvas.height = 36;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(el, 0, 0, 48, 36);
              cleanup();
              resolve({ duration, thumbnailCanvas: canvas });
            };
          } catch (e) {
            cleanup();
            resolve({ duration, thumbnailCanvas: null });
          }
        }
      };

      el.onerror = () => {
        cleanup();
        resolve({ duration: 0, thumbnailCanvas: null });
      };

      setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve({ duration: 0, thumbnailCanvas: null });
        }
      }, 3000);
    });
  }

  /**
   * Generates a 16-bit PCM RIFF WAV Blob from an AudioBuffer.
   */
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
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  /**
   * Hardware-speed Audio Compression using Web Audio API + OfflineAudioContext.
   */
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

        if (duration * sampleRate * channels * 2 > targetBytes) {
          if (duration * 8000 * channels * 2 > targetBytes && channels > 1) {
            channels = 1;
          }
          let chosenRate = 8000;
          for (const rate of STANDARD_SAMPLE_RATES) {
            if (duration * rate * channels * 2 <= targetBytes) {
              chosenRate = rate;
              break;
            }
          }
          sampleRate = chosenRate;

          if (duration * sampleRate * channels * 2 > targetBytes) {
            duration = Math.floor(targetBytes / (sampleRate * channels * 2));
          }
        }

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

  /**
   * Video Compression Engine with Web Audio track mixing.
   */
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
    let animFrameId = null;
    let recorder = null;
    let audioCtx = null;

    function cleanup() {
      isStopped = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
      if (audioCtx && audioCtx.state !== "closed") {
        try { audioCtx.close(); } catch (e) {}
      }
      URL.revokeObjectURL(fileUrl);
    }

    videoEl.onloadedmetadata = function () {
      if (isStopped) return;

      const duration = (maxDuration && maxDuration > 0) ? Math.min(videoEl.duration, maxDuration) : videoEl.duration;
      let targetWidth = videoEl.videoWidth || 1280;
      let targetHeight = videoEl.videoHeight || 720;

      if (resolutionSetting === "720") {
        if (targetHeight > 720) {
          targetWidth = Math.round((targetWidth * 720) / targetHeight);
          targetHeight = 720;
        }
      } else if (resolutionSetting === "480") {
        if (targetHeight > 480) {
          targetWidth = Math.round((targetWidth * 480) / targetHeight);
          targetHeight = 480;
        }
      }

      targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
      targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

      const targetTotalBits = targetMB * 8 * 1024 * 1024 * 0.88;
      const audioBps = 96000;
      let videoBps = Math.floor((targetTotalBits / duration) - audioBps);
      videoBps = Math.max(150000, Math.min(videoBps, 3000000));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        const sourceNode = audioCtx.createMediaElementSource(videoEl);
        const destinationNode = audioCtx.createMediaStreamDestination();
        sourceNode.connect(destinationNode);
        const audioTracks = destinationNode.stream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          combinedTracks.push(audioTracks[0]);
        }
      } catch (audioErr) {
        // Fallback without audio track if audio element source cannot be tapped
      }

      const combinedStream = new MediaStream(combinedTracks);

      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType: mimeType,
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

      recorder.onstop = function () {
        if (isStopped && chunks.length === 0) return;
        const finalBlob = new Blob(chunks, { type: "video/webm" });
        callbacks.onComplete(finalBlob);
        cleanup();
      };

      videoEl.playbackRate = 1.0;
      videoEl.currentTime = 0;

      videoEl.onplay = function () {
        recorder.start(100);

        function drawFrame() {
          if (isStopped) return;

          if (videoEl.currentTime >= duration || videoEl.ended) {
            ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
            callbacks.onProgress(98, "Finalizing compressed video...", "Attaching to Discord...");

            if (recorder && recorder.state === "recording") {
              try { recorder.requestData(); } catch (err) {}
              recorder.stop();
              combinedStream.getTracks().forEach((track) => track.stop());

              setTimeout(() => {
                if (recorder && chunks.length > 0) {
                  const finalBlob = new Blob(chunks, { type: "video/webm" });
                  callbacks.onComplete(finalBlob);
                  cleanup();
                }
              }, 400);
            }
            return;
          }

          ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
          const percent = Math.min(95, Math.max(5, (videoEl.currentTime / duration) * 95));
          const currentSec = Math.floor(videoEl.currentTime);
          const totalSec = Math.floor(duration);
          const remainingSec = Math.max(0, totalSec - currentSec);

          callbacks.onProgress(
            percent,
            `Encoding: ${currentSec}s / ${totalSec}s`,
            `HD video & audio in sync • ~${remainingSec}s left`
          );

          animFrameId = requestAnimationFrame(drawFrame);
        }

        animFrameId = requestAnimationFrame(drawFrame);
      };

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

  // Export to namespace
  window.DiscordShrink = window.DiscordShrink || {};
  window.DiscordShrink.Compressor = {
    DISCORD_LIMIT_BYTES,
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
