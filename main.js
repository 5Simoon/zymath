
'use strict';
/* PAGE SECURITY */
// 1. Ochrona przed osadzaniem w ramkach (Iframe Buster)
if (window.top !== window.self) { window.top.location = window.self.location; }

// 2. Sanitizer - czyść dane z inputów przed liczeniem
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.replace(/[<>'"\/]/g, '');
}

// 3. Honeypot - Pułapka na boty
// Dodaj w HTML: <input type="text" id="trap" style="display:none;" tabindex="-1">
function isBot() {
    return document.getElementById('trap').value.length > 0;
}

/* ═══════════════════════════════════════════════════════════
   1. INIT
═══════════════════════════════════════════════════════════ */
lucide.createIcons();

/* ═══════════════════════════════════════════════════════════
   2. SPOTLIGHT GLOW
═══════════════════════════════════════════════════════════ */
document.addEventListener('pointermove', (e) => {
    for (const card of document.querySelectorAll('.card')) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
});

/* ═══════════════════════════════════════════════════════════
   3. TABS
═══════════════════════════════════════════════════════════ */
function showTab(id, btn) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    document.getElementById(id).classList.add('active');
    btn.classList.add('active'); btn.setAttribute('aria-current', 'page');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'kalkulatory') setTimeout(drawGraph, 200);
}

/* ═══════════════════════════════════════════════════════════
   4. EASTER EGG
═══════════════════════════════════════════════════════════ */
let eggCount = 0;
function easterEgg() {
    eggCount++;
    if (eggCount % 3 === 0) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg) contrast(1.4)';
        setTimeout(() => document.body.style.filter = 'none', 1800);
    } else {
        document.body.style.transform = `rotate(${(Math.random()-0.5)*6}deg)`;
        setTimeout(() => document.body.style.transform = 'none', 400);
    }
}

/* ═══════════════════════════════════════════════════════════
   5. SAFE MATH EVALUATOR (replaces eval)
═══════════════════════════════════════════════════════════ */
function safeMathEval(expr, xVal) {
    if (typeof expr !== 'string' || expr.length > 300) throw new Error('Invalid expression');
    const forbidden = /\b(window|document|self|globalThis|top|parent|frames|location|history|navigator|fetch|XMLHttpRequest|WebSocket|import|require|eval|Function|process|__proto__|prototype|constructor|Reflect|Proxy|Symbol|alert|confirm|prompt|console|localStorage|sessionStorage|cookie|Worker)\b/i;
    if (forbidden.test(expr)) throw new Error('Forbidden identifier');
    const fn = new Function('x', 'Math', `"use strict";
        const {sin,cos,tan,asin,acos,atan,atan2,sqrt,abs,pow,log,log2,log10,
               floor,ceil,round,min,max,sign,cbrt,exp,sinh,cosh,tanh,
               PI,E,SQRT2,hypot,trunc} = Math;
        return (${expr});`);
    return fn(xVal, Math);
}

/* ═══════════════════════════════════════════════════════════
   6. GRAPH ENGINE v3.1 — zoom, pan, 3 functions, tick labels
═══════════════════════════════════════════════════════════ */
const gCanvas = document.getElementById('gCanvas');
const gCtx = gCanvas ? gCanvas.getContext('2d') : null;

// Resize canvas to actual CSS size
function resizeCanvas() {
    if (!gCanvas) return;
    const rect = gCanvas.getBoundingClientRect();
    gCanvas.width = rect.width * devicePixelRatio;
    gCanvas.height = rect.height * devicePixelRatio;
    gCtx.scale(devicePixelRatio, devicePixelRatio);
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);

const gs = { scale: 45, ox: 0, oy: 0, drag: false, lx: 0, ly: 0 };
const COLORS = ['#ff003c', '#00d4ff', '#fbbf24'];

