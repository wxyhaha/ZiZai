<script setup lang="ts">
import { computed, ref } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { TextCategory, TextEntry } from '@/types/text'
import type { CharVariant } from '@/types/reading'
import { textCategories } from '@/data/texts'
import { toSimplified, toTraditional } from '@/utils/hanziConvert'

/**
 * 典籍阁 · 华夏文选大模态弹窗。
 *
 * 汇聚百篇教育部审定与善本底本古文正典，支持：
 * 1. 即时检索：篇名、作者、朝代、一句话题解及正文千古名句（简繁双向通搜）；
 * 2. 多维分类：朝代（先秦两汉、魏晋、唐代、宋元、明清现代）、体裁（诗词赋散文）、篇幅（短/中/长）；
 * 3. 统计反馈：即时动态篇数统计与一键重置；
 * 4. 典籍卡片：自适应多列网格，含朝代体裁徽标、总字数微标及在阅朱砂印章。
 */

const props = withDefaults(
  defineProps<{
    open: boolean
    texts: TextEntry[]
    selectedId: string | null
    /** 是否处于题写模式（此时没有内置文稿被选中） */
    isCustom: boolean
    /** 繁简体字式规范，默认繁体 */
    charVariant?: CharVariant
  }>(),
  {
    charVariant: 'traditional',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [textId: string]
  write: []
}>()

// 检索关键词与筛选维度
const searchQuery = ref('')
const selectedEra = ref<'all' | '先秦两汉' | '魏晋' | '唐代' | '宋元' | '明清现代'>('all')
const selectedCategory = ref<'all' | TextCategory>('all')
const selectedLength = ref<'all' | 'short' | 'medium' | 'long'>('all')

const eraOptions = [
  { label: '全部朝代', value: 'all' as const },
  { label: '先秦两汉', value: '先秦两汉' as const },
  { label: '魏晋南北', value: '魏晋' as const },
  { label: '隋唐五代', value: '唐代' as const },
  { label: '两宋金元', value: '宋元' as const },
  { label: '明清现代', value: '明清现代' as const },
]

const categoryOptions = [
  { label: '全媒体裁', value: 'all' as const },
  { label: '诗歌', value: '诗' as const },
  { label: '词曲', value: '词' as const },
  { label: '辞赋', value: '赋' as const },
  { label: '散文', value: '散文' as const },
  { label: '其他', value: '其他' as const },
]

const lengthOptions = [
  { label: '全部篇幅', value: 'all' as const },
  { label: '短制 (<150字)', value: 'short' as const },
  { label: '中篇 (150-600字)', value: 'medium' as const },
  { label: '鸿篇 (>600字)', value: 'long' as const },
]

const hasActiveFilter = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedEra.value !== 'all' ||
    selectedCategory.value !== 'all' ||
    selectedLength.value !== 'all'
  )
})

function resetFilters() {
  searchQuery.value = ''
  selectedEra.value = 'all'
  selectedCategory.value = 'all'
  selectedLength.value = 'all'
}

function displayTitle(text: TextEntry) {
  if (props.charVariant === 'simplified') return text.title
  return text.titleTrad || text.title
}

function displayAuthor(text: TextEntry) {
  if (props.charVariant === 'simplified') return text.author
  return text.authorTrad || text.author
}

function displaySummary(text: TextEntry) {
  if (!text.summary) return ''
  if (props.charVariant === 'simplified') return text.summary
  return text.summaryTrad || text.summary
}

// 统一过滤逻辑（含简繁双向通搜）
const filteredTexts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const queryTrad = query ? toTraditional(query).toLowerCase() : ''
  const querySimp = query ? toSimplified(query).toLowerCase() : ''

  return props.texts.filter((text) => {
    // 1. 朝代维度
    if (selectedEra.value !== 'all' && text.eraGroup !== selectedEra.value) {
      return false
    }

    // 2. 体裁维度
    if (selectedCategory.value !== 'all' && text.category !== selectedCategory.value) {
      return false
    }

    // 3. 篇幅维度
    if (selectedLength.value !== 'all' && text.lengthTier !== selectedLength.value) {
      return false
    }

    // 4. 检索关键词通搜
    if (query) {
      const matchString = (field?: string) => {
        if (!field) return false
        const lower = field.toLowerCase()
        return lower.includes(query) || lower.includes(queryTrad) || lower.includes(querySimp)
      }

      const hit =
        matchString(text.title) ||
        matchString(text.titleTrad) ||
        matchString(text.author) ||
        matchString(text.authorTrad) ||
        matchString(text.era) ||
        matchString(text.eraGroup) ||
        matchString(text.summary) ||
        matchString(text.summaryTrad) ||
        text.paragraphs.some(matchString) ||
        (text.paragraphsTrad && text.paragraphsTrad.some(matchString))

      if (!hit) return false
    }

    return true
  })
})

