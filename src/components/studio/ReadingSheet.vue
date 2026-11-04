<script setup lang="ts">
import { computed } from 'vue'
import type { LayoutMode, TextCategory } from '@/types'
import type { BookPage } from '@/composables/usePagination'
import {
  getPaperTheme,
  defaultPaperThemeId,
  type PaperThemeId,
} from '@/data/paperThemes'
import {
  defaultPunctuationStyleId,
  sanitizeTextForEra,
  type PunctuationStyleId,
} from '@/data/punctuationStyles'
import {
  getEraFormat,
  type EraFormatId,
} from '@/data/eraFormats'
import {
  getScriptStyle,
  type ScriptStyleId,
} from '@/data/scriptStyles'

const props = withDefaults(
  defineProps<{
    page: BookPage
    title: string
    author: string
    era?: string
    fontFamily: string
    layout: LayoutMode
    fontSize: number
    lineHeight: number
    letterSpacing: number
    contentWidth: number
    isCustom?: boolean
    category?: TextCategory
    pagePosition: 'first' | 'second'
    single: boolean
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
    paperTheme: defaultPaperThemeId,
    punctuationStyle: defaultPunctuationStyleId,
    eraFormat: undefined,
    scriptStyle: undefined,
    judouMode: true,
    woodblockFrame: true,
  },
)

const isVertical = computed(() => props.layout === 'vertical')

const currentTheme = computed(() => getPaperTheme(props.paperTheme))

const styleVars = computed(() => ({
  '--reading-font': props.fontFamily,
  '--reading-size': `${props.fontSize}px`,
  '--reading-leading': `${props.lineHeight}`,
  '--reading-tracking': `${props.letterSpacing}em`,
  '--reading-width': `${props.contentWidth}px`,
  '--reading-bg': currentTheme.value.color,
  '--reading-border': currentTheme.value.borderColor,
}))

/** 中文数字转换，用于古籍叶码（如“叶一”、“叶二”） */
function toChinesePageNum(pageIndex: number): string {
  const n = pageIndex + 1
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (n <= 10) return `叶${digits[n]}`
  if (n < 20) return `叶十${n % 10 === 0 ? '' : digits[n % 10]}`
  const tens = Math.floor(n / 10)
  const rest = n % 10
  return `叶${digits[tens]}十${rest === 0 ? '' : digits[rest]}`
}

/** 当前生效的时代标点定义与伴随装帧 */
const effectiveStyleId = computed<PunctuationStyleId>(() => {
  // 策略 A：古代四大标点在文献学上仅支持竖排；横排强制使用现代标点
  if (props.layout === 'horizontal') {
    return 'modern'
  }
  // 若显式传入 judouMode 为 false，且未显式指定非明清的 punctuationStyle，则回退为 modern
  if (props.judouMode === false && props.punctuationStyle === defaultPunctuationStyleId) {
    return 'modern'
  }
  return props.punctuationStyle ?? (props.judouMode ? 'ming-qing' : 'modern')
})

const effectiveEraFormatId = computed<EraFormatId>(() => {
  if (props.layout === 'horizontal') {
    return 'modern'
  }
  if (props.eraFormat) {
    return props.eraFormat
  }
  return (props.punctuationStyle as EraFormatId) ?? 'ming-qing'
})

const effectiveScriptStyleId = computed<ScriptStyleId>(() => {
  if (props.layout === 'horizontal') {
    return 'regular'
  }
  if (props.scriptStyle) {
    return props.scriptStyle
  }
  if (props.fontFamily.toLowerCase().includes('rhyme-grass') || props.fontFamily.includes('草')) {
    return 'cursive'
  }
  return 'regular'
})

const isAncientPunctuation = computed(() => effectiveStyleId.value !== 'modern')
const eraDef = computed(() => getEraFormat(effectiveEraFormatId.value))
const scriptDef = computed(() => getScriptStyle(effectiveScriptStyleId.value))

