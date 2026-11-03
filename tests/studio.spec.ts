import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { countMissingInFull, countMissingInSubset } from '@/composables/useFontLoading'
import { fonts, getFont } from '@/data/fonts'
import { texts } from '@/data/texts'
import { useReadingState } from '@/composables/useReadingState'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import WritingPanel from '@/components/studio/WritingPanel.vue'
import TypographyPanel from '@/components/studio/TypographyPanel.vue'

beforeEach(() => {
  useReadingState().resetToDefaults()
})

afterEach(() => {
  // 面板由 Reka UI 的 DialogPortal 传送到 body，测试之间要清干净
  document.body.innerHTML = ''
})

/**
 * 面板内容在 body 上，不在 wrapper 内部 —— 断言统一查 body，
 * 那才是用户真正看到的那棵树。
 */
function q<T extends Element = HTMLElement>(selector: string): T {
  const el = document.body.querySelector<T>(selector)
  if (!el) throw new Error(`body 上找不到 ${selector}`)
  return el
}

function qa<T extends Element = HTMLElement>(selector: string): T[] {
  return [...document.body.querySelectorAll<T>(selector)]
}

/** 模拟用户输入（v-model 监听的是 input 事件） */
function typeInto(el: HTMLTextAreaElement | HTMLInputElement, value: string) {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('缺字检测', () => {
  it('站内常用古文在默认字体下不缺字', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInSubset(huiwen.id, '项脊轩，旧南阁子也。室仅方丈，可容一人居。')).toBe(0)
  })

  it('能抓到已知缺字（汇文明朝体缺「楯」）', () => {
    const huiwen = getFont('huawen-mingchao')
    // 《项脊轩志》「旧时栏楯」的「楯」不在内容子集里
    expect(countMissingInSubset(huiwen.id, '旧时栏楯')).toBeGreaterThan(0)
  })

  it('常用标点与拉丁不报缺字', () => {
    // 现代通用字体应完整覆盖常用标点与拉丁字母；纯古籍善本与草书法帖复刻字体（如齐伋刻本、韵草体）源自明代古籍，不含西文字符
    const modernFonts = fonts.filter(
      (f) => f.selfHosted && f.id !== 'qiji-font' && f.id !== 'rhyme-grass',
    )
    for (const font of modernFonts) {
      const sample = '，。、；：？！「」『』（）《》—…·0123456789ZiZai'
      expect(countMissingInSubset(font.id, sample), font.id).toBe(0)
    }
    // 古籍复刻字体明确记录 caveats 说明西文与现代标点自动回退
    const qiji = getFont('qiji-font')
    const rhyme = getFont('rhyme-grass')
    expect(qiji.caveats?.some((c) => c.includes('西文') || c.includes('标点'))).toBe(true)
    expect(rhyme.caveats?.some((c) => c.includes('草书') || c.includes('回退'))).toBe(true)
  })

  it('全量字体完整保留母本字符（如汇文明朝体收录「黠」与「龘」）', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInFull(huiwen.id, '黠')).toBe(0)
    expect(countMissingInFull(huiwen.id, '龘')).toBe(0)
  })

  it('原字体母本未收录的字会真实准确报告缺字', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInFull(huiwen.id, '楯')).toBeGreaterThan(0)
    expect(countMissingInFull(huiwen.id, '𪚥')).toBeGreaterThan(0)
  })

  it('空白字符不计入缺字，重复字符只计一次', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInSubset(huiwen.id, '   \n\n \t ')).toBe(0)
    expect(countMissingInSubset(huiwen.id, '楯楯楯楯')).toBe(1)
  })

  it('每款自托管字体的覆盖表都包含常用字', () => {
    for (const font of fonts.filter((f) => f.selfHosted)) {
      expect(countMissingInSubset(font.id, '山水月风'), font.id).toBe(0)
    }
  })
})

