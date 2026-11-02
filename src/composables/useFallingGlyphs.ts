import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export interface FallingGlyph {
  /** 唯一 key */
  id: number
  /** 单个汉字 */
  char: string
  /** 水平位置，百分比字符串 */
  left: string
  /** 字号 px */
  size: number
  /** 单次下落时长（秒） */
  duration: number
  /** 负延迟：让首屏就已经有字在半空，避免「开场空场」 */
  delay: number
  /** 终点横向漂移 px，左负右正 */
  drift: number
  /** 最大不透明度 */
  opacity: number
}

/** 首页背景用的字池：都取自站内古文与品牌语的意象，不做随机乱码。 */
const POOL = [
  '月', '书', '风', '墨', '云', '竹', '山', '诗', '纸', '雨',
  '字', '笺', '砚', '松', '泉', '秋', '檐', '雪', '灯', '窗',
]

/**
 * 一个可复现的伪随机数发生器（mulberry32）。
 * 固定种子让每次进首页的落字构型一致，避免刷新时视觉跳跃。
 */
function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 生成落字构型。
 *
 * 布局约束（与 DESIGN_SYSTEM §6 一致）：
 * - 只落在两侧的「字道」里，中央 40% 宽的阅读区永远留空，落字不会遮挡标题与 CTA；
 * - 数量克制，桌面 14 个、平板 9 个、手机 5 个；
 * - 每个字时长 26–46 秒，负延迟铺满整个周期，所以任意时刻都有字在空中。
 */
function buildGlyphs(count: number, seed = 20261102): FallingGlyph[] {
  const rand = createRandom(seed)
  const glyphs: FallingGlyph[] = []
  // 左右各半，各自在 0–26% 与 74–100% 区间内散开
  const lanes = [
    [2, 9, 15, 21, 27],
    [73, 79, 85, 91, 97],
    [4, 12, 19, 76, 83, 92],
    [6, 25, 74, 94],
  ]

  for (let i = 0; i < count; i += 1) {
    const laneGroup = lanes[i % lanes.length]
    const left = laneGroup[Math.floor(rand() * laneGroup.length)]
    const size = 16 + Math.round(rand() * 30)
    glyphs.push({
      id: i,
      char: POOL[Math.floor(rand() * POOL.length)],
      // 同一车道内做 ±2% 抖动，避免排成一条竖线
      left: `${(left + (rand() - 0.5) * 4).toFixed(2)}%`,
      size,
      duration: 26 + rand() * 20,
      // 负延迟 = 已下落到周期的随机位置
      delay: -(rand() * 46),
      drift: Math.round((rand() - 0.5) * 56),
      // 字越大越淡，保持背景属性
      opacity: 0.2 + (1 - (size - 16) / 30) * 0.26,
    })
  }
  return glyphs
}

/**
 * 首页落字动画。
 *
 * 只在客户端运行；开启「减少动态效果」时返回空数组，
 * 组件因此完全不渲染动画节点，而不是渲染后再用 CSS 隐藏。
 */
export function useFallingGlyphs() {
  const viewportWidth = ref(1440)
  const prefersReduced = useReducedMotion()

  const count = computed(() => {
    if (viewportWidth.value < 480) return 5
    if (viewportWidth.value < 768) return 7
    if (viewportWidth.value < 1024) return 10
    return 14
  })

  const glyphs = computed<FallingGlyph[]>(() => {
    if (prefersReduced.value) return []
    return buildGlyphs(count.value)
  })

  let raf = 0
  const measure = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      viewportWidth.value = window.innerWidth
    })
  }

  onMounted(() => {
    measure()
    window.addEventListener('resize', measure, { passive: true })
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', measure)
  })

  return { glyphs }
}
