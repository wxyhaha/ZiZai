import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReadingView from '@/views/ReadingView.vue'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import { useReadingState, CUSTOM_TEXT_LIMIT } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'

// 阅读状态是模块级单例（离开赏字再回来要保留字体与排版），
// 测试之间必须显式复位，否则会互相污染。
beforeEach(() => {
  useReadingState().reset()
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

async function mountStudio() {
  const router = makeRouter()
  router.push('/studio')
  await router.isReady()
  return mount(ReadingView, { global: { plugins: [router] } })
}

describe('赏字阅读区', () => {
  it('渲染默认古文的完整标题、作者与全部段落', async () => {
    const wrapper = await mountStudio()
    const first = texts[0]
    expect(wrapper.get('.sheet__title').text()).toBe(first.title)
    expect(wrapper.get('.sheet__meta').text()).toContain(first.author)
    const paragraphs = wrapper.findAll('.prose p')
    expect(paragraphs).toHaveLength(first.paragraphs.length)
    expect(paragraphs[0].text()).toBe(first.paragraphs[0])
    wrapper.unmount()
  })

  it('默认字体是设计稿的汇文明朝体', async () => {
    const wrapper = await mountStudio()
    expect(wrapper.get('.picker__label').text()).toBe('汇文明朝体')
    const style = wrapper.get('.sheet').attributes('style') ?? ''
    expect(style).toContain('Huiwen Mincho')
    wrapper.unmount()
  })

  it('切换字体后书页的 font-family 真的改变', async () => {
    const wrapper = await mountStudio()
    const target = fonts.find((f) => f.id !== fonts[0].id)!
    wrapper.findComponent(FontPickerPanel).vm.$emit('select', target.id)
    // Vue 的更新是异步的：emit 之后必须等一拍，DOM 才会反映新的字体
    await nextTick()

    const vars = wrapper.get('.sheet').attributes('style') ?? ''
    expect(vars).toContain('--reading-font')
    // 字体族通过内联 CSS 变量注入书页，变量值来自当前字体的 family
    expect(vars).toContain(target.family.split(',')[0].replace(/"/g, ''))
    expect(wrapper.get('.picker__label').text()).toBe(target.name)
    wrapper.unmount()
  })

  it('切换古文后标题、作者与正文一起更新', async () => {
    const wrapper = await mountStudio()
    wrapper.findComponent(TextPickerPanel).vm.$emit('select', texts[1].id)
    await nextTick()

    expect(wrapper.get('.sheet__title').text()).toBe(texts[1].title)
    expect(wrapper.get('.sheet__meta').text()).toContain(texts[1].author)
    expect(wrapper.findAll('.prose p')[0].text()).toBe(texts[1].paragraphs[0])
    wrapper.unmount()
  })

  it('竖排使用 writing-mode，而不是旋转容器', async () => {
    const wrapper = await mountStudio()
    await wrapper.findAll('.modes__btn')[1].trigger('click')

    expect(wrapper.get('.sheet').classes()).toContain('sheet--vertical')
    // 竖排标题列出现，横排标题消失
    expect(wrapper.find('.sheet__title-vertical').exists()).toBe(true)
    expect(wrapper.find('.sheet__head').exists()).toBe(false)
    wrapper.unmount()
  })

  it('横排与竖排按钮正确同步 aria-pressed', async () => {
    const wrapper = await mountStudio()
    const [h, v] = wrapper.findAll('.modes__btn')
    expect(h.attributes('aria-pressed')).toBe('true')
    expect(v.attributes('aria-pressed')).toBe('false')

    await v.trigger('click')
    expect(wrapper.findAll('.modes__btn')[0].attributes('aria-pressed')).toBe('false')
    expect(wrapper.findAll('.modes__btn')[1].attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('工具轨包含全部七项能力', async () => {
    const wrapper = await mountStudio()
    const labels = wrapper.findAll('.tools__label').map((n) => n.text())
    expect(labels).toEqual(['字体', '文选', '排版', '版式', '题写', '对照', '收藏'])
    wrapper.unmount()
  })

  it('工具轨里没有无响应的假按钮：点击会打开对应面板', async () => {
    const wrapper = await mountStudio()
    await wrapper.findAll('.tools__btn')[0].trigger('click')
    // 面板通过 teleport 渲染到 body
    const dialogs = document.body.querySelectorAll('[role="dialog"]')
    expect(dialogs.length).toBe(1)
    expect(document.body.querySelector('.panel__title')?.textContent ?? '').toContain('择字')
    wrapper.unmount()
  })

  it('翻页按钮切换到下一篇古文并循环', async () => {
    const wrapper = await mountStudio()
    const next = wrapper.get('[aria-label="下一篇"]')
    await next.trigger('click')
    expect(wrapper.get('.sheet__title').text()).toBe(texts[1].title)

    // 从最后一篇继续下一篇应回到第一篇
    for (let i = 0; i < texts.length - 1; i += 1) {
      await wrapper.get('[aria-label="下一篇"]').trigger('click')
    }
    expect(wrapper.get('.sheet__title').text()).toBe(texts[0].title)
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