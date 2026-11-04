import { describe, expect, it } from 'vitest'
import { paginateText, type PaginationInput } from '@/composables/usePagination'

function input(overrides: Partial<PaginationInput> = {}): PaginationInput {
  return {
    title: '山居秋暝',
    author: '王维',
    era: '唐',
    paragraphs: ['空山新雨后，天气晚来秋。', '明月松间照，清泉石上流。'],
    layout: 'horizontal',
    fontFamily: 'Test Serif',
    fontSize: 12,
    lineHeight: 1.6,
    letterSpacing: 0.02,
    contentWidth: 120,
    pageWidth: 220,
    pageHeight: 260,
    measureCharacter: () => 12,
    ...overrides,
  }
}

describe('书页分页', () => {
  it('短诗的一页包含标题、作者与全文', () => {
    const article = input({ pageWidth: 320, contentWidth: 200 })
    const pages = paginateText(article)
    expect(pages).toHaveLength(1)
    expect(pages[0].hasHeader).toBe(true)
    expect(pages[0].paragraphs.map((paragraph) => paragraph.text.replaceAll('\n', '')).join('')).toBe(
      article.paragraphs.join(''),
    )
  })

  it('横排按字形宽度断行并按页面高度分页，跨页后文字连续', () => {
    const article = input({
      paragraphs: ['春风'.repeat(80)],
      pageHeight: 210,
      contentWidth: 72,
      measureCharacter: (_character, fontSize) => fontSize,
    })
    const pages = paginateText(article)
    const renderedText = pages
      .flatMap((page) => page.paragraphs)
      .map((paragraph) => paragraph.text.replaceAll('\n', ''))
      .join('')

    expect(pages.length).toBeGreaterThan(1)
    expect(renderedText).toBe(article.paragraphs.join(''))
    expect(pages[0].paragraphs[0].indent).toBe(true)
    expect(pages[1].paragraphs[0].indent).toBe(false)
  })

  it('分页对相同输入稳定，并随字体字号和版心宽度变化重新计算', () => {
    const article = input({ paragraphs: ['字'.repeat(240)], pageHeight: 250 })
    const first = paginateText(article)
    expect(paginateText(article)).toEqual(first)

    const larger = paginateText({ ...article, fontSize: 20 })
    const narrower = paginateText({ ...article, contentWidth: 72 })
    const widerGlyph = paginateText({
      ...article,
      measureCharacter: (_character, fontSize) => fontSize * 1.25,
    })
    expect(larger.length).toBeGreaterThan(first.length)
    expect(narrower.length).toBeGreaterThan(first.length)
    expect(widerGlyph.length).toBeGreaterThan(first.length)
  })

  it('竖排以真实 writing-mode 的列序分页并保留正文顺序', () => {
    const article = input({
      layout: 'vertical',
      paragraphs: ['山水'.repeat(100), '云月'.repeat(90)],
      pageWidth: 300,
      pageHeight: 180,
      measureCharacter: () => 12,
    })
    const pages = paginateText(article)
    const renderedText = pages
      .flatMap((page) => page.columns)
      .filter((column) => column.kind === 'body')
      .map((column) => column.text)
      .join('')

    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0].columns[0].kind).toBe('title')
    expect(renderedText).toBe(article.paragraphs.join(''))
  })

  it('竖排字距和行距会改变列数与页面容量', () => {
    const article = input({
      layout: 'vertical',
      paragraphs: ['字'.repeat(120)],
      pageWidth: 250,
      pageHeight: 190,
      measureCharacter: () => 12,
    })
    const defaultPages = paginateText(article)
    const looseTracking = paginateText({ ...article, letterSpacing: 0.4 })
    const widerLeading = paginateText({ ...article, lineHeight: 2.8 })
    const narrowerBlock = paginateText({ ...article, contentWidth: 90 })

    const bodyColumnCount = (pages: ReturnType<typeof paginateText>) =>
      pages.flatMap((page) => page.columns).filter((column) => column.kind === 'body').length
    expect(bodyColumnCount(looseTracking)).toBeGreaterThan(bodyColumnCount(defaultPages))
    expect(widerLeading.length).toBeGreaterThan(defaultPages.length)
    expect(narrowerBlock.length).toBeGreaterThan(defaultPages.length)
  })

  it('中文标点避头法则：句末标点不得单独出现在下一行行首', () => {
    // 构造刚好在行末遇到逗号或句号的排版情景
    // 行宽设定为刚好容纳 5 个全角字（首行缩进占 2 个字，即正文放 3 个字）
    // 文字为「春风吹，又生。」
    // 若无避头处理：「春风吹」在第 1 行，「，又生」在第 2 行（逗号落入第 2 行行首）
    // 有避头处理后：第 1 行回退「吹」，变为「春风」，第 2 行变为「吹，又生。」
    const article = input({
      paragraphs: ['春风吹，又生。'],
      fontSize: 10,
      letterSpacing: 0,
      contentWidth: 50, // 5个字宽 (首行缩进占 20px，行宽剩余 30px，刚好容纳 3 个字)
      pageWidth: 200,
      pageHeight: 300,
      measureCharacter: () => 10,
    })
    const pages = paginateText(article)
    const lines = pages[0].paragraphs[0].text.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    // 每一行的首字符都绝不能是避头标点
    const forbiddenStarts = ['，', '。', '！', '？', '；', '：', '）', '》', '”']
    for (const line of lines) {
      expect(forbiddenStarts.includes(line[0])).toBe(false)
    }
  })

  it('中文标点避尾法则：前括号与前引号不得单独出现在行尾', () => {
    // 构造「读《庄子》」情景，如果「《」刚好落在行尾，必须移至下一行行首
    const article = input({
      paragraphs: ['天之道《庄子》也。'],
      fontSize: 10,
      letterSpacing: 0,
      contentWidth: 60, // 6个字宽 (缩进20px + 4个字) ->「天之道《」刚好5个字符触发折行
      pageWidth: 200,
      pageHeight: 300,
      measureCharacter: () => 10,
    })
    const pages = paginateText(article)
    const lines = pages[0].paragraphs[0].text.split('\n')
    const forbiddenEnds = ['《', '（', '“', '「']
    for (const line of lines) {
      const lastChar = line[line.length - 1]
      expect(forbiddenEnds.includes(lastChar)).toBe(false)
    }
  })

  it('竖排禁则处理：列首无句末标点，列尾无前置标点', () => {
    const article = input({
      layout: 'vertical',
      paragraphs: ['春风吹，又生。天之道《庄子》也。'],
      fontSize: 12,
      letterSpacing: 0,
      pageHeight: 120, // 较矮视口，迫使频繁折列
      pageWidth: 300,
      measureCharacter: () => 12,
    })
    const pages = paginateText(article)
    const bodyCols = pages.flatMap((p) => p.columns).filter((c) => c.kind === 'body')
    const forbiddenStarts = ['，', '。', '！', '？', '；', '：', '）', '》', '”']
    const forbiddenEnds = ['《', '（', '“', '「']
    for (const col of bodyCols) {
      if (col.text.length > 0) {
        expect(forbiddenStarts.includes(col.text[0])).toBe(false)
        expect(forbiddenEnds.includes(col.text[col.text.length - 1])).toBe(false)
      }
    }
  })

  it('动态标题高度估算：长标题比短标题占用更多首屏高度，并自适应扣减正文容量', () => {
    const shortArticle = input({
      title: '短诗',
      author: '作者',
      paragraphs: ['这是测试段落。'.repeat(10)],
      pageHeight: 280,
      contentWidth: 200,
    })
    const longArticle = input({
      title: '这是一篇拥有极其冗长双行标题的古代文学长赋测试题目',
      author: '作者',
      paragraphs: ['这是测试段落。'.repeat(10)],
      pageHeight: 280,
      contentWidth: 200,
    })
    const shortPages = paginateText(shortArticle)
    const longPages = paginateText(longArticle)

    // 长标题占用了更多高度，导致第 1 页能容纳的正文行数减少，因而总页数增加或第 1 页段落文字变短
    const shortPage1Lines = shortPages[0].paragraphs[0].text.split('\n').length
    const longPage1Lines = longPages[0].paragraphs[0].text.split('\n').length
    expect(longPage1Lines).toBeLessThan(shortPage1Lines)
  })

  it('诗歌竖排自适应：高度充裕时一联一行，高度受限时单句成列，杜绝字词腰斩', () => {
    // 1. 高度充裕情景：五言两联，availableHeight = 350 - 86 = 264px
    // 一联 12 个字（含标点）* 12px = 144px <= 264px -> 一联一行
    const poemAmple = input({
      title: '山居秋暝',
      category: '诗',
      layout: 'vertical',
      paragraphs: ['空山新雨后，天气晚来秋。明月松间照，清泉石上流。'],
      fontSize: 12,
      pageHeight: 350,
      pageWidth: 400,
      measureCharacter: () => 12,
    })
    const amplePages = paginateText(poemAmple)
    const ampleBodyCols = amplePages.flatMap((p) => p.columns).filter((c) => c.kind === 'body')
    expect(ampleBodyCols).toHaveLength(2)
    expect(ampleBodyCols[0].text).toBe('空山新雨后，天气晚来秋。')
    expect(ampleBodyCols[1].text).toBe('明月松间照，清泉石上流。')

    // 2. 高度受限情景：字号调大到 20px，availableHeight = 280 - 86 = 194px
    // 一联 12 个字 * 20px = 240px > 194px -> 自动降级为单句成列
    // 单句 6 个字 * 20px = 120px <= 194px -> 单句成列，出句对句各一列
    const poemRestricted = input({
      title: '山居秋暝',
      category: '诗',
      layout: 'vertical',
      paragraphs: ['空山新雨后，天气晚来秋。明月松间照，清泉石上流。'],
      fontSize: 20,
      pageHeight: 280,
      pageWidth: 500,
      measureCharacter: () => 20,
    })
    const restrictedPages = paginateText(poemRestricted)
    const restrictedBodyCols = restrictedPages.flatMap((p) => p.columns).filter((c) => c.kind === 'body')
    expect(restrictedBodyCols).toHaveLength(4)
    expect(restrictedBodyCols[0].text).toBe('空山新雨后，')
    expect(restrictedBodyCols[1].text).toBe('天气晚来秋。')
    expect(restrictedBodyCols[2].text).toBe('明月松间照，')
    expect(restrictedBodyCols[3].text).toBe('清泉石上流。')

    // 3. 全文文字 100% 完整保留，字词绝不腰斩
    expect(restrictedBodyCols.map((c) => c.text).join('')).toBe(poemRestricted.paragraphs[0])
  })

  it('诗歌横排自适应：诗句不采用散文首行缩进，且出句对句按韵律自适应排布', () => {
    const poem = input({
      title: '春江花月夜',
      category: '诗',
      layout: 'horizontal',
      paragraphs: ['春江潮水连海平，海上明月共潮生。', '滟滟随波千万里，何处春江无月明！'],
      fontSize: 14,
      contentWidth: 300,
      pageHeight: 400,
      measureCharacter: () => 14,
    })
    const pages = paginateText(poem)
    expect(pages[0].paragraphs.every((p) => p.indent === false)).toBe(true)
    const allLines = pages.flatMap((p) => p.paragraphs).flatMap((p) => p.text.split('\n'))
    expect(allLines.join('')).toBe(poem.paragraphs.join(''))
  })
})
