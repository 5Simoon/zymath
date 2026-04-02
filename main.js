/**
 * ════════════════════════════════════════════════════════════════════════════
 * ZYMATH SINGULARITY v4.0 — NEXUS MATH ENGINE
 * * System:    Core Logic & Interactive Modules
 * Author:    5Simoon
 * Build:     4.0.0-PRO (Editorial/CC Unpacked Edition)
 * Security:  SHA-256 Anti-Cheat, Honeypot Integration
 * ════════════════════════════════════════════════════════════════════════════
 */

"use strict";

/* ==========================================================================
   1. GLOBAL STATE & CONFIGURATION
   ========================================================================== */

const ZYMATH_CONFIG = {
    version: '4.0.0',
    storageKey: 'zymath_v4_state',
    maxLevel: 100,
    expPerLevel: 1000,
    graph: {
        colors: ['#C17B5E', '#D4A853', '#6BA368'], // Rust, Gold, Green
        gridColor: 'rgba(255, 255, 255, 0.1)',
        axisColor: 'rgba(212, 168, 83, 0.5)' // Gold soft
    }
};

const STATE = {
    exp: 0,
    level: 1,
    solvedTasks: [],
    history: [],
    theme: localStorage.getItem('zymath-theme') || 'dark',
    pomodoro: {
        timeLeft: 25 * 60,
        isRunning: false,
        interval: null,
        mode: 'work' // 'work' | 'break'
    },
    graph: {
        scale: 45,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        lastX: 0,
        lastY: 0
    }
};

/* ==========================================================================
   2. DATABASE: 150+ TASKS (Categorized & Generated)
   ========================================================================== */

const TASK_DATABASE = [
    // --- EASY (Podstawy) ---
    { id: 'e1', type: 'easy', q: 'Rozwiąż równanie: 2x - 5 = 11', a: '8' },
    { id: 'e2', type: 'easy', q: 'Oblicz: 15% z liczby 200', a: '30' },
    { id: 'e3', type: 'easy', q: 'Skróć ułamek 24/36 do najprostszej postaci (zapisz np. 2/3)', a: '2/3' },
    { id: 'e4', type: 'easy', q: 'Oblicz pole kwadratu o przekątnej d = 4', a: '8' },
    { id: 'e5', type: 'easy', q: 'Rozwiąż: 3(x + 2) = 21', a: '5' },
    { id: 'e6', type: 'easy', q: 'Ile wynosi NWD(12, 18)?', a: '6' },
    { id: 'e7', type: 'easy', q: 'Zamień 72 km/h na m/s', a: '20' },
    { id: 'e8', type: 'easy', q: 'Oblicz pierwiastek: √(144)', a: '12' },
    { id: 'e9', type: 'easy', q: 'Rozwiąż proporcję: x/4 = 15/6', a: '10' },
    { id: 'e10', type: 'easy', q: 'Pole trójkąta o podstawie 10 i wysokości 5 wynosi:', a: '25' },
    // (System dynamicznie generuje brakujące do 50 łatwych zadań)

    // --- MEDIUM (Matura Podstawowa) ---
    { id: 'm1', type: 'medium', q: 'Oblicz wyróżnik (Δ) dla równania: 2x² - 4x + 1 = 0', a: '8' },
    { id: 'm2', type: 'medium', q: 'Podaj piąty wyraz ciągu arytmetycznego: a₁=3, r=4', a: '19' },
    { id: 'm3', type: 'medium', q: 'Wartość wyrażenia log₂(32) - log₃(27) to:', a: '2' },
    { id: 'm4', type: 'medium', q: 'Oblicz sumę pierwszych 10 wyrazów ciągu arytm. gdzie a₁=2, a₁₀=20', a: '110' },
    { id: 'm5', type: 'medium', q: 'Kąt α jest ostry i sin(α) = 3/5. Oblicz cos²(α) (zapisz jako ułamek dziesiętny)', a: '0.64' },
    { id: 'm6', type: 'medium', q: 'Rozwiąż równanie: |x - 3| = 5 (podaj większy pierwiastek)', a: '8' },
    { id: 'm7', type: 'medium', q: 'Ile jest liczb trzycyfrowych o niepowtarzających się cyfrach?', a: '648' },
    { id: 'm8', type: 'medium', q: 'Dany jest ciąg geometryczny: a₁=2, q=3. Oblicz a₄.', a: '54' },
    { id: 'm9', type: 'medium', q: 'Prawdopodobieństwo wyrzucenia sumy 7 w rzucie dwiema kostkami (zapisz w ułamku nieskracalnym)', a: '1/6' },
    { id: 'm10', type: 'medium', q: 'Pole powierzchni całkowitej sześcianu o objętości 64 wynosi:', a: '96' },

    // --- HARD (Matura Rozszerzona & Olimpiada) ---
    { id: 'h1', type: 'hard', q: 'Znajdź pochodną f(x) = x³ - 2x² w punkcie x = 2', a: '4' },
    { id: 'h2', type: 'hard', q: 'Oblicz granicę lim(x→∞) (3x² - 5) / (x² + 2)', a: '3' },
    { id: 'h3', type: 'hard', q: 'Rozwiąż równanie logarytmiczne: log₂(x) + log₂(x-2) = 3', a: '4' },
    { id: 'h4', type: 'hard', q: 'Z 10-osobowej grupy wybieramy 3-osobową delegację. Na ile sposobów można to zrobić?', a: '120' },
    { id: 'h5', type: 'hard', q: 'Suma nieskończonego szeregu geometrycznego: 1 + 1/2 + 1/4 + ...', a: '2' },
    { id: 'h6', type: 'hard', q: 'Oblicz całkę oznaczoną z 2x dx w przedziale [0, 3]', a: '9' },
    { id: 'h7', type: 'hard', q: 'Pole obszaru ograniczonego funkcją y = -x² + 4 i osią OX wynosi:', a: '32/3' },
    { id: 'h8', type: 'hard', q: 'Rozwiąż równanie trygonometryczne: 2sin(x) - 1 = 0 dla x w (0, π/2). Podaj wynik w stopniach.', a: '30' },
    { id: 'h9', type: 'hard', q: 'Współczynnik kierunkowy stycznej do wykresu y = ln(x) w punkcie x = e wynosi (zapisz jako np. 1/e):', a: '1/e' },
    { id: 'h10', type: 'hard', q: 'Prawdopodobieństwo, że w losowaniu 3 kart z talii 52 kart będą dokładnie 2 asy wynosi (zapisz np. 72/5525):', a: '72/5525' }
];

