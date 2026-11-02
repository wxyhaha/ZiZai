<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { LayoutMode } from '@/types'
import { paginateText, type BookPage } from '@/composables/usePagination'
import ReadingSheet from './ReadingSheet.vue'
import CurvedPageTurn from './CurvedPageTurn.vue'
import { TURN_CLEARANCE } from '@/composables/pageTurnGeometry'
import { useReducedMotion } from '@/composables/useReducedMotion'

const props = defineProps<{
  title: string
  author: string
  era?: string
  paragraphs: string[]
  fontFamily: string
  layout: LayoutMode
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
  isCustom?: boolean
}>()

const stage = ref<HTMLElement | null>(null)
const size = ref({ width: 1180, height: 700 })
const pages = ref<BookPage[]>([])
const singlePage = ref(true)
const spreadStart = ref(0)
let observer: ResizeObserver | undefined
let generation = 0
const reducedMotion = useReducedMotion()
const turn = ref<{ front?: BookPage; back?: BookPage; fromRight: boolean; target: number; forward: boolean } | null>(null)
const sheetProps = computed(() => ({ ...props, single: false }))
function finishTurn() {
  if (turn.value) spreadStart.value = turn.value.target
  turn.value = null
}
watch(reducedMotion, (reduced) => { if (reduced) finishTurn() })

const visiblePages = computed(() => {
  if (singlePage.value) return [pages.value[0]]
  if (turn.value) {
    return turn.value.forward
      ? [pages.value[spreadStart.value], pages.value[turn.value.target + 1]]
      : [pages.value[turn.value.target], pages.value[spreadStart.value + 1]]
  }
  return [pages.value[spreadStart.value], pages.value[spreadStart.value + 1]]
})

const pageStatus = computed(() => {
  if (pages.value.length <= 1) return '1 / 1 页'
  const first = spreadStart.value + 1
  const last = Math.min(spreadStart.value + 2, pages.value.length)
  return `${first}–${last} / ${pages.value.length} 页`
})

const canGoBack = computed(() => spreadStart.value > 0)
const canGoForward = computed(() => spreadStart.value + 2 < pages.value.length)

function canvasMeasurer() {
  const canvas = document.createElement('canvas')
  let context: CanvasRenderingContext2D | null = null
  try {
    context = canvas.getContext('2d')
  } catch {
    context = null
  }
  const cache = new Map<string, number>()

  return (character: string, fontSize: number, fontFamily: string) => {
    const key = `${fontFamily}|${fontSize}|${character}`
    const cached = cache.get(key)
    if (cached !== undefined) return cached
    if (!context) return fontSize

    try {
      context.font = `${fontSize}px ${fontFamily}`
      const width = context.measureText(character).width
      const measured = width > 0 ? width : fontSize
      cache.set(key, measured)
      return measured
    } catch {
      return fontSize
    }
  }
}

function getPaginationInput(
  pageWidth: number,
  pageHeight: number,
  measureCharacter?: (character: string, fontSize: number, fontFamily: string) => number,
) {
  return {
    title: props.title,
    author: props.author,
    era: props.era,
    paragraphs: props.paragraphs,
    layout: props.layout,
    fontFamily: props.fontFamily,
    fontSize: props.fontSize,
    lineHeight: props.lineHeight,
    letterSpacing: props.letterSpacing,
    contentWidth: props.contentWidth,
    pageWidth,
    pageHeight,
    measureCharacter,
  }
}

function resolvePages(
  measureCharacter?: (character: string, fontSize: number, fontFamily: string) => number,
) {
  const width = Math.min(1260, Math.max(320, size.value.width))
  const height = Math.max(160, size.value.height - TURN_CLEARANCE * 2)
  const singleWidth = Math.min(width, 760)
  const singlePages = paginateText(getPaginationInput(singleWidth, height, measureCharacter))

  if (singlePages.length === 1) {
    pages.value = singlePages
    singlePage.value = true
  } else {
    const pageWidth = Math.max(240, (width - 10) / 2)
    pages.value = paginateText(getPaginationInput(pageWidth, height, measureCharacter))
    singlePage.value = false
  }

  if (singlePage.value || spreadStart.value >= pages.value.length) {
    spreadStart.value = 0
  } else {
    spreadStart.value = Math.floor(spreadStart.value / 2) * 2
  }
}

async function paginate(resetToFirstPage: boolean) {
  finishTurn()
  const currentGeneration = ++generation
  if (resetToFirstPage) spreadStart.value = 0
  // 先用方正的汉字字面估算同步绘制，避免等字体网络请求时书页空白。
  resolvePages((_character, fontSize) => fontSize)

  const sample = `${props.title}${props.author}${props.paragraphs.join('')}`
  try {
    if (document.fonts?.load) {
      await document.fonts.load(`${props.fontSize}px ${props.fontFamily}`, sample)
    }
  } catch {
    // Canvas 使用可用回退字体测量；字体加载失败时页面仍保持可读。
  }
  if (currentGeneration !== generation) return
  resolvePages(canvasMeasurer())
}

