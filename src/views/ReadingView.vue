<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useReadingState } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import type { StudioTool } from '@/components/studio/StudioToolbar.vue'

import BookViewer from '@/components/studio/BookViewer.vue'
import StudioToolbar from '@/components/studio/StudioToolbar.vue'
import FontPickerPanel from '@/components/studio/FontPickerPanel.vue'
import TextPickerPanel from '@/components/studio/TextPickerPanel.vue'
import TypographyPanel from '@/components/studio/TypographyPanel.vue'
import WritingPanel from '@/components/studio/WritingPanel.vue'

// 正文字体随本路由懒加载：进入赏字时才下载，首页永远不会请求它们。
import '@/styles/fonts/reading-fonts.scss'

const route = useRoute()
const {
  state,
  activeText,
  activeFont,
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
  setPaperTheme,
  setPunctuationStyle,
  setEraFormat,
  setScriptStyle,
  setJudouMode,
  setWoodblockFrame,
  reset,
} = useReadingState()

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
          :paper-theme="state.paperTheme"
          :punctuation-style="state.punctuationStyle"
          :era-format="state.eraFormat"
          :script-style="state.scriptStyle"
          :judou-mode="state.judouMode"
          :woodblock-frame="state.woodblockFrame"
          :is-custom="isCustom"
          :has-active-modal="activePanel !== null"
        />

        <aside class="rail">
          <StudioToolbar :active="activePanel" @open="openPanel" />
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
      :paper-theme="state.paperTheme"
      :punctuation-style="state.punctuationStyle"
      :era-format="state.eraFormat"
      :script-style="state.scriptStyle"
      :judou-mode="state.judouMode"
      :woodblock-frame="state.woodblockFrame"
      @update:open="(v) => (activePanel = v ? 'typography' : null)"
      @update:layout="setLayout"
      @update:font-size="setFontSize"
      @update:line-height="setLineHeight"
      @update:letter-spacing="setLetterSpacing"
      @update:content-width="setContentWidth"
      @update:paper-theme="setPaperTheme"
      @update:punctuation-style="setPunctuationStyle"
      @update:era-format="setEraFormat"
      @update:script-style="setScriptStyle"
      @update:judou-mode="setJudouMode"
      @update:woodblock-frame="setWoodblockFrame"
      @reset="reset"
    />

    <WritingPanel
      :open="activePanel === 'write'"
      :font="activeFont"
      :current="state.customText"
      @update:open="(v) => (activePanel = v ? 'write' : null)"
      @apply="setCustomText"
      @clear="clearCustomText"
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
