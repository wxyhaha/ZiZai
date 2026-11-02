<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import { CUSTOM_TEXT_LIMIT } from '@/composables/useReadingState'
import { countMissingInFull, countMissingInSubset, useFontLoading } from '@/composables/useFontLoading'

/**
 * 题写面板。
 *
 * 核心职责有两个：
 * 1. 接受纯文本输入（永远以文本节点渲染，不拼 innerHTML）；
 * 2. 检测当前字体能否显示这段文字 —— 缺字时提示并可一键加载完整字体。
 */

const props = defineProps<{
  open: boolean
  font: FontEntryWithAssets
  /** 当前生效的题写内容，打开面板时回填 */
  current: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [text: string]
  clear: []
}>()

const { statusOf, loadFull } = useFontLoading()

const draft = ref('')

// 每次打开都从当前生效内容回填，避免上次未应用的草稿意外覆盖
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) draft.value = props.current ?? ''
  },
  { immediate: true },
)

const length = computed(() => draft.value.length)
const overLimit = computed(() => length.value > CUSTOM_TEXT_LIMIT)

/** 内容子集覆盖不到的字符数 */
const missingInSubset = computed(() =>
  draft.value.trim() ? countMissingInSubset(props.font.id, draft.value) : 0,
)
/** 连完整字体都覆盖不到的字符数 */
const missingInFull = computed(() =>
  draft.value.trim() ? countMissingInFull(props.font.id, draft.value) : 0,
)

const loadStatus = computed(() => statusOf(props.font.id))
const canLoadFull = computed(() => missingInSubset.value > 0 && loadStatus.value === 'idle')
const isLoading = computed(() => loadStatus.value === 'loading')
const isReady = computed(() => loadStatus.value === 'ready')
const isError = computed(() => loadStatus.value === 'error')

async function requestFull() {
  await loadFull(props.font)
}

function apply() {
  emit('apply', draft.value)
  emit('update:open', false)
}

