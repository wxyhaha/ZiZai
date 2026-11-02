import type { LayoutMode } from '@/types'

export interface PageParagraph {
  text: string
  paragraphIndex: number
  /** 原段落首行只在原文第一行缩进；跨页续段不重复缩进。 */
  indent: boolean
  /** 原段落在本页是否结束，用于保留段间距。 */
  paragraphEnd: boolean
}

export interface PageColumn {
  kind: 'title' | 'meta' | 'body' | 'gap'
  text: string
  width: number
}

export interface BookPage {
  index: number
  hasHeader: boolean
  paragraphs: PageParagraph[]
  columns: PageColumn[]
}

export interface PaginationInput {
  title: string
  author: string
  era?: string
  paragraphs: string[]
  layout: LayoutMode
  fontFamily: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
  pageWidth: number
  pageHeight: number
  measureCharacter?: (character: string, fontSize: number, fontFamily: string) => number
}

const HORIZONTAL_INLINE_PADDING = 112
const HORIZONTAL_BLOCK_PADDING = 92
const VERTICAL_INLINE_PADDING = 104
const VERTICAL_BLOCK_PADDING = 86
const TITLE_BLOCK_HEIGHT = 116

function createPage(index: number): BookPage {
  return { index, hasHeader: index === 0, paragraphs: [], columns: [] }
}

function characters(text: string): string[] {
  return Array.from(text)
}

function measure(input: PaginationInput, character: string, size = input.fontSize): number {
  const measured = input.measureCharacter?.(character, size, input.fontFamily)
  return Math.max(0.01, measured ?? size)
}

function wrapHorizontal(text: string, input: PaginationInput, width: number): string[] {
  const chars = characters(text)
  if (chars.length === 0) return ['']

  const tracking = input.letterSpacing * input.fontSize
  const lines: string[] = []
  let line = ''
  let used = 2 * input.fontSize

  for (const character of chars) {
    const advance = measure(input, character) + tracking
    if (line && used + advance > width) {
      lines.push(line)
      line = ''
      used = 0
    }
    line += character
    used += advance
  }

  if (line) lines.push(line)
  return lines
}

function paginateHorizontal(input: PaginationInput): BookPage[] {
  const pageWidth = Math.max(1, input.pageWidth)
  const pageHeight = Math.max(1, input.pageHeight)
  const textWidth = Math.max(
    input.fontSize,
    Math.min(input.contentWidth, pageWidth - HORIZONTAL_INLINE_PADDING),
  )
  const lineHeight = input.fontSize * input.lineHeight
  const bodyHeight = Math.max(lineHeight, pageHeight - HORIZONTAL_BLOCK_PADDING)
  const pages = [createPage(0)]
  let usedHeight = 0
  let hasPreviousParagraph = false

  input.paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = wrapHorizontal(paragraph, input, textWidth)

    lines.forEach((line, lineIndex) => {
      let page = pages[pages.length - 1]
      const firstLine = lineIndex === 0
      let paragraphGap = firstLine && hasPreviousParagraph ? input.fontSize * 1.1 : 0
      let capacity = Math.max(lineHeight, bodyHeight - (page.hasHeader ? TITLE_BLOCK_HEIGHT : 0))

      if (usedHeight + paragraphGap + lineHeight > capacity && page.paragraphs.length > 0) {
        page = createPage(pages.length)
        pages.push(page)
        usedHeight = 0
        paragraphGap = 0
        capacity = bodyHeight
      }

      // Extremely short windows still show at least one complete line.
      usedHeight = Math.min(capacity, usedHeight + paragraphGap + lineHeight)
      const paragraphEnd = lineIndex === lines.length - 1
      const previous = page.paragraphs[page.paragraphs.length - 1]

      if (previous && paragraphIndex === previous.paragraphIndex) {
        previous.text += `\n${line}`
        previous.paragraphEnd = paragraphEnd
      } else {
        page.paragraphs.push({
          text: line,
          indent: firstLine,
          paragraphEnd,
          paragraphIndex,
        })
      }

      if (paragraphEnd) hasPreviousParagraph = true
    })
  })

  return pages
}

function splitVertical(
  text: string,
  input: PaginationInput,
  fontSize = input.fontSize,
  trackingEm = input.letterSpacing,
): string[] {
  const availableHeight = Math.max(
    fontSize,
    input.pageHeight - VERTICAL_BLOCK_PADDING,
  )
  const tracking = trackingEm * fontSize
  const columns: string[] = []
  let column = ''
  let usedHeight = 0

  for (const character of characters(text)) {
    const advance = measure(input, character, fontSize) + tracking
    if (column && usedHeight + advance > availableHeight) {
      columns.push(column)
      column = ''
      usedHeight = 0
    }
    column += character
    usedHeight += advance
  }

  if (column) columns.push(column)
  return columns
}

function paginateVertical(input: PaginationInput): BookPage[] {
  const pageWidth = Math.max(1, input.pageWidth)
  const innerWidth = Math.max(
    input.fontSize,
    Math.min(input.contentWidth, pageWidth - VERTICAL_INLINE_PADDING),
  )
  const bodyColumnWidth = input.fontSize * input.lineHeight
  const titleColumnWidth = 20 * 1.6
  const metaColumnWidth = 13 * 1.6
  const pages = [createPage(0)]
  let usedWidth = 0

  const append = (column: PageColumn) => {
    let page = pages[pages.length - 1]
    if (usedWidth + column.width > innerWidth && page.columns.length > 0) {
      page = createPage(pages.length)
      pages.push(page)
      usedWidth = 0
    }
    page.columns.push(column)
    usedWidth += column.width
  }

  splitVertical(input.title, input, 20, 0.14).forEach((text) => {
    append({ kind: 'title', text, width: titleColumnWidth })
  })
  const metadata = [input.era, input.author].filter(Boolean).join(' · ')
  if (metadata) {
    splitVertical(metadata, input, 13, 0.08).forEach((text) => {
      append({ kind: 'meta', text, width: metaColumnWidth })
    })
  }

  input.paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex > 0) {
      const current = pages[pages.length - 1]
      if (current.columns.length > 0) append({ kind: 'gap', text: '', width: input.fontSize * 1.5 })
    }
    splitVertical(paragraph, input).forEach((text) => {
      append({ kind: 'body', text, width: bodyColumnWidth })
    })
  })

  return pages
}

/**
 * 分页使用真实字形测量宽度，按行盒 / 竖列容量拆分段落；分页结果只依赖输入，
 * 相同文章、字体、字号、间距和版心尺寸会得到相同页面边界。
 */
export function paginateText(input: PaginationInput): BookPage[] {
  return input.layout === 'vertical' ? paginateVertical(input) : paginateHorizontal(input)
}

export const BOOK_PAGE_METRICS = {
  horizontalInlinePadding: HORIZONTAL_INLINE_PADDING,
  horizontalBlockPadding: HORIZONTAL_BLOCK_PADDING,
  verticalInlinePadding: VERTICAL_INLINE_PADDING,
  verticalBlockPadding: VERTICAL_BLOCK_PADDING,
} as const
