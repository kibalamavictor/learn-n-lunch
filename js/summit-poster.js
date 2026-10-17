(function initSummitPoster() {
  const root = document.getElementById("summit-poster");
  if (!root) return;

  const SIZE = 1024;
  const HOLE_CYAN = "#00adef";
  const HOLE = {
    corners: [
      [370, 210],
      [759, 304],
      [651, 753],
      [262, 659]
    ],
    center: [510.67, 481.54],
    angle: Math.atan2(304 - 210, 759 - 370),
    width: Math.hypot(759 - 370, 304 - 210),
    height: Math.hypot(370 - 262, 210 - 659)
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
  let rotation = 0;
  let pointers = new Map();
  let lastPinchDist = 0;
  let lastPinchAngle = 0;
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
    const w = photo.width * scale;
    const h = photo.height * scale;
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    const boundW = w * cos + h * sin;
    const boundH = w * sin + h * cos;
    const maxX = Math.max(0, boundW / 2 - HOLE.width / 2);
    const maxY = Math.max(0, boundH / 2 - HOLE.height / 2);
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

  function pointerAngle() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return 0;
    return Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
  }

  function shortestAngleDelta(from, to) {
    let delta = to - from;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  function resetPinchState() {
    lastPinchDist = 0;
    lastPinchAngle = 0;
  }

  function applyPinchGesture(points) {
    const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    const angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
    if (lastPinchDist > 0) {
      zoom = Math.min(3, Math.max(1, zoom * (dist / lastPinchDist)));
      rotation += shortestAngleDelta(lastPinchAngle, angle);
      clampPan();
      requestDraw();
    }
    lastPinchDist = dist;
    lastPinchAngle = angle;
  }

  function applyPanClientDelta(dx, dy) {
    const rect = canvas.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const local = toLocalDelta(dx * scale, dy * scale);
    panX += local.x;
    panY += local.y;
    clampPan();
    requestDraw();
  }

  function holeCenterOnScreen(rect) {
    return {
      x: rect.left + (HOLE.center[0] / SIZE) * rect.width,
      y: rect.top + (HOLE.center[1] / SIZE) * rect.height
    };
  }

  function applyRotateClient(prevX, prevY, x, y) {
    const rect = canvas.getBoundingClientRect();
    const center = holeCenterOnScreen(rect);
    const a0 = Math.atan2(prevY - center.y, prevX - center.x);
    const a1 = Math.atan2(y - center.y, x - center.x);
    rotation += shortestAngleDelta(a0, a1);
    clampPan();
    requestDraw();
  }

  let singleTouchId = null;
  let lastTouchPan = null;

  function requestDraw() {
    if (drawing) return;
    drawing = true;
    requestAnimationFrame(function () {
      drawing = false;
      draw();
    });
  }

  function draw() {
    ctx.fillStyle = photo ? "#ffffff" : HOLE_CYAN;
    ctx.fillRect(0, 0, SIZE, SIZE);

    if (photo) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.translate(HOLE.center[0], HOLE.center[1]);
      ctx.rotate(HOLE.angle);
      ctx.beginPath();
      const pad = 16;
      ctx.rect(
        -HOLE.width / 2 - pad,
        -HOLE.height / 2 - pad,
        HOLE.width + pad * 2,
        HOLE.height + pad * 2
      );
      ctx.clip();
      ctx.translate(panX, panY);
      ctx.rotate(rotation);
      ctx.scale(currentScale(), currentScale());
      ctx.drawImage(photo, -photo.width / 2, -photo.height / 2);
      ctx.restore();
    }

    if (overlayReady) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (overlay.naturalWidth === SIZE && overlay.naturalHeight === SIZE) {
        ctx.drawImage(overlay, 0, 0);
      } else {
        ctx.drawImage(overlay, 0, 0, SIZE, SIZE);
      }
      ctx.restore();
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
      rotation = 0;
      setPhotoLoaded(true);
      requestDraw();
      setStatus("Drag to move. Pinch with two fingers to zoom and rotate.");
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

  canvas.addEventListener(
    "touchstart",
    function (event) {
      if (!photo) return;
      event.preventDefault();
      if (event.touches.length >= 2) {
        singleTouchId = null;
        lastTouchPan = null;
        const t0 = event.touches[0];
        const t1 = event.touches[1];
        lastPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        lastPinchAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      } else if (event.touches.length === 1) {
        resetPinchState();
        singleTouchId = event.touches[0].identifier;
        lastTouchPan = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    function (event) {
      if (!photo) return;
      event.preventDefault();
      if (event.touches.length >= 2) {
        singleTouchId = null;
        lastTouchPan = null;
        const t0 = event.touches[0];
        const t1 = event.touches[1];
        applyPinchGesture([
          { x: t0.clientX, y: t0.clientY },
          { x: t1.clientX, y: t1.clientY }
        ]);
        return;
      }
      if (
        event.touches.length === 1 &&
        singleTouchId === event.touches[0].identifier &&
        lastTouchPan
      ) {
        const t = event.touches[0];
        applyPanClientDelta(t.clientX - lastTouchPan.x, t.clientY - lastTouchPan.y);
        lastTouchPan = { x: t.clientX, y: t.clientY };
      }
    },
    { passive: false }
  );

  function endTouch(event) {
    if (event.touches.length < 2) resetPinchState();
    if (event.touches.length === 1) {
      singleTouchId = event.touches[0].identifier;
      lastTouchPan = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else {
      singleTouchId = null;
      lastTouchPan = null;
    }
  }

  canvas.addEventListener("touchend", endTouch, { passive: false });
  canvas.addEventListener("touchcancel", function (event) {
    resetPinchState();
    singleTouchId = null;
    lastTouchPan = null;
    endTouch(event);
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (!photo || event.pointerType === "touch") return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      rotate: event.shiftKey
    });
    if (pointers.size === 2) {
      lastPinchDist = pointerDistance();
      lastPinchAngle = pointerAngle();
    }
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!photo || event.pointerType === "touch" || !pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId);
    const rotateDrag = previous.rotate || event.shiftKey;
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      rotate: rotateDrag
    });

    if (pointers.size >= 2) {
      applyPinchGesture(Array.from(pointers.values()));
      return;
    }

    if (rotateDrag) {
      applyRotateClient(previous.x, previous.y, event.clientX, event.clientY);
      return;
    }

    applyPanClientDelta(event.clientX - previous.x, event.clientY - previous.y);
  });

  function endPointer(event) {
    if (event.pointerType === "touch") return;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) resetPinchState();
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener(
    "wheel",
    function (event) {
      if (!photo) return;
      event.preventDefault();
      if (event.shiftKey) {
        rotation += event.deltaY * -0.004;
        clampPan();
        requestDraw();
        return;
      }
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
