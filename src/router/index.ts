import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

/**
 * 全站只有两个一级页面：首页与赏字。
 * 其余功能一律通过抽屉 / 浮层 / 局部模式承载，不新增一级路由。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '字在 ZiZai' },
    },
    {
      path: '/studio',
      name: 'studio',
      // 赏字页体量较大，懒加载，避免拖慢首页首屏
      component: () => import('@/views/ReadingView.vue'),
      meta: { title: '赏字 · 字在 ZiZai' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '未找到 · 字在 ZiZai' },
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    // 首页与赏字都是整屏应用式布局，切换时应回到顶部
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = to.meta.title
  if (typeof title === 'string') document.title = title
})

export default router
