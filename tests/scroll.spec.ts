import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { scrollSegments, scrollTypography } from '@/composables/scrollTypography'
import { texts } from '@/data/texts'
import { fonts } from '@/data/fonts'
import { sanitizeTextForEra } from '@/data/punctuationStyles'
import { useReadingState } from '@/composables/useReadingState'
import ScrollViewer from '@/components/studio/ScrollViewer.vue'

describe('连续手卷排版', () => {
  it('百篇典籍全文显示层不丢字且不修改原文', () => {
    for (const text of texts) {
      const original = [...text.paragraphs]
      const style = scrollTypography(text.era, 'huawen-mingchao').punctuation.id
      for (const p of text.paragraphs) {
        const segments = scrollSegments(p, style)
        expect(segments.map(s => s.text + s.mark).join('')).toBe(sanitizeTextForEra(p, style))
        expect(segments.every(s => !s.mark || Array.from(s.text).length === 1)).toBe(true)
      }
      expect(text.paragraphs).toEqual(original)
    }
  })
  it('年代与书体复用既有规则，未知年代保留现代标点', () => {
    const eras = ['先秦', '东晋', '唐', '宋', '明', '现代', undefined, '未知']
    expect(eras.map(era => scrollTypography(era, 'huawen-mingchao').punctuation.id))
      .toEqual(['pre-qin', 'wei-jin', 'wei-jin', 'song-yuan', 'ming-qing', 'modern', 'modern', 'modern'])
    expect(scrollTypography('唐', 'rhyme-grass', '书法').script.columnLineStyle).toBe('none')
    expect(scrollSegments('“𠮷”：ABC，123。', 'modern')).toEqual([{ text: '“𠮷”：ABC，123。', mark: '' }])
    expect(scrollSegments('𠮷。', 'pre-qin')).toEqual([{ text: '𠮷', mark: '。' }])
  })
  it('卷轴共享文稿与字体时不触碰书本排版', () => {
    const reading = useReadingState()
    reading.resetToDefaults()
    reading.setFontSize(24)
    reading.setPaperTheme('white')
    const before = { ...reading.state.value }
    reading.setText(texts[0]!.id, false)
    reading.setFont('rhyme-grass', false)
    const { fontId, textId, ...layout } = reading.state.value
    expect(fontId).toBe('rhyme-grass')
    expect(textId).toBe(texts[0]!.id)
    const { fontId: oldFont, textId: oldText, ...beforeLayout } = before
    expect(oldFont).not.toBe(fontId)
    expect(oldText).toBeTruthy()
    expect(layout).toEqual(beforeLayout)
    reading.resetToDefaults()
  })
  it('卷轴卷首清朗题署，卷尾钤盖朱红字在印，废除生硬终字且紧凑列距', () => {
    const font = fonts[0]!
    const wrapper = mount(ScrollViewer, {
      props: {
        title: '兰亭集序',
        author: '王羲之',
        era: '东晋',
        paragraphs: ['永和九年，岁在癸丑。'],
        font,
        fontSize: 48,
        paperTheme: 'white',
      },
    })
    const heading = wrapper.find('.scroll-heading')
    expect(heading.exists()).toBe(true)
    expect(heading.find('.scroll-seal').exists()).toBe(false)
    expect(heading.text()).toContain('兰亭集序')
    expect(heading.text()).toContain('王羲之')

    const ending = wrapper.find('.scroll-ending')
    expect(ending.exists()).toBe(true)
    expect(ending.text()).not.toContain('终')
    const seal = ending.find('.scroll-seal')
    expect(seal.exists()).toBe(true)
    expect(seal.text()).toBe('字在')

    const viewer = wrapper.find('.scroll-viewer')
    expect(viewer.attributes('style')).toContain('--scroll-leading: 1.15')
  })

  it('卷轴模式诗词排版：55px大字规制自适应单句成列，小字规制一联一行，杜绝字词腰斩', () => {
    const font = fonts[0]!
    const poemParagraphs = [
      '春江潮水连海平，海上明月共潮生。',
      '滟滟随波千万里，何处春江无月明！',
    ]

    // 1. 55px 大字号情景（在 600px 默认可用高度下，一联 14 字超高，自适应降级为单句成列）
    const wrapperLarge = mount(ScrollViewer, {
      props: {
        title: '春江花月夜',
        author: '张若虚',
        era: '唐',
        category: '诗',
        paragraphs: poemParagraphs,
        font,
        fontSize: 55,
        paperTheme: 'white',
      },
    })

    const poetryBodyLarge = wrapperLarge.find('.scroll-body--poetry')
    expect(poetryBodyLarge.exists()).toBe(true)

    const colsLarge = wrapperLarge.findAll('.scroll-column')
    expect(colsLarge).toHaveLength(4)
    expect(colsLarge[0].text()).toContain('春江潮水连海平')
    expect(colsLarge[1].text()).toContain('海上明月共潮生')
    expect(colsLarge[2].text()).toContain('滟滟随波千万里')
    expect(colsLarge[3].text()).toContain('何处春江无月明')

    // 2. 20px 小字号情景（一联 14 字仅需 ~280px，600px 高度充裕，自适应采用一联一行）
    const wrapperSmall = mount(ScrollViewer, {
      props: {
        title: '春江花月夜',
        author: '张若虚',
        era: '唐',
        category: '诗',
        paragraphs: poemParagraphs,
        font,
        fontSize: 20,
        paperTheme: 'white',
      },
    })

    const colsSmall = wrapperSmall.findAll('.scroll-column')
    expect(colsSmall).toHaveLength(2)
    expect(colsSmall[0].text()).toContain('春江潮水连海平')
    expect(colsSmall[0].text()).toContain('海上明月共潮生')
    expect(colsSmall[1].text()).toContain('滟滟随波千万里')
    expect(colsSmall[1].text()).toContain('何处春江无月明')
  })
})
