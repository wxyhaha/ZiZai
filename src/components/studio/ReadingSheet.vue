<script setup lang="ts">
import { computed } from 'vue'
import type { LayoutMode } from '@/types'
import type { BookPage } from '@/composables/usePagination'

const props = defineProps<{
  page: BookPage
  title: string
  author: string
  era?: string
  fontFamily: string
  layout: LayoutMode
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
  isCustom?: boolean
  pagePosition: 'first' | 'second'
  single: boolean
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
    :class="[
      { 'sheet--vertical': isVertical, 'sheet--single': props.single },
      `sheet--${props.pagePosition}`,
    ]"
    :style="styleVars"
    :data-page="props.page.index + 1"
  >
    <div v-if="!isVertical" class="sheet__inner">
      <header v-if="props.page.hasHeader" class="sheet__head">
        <h1 class="sheet__title">{{ props.title }}</h1>
        <p class="sheet__meta">
          <span v-if="props.era">{{ props.era }} ·</span>
          {{ props.author }}
        </p>
      </header>

      <div class="prose">
        <p
          v-for="(paragraph, index) in props.page.paragraphs"
          :key="`${paragraph.paragraphIndex}-${index}`"
          :class="{ 'prose__paragraph--end': paragraph.paragraphEnd }"
          :style="{ textIndent: paragraph.indent ? '2em' : '0' }"
        >
          {{ paragraph.text }}
        </p>
      </div>
    </div>

    <div v-else class="sheet__inner sheet__inner--vertical">
      <div class="sheet__vertical-flow" aria-label="竖排正文">
        <div
          v-for="(column, index) in props.page.columns"
          :key="`${column.kind}-${index}`"
          class="sheet__column"
          :class="`sheet__column--${column.kind}`"
          :style="{ '--column-width': `${column.width}px` }"
        >
          {{ column.text }}
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.sheet {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  border: 1px solid var(--zz-line);
  border-radius: 1px;
  background: linear-gradient(90deg, rgb(255 255 255 / 15%), transparent 18%, transparent 80%, rgb(80 62 44 / 4%)), var(--zz-paper-reading);
  box-shadow: 0 8px 28px rgb(58 47 35 / 3.5%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(rgb(138 111 82 / 5.8%) 0.5px, transparent 1px);
    background-size: 9px 9px;
    opacity: 0.17;
  }

  &--second {
    border-left-color: var(--zz-line-soft);
  }

  &--single {
    overflow: visible;
    border-radius: 2px 3px 3px 2px;
    box-shadow: 1px 2px 0 var(--zz-paper), 2px 3px 0 var(--zz-line),
      3px 5px 0 var(--zz-paper-reading), 4px 6px 0 var(--zz-line-soft),
      0 12px 24px rgb(58 47 35 / 8%);
  }

  &--single::after {
    content: '';
    position: absolute;
    z-index: 2;
    top: -5px;
    bottom: -5px;
    left: -42px;
    width: 64px;
    pointer-events: none;
    // 圆筒大部分伸出纸面，内侧仅占 22px 页边距，避免遮住正文。
    border-radius: 50% / 8px;
    background:
      radial-gradient(ellipse at 50% 50%, var(--zz-paper-deep) 42%, var(--zz-line-strong) 55%, var(--zz-paper) 68%, transparent 73%) top center / 100% 12px no-repeat,
      radial-gradient(ellipse at 50% 50%, var(--zz-paper-deep) 42%, var(--zz-line) 58%, transparent 73%) bottom center / 100% 10px no-repeat,
      linear-gradient(
        90deg,
        var(--zz-line-strong) 0%,
        var(--zz-paper-deep) 10%,
        var(--zz-paper-reading) 30%,
        var(--zz-paper-raised) 49%,
        var(--zz-paper) 65%,
        var(--zz-paper-deep) 85%,
        var(--zz-line-strong) 100%
      );
    box-shadow:
      inset 1px 0 1px rgb(255 255 255 / 35%),
      inset -1px 0 2px rgb(58 47 35 / 12%),
      10px 2px 13px -6px rgb(58 47 35 / 25%),
      -4px 8px 12px -6px rgb(58 47 35 / 18%);
  }

  &__inner {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    padding: 48px 56px 44px;
  }

  &__head {
    flex: none;
    width: min(100%, var(--reading-width));
    text-align: center;
    margin: 0 0 36px;
  }

  &__title {
    font-family: var(--reading-font);
    font-size: 32px;
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    text-indent: var(--zz-track-normal);
    color: var(--zz-ink);
    line-height: 1.5;
  }

  &__meta {
    margin-top: 10px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: 0.18em;
    text-indent: 0.18em;
    color: var(--zz-muted);
    line-height: 1.6;
  }

  &__vertical-flow {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    max-width: var(--reading-width);
    height: 100%;
    margin-left: auto;
    overflow: hidden;
    font-family: var(--reading-font);
  }

  &__column {
    flex: none;
    height: 100%;
    width: var(--column-width);
    overflow: hidden;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    white-space: pre;
    line-height: var(--reading-leading);
    letter-spacing: var(--reading-tracking);
    color: var(--zz-ink-body);

    &--title {
      font-size: 20px;
      line-height: 1.6;
      letter-spacing: 0.14em;
      color: var(--zz-ink);
    }

    &--meta {
      font-family: var(--zz-font-serif);
      font-size: 13px;
      line-height: 1.6;
      letter-spacing: 0.08em;
      color: var(--zz-muted);
    }

    &--body {
      font-size: var(--reading-size);
    }

    &--gap {
      color: transparent;
    }
  }
}

.prose {
  width: min(100%, var(--reading-width));
  max-width: var(--reading-width);
  font-family: var(--reading-font);
  font-size: var(--reading-size);
  line-height: var(--reading-leading);
  letter-spacing: var(--reading-tracking);
  color: var(--zz-ink-body);

  p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  p.prose__paragraph--end {
    margin-bottom: 1.3em;
  }

  p:last-child {
    margin-bottom: 0;
  }
}

.sheet--vertical {
  .sheet__inner--vertical {
    align-items: stretch;
    padding: 44px 52px 42px;
  }
}
</style>
