/**
 * Real Estate Link Scraper
 * Extracts property data from raw HTML or plain text using JSON-LD, meta-tags,
 * inline JS data (window._PROPS_, etc.), and text heuristics.
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
 * Extract JSON from inline JS variables like window._PROPS_ = {...}
 * Uses brace balancing to safely extract nested objects.
 */
function extractInlineJson(html: string, varNames: string[]): any[] {
  const results: any[] = [];
  for (const name of varNames) {
    let idx = html.indexOf(name);
    while (idx !== -1) {
      const start = idx + name.length;
      // Skip whitespace and = sign
      let i = start;
      while (i < html.length && /\s/.test(html[i])) i++;
      if (html[i] === '=') i++;
      while (i < html.length && /\s/.test(html[i])) i++;

      // Try to parse as JSON starting at i
      let jsonStr = '';
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      let escaped = false;

      for (let j = i; j < html.length; j++) {
        const ch = html[j];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === '\\') {
            escaped = true;
          } else if (ch === stringChar) {
            inString = false;
          }
          jsonStr += ch;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
          jsonStr += ch;
          continue;
        }
        if (ch === '{' || ch === '[') {
          braceCount++;
          jsonStr += ch;
          continue;
        }
        if (ch === '}' || ch === ']') {
          braceCount--;
          jsonStr += ch;
          if (braceCount === 0) break;
          continue;
        }
        if (braceCount > 0) {
          jsonStr += ch;
        } else if (/[,;\s]/.test(ch)) {
          // Still collecting root-level whitespace/separators before object starts
          continue;
        } else {
          break;
        }
      }

      if (jsonStr.length > 10) {
        try {
          const parsed = JSON.parse(jsonStr);
          results.push(parsed);
        } catch {
          // ignore malformed
        }
      }
      idx = html.indexOf(name, idx + 1);
    }
  }
  return results;
}

/**
 * Flatten a nested object to find property-like fields.
 */
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return result;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, newKey));
    } else {
      result[newKey] = val;
    }
  }
  return result;
}

/**
 * Try to extract property data from inline JS globals (Zonaprop _PROPS_, etc.)
 */
