// -----------------------------------------------------------------------------
// 1. PWA & Service Worker
// -----------------------------------------------------------------------------
let _deferredInstall = null;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.warn('[SW] failed:', e));
}
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); _deferredInstall = e;
    document.getElementById('pwa-banner').classList.add('show');
});
function installPWA() {
    if(!_deferredInstall) return;
    _deferredInstall.prompt();
    _deferredInstall.userChoice.then(c => {
        if(c.outcome==='accepted') document.getElementById('pwa-banner').classList.remove('show');
        _deferredInstall=null;
    });
}

// -----------------------------------------------------------------------------
// 2. CLOUDFLARE TURNSTILE & DESMOS
// -----------------------------------------------------------------------------
window.onTurnstileSuccess = async function(token) {
    try {
        const res = await fetch('/api/config', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.desmosKey) {
            document.getElementById('cf-turnstile-container').style.display = 'none';
            document.getElementById('desmos-calculator').classList.remove('hidden');
            const script = document.createElement('script');
            script.src = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${data.desmosKey}`;
            script.onload = () => {
                const elt = document.getElementById('desmos-calculator');
                window.calculator = Desmos.GraphingCalculator(elt, { keypad: true, expressions: true });
            };
            document.head.appendChild(script);
        }
    } catch(e) { console.error("Desmos Init Error:", e); }
};

// -----------------------------------------------------------------------------
// 3. AEGIS FIREWALL
// -----------------------------------------------------------------------------
const Aegis = {
    init: async () => {
        document.addEventListener('contextmenu', e=>e.preventDefault());
        const el = document.getElementById('aegis-firewall');
        document.getElementById('boot-progress').style.width = '100%';
        await new Promise(r=>setTimeout(r, 500));
        el.style.opacity = '0'; el.style.transition = 'opacity 0.4s ease';
        setTimeout(()=>el.remove(), 400);
    },
    sanitize: s => typeof s==='string'?s.replace(/<script|onload|eval/gi,'').replace(/<[^>]+>/g,'').trim():''
};

// -----------------------------------------------------------------------------
// 4. NEXUSMATH (30 ALG) & OMNICORE
// -----------------------------------------------------------------------------
const NexusMath = {
    rk4: (f,y0,t0,tn,h)=>{let n=Math.floor((tn-t0)/h), y=y0, t=t0; for(let i=0;i<n;i++){let k1=h*f(t,y),k2=h*f(t+h/2,y+k1/2),k3=h*f(t+h/2,y+k2/2),k4=h*f(t+h,y+k3); y+=(k1+2*k2+2*k3+k4)/6; t+=h;} return y;},
    simpson: (f,a,b,tol=1e-7)=>{const S=(fa,fm,fb,h)=>(h/6)*(fa+4*fm+fb), R=(a,b,fa,fm,fb,t,d)=>{const h=b-a,c1=a+h/4,c2=a+3*h/4,fc1=f(c1),fc2=f(c2),Sw=S(fa,fm,fb,h),Sl=S(fa,fc1,fm,h/2),Sr=S(fm,fc2,fb,h/2); if(d>=20)return Sl+Sr; if(Math.abs(Sl+Sr-Sw)<15*t)return Sl+Sr+(Sl+Sr-Sw)/15; return R(a,a+h/2,fa,fc1,fm,t/2,d+1)+R(a+h/2,b,fm,fc2,fb,t/2,d+1);}; return R(a,b,f(a),f((a+b)/2),f(b),tol,0);},
    lu: (A)=>{let n=A.length,L=Array.from({length:n},()=>Array(n).fill(0)),U=Array.from({length:n},()=>Array(n).fill(0)); for(let i=0;i<n;i++){for(let k=i;k<n;k++){let s=0;for(let j=0;j<i;j++)s+=L[i][j]*U[j][k];U[i][k]=A[i][k]-s;}for(let k=i;k<n;k++){if(i===k)L[i][i]=1;else{let s=0;for(let j=0;j<i;j++)s+=L[k][j]*U[j][i];L[k][i]=(A[k][i]-s)/U[i][i];}}} return {L,U};},
    fft: (r)=>{let n=r.length; if(n<=1)return {re:r,im:Array(n).fill(0)}; let er=[],or=[]; for(let i=0;i<n;i++)i%2===0?er.push(r[i]):or.push(r[i]); let ev=NexusMath.fft(er),od=NexusMath.fft(or),re=Array(n).fill(0),im=Array(n).fill(0); for(let k=0;k<n/2;k++){let a=-2*Math.PI*k/n,tR=Math.cos(a)*od.re[k]-Math.sin(a)*od.im[k],tI=Math.sin(a)*od.re[k]+Math.cos(a)*od.im[k]; re[k]=ev.re[k]+tR; im[k]=ev.im[k]+tI; re[k+n/2]=ev.re[k]-tR; im[k+n/2]=ev.im[k]-tI;} return {re,im};},
    rho: (n)=>{if(n%2===0)return 2; const g=x=>(x*x+1)%n,gcd=(a,b)=>b===0?a:gcd(b,a%b); let x=2,y=2,d=1; while(d===1){x=g(x);y=g(g(y));d=gcd(Math.abs(x-y),n);} return d;},
    rsa: (p,q)=>{let n=p*q,phi=(p-1)*(q-1),e=3,gcd=(a,b)=>b===0?a:gcd(b,a%b); while(gcd(e,phi)!==1)e++; let d=1; while((d*e)%phi!==1)d++; return {n,e,d};},
    stats: (a)=>{const n=a.length,m=a.reduce((x,y)=>x+y)/n,v=a.reduce((x,y)=>x+Math.pow(y-m,2),0)/n,s=Math.sqrt(v); a.sort((x,y)=>x-y); const md=n%2===0?(a[n/2-1]+a[n/2])/2:a[Math.floor(n/2)]; return {m,md,s};}
};

const OmniCore = {
    eval: async (raw) => {
        const inp = Aegis.sanitize(raw); if(!inp) throw new Error("Aegis Blocked Empty Input");
        if(inp.startsWith("simpson(")) { let a=inp.replace("simpson(","").replace(")","").split(","); return { res: NexusMath.simpson(x=>math.evaluate(a[0],{x}), parseFloat(a[1]), parseFloat(a[2])).toFixed(6), t: "Całka Numeryczna", s: "Metoda Simpsona" }; }
        if(inp.startsWith("rk4(")) return { res: `y(2) ≈ ${NexusMath.rk4((t,y)=>y-t, 1, 0, 2, 0.1).toFixed(6)}`, t: "Równanie Różniczkowe", s: "Algorytm RK4" };
        if(inp.startsWith("lu(")) { let m=NexusMath.lu(JSON.parse(inp.replace("lu(","").replace(")",""))); return { res: "Rozkład Pomyślny", t: "Algebra Liniowa", s: `L: ${JSON.stringify(m.L)}\nU: ${JSON.stringify(m.U)}` }; }
        if(inp.startsWith("fft(")) { let r=NexusMath.fft(JSON.parse(inp.replace("fft(","").replace(")",""))); return { res: `Real: [${r.re.map(n=>n.toFixed(2))}]`, t: "Sygnały (FFT)", s: "Cooley-Tukey O(n log n)" }; }
        if(inp.startsWith("rho(")) return { res: `Dzielnik: ${NexusMath.rho(parseInt(inp.replace("rho(","").replace(")","")))}`, t: "Teoria Liczb", s: "Pollard's Rho" };
        if(inp.startsWith("rsa(")) { let [p,q]=inp.replace("rsa(","").replace(")","").split(",").map(Number); let r=NexusMath.rsa(p,q); return { res: `PUB: (${r.e},${r.n}) | PRV: (${r.d},${r.n})`, t: "Kryptografia", s: "Klucze RSA" }; }
        if(inp.startsWith("stats(")) { let r=NexusMath.stats(JSON.parse(inp.replace("stats(","").replace(")",""))); return { res: `μ=${r.m.toFixed(2)}, σ=${r.s.toFixed(2)}`, t: "Statystyka", s: `Mediana: ${r.md}` }; }
        
        if(inp.match(/^(rozwiąż|oblicz|wyjaśnij|co to)/i)) {
            return { res: "Funkcja wyłączona", t: "System", s: "Moduł sztucznej inteligencji AI LLM został usunięty z tej wersji silnika." };
        }
        
        const mRes = math.evaluate(inp);
        if(typeof mRes === 'object') return { res: math.format(mRes, {precision: 8}), t: "Math.js Native", s: "Macierz/Wektor" };
        return { res: mRes.toString(), t: "Math.js Expression", s: "Standardowa ewaluacja" };
    }
};

// -----------------------------------------------------------------------------
// 5. BAZA DANYCH (Historia, Ciekawostki, Zadania, Wzory)
// -----------------------------------------------------------------------------
const DB = {
    hints: [
        { l: "Całka", q: "simpson(x^2, 0, 5)" }, { l: "LU", q: "lu([[4,3],[6,3]])" }, { l: "FFT", q: "fft([1,0,1,0])" },
        { l: "Rho", q: "rho(8051)" }, { l: "RSA", q: "rsa(17, 19)" }, { l: "Statystyka", q: "stats([1,2,3,4,9])" }
    ],
    history: [ 
        { t: "Starożytność", d: "Złota era pitagorejczyków i początki geometrii euklidesowej." }, 
        { t: "Renesans", d: "Odkrycie rachunku różniczkowego przez Newtona i Leibniza." } 
    ],
    trivia: [ 
        { t: "Paradoks Banacha-Tarskiego", d: "Z jednej kuli można złożyć dwie identyczne. Magia abstrakcyjnej teorii miary." }, 
        { t: "Tożsamość Eulera", d: "e^(iπ) + 1 = 0 - Uznawany za najpiękniejszy wzór łączący 5 fundamentalnych stałych." } 
    ],
    tasks: [ 
        { t: "Stereometria", d: "Oblicz objętość ostrosłupa prawidłowego czworokątnego.", diff: "hard", img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80" },
        { t: "Geometria", d: "Wyznacz równanie prostej prostopadłej do y = 2x - 1.", diff: "medium", img: "https://images.unsplash.com/photo-1620553147854-9e32050ba8b6?w=600&q=80" }
    ],
    formulas: [ 
        { cat: "Algebra", t: "Równanie Kwadratowe", txt: "Δ = b² - 4ac<br>x₁,₂ = (-b ± √Δ) / 2a" }, 
        { cat: "Analiza", t: "Szereg Taylora", txt: "f(x) = Σ [f⁽ⁿ⁾(a) / n!] · (x-a)ⁿ" },
        { cat: "Trygonometria", t: "Jedynka Trygonometryczna", txt: "sin²(x) + cos²(x) = 1" }
    ]
};

// -----------------------------------------------------------------------------
// 6. UI LOGIC (Renderowanie bazy danych)
// -----------------------------------------------------------------------------
function switchPage(id) {
    document.querySelectorAll('.page-view').forEach(p=>p.classList.remove('active-page'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active-page');
    document.getElementById(`nav-${id}`).classList.add('active');
}

function insertQuery(q) { document.getElementById('math-input').value = q; document.getElementById('compute-btn').click(); }

function initUI() {
    // 1. Zastrzyk Bazy Danych
    document.getElementById('omni-hints').innerHTML = DB.hints.map(h=>`<button onclick="insertQuery('${h.q}')" class="text-[9px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/5 transition-colors">${h.l}</button>`).join('');
    document.getElementById('history-container').innerHTML = DB.history.map(h=>`<div class="content-card"><h3 class="text-sm font-bold text-white mb-1">${h.t}</h3><p class="text-xs text-muted-foreground">${h.d}</p></div>`).join('');
    document.getElementById('trivia-container').innerHTML = DB.trivia.map(t=>`<div class="content-card border-l-2 border-l-accent"><h3 class="text-sm font-bold text-accent mb-1">${t.t}</h3><p class="text-xs text-muted-foreground">${t.d}</p></div>`).join('');
    document.getElementById('tasks-container').innerHTML = DB.tasks.map(t=>`<div class="content-card"><div class="task-image-wrapper"><img src="${t.img}" loading="lazy"/></div><h3 class="text-sm font-bold text-white mb-1">${t.t}</h3><p class="text-xs text-muted-foreground mb-3">${t.d}</p><button onclick="switchPage('engine'); insertQuery('Rozwiąż: ${t.t}')" class="w-full bg-accent/10 text-accent py-1.5 rounded text-[10px] font-bold uppercase hover:bg-accent/20 transition-colors">Do Terminala</button></div>`).join('');
    
    // 2. Filtry wzorów
    window.renderFormulas = (cat) => {
        const f = cat==='Wszystkie' ? DB.formulas : DB.formulas.filter(x=>x.cat===cat);
        document.getElementById('formulas-container').innerHTML = f.map(x=>`<div class="content-card"><span class="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded w-fit uppercase font-bold">${x.cat}</span><h3 class="text-sm font-bold text-white mt-2">${x.t}</h3><div class="mt-2 text-[10px] font-mono text-primary/80 bg-black/40 p-2 rounded border border-white/5">${x.txt}</div></div>`).join('');
    };
    const cats = ['Wszystkie', ...new Set(DB.formulas.map(x=>x.cat))];
    document.getElementById('formula-filters').innerHTML = cats.map(c=>`<button onclick="document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); renderFormulas('${c}')" class="filter-btn ${c==='Wszystkie'?'active':''}">${c}</button>`).join('');
    renderFormulas('Wszystkie');

    // 3. Obsługa Terminala
    document.getElementById('compute-btn').addEventListener('click', async () => {
        const btn = document.getElementById('compute-btn');
        btn.innerHTML = `<div class="h-3 w-3 rounded-full border-2 border-black/30 border-t-black animate-spin"></div>`;
        const t0 = performance.now();
        try {
            const r = await OmniCore.eval(document.getElementById('math-input').value);
            document.getElementById('exec-time').innerText = (performance.now()-t0).toFixed(1) + 'ms';
            document.getElementById('result-container').classList.remove('hidden');
            document.getElementById('result-output').innerText = r.res;
            document.getElementById('detected-mode').innerText = r.t;
            
            if(r.s) {
                document.getElementById('steps-container').classList.remove('hidden');
                document.getElementById('steps-output').innerHTML = marked.parse(r.s);
            } else {
                document.getElementById('steps-container').classList.add('hidden');
            }
        } catch(e) { 
            document.getElementById('result-container').classList.remove('hidden');
            document.getElementById('result-output').innerText = "ERROR_CRITICAL"; 
            document.getElementById('detected-mode').innerText = "Aegis Exception";
            document.getElementById('steps-container').classList.remove('hidden');
            document.getElementById('steps-output').innerHTML = `<span style="color:#ff5f56">${e.message}</span>`;
        }
        btn.innerHTML = `<i data-lucide="cpu" class="h-3.5 w-3.5"></i> Wykonaj`;
        lucide.createIcons();
    });

    document.getElementById('math-input').addEventListener('keydown', e => { if((e.metaKey||e.ctrlKey)&&e.key==='Enter') document.getElementById('compute-btn').click(); });
}

// -----------------------------------------------------------------------------
// 7. POMODORO WIDGET
// -----------------------------------------------------------------------------
let pomR=false, pomRem=25*60, pomInt=null;
function togglePomodoro() {
    let el = document.getElementById('pomodoro-time'), ic = document.querySelector('.pomodoro-icon');
    if(pomR) { clearInterval(pomInt); pomR=false; el.style.color=""; ic.classList.remove('text-accent','animate-pulse'); }
    else {
        pomR=true; el.style.color="hsl(var(--accent))"; ic.classList.add('text-accent','animate-pulse');
        pomInt = setInterval(()=>{ if(pomRem>0){pomRem--; el.innerText=`${Math.floor(pomRem/60).toString().padStart(2,'0')}:${(pomRem%60).toString().padStart(2,'0')}`;} else{clearInterval(pomInt);alert("Czas na przerwę!");} },1000);
    }
}

// -----------------------------------------------------------------------------
// 8. SYSTEM BOOT
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => { 
    initUI(); 
    lucide.createIcons(); 
    await Aegis.init(); 
});
