import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ScrollSettingsDrawer from '@/components/studio/ScrollSettingsDrawer.vue'
import ReadingView from '@/views/ReadingView.vue'
import { useReadingState } from '@/composables/useReadingState'

beforeEach(() => {
  useReadingState().resetToDefaults()
  document.body.innerHTML = '<div id="reading-controls"></div>'
})

afterEach(() => {
  document.body.innerHTML = ''
})

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/studio', name: 'studio', component: ReadingView },
    ],
  })
}

async function mountStudio(path = '/studio') {
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  return mount(ReadingView, { global: { plugins: [router] }, attachTo: document.body })
}

describe('卷轴工坊设置抽屉 (ScrollSettingsDrawer)', () => {
  it('正确渲染卷轴设置按钮且默认抽屉处于关闭状态', () => {
    const wrapper = mount(ScrollSettingsDrawer, {
      props: {
        title: '赤壁赋',
        paperTheme: 'antiquewhite',
        fontId: 'huawen-mingchao',
        fontSize: 55,
      },
      attachTo: document.body,
    })

    const btn = wrapper.find('.scroll-settings-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('卷轴设置')
    expect(btn.attributes('aria-label')).toBe('卷轴设置')
    expect(document.body.querySelector('.scroll-drawer-content')).toBeNull()
    wrapper.unmount()
  })

  it('点击设置按钮可平滑滑出抽屉，宣纸色卡矩阵、字体鉴赏列表、篇目与字号配置完整且能派发对应事件', async () => {
    const wrapper = mount(ScrollSettingsDrawer, {
      props: {
        title: '兰亭集序',
        paperTheme: 'antiquewhite',
        fontId: 'huawen-mingchao',
        fontSize: 55,
      },
      attachTo: document.body,
    })

    const btn = wrapper.find('.scroll-settings-btn')
    await btn.trigger('click')
    await nextTick()

    const drawer = document.body.querySelector<HTMLElement>('.panel')
    expect(drawer).not.toBeNull()
    expect(drawer!.textContent).toContain('卷轴设置')

    // 1. 文章篇目展示与选择按钮
    const textBtn = drawer!.querySelector<HTMLButtonElement>('.scroll-settings-text-btn')
    expect(textBtn).not.toBeNull()
    expect(drawer!.textContent).toContain('兰亭集序')
    textBtn!.click()
    await nextTick()
    expect(wrapper.emitted('select-text')).toBeTruthy()

    // 2. 宣纸古笺底色色卡矩阵选择
    const paperItems = drawer!.querySelectorAll<HTMLButtonElement>('.paper-palette__item')
    expect(paperItems.length).toBeGreaterThanOrEqual(10)
    // 寻找澄心纯白
    const whitePaperBtn = drawer!.querySelector<HTMLButtonElement>('.paper-palette__item[data-paper-id="white"]')
    expect(whitePaperBtn).not.toBeNull()
    whitePaperBtn!.click()
    await nextTick()
    expect(wrapper.emitted('update:paperTheme')?.[0]).toEqual(['white'])

    // 3. 择字 · 字体风骨列表选择
    const fontCards = drawer!.querySelectorAll<HTMLButtonElement>('.font-card')
    expect(fontCards.length).toBeGreaterThanOrEqual(6)
    const wenkaiCard = drawer!.querySelector<HTMLButtonElement>('.font-card[data-font-id="lxgw-wenkai"]')
    expect(wenkaiCard).not.toBeNull()
    wenkaiCard!.click()
    await nextTick()
    expect(wrapper.emitted('update:fontId')?.[0]).toEqual(['lxgw-wenkai'])

    // 4. 字号调节滑块
    const sizeRange = drawer!.querySelector<HTMLInputElement>('#scroll-size-range')
    expect(sizeRange).not.toBeNull()
    sizeRange!.value = '42'
    sizeRange!.dispatchEvent(new Event('input'))
    await nextTick()
    expect(wrapper.emitted('update:fontSize')?.[0]).toEqual([42])

    // 5. 字式规范（繁/简）切换
    const variantBtns = drawer!.querySelectorAll<HTMLButtonElement>('.variant-toggle-btn')
    expect(variantBtns).toHaveLength(2)
    expect(variantBtns[0].textContent).toContain('繁体正字')
    expect(variantBtns[1].textContent).toContain('通行简体')
    variantBtns[1].click()
    await nextTick()
    expect(wrapper.emitted('update:charVariant')?.[0]).toEqual(['simplified'])

    wrapper.unmount()
  })
})

describe('赏字页面卷轴模式收敛工具栏', () => {
  it('卷轴模式下旧胶囊工具栏已移除，仅在右上侧保留一个设置入口', async () => {
    const wrapper = await mountStudio()
    // 默认是书本模式
    expect(wrapper.find('.scroll-settings-btn').exists()).toBe(false)
    expect(wrapper.find('.scroll-toolbar').exists()).toBe(false)

    // 切换至卷轴模式
    const scrollModeBtn = document.body.querySelector<HTMLButtonElement>('.reading-modes button:last-child')
    expect(scrollModeBtn).not.toBeNull()
    scrollModeBtn!.click()
    await nextTick()

    // 验证：旧胶囊工具栏彻底不复存在
    expect(wrapper.find('.scroll-toolbar').exists()).toBe(false)

    // 验证：右上角仅存在一个「卷轴设置」入口
    const settingsBtn = wrapper.find('.scroll-settings-btn')
    expect(settingsBtn.exists()).toBe(true)
    expect(settingsBtn.attributes('aria-label')).toBe('卷轴设置')

    // 验证：顶部居中模式切换栏仍在原位置
    expect(document.body.querySelector('.reading-modes')).not.toBeNull()
    expect(document.body.querySelectorAll('.reading-modes button')).toHaveLength(2)

    wrapper.unmount()
  })
})
