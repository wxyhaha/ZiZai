<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ReadingSheet from './ReadingSheet.vue'
import type { BookPage } from '@/composables/usePagination'
import type { LayoutMode } from '@/types'
import type { PaperThemeId } from '@/data/paperThemes'
import type { PunctuationStyleId } from '@/data/punctuationStyles'
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
    paperTheme?: PaperThemeId
    punctuationStyle?: PunctuationStyleId
    judouMode?: boolean
    woodblockFrame?: boolean
  }
}>()
const emit = defineEmits<{ finish: [] }>()
const root = ref<HTMLElement | null>(null)
const count = 20
let frame = 0
let fallback: ReturnType<typeof setTimeout> | undefined
const duration = 900

interface StripElementMap {
  strip: HTMLElement
  frontFace?: HTMLElement
  backFace?: HTMLElement
  shade: HTMLElement
  isFront: boolean
}

// 受控透视保留可见的弧形纸边，最大抬升由预留空间限定。
onMounted(() => {
  if (!root.value) return
  const width = Math.max(1, (root.value.getBoundingClientRect().width - 4) / 2)
  const segmentWidth = width / count
  const height = root.value.getBoundingClientRect().height
  root.value.style.setProperty('--page-width', `${width}px`)
  root.value.style.setProperty('--strip-width', `${segmentWidth + 0.35}px`)
  const strips = [...root.value.querySelectorAll<HTMLElement>('.paper-strip')]
  const stripMaps: StripElementMap[] = strips.map((strip) => {
    const frontFace = strip.querySelector<HTMLElement>('.paper-face--front') ?? undefined
    const backFace = strip.querySelector<HTMLElement>('.paper-face--back') ?? undefined
    const shade = strip.querySelector<HTMLElement>('.paper-shade')!
    if (backFace) backFace.style.display = 'none'
    return { strip, frontFace, backFace, shade, isFront: true }
  })

  const started = performance.now()
  const render = (now: number) => {
    const time = Math.min(1, (now - started) / duration)
    const progress = time * time * (3 - 2 * time)
    const lift = Math.sin(Math.PI * progress)
    const geometry = projectTurn(width, height, progress, props.fromRight, count)
    stripMaps.forEach((node, index) => {
      const surface = geometry[index]
      node.strip.style.transform = `matrix3d(${surface.matrix.join(',')})`
      node.strip.style.zIndex = `${Math.round(surface.depth) + 1}`
      node.shade.style.opacity = `${surface.shade}`
      if (node.isFront !== surface.front) {
        node.isFront = surface.front
        if (node.frontFace) node.frontFace.style.display = surface.front ? '' : 'none'
        if (node.backFace) node.backFace.style.display = surface.front ? 'none' : ''
      }
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
      <div class="paper-shade" />
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
}
.paper-shade {
  position: absolute;
  inset: 0;
  background: var(--zz-ink);
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
}
.paper-face {
  position: absolute;
  top: 0;
  width: var(--page-width);
  height: 100%;
  background: var(--reading-bg, var(--zz-paper-reading));
  backface-visibility: hidden;
  :deep(.sheet) { box-shadow: none; }
}
</style>
