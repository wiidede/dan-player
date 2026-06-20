<script setup lang="ts">
import type { UseMediaTextTrackSource } from '@vueuse/core'
import type { I18nLocale, I18nMessages } from './composables/useI18n'
import type { ICommentCCL } from './type'
import { reactiveOmit, useElementSize, useFullscreen, useIdle, useMediaControls, useMouseInElement, useToggle } from '@vueuse/core'
import { ElPopover, ElSegmented, ElSlider, usePopperContainerId } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import CommentSender from './components/CommentSender.vue'
import CommentStyle from './components/CommentStyle.vue'
import PlayerInfoDialog from './components/PlayerInfoDialog.vue'
import Scrubber from './components/Scrubber.vue'
import SubtitleStyle from './components/SubtitleStyle.vue'
import { useAss } from './composables/ass'
import { useMkvExtractWorker } from './composables/mkvExtract'
import { useDanmu } from './composables/useDanmu'
import { useDelayedBoolean } from './composables/useDelayedBoolean'
import { useI18n } from './composables/useI18n'
import { usePlayerKeyboard } from './composables/usePlayerKeyboard'
import { speedOptions } from './constants/player'
import './styles/player.css'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import 'element-plus/theme-chalk/el-popover.css'
import 'element-plus/theme-chalk/el-segmented.css'
import 'element-plus/theme-chalk/el-slider.css'
import 'element-plus/theme-chalk/el-tooltip.css'
import 'element-plus/theme-chalk/el-popper.css'

const {
  src,
  comments,
  autoplayOnCommentLoad,
  additionalFunctions,
  showCommentSender = false,
  locale = 'en',
} = defineProps<{
  src?: string | Blob
  comments?: ICommentCCL[]
  autoplayOnCommentLoad?: boolean
  additionalFunctions?: ('loop' | 'picture-in-picture')[]
  showCommentSender?: boolean
  locale?: I18nLocale | I18nMessages
}>()

