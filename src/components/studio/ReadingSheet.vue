<script setup lang="ts">
import { computed } from 'vue'
import type { LayoutMode } from '@/types'

/**
 * 书页本身：只负责把 ReadingState 渲染成纸上的字。
 *
 * 它不持有状态、不读取 data，只接收已经算好的 props ——
 * 所以任何字体 × 任意文稿 × 任意版式都能组合，不会写死在页面里。
 */
const props = defineProps<{
  title: string
  author: string
  era?: string
  paragraphs: string[]
  /** 完整 CSS font-family 值 */
  fontFamily: string
  layout: LayoutMode
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
  /** 题写模式下不显示「自定文字 / 由你题写」这类元信息之外的额外装饰 */
  isCustom?: boolean
}>()

const isVertical = computed(() => props.layout === 'vertical')

const styleVars = computed(() => ({
  '--reading-font': props.fontFamily,
  '--reading-size': `${props.fontSize}px`,
  '--reading-leading': `${props.lineHeight}`,
  '--reading-tracking': `${props.letterSpacing}em`,
  '--reading-width': `${props.contentWidth}px`,
}))
</script>

<template>
  <article
    class="sheet"
    :class="{ 'sheet--vertical': isVertical }"
    :style="styleVars"
    :data-layout="props.layout"
  >
    <div class="sheet__inner">
      <header v-if="!isVertical" class="sheet__head">
        <h1 class="sheet__title">{{ props.title }}</h1>
        <p class="sheet__meta">
          <span v-if="props.era">{{ props.era }} ·</span>
          {{ props.author }}
        </p>
      </header>

      <p v-else class="sheet__title-vertical">{{ props.title }}</p>

      <div class="prose">
        <p v-for="(paragraph, index) in props.paragraphs" :key="index">{{ paragraph }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.sheet {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  border: 1px solid var(--zz-line-strong);
  border-radius: var(--zz-radius-xs);
  background: var(--zz-paper-reading);
  box-shadow: var(--zz-shadow-sheet);
  overflow: hidden;

  // 书页自身的极淡点阵，比页面纸纹再轻一档
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(rgb(138 111 82 / 5.8%) 0.5px, transparent 1px);
    background-size: 9px 9px;
    opacity: 0.23;
  }

  &__inner {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 52px 8% 46px;
  }

  &__head {
    text-align: center;
    margin-bottom: 40px;
  }

  &__title {
    font-family: var(--reading-font);
    font-size: 36px;
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    text-indent: var(--zz-track-normal);
    color: var(--zz-ink);
    line-height: 1.5;
  }

  &__meta {
    margin-top: 12px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    color: var(--zz-muted);
  }

  &__title-vertical {
    flex: none;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-family: var(--reading-font);
    font-size: 22px;
    letter-spacing: 0.14em;
    color: var(--zz-muted);
    padding-bottom: 4px;
    border-left: 1px solid var(--zz-line-soft);
    padding-left: 16px;
    margin-left: 18px;
    user-select: none;
  }
}

/* ---- 正文 ----
   横排：等宽居中栏，段首缩进两字。
   竖排：writing-mode: vertical-rl —— 真竖排，不是旋转容器。 */
.prose {
  width: 100%;
  max-width: var(--reading-width);
  font-family: var(--reading-font);
  font-size: var(--reading-size);
  line-height: var(--reading-leading);
  letter-spacing: var(--reading-tracking);
  color: var(--zz-ink-body);

  p {
    margin: 0 0 1.1em;
    text-indent: 2em;
  }

  p:last-child {
    margin-bottom: 0;
  }
}

.sheet--vertical {
  .sheet__inner {
    align-items: stretch;
    display: flex;
    // 标题列在最右，正文列向左溢出 —— 与 vertical-rl 的阅读顺序一致
    flex-direction: row-reverse;
    padding: 26px 26px 22px;
    overflow: auto;
    overflow-y: hidden;
  }

  .prose {
    max-width: none;
    min-width: 0;
    // 高度撑满可见区：每列正好一屏高，超出部分向左展开成新列
    height: 100%;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    line-height: 2.1;
    letter-spacing: 0.06em;
    padding-top: 0;

    p {
      margin: 0 0 0 1.5em;
      text-indent: 2em;
    }

    p:last-child {
      margin-left: 0;
    }
  }
}
</style>
