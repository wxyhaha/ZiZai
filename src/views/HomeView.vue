<script setup lang="ts">
import { RouterLink } from 'vue-router'
import FallingGlyphs from '@/components/home/FallingGlyphs.vue'

/** 首页底部的三个辅助入口。它们都落到赏字的对应抽屉（阶段 C 完成），
 *  当前通过 query 明确告知用户该去向，避免出现「点了没反应」的假按钮。 */
const footLinks = [
  { label: '择字', to: { path: '/studio', query: { panel: 'fonts' } } },
  { label: '阅古', to: { path: '/studio', query: { panel: 'texts' } } },
  { label: '观式', to: { path: '/studio', query: { panel: 'layouts' } } },
]
</script>

<template>
  <div class="home zz-grain">
    <FallingGlyphs />

    <main id="main" class="home__stage">
      <div class="hero">
        <p class="hero__eyebrow">中文古风字体与排版艺术</p>

        <h1 class="hero__title">
          <span>字</span><span>在</span>
        </h1>

        <p class="hero__tagline">字有风骨，自在其间。</p>

        <span class="hero__rule" aria-hidden="true" />

        <p class="hero__subtitle">在字与纸之间，重识中文之美</p>

        <RouterLink class="hero__cta" to="/studio">
          <span class="hero__cta-label">入字间</span>
          <span class="hero__cta-arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </main>

    <footer class="home__foot">
      <span class="home__motto">字 里 有 山 河</span>
      <nav class="home__links" aria-label="赏字快捷入口">
        <RouterLink v-for="link in footLinks" :key="link.label" :to="link.to" class="home__link">
          {{ link.label }}
        </RouterLink>
      </nav>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.home {
  position: relative;
  display: flex;
  flex-direction: column;
  // 单屏舞台：始终等于去掉页头后的可视高度，不产生第二屏
  height: calc(100dvh - var(--zz-header-h));
  min-height: 480px;
  overflow: hidden;

  &__stage {
    position: relative;
    z-index: 2;
    flex: 1;
    display: grid;
    place-items: center;
    // 设计稿里主视觉整体位于光学中心略偏下：上方留白多于下方，
    // 视觉重心才落在画面中部而不是顶到页头。
    padding-top: 7vh;
  }

  &__foot {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 var(--zz-gutter);
    padding: 0 0 34px;
    border-top: 1px solid var(--zz-line);
    padding-top: 22px;
    color: var(--zz-muted);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: var(--zz-track-wider);
  }

  &__motto {
    letter-spacing: var(--zz-track-wider);
  }

  &__links {
    display: flex;
    gap: 27px;
  }

  &__link {
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-muted);
    transition: color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      color: var(--zz-accent);
    }
  }
}

.hero {
  position: relative;
  text-align: center;
  // 让主视觉成为一个整体块，落字永远在它两侧
  max-width: min(640px, 90vw);

  &__eyebrow {
    font-family: var(--zz-font-serif);
    font-size: 17px;
    letter-spacing: 0.41em;
    // letter-spacing 会在末字之后多留一份间距，用 text-indent 抵消以保持光学居中
    text-indent: 0.41em;
    color: var(--zz-accent);
    margin-bottom: 35px;
  }

  &__title {
    display: flex;
    justify-content: center;
    gap: 0.72em;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-display);
    font-weight: 400;
    line-height: 1.2;
    color: var(--zz-ink);
    margin-bottom: 20px;

    span {
      display: block;
    }
  }

  &__tagline {
    font-family: var(--zz-font-serif);
    font-size: 22px;
    letter-spacing: 0.23em;
    text-indent: 0.23em;
    color: var(--zz-ink-tagline);
    margin-bottom: 24px;
  }

  // 一条极细的朱砂色竖线，作为标题与副题之间的呼吸
  &__rule {
    display: block;
    width: 1.6px;
    height: 39px;
    margin: 0 auto 24px;
    background: var(--zz-accent-line);
  }

  &__subtitle {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    letter-spacing: 0.27em;
    text-indent: 0.27em;
    color: var(--zz-muted-soft);
    margin-bottom: 38px;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    min-width: 204px;
    height: 64px;
    padding: 0 26px;
    border: 1.3px solid var(--zz-accent);
    border-radius: var(--zz-radius-xs);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-lg);
    letter-spacing: 0.21em;
    // 同上，抵消末字后的多余字距
    text-indent: 0.21em;
    color: var(--zz-accent);
    transition:
      background-color var(--zz-dur-base) var(--zz-ease-out),
      color var(--zz-dur-base) var(--zz-ease-out);

    &:hover {
      background: var(--zz-accent);
      color: var(--zz-paper);
    }
  }

  &__cta-label {
    // 修正 text-indent 对箭头位置的影响：只让文字部分带缩进
    text-indent: 0;
  }

  &__cta-arrow {
    font-family: var(--zz-font-sans);
    font-size: 20px;
    letter-spacing: 0;
    text-indent: 0;
    transition: transform var(--zz-dur-base) var(--zz-ease-out);
  }

  &__cta:hover &__cta-arrow {
    transform: translateX(3px);
  }
}

/* ---- 平板：主视觉按比例收敛 ---- */
@include bp.below(bp.$bp-mobile) {
  .home {
    &__foot {
      padding-bottom: 22px;
      padding-top: 16px;
      font-size: var(--zz-text-xs);
    }

    &__links {
      gap: 18px;
    }
  }

  .hero {
    &__eyebrow {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-indent: 0.3em;
      margin-bottom: 22px;
    }

    &__title {
      gap: 0.6em;
      margin-bottom: 14px;
    }

    &__tagline {
      font-size: 16px;
      letter-spacing: 0.2em;
      text-indent: 0.2em;
      margin-bottom: 18px;
    }

    &__rule {
      height: 28px;
      margin-bottom: 18px;
    }

    &__subtitle {
      font-size: var(--zz-text-xs);
      letter-spacing: 0.22em;
      text-indent: 0.22em;
      margin-bottom: 28px;
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
    &__tagline {
      font-size: 14px;
    }

    &__cta {
      min-width: 150px;
      height: 50px;
      font-size: var(--zz-text-sm);
    }
  }
}

/* ---- 矮屏（≤700px 高）：只压缩装饰，绝不新增第二屏 ---- */
@include bp.short-screen {
  .home {
    min-height: 0;

    &__foot {
      padding-bottom: 14px;
      padding-top: 12px;
    }
  }

  .hero {
    &__eyebrow {
      margin-bottom: 16px;
    }

    &__title {
      margin-bottom: 10px;
    }

    &__tagline {
      margin-bottom: 12px;
    }

    &__rule {
      height: 22px;
      margin-bottom: 12px;
    }

    &__subtitle {
      margin-bottom: 20px;
    }
  }
}

@include bp.very-short-screen {
  .home__foot {
    display: none;
  }

  .hero__rule {
    display: none;
  }

  .hero__subtitle {
    margin-bottom: 16px;
  }
}
</style>