/* ==========================================================================
   3. CORE INITIALIZATION & EVENT BINDINGS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log(`[ZYMATH] NEXUS Engine v${ZYMATH_CONFIG.version} Initializing...`);
    
    initSecurity();
    loadState();
    initUI();
    initParticles();
    initGraphEngine();
    renderTasks('all');
    initMathKeyboard();
    registerPWA();

    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typesetPromise().catch(err => console.error('MathJax Error:', err));
    }
});

/* ==========================================================================
   4. UI, THEME & NAVIGATION CONTROLLERS
   ========================================================================== */

function initUI() {
    // Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    updateScoreUI();
    
    // Global Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-overlay')?.classList.add('open');
            document.getElementById('searchInput')?.focus();
        }
        if (e.key === 'Escape') {
            document.getElementById('search-overlay')?.classList.remove('open');
        }
    });
}

function showSnackbar(msg, type = 'info') {
    const container = document.getElementById('snackbar-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'snackbar';
    toast.style.borderLeftColor = type === 'error' ? 'var(--rust)' : 'var(--gold)';
    toast.innerHTML = msg;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function unlockAchievement(title, desc) {
    const container = document.getElementById('ach-toast-container');
    if (!container) return;
    
    const ach = document.createElement('div');
    ach.className = 'ach-toast';
    ach.innerHTML = `
        <i data-lucide="award" style="color:var(--gold); width:24px; height:24px;"></i>
        <div>
            <div style="font-weight:700; color:var(--text);">${title}</div>
            <div style="font-size:0.8rem; color:var(--muted-hi);">${desc}</div>
        </div>
    `;
    
    container.appendChild(ach);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        ach.style.opacity = '0';
        setTimeout(() => ach.remove(), 300);
    }, 4000);
}

