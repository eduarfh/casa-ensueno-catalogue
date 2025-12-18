// lib/category-colors.ts
// Cliente-only helper para calcular color de categoría (lee variables CSS si están disponibles)
// Ahora soporta: hex (#rrggbb), rgb(...) y oklch(...)
// Normaliza a hex para evitar errores de hidratación.

const VARIATION_STEPS = 3
const VARIATION_STRENGTH = 0.18

const paletteVars = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-chart-4", // mapea a tu "tertiary/rose"
  "--color-chart-5", // muted
  "--color-popover",
]

const fallbackPalette = [
  "#c7d3c0",
  "#dccebe",
  "#afcbd9",
  "#d9a48f",
  "#b8b8b8",
  "#ffffff",
]

const hashString = (str: string) => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

const isHexColor = (s: string | undefined) => {
  if (!s) return false
  const t = s.trim()
  return /^#([0-9A-Fa-f]{6})$/.test(t)
}

const hexToRgb = (hex: string) => {
  const s = hex.replace("#", "")
  return {
    r: parseInt(s.substring(0, 2), 16),
    g: parseInt(s.substring(2, 4), 16),
    b: parseInt(s.substring(4, 6), 16),
  }
}

const rgbToHex = (r: number, g: number, b: number) => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const hr = clamp(r).toString(16).padStart(2, "0")
  const hg = clamp(g).toString(16).padStart(2, "0")
  const hb = clamp(b).toString(16).padStart(2, "0")
  return `#${hr}${hg}${hb}`.toLowerCase()
}

/** sRGB gamma encode (linear -> srgb 0..1) */
const linearToSRGB = (v: number) => {
  if (v <= 0) return 0
  if (v >= 1) return 1
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
}

/** Convierte una string rgb(...) o rgba(...), o un hex, o oklch(...) a hex (#rrggbb).
 *  Devuelve null si no se puede parsear.
 */
const rgbStringToHex = (s: string | undefined): string | null => {
  if (!s) return null
  const str = s.trim()

  // Already hex
  if (isHexColor(str)) return str.toLowerCase()

  // oklch(...) support
  const oklchMatch = str.match(/oklch\(\s*([^\)]+)\s*\)/i)
  if (oklchMatch) {
    try {
      const hex = oklchStringToHex(oklchMatch[1])
      if (hex) return hex
    } catch (e) {
      // fallthrough to other attempts
    }
  }

  // Extract numeric values from rgb/rgba formats: supports "rgb(199 211 192)" and "rgb(199, 211, 192)" and with alpha
  const nums = str.match(/-?\d+(\.\d+)?/g)
  if (!nums || nums.length < 3) return null
  const r = Number(nums[0])
  const g = Number(nums[1])
  const b = Number(nums[2])
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return rgbToHex(r, g, b)
}

/** Mezcla dos hex por peso (0..1) */
const mixColors = (hexA: string, hexB: string, weight = 0.5) => {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const r = a.r * (1 - weight) + b.r * weight
  const g = a.g * (1 - weight) + b.g * weight
  const bl = a.b * (1 - weight) + b.b * weight
  return rgbToHex(r, g, bl)
}

const expandPaletteWithVariations = (baseColors: string[], steps = VARIATION_STEPS, maxStrength = VARIATION_STRENGTH) => {
  const expanded: string[] = []
  baseColors.forEach((base) => {
    let baseHex = base
    if (!isHexColor(base)) {
      const conv = rgbStringToHex(base)
      if (conv) baseHex = conv
      else {
        // último recurso: empujar tal cual
        expanded.push(base)
        return
      }
    }

    for (let i = steps; i >= 1; i--) {
      const weight = (i / steps) * maxStrength
      expanded.push(mixColors(baseHex, "#000000", weight))
    }

    expanded.push(baseHex)

    for (let i = 1; i <= steps; i++) {
      const weight = (i / steps) * maxStrength
      expanded.push(mixColors(baseHex, "#ffffff", weight))
    }
  })
  return expanded
}

/** Calcula texto claro/oscuro según luminancia relativa usando fórmulas Oklab→sRGB convertidas a hex: */
const getTextColorForBackground = (hexOrRgb: string) => {
  let hex = hexOrRgb
  if (!hex) return "text-gray-800"
  if (!isHexColor(hex)) {
    const conv = rgbStringToHex(hex)
    if (conv) hex = conv
    else return "text-gray-800"
  }

  const hexClean = hex.slice(1)
  const r = parseInt(hexClean.substring(0, 2), 16)
  const g = parseInt(hexClean.substring(2, 4), 16)
  const b = parseInt(hexClean.substring(4, 6), 16)

  // Calcular luminancia relativa (sRGB -> linear -> luminance)
  const srgbToLinear = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }

  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return luminance > 0.5 ? "text-gray-800" : "text-white"
}

/* --------------------------
   OKLCH -> HEX helpers
   Based on the Oklab/Oklch conversion (B. Ottosson) and common JS ports.
   Reference: https://bottosson.github.io/posts/oklab/ and implementations derived from it.
   -------------------------- */

