// ============================================================================
// ZYMATH SINGULARITY V4.0 - NEXUS MATH ENGINE
// 8 Computation Modes: Numerical, Calculus, Linear Algebra, Statistics,
// Number Theory, Symbolic+FFT, Graph Theory, AI Solver
// Author: 5Simoon | License: GNU GPL v3
// ============================================================================

const MathEngine = (() => {
    'use strict';
    
    // ========================================================================
    // MODE 1: NUMERICAL COMPUTATIONS
    // ========================================================================
    
    function evaluateNumerical(expr) {
        expr = expr.toLowerCase().trim();
        
        // Special functions
        if (expr.startsWith('gamma(')) {
            const x = parseFloat(expr.match(/\((.*?)\)/)[1]);
            return `Γ(${x}) = ${gamma(x).toFixed(6)}`;
        }
        
        if (expr.startsWith('bessel(')) {
            const x = parseFloat(expr.match(/\((.*?)\)/)[1]);
            return `J₀(${x}) = ${besselJ0(x).toFixed(6)}`;
        }
        
        if (expr.startsWith('erf(')) {
            const x = parseFloat(expr.match(/\((.*?)\)/)[1]);
            return `erf(${x}) = ${erf(x).toFixed(6)}`;
        }
        
        if (expr.startsWith('cf:')) {
            const x = parseFloat(expr.substring(3));
            return `Continued fraction of ${x}:\n${continuedFraction(x)}`;
        }
        
        // Basic evaluation
        try {
            let code = expr;
            code = code.replace(/pi/g, 'Math.PI');
            code = code.replace(/e(?![a-z])/g, 'Math.E');
            code = code.replace(/sqrt/g, 'Math.sqrt');
            code = code.replace(/sin/g, 'Math.sin');
            code = code.replace(/cos/g, 'Math.cos');
            code = code.replace(/tan/g, 'Math.tan');
            code = code.replace(/log/g, 'Math.log');
            code = code.replace(/exp/g, 'Math.exp');
            code = code.replace(/abs/g, 'Math.abs');
            code = code.replace(/\^/g, '**');
            
            const result = eval(code);
            return `Result: ${result}`;
        } catch (e) {
            throw new Error('Invalid numerical expression');
        }
    }
    
    // Gamma function (Lanczos approximation)
    function gamma(z) {
        const g = 7;
        const C = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        
        if (z < 0.5) {
            return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
        }
        
        z -= 1;
        let x = C[0];
        for (let i = 1; i < g + 2; i++) {
            x += C[i] / (z + i);
        }
        
        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }
    
    // Bessel J0 function
    function besselJ0(x) {
        const ax = Math.abs(x);
        if (ax < 8) {
            const y = x * x;
            const ans1 = 57568490574.0 + y * (-13362590354.0 + y * (651619640.7
                + y * (-11214424.18 + y * (77392.33017 + y * (-184.9052456)))));
            const ans2 = 57568490411.0 + y * (1029532985.0 + y * (9494680.718
                + y * (59272.64853 + y * (267.8532712 + y * 1.0))));
            return ans1 / ans2;
        } else {
            const z = 8 / ax;
            const y = z * z;
            const xx = ax - 0.785398164;
            const ans1 = 1.0 + y * (-0.1098628627e-2 + y * (0.2734510407e-4
                + y * (-0.2073370639e-5 + y * 0.2093887211e-6)));
            const ans2 = -0.1562499995e-1 + y * (0.1430488765e-3
                + y * (-0.6911147651e-5 + y * (0.7621095161e-6
                - y * 0.934935152e-7)));
            return Math.sqrt(0.636619772 / ax) *
                (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
        }
    }
    
    // Error function
    function erf(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
    
    // Continued fraction expansion
    function continuedFraction(x, maxTerms = 10) {
        const terms = [];
        let rem = x;
        
        for (let i = 0; i < maxTerms && Math.abs(rem) > 1e-10; i++) {
            const a = Math.floor(rem);
            terms.push(a);
            rem = rem - a;
            if (Math.abs(rem) < 1e-10) break;
            rem = 1 / rem;
        }
        
        return `[${terms[0]}; ${terms.slice(1).join(', ')}]`;
    }
    
    // ========================================================================
    // MODE 2: CALCULUS
    // ========================================================================
    
    function evaluateCalculus(expr) {
        if (expr.startsWith('derivative:')) {
            const parts = expr.substring(11).split(',');
            const func = parts[0].trim();
            const point = parts[1] ? parseFloat(parts[1].split('=')[1]) : null;
            
            if (point !== null) {
                const result = numericalDerivative(func, point);
                return `f'(${point}) = ${result.toFixed(6)}`;
            }
        }
        
        if (expr.startsWith('integral:')) {
            const parts = expr.substring(9).split(',');
            const func = parts[0].trim();
            const a = parseFloat(parts[1]);
            const b = parseFloat(parts[2]);
            
            const result = simpsonIntegration(func, a, b);
            return `∫[${a},${b}] f(x)dx = ${result.toFixed(6)}`;
        }
        
        if (expr.startsWith('newton:')) {
            const parts = expr.substring(7).split(',');
            const func = parts[0].trim();
            const x0 = parseFloat(parts[1]);
            
            const result = newtonRaphson(func, x0);
            return `Root (Newton-Raphson): ${result.toFixed(6)}`;
        }
        
        throw new Error('Unknown calculus operation');
    }
    
    // 5-point stencil derivative
    function numericalDerivative(funcStr, x, h = 0.0001) {
        const f = (val) => evaluateFunctionAt(funcStr, val);
        return (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h);
    }
    
    // Simpson's rule integration
    function simpsonIntegration(funcStr, a, b, n = 1000) {
        if (n % 2 === 1) n++;
        const h = (b - a) / n;
        const f = (x) => evaluateFunctionAt(funcStr, x);
        
        let sum = f(a) + f(b);
        
        for (let i = 1; i < n; i += 2) {
            sum += 4 * f(a + i * h);
        }
        
        for (let i = 2; i < n; i += 2) {
            sum += 2 * f(a + i * h);
        }
        
        return (h / 3) * sum;
    }
    
    // Newton-Raphson root finding
    function newtonRaphson(funcStr, x0, maxIter = 100, tol = 1e-7) {
        let x = x0;
        
        for (let i = 0; i < maxIter; i++) {
            const fx = evaluateFunctionAt(funcStr, x);
            const fpx = numericalDerivative(funcStr, x);
            
            if (Math.abs(fpx) < 1e-10) {
                throw new Error('Derivative too small');
            }
            
            const xNew = x - fx / fpx;
            
            if (Math.abs(xNew - x) < tol) {
                return xNew;
            }
            
            x = xNew;
        }
        
        return x;
    }
    
    function evaluateFunctionAt(funcStr, x) {
        let code = funcStr.replace(/x/g, `(${x})`);
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
    
    // ========================================================================
    // MODE 3: LINEAR ALGEBRA
    // ========================================================================
    
    function evaluateLinearAlgebra(expr) {
        if (expr.startsWith('det:')) {
            const matrix = JSON.parse(expr.substring(4));
            const result = determinant(matrix);
            return `Determinant = ${result.toFixed(6)}`;
        }
        
        if (expr.startsWith('inverse:')) {
            const matrix = JSON.parse(expr.substring(8));
            const result = inverse(matrix);
            return `Inverse:\n${matrixToString(result)}`;
        }
        
        if (expr.startsWith('eigen:')) {
            const matrix = JSON.parse(expr.substring(6));
            const result = eigenvalues2x2(matrix);
            return `Eigenvalues: λ₁ = ${result[0].toFixed(4)}, λ₂ = ${result[1].toFixed(4)}`;
        }
        
        throw new Error('Unknown linear algebra operation');
    }
    
    function determinant(matrix) {
        const n = matrix.length;
        
        if (n === 1) return matrix[0][0];
        if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        
        let det = 0;
        for (let j = 0; j < n; j++) {
            const minor = matrix.slice(1).map(row => row.filter((_, i) => i !== j));
            det += Math.pow(-1, j) * matrix[0][j] * determinant(minor);
        }
        
        return det;
    }
    
    function inverse(matrix) {
        const n = matrix.length;
        const det = determinant(matrix);
        
        if (Math.abs(det) < 1e-10) {
            throw new Error('Matrix is singular');
        }
        
        if (n === 2) {
            return [
                [matrix[1][1] / det, -matrix[0][1] / det],
                [-matrix[1][0] / det, matrix[0][0] / det]
            ];
        }
        
        throw new Error('Only 2x2 matrices supported for now');
    }
    
    function eigenvalues2x2(matrix) {
        const a = matrix[0][0];
        const b = matrix[0][1];
        const c = matrix[1][0];
        const d = matrix[1][1];
        
        const trace = a + d;
        const det = a * d - b * c;
        
        const discriminant = trace * trace - 4 * det;
        
        if (discriminant < 0) {
            throw new Error('Complex eigenvalues not supported');
        }
        
        const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
        const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
        
        return [lambda1, lambda2];
    }
    
    function matrixToString(matrix) {
        return matrix.map(row => 
            '[' + row.map(x => x.toFixed(4)).join(', ') + ']'
        ).join('\n');
    }
    
    // ========================================================================
    // MODE 4: STATISTICS
    // ========================================================================
    
    function evaluateStatistics(expr) {
        if (expr.startsWith('stats:')) {
            const data = JSON.parse(expr.substring(6));
            const result = descriptiveStats(data);
            
            return `Descriptive Statistics:
n = ${result.n}
Mean = ${result.mean.toFixed(4)}
Median = ${result.median.toFixed(4)}
Mode = ${result.mode}
Std Dev = ${result.stdDev.toFixed(4)}
Min = ${result.min}, Max = ${result.max}
Q1 = ${result.q1.toFixed(2)}, Q3 = ${result.q3.toFixed(2)}`;
        }
        
        if (expr.startsWith('regression:')) {
            const data = JSON.parse(expr.substring(11));
            const result = linearRegression(data);
            return `Linear Regression: y = ${result.slope.toFixed(4)}x + ${result.intercept.toFixed(4)}
R² = ${result.r2.toFixed(4)}`;
        }
        
        throw new Error('Unknown statistics operation');
    }
    
    function descriptiveStats(data) {
        const n = data.length;
        const sorted = [...data].sort((a, b) => a - b);
        
        const mean = data.reduce((a, b) => a + b, 0) / n;
        
        const median = n % 2 === 0 ?
            (sorted[n / 2 - 1] + sorted[n / 2]) / 2 :
            sorted[Math.floor(n / 2)];
        
        const freqMap = {};
        data.forEach(x => freqMap[x] = (freqMap[x] || 0) + 1);
        const maxFreq = Math.max(...Object.values(freqMap));
        const mode = Object.keys(freqMap).find(k => freqMap[k] === maxFreq);
        
        const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        
        return {
            n,
            mean,
            median,
            mode,
            stdDev,
            min: sorted[0],
            max: sorted[n - 1],
            q1,
            q3
        };
    }
    
    function linearRegression(data) {
        // data = [[x1, y1], [x2, y2], ...]
        const n = data.length;
        const sumX = data.reduce((sum, p) => sum + p[0], 0);
        const sumY = data.reduce((sum, p) => sum + p[1], 0);
        const sumXY = data.reduce((sum, p) => sum + p[0] * p[1], 0);
        const sumX2 = data.reduce((sum, p) => sum + p[0] * p[0], 0);
        const sumY2 = data.reduce((sum, p) => sum + p[1] * p[1], 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const meanY = sumY / n;
        const ssRes = data.reduce((sum, p) => {
            const pred = slope * p[0] + intercept;
            return sum + Math.pow(p[1] - pred, 2);
        }, 0);
        const ssTot = data.reduce((sum, p) => sum + Math.pow(p[1] - meanY, 2), 0);
        const r2 = 1 - ssRes / ssTot;
        
        return { slope, intercept, r2 };
    }
    
    // ========================================================================
    // MODE 5: NUMBER THEORY
    // ========================================================================
    
    function evaluateNumberTheory(expr) {
        if (expr.startsWith('isprime:')) {
            const n = parseInt(expr.substring(8));
            const result = millerRabin(n);
            return result ? `${n} is PRIME ✓` : `${n} is COMPOSITE`;
        }
        
        if (expr.startsWith('factor:')) {
            const n = parseInt(expr.substring(7));
            const result = pollardRho(n);
            return `Prime factorization: ${result.join(' × ')}`;
        }
        
        if (expr.startsWith('collatz:')) {
            const n = parseInt(expr.substring(8));
            const result = collatzSteps(n);
            return `Collatz sequence from ${n}: ${result} steps`;
        }
        
        if (expr.startsWith('gcd:')) {
            const parts = expr.substring(4).split(',');
            const a = parseInt(parts[0]);
            const b = parseInt(parts[1]);
            return `gcd(${a}, ${b}) = ${gcd(a, b)}`;
        }
        
        throw new Error('Unknown number theory operation');
    }
    
    // Miller-Rabin primality test
    function millerRabin(n, k = 5) {
        if (n < 2) return false;
        if (n === 2 || n === 3) return true;
        if (n % 2 === 0) return false;
        
        let r = 0, d = n - 1;
        while (d % 2 === 0) {
            r++;
            d /= 2;
        }
        
        const modPow = (base, exp, mod) => {
            let result = 1;
            base = base % mod;
            while (exp > 0) {
                if (exp % 2 === 1) result = (result * base) % mod;
                exp = Math.floor(exp / 2);
                base = (base * base) % mod;
            }
            return result;
        };
        
        for (let i = 0; i < k; i++) {
            const a = 2 + Math.floor(Math.random() * (n - 4));
            let x = modPow(a, d, n);
            
            if (x === 1 || x === n - 1) continue;
            
            let composite = true;
            for (let j = 0; j < r - 1; j++) {
                x = (x * x) % n;
                if (x === n - 1) {
                    composite = false;
                    break;
                }
            }
            
            if (composite) return false;
        }
        
        return true;
    }
    
    // Pollard's rho factorization
    function pollardRho(n) {
        if (n === 1) return [1];
        if (millerRabin(n)) return [n];
        
        const factors = [];
        
        while (n % 2 === 0) {
            factors.push(2);
            n /= 2;
        }
        
        while (n > 1) {
            if (millerRabin(n)) {
                factors.push(n);
                break;
            }
            
            let divisor = n;
            for (let i = 0; i < 100 && divisor === n; i++) {
                divisor = pollardRhoStep(n);
            }
            
            if (divisor === n) {
                factors.push(n);
                break;
            }
            
            factors.push(divisor);
            n /= divisor;
        }
        
        return factors.sort((a, b) => a - b);
    }
    
    function pollardRhoStep(n) {
        let x = 2, y = 2, d = 1;
        const f = (x) => (x * x + 1) % n;
        
        while (d === 1) {
            x = f(x);
            y = f(f(y));
            d = gcd(Math.abs(x - y), n);
        }
        
        return d;
    }
    
    function gcd(a, b) {
        while (b !== 0) {
            [a, b] = [b, a % b];
        }
        return a;
    }
    
    function collatzSteps(n) {
        let steps = 0;
        while (n !== 1) {
            n = n % 2 === 0 ? n / 2 : 3 * n + 1;
            steps++;
            if (steps > 10000) return 'Too many steps (>10000)';
        }
        return steps;
    }
    
    // ========================================================================
    // MODE 6: SYMBOLIC + FFT
    // ========================================================================
    
    function evaluateSymbolic(expr) {
        if (expr.startsWith('fft:')) {
            const data = JSON.parse(expr.substring(4));
            const result = fft(data);
            return `FFT Result:\n${result.map((c, i) => 
                `[${i}]: ${c.real.toFixed(4)} + ${c.imag.toFixed(4)}i`
            ).join('\n')}`;
        }
        
        throw new Error('Unknown symbolic operation');
    }
    
    // Fast Fourier Transform
    function fft(data) {
        const n = data.length;
        if (n === 1) return [{ real: data[0], imag: 0 }];
        
        const even = fft(data.filter((_, i) => i % 2 === 0));
        const odd = fft(data.filter((_, i) => i % 2 === 1));
        
        const result = new Array(n);
        for (let k = 0; k < n / 2; k++) {
            const angle = -2 * Math.PI * k / n;
            const wk = { real: Math.cos(angle), imag: Math.sin(angle) };
            
            const t = complexMul(wk, odd[k]);
            result[k] = complexAdd(even[k], t);
            result[k + n / 2] = complexSub(even[k], t);
        }
        
        return result;
    }
    
    function complexMul(a, b) {
        return {
            real: a.real * b.real - a.imag * b.imag,
            imag: a.real * b.imag + a.imag * b.real
        };
    }
    
    function complexAdd(a, b) {
        return { real: a.real + b.real, imag: a.imag + b.imag };
    }
    
    function complexSub(a, b) {
        return { real: a.real - b.real, imag: a.imag - b.imag };
    }
    
    // ========================================================================
    // MODE 7: GRAPH THEORY
    // ========================================================================
    
    function evaluateGraphTheory(expr) {
        if (expr.startsWith('dijkstra:')) {
            // Format: dijkstra:{A:[{to:B,weight:4}],B:[...],...}|A
            const parts = expr.substring(9).split('|');
            const graph = JSON.parse(parts[0]);
            const start = parts[1];
            
            const result = dijkstra(graph, start);
            return `Shortest paths from ${start}:\n${Object.entries(result)
                .map(([node, dist]) => `${node}: ${dist}`)
                .join('\n')}`;
        }
        
        throw new Error('Unknown graph theory operation');
    }
    
    function dijkstra(graph, start) {
        const dist = {};
        const visited = new Set();
        
        Object.keys(graph).forEach(node => dist[node] = Infinity);
        dist[start] = 0;
        
        while (visited.size < Object.keys(graph).length) {
            let minDist = Infinity;
            let current = null;
            
            for (const node in dist) {
                if (!visited.has(node) && dist[node] < minDist) {
                    minDist = dist[node];
                    current = node;
                }
            }
            
            if (!current) break;
            visited.add(current);
            
            (graph[current] || []).forEach(edge => {
                const newDist = dist[current] + edge.weight;
                if (newDist < dist[edge.to]) {
                    dist[edge.to] = newDist;
                }
            });
        }
        
        return dist;
    }
    
    // ========================================================================
    // MAIN ROUTER
    // ========================================================================
    
    function compute(expression) {
        const expr = expression.trim();
        
        // Route to appropriate mode
        if (expr.startsWith('derivative:') || expr.startsWith('integral:') || expr.startsWith('newton:')) {
            return evaluateCalculus(expr);
        }
        
        if (expr.startsWith('det:') || expr.startsWith('inverse:') || expr.startsWith('eigen:')) {
            return evaluateLinearAlgebra(expr);
        }
        
        if (expr.startsWith('stats:') || expr.startsWith('regression:')) {
            return evaluateStatistics(expr);
        }
        
        if (expr.startsWith('isprime:') || expr.startsWith('factor:') || expr.startsWith('collatz:') || expr.startsWith('gcd:')) {
            return evaluateNumberTheory(expr);
        }
        
        if (expr.startsWith('fft:')) {
            return evaluateSymbolic(expr);
        }
        
        if (expr.startsWith('dijkstra:')) {
            return evaluateGraphTheory(expr);
        }
        
        // Default to numerical
        return evaluateNumerical(expr);
    }
    
    // Public API
    return {
        compute,
        gamma,
        besselJ0,
        erf,
        determinant,
        inverse,
        millerRabin,
        gcd,
        fft
    };
})();

// Export for use in main.js
if (typeof window !== 'undefined') {
    window.MathEngine = MathEngine;
}
