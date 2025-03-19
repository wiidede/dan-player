<script setup lang="ts">
import type { UseMediaTextTrackSource } from '@vueuse/core'
import type { I18nLocale, I18nMessages } from './composables/useI18n'
import type { ICommentCCL } from './type'
import { reactiveOmit, useActiveElement, useFullscreen, useIdle, useMagicKeys, useMediaControls, useMouseInElement, useToggle, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { usePopperContainerId } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { version } from '../package.json'
import { useAss } from './composables/ass'
import { useCCL } from './composables/ccl'
import { useMkvExtractWorker } from './composables/mkvExtract'
import { useI18n } from './composables/useI18n'

const {
  src,
  comments,
  autoplayOnCommentLoad,
  additionalFunctions,
  locale = 'en',
} = defineProps<{
  src?: string | Blob
  comments?: ICommentCCL[]
  autoplayOnCommentLoad?: boolean
  additionalFunctions?: ('loop' | 'picture-in-picture')[]
  locale?: I18nLocale | I18nMessages
}>()

const emit = defineEmits<{
  (e: 'onCommentLoad'): void
}>()

const srcUrl = computed(() => {
  if (src instanceof Blob)
    return URL.createObjectURL(src)
  return src
})

const mkvFile = computed(() => {
  if (src instanceof Blob)
    return src
  return undefined
})

const { subtitleFiles } = useMkvExtractWorker(mkvFile)
const assSubtitleFiles = computed(() => subtitleFiles.value.filter(file => file.type === 'ass'))
const vttSubtitleFiles = computed(() => subtitleFiles.value.filter(file => file.type === 'vtt'))
const vttTracks = computed(() => [
  ...vttSubtitleFiles.value.map((file, index) => {
    const track: UseMediaTextTrackSource = {
      label: file.name,
      kind: 'subtitles',
      src: URL.createObjectURL(new Blob([file.data], { type: 'text/vtt' })),
      srcLang: file.language,
      default: index === 0,
    }
    return track
  }),
])

const videoContainerRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()
const commentRef = ref<HTMLDivElement>()

const {
  playing,
  currentTime,
  duration,
  waiting,
  volume,
  muted,
  isPictureInPicture,
  supportsPictureInPicture,
  togglePictureInPicture,
  tracks,
  selectedTrack,
  rate,
  buffered,
  enableTrack,
  disableTrack,
} = useMediaControls(videoRef, {
  tracks: vttTracks,
})

const currentSubtitleIndex = ref(0)
watch (subtitleFiles, () => {
  currentSubtitleIndex.value = 0
})
const currentSubtitle = computed(() => assSubtitleFiles.value[currentSubtitleIndex.value])

useAss(videoRef, computed(() =>
  currentSubtitle.value && currentSubtitle.value.name.endsWith('.ass')
    ? currentSubtitle.value
    : undefined,
))

// Add subtitle track options
const subtitleOptions = computed(() => [
  { label: 'Off', value: -1 },
  ...(assSubtitleFiles.value?.map((file, index) => ({
    label: file.name || `Subtitle ${index + 1}`,
    value: index,
  })) || []),
])

const onCommentLoad = () => emit('onCommentLoad')
const { showComment, toggleShowComment } = useCCL(
  () => comments,
  () => autoplayOnCommentLoad,
  onCommentLoad,
  videoRef,
  commentRef,
  playing,
  currentTime,
)

const loop = ref(false)

const togglePlay = useToggle(playing)
const { toggle: toggleFullscreen, isFullscreen } = useFullscreen(videoContainerRef)
const { idle: systemIdle } = useIdle(3_000)
const idle = computed(() => systemIdle.value && playing.value)

const volumeAdjustRef = ref<HTMLElement>()
const { isOutside: hideVolumeSlider } = useMouseInElement(volumeAdjustRef)

const endBuffer = computed(() => buffered.value.length > 0 ? buffered.value[buffered.value.length - 1][1] : 0)

const speedOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2 },
  { label: '3.0x', value: 3 },
]

const trackOptions = computed(() => [
  { label: 'Off', value: -1 },
  ...tracks.value.map(track => ({
    label: track.label,
    value: track.id,
  })),
])

watch(selectedTrack, () => {
  if (selectedTrack.value === -1)
    disableTrack()
  else
    enableTrack(tracks.value[selectedTrack.value])
})

function formatDuration(seconds: number) {
  return new Date(1000 * seconds).toISOString().slice(14, 19)
}

// Toast state
const toast = reactive({
  visible: false,
  message: '',
  timer: null as NodeJS.Timeout | null,
})

function showToast(message: string) {
  if (toast.timer)
    clearTimeout(toast.timer)

  toast.message = message
  toast.visible = true

  toast.timer = setTimeout(() => {
    toast.visible = false
    toast.message = ''
  }, 1500)
}

