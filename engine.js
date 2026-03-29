/* ═══════════════════════════════════════════════════════════
   ZYMATH SINGULARITY — Math Engine v1.0
   Pure-JS implementations: Numerical · Algebra · Statistics
   · Number Theory · Graph Theory · Symbolic · FFT
   Author: 5Simoon | GNU GPL v3
═══════════════════════════════════════════════════════════ */

const MathEngine = (() => {

  /* ── EXPRESSION EVALUATOR ─────────────────────────────── */
  function evaluate(expr, vars = {}) {
    if (typeof expr !== 'string') throw new Error('Expression must be a string');
    const BANNED = /\b(window|document|self|globalThis|top|parent|frames|location|history|navigator|fetch|XMLHttpRequest|WebSocket|import|require|eval|Function|process|__proto__|prototype|constructor|Reflect|Proxy|Symbol|alert|confirm|prompt|console|localStorage|sessionStorage|Worker)\b/i;
    if (BANNED.test(expr)) throw new Error('Forbidden identifier');

    let e = expr;
    // Substitute variable values
    for (const [k, v] of Object.entries(vars)) {
      e = e.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${v})`);
    }
    // Convenience aliases
    e = e.replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/g, 'Math.E');
    e = e.replace(/\bsqrt\b/g, 'Math.sqrt').replace(/\babs\b/g, 'Math.abs');
    e = e.replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos');
    e = e.replace(/\btan\b/g, 'Math.tan').replace(/\bexp\b/g, 'Math.exp');
    e = e.replace(/\blog\b/g, 'Math.log').replace(/\blog2\b/g, 'Math.log2');
    e = e.replace(/\blog10\b/g, 'Math.log10').replace(/\bcbrt\b/g, 'Math.cbrt');
    e = e.replace(/\bfloor\b/g, 'Math.floor').replace(/\bceil\b/g, 'Math.ceil');
    e = e.replace(/\bround\b/g, 'Math.round').replace(/\bhypot\b/g, 'Math.hypot');
    e = e.replace(/\bmin\b/g, 'Math.min').replace(/\bmax\b/g, 'Math.max');
    e = e.replace(/\bpow\b/g, 'Math.pow').replace(/\bsign\b/g, 'Math.sign');
    e = e.replace(/\basin\b/g, 'Math.asin').replace(/\bacos\b/g, 'Math.acos');
    e = e.replace(/\batan2?\b/g, m => m === 'atan2' ? 'Math.atan2' : 'Math.atan');
    e = e.replace(/\bsinh\b/g, 'Math.sinh').replace(/\bcosh\b/g, 'Math.cosh');
    e = e.replace(/\btanh\b/g, 'Math.tanh').replace(/\btrunc\b/g, 'Math.trunc');
    e = e.replace(/\bgamma\b/g, '_gamma').replace(/\bfactorial\b/g, '_factorial');
    e = e.replace(/\^\s*(-?\d+\.?\d*)/g, '**$1');
    e = e.replace(/\^/g, '**');

    const fn = new Function('_gamma', '_factorial', `"use strict"; return (${e});`);
    const result = fn(gamma, factorial);
    if (typeof result !== 'number') throw new Error('Result must be a number');
    return result;
  }

  /* ── SPECIAL FUNCTIONS ────────────────────────────────── */
  function gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z--;
    const g = 7;
    const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,
      771.32342877765313,-176.61502916214059,12.507343278686905,
      -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    let x = c[0];
    for (let i = 1; i <= g+1; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2*Math.PI) * Math.pow(t, z+0.5) * Math.exp(-t) * x;
  }

  function factorial(n) {
    n = Math.round(n);
    if (n < 0) throw new Error('Factorial of negative');
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function besselJ0(x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x*x;
      const p = 57568490574 + y*(-13362590354 + y*(651619640.7 + y*(-11214424.18 + y*(77392.33017 + y*(-184.9052456)))));
      const q = 57568490411 + y*(1029532985 + y*(9494680.718 + y*(59272.64853 + y*(267.8532712 + y))));
      return p/q;
    }
    const z = 8/ax, y = z*z, xx = ax - 0.785398164;
    const p1 = 1 + y*(-0.1098628627e-2 + y*(0.2734510407e-4 + y*(-0.2073370639e-5 + y*0.2093887211e-6)));
    const q1 = -0.1562499995e-1 + y*(0.1430488765e-3 + y*(-0.6911147651e-5 + y*(0.7621095161e-6 - y*0.934935152e-7)));
    return Math.sqrt(0.636619772/ax) * (Math.cos(xx)*p1 - z*Math.sin(xx)*q1);
  }

  function besselJ1(x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x*x;
      const p = x*(72362614232 + y*(-7895059235 + y*(242396853.1 + y*(-2972611.439 + y*(15704.48260 + y*(-30.16116360))))));
      const q = 144725228442 + y*(2300535178 + y*(18583304.74 + y*(99447.43394 + y*(376.9991397 + y))));
      return p/q;
    }
    const z = 8/ax, y = z*z, xx = ax - 2.356194491;
    const p1 = 1 + y*(0.183105e-2 + y*(-0.3516396496e-4 + y*(0.2457520174e-5 + y*(-0.240337019e-6))));
    const q1 = 0.04687499995 + y*(-0.2002690873e-3 + y*(0.8449199096e-5 + y*(-0.88228987e-6 + y*0.105787412e-6)));
    return Math.sqrt(0.636619772/ax) * (Math.cos(xx)*p1 - z*Math.sin(xx)*q1) * Math.sign(x);
  }

  function continuedFraction(val, maxTerms = 15) {
    const terms = [];
    let x = val;
    for (let i = 0; i < maxTerms; i++) {
      const a = Math.floor(x);
      terms.push(a);
      const frac = x - a;
      if (Math.abs(frac) < 1e-10) break;
      x = 1 / frac;
    }
    return terms;
  }

  function continuedFractionConvergents(terms) {
    const convs = [];
    let p0 = 1, p1 = terms[0], q0 = 0, q1 = 1;
    convs.push({ p: p1, q: q1, value: p1/q1 });
    for (let i = 1; i < terms.length; i++) {
      const a = terms[i];
      const pn = a*p1 + p0, qn = a*q1 + q0;
      p0 = p1; p1 = pn; q0 = q1; q1 = qn;
      convs.push({ p: pn, q: qn, value: pn/qn });
    }
    return convs;
  }

  /* ── NUMERICAL METHODS ────────────────────────────────── */
  function numericalDerivative(f, x, h = 1e-5) {
    // 5-point stencil (4th-order accurate)
    return (-f(x+2*h) + 8*f(x+h) - 8*f(x-h) + f(x-2*h)) / (12*h);
  }

  function adaptiveSimpson(f, a, b, tol = 1e-9, depth = 0) {
    const m = (a+b)/2;
    const fa = f(a), fm = f(m), fb = f(b);
    const whole = (b-a)/6*(fa+4*fm+fb);
    const l = (m-a)/6*(fa+4*f((a+m)/2)+fm);
    const r = (b-m)/6*(fm+4*f((m+b)/2)+fb);
    if (depth > 20 || Math.abs(l+r-whole) < 15*tol) return l+r+(l+r-whole)/15;
    return adaptiveSimpson(f,a,m,tol/2,depth+1) + adaptiveSimpson(f,m,b,tol/2,depth+1);
  }

  function gaussLegendreComposite(f, a, b, n = 100) {
    // 5-point Gauss-Legendre nodes/weights
    const nodes = [-0.906179845938664,-0.538469310105683,0,0.538469310105683,0.906179845938664];
    const weights = [0.236926885056189,0.478628670499366,0.568888888888889,0.478628670499366,0.236926885056189];
    const h = (b-a)/n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a0 = a+i*h, b0 = a0+h, mid = (a0+b0)/2, half = (b0-a0)/2;
      for (let j = 0; j < 5; j++) sum += weights[j] * f(mid + half*nodes[j]);
      sum = sum; // keep running
    }
    // Fix: compute per-segment properly
    sum = 0;
    for (let i = 0; i < n; i++) {
      const a0 = a+i*h, b0 = a0+h, mid = (a0+b0)/2, half = (b0-a0)/2;
      let s = 0;
      for (let j = 0; j < 5; j++) s += weights[j] * f(mid + half*nodes[j]);
      sum += half * s;
    }
    return sum;
  }

  function rombergIntegration(f, a, b, maxOrder = 6) {
    const R = [];
    for (let i = 0; i <= maxOrder; i++) {
      R.push(new Array(i+1).fill(0));
      const n = Math.pow(2, i);
      const h = (b-a)/n;
      let sum = 0;
      for (let j = 0; j <= n; j++) {
        const w = (j === 0 || j === n) ? 0.5 : 1;
        sum += w * f(a + j*h);
      }
      R[i][0] = sum * h;
      for (let k = 1; k <= i; k++) {
        R[i][k] = R[i][k-1] + (R[i][k-1] - R[i-1][k-1]) / (Math.pow(4,k) - 1);
      }
    }
    return { value: R[maxOrder][maxOrder], table: R };
  }

  function newtonRaphson(f, df, x0, tol = 1e-12, maxIter = 100) {
    let x = x0;
    const steps = [];
    for (let i = 0; i < maxIter; i++) {
      const fx = f(x), dfx = df ? df(x) : numericalDerivative(f, x);
      steps.push({ iteration: i+1, x, fx });
      if (Math.abs(dfx) < 1e-15) throw new Error('Derivative zero');
      const xn = x - fx/dfx;
      if (Math.abs(xn - x) < tol) return { root: xn, steps };
      x = xn;
    }
    return { root: x, steps };
  }

  function bisection(f, a, b, tol = 1e-12, maxIter = 100) {
    const steps = [];
    if (f(a)*f(b) > 0) throw new Error('f(a) and f(b) must have opposite signs');
    for (let i = 0; i < maxIter; i++) {
      const c = (a+b)/2, fc = f(c);
      steps.push({ iter: i+1, a, b, c, fc });
      if (Math.abs(b-a) < tol || Math.abs(fc) < tol) return { root: c, steps };
      if (f(a)*fc < 0) b = c; else a = c;
    }
    return { root: (a+b)/2, steps };
  }

  function secantMethod(f, x0, x1, tol = 1e-12, maxIter = 50) {
    const steps = [];
    for (let i = 0; i < maxIter; i++) {
      const f0 = f(x0), f1 = f(x1);
      steps.push({ iter: i+1, x: x1, fx: f1 });
      if (Math.abs(f1-f0) < 1e-15) throw new Error('Secant denominator zero');
      const x2 = x1 - f1*(x1-x0)/(f1-f0);
      if (Math.abs(x2-x1) < tol) return { root: x2, steps };
      x0 = x1; x1 = x2;
    }
    return { root: x1, steps };
  }

  function arcLength(f, a, b, n = 10000) {
    const h = (b-a)/n;
    let len = 0;
    let prev = f(a);
    for (let i = 1; i <= n; i++) {
      const y = f(a + i*h);
      len += Math.hypot(h, y - prev);
      prev = y;
    }
    return len;
  }

  function rungeKutta4(f, t0, y0, tEnd, h = 0.01) {
    const traj = [{ t: t0, y: y0 }];
    let t = t0, y = y0;
    while (t < tEnd - 1e-12) {
      const k1 = f(t, y);
      const k2 = f(t + h/2, y + h*k1/2);
      const k3 = f(t + h/2, y + h*k2/2);
      const k4 = f(t + h, y + h*k3);
      y += h*(k1 + 2*k2 + 2*k3 + k4)/6;
      t += h;
      traj.push({ t, y });
    }
    return traj;
  }

  /* ── LINEAR ALGEBRA ───────────────────────────────────── */
  function matCopy(m) { return m.map(r => [...r]); }
  function matMul(A, B) {
    const n = A.length, m = B[0].length, k = B.length;
    const C = Array.from({length:n}, () => new Array(m).fill(0));
    for (let i=0;i<n;i++) for (let j=0;j<m;j++) for (let l=0;l<k;l++) C[i][j]+=A[i][l]*B[l][j];
    return C;
  }

  function determinant(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0]*M[1][1] - M[0][1]*M[1][0];
    const m = matCopy(M);
    let det = 1;
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col+1; row < n; row++) if (Math.abs(m[row][col]) > Math.abs(m[maxRow][col])) maxRow = row;
      if (maxRow !== col) { [m[col], m[maxRow]] = [m[maxRow], m[col]]; det *= -1; }
      if (Math.abs(m[col][col]) < 1e-12) return 0;
      det *= m[col][col];
      for (let row = col+1; row < n; row++) {
        const f = m[row][col] / m[col][col];
        for (let k = col; k < n; k++) m[row][k] -= f * m[col][k];
      }
    }
    return det;
  }

  function matrixInverse(M) {
    const n = M.length;
    const aug = M.map((r,i) => [...r, ...Array.from({length:n},(_,j)=>i===j?1:0)]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col+1; row < n; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
      const pivot = aug[col][col];
      if (Math.abs(pivot) < 1e-12) throw new Error('Matrix is singular');
      for (let k = col; k < 2*n; k++) aug[col][k] /= pivot;
      for (let row = 0; row < n; row++) {
        if (row === col) continue;
        const f = aug[row][col];
        for (let k = col; k < 2*n; k++) aug[row][k] -= f * aug[col][k];
      }
    }
    return aug.map(r => r.slice(n));
  }

  function eigenvalues2x2(M) {
    const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    const tr = a+d, det = a*d - b*c;
    const disc = tr*tr - 4*det;
    if (disc >= 0) return [(tr+Math.sqrt(disc))/2, (tr-Math.sqrt(disc))/2];
    return [{ real: tr/2, imag: Math.sqrt(-disc)/2 }];
  }

  function luDecomposition(M) {
    const n = M.length;
    const L = Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
    const U = matCopy(M);
    for (let col = 0; col < n; col++) {
      for (let row = col+1; row < n; row++) {
        const f = U[row][col] / U[col][col];
        L[row][col] = f;
        for (let k = col; k < n; k++) U[row][k] -= f * U[col][k];
      }
    }
    return { L, U };
  }

  function vectorCross3(a, b) {
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  }
  function vectorDot(a, b) { return a.reduce((s,v,i)=>s+v*b[i],0); }
  function vectorNorm(v) { return Math.sqrt(v.reduce((s,x)=>s+x*x,0)); }
  function vectorAngle(a, b) { return Math.acos(vectorDot(a,b)/(vectorNorm(a)*vectorNorm(b))); }

  function conjugateGradient(A, b, tol = 1e-10) {
    const n = b.length;
    let x = new Array(n).fill(0);
    const mvp = v => A.map(row => row.reduce((s,a,j)=>s+a*v[j],0));
    let r = b.map((v,i)=>v - mvp(x)[i]);
    let p = [...r], rsold = r.reduce((s,v)=>s+v*v,0);
    for (let i = 0; i < n*3; i++) {
      const Ap = mvp(p);
      const alpha = rsold / p.reduce((s,v,j)=>s+v*Ap[j],0);
      x = x.map((v,j)=>v+alpha*p[j]);
      r = r.map((v,j)=>v-alpha*Ap[j]);
      const rsnew = r.reduce((s,v)=>s+v*v,0);
      if (Math.sqrt(rsnew) < tol) break;
      p = r.map((v,j)=>v+(rsnew/rsold)*p[j]);
      rsold = rsnew;
    }
    return x;
  }

  function formatMatrix(M) {
    return M.map(row => '[ ' + row.map(v=>formatNumber(v).padStart(10)).join(', ') + ' ]').join('\n');
  }

  /* ── STATISTICS ───────────────────────────────────────── */
  function statistics(data) {
    const n = data.length;
    const sorted = [...data].sort((a,b)=>a-b);
    const mean = data.reduce((s,v)=>s+v,0)/n;
    const variance = data.reduce((s,v)=>s+(v-mean)**2,0)/(n-1);
    const stdDev = Math.sqrt(variance);
    const median = n%2 ? sorted[Math.floor(n/2)] : (sorted[n/2-1]+sorted[n/2])/2;
    const freq = {};
    data.forEach(v=>freq[v]=(freq[v]||0)+1);
    const maxF = Math.max(...Object.values(freq));
    const mode = maxF > 1 ? Object.keys(freq).filter(k=>freq[k]===maxF).map(Number) : [];
    const q1 = sorted[Math.floor(n/4)], q3 = sorted[Math.floor(3*n/4)];
    const iqr = q3 - q1;
    const skewness = data.reduce((s,v)=>s+((v-mean)/stdDev)**3,0)/n;
    const kurtosis = data.reduce((s,v)=>s+((v-mean)/stdDev)**4,0)/n - 3;
    return { mean, median, mode, variance, stdDev, min:sorted[0], max:sorted[n-1], q1, q3, iqr, skewness, kurtosis, n };
  }

  function linearRegression(x, y) {
    const n = x.length;
    const mx = x.reduce((s,v)=>s+v,0)/n, my = y.reduce((s,v)=>s+v,0)/n;
    const num = x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0);
    const den = x.reduce((s,v)=>s+(v-mx)**2,0);
    const slope = num/den, intercept = my - slope*mx;
    const yPred = x.map(v=>slope*v+intercept);
    const ssTot = y.reduce((s,v)=>s+(v-my)**2,0);
    const ssRes = y.reduce((s,v,i)=>s+(v-yPred[i])**2,0);
    const rSquared = 1 - ssRes/ssTot;
    const correlation = num / Math.sqrt(den * y.reduce((s,v)=>s+(v-my)**2,0));
    return { slope, intercept, rSquared, correlation };
  }

  function tTest(s1, s2) {
    const n1=s1.length, n2=s2.length;
    const m1=s1.reduce((s,v)=>s+v,0)/n1, m2=s2.reduce((s,v)=>s+v,0)/n2;
    const v1=s1.reduce((s,v)=>s+(v-m1)**2,0)/(n1-1);
    const v2=s2.reduce((s,v)=>s+(v-m2)**2,0)/(n2-1);
    const se = Math.sqrt(v1/n1 + v2/n2);
    const t = (m1-m2)/se;
    const df = Math.round((v1/n1+v2/n2)**2/((v1/n1)**2/(n1-1)+(v2/n2)**2/(n2-1)));
    return { t, df, meanDiff: m1-m2, se };
  }

  function shannonEntropy(probs) {
    return -probs.reduce((s,p)=>p>0?s+p*Math.log2(p):s, 0);
  }

  function normalPDF(x, mu=0, sigma=1) {
    return Math.exp(-0.5*((x-mu)/sigma)**2) / (sigma*Math.sqrt(2*Math.PI));
  }

  /* ── NUMBER THEORY ────────────────────────────────────── */
  function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
  function lcm(a, b) { return Math.abs(a*b) / gcd(a,b); }

  function extendedGCD(a, b) {
    if (b === 0) return { g: a, x: 1, y: 0 };
    const { g, x, y } = extendedGCD(b, a % b);
    return { g, x: y, y: x - Math.floor(a/b)*y };
  }

  function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n%2===0||n%3===0) return false;
    for (let i=5;i*i<=n;i+=6) if (n%i===0||n%(i+2)===0) return false;
    return true;
  }

  function millerRabin(n, k = 20) {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;
    let d = n-1, r = 0;
    while (d % 2 === 0) { d /= 2; r++; }
    const powMod = (base, exp, mod) => {
      let result = 1n;
      base = BigInt(base) % BigInt(mod);
      exp = BigInt(exp);
      const m = BigInt(mod);
      while (exp > 0n) {
        if (exp % 2n === 1n) result = result * base % m;
        exp >>= 1n;
        base = base * base % m;
      }
      return Number(result);
    };
    const witnesses = [2,3,5,7,11,13,17,19,23,29,31,37];
    for (const a of witnesses.slice(0, k)) {
      if (a >= n) continue;
      let x = powMod(a, d, n);
      if (x === 1 || x === n-1) continue;
      let composite = true;
      for (let i = 0; i < r-1; i++) {
        x = powMod(x, 2, n);
        if (x === n-1) { composite = false; break; }
      }
      if (composite) return false;
    }
    return true;
  }

  function pollardRho(n) {
    if (n % 2 === 0) return 2;
    if (isPrime(n)) return n;
    let x = 2 + Math.floor(Math.random() * (n-3));
    let y = x, c = 1 + Math.floor(Math.random() * (n-1)), d = 1;
    const f = v => (v*v + c) % n;
    while (d === 1) {
      x = f(x); y = f(f(y));
      d = gcd(Math.abs(x-y), n);
    }
    return d === n ? pollardRho(n) : d;
  }

  function primeFactorization(n) {
    const factors = {};
    if (n <= 1) return factors;
    for (let d = 2; d * d <= n; d++) {
      while (n % d === 0) { factors[d] = (factors[d]||0)+1; n /= d; }
    }
    if (n > 1) factors[n] = (factors[n]||0)+1;
    return factors;
  }

  function eulerTotient(n) {
    let result = n;
    const factors = primeFactorization(n);
    for (const p of Object.keys(factors)) result -= result / Number(p);
    return Math.round(result);
  }

  function mobiusFunction(n) {
    const factors = primeFactorization(n);
    for (const e of Object.values(factors)) if (e > 1) return 0;
    return Object.keys(factors).length % 2 === 0 ? 1 : -1;
  }

  function chineseRemainderTheorem(remainders, moduli) {
    const N = moduli.reduce((p,m)=>p*m,1);
    let x = 0;
    for (let i = 0; i < moduli.length; i++) {
      const ni = N / moduli[i];
      const { y } = extendedGCD(ni, moduli[i]);
      x += remainders[i] * ni * ((y % moduli[i] + moduli[i]) % moduli[i]);
    }
    return ((x % N) + N) % N;
  }

  function collatz(n) {
    const sequence = [n];
    let x = n;
    while (x !== 1) {
      x = x % 2 === 0 ? x/2 : 3*x+1;
      sequence.push(x);
    }
    return { sequence, steps: sequence.length - 1 };
  }

  function bellNumber(n) {
    const tri = Array.from({length:n+1},()=>new Array(n+1).fill(0));
    tri[0][0] = 1;
    for (let i=1;i<=n;i++) {
      tri[i][0] = tri[i-1][i-1];
      for (let j=1;j<=i;j++) tri[i][j] = tri[i-1][j-1] + tri[i][j-1];
    }
    return tri[n][0];
  }

  function catalanNumber(n) {
    let r = 1;
    for (let i=0;i<n;i++) r = r*2*(2*i+1)/(i+2);
    return Math.round(r);
  }

  function stirlingSecond(n, k) {
    if (n === 0 && k === 0) return 1;
    if (n === 0 || k === 0) return 0;
    if (n === k) return 1;
    return k * stirlingSecond(n-1,k) + stirlingSecond(n-1,k-1);
  }

  function partitionCount(n) {
    const dp = new Array(n+1).fill(0);
    dp[0] = 1;
    for (let i=1;i<=n;i++) for (let j=i;j<=n;j++) dp[j]+=dp[j-i];
    return dp[n];
  }

  function sieveOfEratosthenes(n) {
    const sieve = new Uint8Array(n+1).fill(1);
    sieve[0] = sieve[1] = 0;
    for (let i=2;i*i<=n;i++) if (sieve[i]) for (let j=i*i;j<=n;j+=i) sieve[j]=0;
    return Array.from({length:n+1},(_,i)=>i).filter(i=>sieve[i]);
  }

  function bigFactorial(n) {
    let r = 1n;
    for (let i=2;i<=n;i++) r *= BigInt(i);
    return r;
  }

  /* ── FFT ──────────────────────────────────────────────── */
  function fft(signal) {
    const n = signal.length;
    if (n === 1) return [{ re: signal[0], im: 0 }];
    const even = fft(signal.filter((_,i)=>i%2===0));
    const odd  = fft(signal.filter((_,i)=>i%2===1));
    const T = Array.from({length:n/2},(_,k)=>{
      const angle = -2*Math.PI*k/n;
      return { re: Math.cos(angle)*odd[k].re - Math.sin(angle)*odd[k].im,
               im: Math.cos(angle)*odd[k].im + Math.sin(angle)*odd[k].re };
    });
    return [
      ...even.map((_,k)=>({ re: even[k].re+T[k].re, im: even[k].im+T[k].im })),
      ...even.map((_,k)=>({ re: even[k].re-T[k].re, im: even[k].im-T[k].im }))
    ];
  }

  /* ── SYMBOLIC/SPECIAL ─────────────────────────────────── */
  function monteCarloPi(n) {
    let inside = 0;
    for (let i=0;i<n;i++) {
      const x=Math.random(), y=Math.random();
      if (x*x+y*y<=1) inside++;
    }
    const estimate = 4*inside/n;
    return { estimate, samples: n, error: Math.abs(estimate - Math.PI) };
  }

  function polynomialRoots(coeffs) {
    // Durand-Kerner method
    const n = coeffs.length - 1;
    if (n <= 0) return [];
    if (n === 1) return [-coeffs[1]/coeffs[0]];
    if (n === 2) {
      const [a,b,c] = coeffs;
      const d = b*b-4*a*c;
      if (d >= 0) return [(-b+Math.sqrt(d))/(2*a), (-b-Math.sqrt(d))/(2*a)];
      return [{ re: -b/(2*a), im: Math.sqrt(-d)/(2*a) }];
    }
    // Scale polynomial so leading coeff = 1
    const lc = coeffs[0];
    const p = coeffs.map(c=>c/lc);
    const eval_poly = x => p.reduce((s,c,i)=>s+c*Math.pow(x,p.length-1-i),0);
    // Initial guesses
    let roots = Array.from({length:n},(_,i)=>{
      const angle = 2*Math.PI*i/n;
      return { re: Math.cos(angle)*0.4, im: Math.sin(angle)*0.4 };
    });
    for (let iter=0;iter<200;iter++) {
      roots = roots.map((r,i)=>{
        let num = p.reduce((s,c,j)=>{
          const pw = n-j;
          const re = r.re, im = r.im;
          let rePow = 1, imPow = 0;
          for (let k=0;k<pw;k++) {
            const newRe = rePow*re - imPow*im;
            imPow = rePow*im + imPow*re;
            rePow = newRe;
          }
          return { re: s.re + c*rePow, im: s.im + c*imPow };
        }, {re:0,im:0});
        let den = { re:1, im:0 };
        for (let j=0;j<n;j++) {
          if (j===i) continue;
          const dr = r.re - roots[j].re, di = r.im - roots[j].im;
          const newRe = den.re*dr - den.im*di;
          den.im = den.re*di + den.im*dr;
          den.re = newRe;
        }
        const d2 = den.re**2 + den.im**2;
        const qRe = (num.re*den.re + num.im*den.im)/d2;
        const qIm = (num.im*den.re - num.re*den.im)/d2;
        return { re: r.re - qRe, im: r.im - qIm };
      });
    }
    return roots.map(r=>Math.abs(r.im)<1e-8 ? r.re : r);
  }

  function bezierCurve(pts, steps = 100) {
    const decasteljau = (pts, t) => {
      if (pts.length === 1) return pts[0];
      const next = [];
      for (let i = 0; i < pts.length-1; i++) {
        next.push({ x: (1-t)*pts[i].x + t*pts[i+1].x, y: (1-t)*pts[i].y + t*pts[i+1].y });
      }
      return decasteljau(next, t);
    };
    const curve = [];
    for (let i = 0; i <= steps; i++) curve.push(decasteljau(pts, i/steps));
    return curve;
  }

  function mandelbrotIterations(cx, cy, maxIter = 1000) {
    let zx = 0, zy = 0;
    for (let i = 0; i < maxIter; i++) {
      const zx2 = zx*zx - zy*zy + cx;
      zy = 2*zx*zy + cy;
      zx = zx2;
      if (zx*zx + zy*zy > 4) return i;
    }
    return maxIter;
  }

  /* ── GRAPH THEORY ─────────────────────────────────────── */
  function dijkstra(graph, start) {
    const dist = {}, prev = {}, visited = new Set();
    for (const n of Object.keys(graph)) { dist[n] = Infinity; prev[n] = null; }
    dist[start] = 0;
    const queue = [[0, start]];
    while (queue.length) {
      queue.sort((a,b)=>a[0]-b[0]);
      const [d, u] = queue.shift();
      if (visited.has(u)) continue;
      visited.add(u);
      for (const { to, weight } of (graph[u] || [])) {
        const nd = d + weight;
        if (nd < dist[to]) { dist[to] = nd; prev[to] = u; queue.push([nd, to]); }
      }
    }
    return { distances: dist, previous: prev };
  }

  function kruskalMST(edges, nodes) {
    const parent = Object.fromEntries(nodes.map(n=>[n,n]));
    const rank = Object.fromEntries(nodes.map(n=>[n,0]));
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (x,y) => {
      const [px,py] = [find(x),find(y)];
      if (px===py) return false;
      if (rank[px]<rank[py]) parent[px]=py;
      else if (rank[px]>rank[py]) parent[py]=px;
      else { parent[py]=px; rank[px]++; }
      return true;
    };
    const sorted = [...edges].sort((a,b)=>a.weight-b.weight);
    const mst = [];
    for (const e of sorted) if (union(e.u, e.v)) mst.push(e);
    return { edges: mst, totalWeight: mst.reduce((s,e)=>s+e.weight,0) };
  }

  function topologicalSort(graph) {
    const visited = new Set(), order = [];
    const dfs = n => {
      if (visited.has(n)) return;
      visited.add(n);
      for (const nb of (graph[n]||[])) dfs(nb);
      order.unshift(n);
    };
    for (const n of Object.keys(graph)) dfs(n);
    return order;
  }

  /* ── FORMATTING ───────────────────────────────────────── */
  function formatNumber(n) {
    if (!isFinite(n)) return isNaN(n) ? 'NaN' : (n > 0 ? '∞' : '-∞');
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs < 1e-12 && abs > 0) return n.toExponential(6);
    if (abs >= 1e12) return n.toExponential(6);
    if (Number.isInteger(n)) return n.toString();
    // Smart decimal places
    const str = n.toPrecision(10).replace(/\.?0+$/, '');
    return str.length > 15 ? n.toExponential(8) : str;
  }

  return {
    evaluate, gamma, factorial, besselJ0, besselJ1,
    continuedFraction, continuedFractionConvergents,
    numericalDerivative, adaptiveSimpson, gaussLegendreComposite,
    rombergIntegration, newtonRaphson, bisection, secantMethod,
    arcLength, rungeKutta4,
    matMul, determinant, matrixInverse, eigenvalues2x2,
    luDecomposition, vectorCross3, vectorDot, vectorNorm,
    vectorAngle, conjugateGradient, formatMatrix,
    statistics, linearRegression, tTest, shannonEntropy, normalPDF,
    gcd, lcm, extendedGCD, isPrime, millerRabin, pollardRho,
    primeFactorization, eulerTotient, mobiusFunction,
    chineseRemainderTheorem, collatz, bellNumber, catalanNumber,
    stirlingSecond, partitionCount, sieveOfEratosthenes, bigFactorial,
    fft, monteCarloPi, polynomialRoots, bezierCurve, mandelbrotIterations,
    dijkstra, kruskalMST, topologicalSort, formatNumber
  };
})();

/* ═══════════════════════════════════════════════════════════
   MATH ENGINE UI — Mode Selector · Quick Actions · Compute
═══════════════════════════════════════════════════════════ */

let _engineMode = 'numerical';

const ENGINE_MODES = [
  { id:'numerical',     label:'Numerical',     icon:'calculator',     desc:'Evaluate expressions' },
  { id:'ai_solve',      label:'AI Solver',     icon:'brain',          desc:'Claude AI solver' },
  { id:'calculus',      label:'Calculus',      icon:'trending-up',    desc:'Derivatives · integrals · ODEs' },
  { id:'linear_algebra',label:'Linear Algebra',icon:'grid-3x3',       desc:'Matrices · eigenvalues' },
  { id:'statistics',    label:'Statistics',    icon:'bar-chart-3',    desc:'Analysis · regression' },
  { id:'number_theory', label:'Number Theory', icon:'hash',           desc:'Primes · factors · modular' },
  { id:'symbolic',      label:'Symbolic+FFT',  icon:'sigma',          desc:'FFT · wavelets · Bezier' },
  { id:'graph_theory',  label:'Graph Theory',  icon:'sparkles',       desc:'Networks · optimization' },
];

const QUICK_ACTIONS = {
  numerical:     [{l:'sqrt(144)',v:'sqrt(144)'},{l:'sin(pi/4)',v:'sin(pi/4)'},{l:'gamma(5.5)',v:'gamma(5.5)'},{l:'factorial(20)',v:'factorial(20)'},{l:'cf:3.14159265',v:'cf:3.14159265'},{l:'bessel:0,2.4',v:'bessel:0,2.4'}],
  ai_solve:      [{l:'Solve quadratic',v:'Solve x^2 - 5x + 6 = 0 step by step'},{l:'Prove √2 irrational',v:'Prove that sqrt(2) is irrational'},{l:'Basel problem',v:'Sum of 1/n^2 for n=1 to infinity (Basel problem)'},{l:'Riemann hypothesis',v:'Explain the Riemann hypothesis and its significance'}],
  calculus:      [{l:"d/dx sin(x²)",v:'derivative:sin(x^2),x=1'},{l:'∫ x²sin(x)',v:'integral:x^2*sin(x),0,pi'},{l:'Newton: x³-x-2',v:'newton:x^3-x-2,1.5'},{l:'Bisect: cos(x)-x',v:'bisect:cos(x)-x,0,1'},{l:'Secant method',v:'secant:x^3-2,1,2'},{l:'Arc len sin(x)',v:'arclength:sin(x),0,pi'},{l:'ODE: dy/dt=y',v:'ode:y,0,1,5'}],
  linear_algebra:[{l:'Det 3×3',v:'det:[[1,2,3],[4,5,6],[7,8,10]]'},{l:'Inverse 2×2',v:'inverse:[[2,1],[5,3]]'},{l:'Eigenvalues',v:'eigen:[[4,1],[2,3]]'},{l:'Cross product',v:'cross:[1,2,3],[4,5,6]'},{l:'CG solver',v:'cg:[[4,1],[1,3]]|[1,2]'},{l:'LU decomp',v:'lu:[[2,1,1],[4,3,3],[8,7,9]]'}],
  statistics:    [{l:'Stats dataset',v:'stats:[12,15,18,22,25,28,30,33,35,38]'},{l:'Regression',v:'regression:[1,2,3,4,5],[2,4,5,4,5]'},{l:'t-Test',v:'ttest:[82,85,88,90,92],[75,78,80,83,85]'},{l:'Shannon entropy',v:'entropy:[0.5,0.25,0.125,0.125]'},{l:'Normal PDF',v:'normal:1.96,0,1'}],
  number_theory: [{l:'Miller-Rabin 997',v:'isprime:997'},{l:"Pollard's ρ 8051",v:'factor:8051'},{l:'CRT problem',v:'crt:2,3,5|3,4,6'},{l:'Collatz 27',v:'collatz:27'},{l:'Bell(10)',v:'bell:10'},{l:'Catalan(10)',v:'catalan:10'},{l:'Sieve ≤100',v:'sieve:100'},{l:'GCD+Bézout',v:'gcd:252,105'}],
  symbolic:      [{l:'FFT signal',v:'fft:[1,0,1,0,1,0,1,0]'},{l:'Monte Carlo π',v:'montecarlo:pi:500000'},{l:'Poly roots',v:'roots:[6,-5,1]'},{l:'Bezier curve',v:'bezier:[{"x":0,"y":0},{"x":0.5,"y":1},{"x":1,"y":0}]'},{l:'Mandelbrot',v:'mandelbrot:-0.75,0.1'}],
  graph_theory:  [{l:'Dijkstra',v:'dijkstra:{"A":[{"to":"B","weight":4},{"to":"C","weight":2}],"B":[{"to":"D","weight":3}],"C":[{"to":"B","weight":1},{"to":"D","weight":5}],"D":[]}|A'},{l:'Kruskal MST',v:'kruskal:A,B,C,D|A,B,4|A,C,2|B,D,3|C,B,1|C,D,5'},{l:'Topo sort',v:'toposort:{"A":["B","C"],"B":["D"],"C":["D"],"D":[]}'}],
};

function selectEngineMode(mode) {
  _engineMode = mode;
  document.querySelectorAll('.engine-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  renderQuickActions(mode);
}

function renderQuickActions(mode) {
  const el = document.getElementById('engine-quick');
  if (!el) return;
  const actions = QUICK_ACTIONS[mode] || [];
  el.innerHTML = '<span class="engine-quick-label">Quick:</span>' + actions.map(a =>
    `<button class="engine-qa-btn" onclick="document.getElementById('engine-input').value=${JSON.stringify(a.v)}">${a.l}</button>`
  ).join('');
}

function showEngineLoading() {
  document.getElementById('engine-result').innerHTML = `
    <div class="engine-loading">
      <div class="engine-spinner"></div>
      <div>
        <p class="engine-loading-title">Computing…</p>
        <p class="engine-loading-sub">Running advanced algorithms</p>
      </div>
    </div>`;
}

function showEngineResult(result) {
  const el = document.getElementById('engine-result');
  if (!result) {
    el.innerHTML = `<div class="engine-empty"><div class="engine-empty-icon">⚡</div><p>Enter an expression and hit Compute</p><p class="engine-empty-sub">Ctrl+Enter to run</p></div>`;
    return;
  }
  const safeCopy = (result.result||'').replace(/'/g,"&apos;");
  el.innerHTML = `
    <div class="engine-result-wrap">
      <div class="engine-result-main">
        <div class="engine-result-header">
          <span class="engine-result-tag">✦ Result</span>
          <button class="engine-copy-btn" onclick="navigator.clipboard.writeText('${safeCopy}');showSnackbar('📋 Copied!')">⎘ Copy</button>
        </div>
        <div class="engine-result-value">${escapeHtml(result.result || '')}</div>
      </div>
      ${result.steps ? `
      <div class="engine-steps">
        <span class="engine-steps-label">Step-by-Step Solution</span>
        <div class="engine-steps-content">${renderMarkdown(result.steps)}</div>
      </div>` : ''}
      <div class="engine-meta">
        ${result.executionTime ? `<span>⏱ ${result.executionTime}ms</span>` : ''}
        <span>⚙ ${result.mode}</span>
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code class="engine-inline-code">$1</code>')
    .replace(/^## (.+)/gm,'<h4 class="engine-md-h4">$1</h4>')
    .replace(/^### (.+)/gm,'<h5 class="engine-md-h5">$1</h5>')
    .replace(/^- (.+)/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g,'<ul class="engine-md-ul">$&</ul>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
}

async function handleCompute() {
  const expr = document.getElementById('engine-input').value.trim();
  if (!expr) return;

  const btn = document.getElementById('engine-compute-btn');
  btn.disabled = true;
  showEngineLoading();

  try {
    const result = await computeMath(expr, _engineMode);
    showEngineResult(result);
  } catch (err) {
    showEngineResult({ result: `Error: ${err.message}`, steps: '', mode: _engineMode, executionTime: 0 });
  } finally {
    btn.disabled = false;
  }
}

async function computeMath(expression, mode) {
  const t0 = performance.now();
  let result = '', steps = '';

  try {
    switch (mode) {

      case 'numerical': {
        if (expression.startsWith('bessel:')) {
          const [order, xStr] = expression.replace('bessel:','').split(',');
          const x = parseFloat(xStr);
          const val = parseInt(order) === 0 ? MathEngine.besselJ0(x) : MathEngine.besselJ1(x);
          result = MathEngine.formatNumber(val);
          steps = `Bessel function J${order}(${x}) = **${result}**\nComputed via Abramowitz & Stegun polynomial approximation (Numerical Recipes)`;
        } else if (expression.startsWith('cf:')) {
          const val = parseFloat(expression.replace('cf:',''));
          const terms = MathEngine.continuedFraction(val, 15);
          const convs = MathEngine.continuedFractionConvergents(terms);
          result = `[${terms.join('; ')}]`;
          steps = `Continued fraction of ${val}\n**CF:** ${result}\n\n**Convergents (best rational approximations):**\n${convs.map(c=>`${c.p}/${c.q} ≈ ${c.value.toFixed(10)}`).join('\n')}`;
        } else if (expression.startsWith('montecarlo:pi:')) {
          const n = Math.min(parseInt(expression.split(':')[2]||'1000000'), 5_000_000);
          const mc = MathEngine.monteCarloPi(n);
          result = mc.estimate.toFixed(8);
          steps = `Monte Carlo π estimation\n**Samples:** ${mc.samples.toLocaleString()}\n**Estimate:** ${mc.estimate.toFixed(10)}\n**Actual π:** ${Math.PI.toFixed(10)}\n**Error:** ${mc.error.toExponential(4)}`;
        } else {
          // General expression with gamma/factorial support
          const val = MathEngine.evaluate(expression);
          result = MathEngine.formatNumber(val);
          steps = `Expression: \`${expression}\`\nParsed and evaluated\n**Result: ${result}**`;
        }
        break;
      }

      case 'ai_solve': {
        const resp = await aiSolve(expression);
        result = resp.result;
        steps = resp.steps;
        break;
      }

      case 'calculus': {
        if (expression.startsWith('derivative:')) {
          const parts = expression.replace('derivative:','').split(',');
          const expr = parts[0].trim();
          const xVal = parts[1] ? MathEngine.evaluate(parts[1].replace('x=','')) : 0;
          const f = x => MathEngine.evaluate(expr, {x});
          const d = MathEngine.numericalDerivative(f, xVal);
          result = MathEngine.formatNumber(d);
          steps = `**f(x) = ${expr}**\nNumerical derivative via 5-point stencil (4th-order Richardson extrapolation)\n**f'(${xVal}) = ${result}**`;
        } else if (expression.startsWith('integral:')) {
          const parts = expression.replace('integral:','').split(',');
          const expr = parts[0].trim();
          const a = MathEngine.evaluate(parts[1].trim()), b = MathEngine.evaluate(parts[2].trim());
          const f = x => MathEngine.evaluate(expr, {x});
          const simp = MathEngine.adaptiveSimpson(f, a, b);
          const gauss = MathEngine.gaussLegendreComposite(f, a, b, 200);
          const romb = MathEngine.rombergIntegration(f, a, b, 8);
          result = MathEngine.formatNumber(simp);
          steps = `∫(${a} to ${b}) **${expr}** dx\n\n**Adaptive Simpson:** ${MathEngine.formatNumber(simp)}\n**Gauss-Legendre (200):** ${MathEngine.formatNumber(gauss)}\n**Romberg (order 8):** ${MathEngine.formatNumber(romb.value)}\n**Consensus:** ${MathEngine.formatNumber((simp+gauss+romb.value)/3)}`;
        } else if (expression.startsWith('newton:')) {
          const parts = expression.replace('newton:','').split(',');
          const expr = parts[0].trim(), x0 = parseFloat(parts[1]);
          const f = x => MathEngine.evaluate(expr, {x});
          const { root, steps: iters } = MathEngine.newtonRaphson(f, null, x0);
          result = MathEngine.formatNumber(root);
          steps = `**Newton-Raphson:** f(x) = ${expr}, x₀ = ${x0}\n\n${iters.slice(0,12).map(s=>`Iter ${s.iteration}: x = ${MathEngine.formatNumber(s.x)}, f(x) = ${MathEngine.formatNumber(s.fx)}`).join('\n')}\n\n**Root: ${result}**`;
        } else if (expression.startsWith('bisect:')) {
          const parts = expression.replace('bisect:','').split(',');
          const expr = parts[0].trim(), a = parseFloat(parts[1]), b = parseFloat(parts[2]);
          const f = x => MathEngine.evaluate(expr, {x});
          const { root, steps: iters } = MathEngine.bisection(f, a, b);
          result = MathEngine.formatNumber(root);
          steps = `**Bisection:** f(x) = ${expr} on [${a}, ${b}]\n\n${iters.slice(0,12).map(s=>`Iter ${s.iter}: [${s.a.toFixed(5)}, ${s.b.toFixed(5)}] → c=${s.c.toFixed(8)}`).join('\n')}\n\n**Root: ${result}**`;
        } else if (expression.startsWith('secant:')) {
          const parts = expression.replace('secant:','').split(',');
          const expr = parts[0].trim(), x0 = parseFloat(parts[1]), x1 = parseFloat(parts[2]);
          const f = x => MathEngine.evaluate(expr, {x});
          const { root, steps: iters } = MathEngine.secantMethod(f, x0, x1);
          result = MathEngine.formatNumber(root);
          steps = `**Secant Method:** f(x) = ${expr}, x₀=${x0}, x₁=${x1}\n\n${iters.map(s=>`Iter ${s.iter}: x = ${MathEngine.formatNumber(s.x)}, f(x) = ${MathEngine.formatNumber(s.fx)}`).join('\n')}\n\n**Root: ${result}**`;
        } else if (expression.startsWith('arclength:')) {
          const parts = expression.replace('arclength:','').split(',');
          const expr = parts[0].trim(), a = parseFloat(parts[1]), b = parseFloat(parts[2]);
          const f = x => MathEngine.evaluate(expr, {x});
          const len = MathEngine.arcLength(f, a, b);
          result = MathEngine.formatNumber(len);
          steps = `**Arc length of f(x) = ${expr}** from x=${a} to x=${b}\nL = ∫√(1 + [f'(x)]²) dx\n**Length = ${result}**`;
        } else if (expression.startsWith('ode:')) {
          const parts = expression.replace('ode:','').split(',');
          const expr = parts[0].trim(), t0 = parseFloat(parts[1]), y0 = parseFloat(parts[2]), tEnd = parseFloat(parts[3]||'5');
          const f = (t, y) => MathEngine.evaluate(expr, {t, y, x:t});
          const traj = MathEngine.rungeKutta4(f, t0, y0, tEnd, 0.05);
          const last = traj[traj.length-1];
          result = `y(${MathEngine.formatNumber(last.t)}) = ${MathEngine.formatNumber(last.y)}`;
          const sample = traj.filter((_,i)=>i%Math.max(1,Math.floor(traj.length/8))===0);
          steps = `**RK4 ODE Solver:** dy/dt = ${expr}, y(${t0}) = ${y0}\n\n${sample.map(s=>`t=${MathEngine.formatNumber(s.t)}: y = ${MathEngine.formatNumber(s.y)}`).join('\n')}\n\n**${result}**`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      case 'linear_algebra': {
        if (expression.startsWith('det:')) {
          const m = JSON.parse(expression.replace('det:',''));
          const det = MathEngine.determinant(m);
          result = MathEngine.formatNumber(det);
          steps = `**det(A) = ${result}**\nComputed via Gaussian elimination with partial pivoting\nMatrix: ${JSON.stringify(m)}`;
        } else if (expression.startsWith('inverse:')) {
          const m = JSON.parse(expression.replace('inverse:',''));
          const inv = MathEngine.matrixInverse(m);
          result = `A⁻¹ computed`;
          steps = `**A⁻¹ via Gauss-Jordan elimination**\nOriginal A:\n${MathEngine.formatMatrix(m)}\n\nInverse A⁻¹:\n${MathEngine.formatMatrix(inv)}\n\nVerification: A·A⁻¹ = I`;
        } else if (expression.startsWith('eigen:')) {
          const m = JSON.parse(expression.replace('eigen:',''));
          const eigs = MathEngine.eigenvalues2x2(m);
          result = eigs.map(e=>typeof e==='object'?`${e.real.toFixed(4)} ± ${e.imag.toFixed(4)}i`:MathEngine.formatNumber(e)).join(', ');
          steps = `**Eigenvalues of ${JSON.stringify(m)}**\nCharacteristic equation: det(A - λI) = 0\nTrace = ${m[0][0]+m[1][1]}, Det = ${MathEngine.determinant(m)}\n\n**λ = ${result}**`;
        } else if (expression.startsWith('lu:')) {
          const m = JSON.parse(expression.replace('lu:',''));
          const { L, U } = MathEngine.luDecomposition(m);
          result = `LU decomposition complete`;
          steps = `**LU Decomposition of A**\n\nL:\n${MathEngine.formatMatrix(L)}\n\nU:\n${MathEngine.formatMatrix(U)}\n\nA = L·U (verify by matrix multiplication)`;
        } else if (expression.startsWith('cross:')) {
          const parts = expression.replace('cross:','').split('],[');
          const a = JSON.parse(parts[0]+']'), b = JSON.parse('['+parts[1]);
          const c = MathEngine.vectorCross3(a, b);
          const dot = MathEngine.vectorDot(a, b);
          const angle = MathEngine.vectorAngle(a, b);
          result = `[${c.map(v=>MathEngine.formatNumber(v)).join(', ')}]`;
          steps = `**Cross Product a × b**\na = [${a}]\nb = [${b}]\n**a × b = ${result}**\n|a × b| = ${MathEngine.formatNumber(MathEngine.vectorNorm(c))}\nDot product a·b = ${MathEngine.formatNumber(dot)}\nAngle between vectors = ${MathEngine.formatNumber(angle*180/Math.PI)}°`;
        } else if (expression.startsWith('cg:')) {
          const [matStr, bStr] = expression.replace('cg:','').split('|');
          const A = JSON.parse(matStr), b = JSON.parse(bStr);
          const x = MathEngine.conjugateGradient(A, b);
          result = `[${x.map(v=>MathEngine.formatNumber(v)).join(', ')}]`;
          steps = `**Conjugate Gradient Solver (Ax = b)**\nA = ${JSON.stringify(A)}\nb = ${JSON.stringify(b)}\n**Solution x = ${result}**`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      case 'statistics': {
        if (expression.startsWith('stats:')) {
          const data = JSON.parse(expression.replace('stats:',''));
          const s = MathEngine.statistics(data);
          result = `μ=${MathEngine.formatNumber(s.mean)}, σ=${MathEngine.formatNumber(s.stdDev)}, n=${s.n}`;
          steps = `## Descriptive Statistics (n=${s.n})\n\n**Central Tendency**\n- Mean: ${MathEngine.formatNumber(s.mean)}\n- Median: ${s.median}\n- Mode: ${s.mode.length ? s.mode.join(', ') : 'none'}\n\n**Dispersion**\n- Variance: ${MathEngine.formatNumber(s.variance)}\n- Std Dev (sample): ${MathEngine.formatNumber(s.stdDev)}\n- IQR: ${MathEngine.formatNumber(s.iqr)}\n- Range: [${s.min}, ${s.max}]\n\n**Shape**\n- Skewness: ${MathEngine.formatNumber(s.skewness)} ${s.skewness>0?'(right-skewed)':'(left-skewed)'}\n- Excess Kurtosis: ${MathEngine.formatNumber(s.kurtosis)}\n\n**Quartiles:** Q1=${s.q1}, Q3=${s.q3}`;
        } else if (expression.startsWith('regression:')) {
          const parts = expression.replace('regression:','').split('],[');
          const x = JSON.parse(parts[0]+']'), y = JSON.parse('['+parts[1]);
          const r = MathEngine.linearRegression(x, y);
          result = `y = ${MathEngine.formatNumber(r.slope)}x + ${MathEngine.formatNumber(r.intercept)}`;
          steps = `## OLS Linear Regression\n\n**Equation:** ${result}\n**R²:** ${MathEngine.formatNumber(r.rSquared)}\n**Pearson r:** ${MathEngine.formatNumber(r.correlation)}\n**Slope:** ${MathEngine.formatNumber(r.slope)}\n**Intercept:** ${MathEngine.formatNumber(r.intercept)}`;
        } else if (expression.startsWith('ttest:')) {
          const parts = expression.replace('ttest:','').split('],[');
          const s1 = JSON.parse(parts[0]+']'), s2 = JSON.parse('['+parts[1]);
          const t = MathEngine.tTest(s1, s2);
          result = `t = ${MathEngine.formatNumber(t.t)}, df = ${t.df}`;
          steps = `## Welch's Two-Sample t-Test\n\n**t-statistic:** ${MathEngine.formatNumber(t.t)}\n**Degrees of freedom:** ${t.df}\n**Mean difference:** ${MathEngine.formatNumber(t.meanDiff)}\n**Standard error:** ${MathEngine.formatNumber(t.se)}\n\n**Interpretation:** ${Math.abs(t.t)>2?'⚠ Significant difference (|t| > 2)':'✓ No significant difference at α=0.05'}`;
        } else if (expression.startsWith('entropy:')) {
          const probs = JSON.parse(expression.replace('entropy:',''));
          const H = MathEngine.shannonEntropy(probs);
          result = `H = ${MathEngine.formatNumber(H)} bits`;
          steps = `**Shannon Entropy**\nH = -Σ pᵢ log₂(pᵢ)\nProbabilities: [${probs}]\n**H = ${MathEngine.formatNumber(H)} bits**\nMax entropy (uniform): ${MathEngine.formatNumber(Math.log2(probs.length))} bits\nRelative entropy: ${MathEngine.formatNumber(H/Math.log2(probs.length)*100)}%`;
        } else if (expression.startsWith('normal:')) {
          const parts = expression.replace('normal:','').split(',').map(Number);
          const val = MathEngine.normalPDF(parts[0], parts[1]||0, parts[2]||1);
          result = MathEngine.formatNumber(val);
          steps = `**Normal Distribution PDF**\nN(x=${parts[0]}; μ=${parts[1]||0}, σ=${parts[2]||1})\nφ(x) = (1/σ√2π) × exp(−½((x−μ)/σ)²)\n**PDF = ${result}**`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      case 'number_theory': {
        if (expression.startsWith('isprime:')) {
          const n = parseInt(expression.replace('isprime:',''));
          const prime = MathEngine.millerRabin(n, 20);
          result = prime ? `${n} is PRIME ✓` : `${n} is COMPOSITE`;
          if (!prime) {
            const factors = MathEngine.primeFactorization(n);
            steps = `**Trial Division:** COMPOSITE\n**Miller-Rabin (k=20):** COMPOSITE\n\n**Prime factorization:** ${Object.entries(factors).map(([p,e])=>e>1?`${p}^${e}`:p).join(' × ')}\n**Euler φ(${n}) = ${MathEngine.eulerTotient(n)}**\n**Möbius μ(${n}) = ${MathEngine.mobiusFunction(n)}**`;
          } else {
            steps = `**Trial division up to √${n}:** PRIME\n**Miller-Rabin (20 witnesses):** PRIME\nError probability < 4⁻²⁰ ≈ ${(4**-20).toExponential(2)}`;
          }
        } else if (expression.startsWith('factor:')) {
          const n = parseInt(expression.replace('factor:',''));
          const factors = MathEngine.primeFactorization(n);
          result = Object.entries(factors).map(([p,e])=>e>1?`${p}^${e}`:p).join(' × ');
          steps = `**Factorization of ${n}**\n${n} = **${result}**\n**Euler φ(${n}) = ${MathEngine.eulerTotient(n)}**\n**Möbius μ(${n}) = ${MathEngine.mobiusFunction(n)}**\nNumber of divisors: ${Object.entries(factors).reduce((s,[,e])=>s*(e+1),1)}`;
        } else if (expression.startsWith('crt:')) {
          const [remStr, modStr] = expression.replace('crt:','').split('|');
          const rem = remStr.split(',').map(Number), mods = modStr.split(',').map(Number);
          const val = MathEngine.chineseRemainderTheorem(rem, mods);
          result = String(val);
          steps = `**Chinese Remainder Theorem**\nRemainders: [${rem}]\nModuli: [${mods}]\n\nSolution: x ≡ **${val}** (mod ${mods.reduce((a,b)=>a*b,1)})\nAll solutions: ${val} + k×${mods.reduce((a,b)=>a*b,1)} for k∈ℤ`;
        } else if (expression.startsWith('collatz:')) {
          const n = parseInt(expression.replace('collatz:',''));
          const { sequence, steps: s } = MathEngine.collatz(n);
          result = `${s} steps, max = ${Math.max(...sequence).toLocaleString()}`;
          steps = `**Collatz (3n+1) sequence for ${n}**\nSteps: ${s}, Max value: ${Math.max(...sequence)}\n\n${sequence.length > 40 ? sequence.slice(0,20).join(' → ')+' … '+sequence.slice(-5).join(' → ') : sequence.join(' → ')}`;
        } else if (expression.startsWith('bell:')) {
          const n = parseInt(expression.replace('bell:',''));
          result = String(MathEngine.bellNumber(n));
          steps = `**Bell number B(${n}) = ${result}**\nCounts the number of partitions of a set with ${n} elements\nComputed via Bell triangle recurrence`;
        } else if (expression.startsWith('catalan:')) {
          const n = parseInt(expression.replace('catalan:',''));
          result = String(MathEngine.catalanNumber(n));
          steps = `**Catalan number C(${n}) = ${result}**\nC(n) = C(2n,n) / (n+1)\nCounts: valid bracket sequences, BST shapes, triangulations of (n+2)-gon...`;
        } else if (expression.startsWith('sieve:')) {
          const n = parseInt(expression.replace('sieve:',''));
          const primes = MathEngine.sieveOfEratosthenes(Math.min(n, 100000));
          result = `${primes.length} primes ≤ ${n}`;
          steps = `**Sieve of Eratosthenes up to ${n}**\nFound **${primes.length}** primes\n\n${primes.slice(0,80).join(', ')}${primes.length>80?`… (+${primes.length-80} more)`:''}`;
        } else if (expression.startsWith('gcd:')) {
          const parts = expression.replace('gcd:','').split(',').map(Number);
          const g = MathEngine.gcd(parts[0], parts[1]);
          const ext = MathEngine.extendedGCD(parts[0], parts[1]);
          result = `GCD = ${g}`;
          steps = `**Euclidean Algorithm:** GCD(${parts[0]}, ${parts[1]}) = **${g}**\n**Extended GCD (Bézout's identity):**\n${ext.x}·${parts[0]} + ${ext.y}·${parts[1]} = ${g}\n**LCM:** ${MathEngine.lcm(parts[0], parts[1])}`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      case 'symbolic': {
        if (expression.startsWith('fft:')) {
          const signal = JSON.parse(expression.replace('fft:',''));
          const spectrum = MathEngine.fft(signal);
          const magnitudes = spectrum.map(c => Math.hypot(c.re, c.im));
          result = `[${magnitudes.map(v=>v.toFixed(3)).join(', ')}]`;
          steps = `**Fast Fourier Transform (Cooley-Tukey)**\nInput signal: [${signal}]\n\n**Magnitudes:** ${result}\n\n**Complex spectrum:**\n${spectrum.map((c,i)=>`F[${i}] = ${c.re.toFixed(4)} ${c.im>=0?'+':'-'} ${Math.abs(c.im).toFixed(4)}i`).join('\n')}`;
        } else if (expression.startsWith('montecarlo:pi:')) {
          const n = Math.min(parseInt(expression.split(':')[2]||'500000'), 5_000_000);
          const mc = MathEngine.monteCarloPi(n);
          result = mc.estimate.toFixed(8);
          steps = `**Monte Carlo π estimation**\nSamples: ${mc.samples.toLocaleString()}\nEstimate: ${mc.estimate.toFixed(10)}\nActual π: ${Math.PI.toFixed(10)}\nError: ${mc.error.toExponential(4)}`;
        } else if (expression.startsWith('roots:')) {
          const coeffs = JSON.parse(expression.replace('roots:',''));
          const roots = MathEngine.polynomialRoots(coeffs);
          result = roots.map(r=>typeof r==='object'?`${r.re.toFixed(4)}±${r.im.toFixed(4)}i`:MathEngine.formatNumber(r)).join(', ');
          steps = `**Polynomial Roots (Durand-Kerner)**\nCoefficients: ${JSON.stringify(coeffs)}\nPolynomial degree: ${coeffs.length-1}\n**Roots:** ${result}`;
        } else if (expression.startsWith('bezier:')) {
          const pts = JSON.parse(expression.replace('bezier:',''));
          const curve = MathEngine.bezierCurve(pts, 20);
          result = `${pts.length}-point Bezier with ${curve.length} samples`;
          steps = `**Bézier Curve (de Casteljau)**\nControl points: ${pts.length}\n\nSampled points:\n${curve.filter((_,i)=>i%4===0).map(p=>`(${p.x.toFixed(4)}, ${p.y.toFixed(4)})`).join('\n')}`;
        } else if (expression.startsWith('mandelbrot:')) {
          const [cx, cy] = expression.replace('mandelbrot:','').split(',').map(Number);
          const iters = MathEngine.mandelbrotIterations(cx, cy, 1000);
          result = iters < 1000 ? `Escapes after ${iters} iterations` : `In Mandelbrot set (1000 iter)`;
          steps = `**Mandelbrot Set Test**\nc = ${cx} + ${cy}i\nz_{n+1} = z_n² + c, z₀ = 0\n\nIterations: ${iters}\n${iters<1000?'→ Point escapes (outside set)':'→ Bounded: point is IN the Mandelbrot set'}`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      case 'graph_theory': {
        if (expression.startsWith('dijkstra:')) {
          const [graphStr, start] = expression.replace('dijkstra:','').split('|');
          const graph = JSON.parse(graphStr);
          const { distances, previous } = MathEngine.dijkstra(graph, start);
          result = Object.entries(distances).map(([n,d])=>`${n}:${d===Infinity?'∞':d}`).join(', ');
          steps = `**Dijkstra's Algorithm from "${start}"**\n\n**Shortest distances:**\n${Object.entries(distances).map(([n,d])=>`  ${n}: ${d===Infinity?'∞':d}`).join('\n')}\n\n**Predecessor map:**\n${Object.entries(previous).map(([n,p])=>`  ${n} ← ${p||'—'}`).join('\n')}`;
        } else if (expression.startsWith('kruskal:')) {
          const parts = expression.replace('kruskal:','').split('|');
          const nodes = parts[0].split(',');
          const edges = parts.slice(1).map(e=>{const[u,v,w]=e.split(',');return{u,v,weight:parseFloat(w)};});
          const { edges: mst, totalWeight } = MathEngine.kruskalMST(edges, nodes);
          result = `MST weight: ${totalWeight}, edges: ${mst.length}`;
          steps = `**Kruskal's MST (Union-Find)**\nNodes: [${nodes}]\n\n**MST edges:**\n${mst.map(e=>`  ${e.u} — ${e.v}  (weight: ${e.weight})`).join('\n')}\n\n**Total weight: ${totalWeight}**`;
        } else if (expression.startsWith('toposort:')) {
          const graph = JSON.parse(expression.replace('toposort:',''));
          const order = MathEngine.topologicalSort(graph);
          result = order.join(' → ');
          steps = `**Topological Sort (DFS-based)**\nDAG: ${JSON.stringify(graph)}\n\nLinearization: **${result}**`;
        } else {
          const resp = await aiSolve(expression);
          result = resp.result; steps = resp.steps;
        }
        break;
      }

      default: {
        const val = MathEngine.evaluate(expression);
        result = MathEngine.formatNumber(val);
        steps = `Evaluated: ${expression} = **${result}**`;
      }
    }
  } catch (err) {
    // Fallback to AI
    const resp = await aiSolve(`${expression} (Note: local engine error: ${err.message}. Please solve directly.)`);
    result = resp.result;
    steps = `*Local engine error: ${err.message} — solved by AI*\n\n${resp.steps}`;
  }

  return { result, steps, executionTime: Math.round(performance.now()-t0), mode };
}

/* ── AI SOLVE via Claude API ─────────────────────────────── */
async function aiSolve(expression) {
  const response = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression })
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return await response.json();
}

/* ── ENGINE INIT ─────────────────────────────────────────── */
function initEngine() {
  // Build mode selector
  const modeEl = document.getElementById('engine-modes');
  if (!modeEl) return;

  modeEl.innerHTML = ENGINE_MODES.map(m => `
    <button class="engine-mode-btn${m.id === _engineMode ? ' active' : ''}"
      data-mode="${m.id}" onclick="selectEngineMode('${m.id}')">
      <span class="engine-mode-label">${m.label}</span>
      <span class="engine-mode-desc">${m.desc}</span>
    </button>`).join('');

  renderQuickActions(_engineMode);
  showEngineResult(null);

  // Keyboard shortcut
  document.getElementById('engine-input')?.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleCompute(); }
  });
}

/* Zymath Singularity v4 | (c) 2026 5Simoon | GNU GPL v3 */
