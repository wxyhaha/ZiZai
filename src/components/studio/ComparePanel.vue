<script setup lang="ts">
import { computed } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { FontEntryWithAssets } from '@/data/fonts'

/**
 * 双字体对照。
 *
 * 对照不是独立页面，而是阅读区的一种临时模式：开启后书页一分为二，
 * 左右各用一款字体渲染**完全相同**的文字。
 */

const props = defineProps<{
  open: boolean
  fonts: FontEntryWithAssets[]
  /** 左栏（当前正在读的）字体 */
  primaryId: string
  /** 右栏（对照用）字体；null 表示未开启对照 */
  compareId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  start: []
  select: [fontId: string]
  stop: []
}>()

const isComparing = computed(() => props.compareId !== null)

const primaryName = computed(
  () => props.fonts.find((f) => f.id === props.primaryId)?.name ?? '当前字体',
)

/** 对照栏的候选：排除主字体本身，自己和自己对照没有意义 */
const candidates = computed(() => props.fonts.filter((f) => f.id !== props.primaryId))

function compare(id: string) {
  if (!isComparing.value) emit('start')
  emit('select', id)
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="对照 · 两字体"
    description="用相同的文字并排比较两种字体。阅读区临时一分为二，退出后恢复原状。"
    @update:open="(v) => emit('update:open', v)"
  >
    <div class="state">
      <span class="state__label">对照状态</span>
      <span class="state__value">{{ isComparing ? '已开启' : '未开启' }}</span>
    </div>

    <button v-if="isComparing" type="button" class="toggle toggle--on" @click="emit('stop')">
      退出对照模式
    </button>
    <button v-else type="button" class="toggle" @click="emit('start')">
      进入对照模式
    </button>

    <template v-if="isComparing">
      <p class="hint">左栏是「{{ primaryName }}」，右栏换成：</p>
      <ul class="candidates">
        <li v-for="font in candidates" :key="font.id">
          <button
            type="button"
            class="candidate"
            :class="{ 'is-active': font.id === props.compareId }"
            :aria-pressed="font.id === props.compareId"
            @click="compare(font.id)"
          >
            <span class="candidate__name">{{ font.name }}</span>
            <span class="candidate__sample" :style="{ fontFamily: font.family }" aria-hidden="true">
              {{ font.sample }}
            </span>
          </button>
        </li>
      </ul>
    </template>

    <p v-else class="hint">
      开启后，同一篇文字会以两款字体并排呈现，方便比较笔意与字面密度。
      退出对照不会影响你当前的字体与排版设置。
    </p>
  </StudioPanel>
</template>

<style scoped lang="scss">
.state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--zz-line);

  &__label {
    font-size: var(--zz-text-xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__value {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }
}

.toggle {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--zz-accent);
  border-radius: var(--zz-radius-xs);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-base);
  letter-spacing: var(--zz-track-normal);
  color: var(--zz-accent);
  transition:
    background-color var(--zz-dur-fast) var(--zz-ease-out),
    color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    background: var(--zz-accent);
    color: var(--zz-paper-ui);
  }

  &--on {
    border-color: var(--zz-line);
    color: var(--zz-muted);

    &:hover {
      background: transparent;
      border-color: var(--zz-accent);
      color: var(--zz-accent);
    }
  }
}

.hint {
  margin-top: 18px;
  font-size: var(--zz-text-2xs);
  line-height: 1.9;
  color: var(--zz-muted);
}

.candidates {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.candidate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
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

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__sample {
    flex: none;
    font-size: 24px;
    line-height: 1.2;
    color: var(--zz-ink-soft);
    white-space: nowrap;
  }
}
</style>
