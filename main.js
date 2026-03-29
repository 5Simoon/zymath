
/* ════════════════════════════════════════════════════════════
   ZYMATH SINGULARITY v4 — Core Engine
   Author: 5Simoon | GNU GPL v3
════════════════════════════════════════════════════════════ */

/* ── MODULE STATE ──────────────────────────────────────────── */
const SALT = crypto.getRandomValues(new Uint8Array(16))
    .reduce((h, b) => h + b.toString(16).padStart(2, '0'), '');

const gs  = { scale: 45, ox: 0, oy: 0, drag: false, lx: 0, ly: 0 };
const pom = { running: false, phase: 0, remaining: 25*60, interval: null, cycles: 0 };
const ptc = { active: true, raf: null, pts: [], canvas: null, ctx: null };

let _glowRaf    = null;   // RAF handle for spotlight throttle
let _desmosMode = 'graph';
let _activeKbdInput = null;
let _deferredInstall = null;
let _snackTimer = null;
let score  = 0;
let solved = 0;
let activeFilter = 'all';

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Icons
    if (window.lucide) window.lucide.createIcons();

    // Anti-clickjacking
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (_) {}
    }

    // XSS guard on all inputs
    const XSS = /<script|javascript:|onerror\s*=|on\w+\s*=|eval\(|data:text/gi;
    document.body.addEventListener('input', e => {
        if (e.target.tagName === 'INPUT' && XSS.test(e.target.value)) {
            e.target.value = '';
            e.target.classList.add('shake');
            e.target.addEventListener('animationend', () => e.target.classList.remove('shake'), {once:true});
            showSnackbar('⚠ Zablokowano niedozwolony ciąg znaków');
        }
    }, { passive: true });

    // Honeypot — bots auto-fill hidden fields
    const trap = document.getElementById('security_trap');
    if (trap) setInterval(() => { if (trap.value) document.body.innerHTML = ''; }, 3000);

    // Theme
    const saved = localStorage.getItem('zymath_theme') || 'dark';
    applyTheme(saved);

    // Restore score/solved
    score  = parseInt(localStorage.getItem('zymath_score')  || '0');
    solved = parseInt(localStorage.getItem('zymath_solved') || '0');
    updateScore();

    // Modules
    initParticles();
    initDoodle();
    initSearch();
    initPomodoro();
    renderHistory();
    loadAchievements();
    registerServiceWorker();
    initPWAInstall();
    initMathKeyboard();
    buildTasks();

    // Graph
    setTimeout(() => { resizeCanvas(); }, 60);

    console.log('%c⚡ Zymath Singularity v4 ', 'background:#10b981;color:#000;font-weight:bold;font-size:13px;padding:2px 6px;border-radius:3px');
});

/* ════════════════════════════════════════════════════════════
   SPOTLIGHT GLOW — RAF-throttled
════════════════════════════════════════════════════════════ */
document.addEventListener('pointermove', e => {
    if (_glowRaf) return;
    _glowRaf = requestAnimationFrame(() => {
        for (const card of document.querySelectorAll('.card:hover, .card:focus-within')) {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        // Update all cards (needed for the initial position)
        for (const card of document.querySelectorAll('.card')) {
            const r = card.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            }
        }
        _glowRaf = null;
    });
}, { passive: true });

/* ════════════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════════════ */
function showTab(id, btn) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-current', 'page'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'kalkulatory') setTimeout(drawGraph, 150);
    if (window.lucide) window.lucide.createIcons();
}

/* ════════════════════════════════════════════════════════════
   THEME
════════════════════════════════════════════════════════════ */
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const icon = document.getElementById('theme-icon');
    if (icon) { icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon'); if (window.lucide) window.lucide.createIcons(); }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#000000' : '#f2f2ee';
    if (typeof drawGraph === 'function') drawGraph();
    ptc.pts.forEach(() => {}); // theme-aware particles redraw on next frame
}
function toggleTheme() {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('zymath_theme', next);
    applyTheme(next);
    incrementStat('themes');
}

/* ════════════════════════════════════════════════════════════
   EASTER EGG
════════════════════════════════════════════════════════════ */
let eggCount = 0;
function easterEgg() {
    eggCount++;
    if (eggCount % 3 === 0) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg) contrast(1.4)';
        setTimeout(() => document.body.style.filter = 'none', 1800);
    } else {
        const deg = (Math.random() - 0.5) * 7;
        document.body.style.transform = `rotate(${deg}deg)`;
        setTimeout(() => document.body.style.transform = 'none', 400);
    }
}

/* ════════════════════════════════════════════════════════════
   UTILITIES — Snackbar, Copy, Storage helpers
════════════════════════════════════════════════════════════ */
function showSnackbar(msg, duration = 2200) {
    const el = document.getElementById('snackbar');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (_snackTimer) clearTimeout(_snackTimer);
    _snackTimer = setTimeout(() => el.classList.remove('show'), duration);
}

function copyToClipboard(text, btn) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).then(() => {
        if (btn) {
            btn.classList.add('copied');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check"></i> Skopiowano!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); if (window.lucide) window.lucide.createIcons(); }, 1700);
        }
        showSnackbar('📋 Skopiowano do schowka');
    }).catch(() => showSnackbar('⚠ Nie udało się skopiować'));
}

function safeGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function updateScore() {
    const sb = document.getElementById('scoreBoard');
    const sc = document.getElementById('solvedCount');
    const pf = document.getElementById('progressFill');
    if (sb) sb.textContent = score;
    if (sc) sc.textContent = solved;
    if (pf) pf.style.width = (Math.min(solved, 150) / 150 * 100).toFixed(1) + '%';
}

/* ════════════════════════════════════════════════════════════
   HISTORY (localStorage — last 5 entries)
════════════════════════════════════════════════════════════ */
function addHistory(label, value) {
    const hist = safeGet('zymath_history', []);
    hist.unshift({ label: String(label).slice(0, 55), value: String(value).slice(0, 35), ts: Date.now() });
    if (hist.length > 5) hist.pop();
    safeSet('zymath_history', hist);
    renderHistory();
}

function clearHistory() {
    safeSet('zymath_history', []);
    renderHistory();
    showSnackbar('🗑 Historia wyczyszczona');
}

function renderHistory() {
    const el = document.getElementById('historyList');
    if (!el) return;
    const hist = safeGet('zymath_history', []);
    if (!hist.length) {
        el.innerHTML = '<div class="history-empty">Brak historii obliczeń</div>';
        return;
    }
    el.innerHTML = hist.map(h => {
        const t = new Date(h.ts);
        const time = t.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        // Safe encoding for data attribute
        const safeVal = h.value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `<div class="history-item">
            <span class="h-label" title="${safeVal}">${h.label}</span>
            <span class="h-val">${h.value}</span>
            <span class="h-time">${time}</span>
            <button class="h-copy" data-copy="${safeVal}" title="Kopiuj"><i data-lucide="copy"></i></button>
        </div>`;
    }).join('');
    // Event delegation — safe, no inline onclick
    el.addEventListener('click', e => {
        const btn = e.target.closest('[data-copy]');
        if (btn) copyToClipboard(btn.dataset.copy, btn);
    }); // Removed { once: true }
    if (window.lucide) window.lucide.createIcons();
}

/* ════════════════════════════════════════════════════════════
   ACHIEVEMENTS
════════════════════════════════════════════════════════════ */
const ACHIEVEMENTS = {
    first_solve:   { icon:'🎯', name:'Pierwsze Kroki',    desc:'Rozwiąż pierwsze zadanie',          key:'solved',    n:1   },
    five_solve:    { icon:'⚡', name:'Elektryczny Umysł', desc:'5 poprawnych odpowiedzi',            key:'solved',    n:5   },
    twenty_solve:  { icon:'🔥', name:'Płonący Intelekt',  desc:'20 poprawnych odpowiedzi',           key:'solved',    n:20  },
    fifty_solve:   { icon:'💎', name:'Diamentowy Mózg',   desc:'50 poprawnych odpowiedzi',           key:'solved',    n:50  },
    master:        { icon:'👑', name:'Mistrz Zymath',     desc:'100 poprawnych odpowiedzi',          key:'solved',    n:100 },
    first_calc:    { icon:'🧮', name:'Inicjacja Kalkulexa',desc:'Pierwszy wynik w kalkulatorze',     key:'calcs',     n:1   },
    ten_calcs:     { icon:'🛠', name:'Inżynier Formuł',   desc:'10 obliczeń w kalkulatorach',       key:'calcs',     n:10  },
    theme_toggle:  { icon:'🌓', name:'Władca Ciemności',  desc:'Przełącz motyw kolorystyczny',      key:'themes',    n:1   },
    search_used:   { icon:'🔍', name:'Detektyw Wiedzy',   desc:'Użyj wyszukiwarki Ctrl+K',          key:'searches',  n:1   },
    pomodoro_done: { icon:'🍅', name:'Fokus jak Laser',   desc:'Ukończ całą sesję Pomodoro',        key:'pomodoros', n:1   },
};