function updateSize() {
  if (!stage.value) return
  const rect = stage.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  if (size.value.width === rect.width && size.value.height === rect.height) return
  size.value = { width: rect.width, height: rect.height }
  void paginate(false)
}

function moveSpread(forward: boolean) {
  if (turn.value || (forward ? !canGoForward.value : !canGoBack.value)) return
  const oldStart = spreadStart.value
  const target = oldStart + (forward ? 2 : -2)
  if (!reducedMotion.value) {
    turn.value = {
      front: pages.value[oldStart + (forward ? 1 : 0)],
      back: pages.value[target + (forward ? 0 : 1)],
      fromRight: forward !== (props.layout === 'vertical'),
      target,
      forward,
    }
  } else {
    spreadStart.value = target
  }
}
function previousSpread() { moveSpread(false) }
function nextSpread() { moveSpread(true) }

watch(
  () => [
    props.title,
    props.author,
    props.era,
    props.paragraphs.join('\n'),
    props.fontFamily,
    props.layout,
    props.fontSize,
    props.lineHeight,
    props.letterSpacing,
    props.contentWidth,
  ],
  () => void paginate(true),
  { immediate: true },
)

onMounted(() => {
  updateSize()
  if (stage.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(updateSize)
    observer.observe(stage.value)
  }
  window.addEventListener('resize', updateSize)
})

onBeforeUnmount(() => {
  generation += 1
  finishTurn()
  observer?.disconnect()
  window.removeEventListener('resize', updateSize)
})
</script>

<template>
  <section class="book-viewer" aria-label="书页阅读区">
    <div ref="stage" class="book-viewer__stage" :style="{ '--turn-clearance': `${TURN_CLEARANCE}px` }">
      <div
        class="book-spread"
        :class="{
          'book-spread--single': singlePage,
          'book-spread--double': !singlePage,
          'book-spread--vertical': layout === 'vertical',
        }"
        :data-page-count="pages.length"
        :data-page-mode="singlePage ? 'single' : 'spread'"
      >
        <template v-for="(page, slot) in visiblePages" :key="slot">
          <ReadingSheet
            v-if="page"
            v-bind="sheetProps"
            :page="page"
            :page-position="slot === 0 ? 'first' : 'second'"
            :single="singlePage"
          />
          <div v-else class="book-blank" aria-hidden="true" />
        </template>
        <CurvedPageTurn
          v-if="turn"
          :front="turn.front"
          :back="turn.back"
          :from-right="turn.fromRight"
          :sheet-props="sheetProps"
          @finish="finishTurn"
        />
      </div>
    </div>

    <nav class="book-nav" aria-label="书页翻页">
      <button
        v-if="pages.length > 1"
        type="button"
        class="book-nav__button"
        aria-label="上一组页面"
        :disabled="!canGoBack || !!turn"
        @click="previousSpread"
      >
        <ChevronLeft :size="17" aria-hidden="true" />
      </button>
      <output class="book-nav__status" aria-live="polite">{{ pageStatus }}</output>
      <button
        v-if="pages.length > 1"
        type="button"
        class="book-nav__button"
        aria-label="下一组页面"
        :disabled="!canGoForward || !!turn"
        @click="nextSpread"
      >
        <ChevronRight :size="17" aria-hidden="true" />
      </button>
    </nav>
  </section>
</template>

<style scoped lang="scss">
.book-viewer {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.book-viewer__stage {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-spread {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  width: 100%;
  height: 100%;
  max-width: 1260px;
  height: calc(100% - var(--turn-clearance) * 2);
  isolation: isolate;
  filter: drop-shadow(0 12px 16px rgb(58 47 35 / 9%));

  &--single {
    .sheet {
      flex: 0 1 min(100%, 760px);
      width: min(100%, 760px);
    }
  }

  &--double {
    gap: 4px;
    border-radius: 3px;
    box-shadow: 0 2px 0 var(--zz-paper), 0 3px 0 var(--zz-line),
      0 5px 0 var(--zz-paper-reading), 0 6px 0 var(--zz-line),
      0 8px 0 var(--zz-paper-deep);

    &::before {
      content: '';
      position: absolute;
      z-index: 10;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 48px;
      transform: translateX(-50%);
      pointer-events: none;
      background: linear-gradient(90deg, transparent, rgb(80 62 44 / 6%) 35%, rgb(80 62 44 / 18%) 49%, rgb(255 255 255 / 25%) 53%, rgb(80 62 44 / 5%) 68%, transparent);
    }
  }

  &--vertical {
    flex-direction: row-reverse;
  }
}

.book-nav {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  min-height: 36px;
  color: var(--zz-muted);

  &__button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    transition:
      color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover:not(:disabled) {
      color: var(--zz-accent);
      background: var(--zz-accent-wash);
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 2px;
    }
  }

  &__status {
    min-width: 74px;
    text-align: center;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    font-variant-numeric: tabular-nums;
  }
}
.book-blank {
  flex: 1 1 0;
  height: 100%;
  background: var(--zz-paper-reading);
  border: 1px solid var(--zz-line);
}
</style>
