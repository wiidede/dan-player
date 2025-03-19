import type { SubtitleFile } from '../workers/mkvExtract.worker'
import MkvExtractWorker from '../workers/mkvExtract.worker?worker&inline'

function srt2vtt(srt: string) {
  // Create VTT header
  let vttData = 'WEBVTT\n\n'

  // Parse SRT content
  const subtitleBlocks = srt.split(/\n\n/)

  subtitleBlocks.forEach((block) => {
    const match = block.match(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]+)/)
    if (match) {
      // Convert time format from "00:00:00,000" to "00:00:00.000"
      const start = match[2].replace(',', '.')
      const end = match[3].replace(',', '.')
      const text = match[4]

      // Add to VTT data, excluding the subtitle index
      vttData += `${start} --> ${end}\n${text}\n\n`
    }
  })

  return vttData
}

export function useMkvExtractWorker(file: MaybeRefOrGetter<Blob | undefined>) {
  let worker: InstanceType<typeof MkvExtractWorker>

  const subtitleFiles = ref<SubtitleFile[]>([])
  watch(() => toValue(file), (val) => {
    if (val) {
      if (!worker) {
        worker = new MkvExtractWorker()
      }
      worker.postMessage(val)

      worker.onmessage = (e: MessageEvent<{ type: 'error' | 'success', files: Error | SubtitleFile[] }>) => {
        if (e.data.type === 'error') {
          console.error(e.data)
          subtitleFiles.value = []
        }
        else {
          const files = e.data.files as SubtitleFile[]
          files.forEach((file) => {
            if (file.name.endsWith('.srt')) {
              file.data = srt2vtt(file.data as string)
              file.name = file.name.replace('.srt', '.vtt')
              file.type = 'vtt'
            }
          })
          subtitleFiles.value = files
        }
      }
    }
    else {
      subtitleFiles.value = []
    }
  })

  onUnmounted(() => {
    if (!worker)
      return
    worker.terminate()
  })

  return {
    subtitleFiles,
  }
}