function loadAchievements() {
    if (!localStorage.getItem('zymath_ach_prog'))    safeSet('zymath_ach_prog',    {solved:0,calcs:0,themes:0,searches:0,pomodoros:0});
    if (!localStorage.getItem('zymath_ach_unlocked')) safeSet('zymath_ach_unlocked', []);
}

function incrementStat(key, n = 1) {
    const prog = safeGet('zymath_ach_prog', {});
    prog[key] = (prog[key] || 0) + n;
    safeSet('zymath_ach_prog', prog);
    // Check all achievements
    const unlocked = safeGet('zymath_ach_unlocked', []);
    const shown    = safeGet('zymath_ach_shown', []);
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        if (!unlocked.includes(id) && (prog[ach.key] || 0) >= ach.n) {
            unlocked.push(id);
            safeSet('zymath_ach_unlocked', unlocked);
        }
        if (unlocked.includes(id) && !shown.includes(id)) {
            shown.push(id);
            safeSet('zymath_ach_shown', shown);
            showAchievementToast(ach);
        }
    }
}

function showAchievementToast(ach) {
    const container = document.getElementById('ach-toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'ach-toast';
    el.innerHTML = `<div class="ach-icon">${ach.icon}</div>
        <div><div class="ach-label">🏆 Osiągnięcie odblokowane!</div>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div></div>`;
    container.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 4200);
}

/* ════════════════════════════════════════════════════════════
   POMODORO TIMER
════════════════════════════════════════════════════════════ */
const POM_PHASES = [
    { label:'🍅 Fokus',   mins: 25 },
    { label:'☕ Przerwa', mins: 5  },
];

function initPomodoro() { updatePomDisplay(); }

function togglePomodoro() {
    if (pom.running) {
        clearInterval(pom.interval);
        pom.running = false;
        const btn = document.getElementById('pom-start-btn');
        if (btn) { btn.textContent = 'Start'; btn.classList.remove('active'); }
    } else {
        pom.running = true;
        const btn = document.getElementById('pom-start-btn');
        if (btn) { btn.textContent = 'Stop'; btn.classList.add('active'); }
        pom.interval = setInterval(() => {
            pom.remaining--;
            updatePomDisplay();
            if (pom.remaining <= 0) {
                clearInterval(pom.interval);
                pom.running = false;
                pom.phase = (pom.phase + 1) % POM_PHASES.length;
                pom.remaining = POM_PHASES[pom.phase].mins * 60;
                if (pom.phase === 0) { pom.cycles++; incrementStat('pomodoros'); }
                updatePomDisplay();
                const btn2 = document.getElementById('pom-start-btn');
                if (btn2) { btn2.textContent = 'Start'; btn2.classList.remove('active'); }
                showSnackbar(pom.phase === 0 ? '🎉 Przerwa skończona! Czas na fokus.' : '☕ Czas na zasłużoną przerwę!');
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pom.interval);
    Object.assign(pom, { running:false, phase:0, remaining:25*60, interval:null });
    const btn = document.getElementById('pom-start-btn');
    if (btn) { btn.textContent = 'Start'; btn.classList.remove('active'); }
    updatePomDisplay();
}

function updatePomDisplay() {
    const m = Math.floor(pom.remaining / 60).toString().padStart(2, '0');
    const s = (pom.remaining % 60).toString().padStart(2, '0');
    const t = `${m}:${s}`;
    ['pom-display', 'pom-mini-time'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = t; });
    const phase = document.getElementById('pom-phase');
    if (phase) phase.textContent = POM_PHASES[pom.phase].label;
    const count = document.getElementById('pom-count');
    if (count) count.textContent = `Ukończone sesje: ${pom.cycles}`;
    // Update page title when running
    if (pom.running) document.title = `${t} — Zymath Singularity`;
    else document.title = 'Zymath Singularity';
}

function togglePomodoroCollapse() {
    document.getElementById('pomodoro')?.classList.toggle('collapsed');
}

/* ════════════════════════════════════════════════════════════
   GLOBAL SEARCH (Ctrl+K)
════════════════════════════════════════════════════════════ */
const SEARCH_INDEX = [
    { title:'Kroniki Matematyki',        desc:'Historia — 4 epoki',                    tab:'home',        icon:'history',         tag:'Start'    },
    { title:'Anomalie Wszechświata',     desc:'Paradoksy i matematyczne osobliwości',  tab:'home',        icon:'sparkles',        tag:'Start'    },
    { title:'Algebra — Wzory Skrócone',  desc:'Kwadraty, sześciany, różnica kwadratów',tab:'wiedza',      icon:'braces',          tag:'Wiedza'   },
    { title:'Funkcja Kwadratowa',        desc:'Postać ogólna, wierzchołkowa, Δ',       tab:'wiedza',      icon:'activity',        tag:'Wiedza'   },
    { title:'Logarytmy',                 desc:'Definicja, własności, zmiana podstawy', tab:'wiedza',      icon:'logs',            tag:'Wiedza'   },
    { title:'Trygonometria',             desc:'Funkcje, tabela, wzory redukcyjne',     tab:'wiedza',      icon:'triangle',        tag:'Wiedza'   },
    { title:'Ciągi Liczbowe',            desc:'Arytmetyczne, geometryczne, sumy',      tab:'wiedza',      icon:'list-ordered',    tag:'Wiedza'   },
    { title:'Geometria',                 desc:'Figury, bryły, twierdzenia',            tab:'wiedza',      icon:'shapes',          tag:'Wiedza'   },
    { title:'Kombinatoryka',             desc:'Permutacje, wariacje, kombinacje',      tab:'wiedza',      icon:'dice-5',          tag:'Wiedza'   },
    { title:'Rachunek Różniczkowy',      desc:'Pochodne, ekstrema, monotoniczność',    tab:'wiedza',      icon:'trending-up',     tag:'Wiedza'   },
    { title:'Graph Engine 3.1',          desc:'Wykres funkcji — zoom, pan, 3 krzywe', tab:'kalkulatory', icon:'line-chart',      tag:'Terminal' },
    { title:'Desmos Pro API',            desc:'Profesjonalny kalkulator graficzny',    tab:'kalkulatory', icon:'external-link',   tag:'Terminal' },
    { title:'Analiza Kwadratowa',        desc:'Δ, wierzchołek, pierwiastki, PDF',     tab:'kalkulatory', icon:'target',          tag:'Terminal' },
    { title:'Układ Równań 2×2',          desc:'Metoda Cramera',                       tab:'kalkulatory', icon:'git-branch-plus', tag:'Terminal' },
    { title:'Kalkulator Trygonometryczny',desc:'sin/cos/tan/cot, trójkąt',           tab:'kalkulatory', icon:'triangle',        tag:'Terminal' },
    { title:'NWD, NWW & Primes',         desc:'Rozkład na czynniki pierwsze',         tab:'kalkulatory', icon:'divide',          tag:'Terminal' },
    { title:'Statystyka Opisowa',        desc:'Średnia, mediana, moda, odch. std',    tab:'kalkulatory', icon:'bar-chart-2',     tag:'Terminal' },
    { title:'Systemy Liczbowe',          desc:'Dec ↔ Bin ↔ Oct ↔ Hex ↔ Roman',       tab:'kalkulatory', icon:'binary',          tag:'Terminal' },
    { title:'Fizyka — Newton & Kinem.',  desc:'F=ma, ruch jednostajnie przyspieszony',tab:'kalkulatory', icon:'rocket',          tag:'Terminal' },
    { title:'Finanse — Procent Składany',desc:'Kapitalizacja, rata kredytowa',        tab:'kalkulatory', icon:'pie-chart',       tag:'Terminal' },
    { title:'Konwerter Jednostek',       desc:'Długość, masa, temperatura, dane',     tab:'kalkulatory', icon:'ruler',           tag:'Terminal' },
    { title:'Kalkulator Geometryczny',   desc:'Koło, walec, stożek, kula, trójkąt',  tab:'kalkulatory', icon:'shapes',          tag:'Terminal' },
    { title:'Zadania — Algebra',         desc:'Równania liniowe i kwadratowe',        tab:'zadania',     icon:'target',          tag:'Zadania'  },
    { title:'Zadania — Geometria',       desc:'Pola, objętości, twierdzenia',         tab:'zadania',     icon:'shapes',          tag:'Zadania'  },
    { title:'Zadania — Procenty',        desc:'Obliczenia procentowe',                tab:'zadania',     icon:'percent',         tag:'Zadania'  },
    { title:'Zadania — Wyróżnik Δ',      desc:'Równania kwadratowe',                  tab:'zadania',     icon:'activity',        tag:'Zadania'  },
    { title:'Zadania — Ciągi',           desc:'Arytmetyczne i geometryczne',          tab:'zadania',     icon:'list-ordered',    tag:'Zadania'  },
];

function initSearch() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
        if (e.key === 'Escape') closeSearch();
    });
    document.getElementById('search-overlay')?.addEventListener('click', e => { if (e.target.id === 'search-overlay') closeSearch(); });
    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('input', () => renderSearchResults(input.value));
        input.addEventListener('keydown', handleSearchKeydown);
    }
}

