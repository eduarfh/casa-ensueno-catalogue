// lib/category-colors.ts
// Robust category color resolver (TypeScript-friendly).
// - soporta oklch(...), rgb(...), #hex
// - normaliza a hex y aplica clamp "pastel-safe"
// - devuelve { background: '#rrggbb', textColor: '#rrggbb' }

const VARIATION_STEPS = 3
const VARIATION_STRENGTH = 0.18

const babyVars = [
  "--baby-blue",
  "--baby-orange",
  "--baby-pink",
  "--baby-teal",
  "--baby-bright-pink",
  "--baby-peach",
]

const mainPaletteVars = [
  "--primary",
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-chart-4",
  "--color-chart-5",
  "--color-popover",
]

// Fallback palette (suave)
const fallbackPalette = [
  "#bee4e7",
  "#f49f51",
  "#ffd4e5",
  "#95c7c3",
  "#f490b9",
  "#f7ccad",
]

const hashString = (str: string) => {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return Math.abs(h)
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

/* rgb(...) parser -> hex */
const rgbStringToHex = (s: string | undefined): string | null => {
  if (!s) return null
  const str = s.trim()
  if (isHexColor(str)) return str.toLowerCase()
  const m = str.match(/rgba?\(([^)]+)\)/i)
  if (!m) return null
  const parts = m[1].split(",").map((p) => p.trim())
  if (parts.length < 3) return null
  const r = Number(parts[0])
  const g = Number(parts[1])
  const b = Number(parts[2])
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return rgbToHex(r, g, b)
}

/* OKLCH -> hex helpers */
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

const linearToSRGB = (v: number) => {
  if (v <= 0) return 0
  if (v >= 1) return 1
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
}

/* mezcla de colores (ahora declarado antes de su uso) */
const mixColors = (hexA: string, hexB: string, weight = 0.5) => {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const r = a.r * (1 - weight) + b.r * weight
  const g = a.g * (1 - weight) + b.g * weight
  const bl = a.b * (1 - weight) + b.b * weight
  return rgbToHex(r, g, bl)
}

/* expand palette */
const expandPaletteWithVariations = (baseColors: string[], steps = VARIATION_STEPS, maxStrength = VARIATION_STRENGTH) => {
  const expanded: string[] = []
  baseColors.forEach((base) => {
    let baseHex = base
    if (!isHexColor(base)) {
      const conv = rgbStringToHex(base) || tryOklchToHex(base)
      if (conv) baseHex = conv
      else {
        // skip unknown entries
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

/* hex <-> hsl (for clamping) */
const hexToHsl = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break
      case gg: h = (bb - rr) / d + 2; break
      default: h = (rr - gg) / d + 4; break
    }
    h = h * 60
  }
  return { h, s, l }
}

const hslToHexLocal = (h:number,s:number,l:number) => {
  const clamp01=(v:number)=>Math.max(0,Math.min(1,v))
  s=clamp01(s); l=clamp01(l)
  const c=(1-Math.abs(2*l-1))*s
  const hp=h/60; const x=c*(1-Math.abs((hp%2)-1))
  let r1=0,g1=0,b1=0
  if(hp>=0 && hp<1)[r1,g1,b1]=[c,x,0]
  else if(hp>=1 && hp<2)[r1,g1,b1]=[x,c,0]
  else if(hp>=2 && hp<3)[r1,g1,b1]=[0,c,x]
  else if(hp>=3 && hp<4)[r1,g1,b1]=[0,x,c]
  else if(hp>=4 && hp<5)[r1,g1,b1]=[x,0,c]
  else [r1,g1,b1]=[c,0,x]
  const m=l-c/2
  const r=Math.round((r1+m)*255), g=Math.round((g1+m)*255), b=Math.round((b1+m)*255)
  return rgbToHex(r,g,b)
}

/* clamp pastel */
const clampPastel = (h:number,s:number,l:number) => {
  const sC = Math.max(0.18, Math.min(0.58, s))
  const lC = Math.max(0.58, Math.min(0.86, l))
  const hN = ((h%360) + 360) % 360
  return { h: hN, s: sC, l: lC }
}

/* try oklch */
const tryOklchToHex = (s:string | undefined): string | null => {
  if (!s) return null
  const m = s.trim().match(/oklch\(\s*([^\)]+)\s*\)/i)
  if (!m) return null
  try { return oklchStringToHex(m[1]) } catch { return null }
}

/* readable text color */
const getTextHexForBackground = (hexOrRgb:string) => {
  let hex = hexOrRgb
  if (!hex) return "#000000"
  if (!isHexColor(hex)) {
    const conv = rgbStringToHex(hex) || tryOklchToHex(hex)
    if (conv) hex = conv
    else return "#000000"
  }
  const { r,g,b } = hexToRgb(hex)
  const srgbToLinear = (v:number)=>{ const s=v/255; return s<=0.04045? s/12.92 : Math.pow((s+0.055)/1.055,2.4) }
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b)
  const lum = 0.2126*R + 0.7152*G + 0.0722*B
  return lum > 0.5 ? "#000000" : "#ffffff"
}

