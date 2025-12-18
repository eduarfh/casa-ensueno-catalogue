// lib/category-colors.ts
// Versión con debug + fallback hash->HSL si la paleta resuelta es muy homogénea.
// No toca :root ni variables globales.

const VARIATION_STEPS = 5
const VARIATION_STRENGTH = 0.28

const paletteVars = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-chart-4",
  "--color-chart-5",
  "--color-popover",
]

const fallbackPalette = [
  "#bfe6df",
  "#f6c28b",
  "#cfeaf0",
  "#f7b7d3",
  "#e2a15a",
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

const rgbStringToHex = (s: string | undefined): string | null => {
  if (!s) return null
  const str = s.trim()
  if (isHexColor(str)) return str.toLowerCase()

  const oklchMatch = str.match(/oklch\(\s*([^\)]+)\s*\)/i)
  if (oklchMatch) {
    try {
      const hex = oklchStringToHex(oklchMatch[1])
      if (hex) return hex
    } catch (e) {}
  }

  const nums = str.match(/-?\d+(\.\d+)?/g)
  if (!nums || nums.length < 3) return null
  const r = Number(nums[0])
  const g = Number(nums[1])
  const b = Number(nums[2])
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return rgbToHex(r, g, b)
}

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

/** Devuelve '#000000' o '#ffffff' según la luminancia relativa de `hexOrRgb` */
const getTextHexForBackground = (hexOrRgb: string) => {
  let hex = hexOrRgb
  if (!hex) return "#000000"
  if (!isHexColor(hex)) {
    const conv = rgbStringToHex(hex)
    if (conv) hex = conv
    else return "#000000"
  }

  const hexClean = hex.slice(1)
  const r = parseInt(hexClean.substring(0, 2), 16)
  const g = parseInt(hexClean.substring(2, 4), 16)
  const b = parseInt(hexClean.substring(4, 6), 16)

  const srgbToLinear = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }

  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

/* OKLCH helpers (sin cambios) */
function oklchStringToHex(inner: string): string | null {
  const parts = inner.split("/")
  const main = parts[0].trim()
  const tokens = main.match(/-?\d+(\.\d+)?%?|[+-]?\d+(\.\d+)?deg?/g)
  if (!tokens || tokens.length < 3) return null
  let L = tokens[0]
  let lVal = parseFloat(L.replace("%", ""))
  if (L.includes("%")) lVal = lVal / 100
  if (!L.includes("%") && lVal > 1) lVal = lVal / 100
  let C = tokens[1]
  let cVal = parseFloat(C)
  let H = tokens[2]
  let hVal = parseFloat(H.replace("deg", ""))
  if (Number.isNaN(hVal)) hVal = 0
  return oklchToHex(lVal, cVal, hVal)
}

function oklchToHex(L: number, C: number, h: number): string | null {
  const hRad = (h * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = Math.pow(l_, 3)
  const m = Math.pow(m_, 3)
  const s = Math.pow(s_, 3)
  let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  const clampLinear = (v: number) => Math.max(0, v)
  R = clampLinear(R)
  G = clampLinear(G)
  B = clampLinear(B)
  const sr = linearToSRGB(R)
  const sg = linearToSRGB(G)
  const sb = linearToSRGB(B)
  const r255 = Math.round(Math.min(1, Math.max(0, sr)) * 255)
  const g255 = Math.round(Math.min(1, Math.max(0, sg)) * 255)
  const b255 = Math.round(Math.min(1, Math.max(0, sb)) * 255)
  return rgbToHex(r255, g255, b255)
}

/** Helper: calcula luminancia promedio (0..1) de un hex */
const hexLuminance = (hex: string) => {
  try {
    const { r, g, b } = hexToRgb(hex)
    const srgbToLinear = (v: number) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    const R = srgbToLinear(r)
    const G = srgbToLinear(g)
    const B = srgbToLinear(b)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  } catch (e) {
    return 0.0
  }
}

/** Convert HSL (h 0..360, s 0..1, l 0..1) to hex */
const hslToHex = (h: number, s: number, l: number) => {
  // HSL -> RGB (0..1)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0]
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0]
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x]
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c]
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  const m = l - c / 2
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  return rgbToHex(r, g, b)
}

