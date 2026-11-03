import type { LayoutMode } from '@/types'
import type { BookPage } from '@/composables/usePagination'

export type TurnDirection = 'forward' | 'backward'

export interface PageSpread {
  /** 位于书本左侧槽位的页面（如无则为 null） */
  leftPage: BookPage | null
  /** 位于书本右侧槽位的页面（如无则为 null） */
  rightPage: BookPage | null
  /** 当前展示的起始页索引（在 pages 数组中的索引，通常为偶数 0, 2, 4...） */
  spreadStart: number
  /** 当前展开展示的逻辑页码（1-based 数组，用于调试或无障碍播报） */
  pageNumbers: number[]
}

export interface PageTurnTransition {
  /** 目标起始页索引 */
  targetSpreadStart: number
  /** 翻页方向：forward (下一组) | backward (上一组) */
  direction: TurnDirection
  /**
   * 旋转轴/起翻侧：
   * true = 从右侧掀起向左翻转
   * false = 从左侧掀起向右翻转
   */
  fromRight: boolean
  /** 翻动叶片的正面（起翻前读者可见的那一面） */
  frontPage: BookPage
  /** 翻动叶片的背面（翻转落地后读者看到的那一面） */
  backPage: BookPage
  /** 翻页动效进行时，底托层左侧槽位显示的页面 */
  underlyingLeft: BookPage | null
  /** 翻页动效进行时，底托层右侧槽位显示的页面 */
  underlyingRight: BookPage | null
}

export interface PageTurnPlan {
  layout: LayoutMode
  singlePage: boolean
  currentSpread: PageSpread
  canPrev: boolean
  canNext: boolean
  pageStatus: string
  leftAriaLabel: string
  rightAriaLabel: string
  leftDisabled: boolean
  rightDisabled: boolean
  createTransition: (direction: TurnDirection) => PageTurnTransition | null
}

export interface CreatePageTurnPlanOptions {
  pages: BookPage[]
  spreadStart: number
  layout: LayoutMode
  singlePage: boolean
}

/**
 * 计算展开书页在左右槽位的映射关系：
 *
 * 1. 单页模式 (singlePage)：
 *    始终只在首个可用槽位渲染 pages[spreadStart]，不占用双页空间。
 *
 * 2. 双页模式 - 横排现代版式 (horizontal / LTR)：
 *    自左至右阅读：
 *    - 左侧槽位：pages[spreadStart] (先读)
 *    - 右侧槽位：pages[spreadStart + 1] (后读)
 *
 * 3. 双页模式 - 竖排传统版式 (vertical / RTL)：
 *    古籍自右至左阅读：
 *    - 右侧槽位：pages[spreadStart] (先读)
 *    - 左侧槽位：pages[spreadStart + 1] (后读)
 */
export function resolveSpread(
  pages: BookPage[],
  spreadStart: number,
  layout: LayoutMode,
  singlePage: boolean,
): PageSpread {
  if (pages.length === 0) {
    return { leftPage: null, rightPage: null, spreadStart: 0, pageNumbers: [] }
  }

  const safeStart = Math.max(0, Math.min(spreadStart, pages.length - 1))
  const first = pages[safeStart] ?? null
  const second = safeStart + 1 < pages.length ? pages[safeStart + 1] : null

  if (singlePage) {
    return {
      leftPage: first,
      rightPage: null,
      spreadStart: safeStart,
      pageNumbers: first ? [first.index + 1] : [],
    }
  }

  if (layout === 'vertical') {
    // 竖排右起：右侧先读，左侧后读
    return {
      leftPage: second,
      rightPage: first,
      spreadStart: safeStart,
      pageNumbers: [first, second].filter((p): p is BookPage => p !== null).map((p) => p.index + 1),
    }
  }

  // 横排左起：左侧先读，右侧后读
  return {
    leftPage: first,
    rightPage: second,
    spreadStart: safeStart,
    pageNumbers: [first, second].filter((p): p is BookPage => p !== null).map((p) => p.index + 1),
  }
}

