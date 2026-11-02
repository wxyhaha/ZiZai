<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main id="main" class="not-found zz-grain">
    <p class="not-found__code">四〇四</p>
    <h1 class="not-found__title">这一页，字迹未至</h1>
    <p class="not-found__hint">你要找的页面不在字间。回到首页，重新落笔。</p>
    <RouterLink class="not-found__link" to="/">回到首页</RouterLink>
  </main>
</template>

<style scoped lang="scss">
.not-found {
  flex: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--zz-space-4);
  padding: var(--zz-space-8) var(--zz-gutter);
  text-align: center;

  &__code {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: var(--zz-track-widest);
    color: var(--zz-accent);
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
  }

  &__hint {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__link {
    margin-top: var(--zz-space-3);
    padding: 12px 34px;
    border: 1px solid var(--zz-accent);
    border-radius: var(--zz-radius-xs);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-accent);
    transition:
      background-color var(--zz-dur-base) var(--zz-ease-out),
      color var(--zz-dur-base) var(--zz-ease-out);

    &:hover {
      background: var(--zz-accent);
      color: var(--zz-paper);
    }
  }
}
</style>