const { space, arrowUp, arrowDown, arrowLeft, arrowRight, m, f, p, bracketLeft, bracketRight } = useMagicKeys()

const activeElement = useActiveElement()
const notUsingInput = computed(() =>
  activeElement.value?.tagName !== 'INPUT'
  && activeElement.value?.tagName !== 'TEXTAREA'
  && !(activeElement.value instanceof HTMLElement && activeElement.value.isContentEditable),
)

const { t } = useI18n(() => locale ?? 'en')

// Handle keyboard shortcuts
whenever(logicAnd(space, notUsingInput), () => {
  togglePlay()
  showToast(`${playing.value ? t.value.play : t.value.pause}`)
})

whenever(logicAnd(arrowRight, notUsingInput), () => {
  currentTime.value += 5
  showToast(t.value.forward)
})

whenever(logicAnd(arrowLeft, notUsingInput), () => {
  currentTime.value -= 5
  showToast(t.value.backward)
})

whenever(logicAnd(arrowUp, notUsingInput), () => {
  volume.value = Math.min(1, volume.value + 0.1)
  showToast(`${t.value.volume}: ${Math.round(volume.value * 100)}%`)
})

whenever(logicAnd(arrowDown, notUsingInput), () => {
  volume.value = Math.max(0, volume.value - 0.1)
  showToast(`${t.value.volume}: ${Math.round(volume.value * 100)}%`)
})

whenever(logicAnd(m, notUsingInput), () => {
  muted.value = !muted.value
  showToast(muted.value ? t.value.mute : t.value.unmute)
})

whenever(logicAnd(f, notUsingInput), () => {
  toggleFullscreen()
  showToast(isFullscreen.value ? t.value.exitFullscreen : t.value.fullscreen)
})

whenever(logicAnd(p, notUsingInput), () => {
  if (supportsPictureInPicture) {
    togglePictureInPicture()
    showToast(isPictureInPicture.value ? t.value.exitPip : t.value.pip)
  }
})

whenever(logicAnd(bracketLeft, notUsingInput), () => {
  rate.value = Math.max(0.5, rate.value - 0.25)
  showToast(`${t.value.speed}: ${rate.value}x`)
})

whenever(logicAnd(bracketRight, notUsingInput), () => {
  rate.value = Math.min(3, rate.value + 0.25)
  showToast(`${t.value.speed}: ${rate.value}x`)
})

const showDialog = ref(false)
const toggleDialog = useToggle(showDialog)

const keyboardShortcuts = computed(() => [
  { key: 'Space', description: t.value.playPause },
  { key: '←', description: t.value.backward },
  { key: '→', description: t.value.forward },
  { key: '↑', description: t.value.volumeUp },
  { key: '↓', description: t.value.volumeDown },
  { key: 'M', description: t.value.muteUnmute },
  { key: 'F', description: t.value.fullscreen },
  { key: 'P', description: t.value.pip },
  { key: '[', description: t.value.speedDown },
  { key: ']', description: t.value.speedUp },
])

const videoInfo = computed(() => ({
  [t.value.currentTime]: formatDuration(currentTime.value),
  [t.value.duration]: formatDuration(duration.value),
  [t.value.speed]: `${rate.value}x`,
  [t.value.volume]: `${Math.round(volume.value * 100)}%`,
  [t.value.resolution]: videoRef.value ? `${videoRef.value.videoWidth}x${videoRef.value.videoHeight}` : 'N/A',
  [t.value.networkState]: videoRef.value ? ['Empty', 'Idle', 'Loading', 'No Source'][videoRef.value.networkState] : 'N/A',
}))

onMounted(() => {
  const popperContainer = document.querySelector(usePopperContainerId().selector.value) as HTMLElement | null
  if (!popperContainer)
    return
  popperContainer.style.setProperty('--el-text-color-primary', '#303133')
  popperContainer.style.setProperty('--el-bg-color', '#ffffff')

  // fix tooltip not display while fullscreen
  watch(isFullscreen, (val) => {
    const popperContainer = document.querySelector(usePopperContainerId().selector.value)
    if (!popperContainer)
      return
    if (val)
      videoContainerRef.value?.append(popperContainer)

    else
      document.body.append(popperContainer)
  })
})

defineExpose({
  playing,
  currentTime,
  duration,
  waiting,
  volume,
  muted,
  isPictureInPicture,
  supportsPictureInPicture,
  togglePictureInPicture,
  tracks,
  selectedTrack,
  rate,
  buffered,
  enableTrack,
  disableTrack,
  loop,
})
</script>

