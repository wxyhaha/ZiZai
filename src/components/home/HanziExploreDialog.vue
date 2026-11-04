<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { RotateCcw, X } from 'lucide-vue-next'
import type { FallingGlyph } from '@/composables/useFallingGlyphs'
import { getFont } from '@/data/fonts'
import { getHanziInfo, type HanziInfo } from '@/services/hanziDict'

const props = defineProps<{
  open: boolean
  glyph: FallingGlyph | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

const writerTargetRef = ref<HTMLElement | null>(null)
const dictInfo = ref<HanziInfo | null>(null)
const isLoadingDict = ref(false)
const isStrokeLoading = ref(false)
const isStrokeReady = ref(false)
const hasStrokeError = ref(false)
const isAnimating = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let writerInstance: any = null

const char = computed(() => props.glyph?.char || '')
const fontName = computed(() => {
  if (!props.glyph) return ''
  try {
    const font = getFont(props.glyph.fontId)
    return font?.name || props.glyph.fontId
  } catch {
    return props.glyph.fontId
  }
})

const originalFontStyle = computed(() => {
  if (!props.glyph) return {}
  return {
    fontFamily: `"${props.glyph.fontFamily}", "Songti SC", "SimSun", serif`,
  }
})

async function initHanziWriter(targetChar: string) {
  if (!writerTargetRef.value || !targetChar) return

  // 清理现有实例与 DOM
  if (writerInstance) {
    try {
      writerInstance.pauseAnimation()
    } catch {
      // 忽略清理异常
    }
    writerInstance = null
  }
  writerTargetRef.value.innerHTML = ''
  hasStrokeError.value = false
  isStrokeReady.value = false
  isStrokeLoading.value = true

  try {
    const { default: HanziWriter } = await import('hanzi-writer')
    if (!props.open || char.value !== targetChar || !writerTargetRef.value) return

    const boxEl = writerTargetRef.value
    const boxSize = boxEl?.clientWidth || 180

    writerInstance = HanziWriter.create(writerTargetRef.value, targetChar, {
      width: boxSize,
      height: boxSize,
      padding: Math.round(boxSize * 0.12),
      showOutline: true,
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 160,
      strokeColor: '#241e17',
      radicalColor: '#8b261d',
      outlineColor: '#dfd6c8',
      onLoadCharDataError: () => {
        hasStrokeError.value = true
        isStrokeReady.value = false
        isStrokeLoading.value = false
        if (writerTargetRef.value) {
          writerTargetRef.value.innerHTML = ''
        }
      },
      onLoadCharDataSuccess: () => {
        hasStrokeError.value = false
        isStrokeReady.value = true
        isStrokeLoading.value = false
        replayAnimation()
      },
    })
  } catch {
    hasStrokeError.value = true
    isStrokeReady.value = false
    isStrokeLoading.value = false
    if (writerTargetRef.value) {
      writerTargetRef.value.innerHTML = ''
    }
  }
}

function replayAnimation() {
  if (!writerInstance || hasStrokeError.value) return
  isAnimating.value = true
  writerInstance.animateCharacter({
    onComplete: () => {
      isAnimating.value = false
    },
  })
}

watch(
  () => [props.open, props.glyph?.char],
  async ([isOpen, targetChar]) => {
    if (isOpen && targetChar) {
      isLoadingDict.value = true
      dictInfo.value = null
      getHanziInfo(targetChar as string).then((info) => {
        if (char.value === targetChar) {
          dictInfo.value = info
          isLoadingDict.value = false
        }
      })

      await nextTick()
      initHanziWriter(targetChar as string)
    } else {
      if (writerInstance) {
        try {
          writerInstance.pauseAnimation()
        } catch {
          // 忽略清理异常
        }
        writerInstance = null
      }
    }
  },
  { immediate: true },
)

function handleOpenChange(val: boolean) {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay class="hanzi-explore-overlay" />
      <DialogContent
        class="hanzi-explore-panel"
        :aria-describedby="undefined"
        @close-auto-focus.prevent
      >
        <!-- 弹窗页头 -->
        <header class="hanzi-explore-header">
          <div class="hanzi-explore-header__title-box">
            <DialogTitle class="hanzi-explore-header__title">
              汉字探索 <span v-if="char" class="hanzi-explore-header__char">· {{ char }}</span>
            </DialogTitle>
          </div>
          <DialogClose class="hanzi-explore-header__close" aria-label="关闭探索弹窗">
            <X :size="16" aria-hidden="true" />
          </DialogClose>
        </header>

        <DialogDescription class="zz-sr-only">
          汉字「{{ char }}」原字体展示、规范楷书笔顺动画与开源字典释义
        </DialogDescription>

        <div v-if="glyph" class="hanzi-explore-body">
          <!-- 双栏对照：原字体 vs 楷书笔顺 -->
          <div class="hanzi-explore-cards">
            <!-- 左栏：原字体字形（去掉了微标与底部说明，字形放大到与楷书一致） -->
            <div class="hanzi-card hanzi-card--original">
              <div class="hanzi-card__header">
                <span class="hanzi-card__font-name">{{ fontName }}</span>
              </div>
              <div class="hanzi-card__display">
                <span class="hanzi-card__glyph" :style="originalFontStyle">
                  {{ char }}
                </span>
              </div>
              <div class="hanzi-card__footer" aria-hidden="true" />
            </div>

            <!-- 右栏：Hanzi Writer 楷书笔顺动画（田字格背景） -->
            <div class="hanzi-card hanzi-card--strokes">
              <div class="hanzi-card__header">
                <span class="hanzi-card__font-name">标准楷书</span>
              </div>
              <div class="hanzi-card__display">
                <!-- 田字格标准容器（恒定居中） -->
                <div class="hanzi-tian-grid">
                  <!-- 动态笔顺挂载点（加载就绪后渐显并播放动画） -->
                  <div
                    ref="writerTargetRef"
                    class="hanzi-writer-box"
                    :class="{ 'hanzi-writer-box--ready': isStrokeReady }"
                  />

                  <!-- 当笔顺尚未就绪或缺少笔顺时：在田字格正中直接以 118px 呈现静态标准楷书 -->
                  <span
                    v-if="!isStrokeReady"
                    class="hanzi-card__fallback-glyph"
                    :aria-label="`标准楷书 ${char}`"
                  >
                    {{ char }}
                  </span>
                </div>
              </div>
              <div class="hanzi-card__footer">
                <button
                  v-if="!hasStrokeError"
                  type="button"
                  class="hanzi-replay-btn"
                  :disabled="isStrokeLoading"
                  aria-label="重新播放笔顺动画"
                  @click="replayAnimation"
                >
                  <RotateCcw :size="12" class="hanzi-replay-btn__icon" aria-hidden="true" />
                  <span>{{ isStrokeLoading ? '笔顺载入中' : '重新播放' }}</span>
                </button>
                <span v-else class="hanzi-card__no-stroke-tag">
                  暂无楷书笔顺数据
                </span>
              </div>
            </div>
          </div>

          <!-- 下方：汉字基本属性与释义（字号放大，清晰雅致） -->
          <div class="hanzi-meta-section">
            <div class="hanzi-meta-row">
              <div class="hanzi-meta-item">
                <span class="hanzi-meta-item__label">拼音</span>
                <span
                  class="hanzi-meta-item__val"
                  :class="{
                    'hanzi-meta-item__val--pinyin': Boolean(dictInfo?.pinyin),
                    'hanzi-meta-item__val--empty': !dictInfo?.pinyin,
                  }"
                >
                  {{ dictInfo?.pinyin || '—' }}
                </span>
              </div>
              <div class="hanzi-meta-item">
                <span class="hanzi-meta-item__label">部首</span>
                <span
                  class="hanzi-meta-item__val"
                  :class="{ 'hanzi-meta-item__val--empty': !dictInfo?.radical }"
                >
                  {{ dictInfo?.radical || '—' }}
                </span>
              </div>
              <div class="hanzi-meta-item">
                <span class="hanzi-meta-item__label">笔画</span>
                <span
                  class="hanzi-meta-item__val"
                  :class="{ 'hanzi-meta-item__val--empty': !dictInfo?.strokes }"
                >
                  {{ dictInfo?.strokes ? `${dictInfo.strokes} 画` : '—' }}
                </span>
              </div>
            </div>

            <!-- 基本释义 -->
            <div class="hanzi-definition-box">
              <span class="hanzi-definition-box__label">中文释义</span>
              <p class="hanzi-definition-box__content">
                {{ dictInfo?.definition || (isLoadingDict ? '正在检索释义...' : '暂无收录释义') }}
              </p>
            </div>

            <!-- 数据来源（简洁精美 GitHub 链接，去掉了冗余长注脚） -->
            <footer class="hanzi-explore-sources">
              <span class="hanzi-explore-sources__label">数据来源</span>
              <div class="hanzi-explore-sources__links">
                <a
                  href="https://github.com/sinobaba/hanzidict"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hanzi-source-link"
                >
                  <span>HanziDict</span>
                  <span class="hanzi-source-link__arrow" aria-hidden="true">↗</span>
                </a>
                <span class="hanzi-source-sep" aria-hidden="true">·</span>
                <a
                  href="https://github.com/chanind/hanzi-writer"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hanzi-source-link"
                >
                  <span>Hanzi Writer</span>
                  <span class="hanzi-source-link__arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            </footer>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style lang="scss">
@keyframes zz-explore-dialog-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.hanzi-explore-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: color-mix(in srgb, var(--zz-ink) 25%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.hanzi-explore-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 61;
  transform: translate(-50%, -50%);
  width: min(460px, 92vw);
  max-height: 88vh;
  overflow-y: auto;
  background-color: var(--zz-paper-ui);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  box-shadow: 0 16px 40px rgba(45, 35, 25, 0.16), 0 4px 12px rgba(45, 35, 25, 0.06);
  padding: 18px 20px 20px;
  font-family: var(--zz-font-serif);
  color: var(--zz-ink);
  user-select: none;
  animation: zz-explore-dialog-in var(--zz-dur-base) var(--zz-ease-out);

  &:focus {
    outline: none;
  }
}

.hanzi-explore-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--zz-line-soft);

  &__title {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--zz-ink);
  }

  &__char {
    color: var(--zz-accent);
    font-weight: 600;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--zz-radius-xs);
    color: var(--zz-muted);
    cursor: pointer;
    transition: all var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      background: var(--zz-paper-deep);
      border-color: var(--zz-line-soft);
      color: var(--zz-ink);
    }

    &:focus-visible {
      outline: 1px solid var(--zz-accent-line);
      outline-offset: 1px;
    }
  }
}