describe('字体图鉴面板', () => {
  async function mountPicker(selectedId = fonts[0].id) {
    const wrapper = mount(FontPickerPanel, {
      props: { open: true, fonts, selectedId },
      attachTo: document.body,
    })
    await nextTick()
    return wrapper
  }

  it('为每款字体渲染一张带预览字的卡片', async () => {
    const wrapper = await mountPicker()
    const cards = qa('.font-card')
    expect(cards).toHaveLength(fonts.length)

    for (const [index, card] of cards.entries()) {
      expect(card.textContent).toContain(fonts[index].name)
      expect(card.textContent).toContain(fonts[index].sample)
    }
    wrapper.unmount()
  })

  it('预览字使用该字体自身的 font-family', async () => {
    const wrapper = await mountPicker()
    for (const [index, sample] of qa('.font-card__sample').entries()) {
      const expected = fonts[index].family.split(',')[0].replace(/"/g, '')
      expect(sample.getAttribute('style')).toContain(expected)
    }
    wrapper.unmount()
  })

  it('已核实授权的字体标注「已核实」', async () => {
    const wrapper = await mountPicker()
    const badges = qa('.font-card__badge').map((b) => b.textContent?.trim())
    expect(badges.every((b) => b === '已核实')).toBe(true)
    wrapper.unmount()
  })

  it('点击卡片会 emit select 并请求关闭面板', async () => {
    const wrapper = await mountPicker()
    qa<HTMLButtonElement>('.font-card')[1].click()
    await nextTick()

    expect(wrapper.emitted('select')?.[0]).toEqual([fonts[1].id])
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('当前字体被标记为选中', async () => {
    const wrapper = await mountPicker(fonts[2].id)
    const active = qa('.font-card')[2]
    expect(active.className).toContain('is-active')
    expect(active.getAttribute('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('列出每款字体的来源与授权，可追溯到具体条款', async () => {
    const wrapper = await mountPicker()
    const story = q('.font-story').textContent ?? ''
    for (const font of fonts) {
      expect(story).toContain(font.name)
      expect(story).toContain(font.licenseName!)
    }
    expect(qa('.font-story__link')).toHaveLength(fonts.length)
    wrapper.unmount()
  })
})

describe('古文选集面板', () => {
  async function mountTextPicker() {
    const wrapper = mount(TextPickerPanel, {
      props: { open: true, texts, selectedId: texts[0].id, isCustom: false },
      attachTo: document.body,
    })
    await nextTick()
    return wrapper
  }

  it('按诗/词/赋/散文分组，每篇只出现在自己的分类下', async () => {
    const wrapper = await mountTextPicker()
    const groups = qa('.group')
    expect(groups.length).toBeGreaterThan(0)

    const total = groups.reduce((sum, g) => sum + g.querySelectorAll('.text-item').length, 0)
    expect(total).toBe(texts.length)

    for (const group of groups) {
      const heading = group.querySelector('.group__title')?.textContent ?? ''
      for (const item of group.querySelectorAll('.text-item')) {
        const title = item.querySelector('.text-item__title')?.textContent
        const entry = texts.find((t) => t.title === title)
        expect(entry, String(title)).toBeTruthy()
        expect(heading, `${title} 被分到了错误的组`).toContain(entry!.category)
      }
    }
    wrapper.unmount()
  })

  it('提供进入题写的入口', async () => {
    const wrapper = await mountTextPicker()
    q<HTMLButtonElement>('.write-entry').click()
    await nextTick()
    expect(wrapper.emitted('write')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('题写面板', () => {
  async function mountWriting(text = '') {
    const font = getFont('huawen-mingchao')
    const wrapper = mount(WritingPanel, {
      props: { open: true, font, current: text || null },
      attachTo: document.body,
    })
    await nextTick()
    return wrapper
  }

  it('打开时回填当前生效的题写内容', async () => {
    const wrapper = await mountWriting('山有木兮木有枝')
    expect(q<HTMLTextAreaElement>('#draft-text').value).toBe('山有木兮木有枝')
    wrapper.unmount()
  })

  it('常用文字不显示缺字提示', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '空山新雨后，天气晚来秋。')
    await nextTick()
    expect(document.body.querySelector('.glyph-notice')).toBeNull()
    wrapper.unmount()
  })

  it('输入原字体未收录字符时提示超出字体库', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '楯')
    await nextTick()

    expect(q('.glyph-notice--soft').textContent).toContain('不在')
    expect(q('.glyph-notice--soft').textContent).toContain('超出原字体字符库')
    wrapper.unmount()
  })

  it('点「应用到书页」会 emit apply 并请求关闭', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '山有木兮木有枝')
    await nextTick()
    q<HTMLButtonElement>('.action--primary').click()
    await nextTick()

    expect(wrapper.emitted('apply')?.[0]).toEqual(['山有木兮木有枝'])
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('内容为空时「应用到书页」不可用，避免提交空白', async () => {
    const wrapper = await mountWriting()
    expect(q<HTMLButtonElement>('.action--primary').disabled).toBe(true)

    typeInto(q<HTMLTextAreaElement>('#draft-text'), '字')
    await nextTick()
    expect(q<HTMLButtonElement>('.action--primary').disabled).toBe(false)
    wrapper.unmount()
  })

  it('点「恢复古文」会 emit clear', async () => {
    const wrapper = await mountWriting('一些文字')
    qa<HTMLButtonElement>('.action')[1].click()
    await nextTick()
    expect(wrapper.emitted('clear')).toBeTruthy()
    wrapper.unmount()
  })

  it('超过字数上限时给出告警', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '字'.repeat(2100))
    await nextTick()
    expect(q('#draft-warn').textContent).toContain('超出')
    wrapper.unmount()
  })
})

describe('排版面板', () => {
  async function mountTypography(overrides: Record<string, unknown> = {}) {
    const wrapper = mount(TypographyPanel, {
      props: {
        open: true,
        layout: 'horizontal',
        fontSize: 22,
        lineHeight: 2.2,
        letterSpacing: 0.035,
        contentWidth: 680,
        ...overrides,
      },
      attachTo: document.body,
    })
    await nextTick()
    return wrapper
  }

  it('横排模式下渲染四个参数控件，竖排模式下极致收敛仅渲染字号滑块', async () => {
    const wrapper = await mountTypography({ layout: 'horizontal' })
    expect(qa('.control')).toHaveLength(4)
    expect(qa('.slider')).toHaveLength(4)
    wrapper.unmount()

    const verticalWrapper = await mountTypography({ layout: 'vertical' })
    expect(qa('.control')).toHaveLength(1)
    expect(qa('.slider')).toHaveLength(1)
    expect(q('.control__label').textContent).toBe('字号')
    verticalWrapper.unmount()
  })

  it('方向选择归入版式面板并可切换到竖排', async () => {
    const wrapper = await mountTypography()
    const vertical = q<HTMLButtonElement>('.direction__button[aria-pressed="false"]')
    vertical.click()
    await nextTick()
    expect(wrapper.emitted('update:layout')?.[0]).toEqual(['vertical'])
    wrapper.unmount()
  })

  it('键盘操作滑块会 emit 对应参数', async () => {
    const wrapper = await mountTypography()
    qa('.slider__thumb')[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    )
    await nextTick()

    const emitted = wrapper.emitted('update:fontSize')
    expect(emitted, '字号滑块应发出 update:fontSize').toBeTruthy()
    expect(Number(emitted![0][0])).toBeGreaterThan(22)
    wrapper.unmount()
  })

  it('恢复默认排版会一次性重置四项参数并触发 reset', async () => {
    const wrapper = await mountTypography({
      fontSize: 34,
      lineHeight: 2.8,
      letterSpacing: 0.15,
      contentWidth: 900,
    })
    q<HTMLButtonElement>('.reset').click()
    await nextTick()

    expect(wrapper.emitted('update:fontSize')?.[0]).toEqual([30])
    expect(wrapper.emitted('update:lineHeight')?.[0]).toEqual([2.4])
    expect(wrapper.emitted('update:letterSpacing')?.[0]).toEqual([0.04])
    expect(wrapper.emitted('update:contentWidth')?.[0]).toEqual([660])
    expect(wrapper.emitted('update:paperTheme')?.[0]).toEqual(['antiquewhite'])
    expect(wrapper.emitted('reset')).toBeTruthy()
    wrapper.unmount()
  })

  it('宣纸古笺底色盘渲染 10 款宣纸选项并可点击切换', async () => {
    const wrapper = await mountTypography()
    const items = qa('.paper-palette__item')
    expect(items).toHaveLength(10)
    expect(items[0].textContent).toContain('仿古竹纸')
    expect(items[0].textContent).toContain('ANTIQUEWHITE')

    items[1].click()
    await nextTick()
    expect(wrapper.emitted('update:paperTheme')?.[0]).toEqual(['cornsilk'])
    wrapper.unmount()
  })

  it('古籍装帧由时代装帧全权界定，面板中已精简移除冗余版框开关', async () => {
    const wrapper = await mountTypography()
    expect(document.body.querySelector('.classic-features')).toBeNull()
    wrapper.unmount()
  })

  it('时代标点选择器渲染五大时代选项并支持切换', async () => {
    const wrapper = await mountTypography()
    const items = qa('.punctuation-era__item')
    expect(items).toHaveLength(5)
    expect(items[0].textContent).toContain('先秦两汉')
    expect(items[1].textContent).toContain('魏晋隋唐')
    expect(items[2].textContent).toContain('宋元雕版')
    expect(items[3].textContent).toContain('明清刻本')
    expect(items[4].textContent).toContain('近代现代')

    // 点击魏晋隋唐按钮
    const weiJinBtn = items[1].querySelector<HTMLButtonElement>('.punctuation-era__main-btn')!
    weiJinBtn.click()
    await nextTick()
    expect(wrapper.emitted('update:punctuationStyle')?.[0]).toEqual(['wei-jin'])
    wrapper.unmount()
  })

  it('点击 ℹ 图标打开时代标点学术考据弹窗，展示出土文物依据与参考文献', async () => {
    const wrapper = await mountTypography()
    const infoBtns = qa<HTMLButtonElement>('.punctuation-era__info-btn')
    expect(infoBtns).toHaveLength(5)

    // 点击先秦两汉考据按钮
    infoBtns[0].click()
    await nextTick()

    const modal = document.body.querySelector('.info-modal')
    expect(modal).not.toBeNull()
    expect(modal?.textContent).toContain('先秦两汉')
    expect(modal?.textContent).toContain('简帛钩识')
    expect(modal?.textContent).toContain('出土文物与善本遗存')
    expect(modal?.textContent).toContain('管锡华')
    expect(modal?.textContent).toContain('睡虎地秦简')
    wrapper.unmount()
  })

  it('时代装帧选择器渲染五大时代选项并支持切换', async () => {
    const wrapper = await mountTypography()
    const items = qa('.era-format__item')
    expect(items).toHaveLength(5)
    expect(items[0].textContent).toContain('先秦两汉')
    expect(items[1].textContent).toContain('魏晋隋唐')
    expect(items[2].textContent).toContain('宋元雕版')
    expect(items[3].textContent).toContain('明清刻本')
    expect(items[4].textContent).toContain('近代现代')

    // 点击宋元雕版
    const songYuanBtn = items[2].querySelector<HTMLButtonElement>('.era-format__main-btn')!
    songYuanBtn.click()
    await nextTick()
    expect(wrapper.emitted('update:eraFormat')?.[0]).toEqual(['song-yuan'])
    expect(wrapper.emitted('update:woodblockFrame')?.[0]).toEqual([true])
    wrapper.unmount()
  })

  it('书体规制选择器渲染三大书体选项、精炼字体描述，并以楷/行/草书法单字呈现微标', async () => {
    const wrapper = await mountTypography()
    const items = qa('.script-style__item')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain('正书规制')
    expect(items[0].textContent).toContain('字方乌丝')
    expect(items[0].textContent).toContain('宋体 · 楷书 · 仿宋')
    expect(items[0].textContent).not.toContain('（')
    expect(items[1].textContent).toContain('行书规制')
    expect(items[1].textContent).toContain('疏朗淡栏')
    expect(items[1].textContent).toContain('行楷 · 行书 · 手札')
    expect(items[2].textContent).toContain('草书规制')
    expect(items[2].textContent).toContain('连绵无栏')
    expect(items[2].textContent).toContain('章草 · 今草 · 狂草')
    expect(items[2].textContent).not.toContain('（')

    // 验证左侧图标全部采用「楷」、「行」、「草」书法单字矢量路径
    const symbols = qa('.script-style__symbol')
    expect(symbols).toHaveLength(3)
    for (const sym of symbols) {
      expect(sym.querySelector('path')).not.toBeNull()
      expect(sym.querySelector('line')).toBeNull()
      expect(sym.querySelector('rect')).toBeNull()
    }

    // 点击草书无栏
    const cursiveBtn = items[2].querySelector<HTMLButtonElement>('.script-style__main-btn')!
    cursiveBtn.click()
    await nextTick()
    expect(wrapper.emitted('update:scriptStyle')?.[0]).toEqual(['cursive'])
    wrapper.unmount()
  })

  it('点击时代装帧与书体规制 ℹ 图标打开学术考据弹窗，展示版本学出处与避切笔法度', async () => {
    const wrapper = await mountTypography()
    const eraInfoBtns = qa<HTMLButtonElement>('.era-format__info-btn')
    expect(eraInfoBtns).toHaveLength(5)

    // 点击先秦两汉时代装帧 ℹ 图标
    eraInfoBtns[0].click()
    await nextTick()

    let modal = document.body.querySelector('.format-info-modal')
    expect(modal).not.toBeNull()
    expect(modal?.textContent).toContain('先秦两汉')
    expect(modal?.textContent).toContain('简帛纯笺')
    expect(modal?.textContent).toContain('出土文物与传世善本')
    expect(modal?.textContent).toContain('郭店')

    // 点击草书规制 ℹ 图标
    const scriptInfoBtns = qa<HTMLButtonElement>('.script-style__info-btn')
    expect(scriptInfoBtns).toHaveLength(3)
    scriptInfoBtns[2].click()
    await nextTick()

    modal = document.body.querySelector('.format-info-modal')
    expect(modal).not.toBeNull()
    expect(modal?.textContent).toContain('草书规制')
    expect(modal?.textContent).toContain('连绵无栏')
    expect(modal?.textContent).toContain('草韵辨体')
    expect(modal?.textContent).toContain('切断')
    wrapper.unmount()
  })
})

describe('古籍风雅排版与纸张底色渲染 (ReadingSheet)', () => {
  const defaultPage = {
    index: 0,
    hasHeader: true,
    paragraphs: [
      { text: '项脊轩，旧南阁子也。', paragraphIndex: 0, indent: true, paragraphEnd: true },
    ],
    columns: [
      { text: '项脊轩，旧南阁子也。', kind: 'body' as const, width: 28 },
    ],
  }

  it('开启朱墨套印时（竖排模式）将标点分离并渲染为朱砂红标记 .judou-mark', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '项脊轩志',
        author: '归有光',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        judouMode: true,
      },
    })
    const marks = wrapper.findAll('.judou-mark')
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0].text()).toBe('，')
    expect(marks[1].text()).toBe('。')
    wrapper.unmount()
  })

  it('关闭朱墨套印或在横排模式下不生成 .judou-mark 标记', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '项脊轩志',
        author: '归有光',
        fontFamily: 'serif',
        layout: 'horizontal',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        judouMode: true,
      },
    })
    expect(wrapper.findAll('.judou-mark')).toHaveLength(0)
    expect(wrapper.find('.prose').text()).toContain('项脊轩，旧南阁子也。')
    wrapper.unmount()
  })

  it('开启古籍版框时（竖排模式）渲染四周文武双边栏与中缝折页鱼尾', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '项脊轩志',
        author: '归有光',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        woodblockFrame: true,
      },
    })
    expect(wrapper.find('.woodblock-frame').exists()).toBe(true)
    const banxin = wrapper.find('.banxin')
    expect(banxin.exists()).toBe(true)
    expect(banxin.find('.banxin__title').text()).toBe('项脊轩志')
    expect(banxin.find('.banxin__leaf').text()).toBe('叶一')
    expect(banxin.find('.banxin__fishtail').exists()).toBe(true)
    wrapper.unmount()
  })

  it('正确应用选中的宣纸底色至 CSS 变量 --reading-bg', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '项脊轩志',
        author: '归有光',
        fontFamily: 'serif',
        layout: 'horizontal',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        paperTheme: 'cornsilk',
      },
    })
    const sheetEl = wrapper.find('.sheet').element as HTMLElement
    expect(sheetEl.style.getPropertyValue('--reading-bg')).toBe('#FFF8DC')
    wrapper.unmount()
  })

  it('先秦两汉时代（竖排模式）渲染简帛折笔墨钩与墨点', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '论语·学而',
        author: '孔子弟子',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'pre-qin',
        judouMode: true,
      },
    })
    expect(wrapper.find('.judou-mark--pre-qin').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--hook').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--dot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('魏晋隋唐时代（竖排模式）渲染手书朱圈与斜撇', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '兰亭集序',
        author: '王羲之',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'wei-jin',
        judouMode: true,
      },
    })
    expect(wrapper.find('.judou-mark--wei-jin').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--cinnabar-circle').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--cinnabar-slash').exists()).toBe(true)
    wrapper.unmount()
  })

  it('宋元雕版时代（竖排模式）渲染细铁线圈、木刻小角点与单边墨栏', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '前赤壁赋',
        author: '苏轼',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'song-yuan',
        woodblockFrame: true,
        judouMode: true,
      },
    })
    expect(wrapper.find('.judou-mark--song-yuan').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--fine-circle').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--corner-triangle').exists()).toBe(true)
    expect(wrapper.find('.woodblock-frame--single').exists()).toBe(true)
    wrapper.unmount()
  })

  it('明清刻本时代（竖排模式）渲染万历朱圈与四周文武双边栏', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '项脊轩志',
        author: '归有光',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'ming-qing',
        woodblockFrame: true,
        judouMode: true,
      },
    })
    expect(wrapper.find('.judou-mark--ming-qing').exists()).toBe(true)
    expect(wrapper.find('.punct-svg--mingqing-circle').exists()).toBe(true)
    expect(wrapper.find('.woodblock-frame--double').exists()).toBe(true)
    wrapper.unmount()
  })

  it('横排模式下防御性隔离：强制回退为现代标点且不渲染古籍版框', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '前赤壁赋',
        author: '苏轼',
        fontFamily: 'serif',
        layout: 'horizontal',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'song-yuan',
        woodblockFrame: true,
        judouMode: true,
      },
    })
    expect(wrapper.find('.judou-mark--song-yuan').exists()).toBe(false)
    expect(wrapper.find('.woodblock-frame').exists()).toBe(false)
    expect(wrapper.find('.prose').text()).toContain('项脊轩，旧南阁子也。')
    wrapper.unmount()
  })

  it('古代模式下标点纯化转换器剥离现代书名号与引号，仅保留纯正句读', async () => {
    const { sanitizeTextForEra } = await import('@/data/punctuationStyles')
    const sample = '诵《明月》之诗，歌《窈窕》之章。歌曰：“桂棹兮兰桨，击空明兮溯流光。”'

    // 宋元雕版：剥离《》与“”，冒号转停顿，统一为句读
    const ancientClean = sanitizeTextForEra(sample, 'song-yuan')
    expect(ancientClean).not.toContain('《')
    expect(ancientClean).not.toContain('》')
    expect(ancientClean).not.toContain('“')
    expect(ancientClean).not.toContain('”')
    expect(ancientClean).toBe('诵明月之诗，歌窈窕之章。歌曰，桂棹兮兰桨，击空明兮溯流光。')

    // 现代模式：完整保留所有现代符号
    const modernRaw = sanitizeTextForEra(sample, 'modern')
    expect(modernRaw).toBe(sample)
  })

  it('古代标点渲染不参杂任何现代书名号与引号', async () => {
    const textWithModernPunct = {
      index: 0,
      hasHeader: true,
      paragraphs: [
        {
          text: '诵《明月》之诗，歌曰：“桂棹兮兰桨。”',
          paragraphIndex: 0,
          indent: true,
          paragraphEnd: true,
        },
      ],
      columns: [
        { text: '诵《明月》之诗，歌曰：“桂棹兮兰桨。”', kind: 'body' as const, width: 28 },
      ],
    }
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: textWithModernPunct,
        title: '前赤壁赋',
        author: '苏轼',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        punctuationStyle: 'song-yuan',
        woodblockFrame: true,
        judouMode: true,
      },
    })
    const sheetText = wrapper.text()
    expect(sheetText).not.toContain('《')
    expect(sheetText).not.toContain('》')
    expect(sheetText).not.toContain('“')
    expect(sheetText).not.toContain('”')
    expect(sheetText).toContain('诵明月之诗')
    expect(wrapper.find('.judou-mark--song-yuan').exists()).toBe(true)
    wrapper.unmount()
  })

  it('草书规制（cursive）在古籍装帧下彻底隐去纵向界行（sheet__column--lined-none），防切笔锋', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '草书千字文',
        author: '怀素',
        fontFamily: 'Rhyme Grass',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        eraFormat: 'ming-qing',
        scriptStyle: 'cursive',
        woodblockFrame: true,
      },
    })
    // 验证草书根标记生效
    expect(wrapper.find('.sheet--cursive').exists()).toBe(true)
    // 验证古籍版框存续（外规矩）
    expect(wrapper.find('.woodblock-frame--double').exists()).toBe(true)
    // 验证内部纵向乌丝栏彻底移去（内无栏，绝不切笔）
    expect(wrapper.find('.sheet__column--lined-none').exists()).toBe(true)
    expect(wrapper.find('.sheet__column--lined-solid').exists()).toBe(false)
    wrapper.unmount()
  })

  it('正书规制（regular）在古籍装帧下渲染挺拔乌丝界行（sheet__column--lined-solid）', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '九成宫醴泉铭',
        author: '欧阳询',
        fontFamily: 'Huiwen-Mingchao',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        eraFormat: 'song-yuan',
        scriptStyle: 'regular',
        woodblockFrame: true,
      },
    })
    expect(wrapper.find('.woodblock-frame--single').exists()).toBe(true)
    expect(wrapper.find('.sheet__column--lined-solid').exists()).toBe(true)
    expect(wrapper.find('.sheet__column--lined-none').exists()).toBe(false)
    wrapper.unmount()
  })

  it('古籍时代装帧（sheet--ancient-era）还原天宽地窄留白传统', async () => {
    const wrapper = mount(await import('@/components/studio/ReadingSheet.vue').then((m) => m.default), {
      props: {
        page: defaultPage,
        title: '先秦两汉典籍',
        author: '佚名',
        fontFamily: 'serif',
        layout: 'vertical',
        fontSize: 19,
        lineHeight: 2.4,
        letterSpacing: 0.04,
        contentWidth: 660,
        pagePosition: 'first',
        single: false,
        eraFormat: 'pre-qin',
      },
    })
    expect(wrapper.find('.sheet--ancient-era').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('朝代默认值联动与策略 A 排版状态机 (useReadingState)', () => {
  it('切换到先秦文章自动联动先秦标点、竖排直行且默认无版框', () => {
    const { state, setText } = useReadingState()
    setText('xue-er')
    expect(state.value.punctuationStyle).toBe('pre-qin')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.woodblockFrame).toBe(false)
  })

  it('切换到北宋文章自动联动宋元雕版标点、竖排直行与单边版框', () => {
    const { state, setText } = useReadingState()
    setText('qian-chi-bi-fu')
    expect(state.value.punctuationStyle).toBe('song-yuan')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.woodblockFrame).toBe(true)
  })

  it('切换到现代文章自动联动现代标点且无版框', () => {
    const { state, setText } = useReadingState()
    setText('cong-cong')
    expect(state.value.punctuationStyle).toBe('modern')
    expect(state.value.woodblockFrame).toBe(false)
  })

  it('策略 A 强联动：切回横排时自动回退为现代标点并关闭版框，切古代标点自动入竖排', () => {
    const { state, setText, setLayout, setPunctuationStyle } = useReadingState()
    setText('qian-chi-bi-fu') // 宋代 -> vertical, song-yuan, frame=true
    expect(state.value.layout).toBe('vertical')
    expect(state.value.punctuationStyle).toBe('song-yuan')
    expect(state.value.woodblockFrame).toBe(true)

    // 用户手动切回横排
    setLayout('horizontal')
    expect(state.value.layout).toBe('horizontal')
    expect(state.value.punctuationStyle).toBe('modern')
    expect(state.value.woodblockFrame).toBe(false)

    // 用户在横排下选择明清刻本
    setPunctuationStyle('ming-qing')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.punctuationStyle).toBe('ming-qing')
    expect(state.value.woodblockFrame).toBe(true)
  })

  it('用户自定义更改后，点击恢复默认排版自动重置回当前文章朝代默认值', () => {
    const { state, setText, setPunctuationStyle, setWoodblockFrame, reset } = useReadingState()
    setText('qian-chi-bi-fu') // 宋代
    expect(state.value.punctuationStyle).toBe('song-yuan')

    // 用户在版式面板中手动改成先秦
    setPunctuationStyle('pre-qin', false)
    setWoodblockFrame(true)
    expect(state.value.punctuationStyle).toBe('pre-qin')
    expect(state.value.woodblockFrame).toBe(true)

    // 点击恢复默认排版
    reset()
    // 恢复为宋代对应的默认值
    expect(state.value.punctuationStyle).toBe('song-yuan')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.woodblockFrame).toBe(true)
  })

  it('时代装帧与书体规制朝代/字体双向智能联动与策略 A 竖排隔离', () => {
    const {
      state,
      setText,
      setFont,
      setLayout,
      setEraFormat,
      setScriptStyle,
      reset,
    } = useReadingState()

    // 1. 切换到宋代文章：自动联动宋元雕版时代装帧与正书规制
    setText('qian-chi-bi-fu')
    expect(state.value.eraFormat).toBe('song-yuan')
    expect(state.value.scriptStyle).toBe('regular')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.woodblockFrame).toBe(true)

    // 2. 切换字体为草书（韵草体）：自动联动草书无栏规制
    setFont('rhyme-grass')
    expect(state.value.scriptStyle).toBe('cursive')

    // 3. 策略 A 隔离：切回横排时，自动回退为现代时代装帧与正书规制，关闭版框
    setLayout('horizontal')
    expect(state.value.layout).toBe('horizontal')
    expect(state.value.eraFormat).toBe('modern')
    expect(state.value.scriptStyle).toBe('regular')
    expect(state.value.woodblockFrame).toBe(false)

    // 4. 在横排下选择明清刻本时代装帧：自动联动切入竖排直行并开启版框
    setEraFormat('ming-qing')
    expect(state.value.layout).toBe('vertical')
    expect(state.value.eraFormat).toBe('ming-qing')
    expect(state.value.woodblockFrame).toBe(true)

    // 5. 手动切换书体规制为行书
    setScriptStyle('running')
    expect(state.value.scriptStyle).toBe('running')

    // 6. 点击恢复默认排版：恢复当前文章所属朝代（宋代）的装帧，并依据当前字体恢复书体规制
    reset()
    expect(state.value.eraFormat).toBe('song-yuan')
    expect(state.value.scriptStyle).toBe('cursive') // 当前仍为草书字体，保留草书无栏
    expect(state.value.woodblockFrame).toBe(true)
  })
})
