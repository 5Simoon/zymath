/**
 * ════════════════════════════════════════════════════════════════════════════
 * ZYMATH SINGULARITY v4.0 — MAIN SYSTEM LOGIC
 * Kompletne zarządzanie: Osiągnięcia, Historia, UI, Wykresy, Zadania
 * ════════════════════════════════════════════════════════════════════════════
 */
"use strict";

const STATE = {
    exp: parseInt(localStorage.getItem('zymath_score')) || 0,
    level: 1,
    solved: JSON.parse(localStorage.getItem('zymath_solved')) || [],
    tasks: [],
    history: JSON.parse(localStorage.getItem('zymath_history')) || [],
    achievements: JSON.parse(localStorage.getItem('zymath_ach_prog')) || { solved:0, calcs:0, themes:0, searches:0, pomodoros:0 },
    pomodoro: { time: 25*60, running: false, interval: null },
    graph: { scale: 45, ox: 0, oy: 0, drag: false, lx: 0, ly: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    
    // Inicjalizacje
    initParticles();
    build150Tasks();
    renderTasks('all');
    updateScoreUI();
    initGraphEngine();
    renderHistory();

    // Eventy UI (Kalkulatory)
    document.getElementById('btn-calc-quad')?.addEventListener('click', calcQuad);
    document.getElementById('btn-calc-sys')?.addEventListener('click', calcSystem);

    // Klawiatura Math
    document.getElementById('kbd-toggle-btn')?.addEventListener('click', () => {
        document.getElementById('math-kbd').classList.toggle('visible');
    });
    document.querySelectorAll('.kbd-key').forEach(btn => {
        btn.addEventListener('click', (e) => insertMath(e.target.dataset.char));
    });

    // Wyszukiwarka
    document.getElementById('search-btn')?.addEventListener('click', openSearch);
    document.getElementById('search-close')?.addEventListener('click', closeSearch);
    document.addEventListener('keydown', e => {
        if(e.ctrlKey && e.key === 'k') { e.preventDefault(); openSearch(); }
        if(e.key === 'Escape') closeSearch();
    });

    // Filtrowanie zadań
    document.querySelectorAll('.filters .f-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filters .f-btn').forEach(b => b.classList.remove('on'));
            e.target.classList.add('on');
            renderTasks(e.target.dataset.filter);
        });
    });

    // Honeypot
    const trap = document.getElementById('security_trap');
    if (trap) setInterval(() => { if (trap.value) document.body.innerHTML = ''; }, 3000);
});

/* ── GENERATOR 150 ZADAŃ ──────────────────────────────────────────────── */
function build150Tasks() {
    STATE.tasks = [];
    
    // 50 x EASY (Podstawy)
    for(let i=1; i<=50; i++) {
        let q, a;
        if(i%4 === 0) { const x = Math.floor(Math.random()*50)+10, y = Math.floor(Math.random()*50)+10; q=`Oblicz: ${x} + ${y}`; a=(x+y).toString(); }
        else if(i%4 === 1) { const x = Math.floor(Math.random()*10)+2, r = x*(Math.floor(Math.random()*5)+2); q=`Rozwiąż: ${x}x = ${r}`; a=(r/x).toString(); }
        else if(i%4 === 2) { const b = (Math.floor(Math.random()*9)+1)*100, p = (Math.floor(Math.random()*4)+1)*10; q=`Oblicz: ${p}% z ${b}`; a=((p/100)*b).toString(); }
        else { const x = Math.floor(Math.random()*10)+2, y = Math.floor(Math.random()*10)+2; q=`Pole prostokąta a=${x}, b=${y}`; a=(x*y).toString(); }
        STATE.tasks.push({ id:`e_${i}`, type:'easy', q, a });
    }

    // 50 x MEDIUM (Matura)
    for(let i=1; i<=50; i++) {
        let q, a;
        if(i%4 === 0) { const c = Math.floor(Math.random()*5)+1, b = Math.floor(Math.random()*5)+4; q=`Oblicz Δ dla: x² + ${b}x + ${c} = 0`; a=((b*b)-4*1*c).toString(); }
        else if(i%4 === 1) { const a1 = Math.floor(Math.random()*5)+1, r = Math.floor(Math.random()*4)+2; q=`Ciąg arytm. a₁=${a1}, r=${r}. Oblicz a₄.`; a=(a1+3*r).toString(); }
        else if(i%4 === 2) { q=`W trójkącie prost. przyprostokątne to 3 i 4. Przeciwprostokątna to 5. Ile wynosi sinus najmniejszego kąta?`; a="3/5"; }
        else { q=`Rzut kostką sześciościenną. Prawdopodobieństwo wyrzucenia liczby parzystej?`; a="1/2"; }
        STATE.tasks.push({ id:`m_${i}`, type:'medium', q, a });
    }

    // 50 x HARD (Rozszerzenie)
    for(let i=1; i<=50; i++) {
        let q, a;
        if(i%3 === 0) { const e = Math.floor(Math.random()*3)+2; q=`Pochodna f(x) = x^${e} w punkcie x = 2`; a=(e*Math.pow(2,e-1)).toString(); }
        else if(i%3 === 1) { const w = Math.floor(Math.random()*8)+2; q=`Granica: lim(x→∞) (${w}x²-1) / (x²+3)`; a=w.toString(); }
        else { const n = Math.floor(Math.random()*3)+4; let f=1; for(let j=1;j<=n;j++) f*=j; q=`Ilość permutacji zbioru ${n}-elementowego (${n}!)`; a=f.toString(); }
        STATE.tasks.push({ id:`h_${i}`, type:'hard', q, a });
    }
}