/** Generate pastel-like color from seed string (guarantees distinct hues) */
const colorFromHashHsl = (seed: string) => {
  const h = hashString(seed) % 360
  const s = 0.48 + (hashString(seed + "s") % 20) / 100 // 0.48 .. 0.67
  const l = 0.72 + (hashString(seed + "l") % 12) / 100 // 0.72 .. 0.83 (pastel)
  return hslToHex(h, s, l)
}

/** Public API — devuelve background (hex) y textColor (hex) */
export function getCategoryColor(category = "") {
  let resolvedPalette = fallbackPalette.slice()

  try {
    if (typeof window !== "undefined") {
      const root = getComputedStyle(document.documentElement)
      const resolved = paletteVars.map((v, i) => {
        const value = root.getPropertyValue(v).trim()
        if (!value) return fallbackPalette[i] || "#e5e7eb"
        const conv = rgbStringToHex(value)
        if (conv) return conv
        return fallbackPalette[i] || "#e5e7eb"
      })
      resolvedPalette = resolved.map((c, i) => (c ? c : fallbackPalette[i] || "#e5e7eb"))
    }
  } catch (e) {
    resolvedPalette = fallbackPalette.slice()
  }

  // Expand palette
  let expanded = expandPaletteWithVariations(resolvedPalette, VARIATION_STEPS, VARIATION_STRENGTH)

  // Normalize/convert to hex and compute unique count
  const normalized = expanded
    .map((c) => (isHexColor(c) ? c.toLowerCase() : rgbStringToHex(c) || c))
    .filter(Boolean) as string[]

  const uniqueSet = Array.from(new Set(normalized))
  // Debug: palette resolved + expanded summary
  // eslint-disable-next-line no-console
  console.debug(
    "[getCategoryColor dbg] resolvedPalette:",
    resolvedPalette,
    " | expanded len:",
    normalized.length,
    " | unique base count:",
    uniqueSet.length,
  )

  // If palette is too small/homogeneous (e.g. unique colors < 3), fallback to HSL-hash generation
  const useHashFallback = uniqueSet.length < 3

  if (useHashFallback) {
    // Debug note
    // eslint-disable-next-line no-console
    console.debug("[getCategoryColor dbg] Using HSL-hash fallback because palette too homogeneous.")
  }

  if (!category) {
    if (useHashFallback) {
      const bg = colorFromHashHsl("default")
      return { background: bg, textColor: getTextHexForBackground(bg) }
    }
    const bg = normalized[0] || fallbackPalette[0]
    const bgHex = isHexColor(bg) ? bg.toLowerCase() : (rgbStringToHex(bg) || fallbackPalette[0].toLowerCase())
    return { background: bgHex, textColor: getTextHexForBackground(bgHex) }
  }

  if (useHashFallback) {
    const bg = colorFromHashHsl(String(category))
    return { background: bg, textColor: getTextHexForBackground(bg) }
  }

  // Use hash to pick candidate from expanded list
  const idx = hashString(String(category)) % normalized.length
  const candidate = normalized[idx] || normalized[0] || fallbackPalette[0]
  const bgHex = isHexColor(candidate) ? candidate.toLowerCase() : (rgbStringToHex(candidate) || fallbackPalette[0].toLowerCase())
  // Debug: chosen candidate for this seed
  // eslint-disable-next-line no-console
  console.debug("[getCategoryColor dbg] seed:", String(category), " idx:", idx, " candidate:", bgHex)
  const textColor = getTextHexForBackground(bgHex)
  return { background: bgHex, textColor }
}

export default getCategoryColor
