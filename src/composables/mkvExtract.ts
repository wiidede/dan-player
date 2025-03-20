import type { MaybeRefOrGetter } from 'vue'
import type { SubtitleFile } from '../workers/mkvExtract.worker'
import { onUnmounted, ref, toValue, watch } from 'vue'

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

// Check if file is MKV by inspecting the file's magic bytes
async function isMkvFile(file?: Blob): Promise<boolean> {
  if (!file)
    return false

  // Check MIME type first if available
  if (file.type === 'video/x-matroska')
    return true

  // Check filename if file has a name property
  if ('name' in file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.mkv'))
    return true

  // If no MIME type or filename, check the file signature
  // MKV files start with 0x1A 0x45 0xDF 0xA3 (EBML header)
  try {
    const headerBytes = await file.slice(0, 4).arrayBuffer()
    const header = new Uint8Array(headerBytes)

    // Check for EBML header (MKV/WebM files)
    return header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3
  }
  catch (error) {
    console.error('Error checking file type:', error)
    return false
  }
}

export function useMkvExtractWorker(file: MaybeRefOrGetter<Blob | undefined>) {
  let worker: Worker | undefined

  const subtitleFiles = ref<SubtitleFile[]>([])
  const isLoading = ref(false)

  watch(() => toValue(file), async (val) => {
    subtitleFiles.value = []
    const isMkv = val ? await isMkvFile(val) : false

    if (val && isMkv) {
      isLoading.value = true

      try {
        // Lazy load the worker only when needed
        if (!worker) {
          const { default: Worker } = await import('../workers/mkvExtract.worker?worker&inline')
          worker = new Worker()

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
            isLoading.value = false
          }
        }

        worker.postMessage(val)
      }
      catch (error) {
        console.error('Error loading MKV worker:', error)
        isLoading.value = false
      }
    }
  })

  onUnmounted(() => {
    if (!worker)
      return
    worker.terminate()
  })

  return {
    subtitleFiles,
    isLoading,
  }
}
