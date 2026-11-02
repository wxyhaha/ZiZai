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
import { useNavMenu } from '@/composables/useNavMenu'
import { fonts } from '@/data/fonts'

const { isMenuOpen, closeMenu } = useNavMenu()

const open = isMenuOpen

/** 只统计已核实授权的字体数量，用于在「关于」里给出可信的数字。 */
const verifiedCount = fonts.filter((f) => f.licenseStatus === 'verified').length
const totalCount = fonts.length
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => !v && closeMenu()">
    <DialogPortal>
      <DialogOverlay class="more-overlay" />
      <DialogContent class="more-panel">
        <header class="more-panel__head">
          <DialogTitle class="more-panel__title">关于 · 字在</DialogTitle>
          <DialogClose class="more-panel__close">
            <span aria-hidden="true">✕</span>
            <span class="zz-sr-only">关闭</span>
          </DialogClose>
        </header>

        <DialogDescription class="more-panel__lede">
          字有风骨，自在其间。这里是一个安静的角落，用来重看中文的字形与呼吸。
        </DialogDescription>

        <dl class="facts">
          <div class="facts__row">
            <dt>定位</dt>
            <dd>中文古风字体与排版艺术</dd>
          </div>
          <div class="facts__row">
            <dt>字体</dt>
            <dd>
              已收录 {{ totalCount }} 款，其中 {{ verifiedCount }} 款来源与授权已核实，可随站分发。
            </dd>
          </div>
          <div class="facts__row">
            <dt>字形</dt>
            <dd>未经核实的字体以系统字体近似呈现，并明确标注为示意，不放字体文件。</dd>
          </div>
          <div class="facts__row">
            <dt>数据</dt>
            <dd>古文取自公有领域通行版本，逐篇校对句读；你的收藏只存在本机浏览器。</dd>
          </div>
        </dl>

        <footer class="more-panel__foot">
          <span>ZiZai · 2026</span>
          <span class="more-panel__seal" aria-hidden="true">在</span>
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.more-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgb(31 25 20 / 21%);
}

.more-panel {
  position: fixed;
  z-index: 61;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(520px, calc(100vw - 32px));
  max-height: min(640px, calc(100dvh - 48px));
  overflow: auto;
  padding: 30px 32px 24px;
  background: var(--zz-paper-ui);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  box-shadow: var(--zz-shadow-sheet);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--zz-line);
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xl);
    // 汇文明朝体只有单一字重，用 400 请求真实字形（配合 font-synthesis: none）
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__close {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--zz-radius-sm);
    color: var(--zz-muted);
    font-size: 15px;

    &:hover {
      background: var(--zz-paper-deep);
      color: var(--zz-ink);
    }
  }

  &__lede {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    line-height: 2;
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink-soft);
    padding: 20px 0 6px;
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--zz-line-soft);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xs);
    letter-spacing: var(--zz-track-wide);
    color: var(--zz-muted);
  }

  &__seal {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 26px;
    border: 1px solid var(--zz-accent);
    border-radius: 1px;
    color: var(--zz-accent);
    font-size: 11px;
    line-height: 1;
  }
}

.facts {
  margin: 0;
  padding: 14px 0 0;

  &__row {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 14px;
    padding: 13px 0;
    border-bottom: 1px solid var(--zz-line-soft);
    font-size: var(--zz-text-xs);
    line-height: 1.9;

    dt {
      font-family: var(--zz-font-serif);
      letter-spacing: var(--zz-track-tight);
      color: var(--zz-muted);
    }

    dd {
      margin: 0;
      color: var(--zz-ink-body);
    }

    &:last-child {
      border-bottom: 0;
    }
  }
}

@include bp.below(bp.$bp-mobile) {
  .more-panel {
    padding: 22px 20px 18px;
  }
}
</style>
