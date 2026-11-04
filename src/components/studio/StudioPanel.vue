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

/**
 * 赏字的侧边抽屉 / 底部面板 / 居中大弹窗。
 *
 * 只负责「容器 + 无障碍」：焦点陷阱、Esc 关闭、点外关闭、焦点返回、
 * 滚动锁定全部由 Reka UI 的 Dialog 保证。视觉完全自绘。
 *
 * 变体支持：
 * - drawer（默认）：桌面从右侧滑入，手机从底部升起。
 * - modal：桌面居中展开宽幅大弹窗（min(1120px, 94vw)），手机自适应为高底部抽屉。
 */

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** 供屏幕阅读器朗读的一句话说明 */
    description?: string
    /** 面板宽度上限，桌面端 */
    width?: string
    /** 面板形态：侧边抽屉 (drawer) 或 居中大弹窗 (modal) */
    variant?: 'drawer' | 'modal'
  }>(),
  { description: '', width: undefined, variant: 'drawer' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const panelWidth = computed(() => {
  if (props.width) return props.width
  return props.variant === 'modal' ? 'min(1120px, 94vw)' : 'min(460px, 100vw)'
})
</script>

<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="panel-overlay" />
      <DialogContent
        class="panel"
        :class="[`panel--${props.variant}`]"
        :style="{ '--panel-width': panelWidth }"
      >
        <header class="panel__head">
          <div class="panel__head-start">
            <DialogTitle class="panel__title">{{ props.title }}</DialogTitle>
            <slot name="title-extra" />
          </div>
          <DialogClose class="panel__close">
            <span aria-hidden="true">✕</span>
            <span class="zz-sr-only">关闭</span>
          </DialogClose>
        </header>

        <DialogDescription v-if="props.description" class="panel__lede">
          {{ props.description }}
        </DialogDescription>
        <DialogDescription v-else class="zz-sr-only">
          {{ props.title }}
        </DialogDescription>

        <div class="panel__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="panel__foot">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgb(31 25 20 / 25%);
  backdrop-filter: blur(2px);
}

.panel {
  position: fixed;
  z-index: 61;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  width: var(--panel-width);
  height: 100dvh;
  background: var(--zz-paper-ui);
  border-left: 1px solid var(--zz-line);
  box-shadow: var(--zz-shadow-layer);

  &--modal {
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%);
    width: var(--panel-width);
    height: min(86vh, 840px);
    max-height: 86vh;
    border-radius: var(--zz-radius-md);
    border: 1px solid var(--zz-line);
    box-shadow:
      0 24px 60px -12px rgba(31, 25, 20, 0.32),
      0 0 0 1px rgba(180, 160, 140, 0.2);
  }

  &__head {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--zz-space-4);
    padding: 24px 30px 18px;
    border-bottom: 1px solid var(--zz-line);
  }

  &__head-start {
    display: flex;
    align-items: baseline;
    gap: var(--zz-space-3);
    flex-wrap: wrap;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xl);
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__close {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--zz-radius-sm);
    color: var(--zz-muted);
    font-size: 14px;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: var(--zz-paper-deep);
      color: var(--zz-ink);
    }
  }

  &__lede {
    flex: none;
    padding: 18px 30px 0;
    font-size: var(--zz-text-xs);
    line-height: 1.9;
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    padding: 22px 30px 30px;
  }

  &__foot {
    flex: none;
    padding: 16px 30px;
    border-top: 1px solid var(--zz-line);
    background: var(--zz-paper-ui);
  }
}

/* ---- 手机：自适应为底部面板 ---- */
@include bp.below(bp.$bp-mobile) {
  .panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    max-height: 86dvh;
    border-left: 0;
    border-top: 1px solid var(--zz-line);
    border-radius: var(--zz-radius-md) var(--zz-radius-md) 0 0;

    &--modal {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      transform: none;
      width: 100%;
      height: 88dvh;
      max-height: 88dvh;
      border-radius: var(--zz-radius-md) var(--zz-radius-md) 0 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 0;
    }

    &__head {
      padding: 18px 20px 14px;
    }

    &__title {
      font-size: var(--zz-text-lg);
    }

    &__lede {
      padding: 14px 20px 0;
    }

    &__body {
      padding: 16px 20px 22px;
    }

    &__foot {
      padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
    }
  }
}
</style>
