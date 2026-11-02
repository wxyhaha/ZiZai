<script setup lang="ts">
import { useFallingGlyphs, type FallingGlyph } from '@/composables/useFallingGlyphs'

const { glyphs } = useFallingGlyphs()

function glyphStyle(glyph: FallingGlyph) {
  return {
    '--glyph-font': `"${glyph.fontFamily}"`,
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
  <!-- Background Han glyphs are decorative and excluded from the accessibility tree. -->
  <div class="glyph-field" aria-hidden="true">
    <span v-for="glyph in glyphs" :key="glyph.id" class="glyph-field__item" :style="glyphStyle(glyph)">
      {{ glyph.char }}
    </span>
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

@media (min-width: 1024px) {
  .glyph-field__item {
    font-size: min(var(--glyph-size), max(12px, calc(7.3vh - 4px)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .glyph-field {
    display: none;
  }
}
</style>
