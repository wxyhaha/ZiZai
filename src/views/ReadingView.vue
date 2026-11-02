<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useReadingState } from '@/composables/useReadingState'
import { useBookmarks } from '@/composables/useBookmarks'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import type { StudioTool } from '@/components/studio/StudioToolbar.vue'

import BookViewer from '@/components/studio/BookViewer.vue'
import StudioToolbar from '@/components/studio/StudioToolbar.vue'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import TypographyPanel from '@/components/studio/TypographyPanel.vue'
import WritingPanel from '@/components/studio/WritingPanel.vue'
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
const activePanel = ref<StudioTool | null>(null)

function openPanel(tool: StudioTool) {
  activePanel.value = tool
}

/** 保留首页直达入口；文字选集映射到「文」，方向和排版参数统一映射到「式」。 */
onMounted(() => {
  const requested = route.query.panel
  const panelMap: Record<string, StudioTool> = {
    fonts: 'fonts',
    texts: 'texts',
    layouts: 'typography',
    typography: 'typography',
  }
  if (typeof requested === 'string' && panelMap[requested]) {
    activePanel.value = panelMap[requested]
  }
})

/** 收藏当前这一整套搭配：字体 + 文稿 + 版式 + 排版参数。 */
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

/** 把收藏恢复成当前阅读状态；书页组件会据新参数重新分页并回到第一页。 */
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

/** 收藏入口上先展示将要保存的搭配信息。 */
const currentLabel = computed(() => {
  const parts = [activeFont.value.name, isVertical.value ? '竖排' : '横排', `${state.value.fontSize}px`]
  return parts.join(' · ')
})
</script>

<template>
  <div class="studio zz-grain">
    <main id="main" class="studio__main">
      <div class="studio__workspace">
        <BookViewer
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
          <StudioToolbar :active="activePanel" :bookmark-count="bookmarkCount" @open="openPanel" />
        </aside>
      </div>
    </main>

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

    <TypographyPanel
      :open="activePanel === 'typography'"
      :layout="state.layout"
      :font-size="state.fontSize"
      :line-height="state.lineHeight"
      :letter-spacing="state.letterSpacing"
      :content-width="state.contentWidth"
      @update:open="(v) => (activePanel = v ? 'typography' : null)"
      @update:layout="setLayout"
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
.studio {
  position: relative;
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
    padding: 0 var(--zz-gutter);
  }

  &__workspace {
    flex: 1;
    display: flex;
    gap: 20px;
    min-height: 0;
    padding: 14px 0 10px;
  }
}

.rail {
  flex: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 14px;
  border-left: 1px solid var(--zz-line);
}
</style>
