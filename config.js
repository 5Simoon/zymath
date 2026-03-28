/**
 * /api/config.js  —  Vercel Serverless Function (Zabezpieczona v4)
 *
 * PURPOSE:
 *   Zwraca klucz Desmos API TYLKO po pomyślnej weryfikacji
 *   Cloudflare Turnstile (antybotowej).
 *
 * SECURITY FEATURES (v4):
 *   - POST-only endpoint
 *   - Cloudflare Turnstile server-side verification
 *   - In-memory rate limiting (20 req / 15 min per IP)
 *   - Input length guard (token max 2048 chars)
 *   - no-store cache headers
 *   - Structured error responses (no stack leakage)
 */

// ── In-memory rate limiter (resets on cold start) ─────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT     = 20;              // max requests per window per IP
const rateLimitMap   = new Map();       // ip -> { count, windowStart }

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        // Prune old entries to avoid memory leak
        if (rateLimitMap.size > 5000) {
            for (const [k, v] of rateLimitMap) {
                if (now - v.windowStart > RATE_WINDOW_MS) rateLimitMap.delete(k);
            }
        }
        return true; // OK
    }
    if (entry.count >= RATE_LIMIT) return false; // Too many
    entry.count++;
    return true;
}

export default async function handler(req, res) {
    // 1. POST only
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    // 2. Rate limiting per IP
    const clientIP = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
        .split(',')[0].trim();
    if (!checkRateLimit(clientIP)) {
        res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
        return;
    }

    // 3. Read secrets
    const { token } = req.body || {};
    const desmosKey      = process.env.DESMOS_API;
    const turnstileSecret = process.env.TURNSTILE_SECRET;

    // 4. Server config check
    if (!desmosKey || !turnstileSecret) {
        console.error('[api/config] Missing environment variables!');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    // 5. Token presence + length guard
    if (!token || typeof token !== 'string' || token.length > 2048) {
        res.status(400).json({ error: 'Missing or invalid Turnstile token' });
        return;
    }

    // 6. Verify token with Cloudflare
    try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(clientIP)}`
        });

        if (!verifyRes.ok) throw new Error('Cloudflare endpoint error: ' + verifyRes.status);
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
            // SUCCESS: human verified
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.status(200).json({ desmosKey });
        } else {
            console.warn('[api/config] Turnstile rejected:', verifyData['error-codes']);
            res.status(403).json({ error: 'Cloudflare Turnstile verification failed' });
        }
    } catch (error) {
        // Don't leak error details to client
        console.error('[api/config] Verification error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}
