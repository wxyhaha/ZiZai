import { computed, readonly, ref } from 'vue'
import type { LayoutMode } from '@/types'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'

/**
 * 本地收藏笺。
 *
 * 只存本机（localStorage），没有账号、没有后端 —— 这是产品定位决定的：
 * 「你的收藏只留在本机浏览器」。
 *
 * 存储格式带 schema 版本号：将来字段变化时，旧数据要么被迁移、要么被安全忽略，
 * 而不是让页面崩在 JSON.parse 上。
 */

const STORAGE_KEY = 'zizai:bookmarks:v1'
const SCHEMA_VERSION = 1

export interface Bookmark {
  id: string
  /** 展示用的标题：古文名，或题写内容的前几个字 */
  title: string
  fontId: string
  textId: string | null
  customText: string | null
  layout: LayoutMode
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
  createdAt: number
}

interface StoredShape {
  version: number
  items: Bookmark[]
}

const lastError = ref<string | null>(null)

/** 生成一个短 id；不追求全局唯一，本机够用即可 */
function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isFiniteNumberInRange(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max
}

/** 校验单个书签条目的完整性和数值合法性（防止 NaN、损坏字段与非法枚举注入） */
function isValidBookmark(item: unknown): item is Bookmark {
  if (typeof item !== 'object' || item === null) return false
  const b = item as Record<string, unknown>

  if (typeof b.id !== 'string' || b.id.trim().length === 0) return false
  if (typeof b.title !== 'string') return false
  if (typeof b.fontId !== 'string' || !fonts.some((f) => f.id === b.fontId)) return false

  const hasValidTextId = b.textId === null || (typeof b.textId === 'string' && texts.some((t) => t.id === b.textId))
  const hasValidCustomText = b.customText === null || typeof b.customText === 'string'
  if (!hasValidTextId || !hasValidCustomText) return false

  if (b.layout !== 'horizontal' && b.layout !== 'vertical') return false
  if (!isFiniteNumberInRange(b.fontSize, 14, 40)) return false
  if (!isFiniteNumberInRange(b.lineHeight, 1.4, 3.0)) return false
  if (!isFiniteNumberInRange(b.letterSpacing, 0, 0.2)) return false
  if (!isFiniteNumberInRange(b.contentWidth, 440, 960)) return false
  if (typeof b.createdAt !== 'number' || !Number.isFinite(b.createdAt) || b.createdAt <= 0) return false

  return true
}

/**
 * 读取并校验存储内容。
 * 任何异常（无 localStorage、JSON 损坏、结构不符）都返回空数组 ——
 * 收藏是辅助功能，不能因为它坏掉而让整个阅读页打不开。
 */
function read(): Bookmark[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredShape>
    if (!parsed || parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.items)) return []
    return parsed.items.filter(isValidBookmark)
  } catch {
    return []
  }
}

function write(items: Bookmark[]): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      lastError.value = '存储失败：当前运行环境不支持本地存储'
      return false
    }
    const payload: StoredShape = { version: SCHEMA_VERSION, items }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    lastError.value = null
    return true
  } catch {
    lastError.value = '存储失败：浏览器存储空间已满或隐私模式禁用了本地写入'
    return false
  }
}

const items = ref<Bookmark[]>(read())

function isSameBookmark(a: Bookmark, b: Omit<Bookmark, 'id' | 'createdAt'>): boolean {
  return (
    a.fontId === b.fontId &&
    a.textId === b.textId &&
    a.customText === b.customText &&
    a.layout === b.layout &&
    a.fontSize === b.fontSize &&
    Math.abs(a.lineHeight - b.lineHeight) < 0.001 &&
    Math.abs(a.letterSpacing - b.letterSpacing) < 0.0001 &&
    a.contentWidth === b.contentWidth
  )
}

export function useBookmarks() {
  const count = computed(() => items.value.length)

  /**
   * 同一套搭配只保留一条：完整覆盖影响显示的全部参数（字体、文稿、自定义文本、版式、字号、行高、字距、版心）。
   * 只要有一项参数不同，即视为不同搭配；完全相同时去重并置顶。
   */
  function add(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): boolean {
    const next = items.value.filter((b) => !isSameBookmark(b, bookmark))
    next.unshift({ ...bookmark, id: makeId(), createdAt: Date.now() })
    items.value = next.slice(0, 60)
    return write(items.value)
  }

  function remove(id: string): boolean {
    items.value = items.value.filter((b) => b.id !== id)
    return write(items.value)
  }

  function clear(): boolean {
    items.value = []
    return write(items.value)
  }

  /** 重新读取存储 —— 用来支持「另一个标签页改了收藏」这种情况 */
  function refresh() {
    items.value = read()
  }

  return {
    items: computed(() => items.value),
    count,
    lastError: readonly(lastError),
    add,
    remove,
    clear,
    refresh,
  }
}
