<script setup lang="ts">
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
 * 赏字的侧边抽屉 / 底部面板。
 *
 * 只负责「容器 + 无障碍」：焦点陷阱、Esc 关闭、点外关闭、焦点返回、
 * 滚动锁定全部由 Reka UI 的 Dialog 保证。视觉完全自绘。
 *
 * 桌面从右侧滑入，手机从底部升起（见 SCSS 的断点）。
 */

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** 供屏幕阅读器朗读的一句话说明 */
    description?: string
    /** 面板宽度上限，桌面端 */
    width?: string
  }>(),
  { description: '', width: 'min(460px, 100vw)' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="panel-overlay" />
      <DialogContent class="panel" :style="{ '--panel-width': props.width }">
        <header class="panel__head">
          <DialogTitle class="panel__title">{{ props.title }}</DialogTitle>
          <DialogClose class="panel__close">
            <span aria-hidden="true">✕</span>
            <span class="zz-sr-only">关闭</span>
          </DialogClose>
        </header>

        <DialogDescription v-if="props.description" class="panel__lede">
          {{ props.description }}
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
  background: rgb(31 25 20 / 21%);
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

  &__head {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--zz-space-4);
    padding: 26px 30px 18px;
    border-bottom: 1px solid var(--zz-line);
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
    overflow: auto;
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

/* ---- 手机：改为底部面板 ---- */
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
