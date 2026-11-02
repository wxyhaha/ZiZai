import { computed, ref } from 'vue'
import type { LayoutMode } from '@/types'

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

/** 生成一个短 id；不追求全局唯一，本机够用即可 */
function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
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
    return parsed.items.filter(
      (item): item is Bookmark =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Bookmark).id === 'string' &&
        typeof (item as Bookmark).fontId === 'string',
    )
  } catch {
    return []
  }
}

function write(items: Bookmark[]) {
  try {
    if (typeof localStorage === 'undefined') return
    const payload: StoredShape = { version: SCHEMA_VERSION, items }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 存储写满或被隐私模式禁用：静默失败，界面上的列表仍反映内存状态
  }
}

const items = ref<Bookmark[]>(read())

export function useBookmarks() {
  const count = computed(() => items.value.length)

  /**
   * 同一套搭配只保留一条：先按「字体 + 文稿 + 版式 + 字号行距」
   * 去重，再插入到最前面。
   */
  function add(bookmark: Omit<Bookmark, 'id' | 'createdAt'>) {
    const next = items.value.filter(
      (b) =>
        !(
          b.fontId === bookmark.fontId &&
          b.textId === bookmark.textId &&
          b.customText === bookmark.customText &&
          b.layout === bookmark.layout &&
          b.fontSize === bookmark.fontSize
        ),
    )
    next.unshift({ ...bookmark, id: makeId(), createdAt: Date.now() })
    items.value = next.slice(0, 60)
    write(items.value)
  }

  function remove(id: string) {
    items.value = items.value.filter((b) => b.id !== id)
    write(items.value)
  }

  function clear() {
    items.value = []
    write(items.value)
  }

  /** 重新读取存储 —— 用来支持「另一个标签页改了收藏」这种情况 */
  function refresh() {
    items.value = read()
  }

  return {
    items: computed(() => items.value),
    count,
    add,
    remove,
    clear,
    refresh,
  }
}
