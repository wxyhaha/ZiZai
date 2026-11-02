import { readonly, ref } from 'vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import coverageData from '@/data/font-coverage.json'

/**
 * 缺字检测 + 按需加载「完整字体」。
 *
 * ## 背景（见 docs/decisions.md ADR-013）
 *
 * 内容子集只覆盖站内已收录的约 650 个字符。用户在题写面板输入自定义文字时，
 * 可能用到子集外的字。两种选择：
 *   (a) 让那些字回退到系统字体 —— 同一段文字里字形混杂，观感断裂；
 *   (b) 拉取该字体的完整版本（GB2312 全集）—— 一次 1.5–4 MB，
 *       之后该字体的任意常用汉字都是同一副字形。
 *
 * 产品决策采用 (b)，但**不预加载**：只有真的检测到缺字才请求。
 *
 * ## 为什么用同名 family 而不是另起名
 *
 * 通过 `document.fonts.add()` 后注入的 FontFace 在字体匹配中排在
 * CSS 里声明的子集之后。对子集已有的字，两者字形完全相同（同一套轮廓），
 * 所以切换过去没有视觉跳变；对子集没有的字，才真正用上完整字体。
 * 这样阅读组件不需要改任何 CSS 变量 —— 加载完成后页面自动补全字形。
 */

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CoverageEntry {
  subset: string
  full: string
}

const coverage = (coverageData as { fonts: Record<string, CoverageEntry> }).fonts

/** 解析后的码位集合，按字体 id 缓存 */
const rangeCache = new Map<string, Set<number>>()

/** 每款字体的完整字体加载状态（模块级，跨组件共享） */
const statusMap = ref<Record<string, LoadStatus>>({})

function parseRanges(spec: string): Set<number> {
  const out = new Set<number>()
  if (!spec) return out
  for (const part of spec.split(',')) {
    const token = part.trim()
    if (!token.startsWith('U+')) continue
    if (token.includes('-')) {
      const [a, b] = token.slice(2).split('-')
      const start = Number.parseInt(a, 16)
      const end = Number.parseInt(b, 16)
      // 防御异常数据：范围过大时跳过，避免构造超大集合
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue
      if (end - start > 0x20000) continue
      for (let cp = start; cp <= end; cp += 1) out.add(cp)
    } else {
      const cp = Number.parseInt(token.slice(2), 16)
      if (Number.isFinite(cp)) out.add(cp)
    }
  }
  return out
}

function rangeSet(fontId: string, kind: 'subset' | 'full'): Set<number> {
  const key = `${fontId}:${kind}`
  let set = rangeCache.get(key)
  if (!set) {
    set = parseRanges(coverage[fontId]?.[kind] ?? '')
    rangeCache.set(key, set)
  }
  return set
}

/** 统计 text 中有多少字符不在该字体的内容子集里（去重，忽略空白）。 */
export function countMissingInSubset(fontId: string, text: string): number {
  return countMissing(rangeSet(fontId, 'subset'), text)
}

/** 统计 text 中有多少字符连完整字体都覆盖不到。 */
export function countMissingInFull(fontId: string, text: string): number {
  return countMissing(rangeSet(fontId, 'full'), text)
}

function countMissing(set: Set<number>, text: string): number {
  if (set.size === 0) return 0
  let missing = 0
  for (const ch of new Set(text)) {
    if (/\s/.test(ch)) continue
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    if (!set.has(cp)) missing += 1
  }
  return missing
}

/** 从 family 字符串里取出第一个族名，去掉引号。 */
function primaryFamily(family: string): string {
  return (family.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '')
}

export function useFontLoading() {
  function statusOf(fontId: string): LoadStatus {
    return statusMap.value[fontId] ?? 'idle'
  }

  /**
   * 加载某款字体的完整版本。已就绪或正在加载时直接返回当前状态。
   * 失败时把状态置为 error 并返回，不抛异常 —— 调用方据此提示用户，
   * 让文字继续以子集 + 系统回退的方式显示，而不是打断输入。
   */
  async function loadFull(font: FontEntryWithAssets): Promise<LoadStatus> {
    const current = statusOf(font.id)
    if (current === 'ready' || current === 'loading') return current
    if (!font.assets) return 'error'

    statusMap.value = { ...statusMap.value, [font.id]: 'loading' }

    // 老浏览器或测试环境没有 FontFace API，降级为「不做任何事」，
    // 文字仍以子集 + 系统字体回退显示。
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') {
      statusMap.value = { ...statusMap.value, [font.id]: 'error' }
      return 'error'
    }

    try {
      const face = new FontFace(primaryFamily(font.family), `url("${font.assets.full}")`, {
        weight: '400',
        style: 'normal',
        display: 'swap',
      })
      await face.load()
      document.fonts.add(face)
      statusMap.value = { ...statusMap.value, [font.id]: 'ready' }
      return 'ready'
    } catch {
      statusMap.value = { ...statusMap.value, [font.id]: 'error' }
      return 'error'
    }
  }

  return {
    status: readonly(statusMap),
    statusOf,
    loadFull,
  }
}
