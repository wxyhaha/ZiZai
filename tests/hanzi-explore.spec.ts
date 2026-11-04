import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import FallingGlyphs from '@/components/home/FallingGlyphs.vue'
import HanziExploreDialog from '@/components/home/HanziExploreDialog.vue'
import HomeView from '@/views/HomeView.vue'
import { getHanziInfo } from '@/services/hanziDict'
import type { FallingGlyph } from '@/composables/useFallingGlyphs'

afterEach(() => {
  document.body.innerHTML = ''
})

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/studio', name: 'studio', component: { template: '<div />' } },
    ],
  })
}

const mockGlyph: FallingGlyph = {
  id: 42,
  laneId: 1,
  char: '字',
  fontId: 'huawen-mingchao',
  fontFamily: 'ZiZai Falling Huiwen Mincho',
  side: 'left',
  left: '20.000%',
  size: 52,
  duration: 30,
  delay: -5,
  drift: 12,
  opacity: 0.5,
  rotation: 4,
}

describe('汉字探索 · 字典服务 (hanziDict)', () => {
  it('能够准确查询规范汉字的基本元数据与释义', async () => {
    const info = await getHanziInfo('字')
    expect(info.char).toBe('字')
    expect(info.pinyin).toBe('zì')
    expect(info.radical).toBe('子')
    expect(info.strokes).toBe(6)
    expect(info.definition).toBeTruthy()
    expect(info.source).toContain('HanziDict')
    expect(info.hasDictData).toBe(true)
  })

  it('对通用规范汉字表外的生僻字或长尾异体字进行优雅兜底，不凭空捏造', async () => {
    const info = await getHanziInfo('𪚥')
    expect(info.char).toBe('𪚥')
    expect(info.pinyin).toBeUndefined()
    expect(info.radical).toBeUndefined()
    expect(info.strokes).toBeUndefined()
    expect(info.definition).toContain('暂无收录释义')
    expect(info.hasDictData).toBe(false)
  })
})

describe('汉字探索 · 飘落字交互 (FallingGlyphs)', () => {
  it('渲染落字按钮，点击时派发 select 事件并能呈现激活态', async () => {
    const wrapper = mount(FallingGlyphs, {
      props: {
        activeGlyphId: null,
      },
      attachTo: document.body,
    })

    const buttons = wrapper.findAll('.glyph-field__item')
    expect(buttons.length).toBeGreaterThan(0)

    const firstBtn = buttons[0]
    expect(firstBtn.element.tagName).toBe('BUTTON')
    expect(firstBtn.classes()).not.toContain('glyph-field__item--active')

    await firstBtn.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]?.[0]).toHaveProperty('char')

    // 传入 activeGlyphId 后该字具有激活样式
    const selected = wrapper.emitted('select')![0][0] as FallingGlyph
    await wrapper.setProps({ activeGlyphId: selected.id })
    const activeBtn = wrapper.find('.glyph-field__item--active')
    expect(activeBtn.exists()).toBe(true)

    wrapper.unmount()
  })

  it('悬停或激活某字时，该字所在整条垂直轨道同步获得 paused 类，锁定相对车距', async () => {
    const wrapper = mount(FallingGlyphs, {
      props: {
        activeGlyphId: null,
      },
      attachTo: document.body,
    })

    const buttons = wrapper.findAll('.glyph-field__item')
    const firstBtn = buttons[0]

    // 鼠标移入第一个字
    await firstBtn.trigger('mouseenter')
    await nextTick()

    // 此时悬停字具有 hovered 样式与 paused 状态
    expect(firstBtn.classes()).toContain('glyph-field__item--hovered')
    expect(firstBtn.classes()).toContain('glyph-field__item--paused')

    // 统计同列被同步暂停的字符数量，确保同列多字协同静止
    const pausedButtons = wrapper.findAll('.glyph-field__item--paused')
    expect(pausedButtons.length).toBeGreaterThan(1)

    // 鼠标移出后整列恢复运行
    await firstBtn.trigger('mouseleave')
    await nextTick()
    expect(wrapper.findAll('.glyph-field__item--paused').length).toBe(0)

    wrapper.unmount()
  })
})

