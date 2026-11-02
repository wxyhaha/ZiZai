import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useBookmarks } from '@/composables/useBookmarks'
import { useReadingState } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import ComparePanel from '@/components/studio/ComparePanel.vue'
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

describe('对照模式', () => {
  it('开启时自动挑一款与当前不同的字体', () => {
    const { state, startCompare, isComparing, compareFont } = useReadingState()
    expect(isComparing.value).toBe(false)

    startCompare()

    expect(isComparing.value).toBe(true)
    expect(state.value.compareFontId).not.toBe(state.value.fontId)
    expect(compareFont.value?.id).toBe(state.value.compareFontId)
  })

  it('指定字体时直接采用', () => {
    const { state, startCompare } = useReadingState()
    const target = fonts[2].id
    startCompare(target)
    expect(state.value.compareFontId).toBe(target)
  })

  it('退出对照只清掉对照栏，不动主字体与排版', () => {
    const { state, startCompare, stopCompare, setFontSize } = useReadingState()
    setFontSize(28)
    const mainFont = state.value.fontId
    startCompare()
    stopCompare()

    expect(state.value.compareFontId).toBeNull()
    expect(state.value.fontId).toBe(mainFont)
    expect(state.value.fontSize).toBe(28)
  })

  it('面板会 emit start / select / stop', async () => {
    const wrapper = mount(ComparePanel, {
      props: { open: true, fonts, primaryId: fonts[0].id, compareId: null },
      attachTo: document.body,
    })
    await nextTick()

    // 未开启时只有一个「进入对照模式」
    q<HTMLButtonElement>('.toggle').click()
    await nextTick()
    expect(wrapper.emitted('start')).toBeTruthy()
    expect(wrapper.emitted('select')).toBeFalsy()

    wrapper.unmount()
  })

  it('已开启时列出候选字体，并可切换与退出', async () => {
    const wrapper = mount(ComparePanel, {
      props: { open: true, fonts, primaryId: fonts[0].id, compareId: fonts[1].id },
      attachTo: document.body,
    })
    await nextTick()

    const candidates = qa('.candidate')
    // 主字体不应出现在候选里 —— 自己和自己对照没有意义
    expect(candidates).toHaveLength(fonts.length - 1)
    expect(candidates.map((c) => c.textContent)).not.toContain(fonts[0].name)

    candidates[1].click()
    await nextTick()
    expect(wrapper.emitted('select')?.[0]).toEqual([fonts[2].id])

    q<HTMLButtonElement>('.toggle').click()
    await nextTick()
    expect(wrapper.emitted('stop')).toBeTruthy()

    wrapper.unmount()
  })
})

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
