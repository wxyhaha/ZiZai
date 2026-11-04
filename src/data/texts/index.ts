import type { TextCategory, TextEntry } from '@/types/text'
import { toTraditional } from '@/utils/hanziConvert'
import { preQinHanTexts } from './preQinHan'
import { weiJinTexts } from './weiJin'
import { tangTexts } from './tang'
import { songYuanTexts } from './songYuan'
import { mingQingModernTexts } from './mingQingModern'

export { preQinHanTexts, weiJinTexts, tangTexts, songYuanTexts, mingQingModernTexts }

export const texts: TextEntry[] = [
  ...preQinHanTexts,
  ...weiJinTexts,
  ...tangTexts,
  ...songYuanTexts,
  ...mingQingModernTexts,
]

export const textCategories = ['诗', '词', '赋', '散文', '其他'] as const

export const defaultTextId = 'xiang-ji-xuan'

/** 按 id 查文稿；找不到时回退到第一篇。默认返回繁体版。 */
export function getText(id: string, variant: 'traditional' | 'simplified' = 'traditional'): TextEntry {
  const base = texts.find((t) => t.id === id) ?? texts[0]
  if (variant === 'simplified') {
    return base
  }
  return {
    ...base,
    title: base.titleTrad || toTraditional(base.title),
    author: base.authorTrad || toTraditional(base.author),
    summary: base.summaryTrad || toTraditional(base.summary || ''),
    paragraphs: base.paragraphsTrad || base.paragraphs.map(toTraditional),
  }
}

export const getTextsByCategory = (category: TextCategory): TextEntry[] => {
  return texts.filter((t) => t.category === category)
}

export const getTextsByEraGroup = (
  eraGroup: '先秦两汉' | '魏晋' | '唐代' | '宋元' | '明清现代'
): TextEntry[] => {
  return texts.filter((t) => t.eraGroup === eraGroup)
}
