(function initBirthdayCard() {
  const root = document.getElementById("birthday-card");
  if (!root) return;

  const SIZE = 1024;
  const YELLOW = "#f6c33c";
  const GREEN = "#2F9F82";
  const PURPLE = "#996efc";
  const NAVY = "#1c1140";

  const LOGO = { x: 72, y: 44, width: 220 };
  const TITLE = { x: 92, top: 200, maxWidth: 400, maxSize: 100, minSize: 60 };
  const BODY = { x: 92, maxWidth: 380, bottom: 700, maxSize: 30, minSize: 20 };
  const FRAME = { x: 512, y: 200, width: 408, height: 500, pad: 14 };
  const PHOTO = {
    x: FRAME.x + FRAME.pad,
    y: FRAME.y + FRAME.pad,
    width: FRAME.width - FRAME.pad * 2,
    height: FRAME.height - FRAME.pad * 2
  };
  // Curved arc band: circle centre sits above the card, the arc dips through the
  // bottom-left and sweeps up past the photo frame to exit at the top-right.
  // Curved band, thickness ~85 like the reference artwork. The circle enters at
  // the left edge (~y 820), bottoms out around y 855, and leaves through the
  // middle of the right edge (~y 520). The sweep is deliberately wider than the
  // canvas so the band is always clipped by the edges rather than stopping short.
  const RIBBON = {
    cx: 266,
    cy: -170,
    radius: 1025,
    height: 88,
    startAngle: Math.PI * 0.68, // ~122°, well past the left edge
    endAngle: Math.PI * 0.18, // ~32°, well past the right edge
    textCenter: Math.PI * 0.4, // ~72°, midpoint of the visible sweep
    textMaxArc: 1110,
    textSize: 92
  };
  const HASHTAG = { right: 985, bottom: 962, padX: 22, padY: 14, size: 26 };
  const CRACKS = [
    [0, 120, 420, 260],
    [120, 0, 300, 180],
    [380, 0, 480, 120],
    [700, 0, 560, 160],
    [760, 0, 880, 140],
    [1024, 60, 760, 300],
    [1024, 300, 940, 470],
    [0, 880, 120, 760],
    [0, 1024, 300, 780],
    [200, 1024, 380, 860],
    [560, 1024, 650, 880],
    [1024, 720, 880, 860]
  ];

  const canvas = root.querySelector(".lnl-poster__canvas");
  const emptyNote = root.querySelector("[data-empty]");
  const fileInput = root.querySelector("#lnl-card-file");
  const uploadLabel = root.querySelector("[data-upload-label]");
  const shareBtn = root.querySelector("[data-share]");
  const statusEl = root.querySelector("[data-status]");
  const fields = root.querySelector("[data-card-fields]");
  const swatchWrap = root.querySelector("[data-swatches]");
  const logoSrc = root.getAttribute("data-logo");

  if (!canvas || !fileInput || !fields) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const logo = new Image();
  logo.decoding = "async";

  let logoReady = false;
  let photo = null;
  let objectUrl = "";
  let coverScale = 1;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let pointers = new Map();
  let lastPinchDist = 0;
  let drawing = false;
  let bg = swatchWrap ? swatchWrap.querySelector(".is-active")?.getAttribute("data-swatch") || PURPLE : PURPLE;

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message || "";
  }

  function fieldValue(name) {
    const el = fields.querySelector('[data-field="' + name + '"]');
    return el ? String(el.value || "") : "";
  }

  // ---------- colour helpers ----------

  function hexToRgb(hex) {
    const clean = String(hex || "").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return { r: 153, g: 110, b: 252 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function hueSat(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rr) h = ((gg - bb) / d) % 6;
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    return { h, s };
  }

  function palette() {
    const L = luminance(bg);
    const { h, s } = hueSat(bg);
    const yellowish = s > 0.45 && h >= 35 && h <= 65 && L > 0.35;
    const greenish = s > 0.3 && h >= 120 && h <= 200;
    const accent = yellowish ? "#ffffff" : YELLOW;
    return {
      title: L > 0.5 ? "#111111" : "#ffffff",
      body: L > 0.12 ? NAVY : "#ffffff",
      highlight: yellowish ? GREEN : accent,
      ribbon: greenish ? PURPLE : GREEN,
      ribbonText: "#ffffff",
      accent,
      hashtagBox: accent,
      hashtagText: "#111111",
      crack: L < 0.05 ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.85)",
      placeholder: L > 0.5 ? "#f2f2f2" : "#e6e0fb"
    };
  }

  // ---------- text helpers ----------

  function tokenize(paragraph) {
    const tokens = [];
    const parts = paragraph.split(/(\*[^*]+\*)/g);
    parts.forEach(function (part) {
      if (!part) return;
      const hl = part.length > 2 && part[0] === "*" && part[part.length - 1] === "*";
      const text = hl ? part.slice(1, -1) : part;
      text.split(/\s+/).forEach(function (word) {
        if (word) tokens.push({ text: word, hl });
      });
    });
    return tokens;
  }

  function fontFor(size, hl) {
    return hl ? "italic 700 " + size + "px Montserrat, Nunito, sans-serif" : "italic 600 " + size + "px Montserrat, Nunito, sans-serif";
  }

  function wrapTokens(tokens, size, maxWidth) {
    const lines = [];
    let line = [];
    let width = 0;
    ctx.font = fontFor(size, false);
    const space = ctx.measureText(" ").width;
    tokens.forEach(function (token) {
      ctx.font = fontFor(size, token.hl);
      const w = ctx.measureText(token.text).width;
      const next = line.length ? width + space + w : w;
      if (line.length && next > maxWidth) {
        lines.push(line);
        line = [Object.assign({ w }, token)];
        width = w;
      } else {
        line.push(Object.assign({ w }, token));
        width = next;
      }
    });
    if (line.length) lines.push(line);
    return lines;
  }

  function layoutBody(text, top) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
    const available = BODY.bottom - top;
    for (let size = BODY.maxSize; size >= BODY.minSize; size -= 1) {
      const lineHeight = size * 1.26;
      const gap = size * 0.7;
      const blocks = paragraphs.map((p) => wrapTokens(tokenize(p), size, BODY.maxWidth));
      const lineCount = blocks.reduce((n, b) => n + b.length, 0);
      const height = lineCount * lineHeight + Math.max(0, blocks.length - 1) * gap;
      if (height <= available || size === BODY.minSize) {
        return { size, lineHeight, gap, blocks, height };
      }
    }
    return { size: BODY.minSize, lineHeight: BODY.minSize * 1.26, gap: 0, blocks: [], height: 0 };
  }

  function titleFont(size) {
    return "400 " + size + "px Grobold, Nunito, sans-serif";
  }

  function wrapPlain(text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(function (word) {
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function layoutTitle(text) {
    for (let size = TITLE.maxSize; size >= TITLE.minSize; size -= 2) {
      ctx.font = titleFont(size);
      const lines = wrapPlain(text, TITLE.maxWidth);
      const fits = lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= TITLE.maxWidth);
      if (fits || size === TITLE.minSize) {
        return { size, lines: lines.slice(0, 3), lineHeight: size * 0.98 };
      }
    }
    return { size: TITLE.minSize, lines: [text], lineHeight: TITLE.minSize };
  }

  // ---------- drawing ----------

  function drawCracks(colors) {
    ctx.save();
    ctx.strokeStyle = colors.crack;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    CRACKS.forEach(function (seg) {
      ctx.beginPath();
      ctx.moveTo(seg[0], seg[1]);
      ctx.lineTo(seg[2], seg[3]);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawSparkle(x, y, scale, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    [-0.55, 0, 0.55].forEach(function (a) {
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * 14, -Math.cos(a) * 14);
      ctx.lineTo(Math.sin(a) * 40, -Math.cos(a) * 40);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, size * 0.9);
    ctx.bezierCurveTo(-size * 1.4, -size * 0.1, -size * 0.7, -size * 1.1, 0, -size * 0.35);
    ctx.bezierCurveTo(size * 0.7, -size * 1.1, size * 1.4, -size * 0.1, 0, size * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 1.9, 0);
    ctx.lineTo(-size * 2.6, -size * 0.2);
    ctx.moveTo(size * 1.9, 0);
    ctx.lineTo(size * 2.6, -size * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLogo() {
    if (!logoReady) return;
    const ratio = logo.naturalHeight / logo.naturalWidth || 0.43;
    ctx.drawImage(logo, LOGO.x, LOGO.y, LOGO.width, LOGO.width * ratio);
  }

  function drawTitle(colors) {
    const text = fieldValue("title").trim();
    if (!text) return TITLE.top;
    const layout = layoutTitle(text);
    ctx.save();
    ctx.fillStyle = colors.title;
    ctx.font = titleFont(layout.size);
    ctx.textBaseline = "alphabetic";
    let y = TITLE.top + layout.size * 0.82;
    layout.lines.forEach(function (line) {
      ctx.fillText(line, TITLE.x, y);
      y += layout.lineHeight;
    });
    ctx.restore();
    return TITLE.top + layout.lines.length * layout.lineHeight;
  }

  function drawBody(colors, top) {
    const text = fieldValue("message");
    if (!text.trim()) return top;
    const layout = layoutBody(text, top + 26);
    ctx.save();
    ctx.textBaseline = "alphabetic";
    let y = top + 26 + layout.size;
    ctx.font = fontFor(layout.size, false);
    const space = ctx.measureText(" ").width;
    layout.blocks.forEach(function (lines, index) {
      lines.forEach(function (line) {
        let x = BODY.x;
        line.forEach(function (token, i) {
          ctx.font = fontFor(layout.size, token.hl);
          ctx.fillStyle = token.hl ? colors.highlight : colors.body;
          ctx.fillText(token.text, x, y);
          x += token.w + (i < line.length - 1 ? space : 0);
        });
        y += layout.lineHeight;
      });
      if (index < layout.blocks.length - 1) y += layout.gap;
    });
    ctx.restore();
    return y - layout.lineHeight + layout.size * 0.3;
  }

  function drawPhotoFrame(colors) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO.x, PHOTO.y, PHOTO.width, PHOTO.height);
    ctx.clip();
    if (photo) {
      ctx.translate(PHOTO.x + PHOTO.width / 2, PHOTO.y + PHOTO.height / 2);
      ctx.translate(panX, panY);
      ctx.scale(currentScale(), currentScale());
      ctx.drawImage(photo, -photo.width / 2, -photo.height / 2);
    } else {
      ctx.fillStyle = colors.placeholder;
      ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.width, PHOTO.height);
    }
    ctx.restore();
  }

  function drawRibbon(colors) {
    const text = fieldValue("ribbon").trim();
    ctx.save();
    ctx.beginPath();
    ctx.arc(RIBBON.cx, RIBBON.cy, RIBBON.radius, RIBBON.endAngle, RIBBON.startAngle);
    ctx.strokeStyle = colors.ribbon;
    ctx.lineWidth = RIBBON.height;
    ctx.lineCap = "butt";
    ctx.stroke();

    if (text) {
      let size = RIBBON.textSize;
      ctx.font = "700 " + size + "px Nunito, sans-serif";
      while (ctx.measureText(text).width > RIBBON.textMaxArc && size > 36) {
        size -= 2;
        ctx.font = "700 " + size + "px Nunito, sans-serif";
      }
      const chars = Array.from(text);
      const widths = chars.map(function (ch) {
        return ctx.measureText(ch).width;
      });
      const total = widths.reduce(function (sum, w) {
        return sum + w;
      }, 0);
      // Glyphs sit inside the arc with their tops pointing at the circle centre,
      // so the baseline radius is pushed slightly outward to centre the text.
      const baseline = RIBBON.radius + size * 0.34;
      ctx.fillStyle = colors.ribbonText;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      // Reading left to right means walking the circle clockwise in screen
      // space, i.e. decreasing angle.
      let angle = RIBBON.textCenter + total / 2 / baseline;
      chars.forEach(function (ch, i) {
        const half = widths[i] / 2 / baseline;
        angle -= half;
        const x = RIBBON.cx + Math.cos(angle) * baseline;
        const y = RIBBON.cy + Math.sin(angle) * baseline;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        angle -= half;
      });
    }
    ctx.restore();
  }

  function drawHashtags(colors) {
    const raw = fieldValue("hashtags").trim();
    if (!raw) return;
    const tags = raw.split(/\s+/).filter(Boolean);
    const lines = [];
    if (tags.length <= 1) {
      lines.push(tags.join(" "));
    } else {
      const half = Math.ceil(tags.length / 2);
      lines.push(tags.slice(0, half).join(" "));
      lines.push(tags.slice(half).join(" "));
    }

    ctx.save();
    ctx.font = "700 " + HASHTAG.size + "px Nunito, sans-serif";
    const textWidth = Math.max.apply(null, lines.map((l) => ctx.measureText(l).width));
    const lineHeight = HASHTAG.size * 1.25;
    const boxW = Math.min(520, textWidth + HASHTAG.padX * 2);
    const boxH = lines.length * lineHeight + HASHTAG.padY * 2;
    const x = HASHTAG.right - boxW;
    const y = HASHTAG.bottom - boxH;

    ctx.fillStyle = "#111111";
    ctx.fillRect(x + 7, y + 7, boxW, boxH);
    ctx.fillStyle = colors.hashtagBox;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111111";
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = colors.hashtagText;
    ctx.textBaseline = "alphabetic";
    let ty = y + HASHTAG.padY + HASHTAG.size * 0.9;
    lines.forEach(function (line) {
      ctx.fillText(line, x + HASHTAG.padX, ty);
      ty += lineHeight;
    });
    ctx.restore();
  }

  function draw() {
    const colors = palette();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);
    drawCracks(colors);
    drawLogo();

    drawSparkle(56, 290, 1, -0.5, colors.accent);
    drawSparkle(430, 236, 0.8, 0.9, colors.accent);
    drawSparkle(944, 150, 1, 0.4, colors.accent);

    const titleBottom = drawTitle(colors);
    const bodyBottom = drawBody(colors, titleBottom);
    drawHeart(200, Math.min(bodyBottom + 62, 760), 22, colors.accent);

    drawPhotoFrame(colors);
    drawRibbon(colors);
    drawHashtags(colors);
  }

  function requestDraw() {
    if (drawing) return;
    drawing = true;
    requestAnimationFrame(function () {
      drawing = false;
      draw();
    });
  }

  // ---------- photo handling ----------

  function currentScale() {
    return coverScale * zoom;
  }

  function fitCover() {
    if (!photo) return 1;
    return Math.max(PHOTO.width / photo.width, PHOTO.height / photo.height);
  }

  function clampPan() {
    if (!photo) return;
    const scale = currentScale();
    const maxX = Math.max(0, (photo.width * scale) / 2 - PHOTO.width / 2);
    const maxY = Math.max(0, (photo.height * scale) / 2 - PHOTO.height / 2);
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
  }

  function pointerDistance() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function setPhotoLoaded(loaded) {
    root.classList.toggle("is-loaded", loaded);
    if (shareBtn) shareBtn.disabled = !loaded;
    if (emptyNote) emptyNote.hidden = loaded;
    if (uploadLabel) {
      uploadLabel.textContent = loaded
        ? uploadLabel.getAttribute("data-change") || "Change photo"
        : uploadLabel.getAttribute("data-upload") || "Upload photo";
    }
  }

  async function loadImage(source) {
    if (typeof createImageBitmap === "function" && source instanceof Blob) {
      try {
        return await createImageBitmap(source, { imageOrientation: "from-image" });
      } catch (error) {
        // Fall through to HTMLImageElement.
      }
    }
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("Could not read that image. Try a JPG or PNG."));
      };
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(source);
      image.src = objectUrl;
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setStatus("Please choose a photo (JPG, PNG, or HEIC).");
      return;
    }
    setStatus("Placing the photo…");
    try {
      const image = await loadImage(file);
      if (photo && typeof photo.close === "function") photo.close();
      photo = image;
      coverScale = fitCover();
      zoom = 1;
      panX = 0;
      panY = 0;
      setPhotoLoaded(true);
      requestDraw();
      setStatus("Drag to position, then share.");
    } catch (error) {
      setStatus(error.message || "Could not read that image. Try a JPG or PNG.");
    }
  }

  // ---------- share ----------

  function shareCaption() {
    const title = fieldValue("title").trim();
    const message = fieldValue("message").replace(/\*/g, "").trim();
    const hashtags = fieldValue("hashtags").trim();
    return [title, message, hashtags].filter(Boolean).join("\n\n");
  }

  async function copyCaption(successMessage) {
    const text = shareCaption();
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("no clipboard");
      }
      if (successMessage) setStatus(successMessage);
      return true;
    } catch (error) {
      if (successMessage) setStatus(successMessage);
      return false;
    }
  }

  async function cardBlob() {
    draw();
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Could not create the card."));
      }, "image/png");
    });
  }

  async function downloadCard() {
    try {
      const blob = await cardBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "learn-n-lunch-birthday-card.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
      await copyCaption("Card downloaded.");
    } catch (error) {
      setStatus(error.message || "Download failed. Try again.");
    }
  }

  async function shareCard() {
    if (!photo) return;
    async function shareNative() {
      if (typeof navigator.share !== "function") return false;
      const blob = await cardBlob();
      const file = new File([blob], "learn-n-lunch-birthday-card.png", { type: "image/png" });
      const payload = { files: [file], title: fieldValue("title").trim() || "Birthday card", text: shareCaption() };
      if (navigator.canShare && !navigator.canShare(payload)) return false;
      await navigator.share(payload);
      return true;
    }
    try {
      const shared = await shareNative();
      if (shared) {
        await copyCaption("Card shared.");
        return;
      }
      await downloadCard();
    } catch (error) {
      if (error && error.name === "AbortError") return;
      await downloadCard();
    }
  }

  // ---------- wiring ----------

  function setBackground(color, source) {
    bg = color;
    if (swatchWrap) {
      swatchWrap.querySelectorAll("[data-swatch]").forEach(function (button) {
        const on = source === button;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    requestDraw();
  }

  setPhotoLoaded(false);
  draw();

  if (logoSrc) {
    logo.onload = function () {
      logoReady = true;
      requestDraw();
    };
    logo.src = logoSrc;
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load("400 100px Grobold"),
      document.fonts.load("700 100px Nunito"),
      document.fonts.load("italic 600 30px Montserrat"),
      document.fonts.load("italic 700 30px Montserrat")
    ])
      .then(requestDraw)
      .catch(requestDraw);
    document.fonts.ready.then(requestDraw);
  }

  if (uploadLabel) {
    uploadLabel.setAttribute("data-upload", uploadLabel.textContent.trim());
  }

  fields.addEventListener("input", requestDraw);
  fields.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  if (swatchWrap) {
    swatchWrap.addEventListener("click", function (event) {
      const button = event.target.closest("[data-swatch]");
      if (!button) return;
      setBackground(button.getAttribute("data-swatch"), button);
    });
  }

  fileInput.addEventListener("change", function () {
    handleFile(fileInput.files && fileInput.files[0]);
    fileInput.value = "";
  });

  if (shareBtn) {
    shareBtn.addEventListener("click", shareCard);
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (!photo) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) lastPinchDist = pointerDistance();
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!photo || !pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const dist = pointerDistance();
      if (lastPinchDist > 0) {
        zoom = Math.min(3, Math.max(1, zoom * (dist / lastPinchDist)));
        clampPan();
        requestDraw();
      }
      lastPinchDist = dist;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scale = SIZE / rect.width;
    panX += (event.clientX - previous.x) * scale;
    panY += (event.clientY - previous.y) * scale;
    clampPan();
    requestDraw();
  });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) lastPinchDist = 0;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener(
    "wheel",
    function (event) {
      if (!photo) return;
      event.preventDefault();
      zoom = Math.min(3, Math.max(1, zoom * (event.deltaY > 0 ? 0.94 : 1.06)));
      clampPan();
      requestDraw();
    },
    { passive: false }
  );

  canvas.addEventListener("dragover", function (event) {
    event.preventDefault();
  });
  canvas.addEventListener("drop", function (event) {
    event.preventDefault();
    handleFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
  });
})();
