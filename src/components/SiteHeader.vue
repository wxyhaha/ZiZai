<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useNavMenu } from '@/composables/useNavMenu'

const route = useRoute()
const { isMenuOpen, closeMenu, toggleMenu } = useNavMenu()

const navItems = [
  { label: '首页', to: '/', key: 'home' },
  { label: '赏字', to: '/studio', key: 'studio' },
] as const

const activeKey = computed(() => (route.name === 'studio' ? 'studio' : 'home'))
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/" aria-label="字在 ZiZai · 回到首页" @click="closeMenu">
      <span class="brand__name">字在</span>
      <span class="brand__seal" aria-hidden="true">印</span>
    </RouterLink>

    <nav class="site-nav" aria-label="主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="site-nav__link"
        :class="{ 'is-active': activeKey === item.key }"
        :aria-current="activeKey === item.key ? 'page' : undefined"
        @click="closeMenu"
      >
        {{ item.label }}
      </RouterLink>

      <button
        type="button"
        class="site-nav__more"
        :aria-expanded="isMenuOpen"
        aria-controls="site-more-menu"
        aria-haspopup="dialog"
        @click="toggleMenu"
      >
        <span aria-hidden="true">···</span>
        <span class="zz-sr-only">更多</span>
      </button>
    </nav>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.site-header {
  position: relative;
  z-index: 20;
  // 在竖向 flex 容器里，`margin: auto` 会让元素收缩到内容宽度，
  // 必须显式给满宽，两边留白才与页面内容对齐。
  width: 100%;
  flex: none;
  height: var(--zz-header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--zz-container);
  margin: 0 auto;
  padding: 0 var(--zz-gutter);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 13px;

  &__name {
    font-family: var(--zz-font-serif);
    font-size: 29px;
    font-weight: 400;
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-ink);
    line-height: 1;
  }

  &__seal {
    display: inline-grid;
    place-items: center;
    width: 19px;
    height: 27px;
    border: 0.85px solid var(--zz-accent);
    border-radius: 1px;
    color: var(--zz-accent);
    font-family: var(--zz-font-serif);
    font-size: 10px;
    line-height: 1;
    // 印章字轻微下沉，贴近实体钤印的位置
    padding-top: 1px;
  }

  &:hover &__seal {
    background: var(--zz-accent-soft);
  }
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 36px;

  &__link {
    position: relative;
    font-family: var(--zz-font-serif);
    font-size: 15px;
    letter-spacing: var(--zz-track-wider);
    color: var(--zz-muted);
    padding: 8px 0 11px;
    transition: color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      color: var(--zz-ink-soft);
    }

    &.is-active {
      color: var(--zz-ink);
    }

    // 当前页用一条朱砂细线标示，不用色块
    &.is-active::after {
      content: '';
      position: absolute;
      inset-inline: 0 -0.2em;
      bottom: 2px;
      height: 1px;
      background: var(--zz-accent);
    }
  }

  &__more {
    font-family: var(--zz-font-serif);
    font-size: 21px;
    line-height: 1;
    color: var(--zz-muted);
    padding: 8px 4px;
    border-radius: var(--zz-radius-sm);
    transition: color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      color: var(--zz-accent);
    }
  }
}

@include bp.below(bp.$bp-mobile) {
  .brand__name {
    font-size: 24px;
  }

  .site-nav {
    gap: 19px;

    &__link {
      font-size: 13px;
      letter-spacing: 0.16em;
    }

    &__more {
      font-size: 18px;
    }
  }
}

@include bp.below(bp.$bp-narrow) {
  .site-nav {
    gap: 13px;
  }
}
</style>
