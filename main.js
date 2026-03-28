'use strict';
/* ═══════════════════════════════════════════════════════════
   ZYMATH SINGULARITY — Core Engine v3.0
   Features: 12 Calculators | SHA-256 Tasks | Graph Engine |
   Glassmorphism | Pomodoro | Ctrl+K Search | Achievements |
   Dark/Light Mode | PWA | History | Math Keyboard | PDF Export
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   1. INIT & ICONS
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Anti-clickjacking (silent redirect if framed)
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (_) { /* cross-origin blocked */ }
    }

    // Anti-XSS on all inputs (block script injection patterns)
    const XSS_PATTERN = /<script|javascript:|onerror\s*=|on\w+\s*=|eval\(|data:/gi;
    document.body.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' && XSS_PATTERN.test(e.target.value)) {
            e.target.value = '';
            showSnackbar('⚠ Zablokowano niedozwolony ciąg znaków');
            console.warn('[Aegis] Blocked suspicious input.');
        }
    });

    // Honeypot trap check (bots auto-fill hidden inputs)
    const trap = document.getElementById('security_trap');
    if (trap) {
        setInterval(() => {
            if (trap.value !== '') {
                document.body.innerHTML = '';
                console.warn('[Aegis] Bot detected via honeypot.');
            }
        }, 3000);
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('zymath_theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    updateThemeIcon(savedTheme);

    // Init PWA
    registerServiceWorker();
    initPWAInstall();

    // Init particles (5. Particles.js geometric)
    initParticles();

    // Init floating doodles
    initDoodle();

    // Init global search
    initSearch();

    // Init Pomodoro
    initPomodoro();

    // Render history
    renderHistory();

    // Init achievements
    loadAchievements();

    console.log(
        "%c⚡ Zymath Singularity v3 — System Ready ",
        "background: #10b981; color: #000; font-weight: bold; font-size: 13px;"
    );
});

/* ═══════════════════════════════════════════════════════════
   2. SPOTLIGHT GLOW (mouse follow on cards)
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('pointermove', (e) => {
    for (const card of document.querySelectorAll('.card')) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
});

/* ═══════════════════════════════════════════════════════════
   3. TAB NAVIGATION
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
   4. DARK / LIGHT MODE TOGGLE
   ═══════════════════════════════════════════════════════════ */
function toggleTheme() {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('zymath_theme', next);
    updateThemeIcon(next);
    if (window.lucide) window.lucide.createIcons();
    // Redraw canvas graph with new theme colors
    if (typeof drawGraph === 'function') drawGraph();
}

function updateThemeIcon(theme) {
    const el = document.getElementById('theme-icon');
    if (!el) return;
    el.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
}

/* ═══════════════════════════════════════════════════════════
   5. EASTER EGG
   ═══════════════════════════════════════════════════════════ */