const borderStyle = computed<'none' | 'single' | 'double'>(() => {
  if (!props.woodblockFrame || props.layout === 'horizontal') return 'none'
  return eraDef.value.borderStyle
})

const fishtailStyle = computed<'none' | 'single' | 'double'>(() => {
  if (!props.woodblockFrame || props.layout === 'horizontal') return 'none'
  return eraDef.value.fishtailStyle
})

const hasNose = computed(() => {
  if (!props.woodblockFrame || props.layout === 'horizontal') return false
  return eraDef.value.hasNose
})

const hasLeafNum = computed(() => {
  if (!props.woodblockFrame || props.layout === 'horizontal') return false
  return eraDef.value.hasLeafNum
})

/**
 * 纵向界行渲染控制：
 * - 草书规制 (cursive)：绝对无界行 (sheet__column--lined-none)，绝不切断连绵笔势
 * - 行书规制 (running)：淡墨虚显 (sheet__column--lined sheet__column--lined-subtle)
 * - 正书规制 (regular)：清晰乌丝栏 (sheet__column--lined sheet__column--lined-solid)
 */
const columnLineClass = computed(() => {
  if (props.layout === 'horizontal') return ''
  // 草书规制：彻底无栏
  if (scriptDef.value.columnLineStyle === 'none') {
    return 'sheet__column--lined-none'
  }
  // 如果是先秦或近代现代无框，且用户未手动强制开启版框，则不加界行
  const needsLine =
    props.woodblockFrame ||
    effectiveEraFormatId.value === 'wei-jin' ||
    effectiveEraFormatId.value === 'song-yuan' ||
    effectiveEraFormatId.value === 'ming-qing'
  if (!needsLine) return ''

  if (scriptDef.value.columnLineStyle === 'subtle') {
    return 'sheet__column--lined sheet__column--lined-subtle'
  }
  return 'sheet__column--lined sheet__column--lined-solid'
})

/** 拆分时代标点符号片段：古代标点以字侧附挂形式呈现微观几何，现代标点保持流式占格 */
interface JudouSegment {
  text: string
  isJudou: boolean
  isSentenceEnd: boolean
}

function parseJudou(text: string): JudouSegment[] {
  if (!text) return []
  if (!isAncientPunctuation.value) {
    return [{ text, isJudou: false, isSentenceEnd: false }]
  }
  const clean = sanitizeTextForEra(text, effectiveStyleId.value)
  const parts = clean.split(/([。，、；：？！])/)
  return parts.filter(Boolean).map((part) => ({
    text: part,
    isJudou: /^[。，、；：？！]$/.test(part),
    isSentenceEnd: /^[。！？；]$/.test(part),
  }))
}

/** 计算中缝版心位置（靠近装订折页侧） */
const creaseSide = computed<'left' | 'right'>(() => {
  if (props.single) return 'left'
  if (isVertical.value) {
    // 竖排：右侧槽为第 1 读序（中缝在左），左侧槽为第 2 读序（中缝在右）
    return props.pagePosition === 'second' ? 'left' : 'right'
  } else {
    // 横排：左侧槽为第 1 读序（中缝在右），右侧槽为第 2 读序（中缝在左）
    return props.pagePosition === 'first' ? 'right' : 'left'
  }
})
</script>

