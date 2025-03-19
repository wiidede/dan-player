// Adapted from https://github.com/qgustavor/mkv-extract/ licensed under MIT
import { Decoder, tools } from 'ebml'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'

export interface SubtitleFile {
  name: string
  data: string | Uint8Array
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
    let collectedEnoughData = false
    const entryCounts = new Map<number, number>()
    const MAX_ENTRIES_PER_TRACK = 1000
    const MIN_ENTRIES_THRESHOLD = 50
    let emptyChunksCounter = 0
    const MAX_EMPTY_CHUNKS = 10000
    const abortController = new AbortController()
    const signal = abortController.signal

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
          data,
        })
      })

      if (files.length === 0) {
        reject(new Error('No data found'))
        return
      }

      resolve(files)
    }

    decoder.on('error', (error) => {
      reject(error)
    })

    // Check if we've collected enough subtitle data to stop processing
    const checkIfDone = () => {
      if (tracks.length === 0 || collectedEnoughData)
        return false

      let allTracksHaveMinEntries = true
      let anyTrackHasMaxEntries = false

      tracks.forEach((_, index) => {
        const entryCount = entryCounts.get(index) || 0
        if (entryCount < MIN_ENTRIES_THRESHOLD) {
          allTracksHaveMinEntries = false
        }
        if (entryCount >= MAX_ENTRIES_PER_TRACK) {
          anyTrackHasMaxEntries = true
        }
      })

      if (allTracksHaveMinEntries || anyTrackHasMaxEntries || emptyChunksCounter > MAX_EMPTY_CHUNKS) {
        collectedEnoughData = true
        return true
      }

      return false
    }

    decoder.on('data', (chunk) => {
      // Skip processing if we've collected enough data
      if (collectedEnoughData) {
        if (chunk[1].name === 'FileName' || chunk[1].name === 'FileData') {
          // Continue processing these chunks for embedded subtitle files
        }
        else {
          return // Skip all other chunks
        }
      }

      // Track sections detection
      if (chunk[0] === 'start' && chunk[1].name === 'Tracks') {
        inTracksSection = true
      }
      else if (chunk[0] === 'end' && chunk[1].name === 'Tracks') {
        inTracksSection = false
        if (tracks.length > 0) {
          foundSubtitleTrack = true
          tracks.forEach((_, index) => entryCounts.set(index, 0))
        }
      }

      let processedSubtitleData = false

      switch (chunk[0]) {
        case 'end':
          if (chunk[1].name === 'TrackEntry' && inTracksSection) {
            // Process track entry (1=video, 2=audio, 17=subtitle)
            if (trackTypeTemp === 17) {
              tracks.push(trackIndexTemp)
              trackData.push({ heading: trackHeadingTemp, language: trackLanguageTemp, entries: [] })
            }
          }
          break
        case 'tag':
          // Process embedded subtitle files
          if (chunk[1].name === 'FileName') {
            if (!files[currentFile])
              files[currentFile] = { name: '', data: '' }
            files[currentFile].name = chunk[1].data.toString()
          }
          if (chunk[1].name === 'FileData') {
            if (!files[currentFile])
              files[currentFile] = { name: '', data: '' }
            files[currentFile].data = chunk[1].data
          }

          // Only process track info when in Tracks section
          if (inTracksSection) {
            if (chunk[1].name === 'TrackNumber')
              trackIndexTemp = chunk[1].data[0]
            if (chunk[1].name === 'TrackType')
              trackTypeTemp = chunk[1].data[0]
            if (chunk[1].name === 'CodecPrivate')
              trackHeadingTemp = chunk[1].data.toString()
            if (chunk[1].name === 'Language')
              trackLanguageTemp = chunk[1].value
          }

          // Only process subtitle data if we've found subtitle tracks
          if (foundSubtitleTrack) {
            if (chunk[1].name === 'SimpleBlock' || chunk[1].name === 'Block') {
              const trackLength = tools.readVint(chunk[1].data)
              trackIndex = tracks.indexOf(trackLength.value)
              if (trackIndex !== -1) {
                const timestampArray = new Uint8Array(chunk[1].data).slice(
                  trackLength.length,
                  trackLength.length + 2,
                )
                const timestamp = new DataView(timestampArray.buffer).getInt16(0)
                const lineData = chunk[1].data.slice(trackLength.length + 3)
                trackData[trackIndex].entries.push(
                  lineData.toString(),
                  timestamp,
                  currentTimecode,
                )

                // Update entry count and check if we can stop processing
                const currentCount = entryCounts.get(trackIndex) || 0
                entryCounts.set(trackIndex, currentCount + 1)
                processedSubtitleData = true

                if (checkIfDone()) {
                  abortController.abort()
                  processTrackData()
                }
              }
            }
            if (chunk[1].name === 'Timecode') {
              currentTimecode = readUnsignedInteger(padZeroes(chunk[1].data))
            }
            if (chunk[1].name === 'BlockDuration' && trackIndex !== -1) {
              const duration = readUnsignedInteger(padZeroes(chunk[1].data))
              trackData[trackIndex].entries.push(duration)
            }
          }
          break
      }

      // Track empty chunks to help decide when to stop early
      if (foundSubtitleTrack && !processedSubtitleData) {
        emptyChunksCounter++
        if (emptyChunksCounter % 10000 === 0) {
          let allTracksHaveSomeData = true
          tracks.forEach((_, index) => {
            if ((entryCounts.get(index) || 0) < 10) {
              allTracksHaveSomeData = false
            }
          })

          if (allTracksHaveSomeData && checkIfDone()) {
            abortController.abort()
            processTrackData()
          }
        }
      }

      if (files[currentFile]?.name && files[currentFile]?.data) {
        currentFile++
      }
    })

    // Use AbortController to enable early termination
    stream.pipeTo(new WritableStream({
      write(chunk) {
        if (signal.aborted)
          return
        decoder.write(Buffer.from(chunk))
      },
      close() {
        if (!signal.aborted) {
          processTrackData()
        }
      },
    }), { signal }).catch((error) => {
      if (error.name !== 'AbortError') {
        reject(error)
      }
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