// 分组渲染（保持按分类组织，兼顾测试契约与结构清晰）
const groups = computed(() => {
  const targetCategories =
    selectedCategory.value === 'all'
      ? textCategories
      : textCategories.filter((c) => c === selectedCategory.value)

  return targetCategories
    .map((category) => ({
      category,
      items: filteredTexts.value.filter((t) => t.category === category),
    }))
    .filter((g) => g.items.length > 0)
})

function choose(id: string) {
  emit('select', id)
  emit('update:open', false)
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="典籍阁 · 华夏文选"
    description="汇聚百篇华夏正典，经教育部统编教材与历代善本权威核校。支持多维分类筛选与正文名句通搜。"
    variant="modal"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #title-extra>
      <span class="picker-header-badge">百篇正典 · 简繁双轨</span>
    </template>

    <div class="picker-toolbar">
      <!-- 搜索框 -->
      <div class="picker-search">
        <span class="picker-search__icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          class="picker-search__input"
          placeholder="搜索篇名、作者、朝代、名句（如“水波不兴”“一蓑烟雨”）..."
          aria-label="搜索典籍"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="picker-search__clear"
          aria-label="清空搜索词"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- 多维分类胶囊组 -->
      <div class="picker-filters">
        <!-- 朝代筛选 -->
        <div class="filter-row" role="radiogroup" aria-label="朝代筛选">
          <span class="filter-row__label">朝代：</span>
          <div class="filter-row__chips">
            <button
              v-for="opt in eraOptions"
              :key="opt.value"
              type="button"
              class="filter-chip"
              :class="{ 'is-active': selectedEra === opt.value }"
              :aria-pressed="selectedEra === opt.value"
              @click="selectedEra = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 体裁筛选 -->
        <div class="filter-row" role="radiogroup" aria-label="体裁筛选">
          <span class="filter-row__label">体裁：</span>
          <div class="filter-row__chips">
            <button
              v-for="opt in categoryOptions"
              :key="opt.value"
              type="button"
              class="filter-chip"
              :class="{ 'is-active': selectedCategory === opt.value }"
              :aria-pressed="selectedCategory === opt.value"
              @click="selectedCategory = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 篇幅筛选 -->
        <div class="filter-row" role="radiogroup" aria-label="篇幅筛选">
          <span class="filter-row__label">篇幅：</span>
          <div class="filter-row__chips">
            <button
              v-for="opt in lengthOptions"
              :key="opt.value"
              type="button"
              class="filter-chip"
              :class="{ 'is-active': selectedLength === opt.value }"
              :aria-pressed="selectedLength === opt.value"
              @click="selectedLength = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 统计栏与重置操作 -->
      <div class="picker-status">
        <span class="picker-status__info">
          共收录 <em>{{ props.texts.length }}</em> 篇典籍
          <template v-if="hasActiveFilter">
            · 筛选得 <em>{{ filteredTexts.length }}</em> 篇
          </template>
        </span>
        <button
          v-if="hasActiveFilter"
          type="button"
          class="picker-status__reset"
          @click="resetFilters"
        >
          重置全部筛选
        </button>
      </div>
    </div>

    <!-- 题写模式入口 -->
    <button
      type="button"
      class="write-entry"
      :class="{ 'is-active': props.isCustom }"
      @click="emit('write')"
    >
      <div class="write-entry__content">
        <span class="write-entry__label">题写自己的文字</span>
        <span class="write-entry__hint">输入任意诗文或断想，即刻以当前书体与宣纸成页</span>
      </div>
      <span class="write-entry__badge" aria-hidden="true">自定义</span>
    </button>

    <!-- 空状态提示 -->
    <div v-if="filteredTexts.length === 0" class="picker-empty">
      <div class="picker-empty__mark" aria-hidden="true">📜</div>
      <p class="picker-empty__title">烟水茫茫，未寻得相关典籍</p>
      <p class="picker-empty__hint">可尝试简化搜索字词，或重置筛选维度重新浏览</p>
      <button type="button" class="picker-empty__btn" @click="resetFilters">
        清空筛选条件
      </button>
    </div>

    <!-- 典籍卡片分组列表 -->
    <section v-for="group in groups" :key="group.category" class="group">
      <h3 class="group__title">
        <span class="group__title-text">{{ group.category }}</span>
        <span class="group__count">{{ group.items.length }} 篇</span>
      </h3>

      <ul class="group__list">
        <li v-for="text in group.items" :key="text.id" class="group__item">
          <button
            type="button"
            class="text-item"
            :class="{ 'is-active': !props.isCustom && text.id === props.selectedId }"
            :aria-pressed="!props.isCustom && text.id === props.selectedId"
            @click="choose(text.id)"
          >
            <div class="text-item__badges">
              <span v-if="text.era" class="badge badge--era">{{ text.era }}</span>
              <span class="badge badge--cat">{{ text.category }}</span>
              <span v-if="text.charCount" class="badge badge--count">{{ text.charCount }}字</span>
            </div>

            <div class="text-item__main">
              <div class="text-item__title-row">
                <span class="text-item__title">{{ displayTitle(text) }}</span>
                <!-- 在阅朱砂小印章 -->
                <span
                  v-if="!props.isCustom && text.id === props.selectedId"
                  class="seal-badge"
                  aria-label="当前阅读"
                >
                  在閱
                </span>
              </div>

              <div class="text-item__meta">
                <span v-if="text.era">{{ text.era }} · </span>
                <span>{{ displayAuthor(text) }}</span>
              </div>

              <p v-if="text.summary" class="text-item__summary">
                {{ displaySummary(text) }}
              </p>
            </div>

            <span class="text-item__mark" aria-hidden="true">
              {{ !props.isCustom && text.id === props.selectedId ? '●' : '↗' }}
            </span>
          </button>
        </li>
      </ul>
    </section>
  </StudioPanel>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.picker-header-badge {
  font-size: var(--zz-text-2xs);
  padding: 3px 8px;
  border-radius: var(--zz-radius-sm);
  background: var(--zz-paper-deep);
  border: 1px solid var(--zz-line);
  color: var(--zz-muted);
  letter-spacing: var(--zz-track-tight);
}

.picker-toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--zz-line);
}

