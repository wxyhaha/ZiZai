<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ReadingSheet from './ReadingSheet.vue'
import type { BookPage } from '@/composables/usePagination'
import type { LayoutMode } from '@/types'
import { projectTurn } from '@/composables/pageTurnGeometry'

const props = defineProps<{
  front?: BookPage
  back?: BookPage
  fromRight: boolean
  sheetProps: {
    title: string; author: string; era?: string; paragraphs: string[]
    fontFamily: string; layout: LayoutMode; fontSize: number
    lineHeight: number; letterSpacing: number; contentWidth: number
    isCustom?: boolean; single: boolean
  }
}>()
const emit = defineEmits<{ finish: [] }>()
const root = ref<HTMLElement | null>(null)
const count = 28
let frame = 0
let fallback: ReturnType<typeof setTimeout> | undefined
const duration = 900

// 受控透视保留可见的弧形纸边，最大抬升由预留空间限定。
onMounted(() => {
  if (!root.value) return
  const width = Math.max(1, (root.value.getBoundingClientRect().width - 4) / 2)
  const segmentWidth = width / count
  const height = root.value.getBoundingClientRect().height
  root.value.style.setProperty('--page-width', `${width}px`)
  root.value.style.setProperty('--strip-width', `${segmentWidth + 0.35}px`)
  const strips = [...root.value.querySelectorAll<HTMLElement>('.paper-strip')]
  const started = performance.now()
  const render = (now: number) => {
    const time = Math.min(1, (now - started) / duration)
    const progress = time * time * (3 - 2 * time)
    const lift = Math.sin(Math.PI * progress)
    const geometry = projectTurn(width, height, progress, props.fromRight, count)
    strips.forEach((strip, index) => {
      const surface = geometry[index]
      strip.style.transform = `matrix3d(${surface.matrix.join(',')})`
      strip.style.zIndex = `${Math.round(surface.depth) + 1}`
      strip.style.setProperty('--front-visible', surface.front ? '1' : '0')
      strip.style.setProperty('--back-visible', surface.front ? '0' : '1')
      strip.style.setProperty('--shade', `${surface.shade}`)
    })
    root.value?.style.setProperty('--cast-shadow', `${0.12 * lift}`)
    if (time < 1) frame = requestAnimationFrame(render)
    else frame = requestAnimationFrame(() => emit('finish'))
  }
  render(started)
  fallback = setTimeout(() => emit('finish'), duration + 250)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(fallback)
})

function offset(index: number, back: boolean) {
  const reverse = props.fromRight === back
  return `calc(var(--page-width) * ${-(reverse ? count - index - 1 : index) / count})`
}
</script>

<template>
  <div ref="root" class="curved-turn" aria-hidden="true" inert>
    <div v-for="index in count" :key="index" class="paper-strip">
      <div class="paper-face paper-face--front" :style="{ left: offset(index - 1, false) }">
        <ReadingSheet v-if="front" v-bind="sheetProps" :page="front" page-position="first" />
      </div>
      <div class="paper-face paper-face--back" :style="{ left: offset(index - 1, true) }">
        <ReadingSheet v-if="back" v-bind="sheetProps" :page="back" page-position="first" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.curved-turn {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  --cast-shadow: 0;

  filter: drop-shadow(0 5px 7px rgb(58 47 35 / var(--cast-shadow)));
}
.paper-strip {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--strip-width);
  height: 100%;
  overflow: hidden;
  transform-origin: left top;
  will-change: transform;
  --front-visible: 1;
  --back-visible: 0;
  --shade: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--zz-ink);
    opacity: var(--shade);
  }
}
.paper-face {
  position: absolute;
  top: 0;
  width: var(--page-width);
  height: 100%;
  background: var(--zz-paper-reading);
  &--front { opacity: var(--front-visible); }
  &--back { opacity: var(--back-visible); }
  :deep(.sheet) { box-shadow: none; }
}
</style>