<template>
  <div
    ref="videoContainerRef"
    class="dan-player ccl-player relative flex-center overflow-hidden bg-black container"
    :class="{ 'cursor-none': idle }"
  >
    <video
      ref="videoRef"
      muted
      playsinline
      :src="srcUrl"
      :loop="loop"
      class="w-full outline-none"
      v-bind="reactiveOmit($attrs, 'class', 'style')"
      @click="togglePlay()"
    />
    <div ref="commentRef" class="comment-container of-hidden" />

    <div
      v-if="waiting"
      class="pointer-events-none absolute inset-0 grid place-items-center bg-black bg-opacity-20"
    >
      <div class="i-carbon-circle-dash animate-spin animate-duration-300 text-4xl" />
    </div>
    <div
      class="dan-player-gradient-bottom bottom-0 h-16 w-full transition"
      :class="idle ? 'op-0 translate-y-full' : ''"
    />
    <div
      class="absolute bottom-0 left-0 right-0 px-4 transition"
      :class="idle ? 'op-0 translate-y-full' : ''"
    >
      <Scrubber v-model="currentTime" :max="duration" :secondary="endBuffer" :tooltip-formatter="formatDuration" />
      <div class="flex items-center pb-2 text-white">
        <button class="dan-btn" @click="togglePlay()">
          <div :class="playing ? 'i-carbon-pause' : 'i-carbon-play'" />
        </button>

        <div ref="volumeAdjustRef" class="flex items-center of-hidden">
          <button class="dan-btn" @click="muted = !muted">
            <div class="scale-90" :class="muted ? 'i-carbon-volume-mute' : volume > 0.5 ? 'i-carbon-volume-up' : 'i-carbon-volume-down'" />
          </button>
          <Transition name="volume-expand-right">
            <div v-show="!hideVolumeSlider" class="w-16">
              <ElSlider
                v-model="volume"
                :min="0"
                :max="1"
                :step="0.01"
                :format-tooltip="volume => `${(volume * 100).toFixed(0)}%`"
                class="!w-12"
              />
            </div>
          </Transition>
        </div>

        <div class="flex items-center gap-1 text-xs text-white">
          <span>{{ formatDuration(currentTime) }}</span>
          <span>/</span>
          <span>{{ formatDuration(duration) }}</span>
        </div>

        <div class="ml-auto" />

        <button class="dan-btn" @click="toggleDialog()">
          <div class="i-carbon-information" />
        </button>

        <button class="dan-btn" @click="toggleShowComment()">
          <div :class="showComment ? 'i-carbon-chat-off' : 'i-carbon-chat'" />
        </button>

        <ElPopover
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper"
          :show-arrow="false"
        >
          <template #reference>
            <button class="dan-btn">
              <div i-carbon-chat-operational />
            </button>
          </template>
          <CommentStyle :locale="locale" />
        </ElPopover>

        <ElPopover
          v-if="assSubtitleFiles?.length > 0"
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper bg-op"
          :show-arrow="false"
        >
          <template #reference>
            <button class="dan-btn">
              <div i-carbon-closed-caption :class="currentSubtitleIndex !== -1 ? 'text-primary-500' : ''" />
            </button>
          </template>
          <ElSegmented
            v-model="currentSubtitleIndex"
            direction="vertical"
            :options="subtitleOptions"
          />
        </ElPopover>

        <ElPopover
          v-if="tracks.length > 0"
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper bg-op"
          :show-arrow="false"
        >
          <template #reference>
            <button class="dan-btn">
              <div i-carbon-closed-caption :class="selectedTrack !== -1 ? 'text-primary-500' : ''" />
            </button>
          </template>
          <ElSegmented
            v-model="selectedTrack"
            direction="vertical"
            :options="trackOptions"
          />
        </ElPopover>

        <ElPopover
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper bg-op"
          :show-arrow="false"
        >
          <template #reference>
            <button class="dan-btn">
              <div i-carbon-gears />
            </button>
          </template>
          <ElSegmented
            v-model="rate"
            direction="vertical"
            :options="speedOptions"
          />
        </ElPopover>

        <button v-if="additionalFunctions?.includes('loop')" class="dan-btn" @click="loop = !loop">
          <div :class="loop ? 'i-carbon-repeat' : 'i-carbon-repeat opacity-50'" />
        </button>

        <button v-if="supportsPictureInPicture && additionalFunctions?.includes('picture-in-picture')" class="dan-btn" @click="togglePictureInPicture()">
          <div :class="isPictureInPicture ? 'i-dan-back-to-screen' : 'i-carbon-shrink-screen'" />
        </button>

        <button class="dan-btn" @click="toggleFullscreen()">
          <div :class="isFullscreen ? 'i-dan-fit-size' : 'i-carbon-fit-to-screen'" />
        </button>
      </div>
    </div>

    <!-- Custom Toast -->
    <Transition name="toast-fade">
      <div
        v-if="toast.visible"
        class="absolute left-6 top-6 rounded bg-black/80 px-4 py-2 text-sm text-white"
      >
        {{ toast.message }}
      </div>
    </Transition>

    <ElDialog
      v-model="showDialog"
      title="Dan Player"
      class="dan-player-dialog"
      width="fit-content"
    >
      <div class="flex gap-4 text-zinc-300">
        <div class="space-y-2">
          <!-- Video Info Section -->
          <div class="space-y-2">
            <span class="text-sm text-zinc-200 font-medium">
              {{ t.videoInfo }}
            </span>
            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <template v-for="(value, key) in videoInfo" :key="key">
                <span class="dan-label">{{ key }}</span>
                <span class="dan-value">{{ value }}</span>
              </template>
            </div>
          </div>
          <!-- Video Info Section -->
          <div class="space-y-2">
            <span class="text-sm text-zinc-200 font-medium">
              {{ t.playerInfo }}
            </span>
            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <span class="dan-label">{{ t.version }}</span>
              <span class="dan-value">{{ version }}</span>
              <span class="dan-label">{{ t.author }}</span>
              <span class="dan-value"><a href="https://github.com/wiidede/" target="_blank">wiidede</a></span>
              <span class="dan-label">GitHub</span>
              <span class="dan-value"><a href="https://github.com/wiidede/dan-player" target="_blank"><div class="i-carbon-logo-github" /></a></span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-2 w-[1px] bg-zinc-700" />

        <!-- Keyboard Shortcuts Section -->
        <div class="space-y-2">
          <span class="text-sm text-zinc-200 font-medium">
            {{ t.keyboardShortcuts }}
          </span>
          <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            <template v-for="shortcut in keyboardShortcuts" :key="shortcut.key">
              <span class="dan-label">{{ shortcut.description }}</span>
              <span class="dan-value w-fit">{{ shortcut.key }}</span>
            </template>
          </div>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style>
