<script setup lang="ts">
import { BookOpen, Heart, PenLine, SlidersHorizontal, Type } from 'lucide-vue-next'

/**
 * 赏字的工具条。
 *
 * 桌面：右侧竖排细工具轨。
 * 手机：固定在底部的紧凑工具条（由父级 SCSS 控制布局）。
 */

export type StudioTool =
  | 'fonts'
  | 'texts'
  | 'typography'
  | 'write'
  | 'bookmarks'

defineProps<{
  /** 当前打开的面板，用于高亮 */
  active: StudioTool | null
  /** 已收藏数量，0 时不显示角标 */
  bookmarkCount?: number
}>()

const emit = defineEmits<{ open: [tool: StudioTool] }>()

const tools = [
  { id: 'fonts' as const, icon: Type, label: '字体', glyph: '字' },
  { id: 'texts' as const, icon: BookOpen, label: '文选', glyph: '文' },
  { id: 'typography' as const, icon: SlidersHorizontal, label: '版式', glyph: '式' },
  { id: 'write' as const, icon: PenLine, label: '题写', glyph: '写' },
  { id: 'bookmarks' as const, icon: Heart, label: '收藏', glyph: '笺' },
]
</script>

<template>
  <nav class="tools" aria-label="赏字工具">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="tools__btn"
      :class="{ 'is-active': active === tool.id }"
      :aria-expanded="active === tool.id"
      @click="emit('open', tool.id)"
    >
      <span class="tools__glyph" aria-hidden="true">{{ tool.glyph }}</span>
      <span class="tools__label">{{ tool.label }}</span>
      <span
        v-if="tool.id === 'bookmarks' && bookmarkCount"
        class="tools__count"
        :aria-label="`已收藏 ${bookmarkCount} 项`"
      >
        {{ bookmarkCount }}
      </span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.tools {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 4px 0;

  &__btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 64px;
    // 用较小的固定内边距 + 允许收缩，保证 7 个工具在 768px 高的视口里
    // 也能一屏放下，不出现工具轨内部滚动条。
    padding: 9px 4px 8px;
    border-radius: var(--zz-radius-sm);
    color: var(--zz-muted);
    transition:
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      background: var(--zz-paper-deep);
      color: var(--zz-ink-soft);
    }

    &.is-active {
      color: var(--zz-accent);
      background: var(--zz-accent-wash);
    }
  }

  // 用一个汉字做图标底，与站点「以字为形」的气质一致
  &__glyph {
    font-family: var(--zz-font-serif);
    font-size: 20px;
    line-height: 1;
  }

  &__label {
    font-family: var(--zz-font-serif);
    font-size: 10px;
    line-height: 1.4;
    letter-spacing: 0.1em;
    color: inherit;
  }

  &__count {
    position: absolute;
    top: 4px;
    right: 9px;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    border-radius: var(--zz-radius-pill);
    background: var(--zz-accent);
    color: var(--zz-paper-ui);
    font-family: var(--zz-font-sans);
    font-size: 9px;
    line-height: 15px;
    text-align: center;
  }
}

/* ---- 矮屏：进一步压缩，保住「一屏放下」 ---- */
@media (max-height: 780px) and (min-width: 768px) {
  .tools {
    gap: 0;
    padding: 0;

    &__btn {
      gap: 3px;
      padding: 7px 4px 6px;
    }

    &__glyph {
      font-size: 18px;
    }
  }
}

/* ---- 手机：横向底部工具条 ---- */
@include bp.below(bp.$bp-mobile) {
  .tools {
    flex-direction: row;
    justify-content: space-around;
    gap: 0;
    padding: 0;

    &__btn {
      flex: 1;
      width: auto;
      padding: 9px 2px 8px;
      gap: 4px;
    }

    &__glyph {
      font-size: 18px;
    }

    &__label {
      font-size: 10px;
      letter-spacing: 0.06em;
    }

    &__count {
      top: 2px;
      right: 50%;
      transform: translateX(18px);
    }
  }
}
</style>