.hanzi-explore-cards {
  display: grid;
  grid-template-columns: calc(50% - 6px) calc(50% - 6px);
  gap: 12px;
  margin-bottom: 16px;
}

.hanzi-card {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--zz-paper-deep);
  border: 1px solid var(--zz-line-soft);
  border-radius: var(--zz-radius-sm);
  padding: 10px 10px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    margin-bottom: 8px;
  }

  &__font-name {
    font-size: 12px;
    color: var(--zz-ink-soft);
    font-weight: 500;
    letter-spacing: 0.04em;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  &__display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: var(--zz-paper-ui);
    border: 1px solid var(--zz-line-soft);
    border-radius: var(--zz-radius-xs);
    overflow: hidden;
  }

  &__glyph {
    font-size: 118px;
    line-height: 1;
    color: var(--zz-ink);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    height: 24px;
  }

  &__fallback-glyph {
    position: absolute;
    inset: 0;
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--zz-font-serif);
    font-size: 118px;
    line-height: 1;
    color: var(--zz-ink);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__no-stroke-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    padding: 0 8px;
    font-size: 11px;
    color: var(--zz-muted);
    letter-spacing: 0.04em;
    user-select: none;
  }
}

/* 田字格背景：标准习字格外框与中心十字虚线贯通全格，零边缘空白 */
.hanzi-tian-grid {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='50' x2='100' y2='50' stroke='%23dfd6c8' stroke-width='1' stroke-dasharray='4,4'/%3E%3Cline x1='50' y1='0' x2='50' y2='100' stroke='%23dfd6c8' stroke-width='1' stroke-dasharray='4,4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}

.hanzi-writer-box {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--zz-dur-fast) var(--zz-ease-out);

  &--ready {
    opacity: 1;
    pointer-events: auto;
  }

  svg {
    width: 100% !important;
    height: 100% !important;
  }
}

