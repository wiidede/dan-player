<script setup lang="ts">
import type { ICommentCCL } from '../../src/type'
import { useDark, useToggle } from '@vueuse/core'
import { demoComments } from './demo-comments'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const src = ref<Blob>()
const comments = ref<ICommentCCL[]>()

const locale = ref<'zh' | 'en'>('zh')

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    src.value = input.files[0]
  }
}

fetch('/dan-player-demo.mkv')
  .then(response => response.blob())
  .then((blob) => {
    setTimeout(() => {
      src.value = blob
    }, 1000)
  })

setTimeout(() => {
  comments.value = demoComments
}, 2000)
</script>

<template>
  <main class="m-auto prose">
    <div class="flex items-center">
      <img src="/favicon.svg" alt="Dan Player Logo" width="100px" height="100px">
      <h1 class="text-4xl font-serif dark:text-zinc-50">
        Dan Player
      </h1>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <label class="btn">
          上传本地视频
          <input
            type="file"
            accept="video/*,.mkv,video/x-matroska"
            class="hidden"
            @change="handleFileUpload"
          >
        </label>
      </div>
      <DanPlayer :src="src" :comments="comments" autoplay-on-comment-load :locale="locale" />
    </div>
    <div class="flex gap-2 py-2">
      <button class="btn" @click="locale = 'zh'">
        中文
      </button>
      <button class="btn" @click="locale = 'en'">
        English
      </button>
    </div>
  </main>
  <footer class="m-auto mt4 prose">
    <button class="btn mb-2" title="toggle dark mode" @click="toggleDark()">
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
  --at-apply: link;
}
</style>
