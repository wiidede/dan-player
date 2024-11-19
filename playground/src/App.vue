<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { DanPlayer } from 'dan-player'
import { demoComments } from './demo-comments'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <main class="m-auto prose">
    <div class="flex items-center">
      <img src="/favicon.svg" alt="Dan Player Logo" width="100px" height="100px">
      <h1 class="text-4xl font-serif dark:text-zinc-50">
        Dan Player
      </h1>
    </div>
    <div class="flex flex-col gap-12">
      <!-- TODO: 替换成mkv -->
      <DanPlayer src="/demo.mp4" :comments="demoComments" />
    </div>
  </main>
  <footer class="m-auto mt8 prose">
    <button icon-btn title="toggle dark mode" @click="toggleDark()">
      <div i="carbon-sun dark:carbon-moon" />
    </button>
    <div class="flex gap4">
      <a href="https://github.com/wiidede/dan-player" target="_blank">GitHub</a>
      <a href="https://github.com/wiidede/dan-player/blob/main/playground/src/App.vue" target="_blank">Demo Source</a>
    </div>
    <div class="text-sm">
      <a href="https://github.com/wiidede/dan-player/blob/main/LICENSE">MIT</a> License © 2024-PRESENT <a href="https://github.com/wiidede">wiidede</a>
    </div>
  </footer>
</template>

<style scoped>
a {
  --at-apply: underline decoration-zinc-400/50 after: content-[ '↗'] after: text-0.8em after: op67;
}
</style>
