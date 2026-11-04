<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import { CUSTOM_TEXT_LIMIT } from '@/composables/useReadingState'
import { countMissingInFont, useFontLoading } from '@/composables/useFontLoading'

/**
 * 题写面板。
 *
 * 核心职责：
 * 1. 接受标题、作者与正文输入（永远以文本节点渲染，不拼 innerHTML）；
 * 2. 检测当前字体能否完整显示这段文字 —— 包含标题、作者与正文，缺字时提示并可一键加载完整字体。
 */

const props = defineProps<{
  open: boolean
  font: FontEntryWithAssets
  /** 当前生效的题写内容，打开面板时回填 */
  current: string | null
  currentTitle?: string | null
  currentAuthor?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [content: string, title?: string, author?: string]
  clear: []
}>()

const { statusOf, loadFull } = useFontLoading()

const draft = ref('')
const draftTitle = ref('')
const draftAuthor = ref('')

// 每次打开都从当前生效内容回填，避免上次未应用的草稿意外覆盖
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      draft.value = props.current ?? ''
      draftTitle.value = props.currentTitle ?? ''
      draftAuthor.value = props.currentAuthor ?? ''
    }
  },
  { immediate: true },
)

const length = computed(() => draft.value.length)
const overLimit = computed(() => length.value > CUSTOM_TEXT_LIMIT)

/** 原字体未收录的字符数（基于母本真实 cmap，覆盖标题、作者与正文） */
const missingInFont = computed(() => {
  const combined = (draftTitle.value + draftAuthor.value + draft.value).trim()
  return combined ? countMissingInFont(props.font.id, combined) : 0
})

const loadStatus = computed(() => statusOf(props.font.id))
const isLoading = computed(() => loadStatus.value === 'loading')
const isError = computed(() => loadStatus.value === 'error')

async function requestFull() {
  await loadFull(props.font)
}

function apply() {
  emit('apply', draft.value, draftTitle.value.trim(), draftAuthor.value.trim())
  emit('update:open', false)
}

function clear() {
  draftTitle.value = ''
  draftAuthor.value = ''
  draft.value = ''
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
    <div class="writing-form">
      <!-- 篇名与作者题署输入框 -->
      <div class="form-row">
        <div class="form-field">
          <label for="draft-title" class="field-label">篇名 / 标题</label>
          <input
            id="draft-title"
            v-model="draftTitle"
            type="text"
            class="field field--input"
            maxlength="50"
            placeholder="如：无题、秋兴"
            aria-label="题写篇名"
          />
        </div>

        <div class="form-field">
          <label for="draft-author" class="field-label">题署 / 作者</label>
          <input
            id="draft-author"
            v-model="draftAuthor"
            type="text"
            class="field field--input"
            maxlength="30"
            placeholder="如：你的名字或雅号"
            aria-label="题写作者"
          />
        </div>
      </div>

      <!-- 正文输入框 -->
      <div class="form-field">
        <div class="field-label-row">
          <label for="draft-text" class="field-label">正文内容</label>
          <span class="field-hint">空行分段</span>
        </div>
        <textarea
          id="draft-text"
          v-model="draft"
          class="field field--textarea"
          rows="8"
          :maxlength="CUSTOM_TEXT_LIMIT + 200"
          placeholder="山有木兮木有枝，心悦君兮君不知。"
          :aria-invalid="overLimit || undefined"
          :aria-describedby="overLimit ? 'draft-warn' : undefined"
        />
      </div>
    </div>

    <div class="meta">
      <span class="meta__count" :class="{ 'is-over': overLimit }">
        {{ length }} / {{ CUSTOM_TEXT_LIMIT }}
      </span>
      <span class="meta__font">当前字体：{{ props.font.name }}</span>
    </div>

    <p v-if="overLimit" id="draft-warn" class="warn" role="alert">
      超出 {{ CUSTOM_TEXT_LIMIT }} 字上限，超出的部分不会被应用。
    </p>

    <!-- 缺字与字体加载提示 -->
    <section v-if="isError" class="glyph-notice" aria-live="polite">
      <p class="glyph-notice__title">字体加载失败</p>
      <p class="glyph-notice__text">
        文字仍可正常阅读，将以系统字体显示。你可以重试，或换一款字体。
      </p>
      <button type="button" class="glyph-notice__action" @click="requestFull">重试加载</button>
    </section>

    <section v-else-if="isLoading" class="glyph-notice" aria-live="polite">
      <p class="glyph-notice__title">正在加载字体…</p>
      <p class="glyph-notice__text">
        {{ props.font.name }}约 {{ props.font.assets?.fullSizeLabel }}，请稍候。
      </p>
    </section>

    <section v-if="missingInFont > 0" class="glyph-notice glyph-notice--soft" aria-live="polite">
      <p class="glyph-notice__title">
        这段文字里有 {{ missingInFont }} 个字不在 {{ props.font.name }} 的收录范围内
      </p>
      <p class="glyph-notice__text">
        连完整字体也未收录（超出原字体字符库）。这部分文字会以系统衬线字体显示，无法完全统一。
      </p>
    </section>

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
@use '@/styles/breakpoints' as bp;

.writing-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-xs);
  letter-spacing: var(--zz-track-tight);
  color: var(--zz-muted);
}

.field-hint {
  font-size: var(--zz-text-2xs);
  letter-spacing: var(--zz-track-tight);
  color: var(--zz-muted-soft);
}

.field {
  width: 100%;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  background: var(--zz-paper-field);
  font-family: var(--zz-font-serif);
  font-size: var(--zz-text-sm);
  color: var(--zz-ink-body);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    box-shadow var(--zz-dur-fast) var(--zz-ease-out);

  &::placeholder {
    color: var(--zz-muted-soft);
    opacity: 0.7;
    font-size: var(--zz-text-xs);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--zz-accent);
    box-shadow: 0 0 0 3px var(--zz-accent-wash);
  }

  &--input {
    height: 38px;
    padding: 0 12px;
  }

  &--textarea {
    min-height: 180px;
    padding: 14px 16px;
    line-height: 2;
    letter-spacing: 0.02em;
    resize: vertical;

    &[aria-invalid='true'] {
      border-color: var(--zz-accent);
    }
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

@include bp.below(bp.$bp-mobile) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