function tryExtractFromInlineScripts(html: string, result: ScrapedData): boolean {
  const candidates = extractInlineJson(html, [
    'window._PROPS_',
    'window.__INITIAL_STATE__',
    'window.__DATA__',
    'window.__APP_DATA__',
    'window.__PRELOADED_STATE__',
    'window.initialProps',
    'window.__propertyData',
  ]);

  let found = false;
  for (const data of candidates) {
    const flat = flattenObject(data);
    const keys = Object.keys(flat);

    // Look for price fields
    const priceKeys = keys.filter(k => /price|precio|value|amount/i.test(k) && typeof flat[k] === 'number' || typeof flat[k] === 'string');
    for (const pk of priceKeys) {
      const parsed = normalizePrice(String(flat[pk]));
      if (parsed && (!result.price || parsed.price > result.price)) {
        result.price = parsed.price;
        result.currency = parsed.currency;
        found = true;
      }
    }

    // Title / name
    const titleKeys = keys.filter(k => /title|name|titulo/i.test(k) && typeof flat[k] === 'string');
    for (const tk of titleKeys) {
      if (!result.title && flat[tk].length > 5) {
        result.title = flat[tk];
        found = true;
      }
    }

    // Description
    const descKeys = keys.filter(k => /description|desc|detalle|observation/i.test(k) && typeof flat[k] === 'string');
    for (const dk of descKeys) {
      if (!result.description && flat[dk].length > 10) {
        result.description = flat[dk];
        found = true;
      }
    }

    // Address
    const addrKeys = keys.filter(k => /address|direccion|ubicacion|location|street/i.test(k) && typeof flat[k] === 'string');
    for (const ak of addrKeys) {
      if (!result.address && flat[ak].length > 3) {
        result.address = flat[ak];
        found = true;
      }
    }

    // Zone / city
    const zoneKeys = keys.filter(k => /zone|zona|city|ciudad|locality|neighborhood|barrio/i.test(k) && typeof flat[k] === 'string');
    for (const zk of zoneKeys) {
      const val = flat[zk];
      if (!result.zone && val.length > 2 && val.length < 60) {
        result.zone = val;
      }
      if (!result.city && /caba|capital|buenos aires|gba|gran buenos aires/i.test(val)) {
        result.city = val;
      }
      found = true;
    }

    // Images
    const imgKeys = keys.filter(k => /image|img|photo|foto|gallery/i.test(k));
    for (const ik of imgKeys) {
      const val = flat[ik];
      if (typeof val === 'string' && val.startsWith('http')) {
        if (!result.images.includes(val)) result.images.push(val);
        found = true;
      } else if (Array.isArray(val)) {
        for (const item of val) {
          const url = typeof item === 'string' ? item : item?.url || item?.src || item?.image;
          if (url && typeof url === 'string' && url.startsWith('http') && !result.images.includes(url)) {
            result.images.push(url);
            found = true;
          }
        }
      }
    }

    // Surface
    const surfaceKeys = keys.filter(k => /surface|superficie|m2|m²|sqm|area|totalArea|coveredArea/i.test(k));
    for (const sk of surfaceKeys) {
      const val = flat[sk];
      if (typeof val === 'number' && val > 10 && val < 50000 && !result.surface) {
        result.surface = val;
        found = true;
      } else if (typeof val === 'string') {
        const n = parseFloat(val.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
        if (!isNaN(n) && n > 10 && n < 50000 && !result.surface) {
          result.surface = n;
          found = true;
        }
      }
    }

    // Bedrooms
    const bedKeys = keys.filter(k => /bedroom|dormitorio|habitacion|rooms/i.test(k));
    for (const bk of bedKeys) {
      const val = flat[bk];
      if (typeof val === 'number' && val > 0 && val < 50 && !result.bedrooms) {
        result.bedrooms = val;
        found = true;
      } else if (typeof val === 'string') {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n > 0 && n < 50 && !result.bedrooms) {
          result.bedrooms = n;
          found = true;
        }
      }
    }

    // Bathrooms
    const bathKeys = keys.filter(k => /bathroom|bano|baño|toilet/i.test(k));
    for (const bk of bathKeys) {
      const val = flat[bk];
      if (typeof val === 'number' && val > 0 && val < 50 && !result.bathrooms) {
        result.bathrooms = val;
        found = true;
      } else if (typeof val === 'string') {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n > 0 && n < 50 && !result.bathrooms) {
          result.bathrooms = n;
          found = true;
        }
      }
    }

    // Total rooms / ambientes
    const roomKeys = keys.filter(k => /ambientes?|roomsTotal|totalRooms/i.test(k));
    for (const rk of roomKeys) {
      const val = flat[rk];
      if (typeof val === 'number' && val > 0 && val < 50 && !result.rooms) {
        result.rooms = val;
        found = true;
      } else if (typeof val === 'string') {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n > 0 && n < 50 && !result.rooms) {
          result.rooms = n;
          found = true;
        }
      }
    }
  }

  return found;
}

/**
 * Apply plain-text heuristics when no HTML structure is available.
 * This handles copy-paste from browser (Ctrl+A, Ctrl+C) which yields plain text.
 */
