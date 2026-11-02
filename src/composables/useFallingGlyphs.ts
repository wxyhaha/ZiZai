import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import homeGlyphPools from '@/data/home-glyph-pools.json'
import { getFont } from '@/data/fonts'
import { useReducedMotion } from './useReducedMotion'

export type FallingFontId = keyof typeof homeGlyphPools.fonts
export type FallingViewport = 'mobile' | 'tablet' | 'desktop'
export type FallingSide = 'left' | 'right'

export interface FallingGlyph {
  id: number
  laneId: number
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
  commonChars: string[]
  longTailChars: string[]
  weight: number
}

interface GlyphLane {
  id: number
  side: FallingSide
  start: number
  end: number
  duration: number
  glyphIds: number[]
}

export interface BuildGlyphsOptions {
  seed: number
  viewport: FallingViewport
  width?: number
  height?: number
  count?: number
  fontWeights?: FallingFontWeights
}

const DEFAULT_FONT_WEIGHTS: Record<FallingFontId, number> = Object.fromEntries(
  Object.keys(homeGlyphPools.fonts).map((id) => [id, 1]),
) as Record<FallingFontId, number>

const LONG_TAIL_GLYPH_PROBABILITY = 0.1

const FONT_POOLS: FontPool[] = Object.entries(homeGlyphPools.fonts)
  .map(([id, entry]) => ({
    id: id as FallingFontId,
    family: `ZiZai Falling ${getFont(id).latinName}`,
    commonChars: Array.from(entry.chars).slice(0, entry.commonHanCount).filter(isHanCharacter),
    longTailChars: Array.from(entry.chars).slice(entry.commonHanCount).filter(isHanCharacter),
    weight: DEFAULT_FONT_WEIGHTS[id as FallingFontId] ?? 1,
  }))
  .filter((pool) => pool.commonChars.length > 0 || pool.longTailChars.length > 0)

const LAYOUT: Record<
  FallingViewport,
  { count: number; safeWidth: number; widthBasis: number; fontMin: number; fontMax: number; driftMin: number; driftMax: number }
