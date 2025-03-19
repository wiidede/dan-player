import type { SubtitleFile } from '../workers/mkvExtract.worker'
import MkvExtractWorker from '../workers/mkvExtract.worker?worker&inline'

function srt2ass(srt: string) {
  let assData = `[Script Info]
Title: Converted Subtitle
Original Script: SRT to ASS Converter
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
Timer: 100.0000
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,0.8,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  // 解析并转换 SRT 字幕
  const subtitles: { index: number, start: string, end: string, text: string }[] = []
  const subtitleBlocks = srt.split(/\n\n/)
  subtitleBlocks.forEach((block) => {
    const match = block.match(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]+)/)
    if (match) {
      subtitles.push({
        index: Number.parseInt(match[1]),
        start: match[2].replace(',', '.'),
        end: match[3].replace(',', '.'),
        text: match[4].replace(/\n/g, '\\N'), // 将换行符转换为 \N
      })
    }
  })

  // 按开始时间排序
  subtitles.sort((a, b) => Number.parseFloat(a.start) - Number.parseFloat(b.start))

  // 添加字幕内容到 ASS 数据
  subtitles.forEach((sub) => {
    const lines = sub.text.split('\\N')
    if (lines.length > 1) {
      // 多行字幕的情况，分成两条对话，第一行稍微上移
      assData += `Dialogue: 0,${convertTimeToASS(sub.start)},${convertTimeToASS(sub.end)},Default,,0,0,10,,${lines[1]}\n`
      assData += `Dialogue: 0,${convertTimeToASS(sub.start)},${convertTimeToASS(sub.end)},Default,,0,0,10,,${lines[0]}\n`
    }
    else {
      // 单行字幕，默认位置
      assData += `Dialogue: 0,${convertTimeToASS(sub.start)},${convertTimeToASS(sub.end)},Default,,0,0,10,,${lines[0]}\n`
    }
  })

  return assData
}

// 时间格式转换函数
function convertTimeToASS(time: string) {
  // 将时间格式从 "HH:MM:SS.SSS" 转换为 ASS 时间格式 "H:MM:SS.ss"
  return time.substring(1, 11)
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
              file.data = srt2ass(file.data as string)
              file.name = file.name.replace('.srt', '.ass')
            }
          })
          subtitleFiles.value = files
        }
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
  }
}
