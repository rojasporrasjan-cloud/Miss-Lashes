export function initParticles() {
    const canvas = document.getElementById("particles");
    const ctx = canvas.getContext("2d");
    const isMobile = matchMedia("(max-width: 980px)").matches;

    // Optional: disable on mobile for performance
    if (isMobile) return;

    let w, h, particles;
    const max = 45; // keep it low = premium + smooth

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function make() {
        particles = Array.from({ length: max }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.6 + Math.random() * 1.8,
            vx: -0.08 + Math.random() * 0.16,
            vy: 0.12 + Math.random() * 0.22,
            a: 0.08 + Math.random() * 0.22
        }));
    }

    let last = 0;
    function tick(t) {
        // cap ~30fps
        if (t - last < 33) return requestAnimationFrame(tick);
        last = t;

        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy;
            if (p.y > h + 20) p.y = -20;
            if (p.x < -20) p.x = w + 20;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(217,178,124,${p.a})`; // champagne dust
            ctx.fill();
        }
        requestAnimationFrame(tick);
    }

    resize(); make();
    window.addEventListener("resize", () => { resize(); make(); });
    document.addEventListener("visibilitychange", () => {
        // if hidden, clear to reduce GPU usage
        if (document.hidden) ctx.clearRect(0, 0, w, h);
    });

    requestAnimationFrame(tick);
}
