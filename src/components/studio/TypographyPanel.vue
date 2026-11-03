<script setup lang="ts">
import { computed, ref } from 'vue'
import { Info } from 'lucide-vue-next'
import { SliderRoot, SliderThumb, SliderTrack, SliderRange } from 'reka-ui'
import type { LayoutMode } from '@/types'
import {
  paperThemes,
  defaultPaperThemeId,
  type PaperThemeId,
} from '@/data/paperThemes'
import {
  punctuationStyles,
  defaultPunctuationStyleId,
  type PunctuationStyleId,
} from '@/data/punctuationStyles'
import {
  eraFormats,
  defaultEraFormatId,
  type EraFormatId,
} from '@/data/eraFormats'
import {
  scriptStyles,
  defaultScriptStyleId,
  type ScriptStyleId,
} from '@/data/scriptStyles'
import StudioPanel from './StudioPanel.vue'
import PunctuationInfoModal from './PunctuationInfoModal.vue'
import FormatInfoModal from './FormatInfoModal.vue'

/** 排版参数：字号、行高、字距、版心宽度、宣纸底色、时代装帧、书体规制与标点句读。 */

const props = withDefaults(
  defineProps<{
    open: boolean
    layout: LayoutMode
    fontSize: number
    lineHeight: number
    letterSpacing: number
    contentWidth: number
    paperTheme?: PaperThemeId
    punctuationStyle?: PunctuationStyleId
    eraFormat?: EraFormatId
    scriptStyle?: ScriptStyleId
    judouMode?: boolean
    woodblockFrame?: boolean
  }>(),
  {
    paperTheme: defaultPaperThemeId,
    punctuationStyle: defaultPunctuationStyleId,
    eraFormat: defaultEraFormatId,
    scriptStyle: defaultScriptStyleId,
    judouMode: true,
    woodblockFrame: true,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:layout': [value: LayoutMode]
  'update:fontSize': [value: number]
  'update:lineHeight': [value: number]
  'update:letterSpacing': [value: number]
  'update:contentWidth': [value: number]
  'update:paperTheme': [value: PaperThemeId]
  'update:punctuationStyle': [value: PunctuationStyleId]
  'update:eraFormat': [value: EraFormatId]
  'update:scriptStyle': [value: ScriptStyleId]
  'update:judouMode': [value: boolean]
  'update:woodblockFrame': [value: boolean]
  reset: []
}>()

// 标点考据弹窗状态
const punctModalOpen = ref(false)
const selectedPunctId = ref<PunctuationStyleId | null>(null)

function openPunctModal(styleId: PunctuationStyleId) {
  selectedPunctId.value = styleId
  punctModalOpen.value = true
}

// 时代装帧与书体规制考据弹窗状态
const formatModalOpen = ref(false)
const formatModalMode = ref<'era-format' | 'script-style'>('era-format')
const formatModalTargetId = ref<string | null>(null)

function openFormatModal(mode: 'era-format' | 'script-style', targetId: string) {
  formatModalMode.value = mode
  formatModalTargetId.value = targetId
  formatModalOpen.value = true
}

function selectPunctuationStyle(styleId: PunctuationStyleId) {
  if (styleId !== 'modern' && props.layout === 'horizontal') {
    emit('update:layout', 'vertical')
  }
  emit('update:punctuationStyle', styleId)
}

function selectEraFormat(formatId: EraFormatId) {
  if (formatId !== 'modern' && props.layout === 'horizontal') {
    emit('update:layout', 'vertical')
  }
  emit('update:eraFormat', formatId)
  if (formatId !== 'modern') {
    emit('update:woodblockFrame', true)
  }
}

function selectScriptStyle(scriptId: ScriptStyleId) {
  if (props.layout === 'horizontal') {
    emit('update:layout', 'vertical')
  }
  emit('update:scriptStyle', scriptId)
}

function handleLayoutChange(mode: LayoutMode) {
  emit('update:layout', mode)
  if (mode === 'horizontal') {
    emit('update:punctuationStyle', 'modern')
    emit('update:eraFormat', 'modern')
    emit('update:scriptStyle', 'regular')
    emit('update:judouMode', false)
    emit('update:woodblockFrame', false)
  }
}

interface Control {
  key: 'fontSize' | 'lineHeight' | 'letterSpacing' | 'contentWidth'
  label: string
  hint: string
  min: number
  max: number
  step: number
  value: number
  format: (v: number) => string
}

const controls = computed<Control[]>(() => [
  {
    key: 'fontSize',
    label: '字号',
    hint: '正文单字的大小',
    min: 14,
    max: 40,
    step: 1,
    value: props.fontSize,
    format: (v) => `${v}px`,
  },
  {
    key: 'lineHeight',
    label: '行高',
    hint: '行与行之间的呼吸',
    min: 1.4,
    max: 3,
    step: 0.1,
    value: props.lineHeight,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'letterSpacing',
    label: '字距',
    hint: '字与字之间的松紧',
    min: 0,
    max: 0.2,
    step: 0.005,
    value: props.letterSpacing,
    format: (v) => `${v.toFixed(3)}em`,
  },
  {
    key: 'contentWidth',
    label: '版心',
    hint: '每行容纳的宽度，影响每行字数',
    min: 440,
    max: 960,
    step: 20,
    value: props.contentWidth,
    format: (v) => `${v}px`,
  },
])

/** 竖排模式下恪守古籍“紧字宽行、版心天成”之规制，仅保留字号调节，隐藏行高、字距与版心 */
const activeControls = computed<Control[]>(() => {
  if (props.layout === 'vertical') {
    return controls.value.filter((ctrl) => ctrl.key === 'fontSize')
  }
  return controls.value
})

const emitMap = {
  fontSize: 'update:fontSize',
  lineHeight: 'update:lineHeight',
  letterSpacing: 'update:letterSpacing',
  contentWidth: 'update:contentWidth',
} as const

function onSlide(key: Control['key'], value: number[]) {
  const next = value[0]
  if (typeof next !== 'number') return
  const listener = emitMap[key]
  ;(emit as (e: string, v: number) => void)(listener, next)
}

const DEFAULTS: Record<Control['key'], number> = {
  fontSize: 30,
  lineHeight: 2.4,
  letterSpacing: 0.04,
  contentWidth: 660,
}

function resetAll() {
  for (const key of Object.keys(DEFAULTS) as Control['key'][]) {
    ;(emit as (e: string, v: number) => void)(emitMap[key], DEFAULTS[key])
  }
  emit('update:paperTheme', defaultPaperThemeId)
  emit('reset')
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="版式 · 纸上章法"
    description="分设时代装帧与书体规制两大体系，搭配时代标点与宣纸古笺，复刻古代书籍原貌。"
    @update:open="(v) => emit('update:open', v)"
  >
    <!-- 文字方向 -->
    <fieldset class="direction">
      <legend class="direction__legend">文字方向</legend>
      <div class="direction__options">
        <button
          type="button"
          class="direction__button"
          :class="{ 'is-active': props.layout === 'horizontal' }"
          :aria-pressed="props.layout === 'horizontal'"
          @click="handleLayoutChange('horizontal')"
        >
          横排
        </button>
        <button
          type="button"
          class="direction__button"
          :class="{ 'is-active': props.layout === 'vertical' }"
          :aria-pressed="props.layout === 'vertical'"
          @click="handleLayoutChange('vertical')"
        >
          竖排
        </button>
      </div>
    </fieldset>

    <!-- 时代装帧 · 版面制式（五大时代装帧体系 + ℹ 学术考据弹窗） -->
    <fieldset class="era-format">
      <legend class="era-format__legend">时代装帧 · 版面制式</legend>
      <div class="era-format__list">
        <div
          v-for="format in eraFormats"
          :key="format.id"
          class="era-format__item"
          :class="{ 'is-active': props.eraFormat === format.id }"
        >
          <button
            type="button"
            class="era-format__main-btn"
            :aria-pressed="props.eraFormat === format.id"
            @click="selectEraFormat(format.id)"
          >
            <span class="era-format__symbol" aria-hidden="true">
              <!-- 先秦两汉：编简纯笺 -->
              <svg v-if="format.id === 'pre-qin'" viewBox="0 0 24 24" class="format-icon">
                <line x1="6" y1="2" x2="6" y2="22" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2" />
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2" />
                <line x1="18" y1="2" x2="18" y2="22" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2" />
                <line x1="3" y1="7" x2="21" y2="7" stroke="#b83625" stroke-width="1.2" />
                <line x1="3" y1="17" x2="21" y2="17" stroke="#b83625" stroke-width="1.2" />
              </svg>
              <!-- 魏晋隋唐：官抄乌丝界格 -->
              <svg v-else-if="format.id === 'wei-jin'" viewBox="0 0 24 24" class="format-icon">
                <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" />
                <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" stroke-width="1" />
                <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" stroke-width="1" />
              </svg>
              <!-- 宋元雕版：四周单边与单鱼尾白口 -->
              <svg v-else-if="format.id === 'song-yuan'" viewBox="0 0 24 24" class="format-icon">
                <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" />
                <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3 3" />
                <polygon points="9,6 15,6 12,9" fill="currentColor" />
              </svg>
              <!-- 明清刻本：文武双边与对黑鱼尾 -->
              <svg v-else-if="format.id === 'ming-qing'" viewBox="0 0 24 24" class="format-icon">
                <rect x="2.5" y="2.5" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" />
                <rect x="5.5" y="5.5" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1" />
                <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="currentColor" stroke-width="1.2" />
                <polygon points="10,6.5 14,6.5 12,9" fill="currentColor" />
                <polygon points="10,17.5 14,17.5 12,15" fill="currentColor" />
              </svg>
              <!-- 近代现代：现代通栏黄金网格 -->
              <svg v-else viewBox="0 0 24 24" class="format-icon">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" />
                <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.4" />
                <line x1="7" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="1.4" />
                <line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </span>
            <span class="era-format__info">
              <span class="era-format__title-row">
                <span class="era-format__name">{{ format.name }}</span>
                <span v-if="format.id !== 'modern'" class="era-format__tag">竖排专享</span>
              </span>
              <span class="era-format__span">{{ format.eraSpan }}</span>
            </span>
          </button>

          <button
            type="button"
            class="era-format__info-btn"
            :aria-label="`查看 ${format.name} 学术考据`"
            title="查看版本依据与善本实录"
            @click.stop="openFormatModal('era-format', format.id)"
          >
            <Info :size="15" />
          </button>
        </div>
      </div>
    </fieldset>

    <!-- 书体规制 · 行气法则（三大书体行气法则 + ℹ 学术考据弹窗） -->
    <fieldset class="script-style">
      <legend class="script-style__legend">书体规制 · 行气法则</legend>
      <div class="script-style__list">
        <div
          v-for="style in scriptStyles"
          :key="style.id"
          class="script-style__item"
          :class="{ 'is-active': props.scriptStyle === style.id }"
        >
          <button
            type="button"
            class="script-style__main-btn"
            :aria-pressed="props.scriptStyle === style.id"
            @click="selectScriptStyle(style.id)"
          >
            <span class="script-style__symbol" aria-hidden="true">
              <!-- 正书规制：华文楷体「楷」书法单字 -->
              <svg v-if="style.id === 'regular'" viewBox="0 0 24 24" class="format-icon">
                <path
                  d="M16.21 7.95Q16.19 8.44 16.19 8.77Q16.19 9.9 16.48 10.21Q16.78 10.52 17.57 10.52Q18.37 10.52 18.92 10.33Q19.48 10.15 19.73 9.77Q19.99 9.39 20.15 8.66Q20.3 7.93 20.38 7.93Q20.47 7.93 20.53 8.26Q20.77 9.59 20.89 9.82Q21 10.05 21 10.21Q21 10.68 20.17 11.06Q19.33 11.44 17.77 11.44Q16.95 11.44 16.63 11.3Q16.31 11.16 16.01 10.93Q15.71 10.7 15.58 10.29Q15.45 9.88 15.45 8.96L15.55 5.52Q15.55 4.49 15.33 4.2Q15.12 3.92 15.12 3.72Q15.12 3.52 15.44 3.52Q15.75 3.52 16.33 3.82Q16.91 4.12 16.91 4.42Q16.91 4.72 16.74 4.99Q16.58 5.25 16.43 5.96Q16.29 6.67 16.23 7.47Q18.04 6.43 18.14 5.85Q18.2 5.5 18.47 5.5Q18.74 5.5 19.14 5.98Q19.54 6.47 19.54 6.67Q19.54 6.88 19.13 6.96Q18.59 7.06 16.21 7.95ZM8.74 8.48Q9.42 8.34 9.98 8.34Q10.55 8.34 10.75 8.49Q10.94 8.65 10.94 8.77Q10.94 9.04 9.91 9.24Q9.32 9.33 8.7 9.47Q8.68 9.49 8.67 9.54Q8.66 9.59 8.62 10.23L8.55 12.43Q8.51 14.02 8.51 15.23L8.55 17.04Q8.55 18.52 8.35 19.32Q8.14 20.13 7.89 20.13Q7.63 20.13 7.38 19.62Q7.13 19.12 7.13 18.76Q7.13 18.4 7.32 17.7Q7.71 15.95 7.88 11.4Q7.03 12.91 6.01 14.07Q5 15.23 4.21 15.76Q3.43 16.3 3.22 16.3Q3 16.3 3 16.19Q3 16.07 3.16 15.93Q4.3 15.02 5.66 13.16Q7.03 11.3 7.65 9.68Q5.61 10.05 5.12 10.05Q4.63 10.05 4.29 9.9Q3.95 9.76 3.95 9.59Q3.95 9.43 4.44 9.39Q5.28 9.35 7.96 8.69Q7.98 6.28 7.92 5.46Q7.85 4.64 7.65 4.34Q7.44 4.04 7.44 3.83Q7.44 3.63 7.69 3.63Q7.94 3.63 8.67 3.95Q9.4 4.27 9.4 4.57Q9.4 4.68 9.34 4.88Q8.95 5.97 8.74 8.48ZM12.55 7.87Q14.19 7.29 14.45 7.29Q14.71 7.29 14.86 7.38Q15.01 7.47 15.01 7.64Q15.01 7.93 14.31 8.15Q13.61 8.38 13.22 8.38Q12.83 8.38 12.52 8.32Q12.46 9.24 12.4 10.79Q12.96 10.44 13.65 10.17Q14.33 9.9 14.51 9.9Q14.68 9.9 14.68 10Q14.68 10.11 14.46 10.25Q12.5 11.57 12.01 12.08Q11.52 12.6 11.34 12.6Q11.17 12.6 11.03 12.32Q10.9 12.04 10.9 11.86Q10.9 11.4 11.27 11.05Q11.52 10.81 11.6 10.2Q11.68 9.59 11.68 8.51Q11.68 7.43 11.56 6.88Q11.43 6.32 11.27 6.1Q11.11 5.87 11.11 5.67Q11.11 5.48 11.36 5.48Q11.62 5.48 12.2 5.8Q12.77 6.12 12.77 6.49Q12.77 6.61 12.7 6.79Q12.63 6.96 12.55 7.87ZM13.72 13.97Q15.12 13.73 15.6 13.59Q16.08 13.46 16.4 13.31Q16.72 13.15 16.99 13.15Q17.26 13.15 17.9 13.5Q18.55 13.85 18.55 14.18Q18.55 14.32 18.39 14.65Q18.22 14.98 18.22 15.62L18.26 16.79Q18.26 19.16 17.74 19.82Q17.21 20.48 17 20.48Q16.78 20.48 16.65 20.09Q16.52 19.71 16.4 19.2Q16.29 18.69 16.25 18.58Q16.21 18.48 15.82 18.48Q15.43 18.48 14.49 18.56Q13.55 18.64 13.32 18.64Q13.08 18.64 12.92 18.62Q12.94 19.22 12.82 19.52Q12.71 19.82 12.51 19.82Q12.32 19.82 12.12 19.37Q11.93 18.93 11.97 18.52Q12.01 18.11 12.01 17.39Q12.01 16.67 11.87 15.73Q11.72 14.8 11.54 14.56Q11.35 14.32 11.35 14.17Q11.35 14.02 11.7 14.02Q12.05 14.02 12.52 14.18Q12.69 14.14 13.02 14.1Q13.72 13.15 13.72 12.58Q13.72 12.41 13.69 12.28Q13.66 12.14 13.66 12.06Q13.66 11.77 14.03 11.77Q14.4 11.77 14.85 11.94Q15.3 12.1 15.3 12.29Q15.3 12.47 15.1 12.64Q14.62 13.01 13.72 13.97ZM12.89 18.25Q14.91 17.76 15.38 17.76Q15.86 17.76 16.06 17.87Q16.27 17.99 16.47 18.21Q16.68 18.44 16.78 18.44Q16.89 18.44 16.94 18.35Q16.99 18.25 17.04 17.68Q17.09 17.1 17.09 16.37Q17.09 15.64 17.01 14.98Q16.93 14.32 16.8 14.21Q16.68 14.1 16.29 14.1Q15.9 14.1 14.66 14.3L12.79 14.57Q12.79 15.04 12.83 16.11Q13.57 16.03 14.33 15.79Q15.1 15.54 15.43 15.54Q15.75 15.54 15.98 15.64Q16.21 15.74 16.21 15.91Q16.21 16.07 16.04 16.17Q15.88 16.26 15.02 16.41Q14.17 16.57 13.67 16.57Q13.16 16.57 12.85 16.51Q12.89 17.7 12.89 18.25ZM8.84 11.81Q9.32 11.81 9.86 12.15Q10.41 12.49 10.41 13.13Q10.41 13.36 10.3 13.5Q10.2 13.65 10.06 13.65Q9.73 13.65 9.16 12.93Q8.6 12.21 8.6 12.01Q8.6 11.81 8.84 11.81Z"
                  fill="currentColor"
                />
              </svg>
              <!-- 行书规制：华文行楷「行」书法单字 -->
              <svg v-else-if="style.id === 'running'" viewBox="0 0 24 24" class="format-icon">
                <path
                  d="M7.66 7.35Q7.1 7.46 6.64 7.7Q6.18 7.94 5.9 7.94Q5.63 7.94 5.56 7.44Q5.49 6.94 5.49 6.46Q5.49 5.98 5.69 5.6Q5.89 5.22 6.18 5.2Q6.79 5.15 7.52 4.6Q8.26 4.06 8.26 3.21Q8.26 2.81 8.59 2.81Q9.39 2.81 10.16 3.54Q10.92 4.27 10.92 5.11Q10.92 5.95 10.31 5.98Q9.29 6.05 8.68 6.61Q9.93 7.98 9.93 9.02Q9.93 9.5 9.58 9.72Q9.22 9.94 8.96 10.2Q8.7 10.46 7.95 11.41Q7.97 12.31 7.97 12.83Q7.97 13.35 7.88 13.7Q7.48 15.28 7.48 16.16Q7.48 16.35 7.56 16.5Q7.64 16.65 7.72 16.65Q7.81 16.65 7.83 16.42Q8.35 13.37 8.63 13.37Q8.7 13.37 8.7 13.5Q8.7 13.63 8.55 14.3Q8.4 14.98 8.4 15.43L8.44 15.97Q8.44 16.82 8.27 17.72Q8.09 18.62 8.11 18.84Q8.14 19.06 8.14 19.25Q8.14 19.87 7.81 19.87Q7.48 19.87 6.96 18.88Q6.44 17.88 6.44 16.77Q6.44 16.49 6.48 16.23Q6.7 14.95 6.77 12.8Q4.78 14.91 3.97 15.25Q3.15 15.59 2.95 15.59Q2.75 15.59 2.75 15.31Q2.75 15.02 2.87 14.43Q2.99 13.84 3.21 13.48Q3.44 13.11 3.6 13.11Q3.67 13.11 3.67 13.31Q3.67 13.51 3.72 13.51Q3.88 13.51 4.79 12.5Q5.7 11.48 6.25 10.78Q6.79 10.09 7.39 9.2Q8 8.31 8 7.94Q8 7.56 7.66 7.35ZM13.83 9.47Q17.73 8.05 19.15 8.05Q20.14 8.05 20.69 8.68Q21.25 9.31 21.25 9.71Q21.25 10.28 20.19 10.28L17.82 10.2Q17.42 10.2 16.93 10.23Q17.23 10.39 17.34 10.54Q17.45 10.68 17.45 11.03L17.4 12.17Q17.35 12.83 17.35 14.17Q17.35 15.52 17.41 16.9Q17.47 18.28 17.47 18.47Q17.47 19.56 17.19 20.06Q16.9 20.55 16.67 20.87Q16.43 21.19 16.23 21.19Q16.03 21.19 15.5 20.79Q14.97 20.39 13.7 19.25Q12.44 18.12 12.01 17.68Q11.59 17.25 11.59 17.19Q11.59 17.13 11.63 17.13Q11.7 17.13 11.94 17.29Q12.72 17.77 13.52 18.04Q14.33 18.31 14.82 18.31Q15.84 18.31 15.84 17.29Q15.84 17.08 15.72 14.97Q15.6 12.85 15.6 11.98Q15.6 11.6 15.33 11.44Q15.06 11.29 14.02 11.08Q11.94 12.47 11.16 12.47Q10.38 12.47 10.38 11.13Q10.38 10.09 11.21 9.9Q11.63 9.8 12.56 8.99Q13.48 8.17 14.68 6.71Q14.14 6.05 13.83 5.76Q13.52 5.48 13.26 5.48Q13 5.48 12.57 5.83Q12.13 6.19 12.06 6.19Q11.99 6.19 11.99 6.14Q11.99 6 12.6 5.27Q13.22 4.53 13.38 4.44Q13.55 4.34 13.8 4.37Q14.04 4.39 14.35 4.39Q14.66 4.39 15.14 4.13Q15.63 3.87 16.15 3.87Q16.67 3.87 17.16 4.3Q17.66 4.72 17.66 5.11Q17.66 5.5 17.09 6.05Q13.95 9.09 13.83 9.47Z"
                  fill="currentColor"
                />
              </svg>
              <!-- 草书规制：明万历《草韵辨体》「草」书法单字 -->
              <svg v-else viewBox="0 0 24 24" class="format-icon">
                <path
                  d="M13.53 3 13.2 3.24H12.87L12.73 3.33H12.49L12.26 3.57L12.31 3.71H12.49L12.64 3.61H13.06L13.25 3.75V3.85L13.2 3.9V4.27L13.01 4.46L12.82 4.88L12.45 5.17L12.31 5.5L12.07 5.83L11.74 6.11L11.27 6.39L11.08 6.58L10.94 6.63L10.89 6.77L10.66 7.05L10 7.34L9.57 7.81L9.48 8.04L9.29 8.23L9.01 8.32L8.68 8.56L8.63 8.7L8.68 8.89L8.77 8.94L9.01 8.89L9.43 8.51L9.62 8.42L10.04 7.99L10.61 7.66L11.03 7.24L11.41 7.01L11.74 6.91L11.98 6.72L12.16 6.68L12.4 6.44L12.73 6.35L12.82 6.25L13.44 5.97L13.72 5.92L13.96 5.69L14.52 5.64L14.85 5.4L15.04 4.88V4.41L14.95 4.04L14.47 3.57L14.33 3.52L13.96 3.05L13.53 3ZM13.81 4.18 13.96 4.13 14.14 4.27V4.51L14.33 4.74V4.84L14.24 4.93H14.1L13.67 4.51V4.37L13.81 4.18ZM10.52 4.32 10.33 4.51 9.95 4.7 9.62 5.07 9.2 5.17 9.05 5.36 9.01 5.59 8.82 5.78H8.68L8.44 5.97L7.88 5.83L7.64 5.64L7.31 5.59L7.22 5.5L7.03 5.07L6.7 4.93L6.56 4.98L6.42 5.21V5.36L6.65 5.73L6.6 6.39L6.84 6.86L7.12 7.15L7.36 7.24L7.59 7.43H8.11L8.25 7.19L8.96 6.58L9.48 5.73L10.19 5.03L10.33 4.98L10.47 4.84V4.6L10.7 4.51L10.66 4.37L10.52 4.32ZM11.98 8.09 11.65 8.47 11.51 8.51V8.8L11.46 8.84H11.27L10.66 9.17L10.19 9.27L9.86 9.55L9.43 9.74H9.01L8.49 9.93H8.11L8.07 9.88L8.11 9.64L7.97 9.46H7.69L7.5 9.64V9.79L7.74 9.88L7.88 10.02L7.83 10.21L7.69 10.35V10.49L7.83 10.73L7.97 10.87L8.35 10.92L8.82 11.15H8.96L9.24 11.01L9.53 10.73L9.9 10.59L10.14 10.35L10.47 10.21L10.85 9.93H11.03L11.13 9.79H11.41L11.51 9.41L11.84 9.69V9.79L11.6 9.93L11.65 9.97L11.6 10.07L11.32 10.4H11.22L11.13 10.26H11.03L10.8 10.54V10.73L10.66 10.82L10.61 11.06L10.47 11.25L10.37 11.53L10.14 11.76L9.9 12.19V12.28L9.57 12.61L9.48 13.04L9.53 13.18L9.95 13.51L10.14 13.6H10.33L10.56 13.79L11.03 14.03L11.27 14.07L11.51 14.31L11.74 14.36L12.02 14.17H12.16L12.26 14.26V14.54L12.16 14.69L12.12 14.97L11.88 15.16H11.74L11.51 15.3H11.22L10.75 15.49L10.23 15.86L9.67 16.1L9.2 16.52L8.73 16.76L8.54 16.99V17.09L8.4 17.32L8.35 17.47L8.4 17.75L8.02 18.17L8.07 18.55L8.21 18.83L8.54 19.21L8.68 19.49L9.53 20.34L10 20.58H10.09L10.42 20.81H10.56L10.85 21H11.22L11.32 20.95L11.46 20.72L11.98 20.39L12.21 20.15L12.35 20.1L12.59 19.82L12.73 19.77L13.2 19.16L13.25 18.93L13.34 18.79V18.5L13.48 18.22L13.44 18.17V17.98L13.58 17.84L13.63 17.47L13.77 17.23L13.72 16.29L13.67 16.15L13.53 16.29L13.44 16.19L13.39 16.05L13.48 15.96L13.63 16.01L13.81 15.82H14.43L14.47 15.77H14.95L14.99 15.82L15.42 15.77L15.6 15.86L16.22 15.82L16.83 15.96L16.97 15.91L17.16 15.68L17.25 15.63L17.4 15.68L17.54 15.63L17.58 15.53V15.25L17.44 15.06L17.21 14.97L16.83 15.02L16.59 14.73L16.41 14.64H16.03L15.51 14.21H15.13L14.95 14.4L14.62 14.45L14.19 14.64H13.72L13.67 14.69L13.72 14.78L13.44 14.97L13.48 15.16L13.34 15.35L13.3 15.39H13.06L12.87 15.2V15.11L13.3 14.92V14.69L12.97 14.31V14.12L12.87 14.03V13.65L12.73 13.55H12.35L11.93 13.37H11.79L11.69 13.46L11.46 13.23L11.22 13.18L10.99 13.04H10.89L10.8 12.94L10.75 12.52L10.85 12.38L11.08 12.14L11.27 12.05L12.02 11.2L12.4 11.01L12.45 10.82L12.82 10.49L13.01 10.07L13.2 9.88L13.3 9.5L13.48 9.27V8.98L13.39 8.89V8.7L13.3 8.61L12.92 8.51L12.59 8.23H12.49L12.26 8.09H11.98ZM12.16 8.51 12.21 8.47H12.4L12.59 8.65L12.45 8.8H11.93L11.88 8.75L12.16 8.51ZM11.6 8.8 11.69 8.75 11.74 8.89 11.55 8.94 11.51 8.84 11.6 8.8ZM12.68 9.08 12.73 9.03 12.87 9.08 12.78 9.22 12.64 9.17 12.68 9.08ZM11.93 9.22 11.98 9.17 12.07 9.22 12.02 9.27 11.93 9.22ZM12.12 9.22 12.16 9.17 12.54 9.22 12.64 9.31 12.73 9.64 12.87 9.88 12.68 9.93 12.35 9.64 12.02 9.69 11.93 9.6 12.02 9.46V9.27L12.12 9.22ZM10.8 9.46 10.89 9.41 10.94 9.5 10.85 9.55 10.8 9.46ZM11.13 10.02V10.12L11.27 10.07V10.02H11.13ZM11.18 10.54 11.22 10.49H11.46L11.65 10.63L11.69 10.77L11.51 11.01L11.08 11.2L11.03 11.29L11.08 11.43L10.99 11.48L10.8 10.77L11.18 10.54ZM12.45 13.93 12.59 13.88 12.68 14.03 12.59 14.26H12.49L12.31 14.12L12.45 13.93ZM12.49 14.54 12.54 14.5 12.59 14.54V14.73L12.54 14.78L12.45 14.69L12.49 14.54ZM11.93 16.05 11.98 16.01H12.4L12.49 16.05L12.64 16.24V16.66L12.49 16.85V17.18L12.21 17.7V18.08L11.93 18.69L11.79 18.83L11.74 19.07L11.65 19.21L11.32 19.54L11.13 19.59L11.08 19.73L10.89 19.87L10.42 19.82L9.34 19.4L8.82 18.83L8.73 18.64V18.22L8.68 18.17V17.8L8.63 17.75L8.68 17.56L9.15 17.14L9.34 17.09L9.81 16.76H9.9L10.61 16.43L10.99 16.38L11.46 16.19H11.69L11.93 16.05ZM13.15 16.19 13.25 16.15 13.34 16.24 13.3 16.38 13.2 16.48H13.06L12.97 16.57H12.87L12.78 16.48L13.15 16.19ZM12.78 17.75 12.82 17.7H13.01L13.15 17.8V17.94L13.06 18.03H12.82L12.78 18.22L12.68 18.27L12.64 18.22V17.89L12.78 17.75ZM12.26 18.79 12.4 18.74 12.49 18.83V18.93L12.4 19.02L12.31 18.97L12.26 18.79ZM12.26 19.21 12.31 19.16 12.45 19.21 12.35 19.3 12.26 19.21Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span class="script-style__info">
              <span class="script-style__title-row">
                <span class="script-style__name">{{ style.name }}</span>
                <span class="script-style__tag">竖排专享</span>
              </span>
              <span class="script-style__span">{{ style.suitedFonts }}</span>
            </span>
          </button>

          <button
            type="button"
            class="script-style__info-btn"
            :aria-label="`查看 ${style.name} 学术考据`"
            title="查看书体规制文献与善本法帖"
            @click.stop="openFormatModal('script-style', style.id)"
          >
            <Info :size="15" />
          </button>
        </div>
      </div>
    </fieldset>

    <!-- 时代标点与句读演化（五大时代标点体系 + ℹ 学术考据弹窗） -->
    <fieldset class="punctuation-era">
      <legend class="punctuation-era__legend">时代标点 · 句读演化</legend>
      <div class="punctuation-era__list">
        <div
          v-for="style in punctuationStyles"
          :key="style.id"
          class="punctuation-era__item"
          :class="{ 'is-active': props.punctuationStyle === style.id }"
        >
          <button
            type="button"
            class="punctuation-era__main-btn"
            :aria-pressed="props.punctuationStyle === style.id"
            @click="selectPunctuationStyle(style.id)"
          >
            <span class="punctuation-era__symbol" aria-hidden="true">
              <!-- 先秦两汉：折笔墨钩与墨点 -->
              <svg v-if="style.id === 'pre-qin'" viewBox="0 0 24 24" class="era-icon era-icon--pre-qin">
                <path d="M 6 4 L 6 15 C 6 17.5 7.5 19 11 19 C 14 19 16 18 17.5 16.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="17" cy="8" r="2.2" fill="currentColor" />
              </svg>
              <!-- 魏晋隋唐：手书朱圈与朱撇 -->
              <svg v-else-if="style.id === 'wei-jin'" viewBox="0 0 24 24" class="era-icon era-icon--wei-jin">
                <circle cx="9" cy="9" r="5" fill="none" stroke="#b83625" stroke-width="2.2" />
                <path d="M 14 14 C 16 16 17.5 18 19 19.5 C 20 18.5 19 16.5 16.5 14.5 Z" fill="#b83625" />
              </svg>
              <!-- 宋元雕版：细铁线墨圈与木刻角点 -->
              <svg v-else-if="style.id === 'song-yuan'" viewBox="0 0 24 24" class="era-icon era-icon--song-yuan">
                <circle cx="9" cy="9" r="4.8" fill="none" stroke="currentColor" stroke-width="1.3" />
                <polygon points="14,19 19,19 19,14" fill="currentColor" />
              </svg>
              <!-- 明清刻本：万历朱圈与朱砂圆点 -->
              <svg v-else-if="style.id === 'ming-qing'" viewBox="0 0 24 24" class="era-icon era-icon--ming-qing">
                <circle cx="9" cy="9" r="5.2" fill="none" stroke="#b83625" stroke-width="2" />
                <circle cx="17" cy="16" r="2.4" fill="#b83625" />
              </svg>
              <!-- 近代现代：现代全角句读规整符号 -->
              <svg v-else viewBox="0 0 24 24" class="era-icon era-icon--modern">
                <circle cx="8" cy="14" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6" />
                <path d="M 17 12 C 17.8 12 18.5 12.7 18.5 13.5 C 18.5 15.5 16.5 17.5 15 18 C 15.2 16.8 16 15.8 16 15 C 16 14.8 15.8 14.2 15.5 14 C 15.5 13 16.2 12 17 12 Z" fill="currentColor" />
              </svg>
            </span>
            <span class="punctuation-era__info">
              <span class="punctuation-era__title-row">
                <span class="punctuation-era__name">{{ style.name }}</span>
                <span v-if="style.id !== 'modern'" class="punctuation-era__tag">竖排专享</span>
              </span>
              <span class="punctuation-era__span">{{ style.eraSpan }}</span>
            </span>
          </button>

          <button
            type="button"
            class="punctuation-era__info-btn"
            :aria-label="`查看 ${style.name} 学术考据`"
            title="查看文献依据与考古文物"
            @click.stop="openPunctModal(style.id)"
          >
            <Info :size="15" />
          </button>
        </div>
      </div>
    </fieldset>

    <!-- 宣纸古笺底色盘 -->
    <fieldset class="paper-palette">
      <legend class="paper-palette__legend">宣纸古笺 · 底色</legend>
      <div class="paper-palette__grid">
        <button
          v-for="paper in paperThemes"
          :key="paper.id"
          type="button"
          class="paper-palette__item"
          :class="{ 'is-active': props.paperTheme === paper.id }"
          :aria-pressed="props.paperTheme === paper.id"
          :title="`${paper.name} (${paper.labelEn}) - ${paper.description}`"
          @click="emit('update:paperTheme', paper.id)"
        >
          <span
            class="paper-palette__swatch"
            :style="{ backgroundColor: paper.color, borderColor: paper.borderColor }"
          />
          <span class="paper-palette__meta">
            <span class="paper-palette__name">{{ paper.name }}</span>
            <span class="paper-palette__en">{{ paper.labelEn }}</span>
          </span>
        </button>
      </div>
    </fieldset>

    <!-- 排版微调滑块：竖排模式下依古籍固定规制，仅保留字号调节 -->
    <div v-for="control in activeControls" :key="control.key" class="control">
      <div class="control__head">
        <label :for="`ctrl-${control.key}`" class="control__label">{{ control.label }}</label>
        <output :for="`ctrl-${control.key}`" class="control__value">
          {{ control.format(control.value) }}
        </output>
      </div>

      <SliderRoot
        :id="`ctrl-${control.key}`"
        class="slider"
        :model-value="[control.value]"
        :min="control.min"
        :max="control.max"
        :step="control.step"
        :aria-label="control.label"
        @update:model-value="(v) => onSlide(control.key, v as number[])"
      >
        <SliderTrack class="slider__track">
          <SliderRange class="slider__range" />
        </SliderTrack>
        <SliderThumb class="slider__thumb" />
      </SliderRoot>
    </div>

    <template #footer>
      <button type="button" class="reset" @click="resetAll">恢复默认排版</button>
    </template>
  </StudioPanel>

  <!-- 标点学术考据弹窗 -->
  <PunctuationInfoModal
    :open="punctModalOpen"
    :style-id="selectedPunctId"
    @update:open="(v) => (punctModalOpen = v)"
  />

  <!-- 时代装帧与书体规制学术考据弹窗 -->
  <FormatInfoModal
    :open="formatModalOpen"
    :mode="formatModalMode"
    :target-id="formatModalTargetId"
    @update:open="(v) => (formatModalOpen = v)"
  />
</template>

<style scoped lang="scss">
.control {
  & + & {
    margin-top: 26px;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__label {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__value {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    font-variant-numeric: tabular-nums;
    color: var(--zz-accent);
  }
}

.direction {
  padding: 0;
  border: 0;
  margin: 0 0 28px;

  &__legend {
    margin-bottom: 11px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__button {
    min-height: 42px;
    border: 1px solid var(--zz-line);
    border-radius: var(--zz-radius-sm);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-muted);
    transition:
      border-color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      border-color: var(--zz-line-strong);
      color: var(--zz-ink-soft);
    }

    &.is-active {
      border-color: var(--zz-accent);
      background: var(--zz-accent-wash);
      color: var(--zz-accent);
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 2px;
    }
  }
}

/* 时代装帧与书体规制统一选择器样式 */
.era-format,
.script-style,
.punctuation-era {
  padding: 0;
  border: 0;
  margin: 0 0 28px;

  &__legend {
    margin-bottom: 12px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    border: 1px solid var(--zz-line);
    border-radius: var(--zz-radius-sm);
    background: var(--zz-paper-ui);
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    transition:
      border-color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      box-shadow var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      border-color: var(--zz-line-strong);
    }

    &.is-active {
      border-color: var(--zz-accent);
      background: var(--zz-accent-wash);
      box-shadow: 0 0 0 1px var(--zz-accent);

      .era-format__name,
      .script-style__name,
      .punctuation-era__name {
        color: var(--zz-accent);
      }

      .era-format__symbol,
      .script-style__symbol,
      .punctuation-era__symbol {
        color: var(--zz-accent);
        border-color: rgba(184, 54, 37, 0.3);
      }
    }
  }

  &__main-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    min-width: 0;
  }

  &__symbol {
    flex: none;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    background: rgba(92, 64, 51, 0.05);
    border: 1px solid rgba(92, 64, 51, 0.12);
    color: var(--zz-ink);
    overflow: hidden;
    padding: 2px;
    box-sizing: border-box;

    .format-icon,
    .era-icon {
      width: 22px;
      height: 22px;
      display: block;
      flex: none;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    font-weight: 500;
    line-height: 1.4;
    color: var(--zz-ink-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tag {
    flex: none;
    font-size: 10px;
    line-height: 1;
    padding: 2px 5px;
    border-radius: 2px;
    background: rgba(184, 54, 37, 0.1);
    color: var(--zz-accent);
    letter-spacing: 0.04em;
    font-weight: 500;
  }

  &__span {
    font-size: var(--zz-text-2xs);
    line-height: 1.4;
    color: var(--zz-muted);
    letter-spacing: var(--zz-track-tight);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__info-btn {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 6px;
    border: none;
    background: transparent;
    border-radius: var(--zz-radius-sm);
    color: var(--zz-muted);
    cursor: pointer;
    transition:
      color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      color: var(--zz-accent);
      background: rgba(184, 54, 37, 0.08);
    }
  }
}

.paper-palette {
  padding: 0;
  border: 0;
  margin: 0 0 28px;

  &__legend {
    margin-bottom: 12px;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid var(--zz-line);
    border-radius: var(--zz-radius-sm);
    background: var(--zz-paper-ui);
    text-align: left;
    cursor: pointer;
    min-width: 0;
    box-sizing: border-box;
    transition:
      border-color var(--zz-dur-fast) var(--zz-ease-out),
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      box-shadow var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      border-color: var(--zz-line-strong);
    }

    &.is-active {
      border-color: var(--zz-accent);
      background: var(--zz-accent-wash);
      box-shadow: 0 0 0 1px var(--zz-accent);
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 2px;
    }
  }

  &__swatch {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xs);
    line-height: 1.4;
    color: var(--zz-ink-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__en {
    font-family: var(--zz-font-sans);
    font-size: 10px;
    line-height: 1.3;
    color: var(--zz-muted);
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  width: 100%;
  height: 20px;

  &__track {
    position: relative;
    flex-grow: 1;
    height: 2px;
    background: var(--zz-line);
    border-radius: 1px;
  }

  &__range {
    position: absolute;
    height: 100%;
    background: var(--zz-accent);
    border-radius: 1px;
  }

  &__thumb {
    display: block;
    width: 14px;
    height: 14px;
    background: var(--zz-paper-elevated);
    border: 1.5px solid var(--zz-accent);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgb(44 37 30 / 12%);
    transition:
      transform var(--zz-dur-fast) var(--zz-ease-out),
      box-shadow var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      transform: scale(1.15);
      box-shadow: 0 2px 6px rgb(44 37 30 / 20%);
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 2px;
    }
  }
}

.reset {
  padding: 8px 14px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
  background: transparent;
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-xs);
  letter-spacing: var(--zz-track-normal);
  color: var(--zz-muted);
  cursor: pointer;
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
    color: var(--zz-ink);
  }

  &:focus-visible {
    outline: var(--zz-focus-ring);
    outline-offset: 2px;
  }
}
</style>