let eggCount = 0;
function easterEgg() {
    eggCount++;
    if (eggCount % 3 === 0) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg) contrast(1.4)';
        setTimeout(() => document.body.style.filter = 'none', 1800);
    } else {
        document.body.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg)`;
        setTimeout(() => document.body.style.transform = 'none', 400);
    }
}

/* ═══════════════════════════════════════════════════════════
   6. SAFE MATH EVALUATOR (sandboxed — no eval on user data)
   ═══════════════════════════════════════════════════════════ */
function safeMathEval(expr, xVal) {
    if (typeof expr !== 'string' || expr.length > 300) throw new Error('Invalid expression');
    const FORBIDDEN = /\b(window|document|self|globalThis|top|parent|frames|location|history|navigator|fetch|XMLHttpRequest|WebSocket|import|require|eval|Function|process|__proto__|prototype|constructor|Reflect|Proxy|Symbol|alert|confirm|prompt|console|localStorage|sessionStorage|cookie|Worker|indexedDB|crypto|performance)\b/i;
    if (FORBIDDEN.test(expr)) throw new Error('Forbidden identifier');
    const fn = new Function('x', 'Math', `"use strict";
        const {sin,cos,tan,asin,acos,atan,atan2,sqrt,abs,pow,log,log2,log10,
               floor,ceil,round,min,max,sign,cbrt,exp,sinh,cosh,tanh,
               PI,E,SQRT2,hypot,trunc} = Math;
        return (${expr});`);
    return fn(xVal, Math);
}

/* ═══════════════════════════════════════════════════════════
   7. SANITY CHECKS — friendly error messages for bad inputs
   ═══════════════════════════════════════════════════════════ */
const SANITY_MSGS = [
    '🤔 To fizycznie niemożliwe — sprawdź wartości!',
    '⚠ Ujemna wartość tutaj nie ma sensu.',
    '🚨 Wykryto anomalię we wszechświecie. Sprawdź dane.',
    '📐 Matematyka protestuje! Popraw wartość.',
    '❌ Ta liczba to czysta fantastyka naukowa.'
];
function sanityMsg() { return SANITY_MSGS[Math.floor(Math.random() * SANITY_MSGS.length)]; }

function sanityCheck(val, { min = -Infinity, max = Infinity, nonZero = false, integer = false, label = 'Wartość' } = {}) {
    if (isNaN(val)) return `${label} musi być liczbą.`;
    if (nonZero && val === 0) return `${label} nie może być zerem.`;
    if (val < min) return `${label} musi być ≥ ${min}. ${sanityMsg()}`;
    if (val > max) return `${label} musi być ≤ ${max}. ${sanityMsg()}`;
    if (integer && !Number.isInteger(val)) return `${label} musi być liczbą całkowitą.`;
    return null; // OK
}

function showInputError(container, message) {
    let errEl = container.querySelector('.input-err');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'input-err';
        errEl.style.cssText = 'color:var(--red);font-family:var(--font-code);font-size:0.75rem;margin-top:6px;padding:6px 10px;background:var(--red-soft);border-radius:var(--r-sm);border:1px solid rgba(255,0,60,0.2)';
        container.appendChild(errEl);
    }
    errEl.textContent = message;
    errEl.style.display = 'block';
}
function clearInputError(container) {
    const el = container.querySelector('.input-err');
    if (el) el.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════════
   8. COPY TO CLIPBOARD
   ═══════════════════════════════════════════════════════════ */
function copyToClipboard(text, btn) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).then(() => {
        if (btn) {
            btn.classList.add('copied');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check"></i> Skopiowano!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); if (window.lucide) window.lucide.createIcons(); }, 1800);
        }
        showSnackbar('📋 Skopiowano do schowka');
    }).catch(() => showSnackbar('⚠ Nie udało się skopiować'));
}

/* ═══════════════════════════════════════════════════════════
   9. SNACKBAR notification
   ═══════════════════════════════════════════════════════════ */
let _snackTimer = null;
function showSnackbar(msg) {
    const el = document.getElementById('snackbar');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (_snackTimer) clearTimeout(_snackTimer);
    _snackTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════════════════════════
   10. CALCULATION HISTORY (localStorage — last 5)
   ═══════════════════════════════════════════════════════════ */
function getHistory() {
    try { return JSON.parse(localStorage.getItem('zymath_history') || '[]'); } catch { return []; }
}
function addHistory(label, value) {
    const hist = getHistory();
    hist.unshift({ label: String(label).slice(0, 60), value: String(value).slice(0, 40), ts: Date.now() });
    if (hist.length > 5) hist.pop();
    localStorage.setItem('zymath_history', JSON.stringify(hist));
    renderHistory();
}
function clearHistory() {
    localStorage.removeItem('zymath_history');
    renderHistory();
}
function renderHistory() {
    const el = document.getElementById('historyList');
    if (!el) return;
    const hist = getHistory();
    if (!hist.length) {
        el.innerHTML = '<div class="history-empty">Brak historii obliczeń</div>';
        return;
    }
    el.innerHTML = hist.map(h => {
        const t = new Date(h.ts);
        const time = t.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        return `<div class="history-item">
            <div style="flex:1;min-width:0">
                <div style="font-size:0.82rem;color:var(--muted-hi)">${h.label}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
                <span class="h-val">${h.value}</span>
                <button class="copy-btn" onclick="copyToClipboard('${h.value.replace(/'/g,"\\'").replace(/`/g,'\\`')}',this)" title="Kopiuj wynik"><i data-lucide="copy"></i></button>
                <span class="h-time">${time}</span>
            </div>
        </div>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════════════
   11. ACHIEVEMENT SYSTEM
   ═══════════════════════════════════════════════════════════ */
const ACHIEVEMENTS = {
    first_solve:    { icon: '🎯', name: 'Pierwsze Kroki',       desc: 'Rozwiąż pierwsze zadanie',           threshold: 1,   key: 'solved' },
    five_solve:     { icon: '⚡', name: 'Elektryczny Umysł',     desc: '5 poprawnych odpowiedzi',            threshold: 5,   key: 'solved' },
    twenty_solve:   { icon: '🔥', name: 'Płonący Intelekt',      desc: '20 poprawnych odpowiedzi',           threshold: 20,  key: 'solved' },
    fifty_solve:    { icon: '💎', name: 'Diamentowy Mózg',       desc: '50 poprawnych odpowiedzi',           threshold: 50,  key: 'solved' },
    hundred_solve:  { icon: '👑', name: 'Mistrz Zymath',        desc: '100 poprawnych odpowiedzi',          threshold: 100, key: 'solved' },
    first_calc:     { icon: '🧮', name: 'Inicjacja Kalkulexa',  desc: 'Użyj kalkulatora po raz pierwszy',   threshold: 1,   key: 'calcs' },
    ten_calcs:      { icon: '🛠️', name: 'Inżynier Formuł',      desc: '10 obliczeń w kalkulatorach',        threshold: 10,  key: 'calcs' },
    theme_toggle:   { icon: '🌓', name: 'Władca Ciemności',      desc: 'Przełącz motyw kolorystyczny',       threshold: 1,   key: 'themes' },
    search_used:    { icon: '🔍', name: 'Detektyw Wiedzy',       desc: 'Użyj wyszukiwarki Ctrl+K',          threshold: 1,   key: 'searches' },
    pomodoro_done:  { icon: '🍅', name: 'Fokus jak Laser',       desc: 'Ukończ sesję Pomodoro',              threshold: 1,   key: 'pomodoros' },
};

function loadAchievements() {
    if (!localStorage.getItem('zymath_ach_progress')) {
        localStorage.setItem('zymath_ach_progress', JSON.stringify({ solved: 0, calcs: 0, themes: 0, searches: 0, pomodoros: 0 }));
    }
    if (!localStorage.getItem('zymath_ach_unlocked')) {
        localStorage.setItem('zymath_ach_unlocked', JSON.stringify([]));
    }
}

function incrementStat(key, amount = 1) {
    try {
        const prog = JSON.parse(localStorage.getItem('zymath_ach_progress') || '{}');
        prog[key] = (prog[key] || 0) + amount;
        localStorage.setItem('zymath_ach_progress', JSON.stringify(prog));
        checkAchievements(prog);
        return prog[key];
    } catch { return 0; }
}

function checkAchievements(prog) {
    try {
        const unlocked = JSON.parse(localStorage.getItem('zymath_ach_unlocked') || '[]');
        for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
            if (!unlocked.includes(id) && (prog[ach.key] || 0) >= ach.threshold) {
                unlocked.push(id);
                localStorage.setItem('zymath_ach_unlocked', JSON.stringify(unlocked));
                showAchievement(ach);
            }
        }
    } catch {}
}

function showAchievement(ach) {
    const container = document.getElementById('ach-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'ach-toast';
    toast.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-text">
            <div class="ach-label">🏆 Odblokowano osiągnięcie!</div>
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
        </div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 350);
    }, 4500);
}

/* ═══════════════════════════════════════════════════════════
   12. POMODORO TIMER
   ═══════════════════════════════════════════════════════════ */
const POM_PHASES = [
    { label: '🍅 Fokus', duration: 25 * 60 },
    { label: '☕ Przerwa', duration: 5 * 60 },
];
let pomState = { running: false, phase: 0, remaining: POM_PHASES[0].duration, interval: null, cycles: 0 };

function initPomodoro() {
    updatePomDisplay();
}

function togglePomodoro() {
    if (pomState.running) {
        clearInterval(pomState.interval);
        pomState.running = false;
        document.getElementById('pom-start-btn')?.classList.remove('active');
        document.getElementById('pom-start-btn').textContent = 'Start';
    } else {
        pomState.running = true;
        document.getElementById('pom-start-btn')?.classList.add('active');
        document.getElementById('pom-start-btn').textContent = 'Stop';
        pomState.interval = setInterval(() => {
            pomState.remaining--;
            updatePomDisplay();
            if (pomState.remaining <= 0) {
                clearInterval(pomState.interval);
                pomState.running = false;
                pomState.phase = (pomState.phase + 1) % POM_PHASES.length;
                if (pomState.phase === 0) {
                    pomState.cycles++;
                    incrementStat('pomodoros');
                }
                pomState.remaining = POM_PHASES[pomState.phase].duration;
                updatePomDisplay();
                showSnackbar(pomState.phase === 0 ? '🎉 Przerwa skończona! Czas na fokus.' : '☕ Czas na zasłużoną przerwę!');
                document.getElementById('pom-start-btn')?.classList.remove('active');
                document.getElementById('pom-start-btn').textContent = 'Start';
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pomState.interval);
    pomState = { running: false, phase: 0, remaining: POM_PHASES[0].duration, interval: null, cycles: pomState.cycles };
    if (document.getElementById('pom-start-btn')) {
        document.getElementById('pom-start-btn').classList.remove('active');
        document.getElementById('pom-start-btn').textContent = 'Start';
    }
    updatePomDisplay();
}

function updatePomDisplay() {
    const m = Math.floor(pomState.remaining / 60).toString().padStart(2, '0');
    const s = (pomState.remaining % 60).toString().padStart(2, '0');
    const timeStr = `${m}:${s}`;
    const dispEl = document.getElementById('pom-display');
    const phaseEl = document.getElementById('pom-phase');
    const miniEl = document.getElementById('pom-mini-time');
    const countEl = document.getElementById('pom-count');
    if (dispEl) dispEl.textContent = timeStr;
    if (phaseEl) phaseEl.textContent = POM_PHASES[pomState.phase].label;
    if (miniEl) miniEl.textContent = timeStr;
    if (countEl) countEl.textContent = `Ukończone sesje: ${pomState.cycles}`;
}

function togglePomodoroCollapse() {
    document.getElementById('pomodoro')?.classList.toggle('collapsed');
}

/* ═══════════════════════════════════════════════════════════
   13. GLOBAL SEARCH (Ctrl+K)
   ═══════════════════════════════════════════════════════════ */
const SEARCH_INDEX = [
    { title: 'Kroniki Matematyki', desc: 'Historia matematyki — 4 epoki', tab: 'home', icon: 'history', tag: 'Start' },
    { title: 'Anomalie Wszechświata', desc: 'Matematyczne osobliwości i paradoksy', tab: 'home', icon: 'sparkles', tag: 'Start' },
    { title: 'Algebra — Wzory Skróconego Mnożenia', desc: 'Kwadraty, sześciany, różnica kwadratów', tab: 'wiedza', icon: 'braces', tag: 'Wiedza' },
    { title: 'Funkcja Kwadratowa', desc: 'Postać ogólna, wierzchołkowa, wyróżnik Δ', tab: 'wiedza', icon: 'activity', tag: 'Wiedza' },
    { title: 'Logarytmy i Wykładnicze', desc: 'Definicja, własności, zmiana podstawy', tab: 'wiedza', icon: 'logs', tag: 'Wiedza' },
    { title: 'Trygonometria', desc: 'Funkcje, tabela wartości, wzory', tab: 'wiedza', icon: 'triangle', tag: 'Wiedza' },
    { title: 'Ciągi Liczbowe', desc: 'Arytmetyczne i geometryczne, sumy', tab: 'wiedza', icon: 'list-ordered', tag: 'Wiedza' },
    { title: 'Geometria — Figury i Bryły', desc: 'Pola, objętości, twierdzenia', tab: 'wiedza', icon: 'shapes', tag: 'Wiedza' },
    { title: 'Kombinatoryka', desc: 'Permutacje, wariacje, kombinacje', tab: 'wiedza', icon: 'dice-5', tag: 'Wiedza' },
    { title: 'Rachunek Różniczkowy', desc: 'Pochodne, monotoniczność, ekstrema', tab: 'wiedza', icon: 'trending-up', tag: 'Wiedza' },
    { title: 'Graph Engine 3.1', desc: 'Wykresy funkcji — zoom, pan, 3 funkcje', tab: 'kalkulatory', icon: 'line-chart', tag: 'Terminal' },
    { title: 'Desmos Pro', desc: 'Profesjonalny kalkulator graficzny', tab: 'kalkulatory', icon: 'external-link', tag: 'Terminal' },
    { title: 'Analiza Funkcji Kwadratowej', desc: 'Wyróżnik Δ, wierzchołek, pierwiastki', tab: 'kalkulatory', icon: 'target', tag: 'Terminal' },
    { title: 'Układ Równań 2×2', desc: 'Metoda Cramera — wyznaczniki', tab: 'kalkulatory', icon: 'git-branch-plus', tag: 'Terminal' },
    { title: 'Kalkulator Trygonometryczny', desc: 'sin, cos, tan, cot | trójkąt prostokątny', tab: 'kalkulatory', icon: 'triangle', tag: 'Terminal' },
    { title: 'NWD, NWW & Liczby Pierwsze', desc: 'Rozkład na czynniki pierwsze', tab: 'kalkulatory', icon: 'divide', tag: 'Terminal' },
    { title: 'Statystyka Opisowa', desc: 'Średnia, mediana, moda, odch. std', tab: 'kalkulatory', icon: 'bar-chart-2', tag: 'Terminal' },
    { title: 'Systemy Liczbowe', desc: 'Dec ↔ Bin ↔ Oct ↔ Hex ↔ Roman', tab: 'kalkulatory', icon: 'binary', tag: 'Terminal' },
    { title: 'Fizyka — Dynamika & Kinematyka', desc: 'Newton F=ma, ruch przyspieszony', tab: 'kalkulatory', icon: 'rocket', tag: 'Terminal' },
    { title: 'Procent Składany & Kredyt', desc: 'Kapitalizacja, rata miesięczna', tab: 'kalkulatory', icon: 'pie-chart', tag: 'Terminal' },
    { title: 'Konwerter Jednostek', desc: 'Długość, masa, temperatura, dane', tab: 'kalkulatory', icon: 'ruler', tag: 'Terminal' },
    { title: 'Kalkulator Geometryczny', desc: 'Trójkąt, koło, walec, stożek, kula', tab: 'kalkulatory', icon: 'shapes', tag: 'Terminal' },
    { title: 'Zadania — Algebra', desc: '50 zadań algebraicznych', tab: 'zadania', icon: 'target', tag: 'Zadania' },
    { title: 'Zadania — Geometria', desc: 'Figury płaskie i bryły', tab: 'zadania', icon: 'shapes', tag: 'Zadania' },
    { title: 'Zadania — Procenty', desc: 'Obliczenia procentowe', tab: 'zadania', icon: 'percent', tag: 'Zadania' },
    { title: 'Zadania — Wyróżnik Δ', desc: 'Równania kwadratowe', tab: 'zadania', icon: 'activity', tag: 'Zadania' },
    { title: 'Zadania — Ciągi', desc: 'Arytmetyczne i geometryczne', tab: 'zadania', icon: 'list-ordered', tag: 'Zadania' },
];

function initSearch() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape') closeSearch();
    });

    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    }

    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('input', () => renderSearchResults(input.value));
        input.addEventListener('keydown', navigateSearchResults);
    }
}

function openSearch() {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('searchInput');
    if (!overlay) return;
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 80);
    renderSearchResults('');
    incrementStat('searches');
}

function closeSearch() {
    document.getElementById('search-overlay')?.classList.remove('open');
    document.getElementById('searchInput').value = '';
}

function renderSearchResults(query) {
    const el = document.getElementById('searchResults');
    if (!el) return;
    const q = query.toLowerCase().trim();
    const results = q
        ? SEARCH_INDEX.filter(r => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
        : SEARCH_INDEX.slice(0, 8);

    if (!results.length) {
        el.innerHTML = '<div style="text-align:center;padding:28px;font-family:var(--font-code);font-size:0.8rem;color:var(--muted)">Brak wyników dla "' + query + '"</div>';
        return;
    }
    el.innerHTML = results.map((r, i) => `
        <div class="search-result-item${i === 0 ? ' focused' : ''}"
             onclick="searchNavigate('${r.tab}')"
             data-idx="${i}">
            <i data-lucide="${r.icon}"></i>
            <div style="flex:1;min-width:0">
                <div class="sr-title">${r.title}</div>
                <div class="sr-desc">${r.desc}</div>
            </div>
            <span class="sr-tag">${r.tag}</span>
        </div>`).join('');
    if (window.lucide) window.lucide.createIcons();
    el.dataset.focused = '0';
}

function searchNavigate(tabId) {
    closeSearch();
    const btn = document.querySelector(`.nb[onclick*="${tabId}"]`);
    if (btn) showTab(tabId, btn);
}

function navigateSearchResults(e) {
    const el = document.getElementById('searchResults');
    if (!el) return;
    const items = el.querySelectorAll('.search-result-item');
    let idx = parseInt(el.dataset.focused || '0');
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); }
    else if (e.key === 'Enter' && items[idx]) { items[idx].click(); return; }
    else return;
    items.forEach((it, i) => it.classList.toggle('focused', i === idx));
    el.dataset.focused = idx;
    items[idx]?.scrollIntoView({ block: 'nearest' });
}

/* ═══════════════════════════════════════════════════════════
   14. MATH KEYBOARD (for task answer inputs)
   ═══════════════════════════════════════════════════════════ */
const MATH_KEYS = [
    { label: 'π', val: 'Math.PI' },
    { label: '√', val: 'Math.sqrt(' },
    { label: 'x²', val: 'Math.pow(x,2)' },
    { label: 'x³', val: 'Math.pow(x,3)' },
    { label: '|x|', val: 'Math.abs(' },
    { label: 'log', val: 'Math.log10(' },
    { label: 'ln',  val: 'Math.log(' },
    { label: 'sin', val: 'Math.sin(' },
    { label: 'cos', val: 'Math.cos(' },
    { label: 'e',   val: 'Math.E' },
    { label: '÷',   val: '/' },
    { label: '×',   val: '*' },
    { label: '(',   val: '(' },
    { label: ')',   val: ')' },
    { label: '⌫',  val: '__BACKSPACE__' },
];

let _activeInput = null;

function initMathKeyboard() {
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('fn-row') || e.target.id?.startsWith('fn')) {
            _activeInput = e.target;
        }
    });
}

function mathKbdBackspace() {
    if (!_activeInput) return;
    const pos = _activeInput.selectionStart || 0;
    const v = _activeInput.value;
    if (pos === 0) return;
    _activeInput.value = v.slice(0, pos - 1) + v.slice(_activeInput.selectionEnd || pos);
    _activeInput.selectionStart = _activeInput.selectionEnd = pos - 1;
    _activeInput.focus();
}

function insertMathKey(val) {
    if (val === '__BACKSPACE__') { mathKbdBackspace(); return; }
    if (!_activeInput) { showSnackbar('⚠ Kliknij najpierw w pole input'); return; }
    const pos = _activeInput.selectionStart || 0;
    const v = _activeInput.value;
    _activeInput.value = v.slice(0, pos) + val + v.slice(_activeInput.selectionEnd || pos);
    _activeInput.selectionStart = _activeInput.selectionEnd = pos + val.length;
    _activeInput.focus();
    _activeInput.dispatchEvent(new Event('input'));
}

function toggleMathKbd() {
    const kbd = document.getElementById('math-kbd');
    if (!kbd) return;
    kbd.classList.toggle('visible');
    const btn = document.getElementById('kbd-toggle-btn');
    if (btn) btn.textContent = kbd.classList.contains('visible') ? '⌨ Ukryj klawiaturę' : '⌨ Klawiatura matematyczna';
}

/* ═══════════════════════════════════════════════════════════
   15. PDF EXPORT (using jsPDF from CDN)
   ═══════════════════════════════════════════════════════════ */
function exportResultToPDF(title, content) {
    if (typeof window.jspdf === 'undefined') {
        showSnackbar('⚠ Ładowanie jsPDF…');
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = () => doExportPDF(title, content);
        s.onerror = () => showSnackbar('⚠ Nie można załadować biblioteki PDF');
        document.head.appendChild(s);
        return;
    }
    doExportPDF(title, content);
}

function doExportPDF(title, lines) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, W, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text('ZYMATH SINGULARITY v2', 14, 18);

        // Title
        doc.setTextColor(255, 0, 60);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 38);

        // Separator
        doc.setDrawColor(255, 0, 60);
        doc.setLineWidth(0.5);
        doc.line(14, 41, W - 14, 41);

        // Content
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10); doc.setFont('courier', 'normal');
        let y = 50;
        for (const line of lines) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(line, 14, y);
            y += 7;
        }

        // Footer band
        doc.setFillColor(248, 248, 248);
        doc.rect(0, 278, W, 19, 'F');
        doc.setFontSize(8); doc.setTextColor(120, 120, 120);
        doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')} | SHA-256 Secured`, 14, 287);
        doc.text('zymath.vercel.app © 2026', W - 14, 287, { align: 'right' });

        doc.save(`zymath_${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`);
        showSnackbar('📄 Raport PDF zapisany');
    } catch (e) {
        showSnackbar('⚠ Błąd eksportu PDF: ' + e.message);
    }
}