function openSearch() {
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('searchInput');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => input?.focus(), 60);
    renderSearchResults('');
    incrementStat('searches');
}

function closeSearch() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay?.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
}

function renderSearchResults(query) {
    const el = document.getElementById('searchResults');
    if (!el) return;
    const q = query.trim().toLowerCase();
    const results = q
        ? SEARCH_INDEX.filter(r => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
        : SEARCH_INDEX.slice(0, 9);
    if (!results.length) {
        el.innerHTML = `<div style="text-align:center;padding:26px;font-family:var(--font-code);font-size:0.78rem;color:var(--muted)">Brak wyników dla "<em>${q}</em>"</div>`;
        return;
    }
    el.innerHTML = results.map((r, i) =>
        `<div class="search-result-item${i === 0 ? ' focused' : ''}" onclick="searchGo('${r.tab}')" data-idx="${i}">
            <i data-lucide="${r.icon}"></i>
            <div style="flex:1;min-width:0"><div class="sr-title">${r.title}</div><div class="sr-desc">${r.desc}</div></div>
            <span class="sr-tag">${r.tag}</span>
        </div>`
    ).join('');
    if (window.lucide) window.lucide.createIcons();
    el.dataset.focused = '0';
}

function searchGo(tabId) {
    closeSearch();
    const btn = document.querySelector(`.nb[onclick*="'${tabId}'"]`);
    if (btn) showTab(tabId, btn);
}

function handleSearchKeydown(e) {
    const el = document.getElementById('searchResults');
    if (!el) return;
    const items = [...el.querySelectorAll('.search-result-item')];
    let idx = parseInt(el.dataset.focused || '0');
    if (e.key === 'ArrowDown')       { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); idx = Math.max(idx - 1, 0); }
    else if (e.key === 'Enter' && items[idx]) { items[idx].click(); return; }
    else return;
    items.forEach((it, i) => it.classList.toggle('focused', i === idx));
    el.dataset.focused = idx;
    items[idx]?.scrollIntoView({ block: 'nearest' });
}

/* ════════════════════════════════════════════════════════════
   MATH KEYBOARD
════════════════════════════════════════════════════════════ */
function initMathKeyboard() {
    document.addEventListener('focusin', e => {
        if (e.target.matches('input[type="text"]') && e.target.closest('#graph-engine-card')) {
            _activeKbdInput = e.target;
        }
    });
}

function insertMathKey(val) {
    if (val === '__BS__') {
        if (!_activeKbdInput) return;
        const p = _activeKbdInput.selectionStart || 0;
        const v = _activeKbdInput.value;
        if (p === 0) return;
        _activeKbdInput.value = v.slice(0, p-1) + v.slice(_activeKbdInput.selectionEnd || p);
        _activeKbdInput.selectionStart = _activeKbdInput.selectionEnd = p - 1;
        _activeKbdInput.focus();
        _activeKbdInput.dispatchEvent(new Event('input'));
        return;
    }
    if (!_activeKbdInput) { showSnackbar('⚠ Kliknij najpierw w pole funkcji'); return; }
    const p = _activeKbdInput.selectionStart || 0;
    const v = _activeKbdInput.value;
    _activeKbdInput.value = v.slice(0, p) + val + v.slice(_activeKbdInput.selectionEnd || p);
    _activeKbdInput.selectionStart = _activeKbdInput.selectionEnd = p + val.length;
    _activeKbdInput.focus();
    _activeKbdInput.dispatchEvent(new Event('input'));
}

function toggleMathKbd() {
    const kbd = document.getElementById('math-kbd');
    if (!kbd) return;
    kbd.classList.toggle('visible');
    const btn = document.getElementById('kbd-toggle-btn');
    if (btn) btn.textContent = kbd.classList.contains('visible') ? '⌨ Ukryj klawiaturę' : '⌨ Klawiatura matematyczna';
}

/* ════════════════════════════════════════════════════════════
   PDF EXPORT
════════════════════════════════════════════════════════════ */
function exportPDF(title, lines) {
    const load = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit:'mm', format:'a4' });
            const W = doc.internal.pageSize.getWidth();
            doc.setFillColor(0,0,0); doc.rect(0,0,W,26,'F');
            doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
            doc.text('ZYMATH SINGULARITY v4', 13, 17);
            doc.setTextColor(255,0,60); doc.setFontSize(12);
            doc.text(title, 13, 36);
            doc.setDrawColor(255,0,60); doc.setLineWidth(0.4); doc.line(13,39,W-13,39);
            doc.setTextColor(30,30,30); doc.setFontSize(9.5); doc.setFont('courier','normal');
            let y = 48;
            for (const line of lines) {
                if (y > 268) { doc.addPage(); y = 18; }
                doc.text(String(line), 13, y); y += 6.5;
            }
            doc.setFontSize(7.5); doc.setTextColor(140,140,140);
            doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')} | SHA-256 | zymath.vercel.app`, 13, 284);
            doc.save(`zymath_${title.replace(/\s+/g,'_').toLowerCase()}.pdf`);
            showSnackbar('📄 Raport PDF zapisany');
        } catch(e) { showSnackbar('⚠ Błąd PDF: ' + e.message); }
    };
    if (window.jspdf) { load(); return; }
    showSnackbar('⏳ Ładowanie jsPDF…');
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = load;
    s.onerror = () => showSnackbar('⚠ Nie można załadować jsPDF');
    document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════════
   PARTICLES — geometric connecting dots
════════════════════════════════════════════════════════════ */
function initParticles() {
    ptc.canvas = document.getElementById('particles-canvas');
    if (!ptc.canvas) return;
    ptc.ctx = ptc.canvas.getContext('2d');

    const resize = () => {
        ptc.canvas.width  = window.innerWidth;
        ptc.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const count = Math.min(50, Math.floor(window.innerWidth / 24));
    ptc.pts = Array.from({ length: count }, () => ({
        x:  Math.random() * ptc.canvas.width,
        y:  Math.random() * ptc.canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 1.6 + 0.7,
    }));

    const loop = () => {
        if (!ptc.active) { ptc.raf = null; return; }
        const { canvas: c, ctx, pts } = ptc;
        ctx.clearRect(0, 0, c.width, c.height);
        const dark = document.documentElement.dataset.theme !== 'light';
        const dotCol  = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)';
        const lineBase = dark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

        for (const p of pts) {
            p.x = (p.x + p.vx + c.width)  % c.width;
            p.y = (p.y + p.vy + c.height) % c.height;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = dotCol; ctx.fill();
        }
        const MAX = 125;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i+1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < MAX) {
                    ctx.beginPath();
                    ctx.moveTo(pts[i].x, pts[i].y);
                    ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = lineBase + ((1 - d/MAX) * 0.25).toFixed(3) + ')';
                    ctx.lineWidth = 0.7; ctx.stroke();
                }
            }
        }
        ptc.raf = requestAnimationFrame(loop);
    };
    if (ptc.raf) cancelAnimationFrame(ptc.raf);
    ptc.raf = requestAnimationFrame(loop);
}

function toggleParticles() {
    ptc.active = !ptc.active;
    if (ptc.active) {
        ptc.canvas.style.display = 'block';
        ptc.raf = requestAnimationFrame(() => {
            ptc.active = true;
            initParticles();
        });
    } else {
        if (ptc.canvas) { ptc.ctx?.clearRect(0, 0, ptc.canvas.width, ptc.canvas.height); ptc.canvas.style.display = 'none'; }
    }
    const btn = document.getElementById('particles-toggle');
    if (btn) { btn.innerHTML = `<i data-lucide="sparkles"></i> Cząsteczki ${ptc.active ? 'ON' : 'OFF'}`; if(window.lucide) window.lucide.createIcons(); }
    showSnackbar(ptc.active ? '✨ Cząsteczki włączone' : '✨ Cząsteczki wyłączone');
}

