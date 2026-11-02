import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import homeGlyphPools from '@/data/home-glyph-pools.json'
import { getFont } from '@/data/fonts'
import { useReducedMotion } from './useReducedMotion'

export type FallingFontId = keyof typeof homeGlyphPools.fonts
export type FallingViewport = 'mobile' | 'tablet' | 'desktop'
export type FallingSide = 'left' | 'right'

export interface FallingGlyph {
  id: number
  char: string
  fontId: FallingFontId
  fontFamily: string
  side: FallingSide
  left: string
  size: number
  duration: number
  delay: number
  drift: number
  opacity: number
  rotation: number
}

export interface FallingFontWeights {
  [fontId: string]: number
}

interface FontPool {
  id: FallingFontId
  family: string
  chars: string[]
  weight: number
}

export interface BuildGlyphsOptions {
  seed: number
  viewport: FallingViewport
  height?: number
  count?: number
  fontWeights?: FallingFontWeights
}

const DEFAULT_FONT_WEIGHTS: Record<FallingFontId, number> = Object.fromEntries(
  Object.keys(homeGlyphPools.fonts).map((id) => [id, 1]),
) as Record<FallingFontId, number>

const FONT_POOLS: FontPool[] = Object.entries(homeGlyphPools.fonts)
  .map(([id, entry]) => ({
    id: id as FallingFontId,
    family: `ZiZai Falling ${getFont(id).latinName}`,
    chars: Array.from(entry.chars).filter(isHanCharacter),
    weight: DEFAULT_FONT_WEIGHTS[id as FallingFontId] ?? 1,
  }))
  .filter((pool) => pool.chars.length > 0)

const LAYOUT: Record<
  FallingViewport,
  { count: number; safeWidth: number; widthBasis: number; fontMin: number; fontMax: number; driftMin: number; driftMax: number }
> = {
  mobile: { count: 8, safeWidth: 0.5, widthBasis: 320, fontMin: 24, fontMax: 36, driftMin: 8, driftMax: 18 },
  tablet: { count: 12, safeWidth: 0.46, widthBasis: 480, fontMin: 26, fontMax: 44, driftMin: 14, driftMax: 32 },
  desktop: { count: 24, safeWidth: 0.3, widthBasis: 1024, fontMin: 32, fontMax: 64, driftMin: 20, driftMax: 48 },
}

function isHanCharacter(char: string): boolean {
  const codepoint = char.codePointAt(0)
  if (codepoint === undefined) return false
  return (
    (codepoint >= 0x3400 && codepoint <= 0x4dbf) ||
    (codepoint >= 0x4e00 && codepoint <= 0x9fff) ||
    (codepoint >= 0xf900 && codepoint <= 0xfaff) ||
    (codepoint >= 0x20000 && codepoint <= 0x2a6df) ||
    (codepoint >= 0x2a700 && codepoint <= 0x2b73f) ||
    (codepoint >= 0x2b740 && codepoint <= 0x2b81f) ||
    (codepoint >= 0x2b820 && codepoint <= 0x2ceaf) ||
    (codepoint >= 0x2ceb0 && codepoint <= 0x2ebef) ||
    (codepoint >= 0x2ebf0 && codepoint <= 0x2ee5f) ||
    (codepoint >= 0x2f800 && codepoint <= 0x2fa1f) ||
    (codepoint >= 0x30000 && codepoint <= 0x3134f) ||
    (codepoint >= 0x31350 && codepoint <= 0x323af) ||
    (codepoint >= 0x323b0 && codepoint <= 0x3347f)
  )
}

function createRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function randomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }
  return Math.floor(Math.random() * 0x100000000) >>> 0
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const next = Math.floor(rand() * (index + 1))
    ;[items[index], items[next]] = [items[next], items[index]]
  }
  return items
}

function chooseWeighted(pool: FontPool[], rand: () => number): FontPool {
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
  let remaining = rand() * total
  for (const entry of pool) {
    remaining -= entry.weight
    if (remaining < 0) return entry
  }
  return pool[pool.length - 1]
}