.hanzi-replay-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  background: var(--zz-paper-ui);
  border: 1px solid var(--zz-line-soft);
  border-radius: var(--zz-radius-xs);
  font-family: inherit;
  font-size: 11px;
  color: var(--zz-ink-soft);
  cursor: pointer;
  transition: all var(--zz-dur-fast) var(--zz-ease-out);

  &__icon {
    opacity: 0.75;
  }

  &:hover:not(:disabled) {
    background: var(--zz-accent-soft);
    border-color: var(--zz-accent-line);
    color: var(--zz-accent);

    .hanzi-replay-btn__icon {
      opacity: 1;
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 1px solid var(--zz-accent-line);
    outline-offset: 1px;
  }
}

.hanzi-meta-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hanzi-meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 14px;
  background: var(--zz-paper-deep);
  border: 1px solid var(--zz-line-soft);
  border-radius: var(--zz-radius-xs);
}

.hanzi-meta-item {
  display: flex;
  align-items: baseline;
  gap: 8px;

  &__label {
    font-size: 13px;
    color: var(--zz-muted);
  }

  &__val {
    font-size: 15px;
    color: var(--zz-ink);
    font-weight: 500;

    &--pinyin {
      font-family: var(--zz-font-sans);
      color: var(--zz-accent);
      font-size: 17px;
      font-weight: 600;
    }

    &--empty {
      color: var(--zz-muted);
      font-weight: 400;
    }
  }
}

