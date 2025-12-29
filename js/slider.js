export function initBeforeAfter() {
    const wrap = document.getElementById("baWrap");
    const after = document.getElementById("baAfter");
    const handle = document.getElementById("baHandle");
    if (!wrap || !after || !handle) return;

    let dragging = false;
    let pct = 50;

    function setPct(x) {
        const rect = wrap.getBoundingClientRect();
        const clamped = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        pct = clamped * 100;
        after.style.width = `${pct}%`;
        handle.style.left = `${pct}%`;
    }

    function down(e) { dragging = true; setPct(getX(e)); }
    function move(e) { if (!dragging) return; setPct(getX(e)); }
    function up() { dragging = false; }

    function getX(e) {
        return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    }

    wrap.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    wrap.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);

    setPct(wrap.getBoundingClientRect().left + wrap.getBoundingClientRect().width * 0.5);
}
