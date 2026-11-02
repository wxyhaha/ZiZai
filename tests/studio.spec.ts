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
  useReadingState().reset()
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
    for (const font of fonts.filter((f) => f.selfHosted)) {
      const sample = '，。、；：？！「」『』（）《》—…·0123456789ZiZai'
      expect(countMissingInSubset(font.id, sample), font.id).toBe(0)
    }
  })

  it('完整字体确实比内容子集覆盖更多字', () => {
    for (const font of fonts.filter((f) => f.selfHosted)) {
      // 「黠」在 GB2312 内、但不在内容子集里：完整字体应当能补上
      const inSubset = countMissingInSubset(font.id, '黠')
      const inFull = countMissingInFull(font.id, '黠')
      expect(inFull, `${font.id} 的完整字体应覆盖比子集更多的字`).toBeLessThan(inSubset)
    }
  })

  it('GB2312 之外的字连完整字体也覆盖不到', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInFull(huiwen.id, '龘')).toBeGreaterThan(0)
  })

  it('空白字符不计入缺字，重复字符只计一次', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(countMissingInSubset(huiwen.id, '   \n\n \t ')).toBe(0)
    expect(countMissingInSubset(huiwen.id, '龘龘龘龘')).toBe(1)
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

  it('子集缺字时提示并可加载完整字形', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '黠')
    await nextTick()

    expect(q('.glyph-notice').textContent).toContain('不在')
    expect(q('.glyph-notice__action').textContent).toContain('加载完整字形')
    wrapper.unmount()
  })

  it('连完整字体也没有的字会额外说明，不让用户误以为加载就能解决', async () => {
    const wrapper = await mountWriting()
    typeInto(q<HTMLTextAreaElement>('#draft-text'), '龘')
    await nextTick()

    expect(q('.glyph-notice--soft').textContent).toContain('完整字体也未收录')
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
  async function mountTypography(overrides: Record<string, number> = {}) {
    const wrapper = mount(TypographyPanel, {
      props: {
        open: true,
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

  it('渲染四个参数控件', async () => {
    const wrapper = await mountTypography()
    expect(qa('.control')).toHaveLength(4)
    expect(qa('.slider')).toHaveLength(4)
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

  it('恢复默认排版会一次性重置四项参数', async () => {
    const wrapper = await mountTypography({
      fontSize: 34,
      lineHeight: 2.8,
      letterSpacing: 0.15,
      contentWidth: 900,
    })
    q<HTMLButtonElement>('.reset').click()
    await nextTick()

    expect(wrapper.emitted('update:fontSize')?.[0]).toEqual([22])
    expect(wrapper.emitted('update:lineHeight')?.[0]).toEqual([2.2])
    expect(wrapper.emitted('update:letterSpacing')?.[0]).toEqual([0.035])
    expect(wrapper.emitted('update:contentWidth')?.[0]).toEqual([680])
    wrapper.unmount()
  })
})
