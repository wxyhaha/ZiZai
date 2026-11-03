import { getEraFormat, getEraFormatByTextEra } from '@/data/eraFormats'
import { getEraPunctuationStyle, getPunctuationStyle, sanitizeTextForEra, type PunctuationStyleId } from '@/data/punctuationStyles'
import { getScriptStyle, getScriptStyleByFont } from '@/data/scriptStyles'

/** 年代仅作风格推断；未知年代采用保留原标点的默认竖排。 */
export function scrollTypography(era: string | undefined, fontId: string, styleTag?: string) {
  const known = era && /商|周|春秋|战国|先秦|秦|汉|魏|晋|三国|六朝|南北朝|隋|唐|五代|宋|辽|金|元|明|清|现|当|近/.test(era)
  const punctuation = getPunctuationStyle(known ? getEraPunctuationStyle(era) : 'modern')
  const format = getEraFormat(known ? getEraFormatByTextEra(era) : 'modern')
  const script = getScriptStyle(getScriptStyleByFont(fontId, styleTag))
  return { punctuation, format, script }
}

/** 句读与前一字绑定，避免跨列孤悬；其余内容保留为文本串，避免逐字 DOM。 */
export function scrollSegments(source: string, style: PunctuationStyleId) {
  const display = sanitizeTextForEra(source, style)
  if (style === 'modern') return [{ text: display, mark: '' }]
  const segments: { text: string; mark: string }[] = []
  let run = ''
  for (const char of display) {
    if (char === '，' || char === '。') {
      const chars = Array.from(run)
      const anchor = chars.pop() ?? ''
      if (chars.length) segments.push({ text: chars.join(''), mark: '' })
      segments.push({ text: anchor, mark: char })
      run = ''
    } else run += char
  }
  if (run) segments.push({ text: run, mark: '' })
  return segments
}
