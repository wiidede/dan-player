import type { StateAndTagData } from '@wiidede/ebml'
import { Decoder, Tools } from '@wiidede/ebml'

export interface SubtitleFile {
  name: string
  data: string
  language: string
  type: string
}

interface TrackData {
  heading: string
  language: string
  entries: (string | number)[]
}

function padZeroes(arr: Uint8Array): ArrayBuffer {
  const len = Math.ceil(arr.length / 2) * 2
  const output = new Uint8Array(len)
  output.set(arr, len - arr.length)
  return output.buffer
}

function readUnsignedInteger(data: ArrayBuffer): number {
  const view = new DataView(data)
  return data.byteLength === 2 ? view.getUint16(0) : view.getUint32(0)
}

function formatTimestamp(timestamp: number) {
  const seconds = timestamp / 1000
  const hh = Math.floor(seconds / 3600)
  const mm = Math.floor((seconds - hh * 3600) / 60)
  const ss = (seconds - hh * 3600 - mm * 60).toFixed(2)

  return `${hh}:${mm < 10 ? `0${mm}` : mm}:${Number(ss) < 10 ? `0${ss}` : ss}`
}

function formatTimestampSRT(timestamp: number) {
  const seconds = timestamp / 1000
  const hh = Math.floor(seconds / 3600)
  const mm = Math.floor((seconds - hh * 3600) / 60)
  const ss = (seconds - hh * 3600 - mm * 60).toFixed(3)

  return `${hh < 10 ? `0${hh}` : hh}:${mm < 10 ? `0${mm}` : mm}:${Number(ss) < 10 ? `0${ss}` : ss}`
}