const emit = defineEmits<{
  (e: 'onCommentLoad'): void
  (e: 'sendComment', text: string): void
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
const assRef = ref<HTMLDivElement>()

const { width: videoWidth, height: videoHeight } = useElementSize(videoRef)

watch(() => src, () => {
  if (videoRef.value) {
    // Remove all track elements from the video tag
    const tracks = videoRef.value.getElementsByTagName('track')
    while (tracks.length > 0) {
      videoRef.value.removeChild(tracks[0])
    }
  }
})

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

useAss(videoRef, assRef, computed(() =>
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
const { showComment, toggleShowComment, pushSelfComment } = useDanmu(
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
const isWebFullscreen = ref(false)
const toggleWebFullscreen = useToggle(isWebFullscreen)
const { idle: systemIdle } = useIdle(3_000)
const idle = computed(() => systemIdle.value && playing.value)

const volumeAdjustRef = ref<HTMLElement>()
const { isOutside: hideVolumeSlider } = useMouseInElement(volumeAdjustRef)
const showCommentSenderDelayed = useDelayedBoolean(hideVolumeSlider, { delayOnTrue: 400 })

const endBuffer = computed(() => buffered.value.length > 0 ? buffered.value[buffered.value.length - 1][1] : 0)

const trackOptions = computed(() => [
  { label: 'Off', value: -1 },
  ...tracks.value.map(track => ({
    label: track.label,
    value: track.id,
  })),
])

function onTrackChange(value: number) {
  if (value === -1)
    disableTrack()
  else
    enableTrack(tracks.value[value])
}

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

const { t } = useI18n(() => locale ?? 'en')

function handleFullscreen(mode: 'web' | 'native') {
  if (mode === 'web') {
    if (isFullscreen.value)
      toggleFullscreen()
    toggleWebFullscreen()
    showToast(isWebFullscreen.value ? t.value.exitWebFullscreen : t.value.webFullscreen)
  }
  else {
    if (isWebFullscreen.value)
      toggleWebFullscreen()
    toggleFullscreen()
    showToast(isFullscreen.value ? t.value.exitFullscreen : t.value.fullscreen)
  }
}

function handleSendComment(text: string) {
  emit('sendComment', text)
}

const { keyboardShortcuts } = usePlayerKeyboard({
  playing,
  currentTime,
  volume,
  muted,
  rate,
  isPictureInPicture,
  supportsPictureInPicture,
  isWebFullscreen,
  togglePlay,
  togglePictureInPicture,
  toggleWebFullscreen,
  handleFullscreen,
  showToast,
  t,
})

const showDialog = ref(false)
const toggleDialog = useToggle(showDialog)

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
  watch([isFullscreen, isWebFullscreen], ([f, wf]) => {
    const popperContainer = document.querySelector(usePopperContainerId().selector.value)
    if (!popperContainer)
      return
    if (f || wf)
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
  addSelfComment: pushSelfComment,
})
</script>

<template>
  <div
    ref="videoContainerRef"
    class="dan-player relative flex-center overflow-hidden bg-black"
    :class="{ 'cursor-none': idle, 'web-fullscreen': isWebFullscreen }"
  >
    <video
      ref="videoRef"
      muted
      playsinline
      :src="srcUrl"
      :loop="loop"
      class="max-h-full w-full outline-none"
      v-bind="reactiveOmit($attrs, 'class', 'style')"
      @click="togglePlay()"
    />
    <div ref="commentRef" class="comment-container pointer-events-none absolute inset-0 of-hidden" />
    <div
      ref="assRef"
      class="ass-container pointer-events-none absolute"
      :style="{ width: `${videoWidth}px`, height: `${videoHeight}px` }"
    />

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
      <div class="dan-player-control-bar pb-2 text-white">
        <div class="left-controls flex items-center">
          <button class="dan-btn" @mousedown.prevent @click="togglePlay()">
            <div :class="playing ? 'i-carbon-pause' : 'i-carbon-play'" />
          </button>

          <div ref="volumeAdjustRef" class="flex items-center of-hidden">
            <button class="dan-btn" @mousedown.prevent @click="muted = !muted">
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
        </div>

        <div class="right-controls flex items-center">
          <button class="dan-btn" @mousedown.prevent @click="toggleDialog()">
            <div class="i-carbon-information" />
          </button>

          <button class="dan-btn" @mousedown.prevent @click="toggleShowComment()">
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
              <button class="dan-btn" @mousedown.prevent>
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
              <button class="dan-btn" @mousedown.prevent>
                <div i-carbon-closed-caption :class="currentSubtitleIndex !== -1 ? 'text-primary-500' : ''" />
              </button>
            </template>
            <ElSegmented
              v-model="currentSubtitleIndex"
              direction="vertical"
              :options="subtitleOptions"
              class="max-h-50vh overflow-auto"
            />
          </ElPopover>

          <ElPopover
            v-if="tracks.length > 0"
            placement="top"
            trigger="hover"
            width="fit-content"
            popper-class="dan-settings-popper"
            :show-arrow="false"
          >
            <template #reference>
              <button class="dan-btn" @mousedown.prevent>
                <div i-carbon-closed-caption :class="selectedTrack !== -1 ? 'text-primary-500' : ''" />
              </button>
            </template>
            <div class="flex gap-4">
              <ElSegmented
                v-model="selectedTrack"
                direction="vertical"
                :options="trackOptions"
                class="max-h-50vh overflow-auto"
                @change="onTrackChange"
              />
              <SubtitleStyle :locale="locale" class="h-fit" />
            </div>
          </ElPopover>

          <ElPopover
            placement="top"
            trigger="hover"
            width="fit-content"
            popper-class="dan-settings-popper bg-op"
            :show-arrow="false"
          >
            <template #reference>
              <button class="dan-btn" @mousedown.prevent>
                <div i-carbon-gears />
              </button>
            </template>
            <ElSegmented
              v-model="rate"
              direction="vertical"
              :options="speedOptions"
            />
          </ElPopover>

          <button v-if="additionalFunctions?.includes('loop')" class="dan-btn" @mousedown.prevent @click="loop = !loop">
            <div :class="loop ? 'i-carbon-repeat' : 'i-carbon-repeat opacity-50'" />
          </button>

          <button v-if="supportsPictureInPicture && additionalFunctions?.includes('picture-in-picture')" class="dan-btn" @mousedown.prevent @click="togglePictureInPicture()">
            <div :class="isPictureInPicture ? 'i-dan-back-to-screen' : 'i-carbon-shrink-screen'" />
          </button>

          <button class="dan-btn" @mousedown.prevent @click="handleFullscreen('web')">
            <div :class="isWebFullscreen ? 'i-dan-exit-fit-to-screen' : 'i-carbon-fit-to-screen'" />
          </button>

          <button class="dan-btn" @mousedown.prevent @click="handleFullscreen('native')">
            <div :class="isFullscreen ? 'i-dan-fit-size' : 'i-carbon-center-to-fit'" />
          </button>
        </div>

        <div
          v-if="showCommentSender"
          v-show="showCommentSenderDelayed"
          class="comment-sender-area flex items-center"
        >
          <slot name="comment-sender" :send="handleSendComment" :locale="locale">
            <CommentSender :locale="locale" @send="handleSendComment" />
          </slot>
        </div>
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

    <PlayerInfoDialog
      v-model="showDialog"
      :locale="locale"
      :video-info="videoInfo"
      :keyboard-shortcuts="keyboardShortcuts"
    />
  </div>
</template>