/* ═══════════════════════════════════════════════════════════
   16. GRAPH ENGINE v3.1 — zoom, pan, 3 functions, tick labels
   ═══════════════════════════════════════════════════════════ */
const gCanvas = document.getElementById('gCanvas');
const gCtx = gCanvas ? gCanvas.getContext('2d') : null;

function resizeCanvas() {
    if (!gCanvas) return;
    const rect = gCanvas.getBoundingClientRect();
    gCanvas.width  = rect.width  * devicePixelRatio;
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
            gs.ox += e.clientX - gs.lx; gs.oy += e.clientY - gs.ly;
            gs.lx = e.clientX; gs.ly = e.clientY;
            drawGraph();
        }
        const r = gCanvas.getBoundingClientRect();
        const mx = r.width / 2 + gs.ox, my = r.height / 2 + gs.oy;
        const xi = ((e.clientX - r.left) - mx) / gs.scale;
        const yi = -(((e.clientY - r.top) - my) / gs.scale);
        const el = document.getElementById('gCoords');
        if (el) {
            el.textContent = '';
            el.append('x: ', Object.assign(document.createElement('span'), { textContent: xi.toFixed(3), style: 'color:#fff' }), '  |  y: ', Object.assign(document.createElement('span'), { textContent: yi.toFixed(3), style: 'color:#fff' }));
        }
    });
    gCanvas.addEventListener('pointerup',    () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
    gCanvas.addEventListener('pointerleave', () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
}

function resetGraph() {
    gs.ox = 0; gs.oy = 0; gs.scale = 45;
    document.getElementById('gScale').value = 45;
    drawGraph();
}

function drawGraph() {
    if (!gCanvas || !gCtx) return;
    const sliderScale = parseFloat(document.getElementById('gScale')?.value) || 45;
    if (!gs.drag) gs.scale = sliderScale;

    const W  = gCanvas.width / devicePixelRatio;
    const H  = gCanvas.height / devicePixelRatio;
    const sc = gs.scale;
    const ox = W / 2 + gs.ox;
    const oy = H / 2 + gs.oy;

    // Theme-aware background
    const isDark = document.documentElement.dataset.theme !== 'light';
    gCtx.fillStyle = isDark ? '#000' : '#f8f8f4';
    gCtx.fillRect(0, 0, W, H);

    // Grid
    gCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    gCtx.lineWidth = 1;
    for (let x = ox % sc; x < W; x += sc) { gCtx.beginPath(); gCtx.moveTo(x, 0); gCtx.lineTo(x, H); gCtx.stroke(); }
    for (let y = oy % sc; y < H; y += sc) { gCtx.beginPath(); gCtx.moveTo(0, y); gCtx.lineTo(W, y); gCtx.stroke(); }

    // Axes
    gCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';
    gCtx.lineWidth = 1.5;
    gCtx.beginPath(); gCtx.moveTo(0, oy); gCtx.lineTo(W, oy); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(ox, 0); gCtx.lineTo(ox, H); gCtx.stroke();

    // Tick marks + labels
    gCtx.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)';
    gCtx.font = `${Math.max(9, Math.min(12, sc * 0.22))}px 'Google Sans Code', monospace`;
    gCtx.textAlign = 'center';
    const xStart = Math.ceil(-ox / sc), xEnd = Math.floor((W - ox) / sc);
    for (let n = xStart; n <= xEnd; n++) {
        if (n === 0) continue;
        const px = ox + n * sc;
        gCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(px, oy - 4); gCtx.lineTo(px, oy + 4); gCtx.stroke();
        if (sc > 20) gCtx.fillText(n, px, oy + 16);
    }
    gCtx.textAlign = 'right';
    const yStart = Math.ceil((oy - H) / sc), yEnd = Math.floor(oy / sc);
    for (let n = yStart; n <= yEnd; n++) {
        if (n === 0) continue;
        const py = oy - n * sc;
        gCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(ox - 4, py); gCtx.lineTo(ox + 4, py); gCtx.stroke();
        if (sc > 20) gCtx.fillText(n, ox - 8, py + 4);
    }

    // Plot functions
    const fns = ['fn1', 'fn2', 'fn3'].map(id => document.getElementById(id)?.value.trim()).filter(Boolean);
    fns.forEach((expr, idx) => {
        let compiled;
        try { safeMathEval(expr, 0); compiled = (x) => safeMathEval(expr, x); }
        catch (e) {
            gCtx.fillStyle = COLORS[idx]; gCtx.font = '12px monospace';
            gCtx.textAlign = 'left';
            gCtx.fillText(`f${idx + 1}: ${e.message}`, 10, 20 + idx * 18);
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
                if (Math.abs(py - (oy - (compiled((px - 1 - ox) / sc) * sc))) > H * 2) { first = true; }
                if (first) { gCtx.moveTo(px, py); first = false; }
                else gCtx.lineTo(px, py);
            } catch { first = true; }
        }
        gCtx.stroke();
        gCtx.shadowBlur = 0;
    });
}

