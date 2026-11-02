import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import pools from '@/data/home-glyph-pools.json'
import { getFont } from '@/data/fonts'
import {
  buildGlyphs,
  viewportForWidth,
  useFallingGlyphs,
  type FallingViewport,
} from '@/composables/useFallingGlyphs'

const FONT_IDS = Object.keys(pools.fonts) as Array<keyof typeof pools.fonts>
const FONT_ASSETS = Object.keys(import.meta.glob('../src/assets/fonts/home/*.woff2'))
const HOME_FONT_STYLES = Object.keys(import.meta.glob('../src/styles/fonts/home-glyphs.scss'))

/** `useReducedMotion` uses lifecycle hooks and must run in a component setup. */
function harness(seed?: number) {
  let api: ReturnType<typeof useFallingGlyphs> | null = null
  const Comp = defineComponent({
    setup() {
      api = useFallingGlyphs(seed === undefined ? {} : { seed })
      return () => h('div', api!.glyphs.value.length)
    },
  })
  return { Comp, get: () => api! }
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function isHan(codepoint: number): boolean {
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

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('首页落字资源', () => {
  it('首页字体样式和四款字体资源都来自独立的 home 子集目录', () => {
    expect(HOME_FONT_STYLES).toHaveLength(1)
    expect(FONT_ASSETS).toHaveLength(4)
    expect(FONT_ASSETS.every((path) => path.includes('/home/falling-') && !path.includes('-full'))).toBe(true)
  })

  it('每款首页字体都有实际 cmap 抽样池与对应的专用 WOFF2 子集', () => {
    expect(FONT_IDS).toHaveLength(4)
    expect(pools.uniqueHanCount).toBe(
      new Set(FONT_IDS.flatMap((id) => Array.from(pools.fonts[id].chars))).size,
    )
    expect(pools.totalFontCharacterMappings).toBeGreaterThanOrEqual(3200)

    for (const id of FONT_IDS) {
      const entry = pools.fonts[id]
      const chars = Array.from(entry.chars)
      const assetPath = FONT_ASSETS.find((path) => path.endsWith(`/${entry.file}`))

      expect(chars).toHaveLength(entry.hanCount)
      expect(chars).toHaveLength(1200)
      expect(entry.commonHanCount).toBe(1000)
      expect(new Set(chars).size).toBe(chars.length)
      expect(chars.every((char) => isHan(char.codePointAt(0)!))).toBe(true)
      expect(entry.sourceHanCount).toBeGreaterThanOrEqual(entry.hanCount)
      expect(entry.sizeBytes).toBeGreaterThan(0)
      expect(assetPath).toBeDefined()
    }
  })
})

describe('落字随机布局', () => {
  it('常用字占主要比例，同时保留少量长尾字', () => {
    const commonCharsByFont = new Map(
      FONT_IDS.map((id) => [
        id,
        new Set(Array.from(pools.fonts[id].chars).slice(0, pools.fonts[id].commonHanCount)),
      ]),
    )
    const glyphs = Array.from({ length: 12 }, (_, index) =>
      buildGlyphs({ seed: 20261102 + index, viewport: 'desktop' }),
    ).flat()
    const commonCount = glyphs.filter((glyph) => commonCharsByFont.get(glyph.fontId)?.has(glyph.char)).length

    expect(commonCount / glyphs.length).toBeGreaterThan(0.85)
    expect(commonCount / glyphs.length).toBeLessThan(0.95)
  })

  it.each([
    ['mobile', 8],
    ['tablet', 12],
    ['desktop', 70],
  ] as const)('%s viewports create %i balanced, varied glyphs', (viewport, count) => {
    const glyphs = buildGlyphs({ seed: 20261102, viewport })
    expect(glyphs).toHaveLength(count)
    expect(glyphs.filter((g) => g.side === 'left')).toHaveLength(count / 2)
    expect(glyphs.filter((g) => g.side === 'right')).toHaveLength(count / 2)
    expect(new Set(glyphs.map((g) => g.fontId))).toEqual(new Set(FONT_IDS))

    for (const glyph of glyphs) {
      const pool = pools.fonts[glyph.fontId]
      expect(pool.chars).toContain(glyph.char)
      const font = getFont(glyph.fontId)
      expect(font.selfHosted).toBe(true)
      expect(font.licenseStatus).toBe('verified')
      expect(glyph.fontFamily).toBe(`ZiZai Falling ${font.latinName}`)
      expect(glyph.delay).toBeLessThanOrEqual(0)
      expect(glyph.duration).toBeGreaterThanOrEqual(24)
      expect(glyph.duration).toBeLessThanOrEqual(48)
      const sizeLimits = {
        mobile: [24, 36],
        tablet: [26, 44],
        desktop: [32, 64],
      }[viewport]
      const driftLimits = {
        mobile: [8, 18],
        tablet: [14, 32],
        desktop: [10, 22],
      }[viewport]
      expect(glyph.size).toBeGreaterThanOrEqual(sizeLimits[0])
      expect(glyph.size).toBeLessThanOrEqual(sizeLimits[1])
      expect(glyph.opacity).toBeGreaterThanOrEqual(0.45)
      expect(glyph.opacity).toBeLessThanOrEqual(0.55)
      expect(glyph.rotation).toBeGreaterThanOrEqual(-8)
      expect(glyph.rotation).toBeLessThanOrEqual(8)
      expect(Math.abs(glyph.drift)).toBeGreaterThanOrEqual(driftLimits[0])
      expect(Math.abs(glyph.drift)).toBeLessThanOrEqual(driftLimits[1])
    }
  })

  it('device widths map to the intended responsive glyph counts', () => {
    const examples: Array<[number, FallingViewport, number]> = [
      [320, 'mobile', 8],
      [390, 'mobile', 8],
      [768, 'tablet', 12],
      [1024, 'desktop', 70],
      [1440, 'desktop', 70],
    ]
    for (const [width, viewport, count] of examples) {
      expect(viewportForWidth(width)).toBe(viewport)
      expect(buildGlyphs({ seed: 9, viewport }).length).toBe(count)
    }
  })

  it('keeps the 32px PC minimum on a short viewport by reducing glyph count when needed', () => {
    const glyphs = buildGlyphs({ seed: 20261102, viewport: 'desktop', width: 1024, height: 384 })
    expect(glyphs).toHaveLength(54)
    expect(glyphs.every((glyph) => glyph.size >= 32 && glyph.size <= 64)).toBe(true)

    const lanes = new Map<number, typeof glyphs>()
    for (const glyph of glyphs) {
      const lane = lanes.get(glyph.laneId) ?? []
      lane.push(glyph)
      lanes.set(glyph.laneId, lane)
    }
    for (const lane of lanes.values()) {
      const phases = lane.map((glyph) => -glyph.delay / glyph.duration).sort((a, b) => a - b)
      const gaps = phases.map(
        (phase, index) => (phases[(index + 1) % phases.length] ?? 1) - phase + (index === phases.length - 1 ? 1 : 0),
      )
      expect(Math.min(...gaps) * 384 * 1.2).toBeGreaterThanOrEqual(
        Math.max(...lane.map((glyph) => glyph.size)) * 1.15 + 4 - 0.1,
      )
    }
  })

  it('every glyph remains outside the central text-safe area, including its drift', () => {
    for (const viewport of ['mobile', 'tablet', 'desktop'] as const) {
      const basis = { mobile: 320, tablet: 480, desktop: 1024 }[viewport]
      const edge = (1 - { mobile: 0.5, tablet: 0.46, desktop: 0.3 }[viewport]) * basis / 2
      const margin = { mobile: 8, tablet: 12, desktop: 8 }[viewport]
      for (const glyph of buildGlyphs({ seed: 123, viewport })) {
        const left = (Number.parseFloat(glyph.left) / 100) * basis
        const rotationPadding = Math.ceil(glyph.size * 0.08)
        const sweptLeft = left + Math.min(0, glyph.drift) - rotationPadding
        const sweptRight = left + glyph.size + Math.max(0, glyph.drift) + rotationPadding
        if (glyph.side === 'left') {
          expect(sweptLeft).toBeGreaterThanOrEqual(margin - 0.1)
          expect(sweptRight).toBeLessThanOrEqual(edge - margin + 0.1)
        } else {
          expect(sweptLeft).toBeGreaterThanOrEqual(basis - edge + margin - 0.1)
          expect(sweptRight).toBeLessThanOrEqual(basis - margin + 0.1)
        }
      }
    }
  })

  it('spreads desktop glyphs across both outer regions', () => {
    const glyphs = buildGlyphs({ seed: 20261102, viewport: 'desktop' })
    for (const side of ['left', 'right'] as const) {
      const sideGlyphs = glyphs.filter((glyph) => glyph.side === side)
      const positions = sideGlyphs
        .map((glyph) => Number.parseFloat(glyph.left))
      expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(12)
      const phases = sideGlyphs.map((glyph) => -glyph.delay / glyph.duration)
      expect(Math.max(...phases) - Math.min(...phases)).toBeGreaterThan(0.8)
    }
  })

  it.each([
    [1024, 568, 6],
    [1280, 720, 6],
    [1344, 768, 6],
    [1408, 768, 8],
    [1440, 568, 8],
    [1920, 900, 8],
  ])('PC falling lanes stay separated and use distinct speeds at %i×%i', (width, height, laneCount) => {
    const layoutWidth = Math.floor(width / 64) * 64
    const layoutHeight = Math.max(240, Math.floor(height / 64) * 64)
    const glyphs = buildGlyphs({ seed: 20261102, viewport: 'desktop', width: layoutWidth, height: layoutHeight })
    const lanes = new Map<number, typeof glyphs>()
    for (const glyph of glyphs) {
      const lane = lanes.get(glyph.laneId) ?? []
      lane.push(glyph)
      lanes.set(glyph.laneId, lane)
    }

    expect(lanes.size).toBe(laneCount)
    expect(new Set([...lanes.values()].map((lane) => lane[0].duration)).size).toBe(lanes.size)
    for (const side of ['left', 'right'] as const) {
      const sideCounts = [...lanes.values()]
        .filter((lane) => lane[0].side === side)
        .map((lane) => lane.length)
      expect(new Set(sideCounts).size).toBeGreaterThan(1)
      expect(Math.max(...sideCounts) - Math.min(...sideCounts)).toBeLessThanOrEqual(6)
    }

    for (const lane of lanes.values()) {
      expect(new Set(lane.map((glyph) => glyph.duration))).toHaveLength(1)
      expect(new Set(lane.map((glyph) => Math.sign(glyph.drift)))).toHaveLength(2)
      const phases = lane.map((glyph) => -glyph.delay / glyph.duration).sort((a, b) => a - b)
      const cyclicGaps = phases.map(
        (phase, index) => (phases[(index + 1) % phases.length] ?? 1) - phase + (index === phases.length - 1 ? 1 : 0),
      )
      const minimumGapPx = Math.min(...cyclicGaps) * layoutHeight * 1.2
      expect(Math.max(...cyclicGaps) - Math.min(...cyclicGaps)).toBeGreaterThan(0.02)
      const xPositions = lane.map((glyph) => Number.parseFloat(glyph.left) * layoutWidth / 100)
      expect(Math.max(...xPositions) - Math.min(...xPositions)).toBeGreaterThan(12)
      const maximumSize = Math.max(...lane.map((glyph) => glyph.size))
      const minimumSize = Math.min(...lane.map((glyph) => glyph.size))
      expect(maximumSize - minimumSize).toBeGreaterThanOrEqual(width === 1024 ? 1 : 8)
      expect(minimumGapPx).toBeGreaterThanOrEqual(maximumSize * 1.15 + 4 - 0.1)
    }

    const envelopes = [...lanes].map(([laneId, lane]) => ({
      laneId,
      side: lane[0].side,
      min: Math.min(...lane.map((glyph) => {
        const left = Number.parseFloat(glyph.left) * layoutWidth / 100
        return left + Math.min(0, glyph.drift) - Math.ceil(glyph.size * 0.08)
      })),
      max: Math.max(...lane.map((glyph) => {
        const left = Number.parseFloat(glyph.left) * layoutWidth / 100
        return left + glyph.size + Math.max(0, glyph.drift) + Math.ceil(glyph.size * 0.08)
      })),
    }))
    for (let first = 0; first < envelopes.length; first += 1) {
      for (let second = first + 1; second < envelopes.length; second += 1) {
        const left = envelopes[first]
        const right = envelopes[second]
        if (left.side !== right.side) continue
        expect(left.max <= right.min + 0.1 || right.max <= left.min + 0.1).toBe(true)
      }
    }
  })

  it('same seed recreates the layout and another seed changes it', () => {
    const first = buildGlyphs({ seed: 81, viewport: 'desktop' })
    const same = buildGlyphs({ seed: 81, viewport: 'desktop' })
    const different = buildGlyphs({ seed: 82, viewport: 'desktop' })
    expect(same).toEqual(first)
    expect(different).not.toEqual(first)
  })

  it('supports explicit font probabilities while retaining a full four-font sample', () => {
    const weights = Object.fromEntries(FONT_IDS.map((id) => [id, id === 'huawen-mingchao' ? 10 : 1]))
    const glyphs = buildGlyphs({ seed: 19, viewport: 'desktop', fontWeights: weights })
    expect(glyphs.filter((glyph) => glyph.fontId === 'huawen-mingchao').length).toBeGreaterThan(7)
    expect(new Set(glyphs.map((glyph) => glyph.fontId))).toEqual(new Set(FONT_IDS))
  })

  it('does not render glyphs when reduced motion is requested', async () => {
    stubMatchMedia(true)
    const { Comp, get } = harness(1)
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(get().glyphs.value).toHaveLength(0)
    wrapper.unmount()
  })

  it('creates a different instance layout when a new seed is injected', () => {
    const first = harness(503)
    const firstWrapper = mount(first.Comp, { attachTo: document.body })
    const firstGlyphs = first.get().glyphs.value
    firstWrapper.unmount()

    const next = harness(504)
    const nextWrapper = mount(next.Comp, { attachTo: document.body })
    expect(next.get().glyphs.value).not.toEqual(firstGlyphs)
    nextWrapper.unmount()
  })
})
