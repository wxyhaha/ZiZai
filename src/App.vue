<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import MoreMenu from '@/components/shell/MoreMenu.vue'

const route = useRoute()
</script>

<template>
  <a class="zz-skip-link" href="#main">跳到主要内容</a>

  <div class="app-shell">
    <SiteHeader v-if="route.name !== 'home'" />

    <RouterView v-slot="{ Component }">
      <Transition name="zz-fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <MoreMenu />
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--zz-paper);
}
</style>
