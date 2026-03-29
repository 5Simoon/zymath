/* ==========================================================================
   ZYMATH SINGULARITY v9 - OMNI-CORE PARSER & UI
   ========================================================================== */

// --- 1. AEGIS MAXIMUM FIREWALL ---
const Aegis = {
    init: async () => {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if(e.key==='F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key==='u')) {
                e.preventDefault(); console.warn("[AEGIS] Unauthorized access blocked.");
            }
        });
        const logs = ["[AEGIS] Engaging Security...", "[AEGIS] Initializing Input Sanitization...", "[AEGIS] Omni-Parser: ONLINE"];
        const logCont = document.getElementById('boot-log');
        for (let i=0; i<logs.length; i++) {
            await new Promise(r => setTimeout(r, 400));
            logCont.innerHTML += `<div>> ${logs[i]}</div>`;
            document.getElementById('boot-progress').style.width = `${(i+1)*33}%`;
        }
        await new Promise(r => setTimeout(r, 600));
        document.getElementById('aegis-firewall').style.opacity = '0';
        setTimeout(() => document.getElementById('aegis-firewall').remove(), 500);
    },
    sanitize: (input) => {
        if(typeof input!=='string') return '';
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/onload|onerror|javascript:/gi, 'BLOCKED').replace(/<[^>]+>/g, '').trim();
    }
};

// --- 2. OMNI-CORE PARSER ---
const OmniCore = {
    evaluate: (rawInput) => {
        const input = Aegis.sanitize(rawInput);
        if(!input) throw new Error("Puste wejście lub zablokowane przez Aegis.");

        try {
            if(input.startsWith('simpson:')) {
                const parts = input.replace('simpson:','').split(',');
                const f = x => math.evaluate(parts[0], {x});
                return { res: NexusMath.adaptiveSimpson(f, parseFloat(parts[1]), parseFloat(parts[2])).toFixed(6), steps: "Adaptacyjne całkowanie numeryczne (Simpson).", type: "Analiza Numeryczna" };
            }
            if(input.startsWith('rk4:')) {
                const f = (t, y) => y - t; 
                return { res: `y(2) ≈ ${NexusMath.rk4(f, 1, 0, 2, 0.1).toFixed(6)}`, steps: "Równanie Różniczkowe Zwyczajne (Metoda RK4)", type: "Calculus" };
            }
            if(input.startsWith('rsa:')) {
                const [p,q] = input.replace('rsa:','').split(',').map(n=>parseInt(n));
                const {n, e, d} = NexusMath.rsaGen(p, q);
                return { res: `Klucz PUB: (${e}, ${n}) | PRV: (${d}, ${n})`, steps: "Generowanie kluczy asymetrycznych RSA.", type: "Kryptografia" };
            }
            if(input.startsWith('rho:')) {
                const factor = NexusMath.pollardsRho(parseInt(input.replace('rho:','')));
                return { res: `Dzielnik: ${factor}`, steps: "Faktoryzacja algorytmem Pollard's Rho.", type: "Teoria Liczb" };
            }
            if(input.startsWith('fft:')) {
                const res = NexusMath.fft(JSON.parse(input.replace('fft:','').trim()));
                return { res: `Real: [${res.re.map(n=>n.toFixed(2))}]`, steps: "Szybka Transformata Fouriera (FFT - Cooley-Tukey)", type: "Przetwarzanie Sygnałów" };
            }
            if(input.match(/^(rozwiąż|oblicz|udowodnij|znajdź)/i)) {
                return { res: "[AI SOLVER OFFLINE]", steps: "Rozpoznano język naturalny. Oczekuje na podpięcie klucza OpenAI/Anthropic.", type: "AI NLP Solver" };
            }
            
            // Fallback na Math.js
            const res = math.evaluate(input);
            return { res: res.toString(), steps: "Przetworzono przez ogólny silnik CAS.", type: "Ewaluacja Wyrażeń" };
        } catch (e) { throw new Error(`Błąd: ${e.message}`); }
    }
};

function handleCompute() {
    const btn = document.getElementById('compute-btn');
    btn.innerHTML = `<div class="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div> Analiza...`;
    
    setTimeout(() => {
        try {
            const calc = OmniCore.evaluate(document.getElementById('math-input').value);
            document.getElementById('result-container').classList.remove('hidden');
            document.getElementById('result-output').innerText = calc.res;
            document.getElementById('detected-mode').innerText = `Tryb: ${calc.type}`;
            document.getElementById('steps-container').classList.remove('hidden');
            document.getElementById('steps-output').innerHTML = marked.parse(calc.steps);
        } catch (e) {
            document.getElementById('result-container').classList.remove('hidden');
            document.getElementById('result-output').innerText = "ERROR_SYNTAX";
            document.getElementById('steps-container').classList.remove('hidden');
            document.getElementById('steps-output').innerHTML = `<span style="color:red">${e.message}</span>`;
        }
        btn.innerHTML = `<i data-lucide="cpu" class="h-5 w-5"></i> Analizuj (⌘+Enter)`;
        lucide.createIcons();
    }, 300);
}

// --- 3. UI, ROUTING I BAZY DANYCH ---
function switchPage(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active-page');
    document.getElementById(`nav-${pageId}`).classList.add('active');
}

function insertQuery(q) { document.getElementById('math-input').value = q; }

