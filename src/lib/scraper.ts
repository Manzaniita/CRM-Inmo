/**
 * Real Estate Link Scraper
 * Extracts property data from raw HTML using JSON-LD and meta-tag fallbacks.
 * Zero-dependency: uses browser-native DOMParser.
 */

import type { Property, PropertyType, PropertyOperation } from '../types';

export interface ScrapedData {
  title?: string;
  description?: string;
  price?: number;
  currency?: 'USD' | 'ARS';
  address?: string;
  zone?: string;
  city?: string;
  type?: PropertyType;
  operation?: PropertyOperation;
  bedrooms?: number;
  bathrooms?: number;
  rooms?: number;
  surface?: number;
  images: string[];
  externalSource?: string;
  externalLink?: string;
}

function normalizePrice(raw: string): { price: number; currency: 'USD' | 'ARS' } | null {
  if (!raw) return null;

  const cleaned = raw
    .replace(/\./g, '')       // remove thousand separators (Arg style)
    .replace(/,/g, '.')       // decimal comma to dot
    .replace(/\$/g, '')
    .replace(/u\.?s\.?s\.?/gi, '')
    .replace(/usd/gi, '')
    .replace(/ars/gi, '')
    .replace(/\$/g, '')
    .trim();

  const match = cleaned.match(/(\d[\d\s]*(?:\.\d+)?)/);
  if (!match) return null;

  const price = parseFloat(match[1].replace(/\s/g, ''));
  if (isNaN(price) || price <= 0) return null;

  const currency: 'USD' | 'ARS' =
    /u\.?s\.?s\.?|usd|\$/i.test(raw) && !raw.includes('ARS') && !raw.includes('$')
      ? 'USD'
      : 'ARS';

  // Heuristic: if raw contains U$S, USD, or "$" without ARS, assume USD
  const isUSD = /u\.?s\.?\$|usd/i.test(raw);
  const isARS = /ars|\$\s*\d{3,}/i.test(raw) && !isUSD;

  return {
    price,
    currency: isUSD ? 'USD' : isARS ? 'ARS' : 'USD',
  };
}

function detectOperation(text: string): PropertyOperation {
  const t = text.toLowerCase();
  if (t.includes('alquiler') || t.includes('renta') || t.includes('alquilar')) return 'alquiler';
  if (t.includes('venta') || t.includes('vender') || t.includes('sell')) return 'venta';
  return 'venta';
}

function detectPropertyType(text: string): PropertyType {
  const t = text.toLowerCase();
  if (t.includes('departamento') || t.includes('apartamento') || t.includes('piso')) return 'departamento';
  if (t.includes('casa') && !t.includes('casas')) return 'casa';
  if (t.includes('ph') || t.includes('propiedad horizontal')) return 'ph';
  if (t.includes('terreno') || t.includes('lote') || t.includes('fracción')) return 'terreno';
  if (t.includes('local') || t.includes('comercial')) return 'local';
  if (t.includes('oficina') || t.includes('oficinas')) return 'oficina';
  if (t.includes('galpón') || t.includes('galpon') || t.includes('deposito')) return 'galpón';
  if (t.includes('cochera') || t.includes('garage') || t.includes('estacionamiento')) return 'cochera';
  if (t.includes('campo') || t.includes('campos') || t.includes('finca') || t.includes('chacra')) return 'campos';
  return 'departamento';
}

function detectSource(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('zonaprop')) return 'Zonaprop';
    if (host.includes('argenprop')) return 'Argenprop';
    if (host.includes('mercadolibre')) return 'MercadoLibre';
    if (host.includes('inmuebles24')) return 'Inmuebles24';
    if (host.includes('properati')) return 'Properati';
    if (host.includes('olx')) return 'OLX';
    if (host.includes('lamudi')) return 'Lamudi';
    return host;
  } catch {
    return 'unknown';
  }
}

function extractNumber(text: string, patterns: RegExp[]): number | undefined {
  if (!text) return undefined;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return undefined;
}

function extractAddressFromTitle(title: string, description: string): { address?: string; zone?: string; city?: string } {
  const fullText = `${title} ${description}`;
  // Try to find "en [Neighborhood], [City]" or "[Street] [Number], [Zone]"
  const zoneMatch = fullText.match(/(?:en\s|,\s)([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+(?:,?\s*(?:CABA|Buenos Aires|Bs\.?\s*As\.?|GBA|Gran Buenos Aires|Capital Federal|Provincia de [A-Z][a-z]+|[A-Z][a-z]+,?\s*[A-Z][a-z]+)))/i);
  const streetMatch = fullText.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+\d{1,5}(?:\s*(?:,|\.))?)/);

  return {
    address: streetMatch ? streetMatch[1].trim() : undefined,
    zone: zoneMatch ? zoneMatch[1].trim() : undefined,
    city: fullText.includes('CABA') || fullText.includes('Capital Federal') ? 'CABA' : undefined,
  };
}

