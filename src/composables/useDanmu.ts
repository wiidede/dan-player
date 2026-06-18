import type { Manager } from 'danmu'
import type { MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ICommentCCL } from '../type'
import { unrefElement, useElementSize, useToggle } from '@vueuse/core'
import { create } from 'danmu'
import { toValue, watch } from 'vue'
import { usePreference } from './preference'

const SEEK_THRESHOLD_MS = 1000
const DEFAULT_DURATION_MS = 4000

function toHexColor(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

function getFacileDirection(mode: number): 'left' | 'right' {
  return mode === 6 ? 'left' : 'right'
}

function isFlexibleMode(mode: number) {
  return mode === 4 || mode === 5
}

function findFirstIndexAfterTime(comments: ICommentCCL[], timeMs: number): number {
  let left = 0
  let right = comments.length
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (comments[mid].stime <= timeMs) {
      left = mid + 1
    }
    else {
      right = mid
    }
  }
  return left
}

export function useDanmu(
  comments: MaybeRefOrGetter<ICommentCCL[] | undefined>,
  autoplayOnCommentLoad: MaybeRefOrGetter<boolean | undefined>,
  onCommentLoad: () => void,
  videoRef: MaybeRef<HTMLVideoElement | undefined>,
  target: MaybeRef<HTMLElement | undefined>,
  playing: Ref<boolean>,
  currentTime: Ref<number>,
) {
  const { commentHeight, commentSpeed, commentSize, showComment, commentOffset, commentLimit, commentMode } = usePreference()
  const toggleShowComment = useToggle(showComment)

  function getTrackHeight() {
    return Math.round(commentSize.value * 1.2)
  }

  watch(() => unrefElement(target), (el, _prevEl, onCleanup) => {
    if (!el)
      return

    let sortedComments: ICommentCCL[] = []
    let lastTimeMs = -Infinity
    let topIndex = 0
    let bottomIndex = 0

    const { width, height } = useElementSize(target)

    const manager: Manager<ICommentCCL> = create<ICommentCCL>({
      trackHeight: getTrackHeight(),
      interval: 100,
      direction: 'right',
      mode: commentMode.value,
      distribution: 'order',
      rate: commentSpeed.value,
      durationRange: [DEFAULT_DURATION_MS, DEFAULT_DURATION_MS],
      limits: {
        view: commentLimit.value || Infinity,
        stash: 5000,
      },
      plugin: {
        $createNode(danmaku, node) {
          node.textContent = danmaku.data.text
          node.className = 'danmaku-comment'
          const { color } = danmaku.data
          if (color !== 0xFFFFFF) {
            node.style.color = toHexColor(color)
          }
        },
      },
    })

    manager.mount(el)
    manager.setArea({ y: { end: `${commentHeight.value}%` } })

    function getTimeMs() {
      return Math.round((currentTime.value + (commentOffset.value || 0)) * 1000)
    }

    function startDanmu() {
      if (!showComment.value || !playing.value)
        return
      manager.unfreeze()
      sync(getTimeMs())
    }

    function stopDanmu(clear = false) {
      manager.freeze()
      if (clear)
        manager.clear()
    }

    function resetCounters() {
      topIndex = 0
      bottomIndex = 0
    }

    function pushComment(cmt: ICommentCCL) {
      if (cmt.mode === 7 || cmt.mode === 17)
        return

      if (isFlexibleMode(cmt.mode)) {
        const isTop = cmt.mode === 5
        manager.pushFlexibleDanmaku(cmt, {
          duration: DEFAULT_DURATION_MS,
          direction: 'none',
          position(danmaku, container) {
            const trackCount = manager.trackCount
            if (!trackCount) {
              return {
                x: container.width / 2,
                y: container.height / 2,
              }
            }
            const idx = isTop
              ? (topIndex++ % trackCount)
              : (trackCount - 1 - (bottomIndex++ % trackCount))
            const track = manager.getTrack(idx)
            return {
              x: (container.width - danmaku.getWidth()) / 2,
              y: track.location.middle - danmaku.getHeight() / 2,
            }
          },
        })
      }
      else {
        manager.push(cmt, { direction: getFacileDirection(cmt.mode) })
      }
    }

    function pushCommentsInRange(startMs: number, endMs: number) {
      let i = findFirstIndexAfterTime(sortedComments, startMs)
      while (i < sortedComments.length && sortedComments[i].stime <= endMs) {
        pushComment(sortedComments[i])
        i++
      }
    }

    function resync(timeMs: number) {
      manager.clear()
      resetCounters()
      lastTimeMs = timeMs
    }

    function sync(timeMs: number) {
      if (!showComment.value || !playing.value)
        return

      const diff = timeMs - lastTimeMs
      if (diff < 0 || diff > SEEK_THRESHOLD_MS) {
        resync(timeMs)
        return
      }

      pushCommentsInRange(lastTimeMs, timeMs)
      manager.render()
      lastTimeMs = timeMs
    }

    const stops: (() => void)[] = []

    stops.push(watch(() => toValue(comments), (val) => {
      if (!val || !val.length) {
        sortedComments = []
        resetCounters()
        manager.clear()
        return
      }

      sortedComments = [...val].sort((a, b) => a.stime - b.stime)
      const timeMs = getTimeMs()
      resetCounters()
      manager.clear()
      lastTimeMs = timeMs

      if (toValue(autoplayOnCommentLoad)) {
        const video = unrefElement(videoRef)
        if (video) {
          if (playing.value && showComment.value) {
            manager.unfreeze()
            sync(timeMs)
          }
          video.play().catch((err: unknown) => {
            if (err instanceof Error && err.name === 'NotAllowedError') {
              console.warn('弹幕已加载，受限于浏览器权限，无法自动播放')
            }
            else {
              console.error(err)
            }
          })
        }
      }
      else {
        stopDanmu()
        onCommentLoad()
      }
    }, { immediate: true }))

    stops.push(watch(() => getTimeMs(), (timeMs) => {
      sync(timeMs)
    }))

    stops.push(watch([width, height], () => {
      manager.format()
    }))

    stops.push(watch(commentHeight, (val) => {
      manager.setArea({ y: { end: `${val}%` } })
    }))

    stops.push(watch(commentSpeed, (val) => {
      manager.setRate(val)
    }))

    stops.push(watch(commentLimit, (val) => {
      manager.setLimits({ view: val || Infinity })
    }))

    stops.push(watch(commentSize, (val) => {
      manager.setTrackHeight(Math.round(val * 1.2))
    }))

    stops.push(watch(commentMode, (val) => {
      manager.updateOptions({ mode: val })
    }))

    stops.push(watch(showComment, (val) => {
      val ? startDanmu() : stopDanmu(true)
    }, { immediate: true }))

    stops.push(watch(playing, (val) => {
      val ? startDanmu() : stopDanmu()
    }))

    onCleanup(() => {
      stops.forEach(stop => stop())
      manager.stopPlaying()
      manager.unmount()
    })
  })

  return {
    toggleShowComment,
    commentHeight,
    commentSpeed,
    showComment,
    commentOffset,
    commentLimit,
  }
}
