import { initReveals, initPageLoad, initParallax, initSmartNavbar, initSmoothScroll } from "./animations.js";
import { initParticles } from "./particles.js";
import { initQuiz } from "./quiz.js";
import { initBeforeAfter } from "./slider.js";
import { initTryOn } from "./tryon.js?v=6.1";
import { initBooking } from "./booking.js?v=2.0";

// Initialize Navbar Glow Effect
function initNavbarGlow() {
    const island = document.querySelector('.header__island');
    if (!island) return;

    island.addEventListener('mousemove', (e) => {
        const rect = island.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        island.style.setProperty('--glow-x', `${x}%`);
        island.style.setProperty('--glow-y', `${y}%`);
    });
}

// Initialize Mobile Menu
function initMobileMenu() {
    const toggle = document.querySelector('.nav__toggle');
    const overlay = document.querySelector('.nav__overlay');
    const links = document.querySelectorAll('.nav__mobile-link');

    if (!toggle || !overlay) return;

    const toggleMenu = () => {
        toggle.classList.toggle('is-active');
        overlay.classList.toggle('is-active');
        document.body.style.overflow = overlay.classList.contains('is-active') ? 'hidden' : '';
    };

    toggle.addEventListener('click', toggleMenu);

    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('is-active');
            overlay.classList.remove('is-active');
            document.body.style.overflow = '';
        });
    });
}

// Ensure everything runs after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("year").textContent = String(new Date().getFullYear());

    // Initialize all components
    initPageLoad();
    initSmoothScroll();
    initSmartNavbar();
    initReveals();
    initParallax();
    initQuiz();
    initBeforeAfter();
    initParticles();
    initTryOn();
    initNavbarGlow();
    initMobileMenu();
    initBooking();
});
