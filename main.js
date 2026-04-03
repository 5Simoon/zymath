// ============================================================================
// ZYMATH SINGULARITY V4.0 - MAIN.JS
// UI Logic, State Management, Graph Engine, Calculators, Tasks System
// Author: 5Simoon | License: GNU GPL v3
// ============================================================================

// Global State
const STATE = {
    currentSection: 'home',
    currentCalculator: 'graph',
    userLevel: 1,
    userExp: 0,
    tasks: [],
    completedTasks: new Set(),
    graphCanvas: null,
    graphCtx: null,
    desmosCalculator: null,
    graphState: {
        centerX: 0,
        centerY: 0,
        scale: 40,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    }
};

// ============================================================================
// NAVIGATION & SECTIONS
// ============================================================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    STATE.currentSection = sectionName;
    
    // Initialize section-specific features
    if (sectionName === 'calculator' && STATE.currentCalculator === 'graph') {
        setTimeout(() => initGraphCanvas(), 100);
    } else if (sectionName === 'calculator' && STATE.currentCalculator === 'desmos') {
        setTimeout(() => initDesmos(), 100);
    } else if (sectionName === 'tasks' && STATE.tasks.length === 0) {
        build150Tasks();
        renderTasks();
    }
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

function toggleKnowledge(card) {
    const content = card.querySelector('.knowledge-content');
    const icon = card.querySelector('[data-lucide="chevron-down"]');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
    
    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typeset([content]);
    }
}

// ============================================================================
// CALCULATOR SWITCHING
// ============================================================================

