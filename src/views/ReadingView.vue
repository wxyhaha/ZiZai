<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useReadingState } from '@/composables/useReadingState'
import { fonts } from '@/data/fonts'
import { texts } from '@/data/texts'
import type { StudioTool } from '@/components/studio/StudioToolbar.vue'

import BookViewer from '@/components/studio/BookViewer.vue'
import ScrollViewer from '@/components/studio/ScrollViewer.vue'
import ScrollSettingsDrawer from '@/components/studio/ScrollSettingsDrawer.vue'
import { defaultPaperThemeId, type PaperThemeId } from '@/data/paperThemes'
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
  setCharVariant,
  reset,
} = useReadingState()

const activePanel = ref<StudioTool | null>(null)
const mode = ref<'book' | 'scroll'>('book')
const scrollSize = ref(55)
const scrollPaper = ref<PaperThemeId>(defaultPaperThemeId)
function chooseFont(id: string) { setFont(id, mode.value === 'book') }
function chooseText(id: string) { setText(id, mode.value === 'book') }
function switchMode(value: 'book' | 'scroll') {
  activePanel.value = null
  mode.value = value
}

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
  <div class="studio zz-grain" :class="{ 'studio--scroll': mode === 'scroll' }">
    <Teleport to="#reading-controls" defer>
      <div class="reading-modes" role="group" aria-label="阅读模式">
        <button :aria-pressed="mode === 'book'" @click="switchMode('book')">书本</button>
        <button :aria-pressed="mode === 'scroll'" @click="switchMode('scroll')">卷轴</button>
      </div>
    </Teleport>
    <main id="main" class="studio__main">
      <div class="studio__workspace">
        <ScrollSettingsDrawer
          v-if="mode === 'scroll'"
          :title="activeText.title"
          :paper-theme="scrollPaper"
          :font-id="state.fontId"
          :font-size="scrollSize"
          :char-variant="state.charVariant"
          @select-text="openPanel('texts')"
          @update:paper-theme="(v) => (scrollPaper = v)"
          @update:font-id="chooseFont"
          @update:font-size="(v) => (scrollSize = v)"
          @update:char-variant="setCharVariant"
        />

        <ScrollViewer
          v-if="mode === 'scroll'"
          :title="activeText.title" :author="activeText.author" :era="activeText.era"
          :paragraphs="activeText.paragraphs" :font="activeFont" :font-size="scrollSize" :paper-theme="scrollPaper"
          :category="activeText.category"
        />
        <BookViewer
          v-else
          :title="activeText.title"
          :author="activeText.author"
          :era="activeText.era"
          :paragraphs="activeText.paragraphs"
          :category="activeText.category"
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

        <aside v-if="mode === 'book'" class="rail">
          <StudioToolbar :active="activePanel" @open="openPanel" />
        </aside>
      </div>
    </main>

    <FontPickerPanel
      :open="activePanel === 'fonts'"
      :fonts="fonts"
      :selected-id="state.fontId"
      @update:open="(v) => (activePanel = v ? 'fonts' : null)"
      @select="chooseFont"
    />

    <TextPickerPanel
      :open="activePanel === 'texts'"
      :texts="texts"
      :selected-id="state.textId"
      :is-custom="isCustom"
      :char-variant="state.charVariant"
      @update:open="(v) => (activePanel = v ? 'texts' : null)"
      @select="chooseText"
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
      :char-variant="state.charVariant"
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
      @update:char-variant="setCharVariant"
      @reset="reset"
    />

    <WritingPanel
      :open="activePanel === 'write'"
      :font="activeFont"
      :current="state.customText"
      :current-title="state.customTitle"
      :current-author="state.customAuthor"
      @update:open="(v) => (activePanel = v ? 'write' : null)"
      @apply="setCustomText"
      @clear="clearCustomText"
    />
  </div>
</template>

<style scoped lang="scss">
.reading-modes {
  display: flex;
  flex: none;
  gap: 2px;
  padding: 3px;
  background: var(--zz-paper-deep);
  border-radius: var(--zz-radius-sm);

  button {
    padding: 3px 14px;
    white-space: nowrap;
    border-radius: var(--zz-radius-xs);
    font-family: var(--zz-font-serif);
    font-size: 13px;
    color: var(--zz-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      color: var(--zz-ink-soft);
    }

    &[aria-pressed='true'] {
      background: var(--zz-paper-ui);
      color: var(--zz-ink);
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
  }
}

.studio--scroll {
  .studio__main { max-width: none; padding: 0; }
  .studio__workspace { position: relative; padding: 0; }
}

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
