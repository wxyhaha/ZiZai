import type { LayoutMode } from './font'

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
  /**
   * 对照模式下第二栏使用的字体 id。
   * 为 null 表示不处于对照模式 —— 对照是「阅读区的临时模式」，
   * 不是独立页面，所以它属于阅读状态而不是路由。
   */
  compareFontId: string | null
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