<template>
  <article
    class="sheet"
    :class="[
      {
        'sheet--vertical': isVertical,
        'sheet--single': props.single,
        'sheet--woodblock': props.woodblockFrame && borderStyle !== 'none',
        'sheet--ancient-era': isVertical && effectiveEraFormatId !== 'modern',
        'sheet--cursive': isVertical && effectiveScriptStyleId === 'cursive',
      },
      `sheet--${props.pagePosition}`,
    ]"
    :style="styleVars"
    :data-page="props.page.index + 1"
  >
    <!-- 古籍四周版框（明清文武双边 / 宋元单边）与中缝鱼尾象鼻 -->
    <template v-if="props.woodblockFrame">
      <div
        v-if="borderStyle !== 'none'"
        class="woodblock-frame"
        :class="`woodblock-frame--${borderStyle}`"
        aria-hidden="true"
      />
      <aside
        v-if="fishtailStyle !== 'none'"
        class="banxin"
        :class="`banxin--${creaseSide}`"
        aria-hidden="true"
      >
        <div class="banxin__top">
          <div v-if="hasNose" class="banxin__nose" />
          <svg class="banxin__fishtail" viewBox="0 0 24 16">
            <path d="M 0 0 L 24 0 L 12 12 L 0 0 Z" />
          </svg>
        </div>
        <div class="banxin__content">
          <span class="banxin__title">{{ props.title }}</span>
          <span v-if="hasLeafNum" class="banxin__leaf">{{ toChinesePageNum(props.page.index) }}</span>
        </div>
        <div v-if="fishtailStyle === 'double'" class="banxin__bottom">
          <svg class="banxin__fishtail banxin__fishtail--inverted" viewBox="0 0 24 16">
            <path d="M 0 0 L 24 0 L 12 12 L 0 0 Z" />
          </svg>
          <div v-if="hasNose" class="banxin__nose" />
        </div>
      </aside>
    </template>

    <!-- 横排正文 -->
    <div v-if="!isVertical" class="sheet__inner">
      <header v-if="props.page.hasHeader" class="sheet__head">
        <h1 class="sheet__title">{{ props.title }}</h1>
        <p class="sheet__meta">
          <span v-if="props.era">{{ props.era }} ·</span>
          {{ props.author }}
        </p>
      </header>

      <div class="prose" :class="{ 'prose--poetry': props.category === '诗' || props.category === '词' }">
        <p
          v-for="(paragraph, index) in props.page.paragraphs"
          :key="`${paragraph.paragraphIndex}-${index}`"
          :class="{ 'prose__paragraph--end': paragraph.paragraphEnd }"
          :style="{ textIndent: paragraph.indent ? '2em' : '0' }"
        >
          <template v-if="isAncientPunctuation">
            <template v-for="(seg, sIdx) in parseJudou(paragraph.text)" :key="sIdx">
              <span
                v-if="seg.isJudou"
                class="judou-mark"
                :class="[
                  `judou-mark--${effectiveStyleId}`,
                  seg.isSentenceEnd ? 'judou-mark--sentence' : 'judou-mark--clause',
                ]"
              >
                <!-- 先秦两汉：折笔墨钩 乚 与小墨点 -->
                <template v-if="effectiveStyleId === 'pre-qin'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--hook"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M 5 2 L 5 10.5 C 5 12.2 6.5 13.5 9.5 13.5 C 11.5 13.5 13 13 14 11.8"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--dot"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
                  </svg>
                </template>

                <!-- 魏晋隋唐：手书朱圈 ⚪ 与斜撇 丶 -->
                <template v-else-if="effectiveStyleId === 'wei-jin'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--cinnabar-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.8" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--cinnabar-slash"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M 4 4 C 6.5 6.5 8.5 9.5 11 12 C 12.5 10.5 11.5 7.5 8 5 Z" fill="currentColor" />
                  </svg>
                </template>

                <!-- 宋元雕版：细铁线圈 ⚪ 与小角点 ▲ -->
                <template v-else-if="effectiveStyleId === 'song-yuan'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--fine-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.2" fill="none" stroke="currentColor" stroke-width="1.1" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--corner-triangle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <polygon points="4,12 12,12 12,4" fill="currentColor" />
                  </svg>
                </template>

                <!-- 明清刻本（默认经典）：朱墨套印朱圈 ⚪ 与朱圆点 -->
                <template v-else>
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--mingqing-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.7" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--mingqing-dot"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
                  </svg>
                </template>

                <span class="judou-mark__sr">{{ seg.text }}</span>
              </span>
              <template v-else>{{ seg.text }}</template>
            </template>
          </template>
          <template v-else>
            {{ paragraph.text }}
          </template>
        </p>
      </div>
    </div>

    <!-- 竖排正文 -->
    <div v-else class="sheet__inner sheet__inner--vertical">
      <div class="sheet__vertical-flow" aria-label="竖排正文">
        <div
          v-for="(column, index) in props.page.columns"
          :key="`${column.kind}-${index}`"
          class="sheet__column"
          :class="[
            `sheet__column--${column.kind}`,
            column.kind === 'body' ? columnLineClass : '',
          ]"
          :style="{ '--column-width': `${column.width}px` }"
        >
          <template v-if="isAncientPunctuation">
            <template v-for="(seg, sIdx) in parseJudou(column.text)" :key="sIdx">
              <span
                v-if="seg.isJudou"
                class="judou-mark"
                :class="[
                  `judou-mark--${effectiveStyleId}`,
                  seg.isSentenceEnd ? 'judou-mark--sentence' : 'judou-mark--clause',
                ]"
              >
                <!-- 先秦两汉：折笔墨钩 乚 与小墨点 -->
                <template v-if="effectiveStyleId === 'pre-qin'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--hook"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M 5 2 L 5 10.5 C 5 12.2 6.5 13.5 9.5 13.5 C 11.5 13.5 13 13 14 11.8"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--dot"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
                  </svg>
                </template>

                <!-- 魏晋隋唐：手书朱圈 ⚪ 与斜撇 丶 -->
                <template v-else-if="effectiveStyleId === 'wei-jin'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--cinnabar-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.8" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--cinnabar-slash"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M 4 4 C 6.5 6.5 8.5 9.5 11 12 C 12.5 10.5 11.5 7.5 8 5 Z" fill="currentColor" />
                  </svg>
                </template>

                <!-- 宋元雕版：细铁线圈 ⚪ 与小角点 ▲ -->
                <template v-else-if="effectiveStyleId === 'song-yuan'">
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--fine-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.2" fill="none" stroke="currentColor" stroke-width="1.1" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--corner-triangle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <polygon points="4,12 12,12 12,4" fill="currentColor" />
                  </svg>
                </template>

                <!-- 明清刻本（默认经典）：朱墨套印朱圈 ⚪ 与朱圆点 -->
                <template v-else>
                  <svg
                    v-if="seg.isSentenceEnd"
                    class="punct-svg punct-svg--mingqing-circle"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.7" />
                  </svg>
                  <svg
                    v-else
                    class="punct-svg punct-svg--mingqing-dot"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
                  </svg>
                </template>

                <span class="judou-mark__sr">{{ seg.text }}</span>
              </span>
              <template v-else>{{ seg.text }}</template>
            </template>
          </template>
          <template v-else>
            {{ column.text }}
          </template>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.sheet {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  border: 1px solid var(--reading-border, var(--zz-line));
  border-radius: 1px;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 15%), transparent 18%, transparent 80%, rgb(80 62 44 / 4%)),
    var(--reading-bg, var(--zz-paper-reading));
  box-shadow: 0 8px 28px rgb(58 47 35 / 3.5%);
  overflow: hidden;
  transition: background-color var(--zz-dur-normal) var(--zz-ease-out), border-color var(--zz-dur-normal) var(--zz-ease-out);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(rgb(138 111 82 / 5.8%) 0.5px, transparent 1px);
    background-size: 9px 9px;
    opacity: 0.17;
  }

  &--second {
    border-left-color: var(--reading-border, var(--zz-line-soft));
  }

  &--single {
    overflow: visible;
    border-radius: 2px 3px 3px 2px;
    box-shadow: 1px 2px 0 var(--zz-paper), 2px 3px 0 var(--zz-line),
      3px 5px 0 var(--reading-bg, var(--zz-paper-reading)), 4px 6px 0 var(--zz-line-soft),
      0 12px 24px rgb(58 47 35 / 8%);
  }

  &--single::after {
    content: '';
    position: absolute;
    z-index: 2;
    top: -5px;
    bottom: -5px;
    left: -42px;
    width: 64px;
    pointer-events: none;
    border-radius: 50% / 8px;
    background:
      radial-gradient(ellipse at 50% 50%, var(--zz-paper-deep) 42%, var(--zz-line-strong) 55%, var(--zz-paper) 68%, transparent 73%) top center / 100% 12px no-repeat,
      radial-gradient(ellipse at 50% 50%, var(--zz-paper-deep) 42%, var(--zz-line) 58%, transparent 73%) bottom center / 100% 10px no-repeat,
      linear-gradient(
        90deg,
        var(--zz-line-strong) 0%,
        var(--zz-paper-deep) 10%,
        var(--reading-bg, var(--zz-paper-reading)) 30%,
        var(--zz-paper-raised) 49%,
        var(--zz-paper) 65%,
        var(--zz-paper-deep) 85%,
        var(--zz-line-strong) 100%
      );
    box-shadow:
      inset 1px 0 1px rgb(255 255 255 / 35%),
      inset -1px 0 2px rgb(58 47 35 / 12%),
      10px 2px 13px -6px rgb(58 47 35 / 25%),
      -4px 8px 12px -6px rgb(58 47 35 / 18%);
  }

  &__inner {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    padding: 48px 56px 44px;
  }

  &__head {
    flex: none;
    width: min(100%, var(--reading-width));
    text-align: center;
    margin: 0 0 36px;
  }

  &__title {
    font-family: var(--reading-font);
    font-size: 32px;
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    text-indent: var(--zz-track-normal);
    color: var(--zz-ink);
    line-height: 1.5;
  }

  &__meta {
    margin-top: 10px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: 0.18em;
    text-indent: 0.18em;
    color: var(--zz-muted);
    line-height: 1.6;
  }

  &__vertical-flow {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    max-width: var(--reading-width);
    height: 100%;
    margin-left: auto;
    overflow: hidden;
    font-family: var(--reading-font);
  }

  &__column {
    flex: none;
    height: 100%;
    width: var(--column-width);
    overflow: hidden;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    white-space: pre;
    line-height: var(--reading-leading);
    letter-spacing: var(--reading-tracking);
    color: var(--zz-ink-body);

    &--title {
      font-size: 20px;
      line-height: 1.6;
      letter-spacing: 0.14em;
      color: var(--zz-ink);
    }

    &--meta {
      font-family: var(--zz-font-serif);
      font-size: 13px;
      line-height: 1.6;
      letter-spacing: 0.08em;
      color: var(--zz-muted);
    }

    &--body {
      font-size: var(--reading-size);
    }

    &--gap {
      color: transparent;
    }

    &--lined {
      border-left: 1px solid rgba(75, 55, 40, 0.1);
      border-right: 1px solid rgba(75, 55, 40, 0.1);
      margin-left: -1px;
      box-sizing: content-box;

      &-solid {
        border-left: 1px solid rgba(75, 55, 40, 0.15);
        border-right: 1px solid rgba(75, 55, 40, 0.15);
      }

      &-subtle {
        border-left: 1px dashed rgba(75, 55, 40, 0.08);
        border-right: 1px dashed rgba(75, 55, 40, 0.08);
      }
    }

    &--lined-none {
      border-left: none !important;
      border-right: none !important;
      margin-left: 0;
    }
  }
}