/** Parse the inside of "oklch(...)" and return a hex string or null.
 *  Accepts formats like:
 *   "84% 0.04 130"
 *   "0.84 0.04 130deg"
 *   "84% 0.04 130deg / 1" (we ignore alpha)
 */
function oklchStringToHex(inner: string): string | null {
  // remove optional slash alpha part
  const parts = inner.split("/")
  const main = parts[0].trim()

  // match numbers, percentages, deg
  // e.g. ["84%", "0.04", "130"]
  const tokens = main.match(/-?\d+(\.\d+)?%?|[+-]?\d+(\.\d+)?deg?/g)
  if (!tokens || tokens.length < 3) return null

  // L
  let L = tokens[0]
  let lVal = parseFloat(L.replace("%", ""))
  if (L.includes("%")) lVal = lVal / 100 // percentage -> 0..1
  // If L given as 0..1 (no %), assume it's already 0..1 if <=1, otherwise if raw like 84 then treat as percent
  if (!L.includes("%") && lVal > 1) lVal = lVal / 100

  // C
  let C = tokens[1]
  let cVal = parseFloat(C)
  // Note: CSS historically maps 0.4 -> 100% for C in some docs; but authors often use small values like 0.04.
  // We will use the numeric value directly (as in your globals), which works visually consistent.

  // H (degrees)
  let H = tokens[2]
  let hVal = parseFloat(H.replace("deg", ""))
  if (Number.isNaN(hVal)) hVal = 0

  return oklchToHex(lVal, cVal, hVal)
}

/** Convert OKLCH (L 0..1, C, h degrees) -> hex (#rrggbb)
 * Implementation uses the Oklab <-> linear sRGB matrices and gamma encode.
 * Based on the reference formulas (B. Ottosson).
 */
function oklchToHex(L: number, C: number, h: number): string | null {
  // Convert to Oklab
  const hRad = (h * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // Oklab -> linear sRGB pipeline
  // Step 1: compute intermediate l_, m_, s_
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  // Step 2: cube to get l,m,s
  const l = Math.pow(l_, 3)
  const m = Math.pow(m_, 3)
  const s = Math.pow(s_, 3)

  // Step 3: linear RGB from l,m,s using inverse matrices (constants from reference)
  // These coefficients come from the Oklab -> linear sRGB conversion.
  let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  // clamp small negatives to 0 for numeric stability
  const clampLinear = (v: number) => Math.max(0, v)

  R = clampLinear(R)
  G = clampLinear(G)
  B = clampLinear(B)

  // gamma-encode to sRGB 0..1
  const sr = linearToSRGB(R)
  const sg = linearToSRGB(G)
  const sb = linearToSRGB(B)

  // convert to 0..255
  const r255 = Math.round(Math.min(1, Math.max(0, sr)) * 255)
  const g255 = Math.round(Math.min(1, Math.max(0, sg)) * 255)
  const b255 = Math.round(Math.min(1, Math.max(0, sb)) * 255)

  return rgbToHex(r255, g255, b255)
}

/* --------------------------
   Public API
   -------------------------- */

/**
 * getCategoryColor(category)
 * - Siempre devuelve { background: '#rrggbb', textClass: 'text-...' }
 * - Intenta resolver variables CSS (--color-*) en cliente; si la variable está en rgb(...), oklch(...) o hex la convierte a hex.
 * - Es seguro usar desde componentes client-side.
 */
export function getCategoryColor(category = "") {
  let resolvedPalette = fallbackPalette.slice()

  try {
    if (typeof window !== "undefined") {
      const root = getComputedStyle(document.documentElement)
      const resolved = paletteVars.map((v, i) => {
        const value = root.getPropertyValue(v).trim()
        if (!value) return fallbackPalette[i] || "#e5e7eb"
        // si viene oklch(...), rgb(...) o hex
        const conv = rgbStringToHex(value)
        if (conv) return conv
        // último recurso
        return fallbackPalette[i] || "#e5e7eb"
      })
      resolvedPalette = resolved
    }
  } catch (e) {
    resolvedPalette = fallbackPalette.slice()
  }

  const expanded = expandPaletteWithVariations(resolvedPalette, VARIATION_STEPS, VARIATION_STRENGTH)

  if (!category) {
    const bg = expanded[0] || fallbackPalette[0]
    const bgHex = isHexColor(bg) ? bg.toLowerCase() : (rgbStringToHex(bg) || fallbackPalette[0].toLowerCase())
    return { background: bgHex, textClass: getTextColorForBackground(bgHex) }
  }

  const idx = hashString(category) % expanded.length
  const candidate = expanded[idx]
  const bgHex = isHexColor(candidate) ? candidate.toLowerCase() : (rgbStringToHex(candidate) || fallbackPalette[idx % fallbackPalette.length].toLowerCase())
  const textClass = getTextColorForBackground(bgHex)
  return { background: bgHex, textClass }
}
export default getCategoryColor 

