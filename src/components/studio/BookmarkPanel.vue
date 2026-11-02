<script setup lang="ts">
import { computed } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { Bookmark } from '@/composables/useBookmarks'
import type { FontEntryWithAssets } from '@/data/fonts'
import { texts } from '@/data/texts'

/**
 * 收藏笺。
 *
 * 保存的是「一套搭配」——字体 + 文稿（或题写内容）+ 版式 + 排版参数，
 * 而不是单独一款字体。这样点一下就能回到当时那个阅读现场。
 */

const props = defineProps<{
  open: boolean
  bookmarks: Bookmark[]
  fonts: FontEntryWithAssets[]
  /** 当前搭配的描述，用于按钮文案 */
  currentLabel: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: []
  restore: [bookmark: Bookmark]
  remove: [id: string]
}>()

const fontName = (id: string) => props.fonts.find((f) => f.id === id)?.name ?? id

/** 示例字要用字体自身的 family 渲染，不能拿显示名当 font-family */
const fontFamily = (id: string) => props.fonts.find((f) => f.id === id)?.family ?? 'serif'

const textName = (b: Bookmark) => {
  if (!b.customText) return texts.find((t) => t.id === b.textId)?.title ?? '古文'
  return b.title || '自定文字'
}

const empty = computed(() => props.bookmarks.length === 0)

function formatDate(ts: number) {
  try {
    const d = new Date(ts)
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
  } catch {
    return ''
  }
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="收藏 · 私人笺册"
    description="把喜欢的搭配收进笺册：字体、文稿与版面参数一起保存，只存在这台设备的浏览器里。"
    @update:open="(v) => emit('update:open', v)"
  >
    <button type="button" class="save" @click="emit('save')">
      收藏当前搭配
      <span class="save__hint">{{ props.currentLabel }}</span>
    </button>

    <p v-if="empty" class="empty">笺册还是空的。调好一款搭配，再点上面那行字。</p>

    <ul v-else class="list">
      <li v-for="bookmark in props.bookmarks" :key="bookmark.id" class="item">
        <button type="button" class="item__main" @click="emit('restore', bookmark)">
          <span class="item__title">{{ textName(bookmark) }}</span>
          <span class="item__meta">
            {{ fontName(bookmark.fontId) }} ·
            {{ bookmark.layout === 'vertical' ? '竖排' : '横排' }} ·
            {{ bookmark.fontSize }}px ·
            {{ formatDate(bookmark.createdAt) }}
          </span>
          <span class="item__sample" :style="{ fontFamily: fontFamily(bookmark.fontId) }">
            {{ bookmark.layout === 'vertical' ? '竖' : '横' }}
          </span>
        </button>

        <button
          type="button"
          class="item__remove"
          :aria-label="`删除收藏：${textName(bookmark)}`"
          @click="emit('remove', bookmark.id)"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </li>
    </ul>
  </StudioPanel>
</template>

<style scoped lang="scss">
.save {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  padding: 15px 18px;
  margin-bottom: 22px;
  text-align: left;
  border: 1px solid var(--zz-accent);
  border-radius: var(--zz-radius-md);
  background: transparent;
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-md);
  letter-spacing: var(--zz-track-normal);
  color: var(--zz-accent);
  transition:
    background-color var(--zz-dur-fast) var(--zz-ease-out),
    color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    background: var(--zz-accent);
    color: var(--zz-paper-ui);

    .save__hint {
      color: var(--zz-paper-ui);
      opacity: 0.8;
    }
  }

  &__hint {
    font-family: var(--zz-font-sans);
    font-size: var(--zz-text-2xs);
    letter-spacing: 0;
    color: var(--zz-muted);
  }
}

.empty {
  padding: 26px 0;
  text-align: center;
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  letter-spacing: var(--zz-track-tight);
  color: var(--zz-muted-soft);
}

.list {
  display: grid;
  gap: 10px;
}

.item {
  display: flex;
  align-items: stretch;
  gap: 8px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  background: var(--zz-paper-raised);
  transition: border-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
  }

  &__main {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 14px 16px;
    text-align: left;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
    // 给右侧的示例字留出位置
    padding-right: 40px;
  }

  &__meta {
    font-size: var(--zz-text-2xs);
    line-height: 1.7;
    color: var(--zz-muted);
    padding-right: 40px;
  }

  &__sample {
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    font-size: 22px;
    line-height: 1;
    color: var(--zz-line-strong);
  }

  &__remove {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    border-left: 1px solid var(--zz-line-soft);
    color: var(--zz-muted-soft);
    font-size: var(--zz-text-xs);

    &:hover {
      color: var(--zz-accent);
      background: var(--zz-accent-wash);
      border-radius: 0 var(--zz-radius-md) var(--zz-radius-md) 0;
    }
  }
}
</style>
