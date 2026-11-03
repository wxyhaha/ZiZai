import { computed, readonly, ref } from 'vue'
import type { LayoutMode, ReadingState } from '@/types'
import { defaultFontId, getFont } from '@/data/fonts'
import { defaultTextId, getText } from '@/data/texts'
import { defaultPaperThemeId, type PaperThemeId } from '@/data/paperThemes'
import {
  getEraPunctuationStyle,
  getPunctuationStyle,
  type PunctuationStyleId,
} from '@/data/punctuationStyles'
import {
  getEraFormat,
  getEraFormatByTextEra,
  type EraFormatId,
} from '@/data/eraFormats'
import {
  getScriptStyleByFont,
  type ScriptStyleId,
} from '@/data/scriptStyles'

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
  fontSize: 30,
  lineHeight: 2.4,
  letterSpacing: 0.04,
  // 约 26–28 字/行。中文长文的舒适区间是 25–40 字，留白更疏朗大气。
  contentWidth: 660,
  paperTheme: defaultPaperThemeId,
  punctuationStyle: 'modern',
  eraFormat: 'modern',
  scriptStyle: 'regular',
  woodblockFrame: false,
  judouMode: false,
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
    // 策略 A：古代四大标点、古代装帧与书体规制在版本学上依附于字方行隙，仅支持竖排直行
    // 若手动切回横排，智能回退为现代标点、现代通栏并关闭版框
    if (layout === 'horizontal') {
      if (state.value.punctuationStyle !== 'modern') {
        state.value.punctuationStyle = 'modern'
        state.value.judouMode = false
      }
      if (state.value.eraFormat !== 'modern') {
        state.value.eraFormat = 'modern'
      }
      if (state.value.scriptStyle !== 'regular') {
        state.value.scriptStyle = 'regular'
      }
      state.value.woodblockFrame = false
    } else if (layout === 'vertical') {
      // 若切入竖排且当前文稿属于古代，自动恢复其对应朝代的默认古代标点与古籍版框
      const targetEraFormat = getEraFormatByTextEra(activeText.value.era)
      const eraStyle = getEraPunctuationStyle(activeText.value.era)
      const smartScript = getScriptStyleByFont(activeFont.value.id, activeFont.value.styleTag)

      if (state.value.eraFormat === 'modern' && targetEraFormat !== 'modern') {
        state.value.eraFormat = targetEraFormat
        const formatDef = getEraFormat(targetEraFormat)
        state.value.woodblockFrame =
          formatDef.borderStyle !== 'none' || formatDef.fishtailStyle !== 'none'
      }
      if (state.value.punctuationStyle === 'modern' && eraStyle !== 'modern') {
        state.value.punctuationStyle = eraStyle
        state.value.judouMode = eraStyle === 'ming-qing'
      }
      state.value.scriptStyle = smartScript
    }
  }

  function setFont(fontId: string) {
    state.value.fontId = fontId
    // 智能书体联动：若切换为草书（如《韵草体》），竖排时自动联动草书无栏规制以防切笔
    const targetFont = getFont(fontId)
    const smartScript = getScriptStyleByFont(fontId, targetFont.styleTag)
    if (state.value.layout === 'vertical') {
      state.value.scriptStyle = smartScript
    }
  }

  function setText(textId: string) {
    state.value.textId = textId
    // 选内置文稿时清掉自定义文字，避免「看起来选了古文却在显示自写内容」
    state.value.customText = null

    // 核心朝代联动：切换文章时，自动推导该文章所属朝代的默认标点与时代装帧版框
    const targetText = getText(textId)
    const eraStyle = getEraPunctuationStyle(targetText.era)
    const eraFormat = getEraFormatByTextEra(targetText.era)
    const isAncient = eraFormat !== 'modern' || eraStyle !== 'modern'

    state.value.punctuationStyle = eraStyle
    state.value.eraFormat = eraFormat
    state.value.judouMode = eraStyle === 'ming-qing'
    const formatDef = getEraFormat(eraFormat)
    state.value.woodblockFrame =
      isAncient &&
      (formatDef.borderStyle !== 'none' || formatDef.fishtailStyle !== 'none')

    // 策略 A：古代文稿强制联动切换为古籍竖排，现代文稿默认横排
    if (isAncient) {
      state.value.layout = 'vertical'
      state.value.scriptStyle = getScriptStyleByFont(activeFont.value.id, activeFont.value.styleTag)
    }
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

  function setPaperTheme(theme: PaperThemeId) {
    state.value.paperTheme = theme
  }

  /** 切换时代标点风格：前四种古代标点依据策略 A 强联动切换为竖排 */
  function setPunctuationStyle(styleId: PunctuationStyleId, syncFrame = true) {
    state.value.punctuationStyle = styleId
    state.value.judouMode = styleId === 'ming-qing'

    // 策略 A：古代标点专属于竖排直行排版，选择时自动联动切换为竖排
    if (styleId !== 'modern') {
      state.value.layout = 'vertical'
    }

    if (syncFrame) {
      const styleDef = getPunctuationStyle(styleId)
      state.value.woodblockFrame =
        styleId !== 'modern' &&
        (styleDef.accompanyingFrame.borderStyle !== 'none' ||
          styleDef.accompanyingFrame.fishtail !== 'none')
      if (styleId !== 'modern') {
        state.value.eraFormat = styleId as EraFormatId
      }
    }
  }

  /** 切换时代装帧制式：前四种古代装帧依据策略 A 强联动切换为竖排 */
  function setEraFormat(formatId: EraFormatId, syncFrame = true) {
    state.value.eraFormat = formatId

    // 策略 A：古代时代装帧专属于竖排直行排版，选择时自动联动切换为竖排
    if (formatId !== 'modern') {
      state.value.layout = 'vertical'
    }

    if (syncFrame) {
      const formatDef = getEraFormat(formatId)
      state.value.woodblockFrame =
        formatId !== 'modern' &&
        (formatDef.borderStyle !== 'none' || formatDef.fishtailStyle !== 'none')
    }
  }

  /** 切换书体排版规制：依策略 A 联动 */
  function setScriptStyle(scriptStyle: ScriptStyleId) {
    state.value.scriptStyle = scriptStyle
    if (scriptStyle !== 'regular' && state.value.layout === 'horizontal') {
      state.value.layout = 'vertical'
    }
  }

  function setJudouMode(enabled: boolean) {
    state.value.judouMode = enabled
    if (!enabled && state.value.punctuationStyle === 'ming-qing') {
      state.value.punctuationStyle = 'modern'
    } else if (enabled && state.value.punctuationStyle === 'modern') {
      state.value.punctuationStyle = 'ming-qing'
      state.value.layout = 'vertical'
    }
  }

  function setWoodblockFrame(enabled: boolean) {
    state.value.woodblockFrame = enabled
  }

  /** 恢复默认排版：保留当前字体与文选，自动恢复当前文章所属朝代的默认标点、时代装帧与书体规制 */
  function reset() {
    const currentEra = activeText.value.era
    const eraStyle = getEraPunctuationStyle(currentEra)
    const targetEraFormat = getEraFormatByTextEra(currentEra)
    const formatDef = getEraFormat(targetEraFormat)
    const smartScript = getScriptStyleByFont(activeFont.value.id, activeFont.value.styleTag)
    const isAncient = targetEraFormat !== 'modern' || eraStyle !== 'modern'

    state.value = {
      ...DEFAULT_STATE,
      fontId: state.value.fontId,
      textId: state.value.textId,
      customText: state.value.customText,
      layout: isAncient ? 'vertical' : 'horizontal',
      paperTheme: defaultPaperThemeId,
      punctuationStyle: eraStyle,
      eraFormat: targetEraFormat,
      scriptStyle: smartScript,
      woodblockFrame:
        isAncient &&
        (formatDef.borderStyle !== 'none' || formatDef.fishtailStyle !== 'none'),
      judouMode: eraStyle === 'ming-qing',
    }
  }

  /** 重置所有阅读状态至初始状态（供测试与全局重置使用） */
  function resetToDefaults() {
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
    setPaperTheme,
    setPunctuationStyle,
    setEraFormat,
    setScriptStyle,
    setJudouMode,
    setWoodblockFrame,
    reset,
    resetToDefaults,
  }
}