function showCalculator(calcName) {
    // Hide all calculator panels
    document.querySelectorAll('.calc-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show selected panel
    const targetPanel = document.getElementById(`calc-${calcName}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    // Update tabs
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-calc="${calcName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    STATE.currentCalculator = calcName;
    
    // Initialize calculator if needed
    if (calcName === 'graph') {
        setTimeout(() => initGraphCanvas(), 100);
    } else if (calcName === 'desmos') {
        setTimeout(() => initDesmos(), 100);
    }
}

// ============================================================================
// GRAPH ENGINE 3.1
// ============================================================================

function initGraphCanvas() {
    if (STATE.graphCanvas) return; // Already initialized
    
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    STATE.graphCanvas = canvas;
    STATE.graphCtx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // Retina display
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    
    // Mouse events for pan & zoom
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
    canvas.addEventListener('wheel', zoom);
    canvas.addEventListener('dblclick', resetView);
    
    drawGraph();
}

function startDrag(e) {
    STATE.graphState.isDragging = true;
    STATE.graphState.dragStart = {
        x: e.offsetX,
        y: e.offsetY
    };
}

function drag(e) {
    if (!STATE.graphState.isDragging) return;
    
    const dx = e.offsetX - STATE.graphState.dragStart.x;
    const dy = e.offsetY - STATE.graphState.dragStart.y;
    
    STATE.graphState.centerX -= dx / STATE.graphState.scale;
    STATE.graphState.centerY += dy / STATE.graphState.scale;
    
    STATE.graphState.dragStart = {
        x: e.offsetX,
        y: e.offsetY
    };
    
    drawGraph();
}

function endDrag() {
    STATE.graphState.isDragging = false;
}

function zoom(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    STATE.graphState.scale *= delta;
    STATE.graphState.scale = Math.max(5, Math.min(STATE.graphState.scale, 200));
    drawGraph();
}

function resetView() {
    STATE.graphState.centerX = 0;
    STATE.graphState.centerY = 0;
    STATE.graphState.scale = 40;
    drawGraph();
}

function drawGraph() {
    const canvas = STATE.graphCanvas;
    const ctx = STATE.graphCtx;
    if (!canvas || !ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    const scale = STATE.graphState.scale;
    const cx = STATE.graphState.centerX;
    const cy = STATE.graphState.centerY;
    
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = 'rgba(157, 126, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridStep = 1;
    for (let i = Math.floor(cx - w / scale / 2); i <= cx + w / scale / 2; i += gridStep) {
        const x = (i - cx) * scale + w / 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    
    for (let i = Math.floor(cy - h / scale / 2); i <= cy + h / scale / 2; i += gridStep) {
        const y = (cy - i) * scale + h / 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = 'rgba(157, 126, 255, 0.3)';
    ctx.lineWidth = 2;
    
    // X-axis
    const yAxis = (cy - 0) * scale + h / 2;
    ctx.beginPath();
    ctx.moveTo(0, yAxis);
    ctx.lineTo(w, yAxis);
    ctx.stroke();
    
    // Y-axis
    const xAxis = (0 - cx) * scale + w / 2;
    ctx.beginPath();
    ctx.moveTo(xAxis, 0);
    ctx.lineTo(xAxis, h);
    ctx.stroke();
    
    // Draw functions
    drawFunction('func1', '#9D7EFF'); // Primary purple
    drawFunction('func2', '#1BD9DD'); // Accent cyan
}

function drawFunction(inputId, color) {
    const funcStr = document.getElementById(inputId)?.value;
    if (!funcStr) return;
    
    const canvas = STATE.graphCanvas;
    const ctx = STATE.graphCtx;
    const w = canvas.width;
    const h = canvas.height;
    const scale = STATE.graphState.scale;
    const cx = STATE.graphState.centerX;
    const cy = STATE.graphState.centerY;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let started = false;
    
    for (let px = 0; px < w; px += 2) {
        const x = (px - w / 2) / scale + cx;
        let y;
        
        try {
            y = evaluateFunction(funcStr, x);
            if (!isFinite(y)) continue;
        } catch (e) {
            continue;
        }
        
        const py = (cy - y) * scale + h / 2;
        
        if (!started) {
            ctx.moveTo(px, py);
            started = true;
        } else {
            ctx.lineTo(px, py);
        }
    }
    
    ctx.stroke();
}

function evaluateFunction(expr, x) {
    // Replace x with value
    let code = expr.replace(/x/g, `(${x})`);
    
    // Replace math functions
    code = code.replace(/sin/g, 'Math.sin');
    code = code.replace(/cos/g, 'Math.cos');
    code = code.replace(/tan/g, 'Math.tan');
    code = code.replace(/sqrt/g, 'Math.sqrt');
    code = code.replace(/abs/g, 'Math.abs');
    code = code.replace(/log/g, 'Math.log');
    code = code.replace(/exp/g, 'Math.exp');
    code = code.replace(/\^/g, '**');
    
    return eval(code);
}

// ============================================================================
// DESMOS INTEGRATION
// ============================================================================

function initDesmos() {
    if (STATE.desmosCalculator) return; // Already initialized
    
    const container = document.getElementById('desmos-calculator');
    if (!container || !window.Desmos) return;
    
    STATE.desmosCalculator = Desmos.GraphingCalculator(container, {
        expressionsCollapsed: true,
        settingsMenu: false,
        zoomButtons: true,
        expressions: false,
        lockViewport: false,
        keypad: true
    });
    
    // Add some example functions
    STATE.desmosCalculator.setExpression({ id: 'func1', latex: 'y=x^2', color: '#9D7EFF' });
    STATE.desmosCalculator.setExpression({ id: 'func2', latex: 'y=\\sin(x)', color: '#1BD9DD' });
}

// ============================================================================
// QUADRATIC SOLVER
// ============================================================================

function solveQuadratic() {
    const a = parseFloat(document.getElementById('quad-a').value);
    const b = parseFloat(document.getElementById('quad-b').value);
    const c = parseFloat(document.getElementById('quad-c').value);
    
    if (a === 0) {
        showResult('quad-result', 'Błąd: a nie może być zerem!', 'error');
        return;
    }
    
    const delta = b * b - 4 * a * c;
    
    let html = `
        <div class="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <strong>Równanie:</strong> $${a}x^2 + ${b}x + ${c} = 0$
        </div>
        <div class="p-4 rounded-lg bg-accent/5 border border-accent/10">
            <strong>Delta:</strong> $\\Delta = b^2 - 4ac = ${delta.toFixed(2)}$
        </div>
    `;
    
    if (delta > 0) {
        const x1 = (-b - Math.sqrt(delta)) / (2 * a);
        const x2 = (-b + Math.sqrt(delta)) / (2 * a);
        html += `
            <div class="p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                <strong>Dwa pierwiastki rzeczywiste:</strong><br>
                $x_1 = ${x1.toFixed(4)}$<br>
                $x_2 = ${x2.toFixed(4)}$
            </div>
        `;
    } else if (delta === 0) {
        const x = -b / (2 * a);
        html += `
            <div class="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                <strong>Jeden pierwiastek:</strong> $x = ${x.toFixed(4)}$
            </div>
        `;
    } else {
        const re = -b / (2 * a);
        const im = Math.sqrt(-delta) / (2 * a);
        html += `
            <div class="p-4 rounded-lg bg-pink-400/10 border border-pink-400/20">
                <strong>Brak pierwiastków rzeczywistych</strong><br>
                (Zespolone: $${re.toFixed(2)} \\pm ${im.toFixed(2)}i$)
            </div>
        `;
    }
    
    // Vertex
    const vx = -b / (2 * a);
    const vy = a * vx * vx + b * vx + c;
    html += `
        <div class="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <strong>Wierzchołek paraboli:</strong> $W = (${vx.toFixed(2)}, ${vy.toFixed(2)})$
        </div>
    `;
    
    document.getElementById('quad-result').innerHTML = html;
    
    // Render MathJax
    if (window.MathJax) {
        MathJax.typeset(['#quad-result']);
    }
}

// ============================================================================
// SYSTEM 2x2 SOLVER (CRAMER'S RULE)
// ============================================================================

function solveSystem() {
    const a1 = parseFloat(document.getElementById('sys-a1').value);
    const b1 = parseFloat(document.getElementById('sys-b1').value);
    const c1 = parseFloat(document.getElementById('sys-c1').value);
    const a2 = parseFloat(document.getElementById('sys-a2').value);
    const b2 = parseFloat(document.getElementById('sys-b2').value);
    const c2 = parseFloat(document.getElementById('sys-c2').value);
    
    // Determinants
    const W = a1 * b2 - a2 * b1;
    const Wx = c1 * b2 - c2 * b1;
    const Wy = a1 * c2 - a2 * c1;
    
    let html = `
        <div class="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <strong>Układ równań:</strong><br>
            $${a1}x + ${b1}y = ${c1}$<br>
            $${a2}x + ${b2}y = ${c2}$
        </div>
    `;
    
    if (W !== 0) {
        const x = Wx / W;
        const y = Wy / W;
        html += `
            <div class="p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                <strong>Rozwiązanie (Cramer):</strong><br>
                $W = ${W.toFixed(2)}$<br>
                $x = ${x.toFixed(4)}$<br>
                $y = ${y.toFixed(4)}$
            </div>
        `;
    } else {
        html += `
            <div class="p-4 rounded-lg bg-red-400/10 border border-red-400/20">
                <strong>Brak jednoznacznego rozwiązania</strong><br>
                (Wyznacznik $W = 0$)
            </div>
        `;
    }
    
    document.getElementById('system-result').innerHTML = html;
    
    if (window.MathJax) {
        MathJax.typeset(['#system-result']);
    }
}

// ============================================================================
// ENGINE INTERFACE
// ============================================================================

function setEngineInput(value) {
    document.getElementById('engine-input').value = value;
    document.getElementById('engine-input').focus();
}

function computeEngine() {
    const input = document.getElementById('engine-input').value.trim();
    if (!input) return;
    
    const output = document.getElementById('engine-output');
    
    // Add input to output
    output.innerHTML += `\n<div class="text-primary">$ ${input}</div>`;
    
    try {
        // Use MathEngine from engine.js
        const result = MathEngine.compute(input);
        output.innerHTML += `<div class="text-accent">${result}</div>`;
    } catch (error) {
        output.innerHTML += `<div class="text-red-400">Error: ${error.message}</div>`;
    }
    
    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
    
    // Clear input
    document.getElementById('engine-input').value = '';
}

// ============================================================================
// TASKS SYSTEM (150 TASKS)
// ============================================================================

function build150Tasks() {
    STATE.tasks = [];
    
    // EASY (50 tasks)
    for (let i = 1; i <= 50; i++) {
        STATE.tasks.push({
            id: `easy_${i}`,
            type: 'easy',
            exp: 10,
            q: generateEasyQuestion(i),
            a: null // Will be set in generateEasyQuestion
        });
    }
    
    // MEDIUM (70 tasks)
    for (let i = 1; i <= 70; i++) {
        STATE.tasks.push({
            id: `medium_${i}`,
            type: 'medium',
            exp: 25,
            q: generateMediumQuestion(i),
            a: null
        });
    }
    
    // HARD (30 tasks)
    for (let i = 1; i <= 30; i++) {
        STATE.tasks.push({
            id: `hard_${i}`,
            type: 'hard',
            exp: 50,
            q: generateHardQuestion(i),
            a: null
        });
    }
}

function generateEasyQuestion(n) {
    const types = [
        () => {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            return { q: `${a} + ${b}`, a: String(a + b) };
        },
        () => {
            const a = Math.floor(Math.random() * 50) + 10;
            const b = Math.floor(Math.random() * 10) + 1;
            return { q: `${a} - ${b}`, a: String(a - b) };
        },
        () => {
            const a = Math.floor(Math.random() * 12) + 1;
            const b = Math.floor(Math.random() * 12) + 1;
            return { q: `${a} × ${b}`, a: String(a * b) };
        },
        () => {
            const b = Math.floor(Math.random() * 9) + 2;
            const a = b * (Math.floor(Math.random() * 10) + 1);
            return { q: `${a} ÷ ${b}`, a: String(a / b) };
        },
        () => {
            const n = Math.floor(Math.random() * 100) + 1;
            return { q: `$\\sqrt{${n * n}}$`, a: String(n) };
        }
    ];
    
    const type = types[n % types.length];
    const result = type();
    STATE.tasks[STATE.tasks.length] = { ...STATE.tasks[STATE.tasks.length], ...result };
    return result.q;
}

function generateMediumQuestion(n) {
    const types = [
        () => {
            const a = Math.floor(Math.random() * 5) + 2;
            const n = Math.floor(Math.random() * 4) + 2;
            return { q: `$${a}^${n}$`, a: String(Math.pow(a, n)) };
        },
        () => {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            const c = Math.floor(Math.random() * 10) + 1;
            return { q: `$(${a} + ${b}) \\times ${c}$`, a: String((a + b) * c) };
        },
        () => {
            return { q: `$\\sin(0)$`, a: '0' };
        },
        () => {
            return { q: `$\\cos(0)$`, a: '1' };
        }
    ];
    
    const type = types[n % types.length];
    const result = type();
    STATE.tasks[STATE.tasks.findIndex(t => !t.a && t.type === 'medium')] = { ...STATE.tasks[STATE.tasks.findIndex(t => !t.a && t.type === 'medium')], ...result };
    return result.q;
}

function generateHardQuestion(n) {
    const types = [
        () => {
            return { q: `Rozwiąż: $x^2 - 5x + 6 = 0$. Podaj mniejszy pierwiastek.`, a: '2' };
        },
        () => {
            return { q: `$\\int_0^1 x^2 dx$`, a: '0.333' };
        },
        () => {
            return { q: `Pochodna $f(x) = x^3$ w punkcie $x=2$`, a: '12' };
        }
    ];
    
    const type = types[n % types.length];
    const result = type();
    STATE.tasks[STATE.tasks.findIndex(t => !t.a && t.type === 'hard')] = { ...STATE.tasks[STATE.tasks.findIndex(t => !t.a && t.type === 'hard')], ...result };
    return result.q;
}

function renderTasks(filter = 'all') {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    const filteredTasks = STATE.tasks.filter(t => filter === 'all' || t.type === filter);
    
    container.innerHTML = filteredTasks.map((task, idx) => {
        const completed = STATE.completedTasks.has(task.id);
        const colorMap = {
            easy: 'green-400',
            medium: 'yellow-400',
            hard: 'red-400'
        };
        const color = colorMap[task.type];
        
        return `
            <div class="task-card glass-card p-6 rounded-xl border border-white/[0.06] ${completed ? 'opacity-50' : ''}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <span class="inline-block size-3 rounded-full bg-${color}"></span>
                        <h4 class="font-medium">#${idx + 1}</h4>
                    </div>
                    <span class="text-xs text-muted-foreground">+${task.exp} EXP</span>
                </div>
                <div class="mb-4 text-lg">${task.q}</div>
                ${completed ? 
                    `<div class="text-green-400 flex items-center gap-2">
                        <i data-lucide="check-circle" class="size-4"></i>
                        Rozwiązane!
                    </div>` :
                    `<div class="flex gap-2">
                        <input type="text" placeholder="Odpowiedź..." class="glass-input flex-1 px-3 py-2 rounded-lg text-sm" id="answer-${task.id}">
                        <button onclick="checkTask('${task.id}')" class="btn-primary text-sm">
                            <i data-lucide="check" class="size-4"></i>
                            Sprawdź
                        </button>
                    </div>`
                }
            </div>
        `;
    }).join('');
    
    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typeset(['#tasks-list']);
    }
    
    // Re-initialize icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

function filterTasks(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTasks(filter);
}

function checkTask(taskId) {
    const task = STATE.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const input = document.getElementById(`answer-${taskId}`);
    const userAnswer = input.value.trim();
    
    if (!userAnswer) return;
    
    // Check answer (allow some tolerance for decimals)
    const correct = Math.abs(parseFloat(userAnswer) - parseFloat(task.a)) < 0.01 || userAnswer === task.a;
    
    if (correct) {
        STATE.completedTasks.add(taskId);
        addExp(task.exp);
        renderTasks();
        updateProgress();
        
        // Show success message
        showToast('Poprawnie! +' + task.exp + ' EXP', 'success');
    } else {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        showToast('Niepoprawna odpowiedź. Spróbuj ponownie!', 'error');
    }
}

function addExp(amount) {
    STATE.userExp += amount;
    
    const expNeeded = STATE.userLevel * 100;
    
    if (STATE.userExp >= expNeeded) {
        STATE.userExp -= expNeeded;
        STATE.userLevel++;
        showToast(`Poziom ${STATE.userLevel}!`, 'success');
    }
    
    updateProgress();
}

function updateProgress() {
    document.getElementById('user-level').textContent = STATE.userLevel;
    document.getElementById('user-exp').textContent = STATE.userExp;
    document.getElementById('exp-needed').textContent = STATE.userLevel * 100;
    
    const completed = STATE.completedTasks.size;
    document.getElementById('tasks-completed').textContent = completed;
    document.getElementById('progress-bar').style.width = (completed / 150 * 100) + '%';
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 glass-card px-6 py-3 rounded-lg border z-50 animate-in slide-in-from-right`;
    
    const colors = {
        success: 'border-green-400/20 text-green-400',
        error: 'border-red-400/20 text-red-400',
        info: 'border-primary/20 text-primary'
    };
    
    toast.classList.add(colors[type]);
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================================================
// INITIALIZE ON LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Zymath Singularity v4.0 initialized!');
    
    // Show home section by default
    showSection('home');
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Export for use in HTML
window.showSection = showSection;
window.showCalculator = showCalculator;
window.toggleKnowledge = toggleKnowledge;
window.drawGraph = drawGraph;
window.solveQuadratic = solveQuadratic;
window.solveSystem = solveSystem;
window.setEngineInput = setEngineInput;
window.computeEngine = computeEngine;
window.filterTasks = filterTasks;
window.checkTask = checkTask;