if (gCanvas) {
    gCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.12 : 0.89;
        gs.scale = Math.max(8, Math.min(220, gs.scale * f));
        document.getElementById('gScale').value = gs.scale;
        drawGraph();
    }, { passive: false });

    gCanvas.addEventListener('pointerdown', e => {
        gs.drag = true; gs.lx = e.clientX; gs.ly = e.clientY;
        gCanvas.setPointerCapture(e.pointerId);
        gCanvas.style.cursor = 'grabbing';
    });
    gCanvas.addEventListener('pointermove', e => {
        if (gs.drag) {
            gs.ox += e.clientX - gs.lx;
            gs.oy += e.clientY - gs.ly;
            gs.lx = e.clientX; gs.ly = e.clientY;
            drawGraph();
        }
        // show coords
        const r = gCanvas.getBoundingClientRect();
        const cssW = r.width, cssH = r.height;
        const mx = cssW / 2 + gs.ox, my = cssH / 2 + gs.oy;
        const xi = ((e.clientX - r.left) - mx) / gs.scale;
        const yi = -(((e.clientY - r.top) - my) / gs.scale);
        const el = document.getElementById('gCoords');
        el.textContent = '';
        el.append('x: ', Object.assign(document.createElement('span'), { textContent: xi.toFixed(3), style: 'color:#fff' }), '  |  y: ', Object.assign(document.createElement('span'), { textContent: yi.toFixed(3), style: 'color:#fff' }));
    });
    gCanvas.addEventListener('pointerup', () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
    gCanvas.addEventListener('pointerleave', () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
}

function resetGraph() {
    gs.ox = 0; gs.oy = 0; gs.scale = 45;
    document.getElementById('gScale').value = 45;
    drawGraph();
}

function drawGraph() {
    if (!gCanvas || !gCtx) return;
    // sync scale from slider if not zoomed
    const sliderScale = parseFloat(document.getElementById('gScale').value) || 45;
    if (!gs.drag) gs.scale = sliderScale;

    const W = gCanvas.width / devicePixelRatio;
    const H = gCanvas.height / devicePixelRatio;
    const sc = gs.scale;
    const ox = W / 2 + gs.ox;
    const oy = H / 2 + gs.oy;

    gCtx.clearRect(0, 0, W, H);
    gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, W, H);

    // minor grid
    gCtx.strokeStyle = 'rgba(255,255,255,0.04)'; gCtx.lineWidth = 1;
    const step = sc;
    for (let x = (ox % step); x < W; x += step) { gCtx.beginPath(); gCtx.moveTo(x, 0); gCtx.lineTo(x, H); gCtx.stroke(); }
    for (let y = (oy % step); y < H; y += step) { gCtx.beginPath(); gCtx.moveTo(0, y); gCtx.lineTo(W, y); gCtx.stroke(); }

    // axes
    gCtx.strokeStyle = 'rgba(255,255,255,0.25)'; gCtx.lineWidth = 1.5;
    gCtx.beginPath(); gCtx.moveTo(0, oy); gCtx.lineTo(W, oy); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(ox, 0); gCtx.lineTo(ox, H); gCtx.stroke();

    // tick marks + labels
    gCtx.fillStyle = 'rgba(255,255,255,0.45)';
    gCtx.font = `${Math.max(9, Math.min(12, sc * 0.22))}px 'Google Sans Code', monospace`;
    gCtx.textAlign = 'center';
    const xStart = Math.ceil(-ox / sc), xEnd = Math.floor((W - ox) / sc);
    for (let n = xStart; n <= xEnd; n++) {
        if (n === 0) continue;
        const px = ox + n * sc;
        gCtx.strokeStyle = 'rgba(255,255,255,0.2)'; gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(px, oy - 4); gCtx.lineTo(px, oy + 4); gCtx.stroke();
        if (sc > 20) gCtx.fillText(n, px, oy + 16);
    }
    gCtx.textAlign = 'right';
    const yStart = Math.ceil((oy - H) / sc), yEnd = Math.floor(oy / sc);
    for (let n = yStart; n <= yEnd; n++) {
        if (n === 0) continue;
        const py = oy - n * sc;
        gCtx.strokeStyle = 'rgba(255,255,255,0.2)'; gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(ox - 4, py); gCtx.lineTo(ox + 4, py); gCtx.stroke();
        if (sc > 20) gCtx.fillText(n, ox - 8, py + 4);
    }

    // plot functions
    const fns = ['fn1','fn2','fn3'].map(id => document.getElementById(id).value.trim()).filter(Boolean);
    fns.forEach((expr, idx) => {
        let compiled;
        try { safeMathEval(expr, 0); compiled = (x) => safeMathEval(expr, x); }
        catch(e) {
            gCtx.fillStyle = COLORS[idx]; gCtx.font = '12px monospace';
            gCtx.fillText(`f${idx+1}: ${e.message}`, W/2, 20 + idx*18);
            return;
        }
        gCtx.strokeStyle = COLORS[idx]; gCtx.lineWidth = 2.5; gCtx.lineJoin = 'round';
        gCtx.shadowColor = COLORS[idx]; gCtx.shadowBlur = 6;
        gCtx.beginPath();
        let first = true;
        for (let px = 0; px < W; px++) {
            const x = (px - ox) / sc;
            try {
                const y = compiled(x);
                if (!isFinite(y) || isNaN(y)) { first = true; continue; }
                const py = oy - y * sc;
                if (Math.abs(py - (oy - compiled((px-1-ox)/sc) * sc)) > H * 2) { first = true; }
                if (first) { gCtx.moveTo(px, py); first = false; }
                else gCtx.lineTo(px, py);
            } catch { first = true; }
        }
        gCtx.stroke();
        gCtx.shadowBlur = 0;
    });
}

/* ═══════════════════════════════════════════════════════════
   7. CALCULATORS
═══════════════════════════════════════════════════════════ */