/* ════════════════════════════════════════════════════════════
   SAFE MATH EVALUATOR
════════════════════════════════════════════════════════════ */
function safeMathEval(expr, xVal) {
    if (typeof expr !== 'string' || expr.length > 280) throw new Error('Wyrażenie za długie');
    const FORBIDDEN = /\b(window|document|self|globalThis|top|parent|frames|location|history|navigator|fetch|XMLHttpRequest|WebSocket|import|require|eval|Function|process|__proto__|prototype|constructor|Reflect|Proxy|Symbol|alert|confirm|prompt|console|localStorage|sessionStorage|indexedDB|Worker)\b/i;
    if (FORBIDDEN.test(expr)) throw new Error('Niedozwolony identyfikator');
    const fn = new Function('x', 'Math', `"use strict";
        const {sin,cos,tan,asin,acos,atan,atan2,sqrt,abs,pow,log,log2,log10,
               floor,ceil,round,min,max,sign,cbrt,exp,sinh,cosh,tanh,
               PI,E,SQRT2,hypot,trunc,LN2,LN10} = Math;
        return (${expr});`);
    const result = fn(xVal, Math);
    if (typeof result !== 'number') throw new Error('Wynik musi być liczbą');
    return result;
}

/* ════════════════════════════════════════════════════════════
   SANITY CHECKS
════════════════════════════════════════════════════════════ */
const SANITY_MSGS = [
    '🤔 To fizycznie niemożliwe!',
    '⚠ Ujemna wartość tutaj nie ma sensu.',
    '🚨 Anomalia danych. Sprawdź wartości.',
    '📐 Matematyka protestuje! Popraw dane.',
];
function sanityMsg() { return SANITY_MSGS[Math.floor(Math.random() * SANITY_MSGS.length)]; }

function sanityCheck(val, { min=-Infinity, max=Infinity, nonZero=false, integer=false, label='Wartość' } = {}) {
    if (isNaN(val)) return `${label} musi być liczbą.`;
    if (nonZero && val === 0) return `${label} nie może być zerem.`;
    if (val < min) return `${label} ≥ ${min}. ${sanityMsg()}`;
    if (val > max) return `${label} ≤ ${max}. ${sanityMsg()}`;
    if (integer && !Number.isInteger(val)) return `${label} musi być całkowita.`;
    return null;
}

function shakeInput(el) {
    if (!el) return;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/* ════════════════════════════════════════════════════════════
   GRAPH ENGINE v3.2 — zoom/pan/3-functions/tick labels
════════════════════════════════════════════════════════════ */
const gCanvas = document.getElementById('gCanvas');
const gCtx    = gCanvas ? gCanvas.getContext('2d') : null;
const COLORS  = ['#ff003c', '#00d4ff', '#fbbf24'];

function resizeCanvas() {
    if (!gCanvas || !gCtx) return;
    const rect = gCanvas.getBoundingClientRect();
    const dpr  = devicePixelRatio || 1;
    gCanvas.width  = rect.width  * dpr;
    gCanvas.height = rect.height * dpr;
    gCtx.scale(dpr, dpr);
    drawGraph();
}
window.addEventListener('resize', resizeCanvas, { passive: true });

if (gCanvas) {
    gCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.11 : 0.9;
        gs.scale = Math.max(8, Math.min(220, gs.scale * f));
        const scaleEl = document.getElementById('gScale');
        if (scaleEl) scaleEl.value = Math.round(gs.scale);
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
        const mx = r.width/2 + gs.ox, my = r.height/2 + gs.oy;
        const xi = ((e.clientX - r.left) - mx) / gs.scale;
        const yi = -(((e.clientY - r.top)  - my) / gs.scale);
        const coords = document.getElementById('gCoords');
        if (coords) coords.innerHTML = `x: <strong>${xi.toFixed(3)}</strong> &nbsp;|&nbsp; y: <strong>${yi.toFixed(3)}</strong>`;
    }, { passive: true });
    gCanvas.addEventListener('pointerup',    () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
    gCanvas.addEventListener('pointerleave', () => { gs.drag = false; gCanvas.style.cursor = 'crosshair'; });
}

function resetGraph() {
    gs.ox = 0; gs.oy = 0; gs.scale = 45;
    const scaleEl = document.getElementById('gScale');
    if (scaleEl) scaleEl.value = 45;
    drawGraph();
}

function drawGraph() {
    if (!gCanvas || !gCtx) return;
    if (!gs.drag) { const sl = parseFloat(document.getElementById('gScale')?.value); if (!isNaN(sl)) gs.scale = sl; }
    const dpr = devicePixelRatio || 1;
    const W = gCanvas.width / dpr, H = gCanvas.height / dpr;
    const sc = gs.scale, ox = W/2 + gs.ox, oy = H/2 + gs.oy;
    const dark = document.documentElement.dataset.theme !== 'light';

    gCtx.clearRect(0, 0, W, H);
    gCtx.fillStyle = dark ? '#050505' : '#f8f8f4';
    gCtx.fillRect(0, 0, W, H);

    // Grid
    gCtx.strokeStyle = dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    gCtx.lineWidth = 1;
    for (let x = ox % sc; x < W; x += sc) { gCtx.beginPath(); gCtx.moveTo(x,0); gCtx.lineTo(x,H); gCtx.stroke(); }
    for (let y = oy % sc; y < H; y += sc) { gCtx.beginPath(); gCtx.moveTo(0,y); gCtx.lineTo(W,y); gCtx.stroke(); }

    // Axes
    gCtx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)';
    gCtx.lineWidth = 1.5;
    gCtx.beginPath(); gCtx.moveTo(0,oy); gCtx.lineTo(W,oy); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(ox,0); gCtx.lineTo(ox,H); gCtx.stroke();

    // Tick labels
    gCtx.fillStyle = dark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.5)';
    gCtx.font = `${Math.max(9, Math.min(11, sc*0.2))}px 'Google Sans Code',monospace`;
    gCtx.textAlign = 'center';
    const x0 = Math.ceil(-ox/sc), x1 = Math.floor((W-ox)/sc);
    for (let n = x0; n <= x1; n++) {
        if (!n) continue;
        const px = ox + n*sc;
        gCtx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
        gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(px, oy-4); gCtx.lineTo(px, oy+4); gCtx.stroke();
        if (sc > 18) gCtx.fillText(n, px, oy+15);
    }
    gCtx.textAlign = 'right';
    const y0 = Math.ceil((oy-H)/sc), y1 = Math.floor(oy/sc);
    for (let n = y0; n <= y1; n++) {
        if (!n) continue;
        const py = oy - n*sc;
        gCtx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
        gCtx.lineWidth = 1;
        gCtx.beginPath(); gCtx.moveTo(ox-4,py); gCtx.lineTo(ox+4,py); gCtx.stroke();
        if (sc > 18) gCtx.fillText(n, ox-7, py+4);
    }

    // Plot functions
    ['fn1','fn2','fn3'].forEach((id, idx) => {
        const expr = document.getElementById(id)?.value.trim();
        if (!expr) return;
        let fn;
        try { safeMathEval(expr, 0); fn = x => safeMathEval(expr, x); }
        catch(e) {
            gCtx.fillStyle = COLORS[idx]; gCtx.font = '11px monospace'; gCtx.textAlign = 'left';
            gCtx.fillText(`f${idx+1}: ${e.message}`, 8, 16 + idx*16);
            return;
        }
        gCtx.strokeStyle = COLORS[idx]; gCtx.lineWidth = 2.4; gCtx.lineJoin = 'round';
        gCtx.shadowColor = COLORS[idx]; gCtx.shadowBlur = 5;
        gCtx.beginPath();
        let first = true, prevPy = 0;
        for (let px = 0; px < W; px++) {
            const x = (px - ox) / sc;
            try {
                const y = fn(x);
                if (!isFinite(y) || isNaN(y)) { first = true; continue; }
                const py = oy - y * sc;
                if (!first && Math.abs(py - prevPy) > H * 1.8) first = true;
                if (first) { gCtx.moveTo(px, py); first = false; }
                else       { gCtx.lineTo(px, py); }
                prevPy = py;
            } catch { first = true; }
        }
        gCtx.stroke(); gCtx.shadowBlur = 0;
    });
}

/* ════════════════════════════════════════════════════════════
   CALCULATORS (12 modules)
════════════════════════════════════════════════════════════ */

