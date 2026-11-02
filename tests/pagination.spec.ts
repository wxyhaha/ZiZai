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
})