.prose {
  width: min(100%, var(--reading-width));
  max-width: var(--reading-width);
  font-family: var(--reading-font);
  font-size: var(--reading-size);
  line-height: var(--reading-leading);
  letter-spacing: var(--reading-tracking);
  color: var(--zz-ink-body);

  p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  p.prose__paragraph--end {
    margin-bottom: 1.3em;
  }

  p:last-child {
    margin-bottom: 0;
  }

  &--poetry {
    text-align: center;

    p {
      white-space: pre-line;
      line-height: calc(var(--reading-leading) * 1.25);
    }

    p.prose__paragraph--end {
      margin-bottom: 1.6em;
    }
  }
}

.sheet--vertical {
  .sheet__inner--vertical {
    align-items: stretch;
    padding: 44px 52px 42px;
  }

  &.sheet--ancient-era {
    .sheet__inner--vertical {
      /* 古籍“天宽地窄”天头地脚比例 (1.6~1.8:1) 留白还原 */
      padding-top: 52px;
      padding-bottom: 30px;
    }
  }

  .judou-mark {
    display: inline-block;
    position: relative;
    /* 关键：宽度和高度设为 0，彻底不占用垂直字流空间，保持原版字方（字方不破） */
    width: 0;
    height: 0;
    margin: 0;
    vertical-align: top;
    pointer-events: none;

    .punct-svg {
      position: absolute;
      width: 0.62em;
      height: 0.62em;
      display: block;
      /* 核心物理定位：在 vertical-rl 中，从当前字基准点出发：
         - top 向上提负值，与前一个汉字的身旁对齐
         - translateX(-0.55em) 稳固挂入字身物理右侧行隙（East Gutter Track），绝不偏向列左 */
      top: -0.8em;
      left: 0;
      transform: translateX(-0.55em);
    }

    &--clause .punct-svg {
      top: -0.42em;
      transform: translateX(-0.55em);
    }
  }
}

