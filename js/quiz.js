export function initQuiz() {
    const stepEl = document.getElementById("quizStep");
    const qEl = document.getElementById("quizQuestion");
    const optEl = document.getElementById("quizOptions");
    const nextBtn = document.getElementById("quizNext");
    const backBtn = document.getElementById("quizBack");
    const resultBox = document.getElementById("quizResult");
    const resultText = document.getElementById("quizResultText");

    if (!stepEl) return;

    const steps = [
        {
            q: "¿Cuál es tu vibra?",
            options: [
                { label: "Suave y Natural", value: "natural" },
                { label: "Glam Elegante", value: "softglam" },
                { label: "Audaz y Dramático", value: "mega" }
            ]
        },
        {
            q: "¿Cómo usas el maquillaje?",
            options: [
                { label: "Mínimo", value: "natural" },
                { label: "Medio", value: "softglam" },
                { label: "Full glam", value: "mega" }
            ]
        },
        {
            q: "¿Tu rutina diaria?",
            options: [
                { label: "Ocupada y rápida", value: "natural" },
                { label: "Balanceada", value: "softglam" },
                { label: "Me encanta arreglarme", value: "mega" }
            ]
        },
        {
            q: "¿Qué resultado quieres?",
            options: [
                { label: "Realce sutil", value: "natural" },
                { label: "Volumen suave", value: "softglam" },
                { label: "Máximo impacto", value: "mega" }
            ]
        },
        {
            q: "¿Ocasión?",
            options: [
                { label: "Diario", value: "natural" },
                { label: "Citas / eventos", value: "softglam" },
                { label: "Fotos / fiestas", value: "mega" }
            ]
        }
    ];

    let i = 0;
    const answers = [];

    function render() {
        stepEl.textContent = String(i + 1);
        qEl.textContent = steps[i].q;

        optEl.innerHTML = "";
        steps[i].options.forEach((o, idx) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "quizOpt";
            b.textContent = o.label;
            b.dataset.value = o.value;
            b.addEventListener("click", () => {
                // select style
                document.querySelectorAll(".quizOpt").forEach(x => x.classList.remove("is-selected"));
                b.classList.add("is-selected");
                answers[i] = o.value;
            });
            optEl.appendChild(b);
        });

        backBtn.disabled = (i === 0);
        nextBtn.textContent = (i === steps.length - 1) ? "Revelar" : "Siguiente";
    }

    function compute() {
        const score = { natural: 0, softglam: 0, mega: 0 };
        answers.forEach(a => { if (a) score[a]++; });

        const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
        if (top === "natural") return "Set Natural — limpio, suave, lujo sin esfuerzo.";
        if (top === "softglam") return "Soft Glam — volumen elegante con acabado refinado.";
        return "Mega Volumen — audaz, dramático, look premium de impacto.";
    }

    nextBtn.addEventListener("click", () => {
        if (!answers[i]) return; // force selection
        if (i < steps.length - 1) {
            i++;
            render();
        } else {
            // show result
            resultText.textContent = compute();
            resultBox.hidden = false;
            resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    backBtn.addEventListener("click", () => {
        if (i === 0) return;
        i--;
        render();
    });

    render();
}
