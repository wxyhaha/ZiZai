<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import {
  getPunctuationStyle,
  type PunctuationStyleId,
} from '@/data/punctuationStyles'

const props = defineProps<{
  open: boolean
  styleId: PunctuationStyleId | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const styleInfo = computed(() => {
  return getPunctuationStyle(props.styleId ?? 'ming-qing')
})
</script>

<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="info-modal-overlay" />
      <DialogContent class="info-modal" aria-describedby="info-modal-desc">
        <header class="info-modal__head">
          <div class="info-modal__lead">
            <!-- 真实微观几何矢量印记 -->
            <div class="info-modal__symbol" aria-hidden="true">
              <!-- 先秦两汉：折笔墨钩与墨点 -->
              <svg
                v-if="styleInfo.id === 'pre-qin'"
                viewBox="0 0 24 24"
                class="modal-era-icon"
              >
                <path
                  d="M 6 4 L 6 15 C 6 17.5 7.5 19 11 19 C 14 19 16 18 17.5 16.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="17" cy="8" r="2.2" fill="currentColor" />
              </svg>
              <!-- 魏晋隋唐：手书朱圈与朱撇 -->
              <svg
                v-else-if="styleInfo.id === 'wei-jin'"
                viewBox="0 0 24 24"
                class="modal-era-icon modal-era-icon--cinnabar"
              >
                <circle cx="9" cy="9" r="5" fill="none" stroke="#b83625" stroke-width="2.2" />
                <path
                  d="M 14 14 C 16 16 17.5 18 19 19.5 C 20 18.5 19 16.5 16.5 14.5 Z"
                  fill="#b83625"
                />
              </svg>
              <!-- 宋元雕版：细铁线墨圈与木刻角点 -->
              <svg
                v-else-if="styleInfo.id === 'song-yuan'"
                viewBox="0 0 24 24"
                class="modal-era-icon"
              >
                <circle cx="9" cy="9" r="4.8" fill="none" stroke="currentColor" stroke-width="1.3" />
                <polygon points="14,19 19,19 19,14" fill="currentColor" />
              </svg>
              <!-- 明清刻本：万历朱圈与朱砂圆点 -->
              <svg
                v-else-if="styleInfo.id === 'ming-qing'"
                viewBox="0 0 24 24"
                class="modal-era-icon modal-era-icon--cinnabar"
              >
                <circle cx="9" cy="9" r="5.2" fill="none" stroke="#b83625" stroke-width="2" />
                <circle cx="17" cy="16" r="2.4" fill="#b83625" />
              </svg>
              <!-- 近代现代：现代全角句读规整符号 -->
              <svg
                v-else
                viewBox="0 0 24 24"
                class="modal-era-icon"
              >
                <circle cx="8" cy="14" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6" />
                <path
                  d="M 17 12 C 17.8 12 18.5 12.7 18.5 13.5 C 18.5 15.5 16.5 17.5 15 18 C 15.2 16.8 16 15.8 16 15 C 16 14.8 15.8 14.2 15.5 14 C 15.5 13 16.2 12 17 12 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div class="info-modal__title-group">
              <DialogTitle class="info-modal__title">
                {{ styleInfo.name }}
              </DialogTitle>
              <p class="info-modal__era">{{ styleInfo.eraSpan }}</p>
            </div>
          </div>
          <DialogClose class="info-modal__close" aria-label="关闭学术考据">
            <span aria-hidden="true">✕</span>
          </DialogClose>
        </header>

        <DialogDescription id="info-modal-desc" class="info-modal__summary">
          {{ styleInfo.description }}
        </DialogDescription>

        <div class="info-modal__body">
          <!-- 历史源流 -->
          <section class="info-modal__section">
            <h3 class="info-modal__section-title">
              <span class="info-modal__section-icon" aria-hidden="true">一</span>
              历史源流与形制演进
            </h3>
            <p class="info-modal__text">
              {{ styleInfo.historicalBackground }}
            </p>
          </section>

          <!-- 排版法式与微观几何 -->
          <section class="info-modal__section">
            <h3 class="info-modal__section-title">
              <span class="info-modal__section-icon" aria-hidden="true">二</span>
              排版格律与字侧附挂
            </h3>
            <ul class="info-modal__rules">
              <li
                v-for="(rule, idx) in styleInfo.typographicRules"
                :key="idx"
                class="info-modal__rule-item"
              >
                {{ rule }}
              </li>
            </ul>
          </section>

          <!-- 出土文物实证 -->
          <section class="info-modal__section">
            <h3 class="info-modal__section-title">
              <span class="info-modal__section-icon" aria-hidden="true">三</span>
              出土文物与善本遗存
            </h3>
            <ul class="info-modal__artifacts">
              <li
                v-for="(artifact, idx) in styleInfo.archeologicalArtifacts"
                :key="idx"
                class="info-modal__artifact-item"
              >
                {{ artifact }}
              </li>
            </ul>
          </section>

          <!-- 权威参考文献 -->
          <section class="info-modal__section">
            <h3 class="info-modal__section-title">
              <span class="info-modal__section-icon" aria-hidden="true">四</span>
              权威参考文献与考据论著
            </h3>
            <div class="info-modal__references">
              <div
                v-for="(refItem, idx) in styleInfo.references"
                :key="idx"
                class="info-modal__ref-card"
              >
                <div class="info-modal__ref-head">
                  <strong class="info-modal__ref-author">{{ refItem.author }}</strong>
                  <span class="info-modal__ref-book">{{ refItem.title }}</span>
                  <span class="info-modal__ref-pub">（{{ refItem.publisher }}）</span>
                </div>
                <p v-if="refItem.note" class="info-modal__ref-note">
                  {{ refItem.note }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.info-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(46, 36, 28, 0.45);
  backdrop-filter: blur(4px);
  animation: overlay-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.info-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: min(640px, calc(100vw - 48px));
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: var(--zz-paper-ui, #faf8f5);
  border: 1px solid var(--zz-line, rgba(92, 64, 51, 0.2));
  border-radius: 4px;
  box-shadow: 0 16px 48px rgba(46, 36, 28, 0.25);
  outline: none;
  animation: modal-pop 0.24s cubic-bezier(0.16, 1, 0.3, 1);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 28px 18px;
    border-bottom: 1px solid var(--zz-line-soft, rgba(92, 64, 51, 0.12));
    gap: 16px;
  }

  &__lead {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  &__symbol {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 4px;
    background: var(--zz-paper-deep, #ebe6df);
    border: 1px solid var(--zz-line, rgba(92, 64, 51, 0.18));
    color: var(--zz-ink, #231815);
    box-shadow: inset 0 1px 2px rgba(46, 36, 28, 0.05);

    .modal-era-icon {
      width: 26px;
      height: 26px;
      display: block;

      &--cinnabar {
        color: #b83625;
      }
    }
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-family: var(--zz-font-serif);
    font-size: 20px;
    font-weight: 600;
    color: var(--zz-ink, #231815);
    line-height: 1.35;
    letter-spacing: 0.06em;
  }

  &__era {
    margin: 0;
    font-family: var(--zz-font-sans);
    font-size: 13px;
    color: var(--zz-muted, #7a6e65);
    letter-spacing: 0.03em;
  }

  &__close {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 2px;
    background: transparent;
    color: var(--zz-muted, #7a6e65);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease-out;

    &:hover {
      background: var(--zz-paper-deep, #ebe6df);
      color: var(--zz-ink, #231815);
      border-color: var(--zz-line, rgba(92, 64, 51, 0.2));
    }
  }

  &__summary {
    margin: 0;
    padding: 14px 28px;
    background: var(--zz-paper-deep, #f4efe8);
    font-family: var(--zz-font-serif);
    font-size: 13px;
    line-height: 1.7;
    color: var(--zz-ink-body, #3d312a);
    border-bottom: 1px solid var(--zz-line-soft, rgba(92, 64, 51, 0.12));
  }

  &__body {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 20px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__section-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--zz-font-serif);
    font-size: 14px;
    font-weight: 600;
    color: var(--zz-ink, #231815);
    letter-spacing: 0.08em;
  }

  &__section-icon {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--zz-ink, #231815);
    color: var(--zz-paper-ui, #faf8f5);
    font-size: 10px;
    font-family: var(--zz-font-serif);
  }

  &__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    color: var(--zz-ink-body, #3d312a);
    text-align: justify;
  }

  &__rules,
  &__artifacts {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--zz-ink-body, #3d312a);

    li::marker {
      color: var(--zz-accent, #b83625);
    }
  }

  &__references {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__ref-card {
    padding: 10px 12px;
    border-radius: 2px;
    background: rgba(92, 64, 51, 0.04);
    border-left: 2px solid var(--zz-accent, #b83625);
  }

  &__ref-head {
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--zz-ink, #231815);
  }

  &__ref-author {
    color: var(--zz-accent, #b83625);
    margin-right: 6px;
  }

  &__ref-book {
    font-weight: 500;
    margin-right: 4px;
  }

  &__ref-pub {
    color: var(--zz-muted, #7a6e65);
    font-size: 12px;
  }

  &__ref-note {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--zz-muted, #7a6e65);
  }
}

@keyframes overlay-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -47%) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