/* helper — generic tab switcher */
function switchTab(panels, id, btn) {
    panels.forEach(p => { const el = document.getElementById(p); if(el) el.classList.remove('on'); });
    document.getElementById(id)?.classList.add('on');
    btn?.closest('.tab-row')?.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
    btn?.classList.add('on');
}

/* 1 — Quadratic */
function calcQuad() {
    const a = parseFloat(document.getElementById('qa').value);
    const b = parseFloat(document.getElementById('qb').value);
    const c = parseFloat(document.getElementById('qc').value);
    const res = document.getElementById('quadRes');
    if (!res) return;
    if ([a,b,c].some(isNaN)) { res.style.color='var(--muted)'; res.textContent='Oczekiwanie na parametry…'; return; }
    if (a === 0) { res.innerHTML='<span style="color:var(--red)">Współczynnik a ≠ 0 dla paraboli.</span>'; return; }
    const D = b*b - 4*a*c, p = -b/(2*a), q = -D/(4*a);
    let html = `<div style="color:var(--red);font-size:1.5rem;font-family:var(--font-display);font-weight:800;margin-bottom:7px">Δ = ${D.toFixed(4)}</div>`;
    html += `<div style="margin-bottom:5px;color:var(--muted-hi)">W(${p.toFixed(4)}, ${q.toFixed(4)}) &nbsp;|&nbsp; oś: x = ${p.toFixed(4)}</div>`;
    if      (D > 0) html += `<div style="color:var(--text)">x₁ = ${((-b-Math.sqrt(D))/(2*a)).toFixed(4)} &nbsp;&nbsp; x₂ = ${((-b+Math.sqrt(D))/(2*a)).toFixed(4)}</div>`;
    else if (D === 0) html += `<div style="color:var(--text)">x₀ = ${p.toFixed(4)} (podwójny)</div>`;
    else              html += `<div style="color:var(--muted)">Brak pierwiastków rzeczywistych (Δ &lt; 0)</div>`;
    html += `<div style="margin-top:9px;display:flex;gap:7px;flex-wrap:wrap">
        <button class="copy-btn" id="quad-copy-btn"><i data-lucide="copy"></i> Kopiuj Δ</button>
        <button class="btn btn-sm" id="quad-pdf-btn"><i data-lucide="download"></i> PDF</button>
    </div>`;
    res.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    // Attach handlers after render
    document.getElementById('quad-copy-btn')?.addEventListener('click', function() { copyToClipboard(`Δ=${D.toFixed(4)}, W(${p.toFixed(4)},${q.toFixed(4)})`, this); });
    document.getElementById('quad-pdf-btn')?.addEventListener('click', () => exportPDF('Funkcja Kwadratowa', [
        `f(x) = ${a}x² ${b>=0?'+':''}${b}x ${c>=0?'+':''}${c}`, '',
        `Wyróżnik:    Δ = ${D.toFixed(6)}`,
        `Wierzchołek: W(${p.toFixed(4)}, ${q.toFixed(4)})`,
        `Oś symetrii: x = ${p.toFixed(4)}`,
        D > 0 ? `x₁ = ${((-b-Math.sqrt(D))/(2*a)).toFixed(4)}, x₂ = ${((-b+Math.sqrt(D))/(2*a)).toFixed(4)}` : D===0 ? `x₀ = ${p.toFixed(4)}` : 'Brak pierwiastków',
    ]));
    addHistory(`Δ(${a}x²+${b}x+${c})`, `Δ=${D.toFixed(2)}`);
    incrementStat('calcs');
}

