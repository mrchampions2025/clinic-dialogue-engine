/**
 * Módulo de Utilidades para el Real Decreto 1007/2023 y Orden HAC/1177/2024 (Reglamento SIF / Veri*factu España)
 * Soporte para Modo Dual: Modo Veri*factu (remisión voluntaria AEAT) y Modo No Veri*factu (conservación firmada SIF).
 */

export const INITIAL_SIF_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export interface InvoiceSIFPayload {
  emisorNif: string;
  numFactura: string;
  fechaExpedicion: Date | string;
  tipoFactura: "F1" | "R1" | "F2"; // F1=Ordinaria, R1=Rectificativa
  cuotaTotal: number;
  importeTotal: number;
  hashAnterior: string;
  timestampGen?: string;
}

/**
 * Calcula el hash SHA-256 hexadecimal en mayúsculas según las especificaciones del RD 1007/2023.
 */
export async function calculateInvoiceSHA256(payload: InvoiceSIFPayload): Promise<string> {
  const dateObj = typeof payload.fechaExpedicion === "string" ? new Date(payload.fechaExpedicion) : (payload.fechaExpedicion || new Date());
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const fechaFormatted = `${day}-${month}-${year}`;

  const emisorClean = (payload.emisorNif || "").trim().toUpperCase();
  const numClean = (payload.numFactura || "").trim();
  const cuotaStr = (payload.cuotaTotal || 0).toFixed(2);
  const importeStr = (payload.importeTotal || 0).toFixed(2);
  const hashAntClean = (payload.hashAnterior || INITIAL_SIF_HASH).trim().toUpperCase();
  const isoTimestamp = payload.timestampGen || dateObj.toISOString();

  const canonicalString = `IDEmisor=${emisorClean}&NumSerieFactura=${numClean}&FechaExpedicionFactura=${fechaFormatted}&TipoFactura=${payload.tipoFactura}&CuotaTotal=${cuotaStr}&ImporteTotal=${importeStr}&HuellaAnterior=${hashAntClean}&FechaHoraHusoGenRegistro=${isoTimestamp}`;

  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  return simpleSHA256Fallback(canonicalString).toUpperCase();
}

/**
 * Genera la URL normalizada de verificación de la AEAT (Código QR obligatorio en SIF)
 */
export function generateAEATQRUrl(payload: {
  emisorNif: string;
  numFactura: string;
  fechaExpedicion: Date | string;
  importeTotal: number;
  hashActual?: string | null;
  modo?: "verifactu" | "no_verifactu";
}): string {
  const dateObj = typeof payload.fechaExpedicion === "string" ? new Date(payload.fechaExpedicion) : (payload.fechaExpedicion || new Date());
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const fechaFormatted = `${day}-${month}-${year}`;

  const nif = encodeURIComponent((payload.emisorNif || "").trim().toUpperCase());
  const num = encodeURIComponent((payload.numFactura || "").trim());
  const imp = (payload.importeTotal || 0).toFixed(2);
  const hc = (payload.hashActual || "00000000").slice(0, 8);
  const isVerifactu = payload.modo === "verifactu";

  const baseUrl = isVerifactu
    ? "https://www2.agenciatributaria.gob.es/vl/verifactu/validaqr"
    : "https://www2.agenciatributaria.gob.es/vl/validaqr";

  return `${baseUrl}?nif=${nif}&num=${num}&fecha=${fechaFormatted}&importe=${imp}&hc=${hc}`;
}

/**
 * Retorna la leyenda legal requerida por la AEAT según el modo SIF activo
 */
export function getVerifactuLegend(modo: "verifactu" | "no_verifactu" = "no_verifactu"): string {
  if (modo === "verifactu") {
    return "VERI*FACTU - Factura verificable en la sede electrónica de la AEAT. Expedida con remisión instantánea de registro informático.";
  }
  return "Sistema informático de facturación garantizado según RD 1007/2023 (Modo No Veri*factu). Factura expedida con registro de huella digital inalterable SHA-256.";
}

/**
 * Retorna la etiqueta formal del sello SIF
 */
export function getVerifactuBadgeText(modo: "verifactu" | "no_verifactu" = "no_verifactu"): string {
  return modo === "verifactu" ? "VERI*FACTU AEAT" : "Registro Firmado SIF";
}

/**
 * Formatea un hash SHA-256 para mostrar en la factura (ej: A1B2C3D4...E5F67890)
 */
export function formatHashDisplay(hash?: string | null): string {
  if (!hash) return "—";
  if (hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function simpleSHA256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  const getFractionalBits = (n: number) => Math.floor((n - Math.floor(n)) * maxWord);

  let candidate = 2;
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 2));
      }
      k[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 3));
      primeCounter++;
    }
    candidate++;
  }

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 !== 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] | 0);

      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, e, hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}
