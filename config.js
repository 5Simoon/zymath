/**
 * /api/config.js  —  Vercel Serverless Function
 *
 * PURPOSE:
 *   Serves configuration values (like the Desmos API key) that should not
 *   be hardcoded in static HTML. The client fetches this endpoint at runtime,
 *   so the key never appears in your GitHub repository or static build output.
 *
 * SETUP IN VERCEL:
 *   1. Go to your project → Settings → Environment Variables
 *   2. Add:  DESMOS_API  =  your_actual_desmos_api_key
 *   3. Redeploy. Done.
 *
 * IMPORTANT LIMITATION:
 *   Client-side API keys (like Desmos') are inherently public — the user's
 *   browser must receive the key to call the Desmos CDN. This function prevents
 *   the key from leaking via your git history or HTML source, but a user who
 *   opens DevTools → Network tab will still see it. That is unavoidable.
 *   Treat the Desmos key as "low-sensitivity" and rotate it if ever leaked.
 *
 * SECURITY HEADERS SET HERE:
 *   - Cache-Control: cache for 1 hour on CDN, no private caching
 *   - Access-Control-Allow-Origin: restricted to same origin only
 */
export default function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const desmosKey = process.env.DESMOS_API;

    if (!desmosKey) {
        // Return a 500 so the frontend can show a meaningful error
        console.error('[api/config] DESMOS_API environment variable is not set!');
        res.status(500).json({ error: 'Server configuration error — DESMOS_API not set' });
        return;
    }

    // Cache on Vercel's CDN for 1 hour; do not store in private browser caches
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=60');
    // Only this origin may call this endpoint
    res.setHeader('Access-Control-Allow-Origin', 'same-origin');

    res.status(200).json({ desmosKey });
}
