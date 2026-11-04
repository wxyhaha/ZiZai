<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { LayoutMode, TextCategory } from '@/types'
import { defaultPaperThemeId, type PaperThemeId } from '@/data/paperThemes'
import {
  defaultPunctuationStyleId,
  sanitizeTextForEra,
  type PunctuationStyleId,
} from '@/data/punctuationStyles'
import {
  defaultEraFormatId,
  type EraFormatId,
} from '@/data/eraFormats'
import {
  defaultScriptStyleId,
  type ScriptStyleId,
} from '@/data/scriptStyles'
import { paginateText, type BookPage } from '@/composables/usePagination'
import {
  buildPageTurnPlan,
  type PageTurnTransition,
  type TurnDirection,
} from '@/composables/pageTurnPlan'
import ReadingSheet from './ReadingSheet.vue'
import CurvedPageTurn from './CurvedPageTurn.vue'
import { TURN_CLEARANCE } from '@/composables/pageTurnGeometry'
import { useReducedMotion } from '@/composables/useReducedMotion'

const props = withDefaults(
  defineProps<{
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
    category?: TextCategory
    hasActiveModal?: boolean
    paperTheme?: PaperThemeId
    punctuationStyle?: PunctuationStyleId
    eraFormat?: EraFormatId
    scriptStyle?: ScriptStyleId
    judouMode?: boolean
    woodblockFrame?: boolean
  }>(),
  {
    era: undefined,
    category: undefined,
    isCustom: false,
    hasActiveModal: false,
    paperTheme: defaultPaperThemeId,
    punctuationStyle: defaultPunctuationStyleId,
    eraFormat: defaultEraFormatId,
    scriptStyle: defaultScriptStyleId,
    judouMode: true,
    woodblockFrame: true,
  },
)

const stage = ref<HTMLElement | null>(null)
const size = ref({ width: 1180, height: 700 })
const pages = ref<BookPage[]>([])
const singlePage = ref(true)
const spreadStart = ref(0)
let observer: ResizeObserver | undefined
let generation = 0
const reducedMotion = useReducedMotion()
const turn = ref<PageTurnTransition | null>(null)
const sheetProps = computed(() => ({ ...props, single: false }))

function finishTurn() {
  if (turn.value) spreadStart.value = turn.value.targetSpreadStart
  turn.value = null
}
watch(reducedMotion, (reduced) => {
  if (reduced) finishTurn()
})

const turnPlan = computed(() =>
  buildPageTurnPlan({
    pages: pages.value,
    spreadStart: spreadStart.value,
    layout: props.layout,
    singlePage: singlePage.value,
  }),
)

const singleSlotPage = computed(() => {
  if (turn.value) return turn.value.underlyingLeft
  return turnPlan.value.currentSpread.leftPage
})

const leftSlotPage = computed(() => {
  if (turn.value) return turn.value.underlyingLeft
  return turnPlan.value.currentSpread.leftPage
})

const rightSlotPage = computed(() => {
  if (turn.value) return turn.value.underlyingRight
  return turnPlan.value.currentSpread.rightPage
})

const pageStatus = computed(() => turnPlan.value.pageStatus)

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

const effectiveParagraphs = computed(() => {
  // 策略 A：横排模式下统一按现代标点进行纯化与排版；竖排模式下按选定的时代标点处理
  const targetStyle = props.layout === 'horizontal' ? 'modern' : props.punctuationStyle
  return props.paragraphs.map((p) => sanitizeTextForEra(p, targetStyle))
})

function getPaginationInput(
  pageWidth: number,
  pageHeight: number,
  measureCharacter?: (character: string, fontSize: number, fontFamily: string) => number,
) {
  return {
    title: props.title,
    author: props.author,
    era: props.era,
    paragraphs: effectiveParagraphs.value,
    category: props.category,
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

  // 1. 等待当前字体在浏览器中加载就绪（带超时安全熔断）
  const sample = `${props.title}${props.author}${props.paragraphs.join('')}`
  try {
    if (document.fonts?.load) {
      await Promise.race([
        document.fonts.load(`${props.fontSize}px ${props.fontFamily}`, sample),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
    }
  } catch {
    // 降级使用可用回退字体测量
  }
  if (currentGeneration !== generation) return

  // 2. 字体加载就绪后，直接执行单次精确 Canvas 分页，彻底消除双重排版与跳页
  resolvePages(canvasMeasurer())
}

let resizeRaf: number | null = null

function updateSize() {
  if (!stage.value) return
  if (resizeRaf !== null) return
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null
    if (!stage.value) return
    const rect = stage.value.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    if (size.value.width === rect.width && size.value.height === rect.height) return
    size.value = { width: rect.width, height: rect.height }
    void paginate(false)
  })
}

function updateSizeImmediate() {
  if (!stage.value) return
  const rect = stage.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  if (size.value.width === rect.width && size.value.height === rect.height) return
  size.value = { width: rect.width, height: rect.height }
  void paginate(false)
}

function moveSpread(direction: TurnDirection) {
  if (turn.value) return
  const transition = turnPlan.value.createTransition(direction)
  if (!transition) return

  if (!reducedMotion.value) {
    turn.value = transition
  } else {
    spreadStart.value = transition.targetSpreadStart
  }
}
function previousSpread() {
  moveSpread('backward')
}
function nextSpread() {
  moveSpread('forward')
}

const leftAriaLabel = computed(() => turnPlan.value.leftAriaLabel)
const rightAriaLabel = computed(() => turnPlan.value.rightAriaLabel)

const leftDisabled = computed(() => {
  if (turn.value) return true
  return turnPlan.value.leftDisabled
})

const rightDisabled = computed(() => {
  if (turn.value) return true
  return turnPlan.value.rightDisabled
})

function onLeftClick() {
  if (leftDisabled.value) return
  if (props.layout === 'vertical') {
    nextSpread()
  } else {
    previousSpread()
  }
}

function onRightClick() {
  if (rightDisabled.value) return
  if (props.layout === 'vertical') {
    previousSpread()
  } else {
    nextSpread()
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (props.hasActiveModal) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (event.target instanceof HTMLElement) {
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.tagName === 'SELECT' ||
      event.target.isContentEditable ||
      event.target.closest('[role="dialog"]') !== null ||
      event.target.closest('[role="slider"]') !== null
    ) {
      return
    }
  }
  if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]') !== null) {
    return
  }

  if (event.key === 'ArrowLeft') {
    onLeftClick()
  } else if (event.key === 'ArrowRight') {
    onRightClick()
  }
}

