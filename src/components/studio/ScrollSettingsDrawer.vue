<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SlidersHorizontal } from 'lucide-vue-next'
import { fonts } from '@/data/fonts'
import { paperThemes, type PaperThemeId } from '@/data/paperThemes'
import type { CharVariant } from '@/types/reading'
import StudioPanel from './StudioPanel.vue'

const props = withDefaults(
  defineProps<{
    title: string
    paperTheme: PaperThemeId
    fontId: string
    fontSize: number
    charVariant?: CharVariant
  }>(),
  {
    charVariant: 'traditional',
  },
)

const emit = defineEmits<{
  (e: 'select-text'): void
  (e: 'update:paperTheme', value: PaperThemeId): void
  (e: 'update:fontId', value: string): void
  (e: 'update:fontSize', value: number): void
  (e: 'update:charVariant', value: CharVariant): void
}>()

const open = ref(false)
const hasReadingActions = ref(false)

onMounted(() => {
  hasReadingActions.value = !!document.getElementById('reading-actions')
})

function handleSelectText() {
  open.value = false
  emit('select-text')
}

function handleSizeInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(val)) {
    emit('update:fontSize', Math.min(70, Math.max(40, val)))
  }
}
</script>

<template>
  <div class="scroll-settings-wrapper">
    <Teleport to="#reading-actions" :disabled="!hasReadingActions">
      <button
        type="button"
        class="scroll-settings-btn"
        aria-label="卷轴设置"
        :aria-expanded="open"
        @click="open = true"
      >
        <SlidersHorizontal :size="13" class="scroll-settings-btn__icon" aria-hidden="true" />
        <span class="scroll-settings-btn__text">卷轴设置</span>
      </button>
    </Teleport>

    <StudioPanel
      :open="open"
      title="卷轴设置"
      width="min(460px, 100vw)"
      @update:open="(v) => (open = v)"
    >
      <div class="scroll-drawer-content">
        <!-- 1. 字号设置 -->
        <section class="drawer-section">
          <div class="drawer-section__header">
            <label for="scroll-size-range" class="drawer-section__title">字号设置</label>
            <span class="font-size-badge">{{ fontSize }} px</span>
          </div>
          <div class="size-control-box">
            <input
              id="scroll-size-range"
              type="range"
              min="40"
              max="70"
              step="1"
              :value="fontSize"
              class="size-slider"
              aria-label="字号"
              @input="handleSizeInput"
            />
            <div class="size-range-limits">
              <span>小字 (40px)</span>
              <span>大字 (70px)</span>
            </div>
          </div>
        </section>

        <!-- 2. 字式规范 -->
        <section class="drawer-section">
          <h3 class="drawer-section__title">字式规范</h3>
          <div class="variant-toggle-box" role="radiogroup" aria-label="字式规范">
            <button
              type="button"
              class="variant-toggle-btn"
              :class="{ 'is-active': (props.charVariant ?? 'traditional') === 'traditional' }"
              :aria-checked="(props.charVariant ?? 'traditional') === 'traditional'"
              role="radio"
              @click="emit('update:charVariant', 'traditional')"
            >
              繁体正字
            </button>
            <button
              type="button"
              class="variant-toggle-btn"
              :class="{ 'is-active': props.charVariant === 'simplified' }"
              :aria-checked="props.charVariant === 'simplified'"
              role="radio"
              @click="emit('update:charVariant', 'simplified')"
            >
              通行简体
            </button>
          </div>
        </section>

        <!-- 3. 当前篇目 -->
        <section class="drawer-section">
          <h3 class="drawer-section__title">古文篇目</h3>
          <div class="text-preview-card">
            <div class="text-preview-card__meta">
              <span class="text-preview-card__label">当前卷目</span>
              <span class="text-preview-card__title">{{ title }}</span>
            </div>
            <button
              type="button"
              class="scroll-settings-text-btn"
              aria-label="选择文章"
              @click="handleSelectText"
            >
              <span>更换文章</span>
              <span class="text-btn__arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </section>

        <!-- 3. 宣纸古笺 · 底色罗列 -->
        <section class="drawer-section">
          <div class="drawer-section__header">
            <h3 class="drawer-section__title">宣纸底色</h3>
            <span class="drawer-section__count">{{ paperThemes.length }} 款纸色</span>
          </div>
          <div class="paper-palette__grid" role="radiogroup" aria-label="背景色选择">
            <button
              v-for="paper in paperThemes"
              :key="paper.id"
              type="button"
              class="paper-palette__item"
              :data-paper-id="paper.id"
              :class="{ 'is-active': paperTheme === paper.id }"
              :aria-pressed="paperTheme === paper.id"
              :aria-label="`背景色：${paper.name}`"
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
        </section>

        <!-- 4. 择字 · 字体鉴赏 -->
        <section class="drawer-section">
          <div class="drawer-section__header">
            <h3 class="drawer-section__title">字体风格</h3>
            <span class="drawer-section__count">{{ fonts.length }} 款书法字形</span>
          </div>
          <div class="font-list" role="radiogroup" aria-label="字体选择">
            <button
              v-for="font in fonts"
              :key="font.id"
              type="button"
              class="font-card"
              :data-font-id="font.id"
              :class="{ 'is-active': font.id === fontId }"
              :aria-pressed="font.id === fontId"
              :aria-label="`字体：${font.name}`"
              @click="emit('update:fontId', font.id)"
            >
              <span class="font-card__main">
                <span class="font-card__name">{{ font.name }}</span>
                <span class="font-card__tags">{{ font.tags.join(' · ') }}</span>
              </span>
              <span
                class="font-card__sample"
                :style="{ fontFamily: font.family }"
                aria-hidden="true"
              >
                {{ font.sample }}
              </span>
            </button>
          </div>
        </section>
      </div>
    </StudioPanel>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.scroll-settings-wrapper {
  display: contents;
}