const DB = {
    history: [
        { title: "Starożytność", desc: "Złota era pitagorejczyków i początki geometrii euklidesowej.", icon: "landmark" },
        { title: "Renesans", desc: "Odkrycie rachunku różniczkowego przez Newtona i Leibniza.", icon: "telescope" },
        { title: "Wiek XX", desc: "Alan Turing, Enigma i narodziny informatyki matematycznej.", icon: "cpu" }
    ],
    trivia: [
        { title: "Paradoks Banacha-Tarskiego", text: "Z jednej kuli można złożyć dwie identyczne. Magia teorii miary." },
        { title: "Tożsamość Eulera", text: "e^(iπ) + 1 = 0 - Uznawany za najpiękniejszy wzór łączący 5 stałych." },
        { title: "Hipoteza Riemanna", text: "Największa nierozwiązana zagadka matematyki (z nagrodą 1 mln $)." }
    ],
    tasks: [
        { title: "Stereometria (Ostrosłupy)", text: "Oblicz objętość ostrosłupa prawidłowego czworokątnego.", img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80", diff: "hard" },
        { title: "Geometria Analityczna", text: "Wyznacz równanie prostej prostopadłej do y = 2x - 1.", img: "https://images.unsplash.com/photo-1620553147854-9e32050ba8b6?w=600&q=80", diff: "medium" }
    ],
    formulas: [
        { cat: "Algebra", title: "Równanie Kwadratowe", txt: "ax² + bx + c = 0<br>Δ = b² - 4ac" },
        { cat: "Trygonometria", title: "Jedynka Trygonometryczna", txt: "sin²(x) + cos²(x) = 1" },
        { cat: "Analiza", title: "Szereg Taylora", txt: "f(x) = Σ [f⁽ⁿ⁾(a) / n!] · (x-a)ⁿ" },
        { cat: "Statystyka", title: "Odchylenie Standardowe", txt: "σ = √[ Σ(xᵢ - x̄)² / n ]" }
    ]
};

function initUI() {
    // Hints
    document.getElementById('omni-hints').innerHTML = `
        <button onclick="insertQuery('simpson: x^2, 0, 5')" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Całka (Simpson)</button>
        <button onclick="insertQuery('rsa: 61, 53')" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Krypto RSA</button>
        <button onclick="insertQuery('det([[1,2],[3,4]])')" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Wyznacznik</button>
        <button onclick="insertQuery('fft: [1,0,1,0]')" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">FFT Sygnału</button>
        <button onclick="insertQuery('rho: 8051')" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Pollard's Rho</button>
    `;

    // Render DBs
    document.getElementById('history-container').innerHTML = DB.history.map(h => `<div class="content-card glass-card p-6 rounded-2xl text-center"><i data-lucide="${h.icon}" class="mx-auto mb-3 text-primary"></i><h3 class="font-bold text-white mb-2">${h.title}</h3><p class="text-xs text-muted-foreground">${h.desc}</p></div>`).join('');
    document.getElementById('trivia-container').innerHTML = DB.trivia.map(t => `<div class="content-card glass-card p-6 rounded-2xl border-l-4 border-l-accent"><h3 class="font-bold text-accent mb-2">${t.title}</h3><p class="text-sm text-muted-foreground">${t.text}</p></div>`).join('');
    document.getElementById('tasks-container').innerHTML = DB.tasks.map(t => `<div class="content-card glass-card p-5 rounded-2xl"><div class="task-image-wrapper"><img src="${t.img}" /></div><span class="text-[9px] px-2 py-1 rounded bg-accent/20 text-accent uppercase font-bold mb-2 inline-block">${t.diff}</span><h3 class="font-bold text-white mb-2">${t.title}</h3><p class="text-sm text-muted-foreground mb-4">${t.text}</p><button onclick="switchPage('engine'); insertQuery('Rozwiąż: ${t.title}')" class="w-full bg-white/5 py-2 rounded-lg text-xs font-bold hover:bg-white/10">Wyślij do Terminala</button></div>`).join('');
    
    window.renderFormulas = (cat) => {
        const filtered = cat === 'Wszystkie' ? DB.formulas : DB.formulas.filter(f => f.cat === cat);
        document.getElementById('formulas-container').innerHTML = filtered.map(f => `<div class="content-card glass-card p-6 rounded-2xl"><span class="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">${f.cat}</span><h3 class="font-bold text-white mt-3 mb-2">${f.title}</h3><div class="text-sm font-mono text-primary/80 bg-black/40 p-3 rounded">${f.txt}</div></div>`).join('');
    };
    
    const cats = ['Wszystkie', ...new Set(DB.formulas.map(f=>f.cat))];
    document.getElementById('formula-filters').innerHTML = cats.map(c => `<button onclick="document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); renderFormulas('${c}')" class="filter-btn ${c==='Wszystkie'?'active':''}">${c}</button>`).join('');
    renderFormulas('Wszystkie');

    // Terminal Events
    document.getElementById('compute-btn').addEventListener('click', handleCompute);
    document.getElementById('math-input').addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCompute(); });
}

// --- 4. POMODORO ---
let pomRunning = false; let pomRem = 25*60; let pomInt = null;
function togglePomodoro() {
    const el = document.getElementById('pomodoro-time');
    if(pomRunning) { clearInterval(pomInt); pomRunning = false; el.style.color = "hsl(var(--muted-foreground))"; }
    else {
        pomRunning = true; el.style.color = "hsl(var(--accent))";
        pomInt = setInterval(() => {
            if(pomRem > 0) { pomRem--; el.innerText = `${Math.floor(pomRem/60).toString().padStart(2,'0')}:${(pomRem%60).toString().padStart(2,'0')}`; }
            else { clearInterval(pomInt); alert("Przerwa!"); }
        }, 1000);
    }
}

// BOOT
document.addEventListener('DOMContentLoaded', async () => {
    initUI();
    lucide.createIcons();
    await Aegis.init();
});
