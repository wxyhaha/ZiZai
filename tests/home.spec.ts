import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
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

async function mountApp(path = '/') {
  const router = makeRouter()
  router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router] }, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('首页', () => {
  it('首页隐藏顶部标题栏与导航，赏字页继续显示', async () => {
    const home = await mountApp('/')
    expect(home.find('.site-header').exists()).toBe(false)
    home.unmount()

    const studio = await mountApp('/studio')
    expect(studio.find('.site-header').exists()).toBe(true)
    expect(studio.find('nav[aria-label="主导航"]').exists()).toBe(true)
    studio.unmount()
  })

  it('只保留品牌标题与主操作，不渲染已删除的说明与页脚入口', async () => {
    const wrapper = await mountHome()
    expect(wrapper.get('h1[aria-label="字在"]').text()).toContain('字在')
    expect(wrapper.text()).toContain('字在')
    expect(wrapper.text()).toContain('入字间')
    for (const removed of [
      '中文古风字体与排版艺术',
      '字有风骨，自在其间。',
      '在字与纸之间，重识中文之美',
      '字 里 有 山 河',
      '择字',
      '阅古',
      '观式',
    ]) {
      expect(wrapper.text()).not.toContain(removed)
    }
    expect(wrapper.find('.hero__rule').exists()).toBe(false)
    expect(wrapper.find('.home__foot').exists()).toBe(false)
    expect(wrapper.find('footer').exists()).toBe(false)
    wrapper.unmount()
  })

  it('「入字间」仍然指向赏字页面', async () => {
    const wrapper = await mountHome()
    const cta = wrapper.get('a.hero__cta')
    expect(cta.attributes('href')).toBe('/studio')
    expect(cta.text()).toContain('入字间')
    wrapper.unmount()
  })

  it('背景落字是隐藏于无障碍树且不接收指针事件的装饰', async () => {
    const wrapper = await mountHome()
    const field = wrapper.get('.glyph-field')
    expect(field.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.glyph-field__item').attributes('style')).toContain('ZiZai Falling')
    wrapper.unmount()
  })
})
