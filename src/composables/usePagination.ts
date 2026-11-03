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

/**
 * 中文排版禁则规则集合（参考 GB/T 15834-2011 标点符号用法与 W3C 中文排版需求 clreq）。
 * 避头标点：不可出现在行首或列首（句末点号、右括注号、后引号等）。
 */
export const LINE_START_FORBIDDEN = new Set([
  '，', '。', '、', '；', '：', '！', '？',
  '）', '》', '」', '』', '】', '〕', '〗', '］', '｝', '”', '’',
  '︶', '︷', '︸', '︹', '︺', '︼', '︽', '︾', '﹁', '﹂', '﹃', '﹄', '﹚', '﹛', '﹞',
  '!', '%', ')', ',', '.', ':', ';', '?', ']', '}', '"', "'",
  '·', '…', '—', '～', '¢', '°', '℃'
])

/**
 * 避尾标点：不可出现在行尾或列尾（前引号、左括注号、货币符号等）。
 */
export const LINE_END_FORBIDDEN = new Set([
  '（', '《', '「', '『', '【', '〔', '〖', '［', '｛', '“', '‘',
  '︵', '︷', '︹', '︻', '︽', '﹁', '﹃', '﹙', '﹜', '﹝',
  '(', '[', '{', '<', '$', '£', '¥'
])

export function shouldNotStartLine(char: string): boolean {
  return LINE_START_FORBIDDEN.has(char)
}

export function shouldNotEndLine(char: string): boolean {
  return LINE_END_FORBIDDEN.has(char)
}

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

/**
 * 动态估算首屏标题区占据的总高度：
 * 包含：标题行高（可能因过长而自动换行）、副标题（朝代+作者）行高、标题与副标题间距 (10px) 以及底部下外边距 (36px)。
 */
export function estimateTitleBlockHeight(input: PaginationInput, width: number): number {
  const safeWidth = Math.max(input.fontSize, width)
  // 标题字体 32px，行高 1.5 (48px)，字距 0.04em
  const titleTracking = 0.04 * 32
  let titleLines = 1
  let currentTitleWidth = 0
  for (const ch of characters(input.title)) {
    const adv = measure(input, ch, 32) + titleTracking
    if (currentTitleWidth > 0 && currentTitleWidth + adv > safeWidth) {
      titleLines++
      currentTitleWidth = adv
    } else {
      currentTitleWidth += adv
    }
  }
  const titleHeight = titleLines * 32 * 1.5

  const metadata = [input.era, input.author].filter(Boolean).join(' · ')
  let metaHeight = 0
  if (metadata.trim()) {
    // 副标题字体 var(--zz-text-sm) 即 13px，行高 1.6 (20.8px)，字距 0.18em，上间距 10px
    const metaTracking = 0.18 * 13
    let metaLines = 1
    let currentMetaWidth = 0
    for (const ch of characters(metadata)) {
      const adv = measure(input, ch, 13) + metaTracking
      if (currentMetaWidth > 0 && currentMetaWidth + adv > safeWidth) {
        metaLines++
        currentMetaWidth = adv
      } else {
        currentMetaWidth += adv
      }
    }
    metaHeight = 10 + metaLines * 13 * 1.6
  }

  // 底部留白 margin-bottom: 36px
  const headMarginBottom = 36
  return Math.round(titleHeight + metaHeight + headMarginBottom)
}

export function wrapHorizontal(text: string, input: PaginationInput, width: number): string[] {
  const chars = characters(text)
  if (chars.length === 0) return ['']

  const tracking = input.letterSpacing * input.fontSize
  const lines: string[] = []
  let currentChars: string[] = []
  let currentWidth = 2 * input.fontSize // 原段落首行缩进 2em

  for (let i = 0; i < chars.length; i++) {
    const character = chars[i]
    const advance = measure(input, character) + tracking

    if (currentChars.length > 0 && currentWidth + advance > width) {
      let breakIndex = currentChars.length

      // 避头处理：如果即将换行的字符是行首禁则标点，回退当前行末尾字符一起移至下一行
      if (shouldNotStartLine(character)) {
        while (breakIndex > 1 && (shouldNotStartLine(currentChars[breakIndex - 1]) || breakIndex === currentChars.length)) {
          breakIndex--
        }
      }

      // 避尾处理：如果分界处的上一个字符是行尾禁则标点，将其移至下一行
      while (breakIndex > 1 && shouldNotEndLine(currentChars[breakIndex - 1])) {
        breakIndex--
      }

      const lineStr = currentChars.slice(0, breakIndex).join('')
      const carryOver = currentChars.slice(breakIndex)

      lines.push(lineStr)
      currentChars = [...carryOver, character]
      currentWidth = currentChars.reduce((sum, ch) => sum + measure(input, ch) + tracking, 0)
    } else {
      currentChars.push(character)
      currentWidth += advance
    }
  }

  if (currentChars.length > 0) {
    lines.push(currentChars.join(''))
  }

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
  const titleBlockHeight = estimateTitleBlockHeight(input, textWidth)
  const pages = [createPage(0)]
  let usedHeight = 0
  let hasPreviousParagraph = false

  input.paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = wrapHorizontal(paragraph, input, textWidth)

    lines.forEach((line, lineIndex) => {
      let page = pages[pages.length - 1]
      const firstLine = lineIndex === 0
      let paragraphGap = firstLine && hasPreviousParagraph ? input.fontSize * 1.1 : 0
      let capacity = Math.max(lineHeight, bodyHeight - (page.hasHeader ? titleBlockHeight : 0))

      if (usedHeight + paragraphGap + lineHeight > capacity && page.paragraphs.length > 0) {
        page = createPage(pages.length)
        pages.push(page)
        usedHeight = 0
        paragraphGap = 0
        capacity = bodyHeight
      }

      // 极窄或矮视口下仍保留至少一行完整显示
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

export function splitVertical(
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
  const chars = characters(text)
  if (chars.length === 0) return ['']

  const columns: string[] = []
  let currentChars: string[] = []
  let currentHeight = 0

  for (let i = 0; i < chars.length; i++) {
    const character = chars[i]
    const advance = measure(input, character, fontSize) + tracking

    if (currentChars.length > 0 && currentHeight + advance > availableHeight) {
      let breakIndex = currentChars.length

      // 列首禁则处理：句末标点不得单独出现在列首
      if (shouldNotStartLine(character)) {
        while (breakIndex > 1 && (shouldNotStartLine(currentChars[breakIndex - 1]) || breakIndex === currentChars.length)) {
          breakIndex--
        }
      }

      // 列尾禁则处理：前置括号、前引号等不得单独出现在列尾
      while (breakIndex > 1 && shouldNotEndLine(currentChars[breakIndex - 1])) {
        breakIndex--
      }

      columns.push(currentChars.slice(0, breakIndex).join(''))
      const carryOver = currentChars.slice(breakIndex)
      currentChars = [...carryOver, character]
      currentHeight = currentChars.reduce((sum, ch) => sum + measure(input, ch, fontSize) + tracking, 0)
    } else {
      currentChars.push(character)
      currentHeight += advance
    }
  }

  if (currentChars.length > 0) {
    columns.push(currentChars.join(''))
  }

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
