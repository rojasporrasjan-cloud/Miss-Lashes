import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSuc4rHePIwaFBICgR_4J_i70eyCkf_Bg",
    authDomain: "miss-lashes.firebaseapp.com",
    projectId: "miss-lashes",
    storageBucket: "miss-lashes.firebasestorage.app",
    messagingSenderId: "913217879570",
    appId: "1:913217879570:web:21d7e518184c0ec295e2cb",
    measurementId: "G-F7ZK7KZZ31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let currentStep = 0;
let selectedStyle = null;
let selectedDate = null;
let selectedTime = null;
let currentDate = new Date();

// DOM Elements
const steps = document.querySelectorAll('.ritual-step');
const progressDots = document.querySelectorAll('.progress-step');
const calendarGrid = document.querySelector('.calendar__grid');
const monthDisplay = document.querySelector('.calendar__month');
const timeslotsGrid = document.getElementById('timeslots');

export function initBooking() {
    initStyleSelection();
    initCalendarNav();
    initBackButtons();
    renderCalendar();

    // Handle URL params
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    if (service) {
        // Use the service name directly, but ensure it's properly formatted if needed
        selectedStyle = service;
        goToStep(1);
    }
}

// Auto-initialize if on the booking page
if (document.body.classList.contains('page-booking')) {
    initBooking();
}

function goToStep(stepIndex) {
    steps.forEach((step, i) => {
        if (i === stepIndex) {
            step.style.display = 'block';
            // Trigger animation frame to ensure display:block is applied before adding class
            requestAnimationFrame(() => {
                step.classList.add('is-active');
            });
        } else {
            step.classList.remove('is-active');
            // Wait for transition before hiding
            setTimeout(() => {
                if (!step.classList.contains('is-active')) {
                    step.style.display = 'none';
                }
            }, 800);
        }

        if (progressDots[i]) progressDots[i].classList.toggle('is-active', i <= stepIndex);
    });
    currentStep = stepIndex;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stepIndex === 3) updateSummary();
}

function initStyleSelection() {
    const cards = document.querySelectorAll('.style-card');
    if (cards.length === 0) return;
    cards.forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.style-card').forEach(c => c.classList.remove('is-selected'));
            card.classList.add('is-selected');
            selectedStyle = card.dataset.service;
            setTimeout(() => goToStep(1), 400); // Slight delay for visual feedback
        });
    });
}

function initBackButtons() {
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            goToStep(currentStep - 1);
        });
    });
}

// Calendar Logic
function renderCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    days.forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar__weekday';
        el.innerText = day;
        calendarGrid.appendChild(el);
    });

    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar__day is-empty';
        calendarGrid.appendChild(el);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const el = document.createElement('div');
        el.className = 'calendar__day';
        el.innerText = i;

        const dateObj = new Date(year, month, i);
        if (dateObj < today) {
            el.classList.add('is-past');
        } else {
            el.addEventListener('click', () => {
                document.querySelectorAll('.calendar__day').forEach(d => d.classList.remove('is-selected'));
                el.classList.add('is-selected');
                selectedDate = dateObj;
                renderTimeSlots(dateObj);
                setTimeout(() => goToStep(2), 400);
            });
        }

        if (selectedDate && dateObj.getTime() === selectedDate.getTime()) {
            el.classList.add('is-selected');
        }

        calendarGrid.appendChild(el);
    }
}

function initCalendarNav() {
    const prevBtn = document.querySelector('.calendar__nav .prev');
    const nextBtn = document.querySelector('.calendar__nav .next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

async function renderTimeSlots(date) {
    if (!timeslotsGrid) return;

    // Skeleton loading effect
    timeslotsGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skel = document.createElement('div');
        skel.className = 'timeslot skeleton';
        skel.style.height = '50px';
        timeslotsGrid.appendChild(skel);
    }

    const dateStr = date.toISOString().split('T')[0];
    const q = query(collection(db, "bookings"), where("date", "==", dateStr));
    const querySnapshot = await getDocs(q);
    const bookedTimes = [];
    querySnapshot.forEach((doc) => bookedTimes.push(doc.data().time));

    timeslotsGrid.innerHTML = '';
    const times = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

    times.forEach(time => {
        const el = document.createElement('div');
        el.className = 'timeslot';
        el.innerText = time;

        if (bookedTimes.includes(time)) {
            el.classList.add('is-booked');
        } else {
            el.addEventListener('click', () => {
                selectedTime = time;
                goToStep(3);
            });
        }
        timeslotsGrid.appendChild(el);
    });
}

function updateSummary() {
    document.getElementById('summary-style').innerText = selectedStyle;
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = selectedDate.toLocaleDateString('es-ES', options);
    document.getElementById('summary-datetime').innerText = `${dateStr} a las ${selectedTime}`;
}

// Final Confirmation
const confirmBtn = document.getElementById('confirmBooking');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.innerText = "Preparando tu ritual...";

        try {
            const dateStr = selectedDate.toISOString().split('T')[0];

            await addDoc(collection(db, "bookings"), {
                service: selectedStyle,
                date: dateStr,
                time: selectedTime,
                timestamp: new Date()
            });

            const options = { day: 'numeric', month: 'long' };
            const dateDisplay = selectedDate.toLocaleDateString('es-ES', options);
            const message = `Hola Fernanda! ✨ He reservado mi ritual de belleza:
- Estilo: ${selectedStyle}
- Fecha: ${dateDisplay}
- Hora: ${selectedTime}

¡Estoy muy emocionada! 💗`;

            const encoded = encodeURIComponent(message);
            window.open(`https://wa.me/50688888888?text=${encoded}`, '_blank');

            // Redirect back to home after a delay
            setTimeout(() => {
                location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error(error);
            alert("Hubo un pequeño error. Por favor, intenta de nuevo.");
            btn.disabled = false;
            btn.innerText = "Confirmar y enviar por WhatsApp";
        }
    });
}
