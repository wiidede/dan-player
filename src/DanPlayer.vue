<script setup lang="ts">
import type { ICommentCCL } from './type'
import { reactiveOmit } from '@vueuse/core'
import { usePopperContainerId } from 'element-plus'
import { useCCL } from './composables/ccl'

const {
  comments,
  autoplayOnCommentLoad,
  additionalFunctions,
} = defineProps<{
  comments?: ICommentCCL[]
  autoplayOnCommentLoad?: boolean
  additionalFunctions?: ('loop' | 'picture-in-picture')[]
}>()

const emit = defineEmits<{
  (e: 'onCommentLoad'): void
}>()

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
} = useMediaControls(videoRef)

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
    tabindex="0"
    autofocus
    @keydown.prevent.space="togglePlay()"
    @keydown.right="currentTime += 10"
    @keydown.left="currentTime -= 10"
  >
    <video
      ref="videoRef"
      muted
      playsinline
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

        <button class="dan-btn" @click="toggleShowComment()">
          <div :class="showComment ? 'i-carbon-chat-off' : 'i-carbon-chat'" />
        </button>

        <ElPopover
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper"
          :show-arrow="false"
          :teleported="false"
        >
          <template #reference>
            <button class="dan-btn">
              <div i-carbon-chat-operational />
            </button>
          </template>
          <CommentStyle />
        </ElPopover>

        <ElPopover
          v-if="tracks.length > 0"
          placement="top"
          trigger="hover"
          width="fit-content"
          popper-class="dan-settings-popper bg-op"
          :show-arrow="false"
          :teleported="false"
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

.dan-player .el-slider {
  --el-slider-height: 4px;
  --el-slider-button-size: 12px;
  height: 16px;

  .el-slider__button {
    background-color: var(--el-slider-main-bg-color);
  }
  .el-slider__marks-text {
    word-break: keep-all;
    margin-top: 8px;
    font-size: 12px;
  }
}
</style>

<style scoped>
.dan-btn {
  --at-apply: rd hover-bg-zinc-500/60 active-bg-zinc-600/60 p-1 bg-transparent bg-none b-none c-inherit cursor-pointer;
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
