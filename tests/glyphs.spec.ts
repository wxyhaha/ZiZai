import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useFallingGlyphs } from '@/composables/useFallingGlyphs'

/**
 * 用一个真实组件的 setup 环境测试 composable：
 * `useReducedMotion` 依赖 onMounted，必须挂在组件里才会执行。
 */
function harness() {
  let api: ReturnType<typeof useFallingGlyphs> | null = null
  const Comp = defineComponent({
    setup() {
      api = useFallingGlyphs()
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('落字动画', () => {
  it('正常偏好下生成落字，且每项都有合法取值', async () => {
    stubMatchMedia(false)
    const { Comp, get } = harness()
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    const glyphs = get().glyphs.value
    expect(glyphs.length).toBeGreaterThan(0)

    for (const g of glyphs) {
      expect(g.char.length).toBeGreaterThan(0)
      // 时长 26–46 s：慢到不干扰阅读
      expect(g.duration).toBeGreaterThanOrEqual(26)
      expect(g.duration).toBeLessThanOrEqual(46)
      // 负延迟：首屏就已经有字在半空
      expect(g.delay).toBeLessThanOrEqual(0)
      // 峰值透明度克制，属背景而非可读文字
      expect(g.opacity).toBeGreaterThan(0)
      expect(g.opacity).toBeLessThanOrEqual(0.5)
    }
    wrapper.unmount()
  })

  it('落字只分布在左右两条字道，中央留空以免遮挡 CTA', async () => {
    stubMatchMedia(false)
    const { Comp, get } = harness()
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    for (const g of get().glyphs.value) {
      const left = Number.parseFloat(g.left)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left).toBeLessThanOrEqual(100)
      // 中央 30%–70% 必须完全空出
      expect(left < 30 || left > 70, `落字「${g.char}」落在中央 ${left}%`).toBe(true)
    }
    wrapper.unmount()
  })

  it('开启「减少动态效果」时不生成任何落字', async () => {
    stubMatchMedia(true)
    const { Comp, get } = harness()
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(get().glyphs.value).toHaveLength(0)
    wrapper.unmount()
  })

  it('同一视口宽度下构型可复现（刷新不跳变）', async () => {
    stubMatchMedia(false)
    const a = harness()
    const wa = mount(a.Comp, { attachTo: document.body })
    await nextTick()
    const first = a.get().glyphs.value.map((g) => `${g.char}@${g.left}`)
    wa.unmount()

    const b = harness()
    const wb = mount(b.Comp, { attachTo: document.body })
    await nextTick()
    const second = b.get().glyphs.value.map((g) => `${g.char}@${g.left}`)
    wb.unmount()

    expect(second).toEqual(first)
  })
})
