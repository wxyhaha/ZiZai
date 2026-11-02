import { onBeforeUnmount, onMounted, ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 跟踪用户的「减少动态效果」系统偏好。
 *
 * 组件应当在动画会干扰阅读时主动降级，而不是依赖 CSS 兜底：
 * 例如落字动画在开启该偏好时直接不渲染节点，省掉图层与合成开销。
 */
export function useReducedMotion() {
  const prefersReduced = ref(false)
  let mql: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => {
    prefersReduced.value = e.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mql = window.matchMedia(QUERY)
    prefersReduced.value = mql.matches
    mql.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', onChange)
    mql = null
  })

  return prefersReduced
}