/* 2 — Linear system 2×2 (Cramer) */
function calcSystem() {
    const g = id => parseFloat(document.getElementById(id).value);
    const [a1,b1,c1,a2,b2,c2] = ['s_a1','s_b1','s_c1','s_a2','s_b2','s_c2'].map(g);
    const res = document.getElementById('sysRes');
    if (!res) return;
    if ([a1,b1,c1,a2,b2,c2].some(isNaN)) { res.style.color='var(--muted)'; res.textContent='Podaj wszystkie współczynniki.'; return; }
    const D = a1*b2 - a2*b1;
    if (D === 0) { res.innerHTML='<span style="color:var(--yellow)">Wyznacznik = 0 — układ sprzeczny lub nieokreślony.</span>'; return; }
    const x = (c1*b2-c2*b1)/D, y = (a1*c2-a2*c1)/D;
    res.innerHTML = `<div style="font-size:1.35rem;font-weight:800;color:var(--red);margin-bottom:5px">x = ${x.toFixed(4)} &nbsp;&nbsp; y = ${y.toFixed(4)}</div>
        <div style="color:var(--muted);font-size:0.78rem;margin-bottom:8px">D = ${D}</div>
        <button class="copy-btn" id="sys-copy"><i data-lucide="copy"></i> Kopiuj</button>`;
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('sys-copy')?.addEventListener('click', function() { copyToClipboard(`x=${x.toFixed(4)}, y=${y.toFixed(4)}`, this); });
    addHistory(`Cramer a₁=${a1},b₁=${b1}`, `x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
    incrementStat('calcs');
}

/* 3 — Trigonometry */
function switchTrig(id, btn) { switchTab(['trig-fn','trig-tri'], 'trig-'+id, btn); }
function calcTrig() {
    let val = parseFloat(document.getElementById('trigVal').value);
    if (isNaN(val)) return;
    if (document.getElementById('trigUnit').value === '°') val *= Math.PI/180;
    const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent = isFinite(v) ? v.toFixed(6) : '—'; };
    set('tr-sin', Math.sin(val)); set('tr-cos', Math.cos(val));
    set('tr-tan', Math.abs(Math.cos(val)) < 1e-10 ? NaN : Math.tan(val));
    set('tr-cot', Math.abs(Math.sin(val)) < 1e-10 ? NaN : 1/Math.tan(val));
    incrementStat('calcs');
}
function calcTriangle() {
    const ang = parseFloat(document.getElementById('tri-angle').value);
    const hyp = parseFloat(document.getElementById('tri-hyp').value);
    const errEl = document.getElementById('trig-err');
    const e1 = sanityCheck(ang, { min:0.01, max:89.99, label:'Kąt α' });
    const e2 = sanityCheck(hyp, { min:0.001, label:'Przeciwprostokątna' });
    if (e1||e2) {
        if(errEl) { errEl.textContent = e1||e2; errEl.style.display='block'; }
        if(isNaN(ang)||e1) shakeInput(document.getElementById('tri-angle'));
        if(isNaN(hyp)||e2) shakeInput(document.getElementById('tri-hyp'));
        return;
    }
    if(errEl) errEl.style.display='none';
    const a = ang*Math.PI/180, sA = hyp*Math.sin(a), sB = hyp*Math.cos(a);
    document.getElementById('tri-a').textContent = sA.toFixed(4) + ' (naprzeciwko α)';
    document.getElementById('tri-b').textContent = sB.toFixed(4);
    document.getElementById('tri-p').textContent = (0.5*sA*sB).toFixed(4);
    incrementStat('calcs');
}

/* 4 — NWD/NWW/Prime */
function switchNwd(id, btn) { switchTab(['nwd-panel','prime-panel'], id+'-panel', btn); }
function gcd(a,b) { return b===0 ? a : gcd(b,a%b); }
function calcNwd() {
    let a = Math.abs(parseInt(document.getElementById('na').value));
    let b = Math.abs(parseInt(document.getElementById('nb').value));
    if (!a||!b) { ['r-nwd','r-nww'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='—'; }); return; }
    const err = sanityCheck(a,{min:1,max:1e9,integer:true,label:'A'}) || sanityCheck(b,{min:1,max:1e9,integer:true,label:'B'});
    if (err) { showSnackbar(err); return; }
    const d = gcd(a,b);
    document.getElementById('r-nwd').textContent = d;
    document.getElementById('r-nww').textContent = (a*b)/d;
    addHistory(`NWD(${a},${b})`, `${d} / NWW=${(a*b)/d}`);
    incrementStat('calcs');
}
function calcPrime() {
    let n = parseInt(document.getElementById('primeN').value);
    const res = document.getElementById('primeRes');
    if (!res) return;
    const err = sanityCheck(n,{min:2,max:999999,integer:true,label:'Liczba'});
    if (err) { res.textContent=err; return; }
    const orig=n; const factors={};
    for (let d=2; d*d<=n; d++) { while(n%d===0) { factors[d]=(factors[d]||0)+1; n/=d; } }
    if (n>1) factors[n]=(factors[n]||0)+1;
    const parts = Object.entries(factors).map(([p,e])=>e>1?`${p}^${e}`:p).join(' × ');
    const isPrime = Object.keys(factors).length===1 && Object.values(factors)[0]===1;
    res.innerHTML = `<div style="color:var(--text);font-size:1.05rem;margin-bottom:5px">${orig} = ${parts}</div>
        <div style="color:var(--muted);font-size:0.78rem">${isPrime ? '✓ Liczba pierwsza' : 'Czynniki: '+Object.keys(factors).join(', ')}</div>`;
    incrementStat('calcs');
}

/* 5 — Statistics */
function calcStats() {
    const v = document.getElementById('statIn').value.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
    document.getElementById('s-n').textContent = v.length;
    if (!v.length) { ['s-mean','s-med','s-mode','s-std','s-range'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='—'; }); return; }
    const mean = v.reduce((a,b)=>a+b,0)/v.length;
    document.getElementById('s-mean').textContent = mean.toFixed(4);
    const sorted = [...v].sort((a,b)=>a-b), mid = Math.floor(sorted.length/2);
    document.getElementById('s-med').textContent = sorted.length%2 ? sorted[mid].toFixed(4) : ((sorted[mid-1]+sorted[mid])/2).toFixed(4);
    const freq={}; v.forEach(x=>freq[x]=(freq[x]||0)+1);
    const maxF = Math.max(...Object.values(freq));
    document.getElementById('s-mode').textContent = maxF>1 ? Object.entries(freq).filter(([,f])=>f===maxF).map(([v])=>v).join(', ') : 'brak';
    const variance = v.length>1 ? v.reduce((s,x)=>s+(x-mean)**2,0)/(v.length-1) : 0;
    document.getElementById('s-std').textContent   = Math.sqrt(variance).toFixed(4);
    document.getElementById('s-range').textContent = (sorted[sorted.length-1]-sorted[0]).toFixed(4);
    addHistory(`Statystyki n=${v.length}`, `x̄=${mean.toFixed(3)}`);
    incrementStat('calcs');
}

/* 6 — Number systems */
function decToRoman(n) {
    if(n<=0||n>=4000) return 'ERR';
    const l={M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let r=''; for(const k in l){while(n>=l[k]){r+=k;n-=l[k];}} return r;
}
function romanToDec(s) {
    const m={I:1,V:5,X:10,L:50,C:100,D:500,M:1000}; let n=0;
    for(let i=0;i<s.length;i++){const v1=m[s[i]],v2=m[s[i+1]]; if(v2>v1){n+=v2-v1;i++;}else n+=v1;} return n;
}
function convSys(from) {
    const val = document.getElementById('s-'+from)?.value.trim(); if(!val) return;
    try {
        let d;
        if(from==='dec') d=parseInt(val,10);
        else if(from==='bin') d=parseInt(val,2);
        else if(from==='oct') d=parseInt(val,8);
        else if(from==='hex') d=parseInt(val,16);
        else if(from==='rom') d=romanToDec(val.toUpperCase());
        const err=sanityCheck(d,{min:0,max:2147483647,label:'Liczba'});
        if(err||isNaN(d)){showSnackbar(err||'Nieprawidłowa wartość');return;}
        if(from!=='dec') document.getElementById('s-dec').value=d;
        if(from!=='bin') document.getElementById('s-bin').value=d.toString(2);
        if(from!=='oct') document.getElementById('s-oct').value=d.toString(8);
        if(from!=='hex') document.getElementById('s-hex').value=d.toString(16).toUpperCase();
        if(from!=='rom') document.getElementById('s-rom').value=decToRoman(d);
        incrementStat('calcs');
    } catch(e) { showSnackbar('Błąd: '+e.message); }
}

/* 7 — Physics */
function switchPhys(id,btn) { switchTab(['p-newton','p-kinem'], 'p-'+id, btn); }
function calcNewton() {
    const m=parseFloat(document.getElementById('ph-m').value), a=parseFloat(document.getElementById('ph-a').value);
    const res=document.getElementById('ph-res'); if(!res) return;
    const err = !isNaN(m) ? sanityCheck(m,{min:0,label:'Masa m'}) : null;
    if(err){showSnackbar(err); shakeInput(document.getElementById('ph-m')); return;}
    res.textContent = (!isNaN(m)&&!isNaN(a)) ? `${(m*a).toFixed(4)} N` : '0.00 N';
    if(!isNaN(m)&&!isNaN(a)) { addHistory(`F=ma (${m}×${a})`, `${(m*a).toFixed(3)} N`); incrementStat('calcs'); }
}
function calcKinem() {
    const v0=parseFloat(document.getElementById('k-v0').value);
    const a =parseFloat(document.getElementById('k-a').value);
    const t =parseFloat(document.getElementById('k-t').value);
    const err = !isNaN(t) ? sanityCheck(t,{min:0,label:'Czas t'}) : null;
    if(err){ showSnackbar(err); shakeInput(document.getElementById('k-t')); return; }
    if([v0,a,t].some(isNaN)) return;
    document.getElementById('k-v').textContent = (v0+a*t).toFixed(4)+' m/s';
    document.getElementById('k-s').textContent = (v0*t+0.5*a*t*t).toFixed(4)+' m';
    incrementStat('calcs');
}

/* 8 — Finance */
function switchFin(id,btn) { switchTab(['f-cap','f-loan'], 'f-'+id, btn); }
function calcFin() {
    const k=parseFloat(document.getElementById('fk').value);
    const p=parseFloat(document.getElementById('fp').value);
    const n=parseFloat(document.getElementById('fn2').value);
    if([k,p,n].some(isNaN)) return;
    const err = sanityCheck(k,{min:0,label:'Kapitał'}) || sanityCheck(p,{min:0,max:100,label:'Stopa %'}) || sanityCheck(n,{min:0,max:100,label:'Lata'});
    if(err){ showSnackbar(err); return; }
    const total = k*Math.pow(1+p/100,n);
    document.getElementById('f-total').textContent = total.toFixed(2)+' PLN';
    document.getElementById('f-profit').textContent = (total-k).toFixed(2)+' PLN';
    addHistory(`K=${k}, r=${p}%, n=${n}l`, `${total.toFixed(0)} PLN`);
    incrementStat('calcs');
}
function calcLoan() {
    const P=parseFloat(document.getElementById('l-P').value);
    const rA=parseFloat(document.getElementById('l-r').value);
    const n=parseFloat(document.getElementById('l-n').value);
    if([P,rA,n].some(isNaN)) return;
    const err = sanityCheck(P,{min:1,label:'Kwota'}) || sanityCheck(rA,{min:0.01,max:100,label:'Stopa'}) || sanityCheck(n,{min:1,max:600,integer:true,label:'Raty'});
    if(err){ showSnackbar(err); return; }
    const r=rA/100/12, rate = P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    document.getElementById('l-rate').textContent = rate.toFixed(2)+' PLN';
    document.getElementById('l-total').textContent = (rate*n).toFixed(2)+' PLN';
    incrementStat('calcs');
}

/* 9 — Unit converters */
function convDist(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const m=f==='m'?v:f==='km'?v*1e3:f==='cm'?v/100:v*0.0254;if(f!=='km')document.getElementById('u-km').value=(m/1e3).toFixed(6);if(f!=='m')document.getElementById('u-m').value=m.toFixed(6);if(f!=='cm')document.getElementById('u-cm').value=(m*100).toFixed(4);if(f!=='in')document.getElementById('u-in').value=(m*39.3701).toFixed(4);}
function convMass(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const kg=f==='kg'?v:f==='g'?v/1e3:v*0.453592;if(f!=='kg')document.getElementById('u-kg').value=kg.toFixed(6);if(f!=='g')document.getElementById('u-g').value=(kg*1e3).toFixed(4);if(f!=='lb')document.getElementById('u-lb').value=(kg*2.20462).toFixed(4);}
function convTemp(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const c=f==='c'?v:f==='f'?(v-32)*5/9:v-273.15;const err=f==='k'?sanityCheck(v,{min:0,label:'Temperatura (K)'}):null;if(err){showSnackbar(err);return;}if(f!=='c')document.getElementById('u-c').value=c.toFixed(4);if(f!=='f')document.getElementById('u-f').value=(c*9/5+32).toFixed(4);if(f!=='k')document.getElementById('u-k').value=(c+273.15).toFixed(4);}
function convData(f){const v=parseFloat(document.getElementById('u-'+f).value);if(isNaN(v))return;const mb=f==='mb'?v:f==='gb'?v*1024:v*1048576;if(f!=='mb')document.getElementById('u-mb').value=mb.toFixed(2);if(f!=='gb')document.getElementById('u-gb').value=(mb/1024).toFixed(6);if(f!=='tb')document.getElementById('u-tb').value=(mb/1048576).toFixed(9);}

/* 10 — Geometry */
function switchGeo(id,btn) {
    document.querySelectorAll('[id^="geo-"]').forEach(p=>p.classList.remove('on'));
    document.getElementById('geo-'+id)?.classList.add('on');
    btn?.closest('.tab-row')?.querySelectorAll('.tb-btn').forEach(b=>b.classList.remove('on'));
    btn?.classList.add('on');
}
function calcGeo(shape) {
    const g = id => parseFloat(document.getElementById(id)?.value);
    const fmt = n => (isNaN(n)||!isFinite(n)) ? '—' : n.toFixed(4);
    // Sanity check for radii
    const radiiMap = { cir:'g-cr', cyl:'g-cylr', cone:'g-conr', sph:'g-spr' };
    if (radiiMap[shape]) {
        const r = g(radiiMap[shape]);
        const err = !isNaN(r) ? sanityCheck(r,{min:0,label:'Promień r'}) : null;
        if (err) { showSnackbar(err); shakeInput(document.getElementById(radiiMap[shape])); return; }
    }
    if      (shape==='tri')  { document.getElementById('geo-tri-p').textContent=fmt(0.5*g('g-ta')*g('g-th')); document.getElementById('geo-tri-o').textContent=isNaN(g('g-tc'))?'(podaj bok c)':fmt(g('g-ta')+2*g('g-tc')); }
    else if (shape==='cir')  { const r=g('g-cr'); document.getElementById('geo-cir-p').textContent=fmt(Math.PI*r*r); document.getElementById('geo-cir-c').textContent=fmt(2*Math.PI*r); }
    else if (shape==='cyl')  { const r=g('g-cylr'),h=g('g-cylh'); document.getElementById('geo-cyl-v').textContent=fmt(Math.PI*r*r*h); document.getElementById('geo-cyl-pc').textContent=fmt(2*Math.PI*r*(r+h)); }
    else if (shape==='cone') { const r=g('g-conr'),h=g('g-conh'),l=Math.sqrt(r*r+h*h); document.getElementById('geo-cone-v').textContent=fmt(Math.PI*r*r*h/3); document.getElementById('geo-cone-l').textContent=fmt(l); document.getElementById('geo-cone-pc').textContent=fmt(Math.PI*r*(r+l)); }
    else if (shape==='sph')  { const r=g('g-spr'); document.getElementById('geo-sph-v').textContent=fmt(4/3*Math.PI*r*r*r); document.getElementById('geo-sph-pc').textContent=fmt(4*Math.PI*r*r); }
    incrementStat('calcs');
}

/* 11 — Desmos */
function switchDesmos(mode, btn) {
    _desmosMode = mode;
    btn?.closest('.tab-row')?.querySelectorAll('.tb-btn').forEach(b=>b.classList.remove('on'));
    btn?.classList.add('on');
    if (window._desmosCalc) { window._desmosCalc.destroy(); window._desmosCalc = null; }
    initDesmosMode(mode);
}
function initDesmosMode(mode) {
    const elt = document.getElementById('desmosEl');
    if (!elt || typeof Desmos === 'undefined') return;
    if (window._desmosCalc) { window._desmosCalc.destroy(); window._desmosCalc = null; }
    const opts = { keypad:true, expressions:true, settingsMenu:true, zoomButtons:true };
    if      (mode==='graph') window._desmosCalc = Desmos.GraphingCalculator(elt, opts);
    else if (mode==='sci')   window._desmosCalc = Desmos.ScientificCalculator(elt, opts);
    else if (mode==='geo')   window._desmosCalc = Desmos.Geometry(elt, opts);
}

/* Called by Cloudflare Turnstile widget on success */
function onTurnstileSuccess(token) {
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    })
    .then(r => r.json())
    .then(data => {
        if (!data.desmosKey) { showSnackbar('⚠ ' + (data.error||'Weryfikacja nieudana')); return; }
        document.getElementById('security-wrapper')?.remove();
        const s = document.createElement('script');
        s.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(data.desmosKey)}`;
        s.onload = () => { document.getElementById('desmosEl').style.display='block'; initDesmosMode(_desmosMode); };
        s.onerror = () => showSnackbar('⚠ Nie udało się załadować Desmos');
        document.head.appendChild(s);
    })
    .catch(() => showSnackbar('⚠ Błąd sieci — spróbuj ponownie'));
}

