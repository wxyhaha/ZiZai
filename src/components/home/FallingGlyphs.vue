<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFallingGlyphs, type FallingGlyph } from '@/composables/useFallingGlyphs'

const props = defineProps<{
  activeGlyphId?: number | null
}>()

const emit = defineEmits<{
  (e: 'select', glyph: FallingGlyph): void
}>()

const { glyphs, nextGlyphCharacter } = useFallingGlyphs()

const hoveredGlyphId = ref<number | null>(null)
const hoveredLaneId = ref<number | null>(null)

function onGlyphEnter(glyph: FallingGlyph) {
  hoveredGlyphId.value = glyph.id
  hoveredLaneId.value = glyph.laneId
}

function onGlyphLeave(glyph: FallingGlyph) {
  if (hoveredGlyphId.value === glyph.id) {
    hoveredGlyphId.value = null
    hoveredLaneId.value = null
  }
}

function handleGlyphClick(event: MouseEvent, glyph: FallingGlyph) {
  emit('select', glyph)
  // 主动失焦，防止点击落字后在 DOM 层留下聚焦残留
  ;(event.currentTarget as HTMLElement)?.blur()
}

// 当探索弹窗关闭时（activeGlyphId 从有值变为空），彻底清空悬停记录与轨道锁定，确保汉字立即平滑恢复下落
watch(
  () => props.activeGlyphId,
  (newVal, oldVal) => {
    if (oldVal != null && newVal == null) {
      hoveredGlyphId.value = null
      hoveredLaneId.value = null
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  },
)

const activeLaneId = computed(() => {
  if (props.activeGlyphId == null) return null
  return glyphs.value.find((g) => g.id === props.activeGlyphId)?.laneId ?? null
})

const pausedLaneId = computed(() => {
  if (activeLaneId.value !== null) return activeLaneId.value
  return hoveredLaneId.value
})

function advanceGlyph(glyph: FallingGlyph) {
  glyph.char = nextGlyphCharacter(glyph)
}

function glyphStyle(glyph: FallingGlyph) {
  return {
    '--glyph-font': `"${glyph.fontFamily}", "Songti SC", "SimSun", serif`,
    '--glyph-left': glyph.left,
    '--glyph-size': `${glyph.size}px`,
    '--glyph-duration': `${glyph.duration.toFixed(2)}s`,
    '--glyph-delay': `${glyph.delay.toFixed(2)}s`,
    '--glyph-drift': `${glyph.drift}px`,
    '--glyph-opacity': glyph.opacity,
    '--glyph-rotation': `${glyph.rotation}deg`,
  }
}
</script>

<template>
  <div class="glyph-field" aria-hidden="true">
    <button
      v-for="glyph in glyphs"
      :key="glyph.id"
      type="button"
      tabindex="-1"
      class="glyph-field__item"
      :class="{
        'glyph-field__item--paused': pausedLaneId === glyph.laneId,
        'glyph-field__item--hovered': hoveredGlyphId === glyph.id,
        'glyph-field__item--active': activeGlyphId === glyph.id,
      }"
      :style="glyphStyle(glyph)"
      :aria-label="`探索汉字 ${glyph.char}`"
      @click="(e) => handleGlyphClick(e, glyph)"
      @mouseenter="onGlyphEnter(glyph)"
      @mouseleave="onGlyphLeave(glyph)"
      @focus="onGlyphEnter(glyph)"
      @blur="onGlyphLeave(glyph)"
      @animationiteration="advanceGlyph(glyph)"
    >
      {{ glyph.char }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.glyph-field {
  position: absolute;
  z-index: 1;
  overflow: hidden;
  inset: 0;
  pointer-events: none;
  contain: strict;

  &__item {
    position: absolute;
    top: -10vh;
    left: var(--glyph-left);
    color: var(--zz-drift);
    font-family: var(--glyph-font);
    font-size: var(--glyph-size);
    font-synthesis: none;
    line-height: 1;
    opacity: 0;
    white-space: nowrap;
    user-select: none;
    will-change: transform, opacity;
    animation: zz-glyph-fall var(--glyph-duration) linear infinite;
    animation-delay: var(--glyph-delay);
    pointer-events: auto;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: center;
    transition:
      color var(--zz-dur-fast) var(--zz-ease-out),
      filter var(--zz-dur-fast) var(--zz-ease-out);

    // 整列联动静止：同列任一汉字悬停或激活时，整列所有字符同步暂停下落，车距严格锁死，绝对杜绝追尾
    &--paused {
      animation-play-state: paused;
    }

    // 仅当前悬停的汉字加深为浓墨并具有立体阴影
    &:hover,
    &--hovered {
      animation-play-state: paused;
      color: var(--zz-ink);
      opacity: 0.95 !important;
      filter: drop-shadow(0 2px 5px rgba(45, 35, 25, 0.16));
      z-index: 2;
    }

    // 弹窗激活态汉字：朱砂色高亮并置顶
    &--active {
      animation-play-state: paused;
      color: var(--zz-accent);
      opacity: 1 !important;
      filter: drop-shadow(0 2px 6px rgba(139, 38, 29, 0.22));
      z-index: 3;
    }

    &:focus-visible {
      animation-play-state: paused;
      outline: 1.5px solid var(--zz-accent-line);
      outline-offset: 3px;
      border-radius: var(--zz-radius-xs);
      z-index: 2;
    }
  }
}

@keyframes zz-glyph-fall {
  0% {
    transform: translate3d(0, -10vh, 0) rotate(0);
    opacity: 0;
  }

  9% {
    opacity: var(--glyph-opacity);
  }

  76% {
    opacity: calc(var(--glyph-opacity) * 0.78);
  }

  100% {
    transform: translate3d(var(--glyph-drift), 110vh, 0) rotate(var(--glyph-rotation));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glyph-field {
    display: none;
  }
}
</style>
