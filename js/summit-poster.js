(function initSummitPoster() {
  const root = document.getElementById("summit-poster");
  if (!root) return;

  const SIZE = 1024;
  const HOLE_CYAN = "#00adef";
  const HOLE = {
    corners: [
      [368, 204],
      [765, 301],
      [654, 759],
      [257, 660]
    ],
    center: [510.67, 481.5],
    angle: Math.atan2(301 - 204, 765 - 368),
    width: Math.hypot(765 - 368, 301 - 204),
    height: Math.hypot(368 - 257, 204 - 660)
  };

  const canvas = root.querySelector(".lnl-poster__canvas");
  const fallback = root.querySelector(".lnl-poster__fallback");
  const emptyNote = root.querySelector("[data-empty]");
  const fileInput = root.querySelector("#lnl-poster-file");
  const uploadLabel = root.querySelector("[data-upload-label]");
  const shareBtn = root.querySelector("[data-share]");
  const statusEl = root.querySelector("[data-status]");
  const captionSource = root.querySelector("[data-caption-source]");
  const overlaySrc = root.getAttribute("data-overlay");

  if (!canvas || !fileInput || !overlaySrc) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = new Image();
  overlay.decoding = "async";

  let overlayReady = false;
  let photo = null;
  let objectUrl = "";
  let coverScale = 1;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let pointers = new Map();
  let lastPinchDist = 0;
  let drawing = false;

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message || "";
  }

  function shareCaption() {
    return captionSource ? String(captionSource.value || "").trim() : "";
  }

  async function copyCaption(successMessage) {
    const text = shareCaption();
    if (!text) return false;

    function copyWithExecCommand() {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed";
      temp.style.top = "0";
      temp.style.left = "0";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      temp.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (error) {
        ok = false;
      }
      temp.remove();
      return ok;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else if (!copyWithExecCommand()) {
        throw new Error("copy failed");
      }
      if (successMessage) setStatus(successMessage);
      return true;
    } catch (error) {
      if (!copyWithExecCommand()) return false;
      if (successMessage) setStatus(successMessage);
      return true;
    }
  }

  function currentScale() {
    return coverScale * zoom;
  }

  function fitCover() {
    if (!photo) return 1;
    return Math.max(HOLE.width / photo.width, HOLE.height / photo.height);
  }

  function clampPan() {
    if (!photo) return;
    const scale = currentScale();
    const maxX = Math.max(0, (photo.width * scale) / 2 - HOLE.width / 2);
    const maxY = Math.max(0, (photo.height * scale) / 2 - HOLE.height / 2);
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
  }

  function toLocalDelta(dx, dy) {
    const cos = Math.cos(HOLE.angle);
    const sin = Math.sin(HOLE.angle);
    return {
      x: dx * cos + dy * sin,
      y: -dx * sin + dy * cos
    };
  }

  function pointerDistance() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function requestDraw() {
    if (drawing) return;
    drawing = true;
    requestAnimationFrame(function () {
      drawing = false;
      draw();
    });
  }

  function drawHolePath() {
    ctx.beginPath();
    HOLE.corners.forEach(function (corner, index) {
      if (index === 0) ctx.moveTo(corner[0], corner[1]);
      else ctx.lineTo(corner[0], corner[1]);
    });
    ctx.closePath();
  }

  function draw() {
    ctx.fillStyle = HOLE_CYAN;
    ctx.fillRect(0, 0, SIZE, SIZE);

    if (photo) {
      ctx.save();
      drawHolePath();
      ctx.clip();
      ctx.translate(HOLE.center[0], HOLE.center[1]);
      ctx.rotate(HOLE.angle);
      ctx.translate(panX, panY);
      ctx.scale(currentScale(), currentScale());
      ctx.drawImage(photo, -photo.width / 2, -photo.height / 2);
      ctx.restore();
    }

    if (overlayReady) {
      ctx.drawImage(overlay, 0, 0, SIZE, SIZE);
    }
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
        // Fall through to HTMLImageElement for browsers that reject HEIC/bitmap options.
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
      if (source instanceof Blob) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(source);
        image.src = objectUrl;
      } else {
        image.src = source;
      }
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setStatus("Please choose a photo (JPG, PNG, or HEIC).");
      return;
    }

    setStatus("Placing your photo…");
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

  async function posterBlob() {
    draw();
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Could not create the poster."));
      }, "image/png");
    });
  }

  async function downloadPoster() {
    if (!photo) return;
    try {
      const blob = await posterBlob();
      const fileName = "learn-n-lunch-i-will-be-there.png";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
      await copyCaption("Poster downloaded.");
    } catch (error) {
      setStatus(error.message || "Download failed. Try again.");
    }
  }

  async function sharePoster() {
    if (!photo) return;

    async function shareNative() {
      if (typeof navigator.share !== "function") return false;
      const blob = await posterBlob();
      const file = new File([blob], "learn-n-lunch-i-will-be-there.png", {
        type: "image/png"
      });
      const payload = {
        files: [file],
        title: "I'll Be There — Campus Food Security Summit",
        text: shareCaption()
      };
      if (navigator.canShare && !navigator.canShare(payload)) return false;
      await navigator.share(payload);
      return true;
    }

    try {
      const shared = await shareNative();
      if (shared) {
        await copyCaption("Poster shared.");
        return;
      }
      await downloadPoster();
    } catch (error) {
      if (error && error.name === "AbortError") return;
      await downloadPoster();
    }
  }

  canvas.hidden = true;
  setPhotoLoaded(false);

  overlay.onload = function () {
    overlayReady = true;
    if (fallback) fallback.hidden = true;
    canvas.hidden = false;
    requestDraw();
  };
  overlay.onerror = function () {
    setStatus("Could not load the poster template.");
  };
  overlay.src = overlaySrc;

  if (uploadLabel) {
    uploadLabel.setAttribute("data-upload", uploadLabel.textContent.trim());
    if (!uploadLabel.getAttribute("data-change")) {
      uploadLabel.setAttribute("data-change", "Change photo");
    }
  }

  fileInput.addEventListener("change", function () {
    const file = fileInput.files && fileInput.files[0];
    handleFile(file);
    fileInput.value = "";
  });

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      sharePoster();
    });
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
    const local = toLocalDelta(
      (event.clientX - previous.x) * scale,
      (event.clientY - previous.y) * scale
    );
    panX += local.x;
    panY += local.y;
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
      const delta = event.deltaY > 0 ? 0.94 : 1.06;
      zoom = Math.min(3, Math.max(1, zoom * delta));
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
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    handleFile(file);
  });
})();