/* pastel hash fallback */
const colorFromHashPastel = (seed:string) => {
  const h = hashString(seed) % 360
  const s = 0.30 + ((hashString(seed + "s") % 20) / 100)
  const l = 0.66 + ((hashString(seed + "l") % 12) / 100)
  const cl = clampPastel(h,s,l)
  return hslToHexLocal(cl.h, cl.s, cl.l)
}

/** Public API */
export function getCategoryColor(category = ""): { background: string; textColor: string } {
  let resolvedPalette = fallbackPalette.slice()

  try {
    if (typeof window !== "undefined") {
      const root = getComputedStyle(document.documentElement)
      const babyResolved = babyVars.map(v => root.getPropertyValue(v).trim()).filter(Boolean)
      const mainResolved = mainPaletteVars.map(v => root.getPropertyValue(v).trim()).filter(Boolean)

      const converted: string[] = []
      const pushMaybe = (val:string) => {
        if (!val) return
        const c1 = rgbStringToHex(val)
        if (c1) { converted.push(c1); return }
        const c2 = tryOklchToHex(val)
        if (c2) { converted.push(c2); return }
        if (isHexColor(val)) { converted.push(val.toLowerCase()); return }
      }
      babyResolved.forEach(pushMaybe)
      mainResolved.forEach(pushMaybe)

      if (converted.length > 0) {
        resolvedPalette = converted.concat(fallbackPalette)
      } else {
        resolvedPalette = fallbackPalette.slice()
      }
    }
  } catch (e) {
    resolvedPalette = fallbackPalette.slice()
  }

  const expanded = expandPaletteWithVariations(resolvedPalette, VARIATION_STEPS, VARIATION_STRENGTH)

  const normalized = expanded
    .map(c => {
      const hex = isHexColor(c) ? c.toLowerCase() : (rgbStringToHex(c) || tryOklchToHex(c))
      if (!hex) return null
      const hsl = hexToHsl(hex)
      const cl = clampPastel(hsl.h, hsl.s, hsl.l)
      return hslToHexLocal(cl.h, cl.s, cl.l)
    })
    .filter(Boolean) as string[]

  const useHashFallback = normalized.length < 3

  if (!category) {
    if (useHashFallback) {
      const bg = colorFromHashPastel("default")
      return { background: bg, textColor: getTextHexForBackground(bg) }
    }
    const bg = normalized[0] || fallbackPalette[0]
    return { background: bg, textColor: getTextHexForBackground(bg) }
  }

  if (useHashFallback) {
    const bg = colorFromHashPastel(String(category))
    return { background: bg, textColor: getTextHexForBackground(bg) }
  }

  const idx = hashString(String(category)) % normalized.length
  const candidate = normalized[idx] || normalized[0] || fallbackPalette[0]
  return { background: candidate, textColor: getTextHexForBackground(candidate) }
}

export default getCategoryColor
