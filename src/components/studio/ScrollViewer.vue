<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import type { TextCategory } from '@/types'
import { getPaperTheme, type PaperThemeId } from '@/data/paperThemes'
import { ensureFontLoaded } from '@/composables/useFontLoading'
import {
  measureScrollColumnHeight,
  scrollSegments,
  scrollTypography,
} from '@/composables/scrollTypography'
import {
  groupIntoCouplets,
  splitIntoPoetryVerses,
} from '@/composables/usePagination'

const props = defineProps<{
  title: string
  author: string
  era?: string
  paragraphs: readonly string[]
  font: FontEntryWithAssets
  fontSize: number
  paperTheme: PaperThemeId
  category?: TextCategory
}>()
const viewport = ref<HTMLElement>()
const scrollBodyRef = ref<HTMLElement>()
const status = ref<'loading' | 'ready' | 'error'>('loading')
const rules = computed(() => scrollTypography(props.era, props.font.id, props.font.styleTag))
const paragraphs = computed(() => props.paragraphs.map(p => scrollSegments(p, rules.value.punctuation.id)))

const isPoetry = computed(() => props.category === '诗' || props.category === '词')
const measuredHeight = ref<number | null>(null)

const availableHeight = computed(() => {
  if (measuredHeight.value && measuredHeight.value > 0) {
    return measuredHeight.value
  }
  if (typeof window !== 'undefined' && window.innerHeight) {
    return Math.max(200, window.innerHeight - 220)
  }
  return 600
})

function updateMeasuredHeight() {
  if (scrollBodyRef.value && scrollBodyRef.value.clientHeight > 0) {
    measuredHeight.value = scrollBodyRef.value.clientHeight
  } else if (viewport.value && viewport.value.clientHeight > 0) {
    measuredHeight.value = Math.max(200, viewport.value.clientHeight - 96)
  }
}

interface PoetryColumnItem {
  text: string
  segments: { text: string; mark: string }[]
}

const poetryStanzas = computed<PoetryColumnItem[][]>(() => {
  if (!isPoetry.value) return []
  const punctId = rules.value.punctuation.id

  const parsed = props.paragraphs.map((p) => {
    const verses = splitIntoPoetryVerses(p)
    const couplets = groupIntoCouplets(verses)
    return { verses, couplets }
  })

  // 核心判定规则：如果字体大小可以一联一行，就一联一行；如果只能做到单句成列，就单句成列
  const allCouplets = parsed.flatMap((p) => p.couplets)
  const canFitCouplets =
    allCouplets.length > 0 &&
    allCouplets.every((c) => {
      const h = measureScrollColumnHeight(c, props.fontSize, punctId)
      return h <= availableHeight.value
    })

  return parsed.map((item) => {
    const cols: string[] = []
    if (canFitCouplets) {
      cols.push(...item.couplets)
    } else {
      item.verses.forEach((verse) => {
        const vHeight = measureScrollColumnHeight(verse, props.fontSize, punctId)
        if (vHeight <= availableHeight.value) {
          cols.push(verse)
        } else {
          const maxChars = Math.max(1, Math.floor(availableHeight.value / (props.fontSize * 1.015)))
          const chars = Array.from(verse)
          for (let i = 0; i < chars.length; i += maxChars) {
            cols.push(chars.slice(i, i + maxChars).join(''))
          }
        }
      })
    }
    return cols.map((text) => ({
      text,
      segments: scrollSegments(text, punctId),
    }))
  })
})

const scrollLeading = computed(() => {
  // 直接对标 rg-font.netlify.app (1.10) 与 qiji-font.netlify.app (1.14~1.18) 传世古籍与书法法帖行款
  switch (rules.value.script.id) {
    case 'cursive':
      return 1.10
    case 'running':
      return 1.12
    case 'regular':
    default:
      return 1.15
  }
})
const style = computed(() => ({
  '--scroll-paper': getPaperTheme(props.paperTheme).color,
  '--scroll-font': props.font.family,
  '--scroll-size': `${props.fontSize}px`,
  '--scroll-leading': `${scrollLeading.value}`,
}))
let generation = 0
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateMeasuredHeight()
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    resizeObserver = new ResizeObserver(() => {
      updateMeasuredHeight()
    })
    resizeObserver.observe(viewport.value)
  }
})

watch(() => [props.font.id, props.title, props.paragraphs, props.fontSize] as const, async () => {
  const ticket = ++generation
  status.value = 'loading'
  const ready = await ensureFontLoaded(props.font)
  if (ticket !== generation) return
  status.value = ready ? 'ready' : 'error'
  await nextTick()
  updateMeasuredHeight()
  if (ticket === generation && viewport.value) viewport.value.scrollLeft = 0
}, { immediate: true })
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  generation++
})