function applyPlainTextHeuristics(text: string, result: ScrapedData): void {
  const t = text;

  // Price heuristics from full text
  if (!result.price) {
    const pricePatterns = [
      /U\.?S\.?\$?\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/gi,
      /USD\s*[\d\.]{1,3}(?:[\.,]\d{3})*/gi,
      /\$\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/g,
    ];
    for (const pattern of pricePatterns) {
      const matches = t.match(pattern);
      if (matches) {
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
    result.rooms = extractNumber(t, [
      /(\d+)\s*ambientes?/i,
      /(\d+)\s*amb\.?/i,
      /(\d+)\s*rooms?/i,
    ]);
  }
  if (!result.bedrooms) {
    result.bedrooms = extractNumber(t, [
      /(\d+)\s*dormitorios?/i,
      /(\d+)\s*dorm\.?/i,
      /(\d+)\s*habitaciones?/i,
      /(\d+)\s*bedrooms?/i,
    ]);
  }
  if (!result.bathrooms) {
    result.bathrooms = extractNumber(t, [
      /(\d+)\s*baños?/i,
      /(\d+)\s*banos?/i,
      /(\d+)\s*bañ\w+/i,
      /(\d+)\s*bathrooms?/i,
    ]);
  }
  if (!result.surface) {
    result.surface = extractNumber(t, [
      /(\d[\d.,]*)\s*m[²2]\b/i,
      /(\d[\d.,]*)\s*metros?\s*cua/d/i,
      /(\d[\d.,]*)\s*sqm/i,
    ]);
  }

  // Zone detection from plain text patterns like "en Palermo, CABA"
  if (!result.zone) {
    const zoneMatch = t.match(/(?:en\s|,\s)([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+(?:,\s*CABA|,?\s*Buenos\s+Aires|,?\s*Capital\s+Federal))/i);
    if (zoneMatch) {
      result.zone = zoneMatch[1].replace(/,\s*(CABA|Buenos Aires|Capital Federal)$/i, '').trim();
    }
  }
  if (!result.city) {
    if (/CABA|Capital Federal/i.test(t)) result.city = 'CABA';
    else if (/Buenos Aires/i.test(t)) result.city = 'Buenos Aires';
  }

  // Address from text - common patterns
  if (!result.address) {
    const addrPatterns = [
      /(?:dirección|direccion|ubicado en|ubicada en|address)\s*:?\s*([^\n,.]{5,80})/i,
      /([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+\d{1,5}(?:\s*,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)?)/,
    ];
    for (const pat of addrPatterns) {
      const m = t.match(pat);
      if (m) {
        result.address = m[1].trim();
        break;
      }
    }
  }

  // Detect operation and type from plain text
  if (!result.operation) result.operation = detectOperation(t);
  if (!result.type) result.type = detectPropertyType(t);

  // Try to find title from first non-empty line if not set
  if (!result.title) {
    const firstLine = t.split('\n').find(l => l.trim().length > 10 && l.trim().length < 200);
    if (firstLine) {
      result.title = firstLine.trim();
    }
  }

  // Try to find description from a long paragraph
  if (!result.description) {
    const longPara = t.split('\n').find(l => l.trim().length > 80);
    if (longPara) {
      result.description = longPara.trim();
    }
  }
}

/**
 * Main scraping function. Accepts raw HTML or plain text string and source URL.
 */
export function scrapeProperty(html: string, sourceUrl: string): ScrapedData {
  // Detect if input is plain text or HTML
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(html);

  const result: ScrapedData = {
    images: [],
    externalLink: sourceUrl,
    externalSource: detectSource(sourceUrl),
  };

  if (looksLikeHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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

    // ── Priority 1b: Inline JS data (window._PROPS_, etc.) ─────────────────
    tryExtractFromInlineScripts(html, result);

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
      const bodyText = doc.body?.textContent || '';
      const pricePatterns = [
        /U\.?S\.?\$?\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/gi,
        /USD\s*[\d\.]{1,3}(?:[\.,]\d{3})*/gi,
        /\$\s*[\d\.]{1,3}(?:[\.,]\d{3})*(?:,\d+)?/g,
      ];
      for (const pattern of pricePatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
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
      if (result.images.length >= 12) break;
    }

    // If still no images, try to find image arrays in scripts
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

    // Final plain-text heuristics on full document text for anything still missing
    const allText = doc.body?.textContent || '';
    applyPlainTextHeuristics(allText, result);
  } else {
    // ── Plain text mode (Ctrl+A, Ctrl+C paste) ────────────────────────────
    applyPlainTextHeuristics(html, result);
  }

  // Final defaults
  if (!result.title) result.title = 'Propiedad captada desde link';
  if (!result.currency) result.currency = 'USD';
  if (!result.price) result.price = 0;

  return result;
}
