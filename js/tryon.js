import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

export async function initTryOn() {
    const video = document.getElementById("tryonVideo");
    const canvas = document.getElementById("tryonCanvas");
    const loader = document.getElementById("tryonLoader");
    const message = document.getElementById("tryonMessage");
    const overlay = document.getElementById("tryonOverlay");
    const startBtn = document.getElementById("tryonStart");
    const captureBtn = document.getElementById("tryonCapture");
    const styleButtons = document.querySelectorAll(".tryon__style");
    const guide = document.getElementById("tryonGuide");

    // Preview elements
    const preview = document.getElementById("tryonPreview");
    const previewImg = document.getElementById("tryonPreviewImg");
    const retakeBtn = document.getElementById("tryonRetake");
    const downloadBtn = document.getElementById("tryonDownload");

    console.log("Initializing Try-On (ES Modules)...", {
        video: !!video,
        canvas: !!canvas,
        loader: !!loader,
        startBtn: !!startBtn,
        overlay: !!overlay,
        preview: !!preview
    });

    if (!video || !canvas) {
        console.error("Try-On: Missing elements.", { video: !!video, canvas: !!canvas });
        return;
    }

    const state = {
        faceLandmarker: null,
        results: null,
        currentStyle: "natural",
        isFrozen: false,
        lastVideoTime: -1,
        capturedBaseFrame: null,
        capturedLandmarks: null,
        prevLandmarks: null,
        isDebug: false
    };

    const lashStyles = {
        natural: { density: 45, fiberLength: 0.1, thickness: 0.8, opacity: 0.75, params: { centerScale: 1.1, flareScale: 1.2 } },
        softglam: { density: 75, fiberLength: 0.18, thickness: 1.0, opacity: 0.84, params: { centerScale: 1.2, flareScale: 1.6 } },
        wispy: { density: 60, fiberLength: 0.22, thickness: 0.9, opacity: 0.80, params: { spikes: true, randomLength: true, flareScale: 1.5 } },
        dolleye: { density: 85, fiberLength: 0.25, thickness: 1.1, opacity: 0.88, params: { centerScale: 1.8, flareScale: 1.1 } }
    };

    const ctx = canvas.getContext("2d");
    const alpha = 0.5; // Slightly more smoothing for premium stability

    /**
     * Initialize MediaPipe Face Landmarker
     */
    async function createFaceLandmarker() {
        if (state.faceLandmarker) return;
        console.log("Creating Face Landmarker...");
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            state.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1,
                refineLandmarks: true // V6.0: Activate sub-pixel iris/eye/lip mesh
            });
            console.log("Face Landmarker created.");
            loader.style.display = "none";
        } catch (err) {
            console.error("Face Landmarker Error:", err);
            throw err;
        }
    }

    /**
     * Start Camera Stream
     */
    async function startCamera() {
        console.log("Starting camera...");
        loader.style.display = "flex";
        try {
            await createFaceLandmarker();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            video.srcObject = stream;
            video.style.display = "block";

            video.addEventListener("loadeddata", () => {
                console.log("Video data loaded, starting prediction loop.");
                predictWebcam();
            });

            overlay.classList.add("is-hidden");
            captureBtn.disabled = true; // Initially disabled until centered
            guide.style.display = "flex";
        } catch (err) {
            console.error("Try-On Error:", err);
            alert("No se pudo iniciar la experiencia. Por favor, verifica los permisos de la cámara.");
            loader.style.display = "none";
        }
    }

    /**
     * Detection Loop
     */
    async function predictWebcam() {
        if (state.isFrozen) return;

        if (video.videoWidth === 0) {
            window.requestAnimationFrame(predictWebcam);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let startTimeMs = performance.now();
        if (state.lastVideoTime !== video.currentTime) {
            state.lastVideoTime = video.currentTime;
            state.results = state.faceLandmarker.detectForVideo(video, startTimeMs);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.results && state.results.faceLandmarks && state.results.faceLandmarks.length > 0) {
            const landmarks = state.results.faceLandmarks[0];

            // Centering check
            const isCentered = checkFaceCentering(landmarks);

            if (isCentered) {
                message.classList.add("is-hidden");
            } else {
                message.classList.remove("is-hidden");
                message.querySelector("p").innerText = "Alinea tu rostro con la guía ✨";
            }

            // Apply smoothing to landmarks
            const smoothedLandmarks = smoothLandmarks(landmarks);
            drawLashes(smoothedLandmarks);

            if (state.isDebug) {
                drawDebug(smoothedLandmarks);
            }
        } else {
            message.classList.remove("is-hidden");
            message.querySelector("p").innerText = "Ac&eacute;rcate un poco a la c&aacute;mara ✨";
            captureBtn.disabled = true;
            guide.classList.remove("is-centered");
        }

        if (video.srcObject && !state.isFrozen) {
            window.requestAnimationFrame(predictWebcam);
        }
    }

    function drawDebug(landmarks) {
        ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
        // Anatomical indices (Left: 33, 160, 158, 133 | Right: 263, 387, 385, 362)
        const indices = [33, 160, 158, 133, 263, 387, 385, 362];
        indices.forEach(i => {
            const p = landmarks[i];
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Check if Face is within the Guide
     */
    function checkFaceCentering(landmarks) {
        // IDs: 1 (nose tip), 10 (top), 152 (bottom), 234 (left), 454 (right)
        const nose = landmarks[1];
        const right = landmarks[454];
        const left = landmarks[234];

        // Nose should be near the center of the frame (0.5, 0.5)
        // Mediapipe coordinates are 0-1
        const noseCenteredX = Math.abs(nose.x - 0.5) < 0.1;
        const noseCenteredY = Math.abs(nose.y - 0.5) < 0.15;

        const faceWidth = Math.abs(right.x - left.x);
        const sizeCorrect = faceWidth > 0.25 && faceWidth < 0.5;

        const isOk = noseCenteredX && noseCenteredY && sizeCorrect;

        if (isOk) {
            guide.classList.add("is-centered");
            captureBtn.disabled = false;
        } else {
            guide.classList.remove("is-centered");
            captureBtn.disabled = true;
        }
        return isOk;
    }

    /**
     * Landmark Smoothing (EMA)
     */
    function smoothLandmarks(current) {
        if (!state.prevLandmarks) {
            state.prevLandmarks = current;
            return current;
        }
        const smoothed = current.map((lm, i) => ({
            x: alpha * lm.x + (1 - alpha) * state.prevLandmarks[i].x,
            y: alpha * lm.y + (1 - alpha) * state.prevLandmarks[i].y,
            z: alpha * lm.z + (1 - alpha) * state.prevLandmarks[i].z
        }));
        state.prevLandmarks = smoothed;
        return smoothed;
    }

    /**
     * Draw Lashes on a specific context
     */
    function drawLashes(landmarks, targetCtx = ctx, w = canvas.width, h = canvas.height, isM = false) {
        const style = lashStyles[state.currentStyle] || lashStyles.natural;

        // ANATOMICAL LANDMARKS (User Required)
        // Left Eye: 33 -> 160 -> 158 -> 133
        // Right Eye: 263 -> 387 -> 385 -> 362
        const leftEyeLashLine = [33, 160, 158, 133];
        const rightEyeLashLine = [263, 387, 385, 362];

        // Screen positioning check for flare
        const rOnLeft = isM ? false : true;
        const lOnLeft = isM ? true : false;

        // Calculate normalized openness
        // L: 159-145, R: 386-374
        const opennessR = Math.abs(landmarks[159].y - landmarks[145].y);
        const opennessL = Math.abs(landmarks[386].y - landmarks[374].y);

        // Base eye scale for normalization
        const eyeWidthR = Math.abs(landmarks[133].x - landmarks[33].x);
        const eyeWidthL = Math.abs(landmarks[362].x - landmarks[263].x);

        const normOpenR = Math.min(1, opennessR / (eyeWidthR * 0.45));
        const normOpenL = Math.min(1, opennessL / (eyeWidthL * 0.45));

        // V6.0: Two-Pass Rendering (Shadows then Fibers)
        drawAnatomicalLashes(landmarks, rightEyeLashLine, style, rOnLeft, normOpenR, targetCtx, w, h, true);
        drawAnatomicalLashes(landmarks, leftEyeLashLine, style, lOnLeft, normOpenL, targetCtx, w, h, true);

        drawAnatomicalLashes(landmarks, rightEyeLashLine, style, rOnLeft, normOpenR, targetCtx, w, h, false);
        drawAnatomicalLashes(landmarks, leftEyeLashLine, style, lOnLeft, normOpenL, targetCtx, w, h, false);

        targetCtx.shadowBlur = 0;
    }

    function drawAnatomicalLashes(landmarks, indices, style, onLeft, normOpen, targetCtx, w, h, isShadowPass = false) {
        const pts = indices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
        const density = style.density;

        const eyeWidth = Math.sqrt(Math.pow(pts[pts.length - 1].x - pts[0].x, 2) + Math.pow(pts[pts.length - 1].y - pts[0].y, 2));
        const baseLen = eyeWidth * style.fiberLength * Math.max(0.1, normOpen);

        for (let i = 0; i < density; i++) {
            const t = i / (density - 1);
            const pos = getPointOnPolyline(pts, t);
            const x = pos.x;
            const y = pos.y;

            const nextPos = getPointOnPolyline(pts, Math.min(1, t + 0.01));
            const angleBase = Math.atan2(nextPos.y - y, nextPos.x - x);
            let angle = angleBase - Math.PI / 2;
            if (Math.sin(angle) > 0) angle += Math.PI;

            let len = baseLen;
            if (style.params.centerScale) len *= (1 + Math.sin(t * Math.PI) * (style.params.centerScale - 1));
            if (style.params.flareScale) len *= (0.7 + t * style.params.flareScale * 0.8);
            if (style.params.spikes && Math.random() > 0.92) len *= 1.4;
            len *= (0.94 + Math.random() * 0.12); // Organic noise

            const flareAmt = (t - 0.2) * (onLeft ? -0.45 : 0.45);
            angle += flareAmt;

            if (isShadowPass) {
                // Micro-Shadow integration
                drawHighFidelityFiber(targetCtx, x, y + 1.2, angle, len * 0.95, 0, 0.12 * normOpen, style.thickness * 1.5, true);
            } else {
                // Growth depth + Main fiber
                drawHighFidelityFiber(targetCtx, x, y, angle, len * 0.18, 0, 0.4 * normOpen, style.thickness * 2.0, false, "#0a0a0a");
                drawHighFidelityFiber(targetCtx, x, y, angle, len, style.params.curve || 0.82, style.opacity * normOpen, style.thickness, false);
            }
        }
    }

    /**
     * V6.0 Multi-Pass Organic Fiber Rendering
     */
    function drawHighFidelityFiber(ctx, x, y, angle, len, curve, opacity, baseWidth, isShadow, baseColor = "#1a1a1a") {
        if (opacity <= 0.01) return;

        const steps = 6;
        const targetX = x + Math.cos(angle) * len;
        const targetY = y + Math.sin(angle) * len;
        const ctrlX = x + Math.cos(angle - 0.05) * len * 0.3;
        const ctrlY = y + Math.sin(angle - 0.05) * len * (curve || 0.8);

        ctx.lineCap = "round";
        for (let i = 1; i <= steps; i++) {
            const t0 = (i - 1) / steps;
            const bT = i / steps;

            const getBezier = (T) => {
                const inv = 1 - T;
                return {
                    x: inv * inv * x + 2 * inv * T * ctrlX + T * T * targetX,
                    y: inv * inv * y + 2 * inv * T * ctrlY + T * T * targetY
                };
            };

            const p0 = getBezier(t0);
            const p1 = getBezier(bT);

            const thickness = baseWidth * (1 - bT * 0.86);
            const stepOpacity = opacity * (1 - bT * 0.65);

            ctx.beginPath();
            ctx.lineWidth = thickness;
            ctx.strokeStyle = isShadow ? `rgba(12, 12, 12, ${stepOpacity * 0.5})` : `rgba(26, 26, 26, ${stepOpacity})`;
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }
    }

    // Helper: Simple linear interpolation along a set of points (acting as a curve path)
    function getPointOnPolyline(pts, t) {
        if (t <= 0) return pts[0];
        if (t >= 1) return pts[pts.length - 1];
        const segs = pts.length - 1;
        const i = Math.floor(t * segs);
        const st = (t * segs) % 1;
        return {
            x: pts[i].x + (pts[i + 1].x - pts[i].x) * st,
            y: pts[i].y + (pts[i + 1].y - pts[i].y) * st
        };
    }

    /**
     * Update the preview image with current style
     */
    function updatePreview() {
        if (!state.capturedBaseFrame || !state.capturedLandmarks) return;

        console.log("Updating preview style:", state.currentStyle);

        const w = state.capturedBaseFrame.width;
        const h = state.capturedBaseFrame.height;

        const offscreen = document.createElement("canvas");
        offscreen.width = w;
        offscreen.height = h;
        const octx = offscreen.getContext("2d");

        octx.drawImage(state.capturedBaseFrame, 0, 0);
        drawLashes(state.capturedLandmarks, octx, w, h, true);

        previewImg.src = offscreen.toDataURL("image/png");
    }

    /**
     * Capture Photo and show Preview
     */
    function capturePhoto() {
        if (!state.results || !state.results.faceLandmarks || state.results.faceLandmarks.length === 0) return;

        const canvasW = video.videoWidth;
        const canvasH = video.videoHeight;

        state.capturedBaseFrame = document.createElement("canvas");
        state.capturedBaseFrame.width = canvasW;
        state.capturedBaseFrame.height = canvasH;
        const bctx = state.capturedBaseFrame.getContext("2d");

        bctx.translate(canvasW, 0);
        bctx.scale(-1, 1);
        // Mirror landmarks to match the selfie base
        // We capture landmarks at the exact frame being drawn
        const currentLandmarks = state.results.faceLandmarks[0];
        state.capturedLandmarks = currentLandmarks.map(lm => ({
            x: 1 - lm.x, // Mirror X to match mirrored canvas
            y: lm.y,
            z: lm.z
        }));

        state.isFrozen = true;
        guide.style.display = "none";
        preview.classList.remove("is-hidden");
        captureBtn.style.display = "none";

        updatePreview();
    }

    /**
     * Retake Photo (Resume)
     */
    function retakePhoto() {
        preview.classList.add("is-hidden");
        state.isFrozen = false;
        state.capturedBaseFrame = null;
        state.capturedLandmarks = null;
        captureBtn.style.display = "inline-block";
        guide.style.display = "flex";
        predictWebcam();
    }

    /**
     * Download the captured photo
     */
    function downloadPhoto() {
        const link = document.createElement("a");
        link.download = `miss-lashes-${state.currentStyle}.png`;
        link.href = previewImg.src;
        link.click();
    }

    // Event Listeners
    startBtn.addEventListener("click", startCamera);
    captureBtn.addEventListener("click", capturePhoto);
    retakeBtn.addEventListener("click", retakePhoto);
    downloadBtn.addEventListener("click", downloadPhoto);

    styleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const newStyle = btn.dataset.style;
            console.log("Style clicked:", newStyle, "Frozen:", state.isFrozen);

            styleButtons.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");

            state.currentStyle = newStyle;

            if (state.isFrozen) {
                updatePreview();
            }
        });
    });

    // Debug Mode Shortcut
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "d") {
            state.isDebug = !state.isDebug;
            console.log("Try-On Debug Mode:", state.isDebug ? "ON" : "OFF");
        }
    });
}