/* ── UI ZADAŃ ─────────────────────────────────────────────────────────── */
function renderTasks(filter) {
    const container = document.getElementById('task-container');
    if(!container) return;
    container.innerHTML = '';
    
    const filtered = STATE.tasks.filter(t => filter === 'all' || t.type === filter).slice(0, 30); // Max 30 wizualnie naraz dla wydajności
    filtered.forEach(task => {
        const isSolved = STATE.solved.includes(task.id);
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <div class="ci">
                <div class="task-badge ${task.type}">${task.type}</div>
                <div class="tb" style="font-size:1.1rem; color:var(--text); border:none; margin-bottom:16px;">${task.q}</div>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="ans_${task.id}" class="ti ${isSolved ? 'ok' : ''}" placeholder="Wynik..." ${isSolved ? 'disabled' : ''} value="${isSolved ? task.a : ''}">
                    ${!isSolved ? `<button class="btn btn-sm" onclick="checkTask('${task.id}')" style="margin:0;"><i data-lucide="check"></i></button>` : ''}
                </div>
            </div>`;
        container.appendChild(card);
    });
    if(window.lucide) lucide.createIcons();
}

window.checkTask = function(id) {
    const input = document.getElementById(`ans_${id}`);
    const task = STATE.tasks.find(t => t.id === id);
    if(!input || !task) return;

    if(input.value.trim().toLowerCase().replace(',','.') === task.a.toLowerCase()) {
        input.classList.add('ok'); input.classList.remove('bad'); input.disabled = true;
        input.nextElementSibling?.remove();
        
        const xp = task.type === 'easy' ? 10 : (task.type === 'medium' ? 20 : 50);
        STATE.exp += xp;
        STATE.solved.push(id);
        
        localStorage.setItem('zymath_score', STATE.exp);
        localStorage.setItem('zymath_solved', JSON.stringify(STATE.solved));
        
        updateScoreUI();
        showSnackbar(`Brawo! +${xp} EXP`);
        incrementStat('solved');
        
    } else {
        input.classList.add('bad', 'shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        showSnackbar('Błąd! Spróbuj ponownie.', 'error');
    }
};

function updateScoreUI() {
    STATE.level = Math.floor(STATE.exp / 500) + 1;
    document.getElementById('scoreVal').innerText = STATE.exp;
    document.getElementById('lvlVal').innerText = STATE.level;
    document.getElementById('solvedVal').innerText = STATE.solved.length;
    document.getElementById('progress-fill').style.width = `${(STATE.exp % 500) / 500 * 100}%`;
}

/* ── KALKULATORY (QUADRATIC & SYSTEM) ─────────────────────────────────── */
window.calcQuad = function() {
    const a=parseFloat(document.getElementById('qa')?.value||0), b=parseFloat(document.getElementById('qb')?.value||0), c=parseFloat(document.getElementById('qc')?.value||0);
    const res = document.getElementById('quadRes');
    if(a===0) { res.innerHTML = "To nie funkcja kwadratowa (a=0)!"; return; }
    
    const delta = (b*b) - (4*a*c);
    let out = `<div class="rrow"><span>Delta (Δ)</span><b>${delta}</b></div>`;
    if(delta > 0) {
        out += `<div class="rrow"><span>Miejsca zerowe</span><b>x₁=${((-b-Math.sqrt(delta))/(2*a)).toFixed(2)}, x₂=${((-b+Math.sqrt(delta))/(2*a)).toFixed(2)}</b></div>`;
    } else if(delta === 0) {
        out += `<div class="rrow"><span>Miejsce zerowe</span><b>x₀=${(-b/(2*a)).toFixed(2)}</b></div>`;
    } else {
        out += `<div class="rrow"><span>Miejsca zerowe</span><b>Brak (Δ < 0)</b></div>`;
    }
    res.innerHTML = out;
    incrementStat('calcs'); addHistory(`Kwadratowa: ${a}x² + ${b}x + ${c}`, `Δ=${delta}`);
};

window.calcSystem = function() {
    const a1=parseFloat(document.getElementById('s_a1').value||0), b1=parseFloat(document.getElementById('s_b1').value||0), c1=parseFloat(document.getElementById('s_c1').value||0);
    const a2=parseFloat(document.getElementById('s_a2').value||0), b2=parseFloat(document.getElementById('s_b2').value||0), c2=parseFloat(document.getElementById('s_c2').value||0);
    const res = document.getElementById('sysRes');
    const W = a1*b2 - b1*a2, Wx = c1*b2 - b1*c2, Wy = a1*c2 - c1*a2;
    
    if(W !== 0) {
        res.innerHTML = `<div class="rbig" style="font-size:1.5rem">x = ${(Wx/W).toFixed(2)}<br>y = ${(Wy/W).toFixed(2)}</div>`;
        addHistory(`Układ: W=${W}`, `x=${(Wx/W).toFixed(2)}, y=${(Wy/W).toFixed(2)}`);
    } else { res.innerHTML = "Brak lub nieskończenie wiele rozwiązań."; }
    incrementStat('calcs');
};

/* ── ZYMATH GRAPH ENGINE ──────────────────────────────────────────────── */
function initGraphEngine() {
    const canvas = document.getElementById('gCanvas');
    if(!canvas) return;
    canvas.addEventListener('mousedown', e => { STATE.graph.drag = true; STATE.graph.lx = e.clientX; STATE.graph.ly = e.clientY; });
    window.addEventListener('mouseup', () => STATE.graph.drag = false);
    canvas.addEventListener('mousemove', e => {
        if(STATE.graph.drag) {
            STATE.graph.ox += e.clientX - STATE.graph.lx;
            STATE.graph.oy += e.clientY - STATE.graph.ly;
            STATE.graph.lx = e.clientX; STATE.graph.ly = e.clientY;
            requestAnimationFrame(window.drawGraph);
        }
    });
    document.getElementById('fn1')?.addEventListener('input', window.drawGraph);
    document.getElementById('fn2')?.addEventListener('input', window.drawGraph);
    document.getElementById('gScale')?.addEventListener('input', window.drawGraph);
    setTimeout(window.drawGraph, 100);
}

window.drawGraph = function() {
    const canvas = document.getElementById('gCanvas'), s = document.getElementById('gScale');
    if(!canvas || !s) return;
    STATE.graph.scale = parseInt(s.value);
    
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth, h = 400;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    
    const cx = w/2 + STATE.graph.ox, cy = h/2 + STATE.graph.oy, scale = STATE.graph.scale;
    ctx.clearRect(0,0,w,h);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for(let x=cx%scale; x<w; x+=scale) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
    for(let y=cy%scale; y<h; y+=scale) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212,168,83,0.3)'; ctx.lineWidth = 2; ctx.beginPath();
    if(cy>=0 && cy<=h) { ctx.moveTo(0,cy); ctx.lineTo(w,cy); }
    if(cx>=0 && cx<=w) { ctx.moveTo(cx,0); ctx.lineTo(cx,h); }
    ctx.stroke();

    ['fn1', 'fn2'].forEach((id, idx) => {
        const inp = document.getElementById(id);
        if(inp && inp.value) plotFunction(ctx, inp.value, cx, cy, scale, w, h, idx===0 ? '#C17B5E' : '#D4A853');
    });
};

function plotFunction(ctx, expr, cx, cy, scale, w, h, color) {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; let first = true;
    for(let px=0; px<w; px+=2) {
        try {
            const e = expr.replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/PI/g, 'Math.PI');
            const val = new Function('x', `return ${e};`)((px-cx)/scale);
            if(isNaN(val)) { first=true; continue; }
            const py = cy - (val*scale);
            if(py < -h || py > h*2) { first=true; continue; }
            if(first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
        } catch { break; }
    }
    ctx.stroke();
}

/* ── HISTORIA & NARZĘDZIA ─────────────────────────────────────────────── */
window.addHistory = function(label, value) {
    STATE.history.unshift({ label, value, t: new Date().toLocaleTimeString() });
    if(STATE.history.length > 5) STATE.history.pop();
    localStorage.setItem('zymath_history', JSON.stringify(STATE.history));
    renderHistory();
};

function renderHistory() {
    const el = document.getElementById('historyList');
    if(!el) return;
    if(STATE.history.length === 0) { el.innerHTML = "<div class='history-empty'>Brak historii</div>"; return; }
    el.innerHTML = STATE.history.map(h => `
        <div class="history-item">
            <span>${h.label}</span>
            <span class="h-val">${h.value}</span>
        </div>
    `).join('');
}

window.showSnackbar = function(msg, type='info') {
    const c = document.getElementById('snackbar-container');
    if(!c) return;
    const t = document.createElement('div'); t.className = 'snackbar';
    t.style.borderLeftColor = type === 'error' ? 'var(--rust)' : 'var(--gold)';
    t.innerHTML = msg; c.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3000);
};

window.insertMath = function(char) {
    const act = document.activeElement;
    if(act && act.tagName === 'INPUT') act.value += char;
    else showSnackbar('Wybierz pole wpisywania.', 'error');
};

/* ── POMODORO ─────────────────────────────────────────────────────────── */
window.togglePomodoro = function() {
    const p = STATE.pomodoro;
    if(p.running) { clearInterval(p.interval); p.running = false; showSnackbar('Pomodoro wstrzymane.'); }
    else {
        p.running = true; showSnackbar('Pomodoro wystartowało!');
        p.interval = setInterval(() => {
            p.time--;
            const m = Math.floor(p.time/60).toString().padStart(2,'0'), s = (p.time%60).toString().padStart(2,'0');
            document.getElementById('pom-timer').innerText = `${m}:${s}`;
            if(p.time <= 0) { clearInterval(p.interval); p.running = false; p.time = 25*60; incrementStat('pomodoros'); showSnackbar('Czas minął!'); }
        }, 1000);
    }
};

/* ── OSIĄGNIĘCIA ──────────────────────────────────────────────────────── */
window.incrementStat = function(key) {
    STATE.achievements[key]++;
    localStorage.setItem('zymath_ach_prog', JSON.stringify(STATE.achievements));
    checkAchievements();
};

function checkAchievements() {
    const a = STATE.achievements;
    if(a.solved === 1) unlockAch('Pierwsze Kroki', 'Rozwiązano 1 zadanie');
    if(a.calcs === 1) unlockAch('Inicjacja', 'Użyto kalkulatora');
    if(a.pomodoros === 1) unlockAch('Fokus', 'Ukończono pomodoro');
}

function unlockAch(title, desc) {
    const c = document.getElementById('ach-toast-container');
    if(!c) return;
    const t = document.createElement('div'); t.className = 'ach-toast';
    t.innerHTML = `<i data-lucide="award" style="color:var(--gold);"></i> <div><div style="font-weight:600">${title}</div><div style="font-size:0.8rem; color:var(--muted-hi)">${desc}</div></div>`;
    c.appendChild(t); if(window.lucide) lucide.createIcons();
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 4000);
}

/* ── WYSZUKIWARKA & CZĄSTECZKI ────────────────────────────────────────── */
window.openSearch = function() { document.getElementById('search-overlay')?.classList.add('open'); document.getElementById('searchInput')?.focus(); incrementStat('searches'); };
window.closeSearch = function() { document.getElementById('search-overlay')?.classList.remove('open'); };

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, pts = [];
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    for(let i=0; i<30; i++) pts.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5 });
    
    function anim() {
        ctx.clearRect(0,0,w,h); ctx.fillStyle = 'rgba(212,168,83,0.5)';
        pts.forEach(p => { p.x += p.vx; p.y += p.vy; if(p.x<0 || p.x>w) p.vx*=-1; if(p.y<0 || p.y>h) p.vy*=-1; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); });
        requestAnimationFrame(anim);
    }
    anim();
}