.scroll-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  background: color-mix(in srgb, var(--zz-paper-ui) 86%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  font-family: var(--zz-font-serif);
  font-size: 13px;
  color: var(--zz-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--zz-dur-fast) var(--zz-ease-out);

  &__icon {
    opacity: 0.8;
    flex: none;
    transition: opacity var(--zz-dur-fast) var(--zz-ease-out);
  }

  &__text {
    line-height: 1;
    letter-spacing: 0.04em;
  }

  &:hover {
    color: var(--zz-ink);
    border-color: var(--zz-line-strong);
    background: var(--zz-paper-ui);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .scroll-settings-btn__icon {
      opacity: 1;
      color: var(--zz-accent);
    }
  }

  &[aria-expanded='true'] {
    color: var(--zz-ink);
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);

    .scroll-settings-btn__icon {
      opacity: 1;
      color: var(--zz-accent);
    }
  }
}

.scroll-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
    margin: 0;
  }

  &__count {
    font-size: var(--zz-text-2xs);
    color: var(--zz-muted);
    letter-spacing: 0.02em;
  }
}

/* 1. 文章预览卡片 */
.variant-toggle-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.variant-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--zz-radius-sm);
  border: 1px solid var(--zz-line-subtle);
  background: var(--zz-paper-ui);
  color: var(--zz-muted);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  cursor: pointer;
  transition: all var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    color: var(--zz-ink);
    border-color: var(--zz-line-strong);
  }

  &.is-active {
    color: var(--zz-accent);
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
    font-weight: 500;
  }
}

.text-preview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--zz-paper-raised);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__label {
    font-size: var(--zz-text-2xs);
    color: var(--zz-muted);
    letter-spacing: 0.04em;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    color: var(--zz-ink);
    font-weight: 500;
  }
}

.scroll-settings-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--zz-paper-ui);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-xs);
  font-family: var(--zz-font-serif);
  font-size: 13px;
  color: var(--zz-ink-soft);
  cursor: pointer;
  transition: all var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    color: var(--zz-accent);
    border-color: var(--zz-accent);
    background: var(--zz-accent-soft);
  }

  .text-btn__arrow {
    font-size: 11px;
    opacity: 0.8;
  }
}

/* 2. 宣纸古笺底色盘 */
.paper-palette__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.paper-palette__item {
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
}

.paper-palette__swatch {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 2px;
  border: 1px solid;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.paper-palette__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.paper-palette__name {
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  font-weight: 500;
  line-height: 1.3;
  color: var(--zz-ink-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.paper-palette__en {
  font-size: var(--zz-text-2xs);
  line-height: 1.2;
  color: var(--zz-muted);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 3. 字体列表 */
.font-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.font-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
  background: var(--zz-paper-raised);
  cursor: pointer;
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
  }

  &.is-active {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
    box-shadow: 0 0 0 1px var(--zz-accent);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__tags {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__sample {
    font-size: 20px;
    letter-spacing: 0.15em;
    color: var(--zz-ink-body);
    white-space: nowrap;
    opacity: 0.88;
  }
}

/* 4. 字号滑块 */
.size-control-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--zz-paper-raised);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
}

.font-size-badge {
  font-family: var(--zz-font-serif);
  font-size: 13px;
  font-weight: 500;
  color: var(--zz-accent);
  background: var(--zz-accent-soft);
  padding: 2px 8px;
  border-radius: 2px;
}

.size-slider {
  width: 100%;
  height: 4px;
  appearance: none;
  background: var(--zz-line-strong);
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--zz-accent);
    border: 2px solid var(--zz-paper-ui);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    cursor: grab;
    transition: transform var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      transform: scale(1.15);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--zz-accent);
    border: 2px solid var(--zz-paper-ui);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    cursor: grab;
  }
}

.size-range-limits {
  display: flex;
  justify-content: space-between;
  font-size: var(--zz-text-2xs);
  color: var(--zz-muted);
}
</style>
