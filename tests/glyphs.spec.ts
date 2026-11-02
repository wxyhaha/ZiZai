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
      expect(new Set(chars).size).toBe(chars.length)
      expect(chars.every((char) => isHan(char.codePointAt(0)!))).toBe(true)
      expect(entry.sourceHanCount).toBeGreaterThanOrEqual(entry.hanCount)
      expect(entry.sizeBytes).toBeGreaterThan(0)
      expect(assetPath).toBeDefined()
    }
  })
})

describe('落字随机布局', () => {
  it.each([
    ['mobile', 8],
    ['tablet', 16],
    ['desktop', 32],
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
        mobile: [18, 24],
        tablet: [18, 36],
        desktop: [18, 45],
      }[viewport]
      expect(glyph.size).toBeGreaterThanOrEqual(sizeLimits[0])
      expect(glyph.size).toBeLessThanOrEqual(sizeLimits[1])
      expect(glyph.opacity).toBeGreaterThanOrEqual(0.05)
      expect(glyph.opacity).toBeLessThanOrEqual(0.18)
      expect(glyph.rotation).toBeGreaterThanOrEqual(-8)
      expect(glyph.rotation).toBeLessThanOrEqual(8)
      if (glyph.side === 'left') expect(glyph.drift).toBeLessThan(0)
      else expect(glyph.drift).toBeGreaterThan(0)
    }
  })

  it('all four device pixel widths map to sparse responsive counts', () => {
    const examples: Array<[number, FallingViewport, number]> = [
      [320, 'mobile', 8],
      [390, 'mobile', 8],
      [768, 'tablet', 16],
      [1024, 'desktop', 32],
      [1440, 'desktop', 32],
    ]
    for (const [width, viewport, count] of examples) {
      expect(viewportForWidth(width)).toBe(viewport)
      expect(buildGlyphs({ seed: 9, viewport }).length).toBe(count)
    }
  })

  it('every glyph remains outside the central text-safe area, including its drift', () => {
    for (const viewport of ['mobile', 'tablet', 'desktop'] as const) {
      const basis = { mobile: 320, tablet: 480, desktop: 1024 }[viewport]
      const edge = (1 - { mobile: 0.68, tablet: 0.5, desktop: 0.42 }[viewport]) * basis / 2
      const margin = { mobile: 8, tablet: 12, desktop: 16 }[viewport]
      for (const glyph of buildGlyphs({ seed: 123, viewport })) {
        const left = (Number.parseFloat(glyph.left) / 100) * basis
        const width = glyph.size
        if (glyph.side === 'left') {
          expect(left + width - glyph.drift + margin).toBeLessThanOrEqual(edge + 0.1)
        } else {
          expect(left + glyph.drift - margin).toBeGreaterThanOrEqual(basis - edge - 0.1)
        }
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
