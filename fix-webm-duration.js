/**
 * ShrinkCord - WebM Duration Metadata Patcher
 */

(function (name, definition) {
  if (typeof define === "function" && define.amd) {
    define(definition);
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = definition();
  } else {
    window.ysFixWebmDuration = definition();
  }
})("fix-webm-duration", function () {
  "use strict";

  var sections = {
    0x8538067: { name: "Segment", type: "Container" },
    0x549a966: { name: "Info", type: "Container" },
    0xad7b1: { name: "TimecodeScale", type: "Uint" },
    0x489: { name: "Duration", type: "Float" }
  };

  function doInherit(newClass, baseClass) {
    newClass.prototype = Object.create(baseClass.prototype);
    newClass.prototype.constructor = newClass;
  }

  function padHex(hex) {
    return hex.length % 2 === 1 ? "0" + hex : hex;
  }

  function WebmBase(name, type) {
    this.name = name || "Unknown";
    this.type = type || "Unknown";
  }
  WebmBase.prototype.updateBySource = function () {};
  WebmBase.prototype.setSource = function (source) {
    this.source = source;
    this.updateBySource();
  };
  WebmBase.prototype.updateByData = function () {};
  WebmBase.prototype.setData = function (data) {
    this.data = data;
    this.updateByData();
  };

  function WebmUint(name, type) {
    WebmBase.call(this, name, type || "Uint");
  }
  doInherit(WebmUint, WebmBase);
  WebmUint.prototype.updateBySource = function () {
    this.data = "";
    for (var i = 0; i < this.source.length; i++) {
      this.data += padHex(this.source[i].toString(16));
    }
  };
  WebmUint.prototype.updateByData = function () {
    var length = this.data.length / 2;
    this.source = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
      this.source[i] = parseInt(this.data.substr(i * 2, 2), 16);
    }
  };
  WebmUint.prototype.getValue = function () {
    return parseInt(this.data, 16);
  };
  WebmUint.prototype.setValue = function (value) {
    this.setData(padHex(value.toString(16)));
  };

  function WebmFloat(name, type) {
    WebmBase.call(this, name, type || "Float");
  }
  doInherit(WebmFloat, WebmBase);
  WebmFloat.prototype.getFloatArrayType = function () {
    return this.source && this.source.length === 4 ? Float32Array : Float64Array;
  };
  WebmFloat.prototype.updateBySource = function () {
    var byteArray = this.source.slice().reverse();
    var floatArrayType = this.getFloatArrayType();
    var floatArray = new floatArrayType(byteArray.buffer);
    this.data = floatArray[0];
  };
  WebmFloat.prototype.updateByData = function () {
    var floatArrayType = this.getFloatArrayType();
    var floatArray = new floatArrayType([this.data]);
    var byteArray = new Uint8Array(floatArray.buffer);
    this.source = byteArray.reverse();
  };
  WebmFloat.prototype.getValue = function () {
    return this.data;
  };
  WebmFloat.prototype.setValue = function (value) {
    this.setData(value);
  };

  function WebmContainer(name, type) {
    WebmBase.call(this, name, type || "Container");
  }
  doInherit(WebmContainer, WebmBase);
  WebmContainer.prototype.readByte = function () {
    return this.source[this.offset++];
  };
  WebmContainer.prototype.readUint = function () {
    var firstByte = this.readByte();
    var bytes = 8 - firstByte.toString(2).length;
    var value = firstByte - (1 << (7 - bytes));
    for (var i = 0; i < bytes; i++) {
      value *= 256;
      value += this.readByte();
    }
    if (value === Math.pow(2, 7 * (bytes + 1)) - 1) {
      return -1;
    }
    return value;
  };
  WebmContainer.prototype.updateBySource = function () {
    this.data = [];
    for (this.offset = 0; this.offset < this.source.length; this.offset = end) {
      var sectionStart = this.offset;
      var id = this.readUint();
      if (id === 0xf43b675) {
        this.data.push({
          id: id,
          idHex: id.toString(16),
          raw: this.source.subarray(sectionStart)
        });
        break;
      }
      var len = this.readUint();
      var end = len === -1 ? this.source.length : Math.min(this.offset + len, this.source.length);
      var data = this.source.slice(this.offset, end);

      var info = sections[id] || { name: "Unknown", type: "Unknown" };
      var ctr = WebmBase;
      if (info.type === "Container") ctr = WebmContainer;
      else if (info.type === "Uint") ctr = WebmUint;
      else if (info.type === "Float") ctr = WebmFloat;

      var section = new ctr(info.name, info.type);
      section.setSource(data);
      this.data.push({
        id: id,
        idHex: id.toString(16),
        data: section
      });
    }
  };
  WebmContainer.prototype.writeUint = function (x, draft) {
    for (var bytes = 1, flag = 0x80; x >= flag && bytes < 8; bytes++, flag *= 0x80) {}
    if (!draft) {
      var value = flag + x;
      for (var i = bytes - 1; i >= 0; i--) {
        var c = value % 256;
        this.source[this.offset + i] = c;
        value = (value - c) / 256;
      }
    }
    this.offset += bytes;
  };
  WebmContainer.prototype.writeSections = function (draft) {
    this.offset = 0;
    for (var i = 0; i < this.data.length; i++) {
      var section = this.data[i];
      if (section.raw) {
        if (!draft) {
          this.source.set(section.raw, this.offset);
        }
        this.offset += section.raw.length;
        continue;
      }
      var content = section.data.source;
      var contentLength = content.length;
      this.writeUint(section.id, draft);
      this.writeUint(contentLength, draft);
      if (!draft) {
        this.source.set(content, this.offset);
      }
      this.offset += contentLength;
    }
    return this.offset;
  };
  WebmContainer.prototype.updateByData = function () {
    var length = this.writeSections("draft");
    this.source = new Uint8Array(length);
    this.writeSections();
  };
  WebmContainer.prototype.getSectionById = function (id) {
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].id === id) {
        return this.data[i].data;
      }
    }
    return null;
  };

  function WebmFile(source) {
    WebmContainer.call(this, "File", "File");
    this.setSource(source);
  }
  doInherit(WebmFile, WebmContainer);
  WebmFile.prototype.fixDuration = function (duration, options) {
    var logger = options && options.logger;
    if (logger === undefined) {
      logger = function (message) {
        console.log(message);
      };
    } else if (!logger) {
      logger = function () {};
    }

    var segmentSection = this.getSectionById(0x8538067);
    if (!segmentSection) {
      logger("[fix-webm-duration] Segment section is missing");
      return false;
    }

    var infoSection = segmentSection.getSectionById(0x549a966);
    if (!infoSection) {
      logger("[fix-webm-duration] Info section is missing");
      return false;
    }

    var timeScaleSection = infoSection.getSectionById(0xad7b1);
    if (!timeScaleSection) {
      logger("[fix-webm-duration] TimecodeScale section is missing");
      return false;
    }

    var durationSection = infoSection.getSectionById(0x489);
    if (durationSection) {
      if (durationSection.getValue() <= 0) {
        logger("[fix-webm-duration] Duration section is present, but the value is " + durationSection.getValue());
        durationSection.setValue(duration);
      } else {
        logger("[fix-webm-duration] Duration section is present, and the value is " + durationSection.getValue());
        return false;
      }
    } else {
      logger("[fix-webm-duration] Duration section is missing");
      durationSection = new WebmFloat("Duration", "Float");
      durationSection.setValue(duration);
      infoSection.data.push({
        id: 0x489,
        data: durationSection
      });
    }

    timeScaleSection.setValue(1000000);
    infoSection.updateByData();
    segmentSection.updateByData();
    this.updateByData();

    return true;
  };
  WebmFile.prototype.toBlob = function (mimeType) {
    return new Blob([this.source], { type: mimeType || "video/webm" });
  };

  function fixWebmDuration(blob, duration, callback, options) {
    if (typeof callback === "object") {
      options = callback;
      callback = undefined;
    }

    if (!callback) {
      return new Promise(function (resolve) {
        fixWebmDuration(blob, duration, resolve, options);
      });
    }

    try {
      var reader = new FileReader();
      reader.onloadend = function () {
        try {
          var file = new WebmFile(new Uint8Array(reader.result));
          if (file.fixDuration(duration, options)) {
            blob = file.toBlob(blob.type);
          }
        } catch (ex) {}
        callback(blob);
      };
      reader.readAsArrayBuffer(blob);
    } catch (ex) {
      callback(blob);
    }
  }

  fixWebmDuration.default = fixWebmDuration;
  return fixWebmDuration;
});