/**
 * 构造用于阅读器的完整翻页执行规划 (PageTurnPlan)。
 * 严格分离版式数据与表现层，保证动效叶片、底托显示与按键导航在横竖排下均符合物理真实书本阅读规律。
 */
export function buildPageTurnPlan(options: CreatePageTurnPlanOptions): PageTurnPlan {
  const { pages, spreadStart, layout, singlePage } = options
  const isVertical = layout === 'vertical'
  const currentSpread = resolveSpread(pages, spreadStart, layout, singlePage)

  const step = singlePage ? 1 : 2
  const canPrev = spreadStart > 0
  const canNext = spreadStart + step < pages.length

  const leftAriaLabel = isVertical ? '下一组页面' : '上一组页面'
  const rightAriaLabel = isVertical ? '上一组页面' : '下一组页面'

  const leftDisabled = isVertical ? !canNext : !canPrev
  const rightDisabled = isVertical ? !canPrev : !canNext

  let pageStatus = '1 / 1 页'
  if (pages.length > 1) {
    const firstNum = spreadStart + 1
    const lastNum = Math.min(spreadStart + (singlePage ? 1 : 2), pages.length)
    pageStatus = firstNum === lastNum ? `${firstNum} / ${pages.length} 页` : `${firstNum}–${lastNum} / ${pages.length} 页`
  }

  function createTransition(direction: TurnDirection): PageTurnTransition | null {
    const forward = direction === 'forward'
    if (forward ? !canNext : !canPrev) return null

    const targetSpreadStart = spreadStart + (forward ? step : -step)

    if (singlePage) {
      const fromRight = forward !== isVertical
      const frontPage = pages[spreadStart]
      const backPage = pages[targetSpreadStart]
      return {
        targetSpreadStart,
        direction,
        fromRight,
        frontPage,
        backPage,
        underlyingLeft: forward ? backPage : frontPage,
        underlyingRight: null,
      }
    }

    if (!isVertical) {
      // 横排 (LTR) 双页翻页
      if (forward) {
        // 向前翻页：右页掀起向左翻折
        return {
          targetSpreadStart,
          direction,
          fromRight: true,
          frontPage: pages[spreadStart + 1],
          backPage: pages[targetSpreadStart],
          underlyingLeft: pages[spreadStart],
          underlyingRight: targetSpreadStart + 1 < pages.length ? pages[targetSpreadStart + 1] : null,
        }
      } else {
        // 向后翻页：左页掀起向右翻折
        return {
          targetSpreadStart,
          direction,
          fromRight: false,
          frontPage: pages[spreadStart],
          backPage: targetSpreadStart + 1 < pages.length ? pages[targetSpreadStart + 1] : pages[targetSpreadStart],
          underlyingLeft: pages[targetSpreadStart],
          underlyingRight: spreadStart + 1 < pages.length ? pages[spreadStart + 1] : null,
        }
      }
    } else {
      // 竖排 (RTL) 双页翻页（古籍线装右起自右向左读）
      if (forward) {
        // 向前翻页：左页掀起向右翻折
        return {
          targetSpreadStart,
          direction,
          fromRight: false,
          frontPage: pages[spreadStart + 1],
          backPage: pages[targetSpreadStart],
          underlyingLeft: targetSpreadStart + 1 < pages.length ? pages[targetSpreadStart + 1] : null,
          underlyingRight: pages[spreadStart],
        }
      } else {
        // 向后翻页：右页掀起向左翻折
        return {
          targetSpreadStart,
          direction,
          fromRight: true,
          frontPage: pages[spreadStart],
          backPage: targetSpreadStart + 1 < pages.length ? pages[targetSpreadStart + 1] : pages[targetSpreadStart],
          underlyingLeft: spreadStart + 1 < pages.length ? pages[spreadStart + 1] : null,
          underlyingRight: pages[targetSpreadStart],
        }
      }
    }
  }

  return {
    layout,
    singlePage,
    currentSpread,
    canPrev,
    canNext,
    pageStatus,
    leftAriaLabel,
    rightAriaLabel,
    leftDisabled,
    rightDisabled,
    createTransition,
  }
}
