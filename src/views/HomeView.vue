<script setup lang="ts">
import { RouterLink } from 'vue-router'
import FallingGlyphs from '@/components/home/FallingGlyphs.vue'

// 首页字形子集与赏字页面字体资源分开，按路由加载。
import '@/styles/fonts/home-glyphs.scss'
</script>

<template>
  <div class="home zz-grain">
    <FallingGlyphs />

    <main id="main" class="home__stage">
      <div class="hero">
        <h1 class="hero__title" aria-label="字在">
          <span aria-hidden="true">字</span><span aria-hidden="true">在</span>
        </h1>

        <RouterLink class="hero__cta" to="/studio">
          <span class="hero__cta-label">入字间</span>
          <span class="hero__cta-arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.home {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;

  &__stage {
    position: relative;
    z-index: 2;
    flex: 1;
    display: grid;
    min-height: 0;
    place-items: center;
  }
}

.hero {
  position: relative;
  display: flex;
  width: min(640px, 90vw);
  flex-direction: column;
  align-items: center;
  gap: 38px;
  text-align: center;

  &__title {
    display: flex;
    justify-content: center;
    gap: 0.62em;
    margin: 0;
    color: var(--zz-ink);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-display);
    font-weight: 400;
    line-height: 1.14;

    span {
      display: block;
    }
  }

  &__cta {
    display: inline-flex;
    min-width: 204px;
    height: 64px;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 0 26px;
    border: 1.3px solid var(--zz-accent);
    border-radius: var(--zz-radius-xs);
    color: var(--zz-accent);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-lg);
    letter-spacing: 0.21em;
    text-indent: 0.21em;
    transition:
      background-color var(--zz-dur-base) var(--zz-ease-out),
      color var(--zz-dur-base) var(--zz-ease-out);

    &:hover {
      background: var(--zz-accent);
      color: var(--zz-paper);
    }

    &:focus-visible {
      outline: var(--zz-focus-ring);
      outline-offset: 3px;
    }
  }

  &__cta-label,
  &__cta-arrow {
    text-indent: 0;
  }

  &__cta-arrow {
    font-family: var(--zz-font-sans);
    font-size: 20px;
    letter-spacing: 0;
    transition: transform var(--zz-dur-base) var(--zz-ease-out);
  }

  &__cta:hover &__cta-arrow {
    transform: translateX(3px);
  }
}

@include bp.below(bp.$bp-mobile) {
  .hero {
    gap: 30px;

    &__title {
      gap: 0.55em;
      font-size: clamp(60px, 19vw, 82px);
    }

    &__cta {
      min-width: 164px;
      height: 54px;
      gap: 14px;
      font-size: var(--zz-text-base);
    }
  }
}

@include bp.below(bp.$bp-narrow) {
  .hero {
    gap: 24px;

    &__title {
      font-size: clamp(58px, 19vw, 68px);
    }

    &__cta {
      min-width: 150px;
      height: 50px;
      font-size: var(--zz-text-sm);
    }
  }
}
</style>