.picker-search {
  position: relative;
  display: flex;
  align-items: center;

  &__icon {
    position: absolute;
    left: 14px;
    font-size: 13px;
    color: var(--zz-muted);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    height: 42px;
    padding: 0 38px 0 38px;
    font-size: var(--zz-text-sm);
    font-family: var(--zz-font-serif);
    color: var(--zz-ink);
    background: var(--zz-paper-raised);
    border: 1px solid var(--zz-line);
    border-radius: var(--zz-radius-md);
    outline: none;
    transition:
      border-color var(--zz-dur-fast) var(--zz-ease-out),
      box-shadow var(--zz-dur-fast) var(--zz-ease-out);

    &::placeholder {
      color: var(--zz-muted);
      opacity: 0.7;
      font-size: var(--zz-text-xs);
    }

    &:focus {
      border-color: var(--zz-accent);
      box-shadow: 0 0 0 3px var(--zz-accent-wash);
    }
  }

  &__clear {
    position: absolute;
    right: 12px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--zz-paper-deep);
    color: var(--zz-muted);
    font-size: 11px;
    cursor: pointer;

    &:hover {
      color: var(--zz-ink);
      background: var(--zz-line);
    }
  }
}

.picker-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--zz-text-xs);

  &__label {
    flex: none;
    width: 44px;
    color: var(--zz-muted);
    letter-spacing: var(--zz-track-tight);
    text-align: right;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.filter-chip {
  padding: 3px 10px;
  font-size: var(--zz-text-2xs);
  font-family: inherit;
  color: var(--zz-muted);
  background: var(--zz-paper-raised);
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-sm);
  cursor: pointer;
  transition: all var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    color: var(--zz-ink);
    border-color: var(--zz-line-strong);
  }

  &.is-active {
    color: var(--zz-paper-ui);
    background: var(--zz-ink);
    border-color: var(--zz-ink);
  }
}