// Quadratic analyzer
function calcQuad() {
    const a = parseFloat(document.getElementById('qa').value);
    const b = parseFloat(document.getElementById('qb').value);
    const c = parseFloat(document.getElementById('qc').value);
    const res = document.getElementById('quadRes');
    if ([a,b,c].some(isNaN)) { res.style.color = 'var(--muted)'; res.textContent = 'Oczekiwanie na parametry…'; return; }
    if (a === 0) { res.innerHTML = '<span style="color:var(--red)">Współczynnik a ≠ 0 dla paraboli.</span>'; return; }
    const D = b*b - 4*a*c, p = -b/(2*a), q = -D/(4*a);
    let html = `<div style="color:var(--red);font-size:1.6rem;font-family:var(--font-display);font-weight:800;margin-bottom:8px">Δ = ${D.toFixed(4)}</div>`;
    html += `<div style="margin-bottom:6px;color:var(--muted-hi)">Wierzchołek: W(${p.toFixed(4)}, ${q.toFixed(4)}) &nbsp;|&nbsp; Oś symetrii: x = ${p.toFixed(4)}</div>`;
    if (D > 0) html += `<div style="color:#fff">x₁ = ${((-b-Math.sqrt(D))/(2*a)).toFixed(4)} &nbsp;&nbsp; x₂ = ${((-b+Math.sqrt(D))/(2*a)).toFixed(4)}</div>`;
    else if (D === 0) html += `<div style="color:#fff">Podwójny pierwiastek: x₀ = ${p.toFixed(4)}</div>`;
    else html += `<div style="color:var(--muted)">Brak pierwiastków rzeczywistych (Δ &lt; 0)</div>`;
    html += `<div style="color:var(--muted);font-size:0.78rem;margin-top:8px">Postać wierz.: f(x) = ${a}(x${p >= 0 ? '-':'+'} ${Math.abs(p).toFixed(3)})² ${q >= 0 ? '+':'-'} ${Math.abs(q).toFixed(3)}</div>`;
    res.innerHTML = html;
}

// Linear system 2x2 (Cramer's rule)
function calcSystem() {
    const g = id => parseFloat(document.getElementById(id).value);
    const a1=g('s_a1'),b1=g('s_b1'),c1=g('s_c1'),a2=g('s_a2'),b2=g('s_b2'),c2=g('s_c2');
    const res = document.getElementById('sysRes');
    if ([a1,b1,c1,a2,b2,c2].some(isNaN)) { res.style.color='var(--muted)'; res.textContent='Podaj wszystkie współczynniki.'; return; }
    const D = a1*b2 - a2*b1;
    if (D === 0) {
        res.innerHTML = '<span style="color:var(--yellow)">Wyznacznik główny = 0 — układ sprzeczny lub nieokreślony.</span>';
    } else {
        const x = (c1*b2 - c2*b1)/D, y = (a1*c2 - a2*c1)/D;
        res.innerHTML = `<div style="font-size:1.4rem;font-weight:800;color:var(--red);margin-bottom:6px">x = ${x.toFixed(4)} &nbsp;&nbsp; y = ${y.toFixed(4)}</div><div style="color:var(--muted);font-size:0.8rem">Wyznacznik D = ${D}</div>`;
    }
}

