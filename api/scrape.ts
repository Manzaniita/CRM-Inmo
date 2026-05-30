// @ts-nocheck
/**
 * Vercel Serverless Function: Scraping bridge for real estate portals.
 * Fetches raw HTML from a given URL to bypass CORS in the browser.
 */

const ALLOWED_DOMAINS = [
  'zonaprop.com.ar',
  'www.zonaprop.com.ar',
  'argenprop.com',
  'www.argenprop.com',
  'mercadolibre.com.ar',
  'www.mercadolibre.com.ar',
  'articulo.mercadolibre.com.ar',
  'inmuebles24.com',
  'www.inmuebles24.com',
  'properati.com.ar',
  'www.properati.com.ar',
  'olx.com.ar',
  'www.olx.com.ar',
  'lamudi.com.ar',
  'www.lamudi.com.ar',
  'argenprop.com.ar',
  'www.argenprop.com.ar',
  ' Realtor.com', // fallback / future
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname.toLowerCase().endsWith(d.toLowerCase()));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query?.url || '';

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing URL parameter' });
  }

  if (!isAllowedUrl(url)) {
    return res.status(403).json({ error: 'URL domain not allowed. Supported portals: Zonaprop, Argenprop, MercadoLibre, Inmuebles24, Properati, OLX, Lamudi.' });
  }

  try {
    // Simulate human browsing delay (anti-bot)
    const delay = Math.floor(Math.random() * 500) + 300; // 300-800ms
    await new Promise(r => setTimeout(r, delay));

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.google.com.ar/',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Upstream returned ${response.status}: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return res.status(502).json({
        error: 'Upstream did not return HTML content',
        contentType,
      });
    }

    const html = await response.text();

    // Limit response size to ~2MB to avoid abuse
    if (html.length > 2_000_000) {
      return res.status(413).json({ error: 'HTML response too large' });
    }

    return res.status(200).json({
      success: true,
      url,
      html,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to fetch URL',
      message: err?.message || String(err),
    });
  }
}
