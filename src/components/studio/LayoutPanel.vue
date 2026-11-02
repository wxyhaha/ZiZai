<script setup lang="ts">
import StudioPanel from './StudioPanel.vue'
import type { LayoutMode } from '@/types'

/** 版式：横排 / 传统竖排。 */

const props = defineProps<{
  open: boolean
  layout: LayoutMode
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [layout: LayoutMode]
}>()

const options = [
  {
    id: 'horizontal' as const,
    name: '现代横排',
    hint: '从左至右，适合长篇阅读',
    mark: '☰',
  },
  {
    id: 'vertical' as const,
    name: '传统竖排',
    hint: '自上而下、从右至左，古籍的阅读方式',
    mark: '║',
  },
]

function choose(layout: LayoutMode) {
  emit('select', layout)
  emit('update:open', false)
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="版式 · 纸上章法"
    description="同一段文字，横竖之间自有不同的节奏。"
    @update:open="(v) => emit('update:open', v)"
  >
    <ul class="layout-list">
      <li v-for="option in options" :key="option.id">
        <button
          type="button"
          class="layout-card"
          :class="{ 'is-active': option.id === props.layout }"
          :aria-pressed="option.id === props.layout"
          @click="choose(option.id)"
        >
          <span class="layout-card__main">
            <span class="layout-card__name">{{ option.name }}</span>
            <span class="layout-card__hint">{{ option.hint }}</span>
          </span>
          <span class="layout-card__mark" aria-hidden="true">{{ option.mark }}</span>
        </button>
      </li>
    </ul>

    <p class="note">
      竖排使用 CSS 的 <code>writing-mode: vertical-rl</code> 实现真正的列式排版，
      标点会跟随文字方向，而不是把整块文本旋转 90 度。
    </p>
  </StudioPanel>
</template>

<style scoped lang="scss">
.layout-list {
  display: grid;
  gap: 12px;
}

.layout-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 19px 20px;
  text-align: left;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-lg);
  background: var(--zz-paper-raised);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
  }

  &.is-active {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-lg);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__hint {
    font-size: var(--zz-text-2xs);
    line-height: 1.7;
    color: var(--zz-muted);
  }

  &__mark {
    flex: none;
    font-family: var(--zz-font-serif);
    font-size: 24px;
    line-height: 1;
    color: var(--zz-muted-soft);
  }

  &.is-active &__mark {
    color: var(--zz-accent);
  }
}

.note {
  margin-top: 24px;
  font-size: var(--zz-text-2xs);
  line-height: 1.9;
  color: var(--zz-muted);

  code {
    font-family: ui-monospace, monospace;
    font-size: 0.95em;
    color: var(--zz-ink-soft);
  }
}
</style>