function onWheel(event: WheelEvent) {
  const el = viewport.value
  // 触控板原生横向手势与浏览器缩放保持原样；普通纵向滚轮向卷尾（左）移动。
  if (!el || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
  if (el.scrollWidth <= el.clientWidth) return
  event.preventDefault()
  const unit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? el.clientWidth : 1
  el.scrollLeft -= event.deltaY * unit
}
function onKey(event: KeyboardEvent) {
  if (event.target !== viewport.value || event.ctrlKey || event.altKey || event.metaKey) return
  const el = viewport.value!
  if (event.key === 'Home') el.scrollLeft = 0
  else if (event.key === 'End') el.scrollLeft = -el.scrollWidth
  else return
  event.preventDefault()
}
</script>

<template>
  <section class="scroll-viewer" :style="style" :aria-busy="status === 'loading'">
    <p v-if="status === 'loading'" class="scroll-status" role="status">正在展卷…</p>
    <p v-if="status === 'error'" class="scroll-status" role="status">字体暂未载入，已使用备用字体显示全文。</p>
    <div class="scroll-frame" :class="{ 'is-loading': status === 'loading' }">
      <div class="scroll-rod scroll-rod--head" aria-hidden="true" />
      <div
        ref="viewport" class="scroll-viewport" tabindex="0" role="region"
        aria-label="竖排长卷，从右向左阅读；滚轮浏览，Home 到卷首，End 到卷尾"
        @wheel="onWheel" @keydown="onKey"
      >
        <article
          class="handscroll" :data-era="rules.format.id" :data-punctuation="rules.punctuation.id"
          :data-script="rules.script.id" :aria-label="title"
        >
          <div class="scroll-paper">
            <header class="scroll-heading" :class="{ 'scroll-heading--poetry': isPoetry }">
              <h1>{{ title }}</h1>
              <p>{{ era ? `${era} · ` : '' }}{{ author }}</p>
            </header>

            <!-- 诗词排版：自适应一联一行或单句成列，各列独立不腰斩 -->
            <div
              v-if="isPoetry"
              ref="scrollBodyRef"
              class="scroll-body scroll-body--poetry"
              :class="`scroll-body--${rules.punctuation.symbolType}`"
            >
              <div
                v-for="(stanza, sIndex) in poetryStanzas"
                :key="sIndex"
                class="scroll-stanza"
              >
                <div
                  v-for="(col, cIndex) in stanza"
                  :key="cIndex"
                  class="scroll-column"
                >
                  <template v-for="(segment, i) in col.segments" :key="i">
                    <span v-if="segment.mark" class="scroll-anchor">{{ segment.text }}<span
                      class="scroll-mark" :class="{ 'scroll-mark--end': segment.mark === '。' }"
                    >{{ segment.mark }}</span></span><template
                      v-else
                    >
                      {{ segment.text }}
                    </template>
                  </template>
                </div>
              </div>
            </div>

            <!-- 散文排版：连续流水古风折行 -->
            <div
              v-else
              ref="scrollBodyRef"
              class="scroll-body"
              :class="`scroll-body--${rules.punctuation.symbolType}`"
            >
              <p v-for="(segments, index) in paragraphs" :key="index" class="scroll-paragraph">
                <template
                  v-for="(segment, i) in segments" :key="i"
                >
                  <span v-if="segment.mark" class="scroll-anchor">{{ segment.text }}<span
                    class="scroll-mark" :class="{ 'scroll-mark--end': segment.mark === '。' }"
                  >{{ segment.mark }}</span></span><template
                    v-else
                  >
                    {{ segment.text }}
                  </template>
                </template>
              </p>
            </div>

            <div class="scroll-ending" aria-hidden="true">
              <span class="scroll-seal">字在</span>
            </div>
          </div>
        </article>
      </div>
      <div class="scroll-rod scroll-rod--tail" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.scroll-viewer { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; }
.scroll-status { position: absolute; inset: 0; display: grid; place-content: center; color: var(--zz-muted); }
.scroll-status:has(+ .scroll-frame:not(.is-loading)) { inset: auto 0 0; font-size: 12px; }
.scroll-frame {
  display: flex; direction: rtl; align-items: stretch; width: 100%; height: 100%;
  padding: 42px 32px;
  &.is-loading { visibility: hidden; }
}
.scroll-viewport {
  flex: 1; min-width: 0; height: 100%; direction: rtl; overflow-x: auto; overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: thin; scrollbar-color: var(--zz-line-strong) transparent;
  &:focus-visible { outline: 1px solid var(--zz-accent-line); outline-offset: -3px; }
  // 装裱与卷边固定在两轴之间，只有内层全文移动。
  background-color: var(--scroll-paper);
  background-image: repeating-linear-gradient(0deg, transparent 0 3px, var(--zz-scroll-fiber) 3px 4px),
    linear-gradient(90deg, var(--zz-scroll-fold), transparent 38px, transparent calc(100% - 38px), var(--zz-scroll-fold));
  border-block: 9px solid var(--zz-scroll-mount);
  box-shadow: 0 14px 28px var(--zz-scroll-shadow), inset 0 1px var(--zz-scroll-highlight), inset 0 -1px var(--zz-scroll-fold);
  color: var(--zz-ink-body);
}
.handscroll { display: flex; width: max-content; min-width: 100%; height: 100%; align-items: stretch; }
.scroll-paper {
  display: flex; align-items: stretch; flex: 1 0 auto; min-width: 0; height: 100%;
  padding: clamp(24px, 4vh, 48px) 62px;
}
.scroll-heading, .scroll-body, .scroll-ending { writing-mode: vertical-rl; direction: ltr; }
.scroll-heading {
  flex: none; margin-left: 68px; font-family: var(--scroll-font); position: relative;
  h1 { font-size: calc(var(--scroll-size) * 1.35); font-weight: 400; letter-spacing: .12em; line-height: 1.7; }
  p { font-size: 15px; letter-spacing: .15em; margin-right: 15px; color: var(--zz-ink-soft); }
  &--poetry {
    align-self: center;
    height: fit-content;
    max-height: 100%;
    h1, p {
      height: fit-content;
      text-align: start;
    }
  }
}
.scroll-body {
  flex: none; height: 100%; font-family: var(--scroll-font); font-size: var(--scroll-size);
  line-height: var(--scroll-leading); letter-spacing: .015em; line-break: strict;
  overflow-wrap: anywhere; white-space: pre-wrap;
}
.scroll-paragraph { margin: 0; }
.scroll-paragraph:last-child { margin-left: 0; }
.scroll-body--poetry {
  align-self: center;
  height: fit-content;
  max-height: 100%;
  white-space: nowrap;
  overflow-wrap: normal;
  .scroll-stanza {
    height: fit-content;
  }
  .scroll-column {
    height: fit-content;
    text-align: start;
  }
}
.scroll-stanza {
  display: block;
  margin: 0;
  margin-left: calc(var(--scroll-size) * 0.85);
}
.scroll-stanza:last-child {
  margin-left: 0;
}
.scroll-column {
  display: block;
  margin: 0;
  white-space: nowrap;
  line-height: var(--scroll-leading);
  letter-spacing: .015em;
}
.scroll-anchor { position: relative; white-space: nowrap; }
.scroll-mark { position: absolute; top: calc(var(--scroll-size) * .72); left: calc(var(--scroll-size) * .94); width: 1em; height: 1em; font-size: .22em; line-height: 1; letter-spacing: 0; color: transparent; pointer-events: none; }
.scroll-mark::after { content: ''; position: absolute; inset: 20%; border-radius: 50%; background: var(--zz-ink-body); }
.scroll-mark--end::after { inset: 0; border: 1px solid var(--zz-ink-body); background: none; }
.scroll-body--hook .scroll-mark--end::after { border-radius: 0; border-top: 0; border-left: 0; transform: rotate(25deg); }
.scroll-body--cinnabar-circle .scroll-mark::after,
.scroll-body--woodblock-two-color .scroll-mark::after { border-color: var(--zz-scroll-cinnabar); }
.scroll-body--cinnabar-circle .scroll-mark:not(.scroll-mark--end)::after,
.scroll-body--woodblock-two-color .scroll-mark:not(.scroll-mark--end)::after { background: var(--zz-scroll-cinnabar); }
.scroll-body--cinnabar-circle .scroll-mark:not(.scroll-mark--end)::after { inset: 10% 42%; border-radius: 0; transform: rotate(30deg); }
.scroll-body--fine-circle .scroll-mark:not(.scroll-mark--end)::after { inset: 10%; border-radius: 0; clip-path: polygon(0 0, 100% 0, 100% 100%); }
.scroll-ending {
  display: flex; justify-content: flex-end; align-items: center;
  width: 180px; flex: none; padding-bottom: clamp(54px, 14vh, 110px);
}
.scroll-seal {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 10px 5px 12px; border: 2px solid var(--zz-accent); outline: 1px solid var(--zz-accent);
  outline-offset: -4px; border-radius: 2px;
  color: var(--zz-accent); font-size: 16px; line-height: 1.35; letter-spacing: .24em;
  font-family: var(--scroll-font); font-weight: 600;
  box-shadow: 0 1px 3px rgba(196, 64, 51, 0.15), inset 0 0 1px rgba(196, 64, 51, 0.3);
  user-select: none; opacity: 0.94;
}
.scroll-rod {
  position: relative; flex: none; width: 22px; margin-block: -12px;
  border-radius: 8px / 4px;
  background: linear-gradient(90deg, var(--zz-scroll-wood-dark), var(--zz-scroll-wood-light) 35%, var(--zz-scroll-wood) 70%, var(--zz-scroll-wood-dark));
  box-shadow: 4px 5px 9px var(--zz-scroll-shadow); z-index: 1;
  &::before { content: ''; position: absolute; inset: 15px -5px; border-radius: 40% / 5px;
    background: linear-gradient(90deg, var(--zz-scroll-mount), var(--scroll-paper) 35%, var(--zz-scroll-mount));
    box-shadow: inset -3px 0 5px var(--zz-scroll-fold); }
  &--tail { width: 30px; }
}
@media (max-height: 650px) {
  .scroll-frame { padding-block: 30px; }
  .scroll-paper { padding-block: 20px; }
}
</style>