export function viewportForWidth(width: number): FallingViewport {
  if (width < 480) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function heightBucket(height: number): number {
  return Math.max(240, Math.round(height / 64) * 64)
}

export function buildGlyphs(options: BuildGlyphsOptions): FallingGlyph[] {
  const { seed, viewport } = options
  const layout = LAYOUT[viewport]
  const count = Math.max(0, Math.floor(options.count ?? layout.count))
  if (count === 0 || FONT_POOLS.length === 0) return []

  const configuredWeights = options.fontWeights ?? DEFAULT_FONT_WEIGHTS
  const weightedPools = FONT_POOLS.map((pool) => ({
    ...pool,
    weight: configuredWeights[pool.id] ?? 0,
  })).filter((pool) => Number.isFinite(pool.weight) && pool.weight > 0)
  if (weightedPools.length === 0) return []

  const rand = createRandom(seed)
  const fontPlan = shuffle(
    [
      ...weightedPools.slice(0, count).map((pool) => pool.id),
      ...Array.from({ length: Math.max(0, count - weightedPools.length) }, () =>
        chooseWeighted(weightedPools, rand).id,
      ),
    ],
    rand,
  )

  const firstSide: FallingSide = rand() < 0.5 ? 'left' : 'right'
  const sides = shuffle(
    Array.from({ length: count }, (_, index) =>
      (index % 2 === 0 ? firstSide : firstSide === 'left' ? 'right' : 'left') as FallingSide,
    ),
    rand,
  )
  const horizontalPositions = Array<number>(count)
  const animationPhases = Array<number>(count)
  for (const side of ['left', 'right'] as const) {
    const sideIds = sides.flatMap((glyphSide, id) => (glyphSide === side ? [id] : []))
    const sidePositions = shuffle(
      sideIds.map((_, index) => (index + rand()) / sideIds.length),
      rand,
    )
    const sidePhases = shuffle(
      sideIds.map((_, index) => (index + 0.5 + (rand() * 2 - 1) * 0.08) / sideIds.length),
      rand,
    )
    sideIds.forEach((id, index) => {
      horizontalPositions[id] = sidePositions[index]
      animationPhases[id] = sidePhases[index]
    })
  }
  const sideDurations: Record<FallingSide, number> = {
    left: 24 + rand() * 24,
    right: 24 + rand() * 24,
  }
  const height = Math.max(240, options.height ?? { mobile: 844, tablet: 768, desktop: 900 }[viewport])
  const sideCount = Math.ceil(count / 2)
  const safeFontMax = Math.floor((1.2 * height * 0.84 / sideCount - 4) / 1.15)
  const fontMin = Math.min(layout.fontMin, safeFontMax)
  const fontMax = Math.max(fontMin, Math.min(layout.fontMax, safeFontMax))

  return Array.from({ length: count }, (_, id) => {
    const fontId = fontPlan[id]
    const pool = weightedPools.find((entry) => entry.id === fontId)!
    const size = fontMin + Math.round(rand() * (fontMax - fontMin))
    const drift = Math.round(layout.driftMin + rand() * (layout.driftMax - layout.driftMin))
    const margin = viewport === 'mobile' ? 8 : viewport === 'tablet' ? 12 : 16
    const edge = ((1 - layout.safeWidth) / 2) * layout.widthBasis
    const halfChar = size + drift + margin
    const minLeft = (margin / layout.widthBasis) * 100
    const maxLeft = ((edge - halfChar) / layout.widthBasis) * 100
    const clampedMaxLeft = Math.max(minLeft, maxLeft)
    const safeLeft = minLeft + horizontalPositions[id] * (clampedMaxLeft - minLeft)
    const left = sides[id] === 'left' ? safeLeft : 100 - safeLeft - (size / layout.widthBasis) * 100
    const duration = sideDurations[sides[id]]
    const fade = (size - fontMin) / Math.max(1, fontMax - fontMin)

    return {
      id,
      char: pool.chars[Math.floor(rand() * pool.chars.length)],
      fontId,
      fontFamily: pool.family,
      side: sides[id],
      left: `${left.toFixed(2)}%`,
      size,
      duration,
      delay: -animationPhases[id] * duration,
      drift: (sides[id] === 'left' ? -1 : 1) * drift,
      opacity: Number((0.55 - fade * 0.1).toFixed(3)),
      rotation: Number((-8 + rand() * 16).toFixed(2)),
    }
  })
}

export function useFallingGlyphs(options: { seed?: number } = {}) {
  const viewport = ref<FallingViewport>(
    typeof window === 'undefined' ? 'desktop' : viewportForWidth(window.innerWidth),
  )
  const height = ref(typeof window === 'undefined' ? 900 : heightBucket(window.innerHeight))
  const prefersReduced = useReducedMotion()
  const seed = options.seed ?? randomSeed()
  const glyphs = computed<FallingGlyph[]>(() => {
    if (prefersReduced.value) return []
    return buildGlyphs({ seed, viewport: viewport.value, height: height.value })
  })

  let resizeFrame = 0
  const measure = () => {
    if (typeof window === 'undefined' || resizeFrame !== 0) return
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0
      // Only crossing a width or coarse height band regenerates the scene.
      // Ordinary resize events do not reroll glyphs repeatedly.
      const nextViewport = viewportForWidth(window.innerWidth)
      if (nextViewport !== viewport.value) viewport.value = nextViewport
      const nextHeight = heightBucket(window.innerHeight)
      if (nextHeight !== height.value) height.value = nextHeight
    })
  }

  onMounted(() => window.addEventListener('resize', measure, { passive: true }))
  onBeforeUnmount(() => {
    cancelAnimationFrame(resizeFrame)
    window.removeEventListener('resize', measure)
  })

  return { glyphs }
}
