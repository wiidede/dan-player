import type { SubtitleFile } from 'src/workers/mkvExtract.worker'
import type { MaybeRefOrGetter } from 'vue'
import ASS from 'assjs'
import { onUnmounted, ref, toValue, watch } from 'vue'

export function useAss(video: MaybeRefOrGetter<HTMLVideoElement | undefined>, subtitles: MaybeRefOrGetter<SubtitleFile | undefined>) {
  let ass: InstanceType<typeof ASS> | undefined
  const container = ref<HTMLElement>()

  watch([() => toValue(video), () => toValue(subtitles)], async ([video, subtitles]) => {
    if (ass)
      ass.destroy()
    if (!video || !subtitles)
      return

    // Create container if it doesn't exist
    if (!container.value) {
      container.value = document.createElement('div')
      container.value.style.position = 'absolute'
      container.value.style.top = '0'
      container.value.style.left = '0'
      container.value.style.width = '100%'
      container.value.style.height = '100%'
      container.value.style.pointerEvents = 'none'
      video.parentElement?.appendChild(container.value)
    }

    // Convert subtitles data to string if it's a Uint8Array
    const subtitlesText = subtitles.data instanceof Uint8Array
      ? new TextDecoder().decode(subtitles.data)
      : subtitles.data

    ass = new ASS(subtitlesText, video, {
      container: container.value,
      resampling: 'video_height', // default behavior
    })
  })

  onUnmounted(() => {
    if (ass)
      ass.destroy()
    if (container.value)
      container.value.remove()
  })

  return {
    ass,
  }
}
