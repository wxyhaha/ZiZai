import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReadingView from '@/views/ReadingView.vue'
import CurvedPageTurn from '@/components/studio/CurvedPageTurn.vue'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import TypographyPanel from '@/components/studio/TypographyPanel.vue'
import { useReadingState, CUSTOM_TEXT_LIMIT } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts, defaultTextId } from '@/data/texts'

beforeEach(() => {
  useReadingState().resetToDefaults()
  // 独立挂载阅读页时，提供真实应用 SiteHeader 中的顶部操作挂载点。
  document.body.innerHTML = '<div id="reading-controls"></div>'
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
  return mount(ReadingView, { global: { plugins: [router] } })
}

describe('赏字书页', () => {
  it('首页入口、选择器、底部工具条和显性的方向按钮已从正文区移除', async () => {
    const wrapper = await mountStudio()
    expect(wrapper.find('.studio__bar').exists()).toBe(false)
    expect(wrapper.find('.picker').exists()).toBe(false)
    expect(wrapper.find('.modes').exists()).toBe(false)
    expect(wrapper.find('.studio__foot').exists()).toBe(false)
    expect(wrapper.find('.book-viewer__stage').exists()).toBe(true)
    wrapper.unmount()
  })

  it('渲染默认作品的标题、作者与首屏正文', async () => {
    const wrapper = await mountStudio()
    const defaultEntry = texts.find((t) => t.id === defaultTextId)!
    expect(wrapper.get('.sheet__title').text()).toBe(defaultEntry.titleTrad || defaultEntry.title)
    expect(wrapper.get('.sheet__meta').text()).toContain(defaultEntry.authorTrad || defaultEntry.author)
    expect(wrapper.findAll('.prose p').length).toBeGreaterThan(0)
    const firstPara = defaultEntry.paragraphsTrad?.[0] || defaultEntry.paragraphs[0]
    expect(wrapper.find('.prose').text()).toContain(firstPara.slice(0, 12))
    wrapper.unmount()
  })

  it('短章单页显示，长文使用双页展开并提供翻页状态', async () => {
    const short = await mountStudio()
    short.findComponent(TextPickerPanel).vm.$emit('select', 'shan-ju-qiu-ming')
    await nextTick()
    expect(short.get('.book-spread').attributes('data-page-mode')).toBe('single')
    expect(short.find('.book-nav').exists()).toBe(false)
    expect(short.get('.zz-sr-only').text()).toBe('1 / 1 页')
    short.unmount()

    useReadingState().resetToDefaults()
    const long = await mountStudio()
    expect(long.get('.book-spread').attributes('data-page-mode')).toBe('spread')
    expect(Number(long.get('.book-spread').attributes('data-page-count'))).toBeGreaterThan(1)
    expect(long.findAll('.sheet')).toHaveLength(2)
    const before = long.get('.sheet').attributes('data-page')
    await long.get('[aria-label="下一组页面"]').trigger('click')
    expect(long.get('.sheet').attributes('data-page')).toBe(before)
    expect(long.get('[aria-label="下一组页面"]').attributes('disabled')).toBeDefined()
    long.findComponent(CurvedPageTurn).vm.$emit('finish')
    await nextTick()
    expect(long.findComponent(CurvedPageTurn).exists()).toBe(false)
    expect(long.get('.sheet').attributes('data-page')).not.toBe(before)
    long.unmount()
  })

  it('页面最左侧与最右侧空白区可点击翻页，并随横竖排自动反转方向', async () => {
    const wrapper = await mountStudio()
    // 默认横排：右侧为下一组页面，左侧为上一组页面
    const rightBtn = wrapper.get('.turn-trigger--right')
    const leftBtn = wrapper.get('.turn-trigger--left')
    expect(rightBtn.attributes('aria-label')).toBe('下一组页面')
    expect(leftBtn.attributes('aria-label')).toBe('上一组页面')
    expect(leftBtn.attributes('disabled')).toBeDefined()

    // 切换至竖排：古籍自右向左读，左侧变为下一组页面，右侧变为上一组页面
    const panel = wrapper.findComponent(TypographyPanel)
    panel.vm.$emit('update:layout', 'vertical')
    await nextTick()
    expect(wrapper.get('.turn-trigger--left').attributes('aria-label')).toBe('下一组页面')
    expect(wrapper.get('.turn-trigger--right').attributes('aria-label')).toBe('上一组页面')
    wrapper.unmount()
  })

  it('切换字体或文稿会重新分页，并在文稿切换后回到第一页', async () => {
    const wrapper = await mountStudio()
    const next = wrapper.get('[aria-label="下一组页面"]')
    await next.trigger('click')
    wrapper.findComponent(CurvedPageTurn).vm.$emit('finish')
    await nextTick()
    expect(wrapper.get('.sheet').attributes('data-page')).not.toBe('1')

    const font = fonts.find((entry) => entry.id !== fonts[0].id)!
    wrapper.findComponent(FontPickerPanel).vm.$emit('select', font.id)
    await nextTick()
    expect(wrapper.get('.sheet').attributes('style')).toContain(font.family.split(',')[0].replace(/"/g, ''))

    wrapper.findComponent(TextPickerPanel).vm.$emit('select', texts[1].id)
    await nextTick()
    expect(wrapper.find('[data-page="1"]').exists()).toBe(true)
    expect(wrapper.get('[data-page="1"]').text()).toContain(texts[1].titleTrad || texts[1].title)
    wrapper.unmount()
  })

  it('支持繁简体一键切换，默认繁体，切换至简体后即刻更新正文与标题', async () => {
    useReadingState().resetToDefaults()
    const wrapper = await mountStudio()
    expect(wrapper.get('.sheet__title').text()).toBe('項脊軒志')

    const reading = useReadingState()
    reading.setCharVariant('simplified')
    await nextTick()
    expect(wrapper.get('.sheet__title').text()).toBe('项脊轩志')

    reading.setCharVariant('traditional')
    await nextTick()
    expect(wrapper.get('.sheet__title').text()).toBe('項脊軒志')
    wrapper.unmount()
  })

  it('四个轻工具入口保留字体、文选、版式和题写', async () => {
    const wrapper = await mountStudio()
    const labels = wrapper.findAll('.tools__label').map((node) => node.text())
    expect(labels).toEqual(['字体', '文选', '版式', '题写'])

    await wrapper.findAll('.tools__btn')[1].trigger('click')
    expect(document.body.querySelector('[role="dialog"] .panel__title')?.textContent).toContain('文选')
    wrapper.unmount()
  })

  it('方向、行高与字距在统一版式面板中控制竖排书页', async () => {
    const wrapper = await mountStudio()
    const panel = wrapper.findComponent(TypographyPanel)
    panel.vm.$emit('update:layout', 'vertical')
    panel.vm.$emit('update:lineHeight', 2.8)
    panel.vm.$emit('update:letterSpacing', 0.12)
    await nextTick()

    expect(wrapper.get('.sheet').classes()).toContain('sheet--vertical')
    expect(wrapper.get('.sheet').attributes('style')).toContain('--reading-leading: 2.8')
    expect(wrapper.get('.sheet').attributes('style')).toContain('--reading-tracking: 0.12em')
    expect(wrapper.find('.sheet__column--body').exists()).toBe(true)
    wrapper.unmount()
  })

  it('从首页的古文入口进入时打开文选面板', async () => {
    const wrapper = await mountStudio('/studio?panel=texts')
    await nextTick()
    expect(document.body.querySelector('[role="dialog"] .panel__title')?.textContent).toContain('文选')
    wrapper.unmount()
  })

  it('键盘快捷键支持左右方向翻页，并受弹窗与修饰键严格作用域约束', async () => {
    const wrapper = await mountStudio()
    expect(wrapper.get('.sheet').attributes('data-page')).toBe('1')

    // 1. 带修饰键 (Ctrl / Alt / Shift) 时不触发翻页
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }))
    await nextTick()
    expect(wrapper.findComponent(CurvedPageTurn).exists()).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }))
    await nextTick()
    expect(wrapper.findComponent(CurvedPageTurn).exists()).toBe(false)

    // 2. 正常按下 ArrowRight：触发前翻动效
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await nextTick()
    expect(wrapper.findComponent(CurvedPageTurn).exists()).toBe(true)
    wrapper.findComponent(CurvedPageTurn).vm.$emit('finish')
    await nextTick()
    expect(wrapper.get('.sheet').attributes('data-page')).not.toBe('1')

    // 3. 打开面板时（如文选面板打开），按下 ArrowLeft / ArrowRight 不触发翻页
    await wrapper.findAll('.tools__btn')[1].trigger('click')
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()

    const pageBefore = wrapper.get('.sheet').attributes('data-page')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await nextTick()
    expect(wrapper.findComponent(CurvedPageTurn).exists()).toBe(false)
    expect(wrapper.get('.sheet').attributes('data-page')).toBe(pageBefore)

    wrapper.unmount()
  })
})