/* 12 — Unit converter helpers (already above) */

/* ════════════════════════════════════════════════════════════
   SHA-256 ANSWER HASHING
════════════════════════════════════════════════════════════ */
async function hashAnswer(val) {
    const data = SALT + String(Math.round(val * 100));
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* ════════════════════════════════════════════════════════════
   TASK DATA — 150 tasks (50 easy / 60 medium / 40 hard)
════════════════════════════════════════════════════════════ */
const R   = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const TASKS = [];

/* Easy 50 */
for(let i=0;i<20;i++){const a=R(2,9),b=R(1,25),x=R(1,20);TASKS.push({diff:'easy',cat:'algebra',q:`Wyznacz x: <code>${a}x + ${b} = ${a*x+b}</code>`,ans:x,hint:`Odejmij ${b}, podziel przez ${a}.`});}
for(let i=0;i<15;i++){const p=R(1,9)*10,n=R(2,20)*10;TASKS.push({diff:'easy',cat:'procenty',q:`Oblicz: <code>${p}% z ${n}</code>`,ans:(p/100)*n,hint:`${p}/100 × ${n}.`});}
for(let i=0;i<10;i++){const a=R(2,15),b=R(2,15);TASKS.push({diff:'easy',cat:'geometria',q:`Pole prostokąta: <code>a=${a}, b=${b}</code>`,ans:a*b,hint:`P = a × b.`});}
for(let i=0;i<5;i++){const a1=R(1,10),r=R(1,6);TASKS.push({diff:'easy',cat:'ciagi',q:`Następny wyraz: <code>${a1}, ${a1+r}, ${a1+2*r}, ${a1+3*r}, ?</code>`,ans:a1+4*r,hint:`Ciąg arytm., r=${r}.`});}
/* Medium 60 */
for(let i=0;i<15;i++){const b=R(2,8),c=R(-6,6)||1;TASKS.push({diff:'medium',cat:'delta',q:`Wyróżnik Δ: <code>y = x² + ${b}x ${c>0?'+':''} ${c}</code>`,ans:b*b-4*c,hint:`Δ=b²−4ac, a=1, b=${b}, c=${c}.`});}
for(let i=0;i<10;i++){const x1=R(1,8),x2=R(-8,0),b=-(x1+x2),c=x1*x2;TASKS.push({diff:'medium',cat:'delta',q:`Większy pierwiastek: <code>x² ${b>=0?'+'+b:b}x ${c>=0?'+'+c:c} = 0</code>`,ans:Math.max(x1,x2),hint:`Δ=b²−4ac, x=(−b+√Δ)/2.`});}
for(let i=0;i<10;i++){const r=R(2,12);TASKS.push({diff:'medium',cat:'geometria',q:`Pole koła (2 dec.): <code>r=${r}</code>`,ans:parseFloat((Math.PI*r*r).toFixed(2)),hint:`P=πr².`});}
for(let i=0;i<10;i++){const a1=R(1,5),r=R(1,4),n=R(5,12),an=a1+(n-1)*r;TASKS.push({diff:'medium',cat:'ciagi',q:`Suma ${n} wyrazów arytm.: <code>a₁=${a1}, r=${r}</code>`,ans:(a1+an)*n/2,hint:`Sₙ=(a₁+aₙ)·n/2.`});}
for(let i=0;i<8;i++){const n=R(4,10);TASKS.push({diff:'medium',cat:'logika',q:`Ile 2-elem. podzbiorów z ${n}-elem. zbioru?`,ans:n*(n-1)/2,hint:`C(n,2)=n(n−1)/2.`});}
for(let i=0;i<7;i++){const a1=R(1,4),q=R(2,3),n=R(4,6);TASKS.push({diff:'medium',cat:'ciagi',q:`${n}-ty wyraz geom.: <code>a₁=${a1}, q=${q}</code>`,ans:a1*Math.pow(q,n-1),hint:`aₙ=a₁·qⁿ⁻¹.`});}
/* Hard 40 */
[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]].forEach(([a,b,c])=>TASKS.push({diff:'hard',cat:'geometria',q:`Trójkąt prostokątny a=${a}, b=${b}. Oblicz c.`,ans:c,hint:`c=√(a²+b²).`}));
[[2,.5,4],[3,.25,4],[6,.5,12]].forEach(([a1,q,ans])=>TASKS.push({diff:'hard',cat:'ciagi',q:`Suma nieskończona: <code>a₁=${a1}, q=${q}</code>`,ans,hint:`S∞=a₁/(1−q).`}));
for(let i=0;i<6;i++){const r=R(2,6),h=R(3,9);TASKS.push({diff:'hard',cat:'geometria',q:`Objętość stożka (2 dec.): <code>r=${r}, h=${h}</code>`,ans:parseFloat((Math.PI*r*r*h/3).toFixed(2)),hint:`V=⅓πr²h.`});}
[[2,32,5],[3,81,4],[2,64,6],[5,125,3]].forEach(([b,a,ans])=>TASKS.push({diff:'hard',cat:'algebra',q:`log<sub>${b}</sub>(${a}) = ?`,ans,hint:`${b}^x=${a}.`}));
[[5,2,20],[6,2,30],[4,3,24]].forEach(([n,k,ans])=>TASKS.push({diff:'hard',cat:'logika',q:`V(${n},${k}) = ${n}!/(${n}−${k})!`,ans,hint:`V=${n}×${n-1}.`}));
while(TASKS.length<150){
    const t=['algebra','delta','procenty','ciagi','geometria'][TASKS.length%5];
    if(t==='algebra'){const a=R(3,7),b=R(5,30),x=R(2,18);TASKS.push({diff:'medium',cat:'algebra',q:`x: <code>${a}x−${b}=${a*x-b}</code>`,ans:x,hint:`Dodaj ${b}, podziel przez ${a}.`});}
    else if(t==='delta'){const b=R(3,9),c=R(1,8);TASKS.push({diff:'medium',cat:'delta',q:`Δ: <code>2x²+${b}x+${c}</code>`,ans:b*b-8*c,hint:`Δ=b²−4·2·${c}.`});}
    else if(t==='procenty'){const base=R(100,500),pct=R(1,4)*5;TASKS.push({diff:'easy',cat:'procenty',q:`${pct}% z ${base}`,ans:(pct/100)*base,hint:`${pct}/100×${base}.`});}
    else if(t==='ciagi'){const a1=R(2,8),r=R(2,5);TASKS.push({diff:'easy',cat:'ciagi',q:`5-ty wyraz: <code>${a1},${a1+r},${a1+2*r},…</code>`,ans:a1+4*r,hint:`aₙ=a₁+(n−1)r.`});}
    else{const a=R(3,12),h=R(4,15);TASKS.push({diff:'easy',cat:'geometria',q:`Pole trójkąta: a=${a}, h=${h}`,ans:.5*a*h,hint:`P=½·a·h.`});}
}