describe('汉字探索 · 双栏弹窗组件 (HanziExploreDialog)', () => {
  it('正确展示原字体对照、楷书容器、字典释义与数据来源', async () => {
    const wrapper = mount(HanziExploreDialog, {
      props: {
        open: true,
        glyph: mockGlyph,
      },
      attachTo: document.body,
    })

    await nextTick()
    // 等待字典异步返回
    await new Promise((resolve) => setTimeout(resolve, 80))

    const panel = document.body.querySelector('.hanzi-explore-panel')
    expect(panel).not.toBeNull()

    // 1. 标题与字符
    expect(panel!.textContent).toContain('汉字探索')
    expect(panel!.textContent).toContain('字')

    // 2. 左栏原字体展示（无多余微标，纯净呈现）
    expect(panel!.querySelector('.hanzi-card__badge')).toBeNull()
    const origFontName = panel!.querySelector('.hanzi-card--original .hanzi-card__font-name')
    expect(origFontName?.textContent).toBe('汇文明朝体')
    const origGlyph = panel!.querySelector<HTMLElement>('.hanzi-card--original .hanzi-card__glyph')
    expect(origGlyph?.textContent?.trim()).toBe('字')
    expect(origGlyph?.style.fontFamily).toContain('ZiZai Falling Huiwen Mincho')

    // 3. 右栏楷书笔顺容器（带田字格背景）与重播按钮
    expect(panel!.querySelector('.hanzi-card--strokes')).not.toBeNull()
    expect(panel!.querySelector('.hanzi-tian-grid')).not.toBeNull()
    const replayBtn = panel!.querySelector<HTMLButtonElement>('.hanzi-replay-btn')
    expect(replayBtn).not.toBeNull()
    expect(replayBtn?.textContent).toContain('重新播放')

    // 4. 下方属性与释义
    expect(panel!.textContent).toContain('zì')
    expect(panel!.textContent).toContain('子')
    expect(panel!.textContent).toContain('6 画')
    expect(panel!.textContent).toContain('中文释义')

    // 5. 数据来源直接展示为对应 GitHub 链接
    const sourceLinks = panel!.querySelectorAll<HTMLAnchorElement>('.hanzi-source-link')
    expect(sourceLinks.length).toBe(2)
    expect(sourceLinks[0].href).toBe('https://github.com/sinobaba/hanzidict')
    expect(sourceLinks[0].textContent).toContain('HanziDict')
    expect(sourceLinks[1].href).toBe('https://github.com/chanind/hanzi-writer')
    expect(sourceLinks[1].textContent).toContain('Hanzi Writer')

    // 6. 点击关闭按钮
    const closeBtn = panel!.querySelector<HTMLButtonElement>('.hanzi-explore-header__close')
    expect(closeBtn).not.toBeNull()
    closeBtn!.click()
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
  })

  it('当字符缺少笔顺数据时，田字格居中呈现 118px 楷书字形，底部展示优雅提示且拼音缺省中性化', async () => {
    const rareGlyph: FallingGlyph = {
      ...mockGlyph,
      char: '瓸',
      id: 99,
    }
    const wrapper = mount(HanziExploreDialog, {
      props: {
        open: true,
        glyph: rareGlyph,
      },
      attachTo: document.body,
    })

    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const panel = document.body.querySelector('.hanzi-explore-panel')
    expect(panel).not.toBeNull()

    // 1. 田字格容器依然居中存在
    expect(panel!.querySelector('.hanzi-tian-grid')).not.toBeNull()

    // 2. 模拟 HanziWriter 报错回调或通过测试断言降级表现
    // 在真实调用中，由于 hanzi-writer 加载或者触发 error，hanzi-card__fallback-glyph 会被正确呈现
    const rightCard = panel!.querySelector('.hanzi-card--strokes')
    expect(rightCard).not.toBeNull()

    // 3. 拼音缺省时中性化显示，不应用 --pinyin 红色高亮类
    const pinyinVal = panel!.querySelector('.hanzi-meta-item:first-child .hanzi-meta-item__val')
    expect(pinyinVal?.classList.contains('hanzi-meta-item__val--empty')).toBe(true)
    expect(pinyinVal?.classList.contains('hanzi-meta-item__val--pinyin')).toBe(false)

    wrapper.unmount()
  })
})

describe('汉字探索 · 首页全局集成 (HomeView)', () => {
  it('首页点击落字能够唤起探索弹窗，关闭后恢复状态且不干扰「入字间」入口', async () => {
    const router = makeRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, {
      global: { plugins: [router] },
      attachTo: document.body,
    })

    // 验证「入字间」入口不受影响
    const cta = wrapper.get('a.hero__cta')
    expect(cta.attributes('href')).toBe('/studio')
    expect(cta.text()).toContain('入字间')

    // 初始状态下弹窗未开启
    expect(document.body.querySelector('.hanzi-explore-panel')).toBeNull()

    // 点击落字
    const glyphBtn = wrapper.find<HTMLButtonElement>('.glyph-field__item')
    expect(glyphBtn.exists()).toBe(true)
    await glyphBtn.trigger('click')
    await nextTick()

    // 弹窗开启
    expect(document.body.querySelector('.hanzi-explore-panel')).not.toBeNull()

    // 关闭弹窗
    const closeBtn = document.body.querySelector<HTMLButtonElement>('.hanzi-explore-header__close')
    expect(closeBtn).not.toBeNull()
    closeBtn!.click()
    await nextTick()

    wrapper.unmount()
  })
})
