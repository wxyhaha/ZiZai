import { computed, readonly, ref } from 'vue'
import type { LayoutMode, ReadingState } from '@/types'
import { defaultFontId, getFont } from '@/data/fonts'
import { defaultTextId, getText } from '@/data/texts'

/**
 * 阅读状态。
 *
 * 这是字体 × 文稿 × 版式的组合层：字体数据存于 data/fonts.ts，
 * 古文数据存于 data/texts.ts，二者互不引用，组合只在这里发生。
 *
 * 目前只有一个阅读视图，所以用模块级单例 ref；离开赏字再回来会保留设置。
 */
const DEFAULT_STATE: ReadingState = {
  fontId: defaultFontId,
  textId: defaultTextId,
  customText: null,
  layout: 'horizontal',
  fontSize: 19,
  lineHeight: 2.4,
  letterSpacing: 0.04,
  // 约 26–28 字/行。中文长文的舒适区间是 25–40 字，留白更疏朗大气。
  contentWidth: 660,
}

/** 题写字数上限。超出部分不进入渲染，避免超长文本拖慢排版。 */
export const CUSTOM_TEXT_LIMIT = 2000

const state = ref<ReadingState>({ ...DEFAULT_STATE })

export function useReadingState() {
  /** 当前生效的文稿：自定义文字优先于内置文稿。 */
  const activeText = computed(() => {
    const custom = state.value.customText
    if (custom && custom.trim()) {
      return {
        title: '自定文字',
        author: '由你题写',
        era: undefined,
        // 空行分段：一个空行即一个自然段
        paragraphs: custom
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean),
        category: '其他' as const,
      }
    }
    return getText(state.value.textId ?? defaultTextId)
  })

  const activeFont = computed(() => getFont(state.value.fontId))

  const isVertical = computed(() => state.value.layout === 'vertical')

  /** 当前是否处于题写模式（显示用户输入而非内置古文） */
  const isCustom = computed(() => Boolean(state.value.customText?.trim()))

  function setLayout(layout: LayoutMode) {
    state.value.layout = layout
  }

  function setFont(fontId: string) {
    state.value.fontId = fontId
  }

  function setText(textId: string) {
    state.value.textId = textId
    // 选内置文稿时清掉自定义文字，避免「看起来选了古文却在显示自写内容」
    state.value.customText = null
  }

  /** 应用题写内容。传入空串等同于退出题写模式。 */
  function setCustomText(text: string) {
    const trimmed = text.slice(0, CUSTOM_TEXT_LIMIT)
    state.value.customText = trimmed.trim() ? trimmed : null
  }

  /** 退出题写，回到当前选中的内置古文 */
  function clearCustomText() {
    state.value.customText = null
  }

  function setFontSize(size: number) {
    state.value.fontSize = Math.min(40, Math.max(14, Math.round(size)))
  }

  function setLineHeight(value: number) {
    state.value.lineHeight = Math.min(3, Math.max(1.4, Math.round(value * 10) / 10))
  }

  function setLetterSpacing(value: number) {
    // 0–0.2em：再大就不再是排版而是装饰了
    state.value.letterSpacing = Math.min(0.2, Math.max(0, Math.round(value * 1000) / 1000))
  }

  function setContentWidth(px: number) {
    state.value.contentWidth = Math.min(960, Math.max(440, Math.round(px)))
  }

  function reset() {
    state.value = { ...DEFAULT_STATE }
  }

  return {
    state: readonly(state),
    activeText,
    activeFont,
    isVertical,
    isCustom,
    setLayout,
    setFont,
    setText,
    setCustomText,
    clearCustomText,
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    setContentWidth,
    reset,
  }
}
