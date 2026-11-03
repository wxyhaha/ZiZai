import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useBookmarks } from '@/composables/useBookmarks'
import { useReadingState } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import BookmarkPanel from '@/components/studio/BookmarkPanel.vue'

beforeEach(() => {
  localStorage.clear()
  useReadingState().reset()
  useBookmarks().clear()
})

afterEach(() => {
  document.body.innerHTML = ''
})

function q<T extends Element = HTMLElement>(selector: string): T {
  const el = document.body.querySelector<T>(selector)
  if (!el) throw new Error(`body 上找不到 ${selector}`)
  return el
}

function qa<T extends Element = HTMLElement>(selector: string): T[] {
  return [...document.body.querySelectorAll<T>(selector)]
}

describe('收藏笺', () => {
  const sample = {
    title: '项脊轩志',
    fontId: fonts[0].id,
    textId: texts[0].id,
    customText: null,
    layout: 'horizontal' as const,
    fontSize: 22,
    lineHeight: 2.2,
    letterSpacing: 0.035,
    contentWidth: 680,
  }

  it('新增后可读出，并带 schema 版本号写入存储', () => {
    const { add, items } = useBookmarks()
    add(sample)

    expect(items.value).toHaveLength(1)
    expect(items.value[0].fontId).toBe(fonts[0].id)
    expect(items.value[0].id).toBeTruthy()

    const raw = JSON.parse(localStorage.getItem('zizai:bookmarks:v1') ?? '{}')
    expect(raw.version).toBe(1)
    expect(raw.items).toHaveLength(1)
  })

  it('同一套搭配重复收藏不会堆出多条', () => {
    const { add, items } = useBookmarks()
    add(sample)
    add(sample)
    add(sample)
    expect(items.value).toHaveLength(1)
  })

  it('仅修改行高应视为不同搭配，各自保留（ZZ-003）', () => {
    const { add, items } = useBookmarks()
    add(sample)
    add({ ...sample, lineHeight: 2.8 })
    expect(items.value).toHaveLength(2)
  })

  it('仅修改字距应视为不同搭配，各自保留（ZZ-003）', () => {
    const { add, items } = useBookmarks()
    add(sample)
    add({ ...sample, letterSpacing: 0.12 })
    expect(items.value).toHaveLength(2)
  })

  it('仅修改版心宽度应视为不同搭配，各自保留（ZZ-003）', () => {
    const { add, items } = useBookmarks()
    add(sample)
    add({ ...sample, contentWidth: 800 })
    expect(items.value).toHaveLength(2)
  })

  it('不同自定文字应视为不同搭配，各自保留（ZZ-003）', () => {
    const { add, items } = useBookmarks()
    add({ ...sample, textId: null, customText: '白日依山尽' })
    add({ ...sample, textId: null, customText: '黄河入海流' })
    expect(items.value).toHaveLength(2)
  })

  it('换一种字体视为不同搭配，各自保留', () => {
    const { add, items } = useBookmarks()
    add(sample)
    add({ ...sample, fontId: fonts[1].id })
    expect(items.value).toHaveLength(2)
  })

  it('可以删除单条，也可以清空', () => {
    const { add, items, remove, clear } = useBookmarks()
    add(sample)
    add({ ...sample, fontId: fonts[1].id })

    remove(items.value[0].id)
    expect(items.value).toHaveLength(1)

    clear()
    expect(items.value).toHaveLength(0)
    expect(localStorage.getItem('zizai:bookmarks:v1')).toBe(JSON.stringify({ version: 1, items: [] }))
  })

  it('存储内容损坏时安全降级为空，而不是抛错', () => {
    localStorage.setItem('zizai:bookmarks:v1', '{ 这不是 JSON')
    const { items, refresh } = useBookmarks()
    refresh()
    expect(items.value).toEqual([])
  })

  it('schema 版本不匹配时忽略旧数据', () => {
    localStorage.setItem(
      'zizai:bookmarks:v1',
      JSON.stringify({ version: 99, items: [sample] }),
    )
    const { items, refresh } = useBookmarks()
    refresh()
    expect(items.value).toEqual([])
  })

  it('校验并过滤非法、超出数值区间或含 NaN/Infinity 的损坏条目', () => {
    const invalidItems = [
      { ...sample, id: '', title: '空ID' },
      { ...sample, id: 'bad-font', fontId: 'non-existent-font' },
      { ...sample, id: 'bad-text', textId: 'non-existent-text' },
      { ...sample, id: 'nan-size', fontSize: Number.NaN },
      { ...sample, id: 'inf-line-height', lineHeight: Number.POSITIVE_INFINITY },
      { ...sample, id: 'out-of-range-spacing', letterSpacing: 0.5 },
      { ...sample, id: 'out-of-range-width', contentWidth: 200 },
      { ...sample, id: 'invalid-layout', layout: 'diagonal' },
      { ...sample, id: 'invalid-created-at', createdAt: -1 },
    ]
    localStorage.setItem(
      'zizai:bookmarks:v1',
      JSON.stringify({ version: 1, items: [...invalidItems, { ...sample, id: 'valid-1', createdAt: 12345 }] }),
    )
    const { items, refresh } = useBookmarks()
    refresh()
    expect(items.value).toHaveLength(1)
    expect(items.value[0].id).toBe('valid-1')
  })

  it('本地存储写入失败时能够捕获错误并设置 lastError', () => {
    const { add, lastError } = useBookmarks()
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const result = add(sample)
    expect(result).toBe(false)
    expect(lastError.value).toContain('存储失败')

    setItemSpy.mockRestore()
  })

  it('面板渲染收藏列表并可恢复与删除', async () => {
    const { add, items } = useBookmarks()
    add(sample)
    add({ ...sample, fontId: fonts[1].id })

    const wrapper = mount(BookmarkPanel, {
      props: { open: true, bookmarks: items.value, fonts, currentLabel: '汇文明朝体 · 横排 · 22px' },
      attachTo: document.body,
    })
    await nextTick()

    expect(qa('.item')).toHaveLength(2)
    expect(q('.save').textContent).toContain('汇文明朝体 · 横排 · 22px')

    qa<HTMLButtonElement>('.item__main')[0].click()
    await nextTick()
    expect(wrapper.emitted('restore')).toBeTruthy()

    qa<HTMLButtonElement>('.item__remove')[0].click()
    await nextTick()
    expect(wrapper.emitted('remove')?.[0]).toEqual([items.value[0].id])

    wrapper.unmount()
  })

  it('空笺册给出提示而不是空白区域', async () => {
    const wrapper = mount(BookmarkPanel, {
      props: { open: true, bookmarks: [], fonts, currentLabel: '' },
      attachTo: document.body,
    })
    await nextTick()

    expect(q('.empty').textContent).toBeTruthy()
    expect(qa('.item')).toHaveLength(0)
    wrapper.unmount()
  })
})
