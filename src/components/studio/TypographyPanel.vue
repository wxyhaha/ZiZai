<script setup lang="ts">
import { computed } from 'vue'
import { SliderRoot, SliderThumb, SliderTrack, SliderRange } from 'reka-ui'
import type { LayoutMode } from '@/types'
import StudioPanel from './StudioPanel.vue'

/** 排版参数：字号、行高、字距、版心宽度。 */

const props = defineProps<{
  open: boolean
  layout: LayoutMode
  fontSize: number
  lineHeight: number
  letterSpacing: number
  contentWidth: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:layout': [value: LayoutMode]
  'update:fontSize': [value: number]
  'update:lineHeight': [value: number]
  'update:letterSpacing': [value: number]
  'update:contentWidth': [value: number]
}>()

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
  fontSize: 19,
  lineHeight: 2.4,
  letterSpacing: 0.04,
  contentWidth: 660,
}

function resetAll() {
  for (const key of Object.keys(DEFAULTS) as Control['key'][]) {
    ;(emit as (e: string, v: number) => void)(emitMap[key], DEFAULTS[key])
  }
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="版式 · 纸上章法"
    description="选择横竖方向，再细调字号、行气与版心。改动会即时反映在书页上。"
    @update:open="(v) => emit('update:open', v)"
  >
    <fieldset class="direction">
      <legend class="direction__legend">文字方向</legend>
      <div class="direction__options">
        <button
          type="button"
          class="direction__button"
          :class="{ 'is-active': props.layout === 'horizontal' }"
          :aria-pressed="props.layout === 'horizontal'"
          @click="emit('update:layout', 'horizontal')"
        >
          横排
        </button>
        <button
          type="button"
          class="direction__button"
          :class="{ 'is-active': props.layout === 'vertical' }"
          :aria-pressed="props.layout === 'vertical'"
          @click="emit('update:layout', 'vertical')"
        >
          竖排
        </button>
      </div>
      <p class="direction__hint">竖排使用 writing-mode: vertical-rl，按传统自上而下、从右至左阅读。</p>
    </fieldset>

    <div v-for="control in controls" :key="control.key" class="control">
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

      <p class="control__hint">{{ control.hint }}</p>
    </div>

    <template #footer>
      <button type="button" class="reset" @click="resetAll">恢复默认排版</button>
    </template>
  </StudioPanel>
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

  &__hint {
    margin-top: 9px;
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
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
    grid-template-columns: repeat(2, 1fr);
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

  &__hint {
    margin-top: 9px;
    font-size: var(--zz-text-2xs);
    line-height: 1.8;
    color: var(--zz-muted);
  }
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 22px;
  touch-action: none;
  user-select: none;

  &__track {
    position: relative;
    flex: 1;
    height: 2px;
    border-radius: 1px;
    background: var(--zz-line-strong);
  }

  &__range {
    position: absolute;
    height: 100%;
    border-radius: 1px;
    background: var(--zz-accent-line);
  }

  &__thumb {
    display: block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid var(--zz-line-strong);
    background: var(--zz-paper-ui);
    box-shadow: 0 1px 2px rgb(58 47 35 / 8%);
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 3px;
    }
  }
}

.reset {
  width: 100%;
  padding: 11px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  letter-spacing: var(--zz-track-normal);
  color: var(--zz-muted);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-accent);
    color: var(--zz-accent);
  }
}
</style>