.el-popper.dan-settings-popper,
.dan-player {
  --el-bg-color: #141414;
  --el-bg-color-overlay: #000000e0;
  --el-border-color-light: #414243;
  --el-fill-color-light: #262727;
  --el-fill-color-dark: #39393a;
  --el-fill-color-darker: #424243;
  --el-text-color-primary: #e5eaf3;
  --el-text-color-regular: #cfd3dc;
  --el-text-color-secondary: #a3a6ad;
  --el-border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  --el-border-color: #4c4d4f;
}

.el-popper.dan-settings-popper {
  font-size: 12px;
  border: none;
  box-shadow: var(--el-box-shadow);
  min-width: 0;
}

.el-popper.dan-settings-popper.bg-op {
  background-color: transparent;
  padding: 0;
}

.dan-label {
  --at-apply: text-sm text-zinc-400;
}

.dan-value {
  --at-apply: rounded bg-zinc-800/50 px-2 py-0.5 text-sm text-zinc-200 font-mono;
}

.dan-player .el-slider,
.dan-settings-popper .el-slider {
  --el-slider-height: 4px;
  --el-slider-button-size: 12px;
  height: 16px;
}

.dan-player .el-slider__button-wrapper,
.dan-settings-popper .el-slider__button-wrapper {
  top: 2px;
  transform: translate(-50%, -50%);
}

.dan-player .el-slider__button,
.dan-settings-popper .el-slider__button {
  background-color: var(--el-slider-main-bg-color);
}

.dan-player .el-slider__marks-text,
.dan-settings-popper .el-slider__marks-text {
  word-break: keep-all;
  margin-top: 8px;
  font-size: 12px;
}

.dan-player .libassjs-canvas-parent {
  position: absolute !important;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.dan-player .libassjs-canvas {
  top: 0 !important;
  left: 0 !important;
}
</style>

<style scoped>
.dan-btn {
  --at-apply: rd p-1 c-inherit cursor-pointer text-4 hover-bg-zinc-500/60 active-bg-zinc-600/60 bg-transparent bg-none
    b-none;
}

.dan-player:focus {
  outline: none;
}

.dan-player-gradient-bottom {
  background-position: bottom;
  position: absolute;
  background: rgb(0, 0, 0);
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.33) 66%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
}

.toast-fade-enter-active {
  transition: all 0.2s ease-out;
}
.toast-fade-leave-active {
  transition: all 0.15s ease-in;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}

.volume-expand-right-enter-active {
  animation: volume-expand-right 0.4s ease-out;
}
.volume-expand-right-leave-active {
  animation: volume-expand-right 0.4s ease-in reverse;
}

@keyframes volume-expand-right {
  0% {
    width: 0;
  }
  100% {
    width: 4rem;
  }
}
</style>
