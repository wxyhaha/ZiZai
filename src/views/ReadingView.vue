<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutList, Palette } from 'lucide-vue-next'

import { useReadingState } from '@/composables/useReadingState'
import { useBookmarks } from '@/composables/useBookmarks'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import type { LayoutMode } from '@/types'
import type { StudioTool } from '@/components/studio/StudioToolbar.vue'

import ReadingSheet from '@/components/studio/ReadingSheet.vue'
import StudioToolbar from '@/components/studio/StudioToolbar.vue'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import LayoutPanel from '@/components/studio/LayoutPanel.vue'
import TypographyPanel from '@/components/studio/TypographyPanel.vue'
import WritingPanel from '@/components/studio/WritingPanel.vue'
import ComparePanel from '@/components/studio/ComparePanel.vue'
import BookmarkPanel from '@/components/studio/BookmarkPanel.vue'

// 正文字体随本路由懒加载：进入赏字时才下载，首页永远不会请求它们。
import '@/styles/fonts/reading-fonts.scss'

const route = useRoute()
const {
  state,
  activeText,
  activeFont,
  isVertical,
  isCustom,
  isComparing,
  compareFont,
  startCompare,
  setCompareFont,
  stopCompare,
  setLayout,
  setFont,
  setText,
  setCustomText,
  clearCustomText,
  setFontSize,
  setLineHeight,
  setLetterSpacing,
  setContentWidth,
} = useReadingState()

const { items: bookmarks, count: bookmarkCount, add, remove } = useBookmarks()

/**
 * 同时最多打开一个主面板。
 * 这既是设计规范（避免浮层套浮层），也简化了焦点管理。
 */
const activePanel = ref<StudioTool | null>(null)

function openPanel(tool: StudioTool) {
  activePanel.value = tool
}

/**
 * 首页底部的「择字 / 阅古 / 观式」通过 ?panel= 直接落到对应面板。
 * 只在挂载时读一次，之后由用户操作接管，避免 URL 与状态互相拉扯。
 */
onMounted(() => {
  const requested = route.query.panel
  if (typeof requested === 'string' && ['fonts', 'texts', 'layouts'].includes(requested)) {
    // 首页用的是 texts，赏字的面板 id 里叫 fonts / layouts / typography
    activePanel.value =
      requested === 'texts' ? 'fonts' : requested === 'layouts' ? 'layouts' : 'fonts'
  }
})

// 切换文稿 / 字体时把书页滚回顶部，避免停在上一次的滚动位置
const sheetKey = ref(0)
watch(
  () => [activeText.value.title, activeFont.value.id, state.value.layout],
  () => {
    sheetKey.value += 1
  },
)

/** 上一篇 / 下一篇（仅在内置古文中循环；题写模式下退出题写） */
const currentIndex = computed(() => texts.findIndex((t) => t.id === state.value.textId))
const pageLabel = computed(() =>
  isCustom.value ? '自定' : `${currentIndex.value + 1} / ${texts.length}`,
)

function stepText(delta: number) {
  const base = currentIndex.value < 0 ? 0 : currentIndex.value
  const next = (base + delta + texts.length) % texts.length
  setText(texts[next].id)
}

function toggleLayout(layout: LayoutMode) {
  setLayout(layout)
}

/** 快捷字号调整（底部滑杆之外的低成本入口） */
function nudgeSize(delta: number) {
  setFontSize(state.value.fontSize + delta)
}

/** 收藏当前这一整套搭配：字体 + 文稿 + 版式 + 排版参数 */
function saveCurrent() {
  add({
    title: isCustom.value ? activeText.value.paragraphs.join('').slice(0, 12) : activeText.value.title,
    fontId: state.value.fontId,
    textId: isCustom.value ? null : (state.value.textId ?? null),
    customText: state.value.customText,
    layout: state.value.layout,
    fontSize: state.value.fontSize,
    lineHeight: state.value.lineHeight,
    letterSpacing: state.value.letterSpacing,
    contentWidth: state.value.contentWidth,
  })
}

