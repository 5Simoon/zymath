/**
 * ════════════════════════════════════════════════════════════════════════════
 * ZYMATH SINGULARITY v4.0 — MAIN LOGIC & TASK GENERATOR
 * Pełna, samodzielna logika działania interfejsu i bazy danych.
 * ════════════════════════════════════════════════════════════════════════════
 */

const STATE = {
    exp: parseInt(localStorage.getItem('zymath-exp')) || 0,
    level: parseInt(localStorage.getItem('zymath-lvl')) || 1,
    solved: JSON.parse(localStorage.getItem('zymath-solved')) || [],
    tasks: [], // Tu trafi 150 zadań
    pomodoro: { timeLeft: 25 * 60, running: false, interval: null, mode: 'work' },
    graph: { scale: 45, ox: 0, oy: 0, isDragging: false, lx: 0, ly: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    initParticles();
    generateMassiveTaskDatabase(); // Tworzy 150 zadań!
    renderTasks('all');
    updateScoreUI();
    initGraphEngine();
});

/* ==========================================================================
   1. POTĘŻNY GENERATOR 150 ZADAŃ (Dynamiczny)
   ========================================================================== */
function generateMassiveTaskDatabase() {
    STATE.tasks = [];

    // --- 50 ZADAŃ EASY (Podstawy, Ułamki, Równania Liniowe) ---
    for(let i=1; i<=50; i++) {
        let q, a;
        const type = i % 4;
        if(type === 0) { // Dodawanie/Odejmowanie
            const x = Math.floor(Math.random() * 50) + 10;
            const y = Math.floor(Math.random() * 50) + 10;
            q = `Oblicz: ${x} + ${y}`; a = (x+y).toString();
        } else if(type === 1) { // Proste równanie
            const x = Math.floor(Math.random() * 10) + 2;
            const res = x * (Math.floor(Math.random() * 5) + 2);
            q = `Rozwiąż równanie: ${x}x = ${res}`; a = (res/x).toString();
        } else if(type === 2) { // Procenty
            const base = (Math.floor(Math.random() * 9) + 1) * 100;
            const perc = (Math.floor(Math.random() * 4) + 1) * 10;
            q = `Oblicz: ${perc}% z liczby ${base}`; a = ((perc/100)*base).toString();
        } else { // Pole prostokąta
            const x = Math.floor(Math.random() * 10) + 2;
            const y = Math.floor(Math.random() * 10) + 2;
            q = `Oblicz pole prostokąta o bokach a=${x} i b=${y}`; a = (x*y).toString();
        }
        STATE.tasks.push({ id: `easy_${i}`, type: 'easy', q, a });
    }

    // --- 50 ZADAŃ MEDIUM (Matura: Kwadratowe, Ciągi, Trygonometria) ---
    for(let i=1; i<=50; i++) {
        let q, a;
        const type = i % 4;
        if(type === 0) { // Delta
            const c = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 4;
            q = `Oblicz wyróżnik (Δ) dla: x² + ${b}x + ${c} = 0`; a = ((b*b) - 4*1*c).toString();
        } else if(type === 1) { // Ciąg arytmetyczny
            const a1 = Math.floor(Math.random() * 5) + 1;
            const r = Math.floor(Math.random() * 4) + 2;
            q = `Podaj czwarty wyraz ciągu arytmetycznego: a₁=${a1}, r=${r}`; a = (a1 + 3*r).toString();
        } else if(type === 2) { // Trygonometria z trójkąta prost.
            const a_bok = 3, b_bok = 4, c_bok = 5;
            q = `W trójkącie prostokątnym przyprostokątne to 3 i 4, przeciwprostokątna to 5. Ile wynosi sinus mniejszego kąta ostrego? (Zapisz jako ułamek np. 3/5)`; a = "3/5";
        } else { // Prawdopodobieństwo
            q = `Jakie jest prawdopodobieństwo wyrzucenia orła w rzucie monetą? (Zapisz jako ułamek np. 1/2)`; a = "1/2";
        }
        STATE.tasks.push({ id: `med_${i}`, type: 'medium', q, a });
    }

    // --- 50 ZADAŃ HARD (Rozszerzenie: Pochodne, Granice, Kombinatoryka) ---
    for(let i=1; i<=50; i++) {
        let q, a;
        const type = i % 3;
        if(type === 0) { // Pochodna w punkcie
            const exp = Math.floor(Math.random() * 3) + 2;
            q = `Oblicz wartość pochodnej f'(x) dla f(x) = x^${exp} w punkcie x = 2`; 
            a = (exp * Math.pow(2, exp-1)).toString();
        } else if(type === 1) { // Granica
            const wsp = Math.floor(Math.random() * 8) + 2;
            q = `Oblicz granicę: lim(x→∞) (${wsp}x² - 5) / (x² + 2)`; a = wsp.toString();
        } else { // Silnia / Kombinatoryka
            const n = Math.floor(Math.random() * 3) + 4; // 4, 5, 6
            let f = 1; for(let j=1; j<=n; j++) f*=j;
            q = `Ile jest permutacji zbioru ${n}-elementowego? (czyli ${n}!)`; a = f.toString();
        }
        STATE.tasks.push({ id: `hard_${i}`, type: 'hard', q, a });
    }
}