// Trig calculator
function switchTrig(id, btn) {
    document.querySelectorAll('#trig-fn,#trig-tri').forEach(p => p.classList.remove('on'));
    document.getElementById('trig-' + id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function calcTrig() {
    let val = parseFloat(document.getElementById('trigVal').value);
    const unit = document.getElementById('trigUnit').value;
    if (isNaN(val)) return;
    if (unit === '°') val = val * Math.PI / 180;
    const set = (id, v) => { document.getElementById(id).textContent = isFinite(v) ? v.toFixed(6) : '—'; };
    set('tr-sin', Math.sin(val)); set('tr-cos', Math.cos(val));
    const t = Math.tan(val); set('tr-tan', Math.abs(Math.cos(val)) < 1e-10 ? NaN : t);
    set('tr-cot', Math.abs(Math.sin(val)) < 1e-10 ? NaN : 1/t);
}
function calcTriangle() {
    const ang = parseFloat(document.getElementById('tri-angle').value);
    const hyp = parseFloat(document.getElementById('tri-hyp').value);
    if (isNaN(ang) || isNaN(hyp)) return;
    const a = ang * Math.PI / 180;
    const sideA = hyp * Math.sin(a), sideB = hyp * Math.cos(a);
    document.getElementById('tri-a').textContent = sideA.toFixed(4) + ' (naprzeciwko α)';
    document.getElementById('tri-b').textContent = sideB.toFixed(4);
    document.getElementById('tri-p').textContent = (0.5 * sideA * sideB).toFixed(4);
}

// NWD / NWW / Prime
function switchNwd(id, btn) {
    ['nwd-panel','prime-panel'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById(id+'-panel').classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function calcNwd() {
    let a = Math.abs(parseInt(document.getElementById('na').value));
    let b = Math.abs(parseInt(document.getElementById('nb').value));
    if (!a || !b) { document.getElementById('r-nwd').textContent='—'; document.getElementById('r-nww').textContent='—'; return; }
    const d = gcd(a, b);
    document.getElementById('r-nwd').textContent = d;
    document.getElementById('r-nww').textContent = (a * b) / d;
}
function calcPrime() {
    let n = parseInt(document.getElementById('primeN').value);
    const res = document.getElementById('primeRes');
    if (isNaN(n) || n < 2 || n > 999999) { res.textContent = 'Podaj liczbę 2–999999.'; return; }
    const orig = n; const factors = {};
    for (let d = 2; d * d <= n; d++) { while (n % d === 0) { factors[d] = (factors[d] || 0) + 1; n /= d; } }
    if (n > 1) factors[n] = (factors[n] || 0) + 1;
    const parts = Object.entries(factors).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ');
    const isPrime = Object.keys(factors).length === 1 && Object.values(factors)[0] === 1;
    res.innerHTML = `<div style="color:var(--text);font-size:1.1rem;margin-bottom:6px">${orig} = ${parts}</div><div style="color:var(--muted);font-size:0.8rem">${isPrime ? '✓ Liczba pierwsza' : `Czynniki: ${Object.keys(factors).join(', ')}`}</div>`;
}

// Statistics — enhanced
function calcStats() {
    const v = document.getElementById('statIn').value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    document.getElementById('s-n').textContent = v.length;
    if (!v.length) { ['s-mean','s-med','s-mode','s-std','s-range'].forEach(id => document.getElementById(id).textContent = '—'); return; }
    const mean = v.reduce((a,b)=>a+b,0)/v.length;
    document.getElementById('s-mean').textContent = mean.toFixed(4);
    const sorted = [...v].sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length/2);
    document.getElementById('s-med').textContent = sorted.length%2 ? sorted[mid].toFixed(4) : ((sorted[mid-1]+sorted[mid])/2).toFixed(4);
    // mode
    const freq = {}; v.forEach(x => freq[x] = (freq[x]||0)+1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.entries(freq).filter(([,f])=>f===maxFreq).map(([v])=>v);
    document.getElementById('s-mode').textContent = maxFreq > 1 ? modes.join(', ') : 'brak';
    // sample std dev
    const variance = v.reduce((sum,x)=>sum+(x-mean)**2,0)/(v.length-1);
    document.getElementById('s-std').textContent = Math.sqrt(variance).toFixed(4);
    document.getElementById('s-range').textContent = (sorted[sorted.length-1]-sorted[0]).toFixed(4);
}

// Number systems
function decToRoman(n){if(n<=0||n>=4000)return'ERR';const l={M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let r='';for(let k in l){while(n>=l[k]){r+=k;n-=l[k];}}return r;}
function romanToDec(s){const m={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let n=0;for(let i=0;i<s.length;i++){const v1=m[s[i]],v2=m[s[i+1]];if(v2>v1){n+=v2-v1;i++;}else n+=v1;}return n;}
function convSys(from) {
    const val = document.getElementById('s-'+from).value.trim(); if(!val) return;
    let d;
    try {
        if(from==='dec') d=parseInt(val,10);
        else if(from==='bin') d=parseInt(val,2);
        else if(from==='oct') d=parseInt(val,8);
        else if(from==='hex') d=parseInt(val,16);
        else if(from==='rom') d=romanToDec(val.toUpperCase());
        if(isNaN(d)||d<0) return;
        if(from!=='dec') document.getElementById('s-dec').value=d;
        if(from!=='bin') document.getElementById('s-bin').value=d.toString(2);
        if(from!=='oct') document.getElementById('s-oct').value=d.toString(8);
        if(from!=='hex') document.getElementById('s-hex').value=d.toString(16).toUpperCase();
        if(from!=='rom') document.getElementById('s-rom').value=decToRoman(d);
    } catch(e){}
}

// Tab switchers
function switchDesmos(mode, btn) {
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    if (window._desmosCalc) { window._desmosCalc.destroy(); window._desmosCalc = null; }
    initDesmosMode(mode);
}
function switchPhys(id, btn) {
    ['p-newton','p-kinem'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById('p-'+id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function switchFin(id, btn) {
    ['f-cap','f-loan'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById('f-'+id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function switchGeo(id, btn) {
    document.querySelectorAll('[id^="geo-"]').forEach(p => p.classList.remove('on'));
    document.getElementById('geo-'+id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

// Physics calculators
function calcNewton() {
    const m=parseFloat(document.getElementById('ph-m').value), a=parseFloat(document.getElementById('ph-a').value);
    document.getElementById('ph-res').textContent = (!isNaN(m)&&!isNaN(a)) ? `${(m*a).toFixed(4)} N` : '0.00 N';
}
function calcKinem() {
    const v0=parseFloat(document.getElementById('k-v0').value);
    const a=parseFloat(document.getElementById('k-a').value);
    const t=parseFloat(document.getElementById('k-t').value);
    if([v0,a,t].some(isNaN)) return;
    document.getElementById('k-v').textContent = (v0+a*t).toFixed(4)+' m/s';
    document.getElementById('k-s').textContent = (v0*t+0.5*a*t*t).toFixed(4)+' m';
}

// Finance
function calcFin() {
    const k=parseFloat(document.getElementById('fk').value), p=parseFloat(document.getElementById('fp').value), n=parseFloat(document.getElementById('fn2').value);
    if([k,p,n].some(isNaN)) return;
    const total = k*Math.pow(1+p/100,n);
    document.getElementById('f-total').textContent = total.toFixed(2)+' PLN';
    document.getElementById('f-profit').textContent = (total-k).toFixed(2)+' PLN';
}
function calcLoan() {
    const P=parseFloat(document.getElementById('l-P').value), r=parseFloat(document.getElementById('l-r').value)/100/12, n=parseFloat(document.getElementById('l-n').value);
    if([P,r,n].some(isNaN)||r<=0) return;
    const rate = P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    document.getElementById('l-rate').textContent = rate.toFixed(2)+' PLN';
    document.getElementById('l-total').textContent = (rate*n).toFixed(2)+' PLN';
}

// Unit converters
function convDist(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const m=f==='m'?v:f==='km'?v*1000:f==='cm'?v/100:v*0.0254;if(f!=='km')document.getElementById('u-km').value=(m/1000).toFixed(6);if(f!=='m')document.getElementById('u-m').value=m.toFixed(6);if(f!=='cm')document.getElementById('u-cm').value=(m*100).toFixed(4);if(f!=='in')document.getElementById('u-in').value=(m*39.3701).toFixed(4);}
function convMass(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const kg=f==='kg'?v:f==='g'?v/1000:v*0.453592;if(f!=='kg')document.getElementById('u-kg').value=kg.toFixed(6);if(f!=='g')document.getElementById('u-g').value=(kg*1000).toFixed(4);if(f!=='lb')document.getElementById('u-lb').value=(kg*2.20462).toFixed(4);}
function convTemp(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const c=f==='c'?v:f==='f'?(v-32)*5/9:v-273.15;if(f!=='c')document.getElementById('u-c').value=c.toFixed(4);if(f!=='f')document.getElementById('u-f').value=(c*9/5+32).toFixed(4);if(f!=='k')document.getElementById('u-k').value=(c+273.15).toFixed(4);}
function convData(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const mb=f==='mb'?v:f==='gb'?v*1024:v*1048576;if(f!=='mb')document.getElementById('u-mb').value=mb.toFixed(2);if(f!=='gb')document.getElementById('u-gb').value=(mb/1024).toFixed(6);if(f!=='tb')document.getElementById('u-tb').value=(mb/1048576).toFixed(8);}

// Geometry calculator
function calcGeo(shape) {
    const g = id => parseFloat(document.getElementById(id).value);
    const fmt = n => isNaN(n)||!isFinite(n) ? '—' : n.toFixed(4);
    if (shape==='tri') {
        const a=g('g-ta'), h=g('g-th'), c=g('g-tc');
        document.getElementById('geo-tri-p').textContent = fmt(0.5*a*h);
        document.getElementById('geo-tri-o').textContent = isNaN(c) ? '(podaj bok c)' : fmt(a+2*c);
    } else if (shape==='cir') {
        const r=g('g-cr');
        document.getElementById('geo-cir-p').textContent = fmt(Math.PI*r*r);
        document.getElementById('geo-cir-c').textContent = fmt(2*Math.PI*r);
    } else if (shape==='cyl') {
        const r=g('g-cylr'), h=g('g-cylh');
        document.getElementById('geo-cyl-v').textContent = fmt(Math.PI*r*r*h);
        document.getElementById('geo-cyl-pc').textContent = fmt(2*Math.PI*r*(r+h));
    } else if (shape==='cone') {
        const r=g('g-conr'), h=g('g-conh'), l=Math.sqrt(r*r+h*h);
        document.getElementById('geo-cone-v').textContent = fmt(Math.PI*r*r*h/3);
        document.getElementById('geo-cone-l').textContent = fmt(l);
        document.getElementById('geo-cone-pc').textContent = fmt(Math.PI*r*(r+l));
    } else if (shape==='sph') {
        const r=g('g-spr');
        document.getElementById('geo-sph-v').textContent = fmt(4/3*Math.PI*r*r*r);
        document.getElementById('geo-sph-pc').textContent = fmt(4*Math.PI*r*r);
    }
}

/* ═══════════════════════════════════════════════════════════
   8. DESMOS — dynamic loader
═══════════════════════════════════════════════════════════ */
let _desmosKey = null;
let _desmosMode = 'graph';

async function loadDesmosAPI() {
    if (typeof Desmos !== 'undefined') return;
    const msg = document.getElementById('desmosMsg');
    msg.style.display = 'block';
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Config HTTP ' + res.status);
        const { desmosKey } = await res.json();
        if (!desmosKey) throw new Error('No key');
        _desmosKey = desmosKey;
        await new Promise((ok, fail) => {
            const s = document.createElement('script');
            s.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(desmosKey)}`;
            s.onload = ok; s.onerror = () => fail(new Error('Script load failed'));
            document.head.appendChild(s);
        });
        msg.style.display = 'none';
        initDesmosMode(_desmosMode);
    } catch(e) {
        msg.textContent = '⚠ Desmos API niedostępne — sprawdź zmienną DESMOS_API w Vercel. (' + e.message + ')';
    }
}

function initDesmosMode(mode) {
    _desmosMode = mode;
    const elt = document.getElementById('desmosEl');
    if (!elt || typeof Desmos === 'undefined') return;
    if (window._desmosCalc) { window._desmosCalc.destroy(); window._desmosCalc = null; }
    const opts = { keypad: true, expressions: true, settingsMenu: true, zoomButtons: true };
    if (mode === 'graph')  window._desmosCalc = Desmos.GraphingCalculator(elt, opts);
    else if (mode === 'sci') window._desmosCalc = Desmos.ScientificCalculator(elt, opts);
    else if (mode === 'geo') window._desmosCalc = Desmos.Geometry(elt, opts);
}

/* ═══════════════════════════════════════════════════════════
   9. ANSWER HASHING (SHA-256 with per-session salt)
═══════════════════════════════════════════════════════════ */
const SALT = crypto.getRandomValues(new Uint8Array(16)).reduce((h,b) => h + b.toString(16).padStart(2,'0'), '');

async function hashAnswer(val) {
    const data = SALT + String(Math.round(val * 100));
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ═══════════════════════════════════════════════════════════
   10. TASK DATA (150 tasks — Easy 50 / Medium 60 / Hard 40)
═══════════════════════════════════════════════════════════ */
const R = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

const TASKS = [];

// ── EASY (50) ─────────────────────────────────────────────
// Linear equations
for (let i=0; i<20; i++) {
    const a=R(2,9), b=R(1,25), x=R(1,20);
    TASKS.push({ diff:'easy', cat:'algebra', q:`Wyznacz x: <code>${a}x + ${b} = ${a*x+b}</code>`, ans:x, hint:`Odejmij ${b} od obu stron, następnie podziel przez ${a}.` });
}
// Percentages
for (let i=0; i<15; i++) {
    const p=R(1,9)*10, n=R(2,20)*10;
    TASKS.push({ diff:'easy', cat:'procenty', q:`Oblicz: <code>${p}% z liczby ${n}</code>`, ans:(p/100)*n, hint:`Podziel ${p} przez 100, a następnie pomnóż przez ${n}.` });
}
// Rectangle area / perimeter
for (let i=0; i<10; i++) {
    const a=R(2,15), b=R(2,15);
    TASKS.push({ diff:'easy', cat:'geometria', q:`Oblicz pole prostokąta: <code>a = ${a}, b = ${b}</code>`, ans:a*b, hint:`Pole prostokąta = a × b.` });
}
// Arithmetic sequence next term
for (let i=0; i<5; i++) {
    const a1=R(1,10), r=R(1,6);
    TASKS.push({ diff:'easy', cat:'ciagi', q:`Podaj następny wyraz ciągu: <code>${a1}, ${a1+r}, ${a1+2*r}, ${a1+3*r}, ?</code>`, ans:a1+4*r, hint:`To ciąg arytmetyczny. Różnica = ${r}.` });
}

// ── MEDIUM (60) ────────────────────────────────────────────
// Quadratic discriminant
for (let i=0; i<15; i++) {
    const b=R(2,8), c=R(-6,6); const cc = c===0?1:c;
    TASKS.push({ diff:'medium', cat:'delta', q:`Oblicz wyróżnik Δ: <code>y = x² + ${b}x ${cc>0?'+'+cc:cc}</code>`, ans:b*b-4*cc, hint:`Δ = b² − 4ac. Tutaj a=1, b=${b}, c=${cc}.` });
}
// Quadratic roots (nice ones)
for (let i=0; i<10; i++) {
    const x1=R(1,8), x2=R(-8,0);
    const b=-(x1+x2), c=x1*x2;
    TASKS.push({ diff:'medium', cat:'delta', q:`Znajdź większy pierwiastek: <code>x² ${b>=0?'+'+b:b}x ${c>=0?'+'+c:c} = 0</code>`, ans:Math.max(x1,x2), hint:`Policz Δ = b²−4ac, a następnie x = (−b+√Δ)/2.` });
}
// Geometry — circle
for (let i=0; i<10; i++) {
    const r=R(2,12);
    TASKS.push({ diff:'medium', cat:'geometria', q:`Oblicz pole koła (zaokrąglij do 2 miejsc po przecinku): <code>r = ${r}</code>`, ans:parseFloat((Math.PI*r*r).toFixed(2)), hint:`P = πr². Użyj π ≈ 3.14159.` });
}
// Arithmetic sequence sum
for (let i=0; i<10; i++) {
    const a1=R(1,5), r=R(1,4), n=R(5,12);
    const an = a1+(n-1)*r;
    TASKS.push({ diff:'medium', cat:'ciagi', q:`Suma ${n} pierwszych wyrazów ciągu arytm.: <code>a₁=${a1}, r=${r}</code>`, ans:(a1+an)*n/2, hint:`Sₙ = (a₁+aₙ)·n/2. Najpierw oblicz aₙ = a₁+(n-1)r.` });
}
// Combinations C(n,2)
for (let i=0; i<8; i++) {
    const n=R(4,10);
    TASKS.push({ diff:'medium', cat:'logika', q:`Ile 2-elementowych podzbiorów można wybrać z ${n}-elementowego zbioru?`, ans:n*(n-1)/2, hint:`C(n,2) = n!/(2!(n−2)!) = n(n−1)/2.` });
}
// Geometric sequence term
for (let i=0; i<7; i++) {
    const a1=R(1,4), q=R(2,3), n=R(4,6);
    TASKS.push({ diff:'medium', cat:'ciagi', q:`Oblicz ${n}-ty wyraz ciągu geometrycznego: <code>a₁=${a1}, q=${q}</code>`, ans:a1*Math.pow(q,n-1), hint:`aₙ = a₁ · qⁿ⁻¹.` });
}

// ── HARD (40) ──────────────────────────────────────────────
// Pythagorean theorem find hypotenuse
const pyth_triples = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]];
pyth_triples.forEach(([a,b,c]) => {
    TASKS.push({ diff:'hard', cat:'geometria', q:`Trójkąt prostokątny. Przyprostokątne: a=${a}, b=${b}. Oblicz przeciwprostokątną c.`, ans:c, hint:`Twierdzenie Pitagorasa: c² = a² + b². c = √(${a*a}+${b*b}).` });
});
// Sum of geometric series (infinite)
[[2,0.5,4],[3,0.25,4],[6,0.5,12]].forEach(([a1,q,ans]) => {
    TASKS.push({ diff:'hard', cat:'ciagi', q:`Oblicz sumę nieskończonego ciągu geometrycznego: <code>a₁=${a1}, q=${q}</code>`, ans, hint:`S∞ = a₁ / (1−q), bo |q| < 1.` });
});
// Volume of cone
for (let i=0; i<6; i++) {
    const r=R(2,6), h=R(3,9);
    TASKS.push({ diff:'hard', cat:'geometria', q:`Objętość stożka (2 miejsca po przecinku): <code>r=${r}, h=${h}</code>`, ans:parseFloat((Math.PI*r*r*h/3).toFixed(2)), hint:`V = ⅓·π·r²·h.` });
}
// Logarithm calculation
[[2,32,5],[3,81,4],[2,64,6],[5,125,3]].forEach(([base,arg,ans]) => {
    TASKS.push({ diff:'hard', cat:'algebra', q:`Oblicz: <code>log<sub>${base}</sub>(${arg})</code>`, ans, hint:`log_${base}(${arg}) = x oznacza ${base}^x = ${arg}.` });
});
// Permutation P(n,k)
[[5,2,20],[6,2,30],[4,3,24]].forEach(([n,k,ans]) => {
    TASKS.push({ diff:'hard', cat:'logika', q:`Oblicz wariację V(${n},${k}) = ${n}!/(${n}−${k})!`, ans, hint:`V(n,k) = n·(n−1)·…·(n−k+1). Tu ${n}·${n-1} = ?` });
});
// Fill to 150 with mixed medium
while (TASKS.length < 150) {
    const types = ['algebra','delta','procenty','ciagi','geometria'];
    const t = types[TASKS.length % 5];
    if (t === 'algebra') {
        const a=R(3,7),b=R(5,30),x=R(2,18);
        TASKS.push({ diff:'medium', cat:'algebra', q:`Wyznacz x: <code>${a}x − ${b} = ${a*x-b}</code>`, ans:x, hint:`Dodaj ${b} do obu stron, podziel przez ${a}.` });
    } else if (t === 'delta') {
        const b=R(3,9), c=R(1,8);
        TASKS.push({ diff:'medium', cat:'delta', q:`Δ dla: <code>y = 2x² + ${b}x + ${c}</code>`, ans:b*b-8*c, hint:`Δ = b²−4ac = ${b}²−4·2·${c}.` });
    } else if (t === 'procenty') {
        const base=R(100,500), pct=R(1,4)*5;
        TASKS.push({ diff:'easy', cat:'procenty', q:`${pct}% z liczby ${base}`, ans:(pct/100)*base, hint:`Podziel ${pct} przez 100, pomnóż przez ${base}.` });
    } else if (t === 'ciagi') {
        const a1=R(2,8),r=R(2,5);
        TASKS.push({ diff:'easy', cat:'ciagi', q:`5-ty wyraz: <code>${a1}, ${a1+r}, ${a1+2*r}, …</code>`, ans:a1+4*r, hint:`aₙ = a₁+(n−1)r.` });
    } else {
        const a=R(3,12), h=R(4,15);
        TASKS.push({ diff:'easy', cat:'geometria', q:`Pole trójkąta: <code>a=${a}, h=${h}</code>`, ans:0.5*a*h, hint:`P = ½·a·h.` });
    }
}

/* ═══════════════════════════════════════════════════════════
   11. TASK RENDERING & VERIFICATION
═══════════════════════════════════════════════════════════ */
let score = 0, solved = 0;
let activeFilter = 'all';

async function buildTasks() {
    const grid = document.getElementById('taskGrid');
    grid.innerHTML = '';
    for (let i = 0; i < TASKS.length; i++) {
        const t = TASKS[i];
        const hash = await hashAnswer(t.ans);
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.diff = t.diff;
        card.dataset.cat = t.cat;

        const diffLabel = { easy:'🟢 Łatwe', medium:'🟡 Średnie', hard:'🔴 Trudne' }[t.diff];

        card.innerHTML = `
            <div class="card-border"></div>
            <div class="ci">
                <div class="task-badge ${t.diff}">${diffLabel} &nbsp;·&nbsp; ${t.cat.toUpperCase()}</div>
                <div style="margin-bottom:18px;flex-grow:1;font-size:1rem;color:var(--muted-hi);line-height:1.75">#${i+1} — ${t.q}</div>
                <input type="number" class="ti" placeholder="Twoja odpowiedź…"
                       autocomplete="off"
                       data-hash="${hash}"
                       data-attempts="0"
                       data-hint="${t.hint.replace(/"/g,'&quot;')}"
                       onchange="checkAnswer(this)">
                <div class="hint-box" id="hint-${i}"></div>
            </div>`;
        grid.appendChild(card);
    }
    lucide.createIcons();
    applyFilter(activeFilter, null);
}

async function checkAnswer(input) {
    if (input.disabled) return;
    const val = parseFloat(input.value);
    if (isNaN(val)) { input.className = 'ti'; return; }
    const guessHash = await hashAnswer(val);
    if (guessHash === input.dataset.hash) {
        input.className = 'ti ok'; input.disabled = true;
        score += 10; solved++;
        document.getElementById('scoreBoard').textContent = score;
        document.getElementById('solvedCount').textContent = solved;
        document.getElementById('progressFill').style.width = (solved / 150 * 100).toFixed(1) + '%';
        spawnConfetti(input);
    } else {
        input.className = 'ti bad';
        const attempts = parseInt(input.dataset.attempts) + 1;
        input.dataset.attempts = attempts;
        if (attempts >= 3) {
            const hintEl = input.parentElement.querySelector('.hint-box');
            hintEl.textContent = '💡 ' + input.dataset.hint;
            hintEl.classList.add('show');
        }
    }
}

function applyFilter(filter, btn) {
    activeFilter = filter;
    if (btn) {
        document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
    }
    document.querySelectorAll('#taskGrid .card').forEach(card => {
        const match = filter === 'all' || card.dataset.diff === filter || card.dataset.cat === filter;
        card.style.display = match ? 'flex' : 'none';
    });
}

/* ═══════════════════════════════════════════════════════════
   12. CONFETTI (fixed physics)
═══════════════════════════════════════════════════════════ */
function spawnConfetti(anchor) {
    const rect = anchor.getBoundingClientRect();
    const colors = ['#ff003c','#ffffff','#00d4ff','#fbbf24','#10b981'];
    for (let i = 0; i < 28; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-p';
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 160 + 60;
        let x = rect.left + rect.width/2, y = rect.top + rect.height/2;
        let vx = Math.cos(angle)*spd, vy = Math.sin(angle)*spd - 190;
        el.style.cssText = `left:${x}px;top:${y}px;background:${colors[i%colors.length]};width:${Math.random()*7+4}px;height:${Math.random()*7+4}px;`;
        document.body.appendChild(el);
        let last = performance.now(), elapsed = 0;
        (function frame(now) {
            const dt = Math.min((now-last)/1000, 0.05); last = now; elapsed += dt*1000;
            if (elapsed >= 1400) { el.remove(); return; }
            vy += 550 * dt; x += vx*dt; y += vy*dt;
            el.style.left = x+'px'; el.style.top = y+'px';
            el.style.opacity = String(1 - elapsed/1400);
            requestAnimationFrame(frame);
        })(performance.now());
    }
}
    // Ta funkcja odpali się automatycznie, gdy Turnstile zweryfikuje użytkownika
function onTurnstileSuccess(turnstileToken) {
    // Wysyłamy token na nasz serwer Vercel
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken })
    })
    .then(response => response.json())
    .then(data => {
        if (data.desmosKey) {
            // Ukrywamy widget bezpieczeństwa
            document.getElementById('security-wrapper').style.display = 'none';
            
            // Ładujemy Desmosa
            const script = document.createElement('script');
            script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${data.desmosKey}`;
            script.onload = () => {
                var elt = document.getElementById('desmos-calculator');
                if (elt) {
                    var calculator = Desmos.GraphingCalculator(elt, {
                        keypad: true,
                        expressions: true,
                        settingsMenu: true,
                        zoomButtons: true,
                        expressionsTopbar: true
                    });
                }
            };
            document.head.appendChild(script);
        } else {
            console.error("Błąd weryfikacji:", data.error);
            alert("Nie udało się zweryfikować połączenia.");
        }
    })
    .catch(err => console.error("Błąd sieci:", err));
}

/* ═══════════════════════════════════════════════════════════
   13. STARTUP
═══════════════════════════════════════════════════════════ */
setTimeout(resizeCanvas, 100);
buildTasks();
loadDesmosAPI();
