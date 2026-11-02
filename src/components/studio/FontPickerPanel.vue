<script setup lang="ts">
import { computed } from 'vue'
import StudioPanel from './StudioPanel.vue'
import type { FontEntryWithAssets } from '@/data/fonts'
import { useFontLoading } from '@/composables/useFontLoading'

/** 字体图鉴：字形预览卡 + 授权标识 + 字体故事。 */

const props = defineProps<{
  open: boolean
  fonts: FontEntryWithAssets[]
  selectedId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [fontId: string]
}>()

const { statusOf } = useFontLoading()

const verifiedCount = computed(
  () => props.fonts.filter((f) => f.licenseStatus === 'verified').length,
)

const lede = computed(
  () =>
    `挑选字形，感受不同笔意与气韵。已收录 ${props.fonts.length} 款，其中 ${verifiedCount.value} 款来源与授权已核实，字体文件随站分发。`,
)

function choose(id: string) {
  emit('select', id)
  emit('update:open', false)
}

function statusLabel(font: FontEntryWithAssets): string {
  if (font.licenseStatus !== 'verified') return '示意'
  const s = statusOf(font.id)
  if (s === 'loading') return '字形加载中'
  if (s === 'ready') return '完整字形已就绪'
  return '已核实'
}
</script>

<template>
  <StudioPanel
    :open="props.open"
    title="择字 · 字体图鉴"
    :description="lede"
    @update:open="(v) => emit('update:open', v)"
  >
    <ul class="font-list">
      <li v-for="font in props.fonts" :key="font.id">
        <button
          type="button"
          class="font-card"
          :class="{ 'is-active': font.id === props.selectedId }"
          :aria-pressed="font.id === props.selectedId"
          @click="choose(font.id)"
        >
          <span class="font-card__main">
            <span class="font-card__name">{{ font.name }}</span>
            <span class="font-card__tags">{{ font.tags.join(' · ') }}</span>
            <span
              class="font-card__badge"
              :class="font.licenseStatus === 'verified' ? 'is-ok' : 'is-demo'"
            >
              {{ statusLabel(font) }}
            </span>
          </span>

          <!-- 预览字用该字体自身渲染；未核实的字体用系统回退栈 -->
          <span class="font-card__sample" :style="{ fontFamily: font.family }" aria-hidden="true">
            {{ font.sample }}
          </span>

          <span class="zz-sr-only">
            {{ font.description }}{{ font.licenseName ? ` 授权：${font.licenseName}。` : '' }}
          </span>
        </button>
      </li>
    </ul>

    <section class="font-story" aria-labelledby="font-story-title">
      <h3 id="font-story-title" class="font-story__title">字体来源</h3>
      <dl class="font-story__list">
        <template v-for="font in props.fonts" :key="font.id">
          <div class="font-story__row">
            <dt>{{ font.name }}</dt>
            <dd>
              <span v-if="font.author">{{ font.author }} </span>
              <span v-if="font.licenseName">· {{ font.licenseName }}</span>
              <a
                v-if="font.sourceUrl"
                class="font-story__link"
                :href="font.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                来源
              </a>
            </dd>
          </div>
        </template>
      </dl>
      <p class="font-story__note">
        所有随站分发的字体文件都经过授权核实，核对记录见项目的
        <code>docs/font-licenses.md</code>。
      </p>
    </section>
  </StudioPanel>
</template>

<style scoped lang="scss">
.font-list {
  display: grid;
  gap: 12px;
}

.font-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  border: 1px solid var(--zz-line);
  border-radius: var(--zz-radius-lg);
  background: var(--zz-paper-raised);
  transition:
    border-color var(--zz-dur-fast) var(--zz-ease-out),
    background-color var(--zz-dur-fast) var(--zz-ease-out);

  &:hover {
    border-color: var(--zz-line-strong);
  }

  &.is-active {
    border-color: var(--zz-accent);
    background: var(--zz-accent-wash);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
  }

  &__name {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-lg);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-ink);
  }

  &__tags {
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);
    color: var(--zz-muted);
  }

  &__badge {
    align-self: flex-start;
    padding: 2px 7px;
    border-radius: var(--zz-radius-xs);
    font-size: var(--zz-text-2xs);
    letter-spacing: var(--zz-track-tight);

    &.is-ok {
      background: var(--zz-paper-deep);
      color: var(--zz-ink-soft);
    }

    &.is-demo {
      background: var(--zz-accent-soft);
      color: var(--zz-accent);
    }
  }

  /* 两个字的大字形是这张卡的主角 */
  &__sample {
    flex: none;
    font-size: 30px;
    line-height: 1.2;
    letter-spacing: 0.02em;
    color: var(--zz-ink);
    white-space: nowrap;
  }
}

.font-story {
  margin-top: 30px;
  padding-top: 22px;
  border-top: 1px solid var(--zz-line);

  &__title {
    font-family: var(--zz-font-serif);
    font-size: var(--zz-text-sm);
    font-weight: 400;
    letter-spacing: var(--zz-track-wide);
    color: var(--zz-muted);
    margin-bottom: 14px;
  }

  &__row {
    display: grid;
    grid-template-columns: 84px 1fr;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--zz-line-soft);
    font-size: var(--zz-text-xs);
    line-height: 1.8;

    dt {
      font-family: var(--zz-font-serif);
      color: var(--zz-ink-soft);
    }

    dd {
      margin: 0;
      color: var(--zz-muted);
    }

    &:last-of-type {
      border-bottom: 0;
    }
  }

  &__link {
    margin-left: 6px;
    color: var(--zz-accent);
    border-bottom: 1px solid var(--zz-accent-line);

    &:hover {
      border-bottom-color: var(--zz-accent);
    }
  }

  &__note {
    margin-top: 16px;
    font-size: var(--zz-text-2xs);
    line-height: 1.9;
    color: var(--zz-muted);

    code {
      font-family: ui-monospace, monospace;
      font-size: 0.95em;
      color: var(--zz-ink-soft);
    }
  }
}
</style>