/* 时代标点微观几何形态与字侧附挂（横排） */
.judou-mark {
  display: inline-block;
  position: relative;
  width: 0.28em;
  height: 0.85em;
  vertical-align: baseline;
  margin: 0;
  pointer-events: none;

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .punct-svg {
    position: absolute;
    display: block;
    width: 0.62em;
    height: 0.62em;
    left: 0.04em;
    bottom: -0.06em;
  }

  // 先秦两汉：沉稳黑墨简帛钩识与墨点
  &--pre-qin {
    color: rgba(35, 24, 21, 0.92);
  }

  // 魏晋隋唐：毛笔手书朱圈与斜撇
  &--wei-jin {
    color: #b83625;
    filter: drop-shadow(0 0 0.5px rgba(184, 54, 37, 0.4));
  }

  // 宋元雕版：纯黑细铁线墨圈与角点
  &--song-yuan {
    color: #231815;
  }

  // 明清刻本：朱墨套印鲜润朱砂红
  &--ming-qing {
    color: #b83625;
    text-shadow: 0 0 0.5px rgba(184, 54, 37, 0.45);
  }
}

/* 古籍四周版框：明清文武双边 vs 宋元单边 */
.woodblock-frame {
  position: absolute;
  inset: 12px 14px;
  pointer-events: none;
  border-radius: 1px;
  z-index: 2;

  &--double {
    border: 2px solid rgba(46, 36, 28, 0.8);

    &::before {
      content: '';
      position: absolute;
      inset: 3px;
      border: 0.8px solid rgba(46, 36, 28, 0.65);
    }
  }

  &--single {
    border: 1.5px solid rgba(46, 36, 28, 0.75);

    &::before {
      display: none;
    }
  }
}

/* 中缝折页版心（象鼻、黑鱼尾、书名与叶码） */
.banxin {
  position: absolute;
  top: 18px;
  bottom: 18px;
  width: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  z-index: 3;
  color: rgba(46, 36, 28, 0.75);

  &--left {
    left: 20px;
  }

  &--right {
    right: 20px;
  }

  &__top,
  &__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__nose {
    width: 2px;
    height: 16px;
    background: currentColor;
    margin: 4px 0;
  }

  &__fishtail {
    display: block;
    width: 12px;
    height: 8px;
    fill: currentColor;
    margin: 2px 0;

    &--inverted {
      transform: rotate(180deg);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    writing-mode: vertical-rl;
    font-family: var(--reading-font);
    font-size: 11px;
    letter-spacing: 0.18em;
    line-height: 1;
    color: rgba(46, 36, 28, 0.7);
    user-select: none;
    max-height: calc(100% - 100px);
    overflow: hidden;
  }

  &__title {
    max-height: 110px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__leaf {
    font-family: var(--zz-font-serif);
    font-size: 10px;
    color: rgba(46, 36, 28, 0.6);
  }
}
</style>