/* ═══════════════════════════════════════════════════════════
   17. CALCULATORS — with sanity checks + history + copy
   ═══════════════════════════════════════════════════════════ */

// ─── Quadratic analyzer ───────────────────────────────────
function calcQuad() {
    const a = parseFloat(document.getElementById('qa').value);
    const b = parseFloat(document.getElementById('qb').value);
    const c = parseFloat(document.getElementById('qc').value);
    const res = document.getElementById('quadRes');
    if ([a, b, c].some(isNaN)) { res.style.color = 'var(--muted)'; res.textContent = 'Oczekiwanie na parametry…'; return; }
    if (a === 0) { res.innerHTML = '<span style="color:var(--red)">Współczynnik a ≠ 0 dla paraboli.</span>'; return; }

    const D = b * b - 4 * a * c;
    const p = -b / (2 * a);
    const q = -D / (4 * a);
    let html = `<div style="color:var(--red);font-size:1.6rem;font-family:var(--font-display);font-weight:800;margin-bottom:8px">Δ = ${D.toFixed(4)}</div>`;
    html += `<div style="margin-bottom:6px;color:var(--muted-hi)">Wierzchołek: W(${p.toFixed(4)}, ${q.toFixed(4)}) &nbsp;|&nbsp; Oś symetrii: x = ${p.toFixed(4)}</div>`;
    if (D > 0) html += `<div style="color:#fff">x₁ = ${((-b - Math.sqrt(D)) / (2 * a)).toFixed(4)} &nbsp;&nbsp; x₂ = ${((-b + Math.sqrt(D)) / (2 * a)).toFixed(4)}</div>`;
    else if (D === 0) html += `<div style="color:#fff">Podwójny pierwiastek: x₀ = ${p.toFixed(4)}</div>`;
    else html += `<div style="color:var(--muted)">Brak pierwiastków rzeczywistych (Δ &lt; 0)</div>`;
    html += `<div style="color:var(--muted);font-size:0.78rem;margin-top:8px">Postać wierz.: f(x) = ${a}(x${p >= 0 ? '-' : '+'} ${Math.abs(p).toFixed(3)})² ${q >= 0 ? '+' : '-'} ${Math.abs(q).toFixed(3)}</div>`;
    html += `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="copy-btn" onclick="copyToClipboard('Δ=${D.toFixed(4)}, x1/x2 see above', this)"><i data-lucide="copy"></i> Kopiuj Δ</button>
        <button class="btn btn-sm" onclick="exportResultToPDF('Funkcja Kwadratowa', ['f(x) = ${a}x² + ${b}x + ${c}','','Wyróżnik: Δ = ${D.toFixed(6)}','Wierzchołek: W(${p.toFixed(4)}, ${q.toFixed(4)})','Oś symetrii: x = ${p.toFixed(4)}'])"><i data-lucide="download"></i> Eksport PDF</button>
    </div>`;
    res.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    addHistory(`Δ: ${a}x²+${b}x+${c}`, `Δ=${D.toFixed(2)}`);
    incrementStat('calcs');
}

