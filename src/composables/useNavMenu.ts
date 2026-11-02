import { readonly, ref } from 'vue'

/**
 * 顶部导航「···」的共享开关。
 *
 * 这是目前唯一跨组件共享的 UI 状态，用模块级 ref 即可，
 * 不为此引入 Pinia —— 维护成本比收益高。
 */
const isMenuOpen = ref(false)

export function useNavMenu() {
  const openMenu = () => {
    isMenuOpen.value = true
  }
  const closeMenu = () => {
    isMenuOpen.value = false
  }
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }

  return {
    isMenuOpen: readonly(isMenuOpen),
    openMenu,
    closeMenu,
    toggleMenu,
  }
}