> = {
  mobile: { count: 8, safeWidth: 0.5, widthBasis: 320, fontMin: 24, fontMax: 36, driftMin: 8, driftMax: 18 },
  tablet: { count: 12, safeWidth: 0.46, widthBasis: 480, fontMin: 26, fontMax: 44, driftMin: 14, driftMax: 32 },
  desktop: { count: 70, safeWidth: 0.3, widthBasis: 1024, fontMin: 32, fontMax: 64, driftMin: 10, driftMax: 22 },
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

function randomSeparatedPhases(count: number, minGap: number, rand: () => number): number[] {
  if (count === 0) return []

  const gapFloor = Math.min(minGap, 1 / count)
  const remaining = 1 - gapFloor * count
  const weights = Array.from({ length: count }, () => -Math.log(Math.max(rand(), 0.03)))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const phases: number[] = []
  let phase = rand()

  for (const weight of weights) {
    phases.push(phase % 1)
    phase += gapFloor + remaining * (weight / totalWeight)
  }

  return phases
}

function randomLaneSizes(count: number, min: number, max: number, rand: () => number): number[] {
  const sizes = Array.from({ length: count }, () => min + Math.round(rand() * (max - min)))
  if (count > 1 && max > min) {
    sizes[0] = min
    sizes[1] = max
  }
  return shuffle(sizes, rand)
}

function distributeGlyphsAcrossLanes(lanes: GlyphLane[], glyphIds: number[], rand: () => number): void {
  if (lanes.length === 0 || glyphIds.length === 0) return

  const activeLaneCount = Math.min(lanes.length, glyphIds.length)
  const activeLanes = shuffle([...lanes], rand).slice(0, activeLaneCount)
  const averageCount = glyphIds.length / activeLaneCount
  const minCount = Math.max(1, Math.floor(averageCount) - 2)
  const maxCount = Math.ceil(averageCount)
  const counts = Array<number>(activeLaneCount).fill(minCount)
  const weights = Array.from({ length: activeLaneCount }, () => -Math.log(Math.max(rand(), 0.03)))
  let unassigned = glyphIds.length - counts.reduce((sum, count) => sum + count, 0)

  while (unassigned > 0) {
    const candidates = activeLanes.flatMap((_, index) => counts[index] < maxCount ? [index] : [])
    if (candidates.length === 0) break
    const weightTotal = candidates.reduce((sum, index) => sum + weights[index], 0)
    let remainingWeight = rand() * weightTotal
    const target = candidates.find((index) => {
      remainingWeight -= weights[index]
      return remainingWeight < 0
    }) ?? candidates[candidates.length - 1]
    counts[target] += 1
    unassigned -= 1
  }

  let cursor = 0
  activeLanes.forEach((lane, index) => {
    const assigned = glyphIds.slice(cursor, cursor + counts[index])
    lane.glyphIds.push(...shuffle(assigned, rand))
    cursor += counts[index]
  })

  // If every lane reached its cap, safely fill the remaining slots by least-loaded lane.
  while (cursor < glyphIds.length) {
    const targetIndex = counts.indexOf(Math.min(...counts))
    activeLanes[targetIndex].glyphIds.push(glyphIds[cursor])
    counts[targetIndex] += 1
    cursor += 1
  }
}

function marginForViewport(viewport: FallingViewport): number {
  return viewport === 'tablet' ? 12 : 8
}

const HORIZONTAL_POSITION_SLACK = 20

function chooseWeighted(pool: FontPool[], rand: () => number): FontPool {
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
  let remaining = rand() * total
  for (const entry of pool) {
    remaining -= entry.weight
    if (remaining < 0) return entry
  }
  return pool[pool.length - 1]
}

function chooseGlyphCharacter(pool: FontPool, rand: () => number): string {
  const useLongTail = pool.longTailChars.length > 0 && rand() < LONG_TAIL_GLYPH_PROBABILITY
  const candidates = useLongTail || pool.commonChars.length === 0 ? pool.longTailChars : pool.commonChars
  return candidates[Math.floor(rand() * candidates.length)]
}

export function viewportForWidth(width: number): FallingViewport {
  if (width < 480) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function heightBucket(height: number): number {
  return Math.max(240, Math.floor(height / 64) * 64)
}

function widthBucket(width: number): number {
  return Math.max(320, Math.floor(width / 64) * 64)
}

function createLanes(
  width: number,
  layout: (typeof LAYOUT)[FallingViewport],
  viewport: FallingViewport,
  rand: () => number,
): GlyphLane[] {
  const edge = (1 - layout.safeWidth) * width / 2
  const margin = marginForViewport(viewport)
  const driftCoverage = layout.driftMax * (viewport === 'desktop' ? 2 : 1)
  const positionSlack = viewport === 'desktop' ? HORIZONTAL_POSITION_SLACK : 0
  const minimumLaneWidth = layout.fontMin * 1.16 + driftCoverage + margin * 2 + 2 + positionSlack
  // Fit up to four lanes per side while preserving a safe corridor for the smallest PC glyphs.
  const lanesPerSide = viewport === 'desktop'
    ? Math.min(4, Math.max(1, Math.floor(edge / minimumLaneWidth)))
    : 1
  const makeLaneWidths = () => {
    const extraWidth = Math.max(0, edge - lanesPerSide * minimumLaneWidth)
    const widthWeights = Array.from({ length: lanesPerSide }, () => 0.5 + rand() * 1.5)
    const totalWidthWeight = widthWeights.reduce((sum, weight) => sum + weight, 0)
    const laneWidths = widthWeights.map((weight) => minimumLaneWidth + extraWidth * weight / totalWidthWeight)
    if (viewport !== 'desktop') laneWidths[0] = edge
    return laneWidths
  }
  // Draw each side independently so the background does not form a mirrored grid.
  const laneWidthsBySide = { left: makeLaneWidths(), right: makeLaneWidths() }
  // Unique configured periods make every PC lane move at a distinct speed.
  const durations = shuffle([24, 27, 31, 34, 38, 41, 45, 48], rand).slice(0, lanesPerSide * 2)

  return (['left', 'right'] as const).flatMap((side, sideIndex) =>
    Array.from({ length: lanesPerSide }, (_, index) => {
      const laneWidths = laneWidthsBySide[side]
      const offset = laneWidths.slice(0, index).reduce((sum, width) => sum + width, 0)
      const laneWidth = laneWidths[index]
      const start = side === 'left'
        ? edge - offset - laneWidth
        : width - edge + offset
      const id = sideIndex * lanesPerSide + index
      return {
        id,
        side,
        start,
        end: start + laneWidth,
        duration: durations[id],
        glyphIds: [],
      }
    }),
  )
}

export function buildGlyphs(options: BuildGlyphsOptions): FallingGlyph[] {
  const { seed, viewport } = options
  const layout = LAYOUT[viewport]
  const requestedCount = Math.max(0, Math.floor(options.count ?? layout.count))
  if (requestedCount === 0 || FONT_POOLS.length === 0) return []

  const configuredWeights = options.fontWeights ?? DEFAULT_FONT_WEIGHTS
  const weightedPools = FONT_POOLS.map((pool) => ({
    ...pool,
    weight: configuredWeights[pool.id] ?? 0,
  })).filter((pool) => Number.isFinite(pool.weight) && pool.weight > 0)
  if (weightedPools.length === 0) return []

  const rand = createRandom(seed)
  const width = Math.max(320, options.width ?? layout.widthBasis)
  const height = Math.max(240, options.height ?? { mobile: 844, tablet: 768, desktop: 900 }[viewport])
  const lanes = createLanes(width, layout, viewport, rand)
  const maximumGlyphsPerLane = Math.max(
    1,
    Math.floor((1.2 * height * 0.84) / (layout.fontMin * 1.15 + 4)),
  )
  const safeCount = viewport === 'desktop'
    ? lanes.length * maximumGlyphsPerLane
    : requestedCount
  const count = Math.min(requestedCount, safeCount)
  if (count === 0) return []

  const fontPlan = shuffle(
    [
      ...weightedPools.slice(0, count).map((pool) => pool.id),
      ...Array.from({ length: Math.max(0, count - weightedPools.length) }, () =>
        chooseWeighted(weightedPools, rand).id,
      ),
    ],
    rand,
  )

  const lanesById = new Map(lanes.map((lane) => [lane.id, lane]))
  const firstSide: FallingSide = rand() < 0.5 ? 'left' : 'right'
  const sides = shuffle(
    Array.from({ length: count }, (_, index) =>
      (index % 2 === 0 ? firstSide : firstSide === 'left' ? 'right' : 'left') as FallingSide,
    ),
    rand,
  )
  const horizontalPositions = Array<number>(count)
  const animationPhases = Array<number>(count)
  const glyphLaneIds = Array<number>(count)
  for (const side of ['left', 'right'] as const) {
    const sideIds = shuffle(
      sides.flatMap((glyphSide, id) => (glyphSide === side ? [id] : [])),
      rand,
    )
    const sideLanes = lanes.filter((lane) => lane.side === side)
    distributeGlyphsAcrossLanes(sideLanes, sideIds, rand)

    for (const lane of sideLanes) {
      const lanePhases = randomSeparatedPhases(
        lane.glyphIds.length,
        0.84 / Math.max(1, lane.glyphIds.length),
        rand,
      )
      lane.glyphIds.forEach((id, index) => {
        horizontalPositions[id] = rand()
        animationPhases[id] = lanePhases[index]
        glyphLaneIds[id] = lane.id
      })
    }
  }

  const margin = marginForViewport(viewport)
  const driftCoverage = layout.driftMax
  const positionSlack = viewport === 'desktop' ? HORIZONTAL_POSITION_SLACK : 0
  const laneFontLimits = new Map(lanes.map((lane) => {
    const laneWidth = lane.end - lane.start
    const laneGlyphCount = Math.max(1, lane.glyphIds.length)
    const horizontalFontMax = Math.floor(
      (laneWidth - margin * 2 - driftCoverage - 2 - positionSlack) / 1.16 + 1e-6,
    )
    const verticalFontMax = Math.floor((1.2 * height * 0.84 / laneGlyphCount - 4) / 1.15)
    const safeFontMax = Math.min(horizontalFontMax, verticalFontMax)
    const min = viewport === 'desktop' ? layout.fontMin : Math.min(layout.fontMin, safeFontMax)
    return [lane.id, { min, max: Math.max(min, Math.min(layout.fontMax, safeFontMax)) }] as const
  }))
  const glyphSizes = Array<number>(count)
  for (const lane of lanes) {
    const limits = laneFontLimits.get(lane.id)!
    const sizes = randomLaneSizes(lane.glyphIds.length, limits.min, limits.max, rand)
    lane.glyphIds.forEach((id, index) => {
      glyphSizes[id] = sizes[index]
    })
  }

  return Array.from({ length: count }, (_, id) => {
    const fontId = fontPlan[id]
    const pool = weightedPools.find((entry) => entry.id === fontId)!
    const lane = lanesById.get(glyphLaneIds[id])!
    const fontLimits = laneFontLimits.get(lane.id)!
    const size = glyphSizes[id]
    const driftMagnitude = Math.round(layout.driftMin + rand() * (layout.driftMax - layout.driftMin))
    const drift = viewport === 'desktop'
      ? (rand() < 0.5 ? -1 : 1) * driftMagnitude
      : lane.side === 'left' ? -driftMagnitude : driftMagnitude
    const rotationPadding = Math.ceil(size * 0.08)
    const minLeft = lane.start + margin + rotationPadding + (drift < 0 ? driftMagnitude : 0)
    const maxLeft = lane.end - margin - size - rotationPadding - (drift > 0 ? driftMagnitude : 0)
    const leftPx = minLeft + horizontalPositions[id] * Math.max(0, maxLeft - minLeft)
    const left = (leftPx / width) * 100
    const fade = (size - fontLimits.min) / Math.max(1, fontLimits.max - fontLimits.min)

    return {
      id,
      laneId: lane.id,
      char: chooseGlyphCharacter(pool, rand),
      fontId,
      fontFamily: pool.family,
      side: lane.side,
      left: `${left.toFixed(3)}%`,
      size,
      duration: lane.duration,
      delay: -animationPhases[id] * lane.duration,
      drift,
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
  const width = ref(typeof window === 'undefined' ? 1440 : widthBucket(window.innerWidth))
  const prefersReduced = useReducedMotion()
  const seed = options.seed ?? randomSeed()
  const glyphs = computed<FallingGlyph[]>(() => {
    if (prefersReduced.value) return []
    return buildGlyphs({ seed, viewport: viewport.value, width: width.value, height: height.value })
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
      const nextWidth = widthBucket(window.innerWidth)
      if (nextWidth !== width.value) width.value = nextWidth
    })
  }

  onMounted(() => window.addEventListener('resize', measure, { passive: true }))
  onBeforeUnmount(() => {
    cancelAnimationFrame(resizeFrame)
    window.removeEventListener('resize', measure)
  })

  return { glyphs }
}