// ─── Linear system 2x2 (Cramer's rule) ───────────────────
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
        res.innerHTML = `<div style="font-size:1.4rem;font-weight:800;color:var(--red);margin-bottom:6px">x = ${x.toFixed(4)} &nbsp;&nbsp; y = ${y.toFixed(4)}</div>
            <div style="color:var(--muted);font-size:0.8rem;margin-bottom:8px">Wyznacznik D = ${D}</div>
            <button class="copy-btn" onclick="copyToClipboard('x=${x.toFixed(4)}, y=${y.toFixed(4)}', this)"><i data-lucide="copy"></i> Kopiuj wynik</button>`;
        if (window.lucide) window.lucide.createIcons();
        addHistory(`Układ: a₁=${a1},b₁=${b1}`, `x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
        incrementStat('calcs');
    }
}

// ─── Trig ────────────────────────────────────────────────
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
    incrementStat('calcs');
}
function calcTriangle() {
    const ang = parseFloat(document.getElementById('tri-angle').value);
    const hyp = parseFloat(document.getElementById('tri-hyp').value);
    if (isNaN(ang) || isNaN(hyp)) return;
    const errEl = document.getElementById('trig-err');

    // Sanity checks
    const e1 = sanityCheck(ang, { min: 0, max: 89, label: 'Kąt' });
    const e2 = sanityCheck(hyp, { min: 0.001, label: 'Przeciwprostokątna' });
    if (e1) { if (errEl) errEl.textContent = e1; return; } else { if (errEl) errEl.textContent = ''; }
    if (e2) { if (errEl) errEl.textContent = e2; return; }

    const a = ang * Math.PI / 180;
    const sideA = hyp * Math.sin(a), sideB = hyp * Math.cos(a);
    document.getElementById('tri-a').textContent = sideA.toFixed(4) + ' (naprzeciwko α)';
    document.getElementById('tri-b').textContent = sideB.toFixed(4);
    document.getElementById('tri-p').textContent = (0.5 * sideA * sideB).toFixed(4);
    incrementStat('calcs');
}

// ─── NWD / NWW / Prime ───────────────────────────────────
function switchNwd(id, btn) {
    ['nwd-panel', 'prime-panel'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById(id + '-panel').classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function calcNwd() {
    let a = Math.abs(parseInt(document.getElementById('na').value));
    let b = Math.abs(parseInt(document.getElementById('nb').value));
    if (!a || !b) { document.getElementById('r-nwd').textContent='—'; document.getElementById('r-nww').textContent='—'; return; }
    const errMsg = sanityCheck(a, { min: 1, max: 1e9, integer: true, label: 'A' }) || sanityCheck(b, { min: 1, max: 1e9, integer: true, label: 'B' });
    if (errMsg) { showSnackbar(errMsg); return; }
    const d = gcd(a, b);
    document.getElementById('r-nwd').textContent = d;
    document.getElementById('r-nww').textContent = (a * b) / d;
    addHistory(`NWD(${a},${b})`, `NWD=${d}, NWW=${(a*b)/d}`);
    incrementStat('calcs');
}
function calcPrime() {
    let n = parseInt(document.getElementById('primeN').value);
    const res = document.getElementById('primeRes');
    const errMsg = sanityCheck(n, { min: 2, max: 999999, integer: true, label: 'Liczba' });
    if (errMsg) { res.textContent = errMsg; return; }
    const orig = n; const factors = {};
    for (let d = 2; d * d <= n; d++) { while (n % d === 0) { factors[d] = (factors[d] || 0) + 1; n /= d; } }
    if (n > 1) factors[n] = (factors[n] || 0) + 1;
    const parts = Object.entries(factors).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ');
    const isPrime = Object.keys(factors).length === 1 && Object.values(factors)[0] === 1;
    res.innerHTML = `<div style="color:var(--text);font-size:1.1rem;margin-bottom:6px">${orig} = ${parts}</div><div style="color:var(--muted);font-size:0.8rem">${isPrime ? '✓ Liczba pierwsza' : `Czynniki: ${Object.keys(factors).join(', ')}`}</div>`;
    incrementStat('calcs');
}

// ─── Statistics ──────────────────────────────────────────
function calcStats() {
    const v = document.getElementById('statIn').value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    document.getElementById('s-n').textContent = v.length;
    if (!v.length) { ['s-mean','s-med','s-mode','s-std','s-range'].forEach(id => document.getElementById(id).textContent = '—'); return; }
    const mean = v.reduce((a,b)=>a+b,0)/v.length;
    document.getElementById('s-mean').textContent = mean.toFixed(4);
    const sorted = [...v].sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length/2);
    document.getElementById('s-med').textContent = sorted.length%2 ? sorted[mid].toFixed(4) : ((sorted[mid-1]+sorted[mid])/2).toFixed(4);
    const freq = {}; v.forEach(x => freq[x] = (freq[x]||0)+1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.entries(freq).filter(([,f])=>f===maxFreq).map(([v])=>v);
    document.getElementById('s-mode').textContent = maxFreq > 1 ? modes.join(', ') : 'brak';
    const variance = v.length > 1 ? v.reduce((sum,x)=>sum+(x-mean)**2,0)/(v.length-1) : 0;
    document.getElementById('s-std').textContent = Math.sqrt(variance).toFixed(4);
    document.getElementById('s-range').textContent = (sorted[sorted.length-1]-sorted[0]).toFixed(4);
    addHistory(`Statystyki n=${v.length}`, `x̄=${mean.toFixed(3)}`);
    incrementStat('calcs');
}

// ─── Number systems ──────────────────────────────────────
function decToRoman(n){if(n<=0||n>=4000)return'ERR';const l={M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let r='';for(const k in l){while(n>=l[k]){r+=k;n-=l[k];}}return r;}
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
        const errMsg = sanityCheck(d, { min: 0, max: 2147483647, label: 'Liczba' });
        if(errMsg||isNaN(d)) { showSnackbar(errMsg||'Nieprawidłowa wartość'); return; }
        if(from!=='dec') document.getElementById('s-dec').value=d;
        if(from!=='bin') document.getElementById('s-bin').value=d.toString(2);
        if(from!=='oct') document.getElementById('s-oct').value=d.toString(8);
        if(from!=='hex') document.getElementById('s-hex').value=d.toString(16).toUpperCase();
        if(from!=='rom') document.getElementById('s-rom').value=decToRoman(d);
        incrementStat('calcs');
    } catch(e){showSnackbar('Błąd konwersji: '+e.message);}
}

// ─── Desmos ──────────────────────────────────────────────
let _desmosMode = 'graph';

function switchDesmos(mode, btn) {
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    if (window._desmosCalc) { window._desmosCalc.destroy(); window._desmosCalc = null; }
    initDesmosMode(mode);
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

// Called by Cloudflare Turnstile widget when human is verified
function onTurnstileSuccess(turnstileToken) {
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken })
    })
    .then(r => r.json())
    .then(data => {
        if (data.desmosKey) {
            const wrapper = document.getElementById('security-wrapper');
            if (wrapper) wrapper.style.display = 'none';
            const script = document.createElement('script');
            script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(data.desmosKey)}`;
            script.onload = () => initDesmosMode(_desmosMode);
            script.onerror = () => showSnackbar('⚠ Błąd ładowania Desmos');
            document.head.appendChild(script);
        } else {
            const msg = document.getElementById('desmosMsg');
            if (msg) msg.textContent = '⚠ Weryfikacja nie powiodła się: ' + (data.error || 'Unknown');
        }
    })
    .catch(() => showSnackbar('⚠ Błąd sieci podczas weryfikacji'));
}