/* ════════════════════════════════════════════════════════════
   TASK RENDERING & VERIFICATION
════════════════════════════════════════════════════════════ */
async function buildTasks() {
    const grid = document.getElementById('taskGrid');
    if (!grid) return;

    // Build all cards using DocumentFragment for performance
    const frag = document.createDocumentFragment();
    const diffLabel = { easy:'🟢 Łatwe', medium:'🟡 Średnie', hard:'🔴 Trudne' };

    for (let i = 0; i < TASKS.length; i++) {
        const t = TASKS[i];
        const hash = await hashAnswer(t.ans);

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.diff = t.diff;
        card.dataset.cat  = t.cat;
        // Safely encode hint for data attribute
        const safeHint = t.hint.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        card.innerHTML = `
            <div class="card-border"></div>
            <div class="ci">
                <div class="task-badge ${t.diff}">${diffLabel[t.diff]} &nbsp;·&nbsp; ${t.cat.toUpperCase()}</div>
                <div style="margin-bottom:16px;flex-grow:1;font-size:0.97rem;color:var(--muted-hi);line-height:1.75">#${i+1} — ${t.q}</div>
                <input type="number" class="ti"
                    placeholder="Twoja odpowiedź…"
                    autocomplete="off"
                    data-hash="${hash}"
                    data-attempts="0"
                    data-hint="${safeHint}">
                <div class="hint-box" id="hint-${i}"></div>
            </div>`;

        // attach event listener — never inline onclick
        const input = card.querySelector('.ti');
        input.addEventListener('change', () => checkAnswer(input));

        frag.appendChild(card);

        // Yield to browser every 15 tasks to keep page responsive
        if (i % 15 === 14) await new Promise(r => setTimeout(r, 0));
    }

    grid.innerHTML = '';
    grid.appendChild(frag);
    if (window.lucide) window.lucide.createIcons();
    applyFilter(activeFilter, null);
    updateScore();
}

async function checkAnswer(input) {
    if (input.disabled) return;
    const val = parseFloat(input.value);
    if (isNaN(val)) { input.className = 'ti'; return; }
    const guessHash = await hashAnswer(val);
    if (guessHash === input.dataset.hash) {
        input.className = 'ti ok'; input.disabled = true;
        score += 10; solved++;
        safeSet('zymath_score', score);
        safeSet('zymath_solved', solved);
        updateScore();
        spawnConfetti(input);
        incrementStat('solved');
    } else {
        input.className = 'ti bad';
        shakeInput(input);
        const attempts = parseInt(input.dataset.attempts||'0') + 1;
        input.dataset.attempts = attempts;
        if (attempts >= 3) {
            const hintEl = input.closest('.ci').querySelector('.hint-box');
            if (hintEl) { hintEl.textContent = '💡 ' + input.dataset.hint; hintEl.classList.add('show'); }
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
        const show = filter==='all' || card.dataset.diff===filter || card.dataset.cat===filter;
        card.style.display = show ? 'flex' : 'none';
    });
}

/* ════════════════════════════════════════════════════════════
   CONFETTI — GPU-accelerated (transform instead of left/top)
════════════════════════════════════════════════════════════ */
function spawnConfetti(anchor) {
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const colors = ['#ff003c','#ffffff','#00d4ff','#fbbf24','#10b981'];

    for (let i = 0; i < 26; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-p';
        const size = Math.random()*7 + 4;
        el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[i%5]};transform:translate(0,0);`;
        document.body.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const spd   = Math.random() * 150 + 60;
        let vx = Math.cos(angle)*spd, vy = Math.sin(angle)*spd - 185;
        let x = 0, y = 0, last = performance.now(), elapsed = 0;

        (function frame(now) {
            const dt = Math.min((now-last)/1000, 0.05);
            last = now; elapsed += dt*1000;
            if (elapsed >= 1300) { el.remove(); return; }
            vy += 520*dt; x += vx*dt; y += vy*dt;
            el.style.transform = `translate(${x}px,${y}px)`;
            el.style.opacity = String(1 - elapsed/1300);
            requestAnimationFrame(frame);
        })(performance.now());
    }
}

/* ════════════════════════════════════════════════════════════
   DOODLE SYMBOLS
════════════════════════════════════════════════════════════ */
function initDoodle() {
    const symbols = '∑∫∂√π∞∆Ωλθφσαβγδεμξ≈≠≤≥→↔∈∩∪∀∃∅'.split('');
    const container = document.getElementById('doodle');
    if (!container) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'dk';
        el.textContent = symbols[Math.floor(Math.random()*symbols.length)];
        el.style.cssText = `left:${Math.random()*100}%;font-size:${Math.random()*18+9}px;animation-duration:${Math.random()*18+11}s;animation-delay:-${Math.random()*18}s`;
        frag.appendChild(el);
    }
    container.appendChild(frag);
}

/* ════════════════════════════════════════════════════════════
   PWA — Service Worker + Install Prompt
════════════════════════════════════════════════════════════ */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope:'/' })
            .then(r => console.log('[SW] scope:', r.scope))
            .catch(e => console.warn('[SW] failed:', e.message));
    }
}

function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        _deferredInstall = e;
        document.getElementById('pwa-banner')?.classList.add('show');
    });
    window.addEventListener('appinstalled', () => {
        document.getElementById('pwa-banner')?.classList.remove('show');
        showSnackbar('✅ Zymath zainstalowany!');
    });
}

function installPWA() {
    if (!_deferredInstall) { showSnackbar('⚠ Instalacja niedostępna w tej przeglądarce'); return; }
    _deferredInstall.prompt();
    _deferredInstall.userChoice.then(c => {
        if (c.outcome === 'accepted') showSnackbar('🚀 Instalacja zakończona!');
        _deferredInstall = null;
        document.getElementById('pwa-banner')?.classList.remove('show');
    });
}
function dismissPWA() { document.getElementById('pwa-banner')?.classList.remove('show'); }

/* Zymath Singularity v4 | (c) 2026 5Simoon | GNU GPL v3 */
