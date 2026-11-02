<script setup lang="ts">
import { computed } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { TextEntry } from '@/types/text'
import { textCategories } from '@/data/texts'

/** 古文选集：按 诗 / 词 / 赋 / 散文 / 其他 分组。 */

const props = defineProps<{
  open: boolean
  texts: TextEntry[]
  selectedId: string | null
  /** 是否处于题写模式（此时没有内置文稿被选中） */
  isCustom: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [textId: string]
  write: []
}>()

const groups = computed(() =>
  textCategories
    .map((category) => ({
      category,
      items: props.texts.filter((t) => t.category === category),
    }))
    .filter((g) => g.items.length > 0),
)

function choose(id: string) {
  emit('select', id)
  emit('update:open', false)
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="文选 · 古文选集"
    description="选一篇古文，让文字与字体相遇。每篇原文取自公有领域通行版本。"
    @update:open="(v) => emit('update:open', v)"
  >
    <button type="button" class="write-entry" @click="emit('write')">
      <span class="write-entry__label">题写自己的文字</span>
      <span class="write-entry__hint">输入任意文字，立即以当前字体成页</span>
    </button>

    <section v-for="group in groups" :key="group.category" class="group">
      <h3 class="group__title">
        {{ group.category }}
        <span class="group__count">{{ group.items.length }}</span>
      </h3>
      <ul class="group__list">
        <li v-for="text in group.items" :key="text.id">
          <button
            type="button"
            class="text-item"
            :class="{ 'is-active': !props.isCustom && text.id === props.selectedId }"
            :aria-pressed="!props.isCustom && text.id === props.selectedId"
            @click="choose(text.id)"
          >
            <span class="text-item__main">
              <span class="text-item__title">{{ text.title }}</span>
              <span class="text-item__meta">
                <span v-if="text.era">{{ text.era }} ·</span>
                {{ text.author }}
              </span>
              <span v-if="text.summary" class="text-item__summary">{{ text.summary }}</span>
            </span>
            <span class="text-item__mark" aria-hidden="true">↗</span>
          </button>
        </li>
      </ul>
    </section>
  </StudioPanel>
</template>

<style scoped lang="scss">
.write-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 16px 20px;
  margin-bottom: 26px;
  text-align: left;
  border: 1px dashed var(--zz-line-strong);
  border-radius: var(--zz-radius-md);
  background: transparent;
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
  }

  &__label {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-accent);
  }

  &__hint {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }
}

.group {
  & + & {
    margin-top: 26px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    font-weight: 400;
    letter-spacing: var(--zz-track-wide);
    color: var(--zz-muted);
    padding-bottom: 10px;
    border-bottom: 1px solid var(--zz-line);
    margin-bottom: 12px;
  }

  &__count {
    font-size: var(--zz-text-2xs);
    color: var(--zz-line-strong);
  }

  &__list {
    display: grid;
    gap: 10px;
  }
}

.text-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 15px 18px;
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

  &__main {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__meta {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__summary {
    font-size: var(--zz-text-2xs);
    line-height: 1.7;
    color: var(--zz-muted-soft);
  }

  &__mark {
    flex: none;
    font-size: var(--zz-text-sm);
    color: var(--zz-line-strong);
  }

  &.is-active &__mark {
    color: var(--zz-accent);
  }
}
</style>