/** 把收藏恢复成当前阅读状态 */
function restore(bookmark: import('@/composables/useBookmarks').Bookmark) {
  setFont(bookmark.fontId)
  setLayout(bookmark.layout)
  setFontSize(bookmark.fontSize)
  setLineHeight(bookmark.lineHeight)
  setLetterSpacing(bookmark.letterSpacing)
  setContentWidth(bookmark.contentWidth)
  if (bookmark.customText) {
    setCustomText(bookmark.customText)
  } else if (bookmark.textId) {
    setText(bookmark.textId)
  }
  activePanel.value = null
}

/** 收藏按钮上的那行小字：让用户在点之前就知道存的是什么 */
const currentLabel = computed(() => {
  const parts = [activeFont.value.name, isVertical.value ? '竖排' : '横排', `${state.value.fontSize}px`]
  return parts.join(' · ')
})
</script>

<template>
  <div class="studio zz-grain">
    <main id="main" class="studio__main">
      <div class="studio__bar">
        <div class="studio__selects">
          <button type="button" class="picker" @click="openPanel('fonts')">
            <span class="picker__label">{{ activeFont.name }}</span>
            <span class="picker__mark" aria-hidden="true">⌄</span>
            <span class="zz-sr-only">更换字体</span>
          </button>

          <button type="button" class="picker" @click="openPanel('texts' as StudioTool)">
            <span class="picker__label">{{ activeText.title }}</span>
            <span class="picker__mark" aria-hidden="true">⌄</span>
            <span class="zz-sr-only">更换古文</span>
          </button>
        </div>

        <div class="modes" role="group" aria-label="排版方向">
          <button
            type="button"
            class="modes__btn"
            :class="{ 'is-active': !isVertical }"
            :aria-pressed="!isVertical"
            @click="toggleLayout('horizontal')"
          >
            <LayoutList :size="15" aria-hidden="true" /><span class="modes__text">横排</span>
          </button>
          <button
            type="button"
            class="modes__btn"
            :class="{ 'is-active': isVertical }"
            :aria-pressed="isVertical"
            @click="toggleLayout('vertical')"
          >
            <Palette :size="15" aria-hidden="true" /><span class="modes__text">竖排</span>
          </button>
        </div>
      </div>

      <div class="studio__workspace">
        <!-- 对照模式：同一段文字，两栏两款字体 -->
        <template v-if="isComparing">
          <div class="compare">
            <div class="compare__col">
              <p class="compare__label">{{ activeFont.name }}</p>
              <ReadingSheet
                :key="`a-${sheetKey}`"
                :title="activeText.title"
                :author="activeText.author"
                :era="activeText.era"
                :paragraphs="activeText.paragraphs"
                :font-family="activeFont.family"
                :layout="state.layout"
                :font-size="state.fontSize"
                :line-height="state.lineHeight"
                :letter-spacing="state.letterSpacing"
                :content-width="state.contentWidth"
                :is-custom="isCustom"
              />
            </div>

            <div class="compare__col">
              <p class="compare__label">{{ compareFont?.name }}</p>
              <ReadingSheet
                :key="`b-${sheetKey}-${state.compareFontId}`"
                :title="activeText.title"
                :author="activeText.author"
                :era="activeText.era"
                :paragraphs="activeText.paragraphs"
                :font-family="compareFont?.family ?? activeFont.family"
                :layout="state.layout"
                :font-size="state.fontSize"
                :line-height="state.lineHeight"
                :letter-spacing="state.letterSpacing"
                :content-width="state.contentWidth"
                :is-custom="isCustom"
              />
            </div>
          </div>
        </template>

        <ReadingSheet
          v-else
          :key="sheetKey"
          :title="activeText.title"
          :author="activeText.author"
          :era="activeText.era"
          :paragraphs="activeText.paragraphs"
          :font-family="activeFont.family"
          :layout="state.layout"
          :font-size="state.fontSize"
          :line-height="state.lineHeight"
          :letter-spacing="state.letterSpacing"
          :content-width="state.contentWidth"
          :is-custom="isCustom"
        />

        <aside class="rail">
          <StudioToolbar
            :active="activePanel"
            :bookmark-count="bookmarkCount"
            @open="openPanel"
          />
        </aside>
      </div>

      <div class="studio__foot">
        <div class="pager">
          <RouterLink class="back" to="/">
            <ArrowLeft :size="13" aria-hidden="true" />
            <span class="back__text">回首页</span>
          </RouterLink>

          <div class="pager__step">
            <button type="button" class="pager__btn" aria-label="上一篇" @click="stepText(-1)">
              <ChevronLeft :size="16" aria-hidden="true" />
            </button>
            <span class="pager__label">{{ pageLabel }}</span>
            <button type="button" class="pager__btn" aria-label="下一篇" @click="stepText(1)">
              <ChevronRight :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p class="studio__status">一纸书香 · 任意排版</p>

        <div class="size-quick">
          <button type="button" class="size-quick__btn" aria-label="减小字号" @click="nudgeSize(-1)">
            A−
          </button>
          <input
            class="size-quick__range"
            type="range"
            min="14"
            max="40"
            step="1"
            :value="state.fontSize"
            aria-label="字号"
            @input="setFontSize(Number(($event.target as HTMLInputElement).value))"
          />
          <button type="button" class="size-quick__btn" aria-label="增大字号" @click="nudgeSize(1)">
            A+
          </button>
        </div>
      </div>
    </main>

    <!-- ---- 面板：同一时刻只允许一个 ---- -->
    <FontPickerPanel
      :open="activePanel === 'fonts'"
      :fonts="fonts"
      :selected-id="state.fontId"
      @update:open="(v) => (activePanel = v ? 'fonts' : null)"
      @select="setFont"
    />

    <TextPickerPanel
      :open="activePanel === 'texts'"
      :texts="texts"
      :selected-id="state.textId"
      :is-custom="isCustom"
      @update:open="(v) => (activePanel = v ? 'texts' : null)"
      @select="setText"
      @write="activePanel = 'write'"
    />

    <LayoutPanel
      :open="activePanel === 'layouts'"
      :layout="state.layout"
      @update:open="(v) => (activePanel = v ? 'layouts' : null)"
      @select="setLayout"
    />

    <TypographyPanel
      :open="activePanel === 'typography'"
      :font-size="state.fontSize"
      :line-height="state.lineHeight"
      :letter-spacing="state.letterSpacing"
      :content-width="state.contentWidth"
      @update:open="(v) => (activePanel = v ? 'typography' : null)"
      @update:font-size="setFontSize"
      @update:line-height="setLineHeight"
      @update:letter-spacing="setLetterSpacing"
      @update:content-width="setContentWidth"
    />

    <WritingPanel
      :open="activePanel === 'write'"
      :font="activeFont"
      :current="state.customText"
      @update:open="(v) => (activePanel = v ? 'write' : null)"
      @apply="setCustomText"
      @clear="clearCustomText"
    />

    <ComparePanel
      :open="activePanel === 'compare'"
      :fonts="fonts"
      :primary-id="state.fontId"
      :compare-id="state.compareFontId"
      @update:open="(v) => (activePanel = v ? 'compare' : null)"
      @start="startCompare()"
      @select="setCompareFont"
      @stop="stopCompare"
    />

    <BookmarkPanel
      :open="activePanel === 'bookmarks'"
      :bookmarks="bookmarks"
      :fonts="fonts"
      :current-label="currentLabel"
      @update:open="(v) => (activePanel = v ? 'bookmarks' : null)"
      @save="saveCurrent"
      @restore="restore"
      @remove="remove"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.studio {
  position: relative;
  // flex: none —— 若让它 flex:1，内容会把整机撑出视口高度并产生页面级滚动，
  // 书页内部的滚动就失效了。整屏应用式布局必须锁死高度。
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100dvh - var(--zz-header-h));
  overflow: hidden;

  &__main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-width: var(--zz-container);
    width: 100%;
    margin: 0 auto;
    padding: 0 var(--zz-gutter) 14px;
  }

  &__bar {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--zz-space-4);
    padding: 16px 0 22px;
    border-bottom: 1px solid var(--zz-line);
  }

  &__selects {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__workspace {
    flex: 1;
    display: flex;
    gap: 18px;
    min-height: 0;
    padding-top: 24px;
  }

  &__foot {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--zz-space-4);
    padding-top: 14px;
    color: var(--zz-muted);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xs);
    letter-spacing: var(--zz-track-tight);
  }

  &__status {
    letter-spacing: var(--zz-track-tight);
  }
}