.hanzi-definition-box {
  padding: 12px 14px;
  background: var(--zz-paper-deep);
  border: 1px solid var(--zz-line-soft);
  border-radius: var(--zz-radius-xs);

  &__label {
    display: block;
    font-size: 12px;
    color: var(--zz-muted);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  &__content {
    margin: 0;
    font-size: 15px;
    line-height: 1.68;
    color: var(--zz-ink-soft);
    user-select: text;
  }
}

.hanzi-explore-sources {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px dashed var(--zz-line-soft);
  font-size: 12px;
  color: var(--zz-muted);

  &__label {
    letter-spacing: 0.04em;
  }

  &__links {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.hanzi-source-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--zz-ink-soft);
  text-decoration: none;
  font-family: var(--zz-font-sans);
  font-size: 12px;
  transition: color var(--zz-dur-fast) var(--zz-ease-out);

  &__arrow {
    font-size: 11px;
    opacity: 0.65;
    transition: transform var(--zz-dur-fast) var(--zz-ease-out);
  }

  &:hover {
    color: var(--zz-accent);

    .hanzi-source-link__arrow {
      opacity: 1;
      transform: translate(1px, -1px);
    }
  }

  &:focus-visible {
    outline: 1px solid var(--zz-accent-line);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

.hanzi-source-sep {
  color: var(--zz-line-strong);
  font-size: 11px;
}

@media (max-width: 500px) {
  .hanzi-explore-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .hanzi-card__display {
    height: 140px;
  }

  .hanzi-card__glyph {
    font-size: 100px;
  }
}
</style>