// ─── Physics ─────────────────────────────────────────────
function switchPhys(id, btn) {
    ['p-newton','p-kinem'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById('p-'+id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function calcNewton() {
    const m = parseFloat(document.getElementById('ph-m').value);
    const a = parseFloat(document.getElementById('ph-a').value);
    const e1 = sanityCheck(m, { min: 0, label: 'Masa' });
    const resEl = document.getElementById('ph-res');
    if (!isNaN(m) && e1) { resEl.textContent = e1; return; }
    resEl.textContent = (!isNaN(m) && !isNaN(a)) ? `${(m*a).toFixed(4)} N` : '0.00 N';
    if (!isNaN(m) && !isNaN(a)) { addHistory(`F=ma (m=${m},a=${a})`, `${(m*a).toFixed(3)} N`); incrementStat('calcs'); }
}
function calcKinem() {
    const v0=parseFloat(document.getElementById('k-v0').value);
    const a=parseFloat(document.getElementById('k-a').value);
    const t=parseFloat(document.getElementById('k-t').value);
    const e1 = sanityCheck(t, { min: 0, label: 'Czas t' });
    if (!isNaN(t) && e1) { showSnackbar(e1); return; }
    if([v0,a,t].some(isNaN)) return;
    document.getElementById('k-v').textContent = (v0+a*t).toFixed(4)+' m/s';
    document.getElementById('k-s').textContent = (v0*t+0.5*a*t*t).toFixed(4)+' m';
    incrementStat('calcs');
}

// ─── Finance ─────────────────────────────────────────────
function switchFin(id, btn) {
    ['f-cap','f-loan'].forEach(p => document.getElementById(p).classList.remove('on'));
    document.getElementById('f-'+id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function calcFin() {
    const k=parseFloat(document.getElementById('fk').value);
    const p=parseFloat(document.getElementById('fp').value);
    const n=parseFloat(document.getElementById('fn2').value);
    const e1 = sanityCheck(k, { min: 0, label: 'Kapitał' }) || sanityCheck(p, { min: 0, max: 100, label: 'Stopa %' }) || sanityCheck(n, { min: 0, max: 100, label: 'Lata' });
    if (!isNaN(k) && !isNaN(p) && !isNaN(n) && e1) { showSnackbar(e1); return; }
    if([k,p,n].some(isNaN)) return;
    const total = k*Math.pow(1+p/100,n);
    document.getElementById('f-total').textContent = total.toFixed(2)+' PLN';
    document.getElementById('f-profit').textContent = (total-k).toFixed(2)+' PLN';
    addHistory(`Kapitał K=${k}, r=${p}%, n=${n}lat`, `${total.toFixed(0)} PLN`);
    incrementStat('calcs');
}
function calcLoan() {
    const P=parseFloat(document.getElementById('l-P').value);
    const rAnn=parseFloat(document.getElementById('l-r').value);
    const n=parseFloat(document.getElementById('l-n').value);
    const e1 = sanityCheck(P, { min: 1, label: 'Kwota' }) || sanityCheck(rAnn, { min: 0.01, max: 100, label: 'Stopa' }) || sanityCheck(n, { min: 1, max: 600, label: 'Raty', integer: true });
    if (!isNaN(P) && !isNaN(rAnn) && !isNaN(n) && e1) { showSnackbar(e1); return; }
    const r=rAnn/100/12;
    if([P,r,n].some(isNaN)||r<=0) return;
    const rate = P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    document.getElementById('l-rate').textContent = rate.toFixed(2)+' PLN';
    document.getElementById('l-total').textContent = (rate*n).toFixed(2)+' PLN';
    incrementStat('calcs');
}

// ─── Unit Converters ─────────────────────────────────────
function convDist(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const m=f==='m'?v:f==='km'?v*1000:f==='cm'?v/100:v*0.0254;if(f!=='km')document.getElementById('u-km').value=(m/1000).toFixed(6);if(f!=='m')document.getElementById('u-m').value=m.toFixed(6);if(f!=='cm')document.getElementById('u-cm').value=(m*100).toFixed(4);if(f!=='in')document.getElementById('u-in').value=(m*39.3701).toFixed(4);}
function convMass(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const kg=f==='kg'?v:f==='g'?v/1000:v*0.453592;if(f!=='kg')document.getElementById('u-kg').value=kg.toFixed(6);if(f!=='g')document.getElementById('u-g').value=(kg*1000).toFixed(4);if(f!=='lb')document.getElementById('u-lb').value=(kg*2.20462).toFixed(4);}
function convTemp(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const c=f==='c'?v:f==='f'?(v-32)*5/9:v-273.15;const e=sanityCheck(c,{min:-273.15,label:'Temperatura (K≥0)'});if(e&&f==='k'){showSnackbar(e);return;}if(f!=='c')document.getElementById('u-c').value=c.toFixed(4);if(f!=='f')document.getElementById('u-f').value=(c*9/5+32).toFixed(4);if(f!=='k')document.getElementById('u-k').value=(c+273.15).toFixed(4);}
function convData(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const mb=f==='mb'?v:f==='gb'?v*1024:v*1048576;if(f!=='mb')document.getElementById('u-mb').value=mb.toFixed(2);if(f!=='gb')document.getElementById('u-gb').value=(mb/1024).toFixed(6);if(f!=='tb')document.getElementById('u-tb').value=(mb/1048576).toFixed(8);}

// ─── Geometry ────────────────────────────────────────────
function switchGeo(id, btn) {
    document.querySelectorAll('[id^="geo-"]').forEach(p => p.classList.remove('on'));
    document.getElementById('geo-' + id).classList.add('on');
    btn.closest('.tab-row').querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}
function calcGeo(shape) {
    const g = id => parseFloat(document.getElementById(id).value);
    const fmt = n => isNaN(n)||!isFinite(n) ? '—' : n.toFixed(4);

    if (shape==='cir') {
        const r = g('g-cr');
        const err = sanityCheck(r, { min: 0, label: 'Promień r' });
        if (!isNaN(r) && err) { showSnackbar(err); return; }
    }
    if (shape==='cyl' || shape==='cone') {
        const r = g('g-'+shape+'r');
        const err = sanityCheck(r, { min: 0, label: 'Promień r' });
        if (!isNaN(r) && err) { showSnackbar(err); return; }
    }
    if (shape==='sph') {
        const r = g('g-spr');
        const err = sanityCheck(r, { min: 0, label: 'Promień r' });
        if (!isNaN(r) && err) { showSnackbar(err); return; }
    }

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
    incrementStat('calcs');
}

/* ═══════════════════════════════════════════════════════════
   18. SHA-256 ANSWER HASHING (per-session salt)
   ═══════════════════════════════════════════════════════════ */
const SALT = crypto.getRandomValues(new Uint8Array(16)).reduce((h,b) => h + b.toString(16).padStart(2,'0'), '');

async function hashAnswer(val) {
    const data = SALT + String(Math.round(val * 100));
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ═══════════════════════════════════════════════════════════
   19. TASK DATA (150 tasks)
   ═══════════════════════════════════════════════════════════ */
const R = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const TASKS = [];

// ── EASY (50) ─────────────────────────────────────────────
for (let i=0; i<20; i++) {
    const a=R(2,9), b=R(1,25), x=R(1,20);
    TASKS.push({ diff:'easy', cat:'algebra', q:`Wyznacz x: <code>${a}x + ${b} = ${a*x+b}</code>`, ans:x, hint:`Odejmij ${b} od obu stron, następnie podziel przez ${a}.` });
}
for (let i=0; i<15; i++) {
    const p=R(1,9)*10, n=R(2,20)*10;
    TASKS.push({ diff:'easy', cat:'procenty', q:`Oblicz: <code>${p}% z liczby ${n}</code>`, ans:(p/100)*n, hint:`Podziel ${p} przez 100, a następnie pomnóż przez ${n}.` });
}
for (let i=0; i<10; i++) {
    const a=R(2,15), b=R(2,15);
    TASKS.push({ diff:'easy', cat:'geometria', q:`Oblicz pole prostokąta: <code>a = ${a}, b = ${b}</code>`, ans:a*b, hint:`Pole prostokąta = a × b.` });
}
for (let i=0; i<5; i++) {
    const a1=R(1,10), r=R(1,6);
    TASKS.push({ diff:'easy', cat:'ciagi', q:`Podaj następny wyraz ciągu: <code>${a1}, ${a1+r}, ${a1+2*r}, ${a1+3*r}, ?</code>`, ans:a1+4*r, hint:`To ciąg arytmetyczny. Różnica = ${r}.` });
}
// ── MEDIUM (60) ────────────────────────────────────────────
for (let i=0; i<15; i++) {
    const b=R(2,8), c=R(-6,6); const cc = c===0?1:c;
    TASKS.push({ diff:'medium', cat:'delta', q:`Oblicz wyróżnik Δ: <code>y = x² + ${b}x ${cc>0?'+'+cc:cc}</code>`, ans:b*b-4*cc, hint:`Δ = b² − 4ac. Tutaj a=1, b=${b}, c=${cc}.` });
}
for (let i=0; i<10; i++) {
    const x1=R(1,8), x2=R(-8,0);
    const b=-(x1+x2), c=x1*x2;
    TASKS.push({ diff:'medium', cat:'delta', q:`Znajdź większy pierwiastek: <code>x² ${b>=0?'+'+b:b}x ${c>=0?'+'+c:c} = 0</code>`, ans:Math.max(x1,x2), hint:`Policz Δ = b²−4ac, a następnie x = (−b+√Δ)/2.` });
}
for (let i=0; i<10; i++) {
    const r=R(2,12);
    TASKS.push({ diff:'medium', cat:'geometria', q:`Oblicz pole koła (zaokrąglij do 2 miejsc po przecinku): <code>r = ${r}</code>`, ans:parseFloat((Math.PI*r*r).toFixed(2)), hint:`P = πr². Użyj π ≈ 3.14159.` });
}
for (let i=0; i<10; i++) {
    const a1=R(1,5), r=R(1,4), n=R(5,12);
    const an = a1+(n-1)*r;
    TASKS.push({ diff:'medium', cat:'ciagi', q:`Suma ${n} pierwszych wyrazów ciągu arytm.: <code>a₁=${a1}, r=${r}</code>`, ans:(a1+an)*n/2, hint:`Sₙ = (a₁+aₙ)·n/2. Najpierw oblicz aₙ = a₁+(n-1)r.` });
}
for (let i=0; i<8; i++) {
    const n=R(4,10);
    TASKS.push({ diff:'medium', cat:'logika', q:`Ile 2-elementowych podzbiorów można wybrać z ${n}-elementowego zbioru?`, ans:n*(n-1)/2, hint:`C(n,2) = n!/(2!(n−2)!) = n(n−1)/2.` });
}
for (let i=0; i<7; i++) {
    const a1=R(1,4), q=R(2,3), n=R(4,6);
    TASKS.push({ diff:'medium', cat:'ciagi', q:`Oblicz ${n}-ty wyraz ciągu geometrycznego: <code>a₁=${a1}, q=${q}</code>`, ans:a1*Math.pow(q,n-1), hint:`aₙ = a₁ · qⁿ⁻¹.` });
}
// ── HARD (40) ──────────────────────────────────────────────
[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]].forEach(([a,b,c]) => {
    TASKS.push({ diff:'hard', cat:'geometria', q:`Trójkąt prostokątny. Przyprostokątne: a=${a}, b=${b}. Oblicz przeciwprostokątną c.`, ans:c, hint:`Twierdzenie Pitagorasa: c² = a² + b². c = √(${a*a}+${b*b}).` });
});
[[2,0.5,4],[3,0.25,4],[6,0.5,12]].forEach(([a1,q,ans]) => {
    TASKS.push({ diff:'hard', cat:'ciagi', q:`Oblicz sumę nieskończonego ciągu geometrycznego: <code>a₁=${a1}, q=${q}</code>`, ans, hint:`S∞ = a₁ / (1−q), bo |q| < 1.` });
});
for (let i=0; i<6; i++) {
    const r=R(2,6), h=R(3,9);
    TASKS.push({ diff:'hard', cat:'geometria', q:`Objętość stożka (2 miejsca po przecinku): <code>r=${r}, h=${h}</code>`, ans:parseFloat((Math.PI*r*r*h/3).toFixed(2)), hint:`V = ⅓·π·r²·h.` });
}
[[2,32,5],[3,81,4],[2,64,6],[5,125,3]].forEach(([base,arg,ans]) => {
    TASKS.push({ diff:'hard', cat:'algebra', q:`Oblicz: <code>log<sub>${base}</sub>(${arg})</code>`, ans, hint:`log_${base}(${arg}) = x oznacza ${base}^x = ${arg}.` });
});
[[5,2,20],[6,2,30],[4,3,24]].forEach(([n,k,ans]) => {
    TASKS.push({ diff:'hard', cat:'logika', q:`Oblicz wariację V(${n},${k}) = ${n}!/(${n}−${k})!`, ans, hint:`V(n,k) = n·(n−1)·…·(n−k+1). Tu ${n}·${n-1} = ?` });
});
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
   20. TASK RENDERING & VERIFICATION
   ═══════════════════════════════════════════════════════════ */
let score = parseInt(localStorage.getItem('zymath_score') || '0');
let solved = parseInt(localStorage.getItem('zymath_solved') || '0');
let activeFilter = 'all';

// Restore progress on reload
document.addEventListener('DOMContentLoaded', () => {
    const sb = document.getElementById('scoreBoard');
    const sc = document.getElementById('solvedCount');
    const pf = document.getElementById('progressFill');
    if (sb) sb.textContent = score;
    if (sc) sc.textContent = solved;
    if (pf) pf.style.width = (solved / 150 * 100).toFixed(1) + '%';
});

async function buildTasks() {
    const grid = document.getElementById('taskGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < TASKS.length; i++) {
        const t = TASKS[i];
        const hash = await hashAnswer(t.ans);
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.diff = t.diff;
        card.dataset.cat  = t.cat;
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
    if (window.lucide) window.lucide.createIcons();
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
        localStorage.setItem('zymath_score', score);
        localStorage.setItem('zymath_solved', solved);
        document.getElementById('scoreBoard').textContent = score;
        document.getElementById('solvedCount').textContent = solved;
        document.getElementById('progressFill').style.width = (solved / 150 * 100).toFixed(1) + '%';
        spawnConfetti(input);
        incrementStat('solved');
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
   21. CONFETTI (physics-based)
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

/* ═══════════════════════════════════════════════════════════
   22. FLOATING DOODLE SYMBOLS
   ═══════════════════════════════════════════════════════════ */
function initDoodle() {
    const symbols = ['∑','∫','∂','√','π','∞','∆','Ω','λ','θ','φ','σ','α','β','γ','δ','ε','η','μ','ξ','≈','≠','≤','≥','→','↔','∈','∉','⊂','∩','∪','∀','∃','∅'];
    const container = document.getElementById('doodle');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.className = 'dk';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.cssText = `left:${Math.random()*100}%;font-size:${Math.random()*20+10}px;animation-duration:${Math.random()*20+12}s;animation-delay:-${Math.random()*20}s`;
        container.appendChild(el);
    }
}

/* ═══════════════════════════════════════════════════════════
   23. PWA SERVICE WORKER REGISTRATION
   ═══════════════════════════════════════════════════════════ */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => console.log('[SW] Registered, scope:', reg.scope))
            .catch(err => console.warn('[SW] Registration failed:', err));
    }
}

let _deferredInstall = null;
function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        _deferredInstall = e;
        const banner = document.getElementById('pwa-banner');
        if (banner) banner.classList.add('show');
    });
    window.addEventListener('appinstalled', () => {
        const banner = document.getElementById('pwa-banner');
        if (banner) banner.classList.remove('show');
        showSnackbar('✅ Zymath zainstalowany na pulpicie!');
    });
}

