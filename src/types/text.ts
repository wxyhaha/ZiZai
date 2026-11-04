/** 古文内容数据模型。与字体、版式完全解耦。 */

export type TextCategory = '诗' | '词' | '赋' | '散文' | '其他'

export interface TextEntry {
  id: string
  title: string
  /** 权威底本繁体题名 */
  titleTrad?: string
  author: string
  /** 权威底本繁体作者 */
  authorTrad?: string
  /** 朝代，例如「明」「北宋」 */
  era?: string
  category: TextCategory
  /** 段落数组。每个元素是一个自然段，渲染为独立 <p>。 */
  paragraphs: string[]
  /** 权威底本繁体段落数组 */
  paragraphsTrad?: string[]
  /** 原文校对来源，供核查与追溯使用 */
  sourceUrl: string
  /** 来源页的作品标题 */
  sourceTitle?: string
  /** 是否仅为节选；所有内置条目都显式记录此字段 */
  isExcerpt: boolean
  /** 题解 / 一句话介绍，用于选集卡片 */
  summary?: string
  /** 繁体题解 */
  summaryTrad?: string
  /** 是否为短章（诗、词、短赋），影响默认版式建议 */
  isShortForm?: boolean
}
