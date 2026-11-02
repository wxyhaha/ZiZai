import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 字体分片很多但都很小，交给浏览器按 unicode-range 拉取；
    // 这里只保证 CSS 不被无谓拆分。
    cssCodeSplit: true,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
  },
})