/**
 * Main scraping function. Accepts raw HTML string and source URL.
 */
export function scrapeProperty(html: string, sourceUrl: string): ScrapedData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const result: ScrapedData = {
    images: [],
    externalLink: sourceUrl,
    externalSource: detectSource(sourceUrl),
  };

  // ── Priority 1: JSON-LD ────────────────────────────────────────────────
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(jsonLdScripts)) {
    try {
      const data = JSON.parse(script.textContent || '{}');
      const graphs = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

      for (const item of graphs) {
        const type = item['@type'] || '';
        if (
          type === 'Product' ||
          type === 'RealEstateListing' ||
          type === 'Residence' ||
          type === 'Apartment' ||
          type === 'House' ||
          (type === 'Offer' && item.itemOffered)
        ) {
          const target = item.itemOffered || item;

          if (!result.title && (item.name || target.name)) {
            result.title = (item.name || target.name).trim();
          }
          if (!result.description && (item.description || target.description)) {
            result.description = (item.description || target.description).trim();
          }

          // Price from Offer
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            const priceRaw = offer.price || offer.priceCurrency || '';
            const priceInfo = normalizePrice(String(offer.price || ''));
            if (priceInfo) {
              result.price = priceInfo.price;
              result.currency = priceInfo.currency;
            }
            if (offer.priceCurrency && !result.currency) {
              result.currency = offer.priceCurrency === 'ARS' ? 'ARS' : 'USD';
            }
          }

          // Address
          const addr = target.address || item.address;
          if (addr) {
            if (addr.streetAddress && !result.address) result.address = addr.streetAddress;
            if (addr.addressLocality && !result.zone) result.zone = addr.addressLocality;
            if (addr.addressRegion && !result.city) result.city = addr.addressRegion;
          }

          // Images
          const img = target.image || item.image;
          if (img) {
            const imgs = Array.isArray(img) ? img : [img];
            for (const im of imgs) {
              const url = typeof im === 'string' ? im : im.url || im.contentUrl;
              if (url && !result.images.includes(url)) result.images.push(url);
            }
          }

          // Rooms / surface from properties
          if (target.numberOfRooms && !result.rooms) result.rooms = Number(target.numberOfRooms);
          if (target.numberOfBedrooms && !result.bedrooms) result.bedrooms = Number(target.numberOfBedrooms);
          if (target.numberOfBathroomsTotal && !result.bathrooms) {
            result.bathrooms = Number(target.numberOfBathroomsTotal);
          }
          if (target.floorSize?.value && !result.surface) result.surface = Number(target.floorSize.value);
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  // ── Priority 2: Open Graph & Meta Tags ────────────────────────────────
  const getMeta = (prop: string) => {
    const el = doc.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
    return el?.getAttribute('content') || '';
  };

  const ogTitle = getMeta('og:title');
  const ogDesc = getMeta('og:description');
  const ogImage = getMeta('og:image');

  if (!result.title && ogTitle) result.title = ogTitle.trim();
  if (!result.description && ogDesc) result.description = ogDesc.trim();
  if (ogImage && !result.images.includes(ogImage)) result.images.push(ogImage);

  // Twitter / additional image meta
  const twitterImage = getMeta('twitter:image');
  if (twitterImage && !result.images.includes(twitterImage)) result.images.push(twitterImage);

  // ── Priority 3: Page title / description fallback ─────────────────────
  if (!result.title) {
    const titleEl = doc.querySelector('title');
    if (titleEl) result.title = titleEl.textContent?.trim();
  }
  const metaDesc = getMeta('description');
  if (!result.description && metaDesc) result.description = metaDesc.trim();

  // ── Heuristic extraction from text content ────────────────────────────
  const fullText = `${result.title || ''} ${result.description || ''}`;

  if (!result.operation) result.operation = detectOperation(fullText);
  if (!result.type) result.type = detectPropertyType(fullText);

  // Price heuristics from text if still missing
  if (!result.price) {
    // Look for price patterns in the whole document text
    const bodyText = doc.body?.textContent || '';
    const pricePatterns = [
      /U\.?S\.?\$?\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/gi,
      /USD\s*[\d\.]{1,3}(?:[\.,]\d{3})*/gi,
      /\$\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/g,
    ];
    for (const pattern of pricePatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        // Pick the largest number (usually the property price, not expenses)
        let best: { price: number; currency: 'USD' | 'ARS' } | null = null;
        for (const m of matches) {
          const parsed = normalizePrice(m);
          if (parsed && (!best || parsed.price > best.price)) {
            best = parsed;
          }
        }
        if (best) {
          result.price = best.price;
          result.currency = best.currency;
          break;
        }
      }
    }
  }

  // Extract rooms / bedrooms / bathrooms / surface from text
  if (!result.rooms) {
    result.rooms = extractNumber(fullText, [
      /(\d+)\s*ambientes?/i,
      /(\d+)\s*amb\.?/i,
      /(\d+)\s*rooms?/i,
    ]);
  }
  if (!result.bedrooms) {
    result.bedrooms = extractNumber(fullText, [
      /(\d+)\s*dormitorios?/i,
      /(\d+)\s*dorm\.?/i,
      /(\d+)\s*habitaciones?/i,
      /(\d+)\s*bedrooms?/i,
    ]);
  }
  if (!result.bathrooms) {
    result.bathrooms = extractNumber(fullText, [
      /(\d+)\s*baños?/i,
      /(\d+)\s*banos?/i,
      /(\d+)\s*bañ\w+/i,
      /(\d+)\s*bathrooms?/i,
    ]);
  }
  if (!result.surface) {
    result.surface = extractNumber(fullText, [
      /(\d[\d.,]*)\s*m[²2]\b/i,
      /(\d[\d.,]*)\s*metros?\s*cua/d/i,
      /(\d[\d.,]*)\s*sqm/i,
    ]);
  }

  // Address / zone / city extraction
  const addrInfo = extractAddressFromTitle(result.title || '', result.description || '');
  if (!result.address && addrInfo.address) result.address = addrInfo.address;
  if (!result.zone && addrInfo.zone) result.zone = addrInfo.zone;
  if (!result.city && addrInfo.city) result.city = addrInfo.city;

  // Fallback zone from title: "Departamento en Palermo"
  if (!result.zone && result.title) {
    const zoneMatch = result.title.match(/(?:en|barrio|zona)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i);
    if (zoneMatch) result.zone = zoneMatch[1].trim();
  }

  // ── Multi-image discovery ─────────────────────────────────────────────
  // Some portals put gallery images in <img> tags with specific classes or data attributes
  const imgSelectors = [
    'img[data-src]',
    'img[src]',
    'img[data-original]',
    'img[data-lazy]',
  ];
  const seen = new Set(result.images);
  for (const sel of imgSelectors) {
    const imgs = doc.querySelectorAll(sel);
    for (const img of Array.from(imgs)) {
      const src =
        img.getAttribute('data-src') ||
        img.getAttribute('data-original') ||
        img.getAttribute('data-lazy') ||
        img.getAttribute('src') ||
        '';
      if (
        src &&
        !src.startsWith('data:') &&
        !src.includes('logo') &&
        !src.includes('icon') &&
        !src.includes('avatar') &&
        (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp') || src.includes('image'))
      ) {
        const absolute = src.startsWith('http') ? src : new URL(src, sourceUrl).href;
        if (!seen.has(absolute)) {
          seen.add(absolute);
          result.images.push(absolute);
        }
      }
    }
    // Cap at 12 images to avoid bloat
    if (result.images.length >= 12) break;
  }

  // If still no images, try to find image arrays in scripts (some portals hydrate with JS)
  if (result.images.length === 0) {
    const scripts = doc.querySelectorAll('script');
    for (const script of Array.from(scripts)) {
      const text = script.textContent || '';
      const urlMatches = text.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi);
      if (urlMatches) {
        for (const url of urlMatches) {
          if (!seen.has(url) && !url.includes('logo') && !url.includes('icon')) {
            seen.add(url);
            result.images.push(url);
            if (result.images.length >= 12) break;
          }
        }
      }
      if (result.images.length >= 12) break;
    }
  }

  // Final defaults
  if (!result.title) result.title = 'Propiedad captada desde link';
  if (!result.currency) result.currency = 'USD';
  if (!result.price) result.price = 0;
  if (!result.status) result.status = 'disponible';

  return result;
}