function clear() {
  emit('clear')
  emit('update:open', false)
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="题写 · 自定文字"
    description="写下你自己的文字，立即以当前字体与版式呈现。空行分段。"
    @update:open="(v) => emit('update:open', v)"
  >
    <label for="draft-text" class="zz-sr-only">题写内容</label>
    <textarea
      id="draft-text"
      v-model="draft"
      class="field"
      rows="8"
      :maxlength="CUSTOM_TEXT_LIMIT + 200"
      placeholder="山有木兮木有枝，心悦君兮君不知。"
      :aria-invalid="overLimit || undefined"
      :aria-describedby="overLimit ? 'draft-warn' : undefined"
    />

    <div class="meta">
      <span class="meta__count" :class="{ 'is-over': overLimit }">
        {{ length }} / {{ CUSTOM_TEXT_LIMIT }}
      </span>
      <span class="meta__font">当前字体：{{ props.font.name }}</span>
    </div>

    <p v-if="overLimit" id="draft-warn" class="warn" role="alert">
      超出 {{ CUSTOM_TEXT_LIMIT }} 字上限，超出的部分不会被应用。
    </p>

    <!-- 缺字提示：这是「完整字体」策略对用户唯一可见的地方 -->
    <section v-if="missingInSubset > 0" class="glyph-notice" aria-live="polite">
      <template v-if="isReady">
        <p class="glyph-notice__title">完整字形已加载</p>
        <p class="glyph-notice__text">
          这段文字里的 {{ missingInSubset }} 个生僻字现在也能以
          {{ props.font.name }} 呈现了。
        </p>
      </template>

      <template v-else-if="isLoading">
        <p class="glyph-notice__title">正在加载完整字形…</p>
        <p class="glyph-notice__text">
          {{ props.font.name }}的完整版本约 {{ props.font.assets?.fullSizeLabel }}，请稍候。
        </p>
      </template>

      <template v-else-if="isError">
        <p class="glyph-notice__title">完整字形加载失败</p>
        <p class="glyph-notice__text">
          文字仍可正常阅读，其中 {{ missingInSubset }} 个生僻字会以系统字体显示。
          你可以重试，或换一款字体。
        </p>
        <button type="button" class="glyph-notice__action" @click="requestFull">重试</button>
      </template>

      <template v-else>
        <p class="glyph-notice__title">
          这段文字里有 {{ missingInSubset }} 个字不在
          {{ props.font.name }}的默认字形中
        </p>
        <p class="glyph-notice__text">
          它们会用系统字体显示，与前后字形略有差异。加载完整字体（约
          {{ props.font.assets?.fullSizeLabel }}）后即可统一。
        </p>
        <button
          v-if="canLoadFull"
          type="button"
          class="glyph-notice__action"
          @click="requestFull"
        >
          加载完整字形
        </button>
      </template>
    </section>

    <p v-if="missingInFull > 0" class="glyph-notice glyph-notice--soft">
      有 {{ missingInFull }} 个字连完整字体也未收录（超出 GB2312 范围）。
      这部分文字会以系统字体显示，无法统一。
    </p>

    <template #footer>
      <div class="actions">
        <button type="button" class="action action--primary" :disabled="!draft.trim()" @click="apply">
          应用到书页
        </button>
        <button type="button" class="action" @click="clear">恢复古文</button>
      </div>
    </template>
  </StudioPanel>
</template>

<style scoped lang="scss">
.field {
  width: 100%;
  min-height: 190px;
  padding: 15px 16px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  background: var(--zz-paper-field);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-md);
  line-height: 2;
  letter-spacing: 0.02em;
  color: var(--zz-ink-body);
  resize: vertical;

  &::placeholder {
    color: var(--zz-muted-soft);
    opacity: 0.7;
  }

  &:focus-visible {
    outline: var(--zz-focus-ring);
    outline-offset: 1px;
    border-color: var(--zz-accent);
  }

  &[aria-invalid='true'] {
    border-color: var(--zz-accent);
  }
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: var(--zz-text-2xs);
  letter-spacing: var(--zz-track-tight);
  color: var(--zz-muted);

  &__count {
    font-variant-numeric: tabular-nums;

    &.is-over {
      color: var(--zz-accent);
    }
  }
}

.warn {
  margin-top: 8px;
  font-size: var(--zz-text-2xs);
  line-height: 1.8;
  color: var(--zz-accent);
}

.glyph-notice {
  margin-top: 20px;
  padding: 15px 16px;
  border: 1px solid var(--zz-line);
  border-left: 2px solid var(--zz-accent-line);
  border-radius: var(--zz-radius-sm);
  background: var(--zz-accent-wash);

  &--soft {
    border-left-color: var(--zz-line-strong);
    background: var(--zz-paper-raised);
    font-size: var(--zz-text-2xs);
    line-height: 1.9;
    color: var(--zz-muted);
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    line-height: 1.7;
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__text {
    margin-top: 6px;
    font-size: var(--zz-text-2xs);
    line-height: 1.9;
    color: var(--zz-muted);
  }

  &__action {
    margin-top: 12px;
    padding: 8px 16px;
    border: 1px solid var(--zz-accent);
    border-radius: var(--zz-radius-xs);
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-xs);
    letter-spacing: var(--zz-track-normal);
    color: var(--zz-accent);
    transition:
      background-color var(--zz-dur-fast) var(--zz-ease-out),
      color var(--zz-dur-fast) var(--zz-ease-out);

    &:hover {
      background: var(--zz-accent);
      color: var(--zz-paper-ui);
    }
  }
}

.actions {
  display: flex;
  gap: 10px;
}

.action {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-xs);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  letter-spacing: var(--zz-track-normal);
  color: var(--zz-muted);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out),
    color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-accent);
    color: var(--zz-accent);
  }

  &--primary {
    border-color: var(--zz-accent);
    background: var(--zz-accent);
    color: var(--zz-paper-ui);

    &:hover {
      background: #8a4a3e;
      color: var(--zz-paper-ui);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--zz-accent);
      color: var(--zz-paper-ui);
    }
  }
}
</style>
