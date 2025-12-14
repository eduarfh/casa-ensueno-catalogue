// lib/category-colors.ts
// Cliente-only helper para calcular color de categoría (lee variables CSS si están disponibles)
// Normaliza rgb(...) a hex para evitar errores de hidratación.

const VARIATION_STEPS = 3
const VARIATION_STRENGTH = 0.18

// Usamos las variables que sí existen en tu globals.css / @theme inline.
// Estas variables suelen resolverse como 'rgb(...)' por getComputedStyle.
const paletteVars = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-chart-4", // mapea a tu "tertiary/rose"
  "--color-chart-5", // muted
  "--color-popover",
]

// Fallback en hex (si no existe la variable o no se puede parsear)
const fallbackPalette = [
  "#c7d3c0", // primary
  "#dccebe", // secondary
  "#afcbd9", // accent
  "#d9a48f", // tertiary-ish
  "#b8b8b8", // muted
  "#ffffff", // popover / light
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

/** Convierte 'rgb(r,g,b)', 'rgb(r g b)', 'rgba(...)' u otros formatos numéricos a hex. Devuelve null si no es válido */
const rgbStringToHex = (s: string | undefined): string | null => {
  if (!s) return null
  const str = s.trim()
  // Si ya es hex simple
  if (isHexColor(str)) return str.toLowerCase()

  // Extrae números (soporta comas o espacios): "rgb(199 211 192)", "rgb(199, 211, 192)" o "rgba(199,211,192,0.5)"
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
        // último recurso: empujar tal cual (aunque idealmente no debería pasar)
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

const getTextColorForBackground = (hexOrRgb: string) => {
  // Aceptamos hex o rgb; convertimos a hex para cálculo fiable
  let hex = hexOrRgb
  if (!hex) return "text-gray-800"
  if (!isHexColor(hex)) {
    const conv = rgbStringToHex(hex)
    if (conv) hex = conv
    else return "text-gray-800"
  }

  // ahora hex es de la forma #rrggbb
  const hexClean = hex.slice(1)
  const r = parseInt(hexClean.substring(0, 2), 16)
  const g = parseInt(hexClean.substring(2, 4), 16)
  const b = parseInt(hexClean.substring(4, 6), 16)

  const comp = (c: number) => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  }
  const R = comp(r)
  const G = comp(g)
  const B = comp(b)
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return luminance > 0.5 ? "text-gray-800" : "text-white"
}

/**
 * getCategoryColor(category)
 * - Siempre devuelve { background: '#rrggbb', textClass: 'text-...' }
 * - Intenta resolver variables CSS (--color-*) en cliente; si la variable está en rgb(...) la convierte a hex.
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
        // si viene rgb(...) o 'rgb(...)' con espacios, convertimos
        const conv = rgbStringToHex(value)
        if (conv) return conv
        // si es hex directo
        if (isHexColor(value)) return value.toLowerCase()
        // fallback
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