describe('阅读状态', () => {
  it('字号被夹在可读区间内', () => {
    const { setFontSize, state } = useReadingState()
    setFontSize(4)
    expect(state.value.fontSize).toBe(14)
    setFontSize(999)
    expect(state.value.fontSize).toBe(40)
  })

  it('行高被夹在可读区间内', () => {
    const { setLineHeight, state } = useReadingState()
    setLineHeight(0.2)
    expect(state.value.lineHeight).toBe(1.4)
    setLineHeight(9)
    expect(state.value.lineHeight).toBe(3)
  })

  it('字距与版心宽度都被夹在合理区间', () => {
    const { setLetterSpacing, setContentWidth, state } = useReadingState()
    setLetterSpacing(-1)
    expect(state.value.letterSpacing).toBe(0)
    setLetterSpacing(9)
    expect(state.value.letterSpacing).toBe(0.2)

    setContentWidth(100)
    expect(state.value.contentWidth).toBe(440)
    setContentWidth(5000)
    expect(state.value.contentWidth).toBe(960)
  })

  it('选择内置文稿会清空自定义文字，避免状态互相污染', () => {
    const { state, setCustomText, setText } = useReadingState()
    setCustomText('山有木兮木有枝')
    expect(state.value.customText).toBeTruthy()

    setText(texts[0].id)
    expect(state.value.customText).toBeNull()
  })

  it('题写内容超出上限时被截断', () => {
    const { state, setCustomText } = useReadingState()
    setCustomText('字'.repeat(5000))
    expect(state.value.customText?.length).toBe(CUSTOM_TEXT_LIMIT)
  })

  it('题写空串等同于退出题写模式', () => {
    const { state, setCustomText } = useReadingState()
    setCustomText('  \n  ')
    expect(state.value.customText).toBeNull()
  })

  it('题写模式下 activeText 返回自定文字并按空行分段', () => {
    const { activeText, setCustomText } = useReadingState()
    setCustomText('第一段\n\n第二段')
    expect(activeText.value.title).toBe('自定文字')
    expect(activeText.value.paragraphs).toEqual(['第一段', '第二段'])
  })
})
