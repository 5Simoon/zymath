/**
 * /api/solve.js — Vercel Serverless Function
 * Routes math expressions to Claude AI for solving
 * Rate limited · POST-only · Input validated
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_LIMIT = 30;
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const e = rateLimitMap.get(ip);
  if (!e || now - e.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    if (rateLimitMap.size > 5000) for (const [k,v] of rateLimitMap) if (now-v.windowStart>RATE_WINDOW_MS) rateLimitMap.delete(k);
    return true;
  }
  if (e.count >= RATE_LIMIT) return false;
  e.count++;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });

  const { expression } = req.body || {};
  if (!expression || typeof expression !== 'string' || expression.length > 2000) {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are NEXUS, an elite mathematical computation engine. Solve with maximum precision and clarity. Always provide:
1. A concise final answer
2. Step-by-step solution using proper mathematical notation
Keep responses focused and mathematical.`,
        messages: [{ role: 'user', content: `Solve this mathematical problem concisely:\n${expression}\n\nRespond ONLY in this JSON format (no markdown wrapper):\n{"result":"<final answer>","steps":"<step-by-step in markdown>"}` }]
      })
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json?|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ result: parsed.result || 'See steps', steps: parsed.steps || text });
  } catch (err) {
    console.error('[api/solve]', err.message);
    res.status(500).json({ error: 'Solver unavailable', result: 'Error', steps: err.message });
  }
}