async function handleStream(stream: ReadableStream<Uint8Array>): Promise<SubtitleFile[]> {
  return new Promise((resolve, reject) => {
    const decoder = new Decoder()
    const tracks: number[] = []
    const trackData: TrackData[] = []
    const files: SubtitleFile[] = []
    let currentFile = 0
    let currentTimecode: number
    let trackIndexTemp: number
    let trackTypeTemp: number
    let trackHeadingTemp: string
    let trackLanguageTemp: string
    let trackIndex: number
    let inTracksSection = false
    let foundSubtitleTrack = false

    // Get a reader for the decoder output
    const reader = decoder.stream.readable.getReader()

    // Process decoded chunks
    const processChunk = async ({ done, value }: { done: boolean, value?: StateAndTagData }): Promise<void> => {
      if (done) {
        return
      }

      if (!value)
        return reader.read().then(processChunk)

      const [type, chunk] = value

      // Track sections detection
      if (type === 'start' && chunk.name === 'Tracks') {
        inTracksSection = true
      }
      else if (type === 'end' && chunk.name === 'Tracks') {
        inTracksSection = false
        if (tracks.length > 0) {
          foundSubtitleTrack = true
        }
      }

      // Skip processing non-subtitle chunks if we're not in tracks section
      if (!inTracksSection && !foundSubtitleTrack && chunk.name !== 'Tracks') {
        return reader.read().then(processChunk)
      }

      switch (type) {
        case 'end':
          if (chunk.name === 'TrackEntry' && inTracksSection) {
            // Process track entry (1=video, 2=audio, 17=subtitle)
            if (trackTypeTemp === 17) {
              tracks.push(trackIndexTemp)
              trackData.push({ heading: trackHeadingTemp, language: trackLanguageTemp, entries: [] })
            }
          }
          break
        case 'tag':
          // Process embedded subtitle files
          if (chunk.name === 'FileName') {
            const fileName = new TextDecoder('utf-8').decode(chunk.data)
            const fileNameExt = fileName.split('.').pop()?.toLowerCase()
            if (fileNameExt && ['srt', 'ass', 'vtt'].includes(fileNameExt)) {
              if (!files[currentFile])
                files[currentFile] = { name: fileName, data: '', language: '', type: fileNameExt }
              files[currentFile].data = new TextDecoder('utf-8').decode(chunk.data)
              files[currentFile].type = fileNameExt
            }
          }
          if (chunk.name === 'FileData' && files[currentFile]) {
            files[currentFile].data = new TextDecoder('utf-8').decode(chunk.data)
          }
          if (chunk.name === 'Language' && files[currentFile]) {
            files[currentFile].language = chunk.value || ''
          }

          // Only process track info when in Tracks section
          if (inTracksSection) {
            if (chunk.name === 'TrackNumber')
              trackIndexTemp = chunk.data[0]
            if (chunk.name === 'TrackType')
              trackTypeTemp = chunk.data[0]
            if (chunk.name === 'CodecPrivate')
              trackHeadingTemp = new TextDecoder('utf-8').decode(chunk.data)
            if (chunk.name === 'Language')
              trackLanguageTemp = chunk.value
          }

          // Only process subtitle data if we've found subtitle tracks
          if (foundSubtitleTrack) {
            if (chunk.name === 'SimpleBlock' || chunk.name === 'Block') {
              const trackLength = Tools.readVint(chunk.data)
              trackIndex = tracks.indexOf(trackLength.value)
              if (trackIndex !== -1) {
                const timestampArray = new Uint8Array(chunk.data).slice(
                  trackLength.length,
                  trackLength.length + 2,
                )
                const timestamp = new DataView(timestampArray.buffer).getInt16(0)
                const lineData = chunk.data.slice(trackLength.length + 3)
                // Convert Uint8Array to string using TextDecoder
                const text = new TextDecoder('utf-8').decode(lineData)
                trackData[trackIndex].entries.push(
                  text,
                  timestamp,
                  currentTimecode,
                )
              }
            }
            if (chunk.name === 'Timecode') {
              currentTimecode = readUnsignedInteger(padZeroes(chunk.data))
            }
            if (chunk.name === 'BlockDuration' && trackIndex !== -1) {
              const duration = readUnsignedInteger(padZeroes(chunk.data))
              trackData[trackIndex].entries.push(duration)
            }
          }
          break
      }

      if (files[currentFile]?.name && files[currentFile]?.data) {
        currentFile++
      }

      // Continue reading
      return reader.read().then(processChunk)
    }

    // Start processing chunks
    reader.read().then(processChunk)

    // Function to process collected track data and create subtitle files
    const processTrackData = () => {
      trackData.forEach((track, index) => {
        const heading = track.heading
        const language = track.language
        const entries = track.entries
        const isASS = heading.includes('Format:')
        const formatFn = isASS ? formatTimestamp : formatTimestampSRT
        const eventMatches = isASS
          ? heading.match(/\[Events\]\s+Format:([^\r\n]*)/)
          : ['']
        if (!eventMatches) {
          return
        }
        const headingParts = isASS ? heading.split(eventMatches[0]) : ['', '']
        const fixedLines: string[] = []

        for (let i = 0; i < entries.length; i += 4) {
          const line = entries[i] as string
          const lineTimestamp = entries[i + 1] as number
          const chunkTimestamp = entries[i + 2] as number
          const duration = entries[i + 3] as number
          const lineParts = isASS ? line.split(',') : []
          const lineIndex = isASS ? Number.parseInt(lineParts[0]) : i / 4
          const startTimestamp = formatFn(chunkTimestamp + lineTimestamp)
          const endTimestamp = formatFn(chunkTimestamp + lineTimestamp + duration)

          const fixedLine = isASS
            ? `Dialogue: ${[lineParts[1], startTimestamp, endTimestamp]
              .concat(lineParts.slice(2))
              .join(',')}`
            : `${lineIndex + 1}\n${startTimestamp.replace('.', ',')} --> ${endTimestamp.replace(
              '.',
              ',',
            )}\n${line}\n`

          if (fixedLines[lineIndex]) {
            fixedLines[lineIndex] += `\n${fixedLine}`
          }
          else {
            fixedLines[lineIndex] = fixedLine
          }
        }

        const data = `${
          isASS ? `${headingParts[0]}${eventMatches[0]}\n` : ''
        }${fixedLines.join('\n')}${headingParts[1]}\n`

        files.push({
          name: `${index + 1}_${language}${isASS ? '.ass' : '.srt'}`,
          language,
          type: isASS ? 'ass' : 'srt',
          data,
        })
      })

      if (files.length === 0) {
        reject(new Error('No data found'))
        return
      }
      resolve(files)
    }

    // Process the stream
    stream.pipeTo(new WritableStream({
      write(chunk) {
        decoder.write(chunk)
      },
      close() {
        processTrackData()
        decoder.end()
      },
    })).catch((error) => {
      reject(error)
    })
  })
}

// Web Worker message handler
onmessage = async (e: MessageEvent<Blob>) => {
  try {
    const file = e.data
    if (!file) {
      throw new Error('No file provided')
    }

    const stream = file.stream()
    const files = await handleStream(stream).catch((error) => {
      postMessage({ type: 'error', error: error.message })
    })

    postMessage({ type: 'success', files })
  }
  catch (error) {
    if (error instanceof Error) {
      postMessage({ type: 'error', error: error.message })
    }
  }
}
