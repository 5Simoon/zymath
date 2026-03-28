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
/**
 * /api/config.js  —  Vercel Serverless Function (Zabezpieczona)
 *
 * PURPOSE:
 * Zwraca klucz Desmos API TYLKO, jeśli użytkownik przejdzie weryfikację 
 * antybotową Cloudflare Turnstile.
 */

export default async function handler(req, res) {
    // 1. Zezwalamy TYLKO na żądania POST (bo przesyłamy token z frontu)
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    // Pobieramy token przesłany ze strony i nasze tajne klucze z Vercela
    const { token } = req.body || {};
    const desmosKey = process.env.DESMOS_API;
    const turnstileSecret = process.env.TURNSTILE_SECRET;

    // 2. Sprawdzamy, czy serwer na Vercelu jest poprawnie skonfigurowany
    if (!desmosKey || !turnstileSecret) {
        console.error('[api/config] Brak zmiennych środowiskowych na serwerze!');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    // 3. Sprawdzamy, czy użytkownik w ogóle przysłał token
    if (!token) {
        res.status(400).json({ error: 'Brak tokenu weryfikacyjnego Turnstile' });
        return;
    }

    try {
        // 4. Weryfikujemy token u źródła (serwery Cloudflare)
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Przekazujemy nasz tajny klucz z Vercela oraz token od użytkownika
            body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}`
        });

        const verifyData = await verifyRes.json();

        // 5. Oceniamy wynik
        if (verifyData.success) {
            // SUKCES: To jest człowiek!
            
            // BEZPIECZEŃSTWO: Ustawiamy brak cache'owania, żeby tokeny nie wyciekły!
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.setHeader('Access-Control-Allow-Origin', 'same-origin');
            
            // Zwracamy klucz
            res.status(200).json({ desmosKey });
        } else {
            // BŁĄD: Cloudflare odrzucił token (np. był fałszywy lub wygasł)
            console.error('[api/config] Odrzucono token:', verifyData['error-codes']);
            res.status(403).json({ error: 'Weryfikacja Cloudflare Turnstile nie powiodła się' });
        }
    } catch (error) {
        // W razie problemów z siecią/serwerami Cloudflare
        console.error('[api/config] Błąd połączenia z Cloudflare:', error);
        res.status(500).json({ error: 'Internal server error during verification' });
    }
}
