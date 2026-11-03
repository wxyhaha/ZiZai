import { describe, expect, it } from 'vitest'
import { buildPageTurnPlan, resolveSpread } from '@/composables/pageTurnPlan'
import type { BookPage } from '@/composables/usePagination'

function makeMockPages(count: number): BookPage[] {
  return Array.from({ length: count }, (_, index) => ({
    index,
    hasHeader: index === 0,
    paragraphs: [{ text: `第 ${index + 1} 页正文`, paragraphIndex: 0, indent: true, paragraphEnd: true }],
    columns: [{ kind: 'body', text: `第 ${index + 1} 竖列`, width: 32 }],
  }))
}

describe('PageTurnPlan 翻页映射与动效规划', () => {
  describe('横排现代版式 (horizontal / LTR)', () => {
    it('偶数总页数（4页）的首屏槽位分布与翻页规划', () => {
      const pages = makeMockPages(4)
      const plan = buildPageTurnPlan({ pages, spreadStart: 0, layout: 'horizontal', singlePage: false })

      // 首屏：左页为 Page 1，右页为 Page 2
      expect(plan.currentSpread.leftPage?.index).toBe(0)
      expect(plan.currentSpread.rightPage?.index).toBe(1)
      expect(plan.currentSpread.pageNumbers).toEqual([1, 2])
      expect(plan.canPrev).toBe(false)
      expect(plan.canNext).toBe(true)
      expect(plan.leftDisabled).toBe(true)
      expect(plan.rightDisabled).toBe(false)
      expect(plan.leftAriaLabel).toBe('上一组页面')
      expect(plan.rightAriaLabel).toBe('下一组页面')
      expect(plan.pageStatus).toBe('1–2 / 4 页')

      // 向前翻页 (Next)
      const transition = plan.createTransition('forward')
      expect(transition).not.toBeNull()
      expect(transition!.targetSpreadStart).toBe(2)
      // 横排翻到下一组：右页掀起向左翻
      expect(transition!.fromRight).toBe(true)
      expect(transition!.frontPage.index).toBe(1) // Page 2
      expect(transition!.backPage.index).toBe(2) // Page 3
      expect(transition!.underlyingLeft?.index).toBe(0) // Page 1 保持在底托左侧
      expect(transition!.underlyingRight?.index).toBe(3) // Page 4 露在底托右侧
    })

    it('翻到第 2 组页面（第 3–4 页）并向后翻页 (Prev)', () => {
      const pages = makeMockPages(4)
      const plan = buildPageTurnPlan({ pages, spreadStart: 2, layout: 'horizontal', singlePage: false })

      expect(plan.currentSpread.leftPage?.index).toBe(2)
      expect(plan.currentSpread.rightPage?.index).toBe(3)
      expect(plan.canPrev).toBe(true)
      expect(plan.canNext).toBe(false)
      expect(plan.leftDisabled).toBe(false)
      expect(plan.rightDisabled).toBe(true)
      expect(plan.pageStatus).toBe('3–4 / 4 页')

      // 向后翻页 (Prev)
      const transition = plan.createTransition('backward')
      expect(transition).not.toBeNull()
      expect(transition!.targetSpreadStart).toBe(0)
      // 横排翻回上一组：左页掀起向右翻
      expect(transition!.fromRight).toBe(false)
      expect(transition!.frontPage.index).toBe(2) // Page 3
      expect(transition!.backPage.index).toBe(1) // Page 2
      expect(transition!.underlyingLeft?.index).toBe(0) // Page 1 露在底托左侧
      expect(transition!.underlyingRight?.index).toBe(3) // Page 4 保持在底托右侧
    })

    it('奇数总页数（3页）最后一组末尾槽位安全填充 null', () => {
      const pages = makeMockPages(3)
      const plan = buildPageTurnPlan({ pages, spreadStart: 2, layout: 'horizontal', singlePage: false })

      expect(plan.currentSpread.leftPage?.index).toBe(2)
      expect(plan.currentSpread.rightPage).toBeNull()
      expect(plan.currentSpread.pageNumbers).toEqual([3])
      expect(plan.pageStatus).toBe('3 / 3 页')
      expect(plan.canNext).toBe(false)
      expect(plan.canPrev).toBe(true)
    })
  })

  describe('竖排传统版式 (vertical / RTL)', () => {
    it('偶数总页数（4页）的首屏槽位分布与古籍翻页规划', () => {
      const pages = makeMockPages(4)
      const plan = buildPageTurnPlan({ pages, spreadStart: 0, layout: 'vertical', singlePage: false })

      // 古籍自右向左读：右槽位先读 (Page 1)，左槽位后读 (Page 2)
      expect(plan.currentSpread.rightPage?.index).toBe(0)
      expect(plan.currentSpread.leftPage?.index).toBe(1)
      expect(plan.currentSpread.pageNumbers).toEqual([1, 2])
      expect(plan.canPrev).toBe(false)
      expect(plan.canNext).toBe(true)

      // 竖排热区与无障碍文案：左侧为空白继续往后读 (下一组)，右侧为折返 (上一组)
      expect(plan.leftAriaLabel).toBe('下一组页面')
      expect(plan.rightAriaLabel).toBe('上一组页面')
      expect(plan.leftDisabled).toBe(false) // 左侧可点「下一组」
      expect(plan.rightDisabled).toBe(true) // 右侧「上一组」已到头

      // 竖排向前翻页 (Next)
      const transition = plan.createTransition('forward')
      expect(transition).not.toBeNull()
      expect(transition!.targetSpreadStart).toBe(2)
      // 竖排翻到下一组：左侧读完的页掀起向右翻折
      expect(transition!.fromRight).toBe(false)
      expect(transition!.frontPage.index).toBe(1) // Page 2
      expect(transition!.backPage.index).toBe(2) // Page 3 (落地后在右槽位)
      expect(transition!.underlyingLeft?.index).toBe(3) // Page 4 (新展开在左槽位)
      expect(transition!.underlyingRight?.index).toBe(0) // Page 1 (底托右侧)
    })

    it('竖排向后翻页 (Prev) 动效从右向左翻回', () => {
      const pages = makeMockPages(4)
      const plan = buildPageTurnPlan({ pages, spreadStart: 2, layout: 'vertical', singlePage: false })

      expect(plan.currentSpread.rightPage?.index).toBe(2) // Page 3
      expect(plan.currentSpread.leftPage?.index).toBe(3) // Page 4
      expect(plan.leftDisabled).toBe(true) // 下一组不可点
      expect(plan.rightDisabled).toBe(false) // 上一组可点

      const transition = plan.createTransition('backward')
      expect(transition).not.toBeNull()
      expect(transition!.targetSpreadStart).toBe(0)
      // 竖排向后翻回：右侧页掀起向左翻折
      expect(transition!.fromRight).toBe(true)
      expect(transition!.frontPage.index).toBe(2) // Page 3
      expect(transition!.backPage.index).toBe(1) // Page 2 (落地后在左槽位)
      expect(transition!.underlyingLeft?.index).toBe(3) // Page 4 (底托左侧)
      expect(transition!.underlyingRight?.index).toBe(0) // Page 1 (底托右侧露出)
    })

    it('奇数总页数（3页）在竖排下的末页应分布在右槽位，左槽位为空白', () => {
      const pages = makeMockPages(3)
      const plan = buildPageTurnPlan({ pages, spreadStart: 2, layout: 'vertical', singlePage: false })

      // 最后一页 Page 3 在右侧槽位（先读），左侧槽位已无后继内容
      expect(plan.currentSpread.rightPage?.index).toBe(2)
      expect(plan.currentSpread.leftPage).toBeNull()
      expect(plan.pageStatus).toBe('3 / 3 页')
      expect(plan.canNext).toBe(false)
      expect(plan.canPrev).toBe(true)
    })
  })

  describe('单页模式 (singlePage)', () => {
    it('单页文档不可翻页', () => {
      const pages = makeMockPages(1)
      const plan = buildPageTurnPlan({ pages, spreadStart: 0, layout: 'horizontal', singlePage: true })

      expect(plan.currentSpread.leftPage?.index).toBe(0)
      expect(plan.currentSpread.rightPage).toBeNull()
      expect(plan.canPrev).toBe(false)
      expect(plan.canNext).toBe(false)
      expect(plan.pageStatus).toBe('1 / 1 页')
      expect(plan.createTransition('forward')).toBeNull()
      expect(plan.createTransition('backward')).toBeNull()
    })

    it('多页单页模式下步长为 1，正确计算起翻侧', () => {
      const pages = makeMockPages(3)
      const planH = buildPageTurnPlan({ pages, spreadStart: 0, layout: 'horizontal', singlePage: true })
      expect(planH.canNext).toBe(true)
      const transH = planH.createTransition('forward')
      expect(transH?.targetSpreadStart).toBe(1)
      expect(transH?.fromRight).toBe(true)

      const planV = buildPageTurnPlan({ pages, spreadStart: 0, layout: 'vertical', singlePage: true })
      const transV = planV.createTransition('forward')
      expect(transV?.targetSpreadStart).toBe(1)
      expect(transV?.fromRight).toBe(false)
    })
  })

  describe('防御性容错', () => {
    it('空页数组安全返回空展开', () => {
      const spread = resolveSpread([], 0, 'horizontal', false)
      expect(spread.leftPage).toBeNull()
      expect(spread.rightPage).toBeNull()
      expect(spread.pageNumbers).toEqual([])
    })

    it('越界页码索引被夹在安全范围内', () => {
      const pages = makeMockPages(2)
      const spread = resolveSpread(pages, 99, 'horizontal', false)
      expect(spread.leftPage?.index).toBe(1)
    })
  })
})