.picker-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 0;
  font-size: var(--zz-text-2xs);
  color: var(--zz-muted);

  &__info em {
    font-style: normal;
    color: var(--zz-ink);
    font-weight: 500;
  }

  &__reset {
    background: none;
    border: none;
    color: var(--zz-accent);
    cursor: pointer;
    font-size: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;

    &:hover {
      opacity: 0.8;
    }
  }
}

.write-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 24px;
  text-align: left;
  border: 1px dashed var(--zz-line-strong);
  border-radius: var(--zz-radius-md);
  background: transparent;
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover,
  &.is-active {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__label {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-accent);
  }

  &__hint {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__badge {
    flex: none;
    font-size: var(--zz-text-2xs);
    padding: 3px 8px;
    border-radius: var(--zz-radius-sm);
    background: var(--zz-paper-raised);
    border: 1px solid var(--zz-line);
    color: var(--zz-muted);
  }
}

.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  &__mark {
    font-size: 36px;
    margin-bottom: 12px;
    opacity: 0.7;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-base);
    color: var(--zz-ink);
    margin-bottom: 6px;
  }

  &__hint {
    font-size: var(--zz-text-xs);
    color: var(--zz-muted);
    margin-bottom: 16px;
  }

  &__btn {
    padding: 6px 16px;
    font-size: var(--zz-text-xs);
    color: var(--zz-paper-ui);
    background: var(--zz-ink);
    border: none;
    border-radius: var(--zz-radius-sm);
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.85;
    }
  }
}

.group {
  & + & {
    margin-top: 30px;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--zz-line);
    margin-bottom: 14px;
  }

  &__title-text {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    font-weight: 500;
    letter-spacing: var(--zz-track-wide);
    color: var(--zz-ink);
  }

  &__count {
    font-size: var(--zz-text-2xs);
    color: var(--zz-muted);
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 12px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__item {
    display: flex;
  }
}

.text-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-md);
  background: var(--zz-paper-raised);
  cursor: pointer;
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out),
    transform 0.1s ease;

  &:hover {
    border-color: var(--zz-line-strong);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
    box-shadow: 0 0 0 1px var(--zz-accent);
  }

  &__badges {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .badge {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 3px;
    line-height: 1.4;

    &--era {
      color: var(--zz-ink);
      background: var(--zz-paper-deep);
      border: 1px solid var(--zz-line);
    }

    &--cat {
      color: var(--zz-muted);
      background: var(--zz-paper-ui);
    }

    &--count {
      color: var(--zz-muted);
      margin-left: auto;
      font-size: 10px;
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-md);
    font-weight: 500;
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__meta {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__summary {
    font-size: var(--zz-text-2xs);
    line-height: 1.6;
    color: var(--zz-muted-soft);
    margin: 4px 0 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__mark {
    position: absolute;
    right: 12px;
    bottom: 10px;
    font-size: var(--zz-text-xs);
    color: var(--zz-line-strong);
  }

  &.is-active &__mark {
    color: var(--zz-accent);
  }
}

/* 朱砂在阅印章 */
.seal-badge {
  flex: none;
  font-family: var(--zz-font-serif);
  font-size: 11px;
  color: #ab3b2a;
  border: 1px solid rgba(171, 59, 42, 0.45);
  background: rgba(171, 59, 42, 0.08);
  padding: 1px 5px;
  border-radius: 2px;
  letter-spacing: 1px;
  line-height: 1.2;
}

@include bp.below(bp.$bp-mobile) {
  .picker-filters {
    gap: 6px;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    &__label {
      width: auto;
      text-align: left;
    }
  }

  .group__list {
    grid-template-columns: 1fr;
  }
}
</style>
