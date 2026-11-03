import type { LayoutMode } from './font'
import type { PaperThemeId } from '@/data/paperThemes'
import type { PunctuationStyleId } from '@/data/punctuationStyles'
import type { EraFormatId, EraFormat } from '@/data/eraFormats'
import type { ScriptStyleId, ScriptStyle } from '@/data/scriptStyles'

export type {
  PaperThemeId,
  PunctuationStyleId,
  EraFormatId,
  EraFormat,
  ScriptStyleId,
  ScriptStyle,
}

/**
 * 阅读状态：字体、文稿、版式三者的组合结果。
 * 这个类型是「渲染契约」——阅读组件只依赖它，不关心数据从哪来。
 */
export interface ReadingState {
  fontId: string
  /** 内置文稿 id。与 customText 互斥：有 customText 时忽略。 */
  textId: string | null
  /** 用户题写的纯文本，按空行分段。始终以文本节点渲染，禁止 innerHTML。 */
  customText: string | null
  layout: LayoutMode
  /** 正文字号，单位 px */
  fontSize: number
  /** 行高倍数 */
  lineHeight: number
  /** 字距，单位 em */
  letterSpacing: number
  /** 阅读画布的单栏宽度上限，单位 px */
  contentWidth: number
  /** 宣纸与古笺底色主题 */
  paperTheme: PaperThemeId
  /** 五大时代标点符号体系：先秦两汉、魏晋隋唐、宋元雕版、明清善本、近代现代 */
  punctuationStyle: PunctuationStyleId
  /** 时代装帧版面制式：先秦两汉、魏晋隋唐、宋元雕版、明清刻本、近代现代（竖排专享） */
  eraFormat: EraFormatId
  /** 书体排版规制：正书乌丝、行书淡栏、草书无栏（竖排专享） */
  scriptStyle: ScriptStyleId
  /** 古籍传统版框与中缝鱼尾：文武边栏、乌丝栏与中缝折页象鼻鱼尾（伴随时代自适应） */
  woodblockFrame: boolean
  /** 兼容性字段：是否为朱墨套印句读模式 */
  judouMode?: boolean
}

/** 排版预设：把一组阅读参数命名保存，用户可一键套用。 */
export interface LayoutPreset {
  id: string
  name: string
  /** 一句话说明这个版式适合什么 */
  description: string
  /** 与 ReadingState 中同名，套用时覆盖 */
  patch: Partial<Omit<ReadingState, 'fontId' | 'textId' | 'customText'>>
}