/* ---- 顶栏的两个选择按钮 ---- */
.picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: 178px;
  height: 51px;
  padding: 0 16px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-lg);
  background: var(--zz-paper-raised);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-md);
  letter-spacing: var(--zz-track-tight);
  color: var(--zz-ink-soft);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
    background: var(--zz-paper-ui);
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__mark {
    flex: none;
    font-size: var(--zz-text-lg);
    line-height: 1;
    color: var(--zz-muted);
  }
}

.modes {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 14px;
    border-radius: var(--zz-radius-sm);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
    transition:
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      background: var(--zz-paper-deep);
    }

    &.is-active {
      background: var(--zz-paper-deep);
      color: var(--zz-ink);
    }
  }
}

/* ---- 右侧工具轨 ---- */
.rail {
  flex: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 14px;
  border-left: 1px solid var(--zz-line);
  // 工具轨本身不滚动：工具数量固定，且必须在任何高度下一屏放下。
  // 如果将来工具变多，应改成分组或折叠，而不是让工具条滚动。
  overflow: visible;
}

/* ---- 对照模式：两栏同文 ---- */
.compare {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 14px;

  &__col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    flex: none;
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xs);
    letter-spacing: var(--zz-track-wide);
    color: var(--zz-muted);
    text-align: center;
  }
}