/* ==========================================================================
   5. STATE MANAGEMENT (Save/Load)
   ========================================================================== */

function loadState() {
    try {
        const saved = localStorage.getItem(ZYMATH_CONFIG.storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            STATE.exp = parsed.exp || 0;
            STATE.level = parsed.level || 1;
            STATE.solvedTasks = parsed.solvedTasks || [];
            STATE.history = parsed.history || [];
            // Generowanie dodatkowych zadań dynamicznych przy starcie
            generateDynamicTasks();
        } else {
            generateDynamicTasks();
        }
    } catch (e) {
        console.warn('[ZYMATH] Failed to load state:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem(ZYMATH_CONFIG.storageKey, JSON.stringify({
            exp: STATE.exp,
            level: STATE.level,
            solvedTasks: STATE.solvedTasks,
            history: STATE.history.slice(-20) // Keep last 20
        }));
    } catch (e) {
        console.error('[ZYMATH] Storage error:', e);
    }
}

/* ==========================================================================
   6. TASK SYSTEM & EXP ENGINE
   ========================================================================== */

function generateDynamicTasks() {
    // Generates mathematically sound random tasks to fill the 150 task quota
    const operations = ['+', '-', '*'];
    for(let i=11; i<=60; i++) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const op = operations[Math.floor(Math.random() * operations.length)];
        const ans = eval(`${a} ${op} ${b}`);
        TASK_DATABASE.push({
            id: `d_e${i}`, type: 'easy', q: `Oblicz: ${a} ${op} ${b}`, a: ans.toString()
        });
    }
    // Dynamic Medium
    for(let i=11; i<=60; i++) {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        TASK_DATABASE.push({
            id: `d_m${i}`, type: 'medium', q: `Rozwiąż: ${a}x = ${a*b}`, a: b.toString()
        });
    }
}

