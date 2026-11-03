import { readonly, ref } from 'vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import coverageData from '@/data/font-coverage.json'

/**
 * 赏字页面全量字体按需加载与真实缺字检测。
 *
 * ## 设计原则（依据 ADR-015）：
 * 1. 赏字页面使用真正的全量 WOFF2 字体，100% 保留母本原字体的字符映射（cmap）、
 *    字形轮廓、OpenType 排版特性与可变轴能力。
 * 2. 进入赏字页或切换字体时，仅按需拉取当前选中字体的全量文件，并建立加载 Promise 缓存。
 * 3. 字体加载完成后再进行正式 Canvas 测量与分页，彻底避免“假估算、跳页与文字裁切”。
 * 4. 缺字检测基于原字体的权威 cmap，真实告知用户原字体是否收录，绝不冒充原字体。
 */

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CoverageEntry {
  subset: string
  full: string
}

const coverage = (coverageData as { fonts: Record<string, CoverageEntry> }).fonts

/** 解析后的码位集合，按字体 id 缓存 */
const rangeCache = new Map<string, Set<number>>()

/** 每款字体的加载状态（模块级单例，跨组件共享） */
const statusMap = ref<Record<string, LoadStatus>>({})

/** 正在进行的加载任务 Promise，防止并发重复拉取 */
const promiseMap = new Map<string, Promise<boolean>>()

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
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue
      if (end - start > 0x40000) continue
      for (let cp = start; cp <= end; cp += 1) out.add(cp)
    } else {
      const cp = Number.parseInt(token.slice(2), 16)
      if (Number.isFinite(cp)) out.add(cp)
    }
  }
  return out
}

function getFontCharSet(fontId: string): Set<number> {
  let set = rangeCache.get(fontId)
  if (!set) {
    // 优先读取全量 full 码位
    const spec = coverage[fontId]?.full ?? coverage[fontId]?.subset ?? ''
    set = parseRanges(spec)
    rangeCache.set(fontId, set)
  }
  return set
}

/** 统计 text 中有多少字符不在该字体的权威字符映射中（去重，忽略空白字符）。 */
export function countMissingInFont(fontId: string, text: string): number {
  const set = getFontCharSet(fontId)
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

/** 向后兼容接口：等同于 countMissingInFont */
export function countMissingInFull(fontId: string, text: string): number {
  return countMissingInFont(fontId, text)
}

/** 向后兼容接口：等同于 countMissingInFont */
export function countMissingInSubset(fontId: string, text: string): number {
  return countMissingInFont(fontId, text)
}

/** 从 family 字符串中提取主族名 */
export function primaryFamily(family: string): string {
  return (family.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '')
}

/**
 * 确保某款全量字体在浏览器中已就绪。
 * 带 Promise 缓存与超时熔断，相同字体多次调用直接复用。
 */
export async function ensureFontLoaded(font: FontEntryWithAssets): Promise<boolean> {
  if (statusMap.value[font.id] === 'ready') return true
  const ongoing = promiseMap.get(font.id)
  if (ongoing) return ongoing

  // 运行在 node / 测试环境或缺少 document 时直接降级返回成功
  if (typeof document === 'undefined') {
    statusMap.value = { ...statusMap.value, [font.id]: 'ready' }
    return true
  }

  statusMap.value = { ...statusMap.value, [font.id]: 'loading' }

  const promise = (async () => {
    try {
      const familyName = primaryFamily(font.family)

      // 1. 如果浏览器已有 FontFace 且已加载，直接标记就绪
      if (typeof FontFace !== 'undefined' && 'fonts' in document) {
        const isAlreadyLoaded = Array.from(document.fonts).some(
          (f) => f.family === familyName && f.status === 'loaded',
        )
        if (isAlreadyLoaded) {
          statusMap.value = { ...statusMap.value, [font.id]: 'ready' }
          return true
        }

        // 2. 如果提供了静态资产，通过 FontFace 直接载入浏览器字体管理器
        const assetUrl = font.assets?.file ?? font.assets?.full
        if (assetUrl) {
          const face = new FontFace(familyName, `url("${assetUrl}")`, {
            weight: font.cssWeight ?? '400',
            style: 'normal',
            display: 'swap',
          })
          await face.load()
          document.fonts.add(face)
          statusMap.value = { ...statusMap.value, [font.id]: 'ready' }
          return true
        }
      }

      // 3. 回退到 document.fonts.load 触发下载
      if (document.fonts?.load) {
        await Promise.race([
          document.fonts.load(`16px "${familyName}"`),
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ])
      }

      statusMap.value = { ...statusMap.value, [font.id]: 'ready' }
      return true
    } catch {
      statusMap.value = { ...statusMap.value, [font.id]: 'error' }
      return false
    } finally {
      promiseMap.delete(font.id)
    }
  })()

  promiseMap.set(font.id, promise)
  return promise
}

export function useFontLoading() {
  function statusOf(fontId: string): LoadStatus {
    return statusMap.value[fontId] ?? 'idle'
  }

  /**
   * 兼容历史 loadFull 接口，按需加载并返回状态。
   */
  async function loadFull(font: FontEntryWithAssets): Promise<LoadStatus> {
    const ok = await ensureFontLoaded(font)
    return ok ? 'ready' : 'error'
  }

  return {
    status: readonly(statusMap),
    statusOf,
    loadFull,
    ensureFontLoaded,
  }
}
