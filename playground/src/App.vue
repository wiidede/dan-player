<script setup lang="ts">
import type { DanPlayer } from '@wiidede/dan-player'
import type { ICommentCCL } from '../../src/type'
import { useCssVar, useDark, useToggle } from '@vueuse/core'
import { ref } from 'vue'
import { demoComments } from './demo-comments'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const primaryColor = useCssVar('--el-color-primary', document.body)

const src = ref<Blob>()
const comments = ref<ICommentCCL[]>()
const playerRef = ref<InstanceType<typeof DanPlayer>>()

const locale = ref<'zh' | 'en'>('zh')
const colors = ['#409eff', '#ff99c8'] as const

async function handleSendComment(text: string) {
  await new Promise(resolve => setTimeout(resolve, 300))
  playerRef.value?.addSelfComment(text)
}

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
  <main class="m-auto prose dark:prose-invert">
    <div class="flex items-center">
      <img src="/favicon.svg" alt="Dan Player Logo" width="100px" height="100px">
      <h1 class="m-0 text-4xl font-serif dark:text-zinc-50">
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
      <DanPlayer
        ref="playerRef"
        :src="src"
        :comments="comments"
        autoplay-on-comment-load
        :locale="locale"
        show-comment-sender
        @send-comment="handleSendComment"
      />
    </div>
    <div class="flex gap-2 py-2">
      <button class="btn" @click="locale = 'zh'">
        中文
      </button>
      <button class="btn" @click="locale = 'en'">
        English
      </button>
      <button
        v-for="color in colors"
        :key="color"
        class="btn"
        :style="{ color }"
        @click="primaryColor = color"
      >
        {{ color }}
      </button>
      <button class="btn" title="toggle dark mode" @click="toggleDark()">
        <div i="carbon-sun dark:carbon-moon" />
      </button>
    </div>
  </main>
  <footer class="m-auto mt4 prose dark:prose-invert">
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