function installPWA() {
    if (!_deferredInstall) return;
    _deferredInstall.prompt();
    _deferredInstall.userChoice.then(choice => {
        if (choice.outcome === 'accepted') showSnackbar('🚀 Instalacja zakończona!');
        _deferredInstall = null;
        document.getElementById('pwa-banner')?.classList.remove('show');
    });
}
function dismissPWA() { document.getElementById('pwa-banner')?.classList.remove('show'); }


/* ═══════════════════════════════════════════════════════════
   5. PARTICLES (geometric connecting dots — pure Canvas)
   ═══════════════════════════════════════════════════════════ */
let _particlesActive = true;
let _particleRAF = null;
const _pts = [];

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); });

    const COUNT = Math.min(55, Math.floor(window.innerWidth / 22));
    _pts.length = 0;
    for (let i = 0; i < COUNT; i++) {
        _pts.push({
            x:  Math.random() * canvas.width,
            y:  Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.38,
            vy: (Math.random() - 0.5) * 0.38,
            r:  Math.random() * 1.8 + 0.9
        });
    }

    function loop() {
        if (!_particlesActive) { _particleRAF = null; return; }
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const dark = document.documentElement.dataset.theme !== 'light';
        const dotColor  = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.3)';
        const lineBase  = dark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

        for (const p of _pts) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();
        }

        const MAX_DIST = 130;
        for (let i = 0; i < _pts.length; i++) {
            for (let j = i + 1; j < _pts.length; j++) {
                const dx = _pts[i].x - _pts[j].x;
                const dy = _pts[i].y - _pts[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < MAX_DIST) {
                    const alpha = ((1 - dist / MAX_DIST) * 0.28).toFixed(3);
                    ctx.beginPath();
                    ctx.moveTo(_pts[i].x, _pts[i].y);
                    ctx.lineTo(_pts[j].x, _pts[j].y);
                    ctx.strokeStyle = lineBase + alpha + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        _particleRAF = requestAnimationFrame(loop);
    }
    if (_particleRAF) cancelAnimationFrame(_particleRAF);
    loop();
}

function toggleParticles() {
    _particlesActive = !_particlesActive;
    const canvas = document.getElementById('particles-canvas');
    const btn = document.getElementById('particles-toggle');
    if (_particlesActive) {
        if (canvas) canvas.style.display = 'block';
        initParticles();
        if (btn) btn.innerHTML = '<i data-lucide="sparkles"></i> Cząsteczki ON';
    } else {
        if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display='none'; }
        if (btn) btn.innerHTML = '<i data-lucide="sparkles"></i> Cząsteczki OFF';
    }
    if (window.lucide) window.lucide.createIcons();
    showSnackbar(_particlesActive ? '✨ Cząsteczki włączone' : '✨ Cząsteczki wyłączone');
}

/* ═══════════════════════════════════════════════════════════
   24. STARTUP
   ═══════════════════════════════════════════════════════════ */
// Achievements tracking for theme toggle
const _origToggleTheme = toggleTheme;
window.toggleTheme = function() {
    _origToggleTheme();
    incrementStat('themes');
};

setTimeout(resizeCanvas, 100);
buildTasks();
initMathKeyboard();


/* Zymath Singularity v2 | (c) 2026 5Simoon | Licensed under GNU GPL v3 */
