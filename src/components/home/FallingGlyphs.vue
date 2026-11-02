<script setup lang="ts">
import { useFallingGlyphs } from '@/composables/useFallingGlyphs'

const { glyphs } = useFallingGlyphs()
</script>

<template>
  <!--
    装饰层：纯背景氛围，不承载信息。
    - aria-hidden + pointer-events:none，键盘与鼠标都不会碰到它；
    - 每个字只做 transform/opacity 动画，避免重绘；
    - 开启「减少动态效果」时 glyphs 为空，连节点都不生成。
  -->
  <div class="glyph-field" aria-hidden="true">
    <span
      v-for="glyph in glyphs"
      :key="glyph.id"
      class="glyph-field__item"
      :style="{
        '--glyph-left': glyph.left,
        '--glyph-size': `${glyph.size}px`,
        '--glyph-duration': `${glyph.duration}s`,
        '--glyph-delay': `${glyph.delay}s`,
        '--glyph-drift': `${glyph.drift}px`,
        '--glyph-opacity': glyph.opacity,
      }"
    >
      {{ glyph.char }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.glyph-field {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  // 独立合成层：动画不会触发主文档重排
  contain: strict;

  &__item {
    position: absolute;
    top: -12vh;
    left: var(--glyph-left);
    font-family: var(--zz-font-serif);
    font-size: var(--glyph-size);
    line-height: 1;
    color: var(--zz-drift);
    opacity: 0;
    white-space: nowrap;
    user-select: none;
    will-change: transform, opacity;
    animation: zz-drift-down var(--glyph-duration) linear infinite;
    animation-delay: var(--glyph-delay);
  }
}

/*
  下落 + 极轻横向漂移 + 首尾淡入淡出。
  峰值透明度取自 --glyph-opacity（0.2–0.46），字越大越淡，
  保证落字始终是纸上的影子而不是可以抢读的文字。
*/
@keyframes zz-drift-down {
  0% {
    transform: translate3d(0, -10vh, 0) rotate(-5deg);
    opacity: 0;
  }

  12% {
    opacity: var(--glyph-opacity);
  }

  82% {
    opacity: calc(var(--glyph-opacity) * 0.7);
  }

  100% {
    transform: translate3d(var(--glyph-drift), 118vh, 0) rotate(9deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glyph-field {
    display: none;
  }
}
</style>
