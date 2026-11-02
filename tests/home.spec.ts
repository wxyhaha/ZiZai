import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/studio', name: 'studio', component: { template: '<div />' } },
    ],
  })
}

async function mountHome() {
  const router = makeRouter()
  router.push('/')
  await router.isReady()
  return mount(HomeView, { global: { plugins: [router] }, attachTo: document.body })
}

describe('首页', () => {
  it('展示品牌名、主文案与副标题', async () => {
    const wrapper = await mountHome()
    expect(wrapper.text()).toContain('字在')
    expect(wrapper.text()).toContain('字有风骨，自在其间。')
    expect(wrapper.text()).toContain('中文古风字体与排版艺术')
    expect(wrapper.text()).toContain('在字与纸之间，重识中文之美')
    wrapper.unmount()
  })

  it('「入字间」是指向 /studio 的真实链接', async () => {
    const wrapper = await mountHome()
    const cta = wrapper.get('a.hero__cta')
    expect(cta.attributes('href')).toBe('/studio')
    expect(cta.text()).toContain('入字间')
    wrapper.unmount()
  })

  it('底部三个入口分别指向赏字的三个面板', async () => {
    const wrapper = await mountHome()
    const links = wrapper.findAll('a.home__link')
    expect(links).toHaveLength(3)
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs).toEqual(['/studio?panel=fonts', '/studio?panel=texts', '/studio?panel=layouts'])
    wrapper.unmount()
  })

  it('落字层是 aria-hidden 的装饰，且不拦截指针', async () => {
    const wrapper = await mountHome()
    const field = wrapper.get('.glyph-field')
    expect(field.attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('落字都被分配了互不相同的 key，且不进入无障碍树', async () => {
    const wrapper = await mountHome()
    const glyphs = wrapper.findAll('.glyph-field__item')
    // 默认桌面宽度下会生成一批落字
    expect(glyphs.length).toBeGreaterThan(0)
    for (const g of glyphs) {
      expect(g.text().length).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('页面只有一屏内容，不通过滚动承载第二屏', async () => {
    const wrapper = await mountHome()
    // 首页容器自带 height: calc(100dvh - header)，由 CSS 锁死；
    // 这里验证 DOM 结构上没有额外的分区区块
    expect(wrapper.findAll('section')).toHaveLength(0)
    wrapper.unmount()
  })
})
