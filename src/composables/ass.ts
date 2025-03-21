import type { SubtitleFile } from 'src/workers/mkvExtract.worker'
import type { MaybeRefOrGetter } from 'vue'
import ASS from 'assjs'
import { onUnmounted, toValue, watch } from 'vue'

export function useAss(
  video: MaybeRefOrGetter<HTMLVideoElement | undefined>,
  container: MaybeRefOrGetter<HTMLElement | undefined>,
  subtitles: MaybeRefOrGetter<SubtitleFile | undefined>,
) {
  let ass: InstanceType<typeof ASS> | undefined

  watch([() => toValue(video), () => toValue(subtitles)], async ([video, subtitles]) => {
    if (ass)
      ass.destroy()
    if (!video || !subtitles || !toValue(container))
      return

    ass = new ASS(subtitles.data, video, {
      container: toValue(container),
      resampling: 'video_height', // default behavior
    })
  }, { immediate: true })

  onUnmounted(() => {
    if (ass)
      ass.destroy()
  })

  return {
    ass,
  }
}