/* ---- 底部 ---- */
.pager {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--zz-muted);
  letter-spacing: var(--zz-track-normal);
  transition: color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    color: var(--zz-accent);
  }
}

.pager__step {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pager__btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: var(--zz-muted);
  transition:
    color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    color: var(--zz-ink);
    background: var(--zz-paper-deep);
  }
}

.pager__label {
  min-width: 42px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--zz-muted-soft);
}

.size-quick {
  display: flex;
  align-items: center;
  gap: 12px;

  &__btn {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    color: var(--zz-muted);
    padding: 2px 4px;

    &:hover {
      color: var(--zz-accent);
    }
  }

  &__range {
    width: 120px;
    accent-color: var(--zz-accent);
    cursor: pointer;
  }
}

/* ---- 平板 ---- */
@include bp.below(bp.$bp-desktop) {
  .studio__workspace {
    gap: 12px;
  }

  .rail {
    padding-left: 10px;
  }
}

/* ---- 手机：工具轨变为底部工具条 ---- */
@include bp.below(bp.$bp-mobile) {
  .studio {
    height: auto;
    min-height: calc(100dvh - var(--zz-header-h));
    overflow: visible;

    &__main {
      padding: 0 var(--zz-gutter) 0;
    }

    &__bar {
      gap: 10px;
      padding: 12px 0 14px;
    }

    &__selects {
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    &__workspace {
      flex-direction: column;
      gap: 0;
      padding-top: 14px;
    }

    // 工具条固定在视口底部，不随正文滚走
    &__foot {
      display: none;
    }
  }

  .picker {
    flex: 1 1 0;
    // min-width 必须显式归零，否则 flex 项的自动最小尺寸会取内容宽度，
    // 两个选择器一起把顶栏挤爆
    min-width: 0;
    height: 44px;
    padding: 0 10px;
    gap: 6px;
    font-size: var(--zz-text-sm);

    &__label {
      flex: 1;
      min-width: 0;
    }

    &__mark {
      font-size: var(--zz-text-base);
    }
  }

  .modes__btn {
    height: 36px;
    padding: 0 8px;
    gap: 0;

    // 只保留图标，把横向空间让给两个选择器。
    // 注意这里是独立类名 `.modes__text`，不能用嵌套的 &__text ——
    // 那会编译成 `.modes__btn__text`，匹配不到模板里的元素。
    .modes__text {
      display: none;
    }
  }

  .rail {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    padding: 0;
    border-left: 0;
    border-top: 1px solid var(--zz-line);
    background: var(--zz-paper-ui);
    padding-bottom: env(safe-area-inset-bottom);
  }

  // 给固定工具条留出空间，正文最后一行不被遮住
  .studio__workspace {
    padding-bottom: 68px;
  }

  // 手机上两栏并排会各剩不到 170px，一个字一行都放不下；
  // 改为上下叠放，各自占满宽度。
  .compare {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