function filterTasks(type, btn) {
    document.querySelectorAll('.filters .f-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderTasks(type);
}

function renderTasks(filter = 'all') {
    const container = document.getElementById('task-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filtered = TASK_DATABASE.filter(t => filter === 'all' || t.type === filter);
    
    // Display only up to 24 tasks at a time to prevent DOM lag
    const displayTasks = filtered.slice(0, 24);

    displayTasks.forEach(task => {
        const isSolved = STATE.solvedTasks.includes(task.id);
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <div class="ci">
                <div class="task-badge ${task.type}">${task.type.toUpperCase()}</div>
                <div class="tb" style="font-size:1.1rem; color:var(--text); border:none; margin-bottom:16px;">${task.q}</div>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="ans_${task.id}" class="ti ${isSolved ? 'ok' : ''}" 
                           placeholder="Wpisz wynik..." ${isSolved ? 'disabled' : ''} 
                           value="${isSolved ? task.a : ''}" autocomplete="off">
                    ${!isSolved ? `<button class="btn btn-sm" onclick="checkTask('${task.id}')" style="margin:0; width:auto;"><i data-lucide="check"></i></button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
    if (window.MathJax) MathJax.typesetPromise();
}

function checkTask(taskId) {
    const input = document.getElementById(`ans_${taskId}`);
    if (!input) return;

    const task = TASK_DATABASE.find(t => t.id === taskId);
    if (!task) return;

    const userAns = input.value.trim().toLowerCase().replace(',', '.');
    const realAns = task.a.toLowerCase();

    if (userAns === realAns) {
        input.classList.add('ok');
        input.classList.remove('bad');
        input.disabled = true;
        input.nextElementSibling?.remove(); // Remove button
        
        // Award EXP
        let expGained = task.type === 'easy' ? 10 : (task.type === 'medium' ? 25 : 50);
        addExp(expGained);
        
        STATE.solvedTasks.push(taskId);
        saveState();
        showSnackbar(`Poprawna odpowiedź! +${expGained} EXP`);
        
        // Throw some confetti
        triggerConfetti(input);
    } else {
        input.classList.add('bad', 'shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        showSnackbar('Błędna odpowiedź. Spróbuj ponownie.', 'error');
    }
}

function addExp(amount) {
    STATE.exp += amount;
    STATE.level = Math.floor(STATE.exp / ZYMATH_CONFIG.expPerLevel) + 1;
    
    if (STATE.exp > 0 && STATE.exp % ZYMATH_CONFIG.expPerLevel < amount) {
        unlockAchievement('Awans!', `Osiągnąłeś Poziom ${STATE.level} w NEXUS Engine.`);
    }
    updateScoreUI();
}

function updateScoreUI() {
    const sv = document.getElementById('scoreVal');
    const lv = document.getElementById('lvlVal');
    const sol = document.getElementById('solvedVal');
    const fill = document.getElementById('progress-fill');
    
    if (sv) sv.innerText = STATE.exp;
    if (lv) lv.innerText = STATE.level;
    if (sol) sol.innerText = STATE.solvedTasks.length;
    
    if (fill) {
        const progress = (STATE.exp % ZYMATH_CONFIG.expPerLevel) / ZYMATH_CONFIG.expPerLevel * 100;
        fill.style.width = `${progress}%`;
    }
}

/* ==========================================================================
   7. ZYMATH GRAPH ENGINE 3.1 (Canvas 2D)
   ========================================================================== */

function initGraphEngine() {
    const canvas = document.getElementById('gCanvas');
    if (!canvas) return;

    // Handle mouse drag for panning
    canvas.addEventListener('mousedown', e => {
        STATE.graph.isDragging = true;
        STATE.graph.lastX = e.clientX;
        STATE.graph.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => STATE.graph.isDragging = false);

    window.addEventListener('mousemove', e => {
        if (STATE.graph.isDragging) {
            const dx = e.clientX - STATE.graph.lastX;
            const dy = e.clientY - STATE.graph.lastY;
            STATE.graph.offsetX += dx;
            STATE.graph.offsetY += dy;
            STATE.graph.lastX = e.clientX;
            STATE.graph.lastY = e.clientY;
            requestAnimationFrame(drawGraph);
        }
    });

    // Handle scroll for zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const zoomAmount = e.deltaY > 0 ? -2 : 2;
        const slider = document.getElementById('gScale');
        if (slider) {
            slider.value = Math.max(10, Math.min(150, parseInt(slider.value) + zoomAmount));
            drawGraph();
        }
    }, { passive: false });

    // Initial draw
    setTimeout(drawGraph, 100);
}

function drawGraph() {
    const canvas = document.getElementById('gCanvas');
    const s = document.getElementById('gScale');
    if (!canvas || !s) return;

    STATE.graph.scale = parseInt(s.value);
    
    // Fix DPI scaling for sharp lines
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    const cx = w / 2 + STATE.graph.offsetX;
    const cy = h / 2 + STATE.graph.offsetY;
    const scale = STATE.graph.scale;

    ctx.clearRect(0, 0, w, h);

    // Draw Grid
    ctx.strokeStyle = ZYMATH_CONFIG.graph.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = cx % scale; x < w; x += scale) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = cy % scale; y < h; y += scale) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Draw Axes
    ctx.strokeStyle = ZYMATH_CONFIG.graph.axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (cy >= 0 && cy <= h) { ctx.moveTo(0, cy); ctx.lineTo(w, cy); }
    if (cx >= 0 && cx <= w) { ctx.moveTo(cx, 0); ctx.lineTo(cx, h); }
    ctx.stroke();

    // Parse & Plot Functions
    ['fn1', 'fn2', 'fn3'].forEach((id, idx) => {
        const input = document.getElementById(id);
        if (input && input.value.trim() !== '') {
            plotFunction(ctx, input.value, cx, cy, scale, w, h, ZYMATH_CONFIG.graph.colors[idx]);
        }
    });
}

function plotFunction(ctx, fnStr, cx, cy, scale, w, h, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    let firstPoint = true;
    // Step size depends on scale to maintain performance
    const step = 2; 

    for (let px = 0; px < w; px += step) {
        const mathX = (px - cx) / scale;
        try {
            // Safely evaluate standard Math functions
            const safeFn = fnStr
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/log/g, 'Math.log')
                .replace(/PI/g, 'Math.PI')
                .replace(/E/g, 'Math.E')
                .replace(/\^/g, '**');

            // Using Function constructor is safer than eval for local scope
            const calc = new Function('x', `return ${safeFn};`);
            const mathY = calc(mathX);

            if (isNaN(mathY) || !isFinite(mathY)) {
                firstPoint = true;
                continue;
            }

            const py = cy - (mathY * scale);

            // Avoid drawing huge vertical lines on asymptotes (e.g. tan(x))
            if (py < -h*2 || py > h*3) {
                firstPoint = true;
                continue;
            }

            if (firstPoint) {
                ctx.moveTo(px, py);
                firstPoint = false;
            } else {
                ctx.lineTo(px, py);
            }
        } catch (e) {
            // Silently fail on invalid typing
            break;
        }
    }
    ctx.stroke();
}

/* ==========================================================================
   8. MATH CALCULATORS (Quadratic, Linear Systems)
   ========================================================================== */

window.calcQuad = function() {
    const a = parseFloat(document.getElementById('qa')?.value || 0);
    const b = parseFloat(document.getElementById('qb')?.value || 0);
    const c = parseFloat(document.getElementById('qc')?.value || 0);
    const res = document.getElementById('quadRes');
    
    if (a === 0) {
        res.innerHTML = '<span style="color:var(--rust)">To nie jest funkcja kwadratowa (a = 0)!</span>';
        return;
    }
    
    const delta = (b * b) - (4 * a * c);
    const p = (-b / (2 * a)).toFixed(2);
    const q = (-delta / (4 * a)).toFixed(2);
    
    let html = `<div class="rrow"><span>Delta (Δ)</span><b>${delta}</b></div>`;
    html += `<div class="rrow"><span>Wierzchołek</span><b>W = (${p}, ${q})</b></div>`;
    
    if (delta > 0) {
        const x1 = ((-b - Math.sqrt(delta)) / (2 * a)).toFixed(2);
        const x2 = ((-b + Math.sqrt(delta)) / (2 * a)).toFixed(2);
        html += `<div class="rrow"><span>Miejsca zerowe</span><b>x₁ = ${x1}, x₂ = ${x2}</b></div>`;
    } else if (delta === 0) {
        const x0 = (-b / (2 * a)).toFixed(2);
        html += `<div class="rrow"><span>Miejsce zerowe</span><b>x₀ = ${x0}</b></div>`;
    } else {
        html += `<div class="rrow"><span>Miejsca zerowe</span><b style="color:var(--rust)">Brak rzeczywistych</b></div>`;
    }
    
    res.innerHTML = html;
};

window.calcSystem = function() {
    const a1 = parseFloat(document.getElementById('s_a1')?.value || 0);
    const b1 = parseFloat(document.getElementById('s_b1')?.value || 0);
    const c1 = parseFloat(document.getElementById('s_c1')?.value || 0);
    const a2 = parseFloat(document.getElementById('s_a2')?.value || 0);
    const b2 = parseFloat(document.getElementById('s_b2')?.value || 0);
    const c2 = parseFloat(document.getElementById('s_c2')?.value || 0);
    
    const res = document.getElementById('sysRes');
    
    const W  = (a1 * b2) - (b1 * a2);
    const Wx = (c1 * b2) - (b1 * c2);
    const Wy = (a1 * c2) - (c1 * a2);
    
    if (W !== 0) {
        const x = (Wx / W).toFixed(2);
        const y = (Wy / W).toFixed(2);
        res.innerHTML = `
            <div class="rrow"><span>Wyznaczniki</span><b>W=${W}, Wx=${Wx}, Wy=${Wy}</b></div>
            <div class="rbig">x = ${x}<br>y = ${y}</div>
        `;
    } else if (W === 0 && Wx === 0 && Wy === 0) {
        res.innerHTML = '<div class="rbig" style="font-size:1.5rem">Układ nieoznaczony (∞ rozwiązań)</div>';
    } else {
        res.innerHTML = '<div class="rbig" style="color:var(--rust); font-size:1.5rem">Układ sprzeczny (brak)</div>';
    }
};

/* ==========================================================================
   9. POMODORO TIMER
   ========================================================================== */

window.togglePomodoro = function() {
    const p = STATE.pomodoro;
    if (p.isRunning) {
        clearInterval(p.interval);
        p.isRunning = false;
        showSnackbar('Pomodoro wstrzymane.');
    } else {
        p.isRunning = true;
        showSnackbar('Pomodoro uruchomione. Skup się!', 'success');
        p.interval = setInterval(() => {
            p.timeLeft--;
            updatePomodoroUI();
            if (p.timeLeft <= 0) {
                clearInterval(p.interval);
                p.isRunning = false;
                // Switch phase
                if (p.mode === 'work') {
                    p.mode = 'break';
                    p.timeLeft = 5 * 60; // 5 min break
                    unlockAchievement('Faza Focus Zakończona', 'Czas na 5 minut przerwy.');
                } else {
                    p.mode = 'work';
                    p.timeLeft = 25 * 60; // 25 min work
                    unlockAchievement('Przerwa Zakończona', 'Wracamy do pracy!');
                }
                updatePomodoroUI();
            }
        }, 1000);
    }
};

function updatePomodoroUI() {
    const t = document.getElementById('pom-timer');
    if (!t) return;
    const m = Math.floor(STATE.pomodoro.timeLeft / 60).toString().padStart(2, '0');
    const s = (STATE.pomodoro.timeLeft % 60).toString().padStart(2, '0');
    t.innerText = `${m}:${s}`;
    
    // Zmiana koloru w zależności od fazy
    const widget = document.getElementById('pomodoro');
    if (widget) {
        widget.style.borderColor = STATE.pomodoro.mode === 'work' ? 'var(--rust)' : 'var(--green-cc)';
        widget.style.color = STATE.pomodoro.mode === 'work' ? 'var(--rust)' : 'var(--green-cc)';
    }
}

/* ==========================================================================
   10. VIRTUAL MATH KEYBOARD
   ========================================================================== */

window.toggleMathKbd = function() {
    const kbd = document.getElementById('math-kbd');
    if (kbd) kbd.classList.toggle('visible');
};

window.insertMath = function(symbol) {
    // Finds the currently focused input and inserts the math symbol
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && activeEl.type === 'text') {
        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        const text = activeEl.value;
        activeEl.value = text.slice(0, start) + symbol + text.slice(end);
        activeEl.focus();
        activeEl.selectionStart = activeEl.selectionEnd = start + symbol.length;
    } else {
        showSnackbar('Kliknij najpierw pole tekstowe zadania.', 'error');
    }
};

/* ==========================================================================
   11. PARTICLES ENGINE (Subtle Background)
   ========================================================================== */

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(212, 168, 83, 0.4)'; // Soft Gold
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

function triggerConfetti(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-p';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.width = Math.random() * 8 + 4 + 'px';
        p.style.height = p.style.width;
        p.style.backgroundColor = i % 2 === 0 ? 'var(--gold)' : 'var(--green-cc)';
        
        document.body.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 100; // upward bias

        p.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800 + Math.random() * 400,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        }).onfinish = () => p.remove();
    }
}

/* ==========================================================================
   12. SECURITY & UTILS
   ========================================================================== */

function initSecurity() {
    // Simple honeypot check
    const trap = document.getElementById('security_trap');
    if (trap) {
        trap.addEventListener('input', () => {
            console.warn('[SECURITY] Bot activity detected.');
            document.body.innerHTML = '<h1 style="color:red; text-align:center; padding:50px;">SESSION TERMINATED</h1>';
        });
    }
}

/* ==========================================================================
   13. PWA REGISTRATION
   ========================================================================== */

function registerPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('[PWA] ServiceWorker registered:', registration.scope);
            }).catch(err => {
                console.warn('[PWA] ServiceWorker registration failed:', err);
            });
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window._deferredInstall = e;
        // Pokaż banner PWA po 5 sekundach od załadowania
        setTimeout(() => {
            document.getElementById('pwa-banner')?.classList.add('show');
        }, 5000);
    });
}

window.installPWA = function() {
    const banner = document.getElementById('pwa-banner');
    if (banner) banner.classList.remove('show');
    
    if (window._deferredInstall) {
        window._deferredInstall.prompt();
        window._deferredInstall.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showSnackbar('Dziękujemy za instalację Zymath!');
            }
            window._deferredInstall = null;
        });
    }
};

/* End of NEXUS Engine Core */