watch(
  () => [
    props.title,
    props.author,
    props.era,
    props.paragraphs.join('\n'),
    props.punctuationStyle,
    props.eraFormat,
    props.scriptStyle,
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
  updateSizeImmediate()
  if (stage.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(updateSize)
    observer.observe(stage.value)
  }
  window.addEventListener('resize', updateSize)
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  generation += 1
  finishTurn()
  if (resizeRaf !== null) {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = null
  }
  observer?.disconnect()
  window.removeEventListener('resize', updateSize)
  window.removeEventListener('keydown', onKeyDown)
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
        <template v-if="singlePage">
          <ReadingSheet
            v-if="singleSlotPage"
            v-bind="sheetProps"
            :page="singleSlotPage"
            page-position="first"
            :single="true"
          />
        </template>
        <template v-else>
          <!-- 左侧物理槽位（横排为先读页，竖排为后读页） -->
          <ReadingSheet
            v-if="leftSlotPage"
            v-bind="sheetProps"
            :page="leftSlotPage"
            page-position="first"
            :single="false"
          />
          <div v-else class="book-blank" aria-hidden="true" />

          <!-- 右侧物理槽位（横排为后读页，竖排为先读页） -->
          <ReadingSheet
            v-if="rightSlotPage"
            v-bind="sheetProps"
            :page="rightSlotPage"
            page-position="second"
            :single="false"
          />
          <div v-else class="book-blank" aria-hidden="true" />
        </template>
        <CurvedPageTurn
          v-if="turn"
          :front="turn.frontPage"
          :back="turn.backPage"
          :from-right="turn.fromRight"
          :sheet-props="sheetProps"
          @finish="finishTurn"
        />

        <!-- 页面侧边空白翻页热区（最左侧与最右侧无文字区域点击翻页） -->
        <button
          v-if="pages.length > 1"
          type="button"
          class="turn-trigger turn-trigger--left"
          :class="{ 'turn-trigger--disabled': leftDisabled }"
          :aria-label="leftAriaLabel"
          :disabled="leftDisabled"
          @click="onLeftClick"
        >
          <span class="turn-trigger__indicator" aria-hidden="true">
            <ChevronLeft :size="19" />
          </span>
        </button>

        <button
          v-if="pages.length > 1"
          type="button"
          class="turn-trigger turn-trigger--right"
          :class="{ 'turn-trigger--disabled': rightDisabled }"
          :aria-label="rightAriaLabel"
          :disabled="rightDisabled"
          @click="onRightClick"
        >
          <span class="turn-trigger__indicator" aria-hidden="true">
            <ChevronRight :size="19" />
          </span>
        </button>
      </div>
    </div>

    <!-- 视觉完全隐藏页码，保留屏幕阅读器无障碍播报 -->
    <p class="zz-sr-only" aria-live="polite">{{ pageStatus }}</p>
  </section>
</template>

<style scoped lang="scss">
.book-viewer {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
    // 左右槽位已由 PageTurnPlan 显式绑定，无需依赖 flex-direction: row-reverse
  }
}

.turn-trigger {
  --trigger-width: clamp(52px, 5.5vw, 72px);
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 6;
  width: var(--trigger-width);
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: opacity var(--zz-dur-fast) var(--zz-ease-out);

  &--left {
    // 收束在书页内边缘，不超出书本容器，杜绝与外部工具栏重叠
    left: 0;
    justify-content: flex-start;
    padding-left: 12px;
  }

  &--right {
    right: 0;
    justify-content: flex-end;
    padding-right: 12px;
  }

  &--disabled {
    cursor: default;
    pointer-events: none;

    .turn-trigger__indicator {
      opacity: 0 !important;
    }
  }

  &__indicator {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--zz-muted);
    background: rgb(247 244 238 / 85%);
    box-shadow: 0 4px 12px rgb(58 47 35 / 10%), 0 0 0 1px var(--zz-line-soft);
    backdrop-filter: blur(4px);
    opacity: 0;
    transform: scale(0.9);
    transition:
      opacity var(--zz-dur-fast) var(--zz-ease-out),
      transform var(--zz-dur-fast) var(--zz-ease-out),
      color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out);
  }

  &:hover:not(&--disabled) .turn-trigger__indicator {
    opacity: 0.85;
    transform: scale(1);
    color: var(--zz-accent);
    background: var(--zz-paper-reading);
  }

  &:focus-visible .turn-trigger__indicator {
    opacity: 1;
    transform: scale(1);
    outline: var(--zz-focus-ring);
    outline-offset: 2px;
  }
}

.book-blank {
  flex: 1 1 0;
  height: 100%;
  background: var(--zz-paper-reading);
  border: 1px solid var(--zz-line);
}
</style>
