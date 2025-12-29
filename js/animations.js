export function initReveals() {
    const reveals = document.querySelectorAll(".reveal");

    // Fallback: If IntersectionObserver is not supported, reveal all
    if (!window.IntersectionObserver) {
        reveals.forEach(el => el.classList.add("is-in"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                // Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px"
    });

    reveals.forEach(el => observer.observe(el));

    // Force reveal hero elements after a short delay just in case
    setTimeout(() => {
        document.querySelectorAll('.hero .reveal').forEach(el => {
            el.classList.add('is-in');
        });
    }, 500);
}

// Smart Navbar: Simplified and robust
export function initSmartNavbar() {
    const header = document.querySelector('.header');
    const island = document.querySelector('.header__island');
    if (!header) return;

    let lastScroll = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > lastScroll && currentScroll > 50) {
            header.classList.add('header--hidden');
        } else {
            header.classList.remove('header--hidden');
        }

        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (height > 0) {
            const scrolled = (currentScroll / height) * 100;
            if (island) {
                island.style.setProperty('--scroll-percent', `${scrolled}%`);
            }
        }

        lastScroll = currentScroll <= 0 ? 0 : currentScroll;
    }, { passive: true });
}

// Page load animation
export function initPageLoad() {
    const body = document.body;
    body.classList.add('is-loading');

    window.addEventListener('load', () => {
        setTimeout(() => {
            body.classList.remove('is-loading');
            body.classList.add('is-loaded');
        }, 100);
    });

    if (document.readyState === 'complete') {
        setTimeout(() => {
            body.classList.remove('is-loading');
            body.classList.add('is-loaded');
        }, 100);
    }
}

// Parallax scroll effect
export function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');
    if (parallaxElements.length === 0) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.2;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }, { passive: true });
}

// Ultra-Smooth Scroll (Lightweight implementation)
export function initSmoothScroll() {
    // We'll use a simple lerp-based smooth scroll for the body
    // This is a minimalist version of what libraries like Lenis do

    const body = document.body;
    let target = window.scrollY;
    let current = window.scrollY;
    let ease = 0.075;

    // Only apply on desktop for performance and to avoid touch conflicts
    if (window.innerWidth < 1024) return;

    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        target += e.deltaY;
        target = Math.max(0, Math.min(target, document.documentElement.scrollHeight - window.innerHeight));
    }, { passive: false });

    function update() {
        current += (target - current) * ease;

        // Apply the transform to a wrapper if we had one, but for simplicity
        // and to keep existing fixed elements working, we'll just use window.scrollTo
        // with a very small increment to simulate smoothness without breaking fixed headers.

        if (Math.abs(target - current) > 0.1) {
            window.scrollTo(0, current);
        }

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}