/* ==========================================================================
   2. OBSŁUGA ZADAŃ I UI
   ========================================================================== */
window.filterTasks = function(type, btn) {
    document.querySelectorAll('.filters .f-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderTasks(type);
};

function renderTasks(filter) {
    const container = document.getElementById('task-container');
    if(!container) return;
    container.innerHTML = '';

    const filtered = STATE.tasks.filter(t => filter === 'all' || t.type === filter);
    // Wyświetla pierwsze 30 z danej kategorii żeby nie zapchać przeglądarki
    const displayTasks = filtered.slice(0, 30);

    displayTasks.forEach(task => {
        const isSolved = STATE.solved.includes(task.id);
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
                    ${!isSolved ? `<button class="btn btn-sm" onclick="checkTask('${task.id}')" style="margin:0;"><i data-lucide="check"></i></button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    if(window.lucide) lucide.createIcons();
}

window.checkTask = function(taskId) {
    const input = document.getElementById(`ans_${taskId}`);
    const task = STATE.tasks.find(t => t.id === taskId);
    if(!input || !task) return;

    const userAns = input.value.trim().toLowerCase().replace(',', '.');
    if(userAns === task.a.toLowerCase()) {
        input.classList.add('ok'); input.classList.remove('bad');
        input.disabled = true;
        input.nextElementSibling?.remove();
        
        let exp = task.type === 'easy' ? 10 : (task.type === 'medium' ? 20 : 50);
        STATE.exp += exp;
        STATE.level = Math.floor(STATE.exp / 500) + 1;
        STATE.solved.push(taskId);
        
        localStorage.setItem('zymath-exp', STATE.exp);
        localStorage.setItem('zymath-lvl', STATE.level);
        localStorage.setItem('zymath-solved', JSON.stringify(STATE.solved));
        
        updateScoreUI();
        showSnackbar(`Brawo! +${exp} EXP`);
    } else {
        input.classList.add('bad', 'shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        showSnackbar('Błąd! Spróbuj ponownie.', 'error');
    }
};

function updateScoreUI() {
    const sv = document.getElementById('scoreVal');
    const lv = document.getElementById('lvlVal');
    const sol = document.getElementById('solvedVal');
    const fill = document.getElementById('progress-fill');
    if(sv) sv.innerText = STATE.exp;
    if(lv) lv.innerText = STATE.level;
    if(sol) sol.innerText = STATE.solved.length;
    if(fill) {
        const progress = (STATE.exp % 500) / 500 * 100;
        fill.style.width = `${progress}%`;
    }
}

/* ==========================================================================
   3. KALKULATORY I WYKRESY
   ========================================================================== */
window.calcQuad = function() {
    const a = parseFloat(document.getElementById('qa')?.value || 0);
    const b = parseFloat(document.getElementById('qb')?.value || 0);
    const c = parseFloat(document.getElementById('qc')?.value || 0);
    const res = document.getElementById('quadRes');
    if(a===0) { res.innerHTML = "To nie jest funkcja kwadratowa (a=0)!"; return; }
    
    const delta = (b*b) - (4*a*c);
    let out = `<div class="rrow"><span>Delta (Δ)</span><b>${delta}</b></div>`;
    if(delta > 0) {
        const x1 = ((-b - Math.sqrt(delta))/(2*a)).toFixed(2);
        const x2 = ((-b + Math.sqrt(delta))/(2*a)).toFixed(2);
        out += `<div class="rrow"><span>Miejsca zerowe</span><b>x₁=${x1}, x₂=${x2}</b></div>`;
    } else if(delta === 0) {
        out += `<div class="rrow"><span>Miejsce zerowe</span><b>x₀=${(-b/(2*a)).toFixed(2)}</b></div>`;
    } else {
        out += `<div class="rrow"><span>Miejsca zerowe</span><b>Brak</b></div>`;
    }
    res.innerHTML = out;
};

window.calcSystem = function() {
    const a1 = parseFloat(document.getElementById('s_a1')?.value||0), b1 = parseFloat(document.getElementById('s_b1')?.value||0), c1 = parseFloat(document.getElementById('s_c1')?.value||0);
    const a2 = parseFloat(document.getElementById('s_a2')?.value||0), b2 = parseFloat(document.getElementById('s_b2')?.value||0), c2 = parseFloat(document.getElementById('s_c2')?.value||0);
    const res = document.getElementById('sysRes');
    
    const W = a1*b2 - b1*a2, Wx = c1*b2 - b1*c2, Wy = a1*c2 - c1*a2;
    if(W !== 0) {
        res.innerHTML = `<div class="rbig" style="font-size:1.5rem">x = ${(Wx/W).toFixed(2)}<br>y = ${(Wy/W).toFixed(2)}</div>`;
    } else {
        res.innerHTML = "Brak jednoznacznego rozwiązania.";
    }
};

/* --- SILNIK WYKRESÓW 3.1 --- */
function initGraphEngine() {
    const canvas = document.getElementById('gCanvas');
    if(!canvas) return;
    canvas.addEventListener('mousedown', e => { STATE.graph.isDragging = true; STATE.graph.lx = e.clientX; STATE.graph.ly = e.clientY; });
    window.addEventListener('mouseup', () => STATE.graph.isDragging = false);
    canvas.addEventListener('mousemove', e => {
        if(STATE.graph.isDragging) {
            STATE.graph.ox += e.clientX - STATE.graph.lx;
            STATE.graph.oy += e.clientY - STATE.graph.ly;
            STATE.graph.lx = e.clientX; STATE.graph.ly = e.clientY;
            requestAnimationFrame(drawGraph);
        }
    });
    setTimeout(drawGraph, 100);
}

window.drawGraph = function() {
    const canvas = document.getElementById('gCanvas');
    const s = document.getElementById('gScale');
    if(!canvas || !s) return;
    
    STATE.graph.scale = parseInt(s.value);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const w = rect.width, h = rect.height;
    const cx = w/2 + STATE.graph.ox, cy = h/2 + STATE.graph.oy;
    const scale = STATE.graph.scale;

    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=cx%scale; x<w; x+=scale) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
    for(let y=cy%scale; y<h; y+=scale) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212,168,83,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    if(cy>=0 && cy<=h) { ctx.moveTo(0,cy); ctx.lineTo(w,cy); }
    if(cx>=0 && cx<=w) { ctx.moveTo(cx,0); ctx.lineTo(cx,h); }
    ctx.stroke();

    ['fn1', 'fn2'].forEach((id, idx) => {
        const inp = document.getElementById(id);
        if(inp && inp.value) plotFn(ctx, inp.value, cx, cy, scale, w, h, idx===0 ? '#C17B5E' : '#D4A853');
    });
};

function plotFn(ctx, str, cx, cy, scale, w, h, color) {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    let first = true;
    for(let px=0; px<w; px+=2) {
        const mx = (px-cx)/scale;
        try {
            const safeStr = str.replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/PI/g, 'Math.PI');
            const calc = new Function('x', `return ${safeStr};`);
            const my = calc(mx);
            if(isNaN(my)) { first = true; continue; }
            const py = cy - (my*scale);
            if(py < -h || py > h*2) { first = true; continue; }
            if(first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
        } catch(e) { break; }
    }
    ctx.stroke();
}

/* ==========================================================================
   4. NARZĘDZIA (Snackbar, Pomodoro, Klawiatura, Cząsteczki)
   ========================================================================== */
window.showSnackbar = function(msg, type='info') {
    const cont = document.getElementById('snackbar-container');
    if(!cont) return;
    const t = document.createElement('div');
    t.className = 'snackbar';
    t.style.borderLeftColor = type === 'error' ? 'var(--rust)' : 'var(--gold)';
    t.innerHTML = msg;
    cont.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 3000);
};

window.togglePomodoro = function() {
    const p = STATE.pomodoro;
    if(p.running) {
        clearInterval(p.interval); p.running = false;
        showSnackbar('Pomodoro zatrzymane.');
    } else {
        p.running = true;
        showSnackbar('Pomodoro wystartowało!');
        p.interval = setInterval(() => {
            p.timeLeft--;
            const m = Math.floor(p.timeLeft / 60).toString().padStart(2, '0');
            const s = (p.timeLeft % 60).toString().padStart(2, '0');
            document.getElementById('pom-timer').innerText = `${m}:${s}`;
            if(p.timeLeft <= 0) {
                clearInterval(p.interval); p.running = false;
                showSnackbar('Koniec czasu!');
                p.timeLeft = 25*60;
            }
        }, 1000);
    }
};

window.toggleMathKbd = function() {
    document.getElementById('math-kbd')?.classList.toggle('visible');
};
window.insertMath = function(char) {
    const active = document.activeElement;
    if(active && active.tagName === 'INPUT') {
        active.value += char;
    } else {
        showSnackbar('Wybierz pole tekstowe przed kliknięciem.', 'error');
    }
};

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, pts = [];
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    
    for(let i=0; i<30; i++) pts.push({ x: Math.random()*w, y: Math.random()*h, vx: Math.random()-0.5, vy: Math.random()-0.5 });
    
    function anim() {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = 'rgba(212, 168, 83, 0.4)';
        pts.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if(p.x<0 || p.x>w) p.vx*=-1; if(p.y<0 || p.y>h) p.vy*=-1;
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill();
        });
        requestAnimationFrame(anim);
    }
    anim();
}
