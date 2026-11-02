import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 设计系统：顺序有意义 —— 令牌 → 品牌字体 → 全局
import './styles/tokens.scss'
import './styles/fonts/brand.scss'
import './styles/global.scss'

// 阅读字体（霞鹜文楷 / 朱雀仿宋 / 思源宋体）由 ReadingView 自己按需引入，
// 见 src/views/ReadingView.vue —— 首页不会因此下载任何正文字体。

createApp(App).use(router).mount('#app')
