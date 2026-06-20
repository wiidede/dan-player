import type { ComputedRef, Ref } from 'vue'
import type { I18nMessages } from './useI18n'
import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

interface ShortcutDef {
  label: string
  keys: Ref<boolean>
  description: () => string
  action: () => void
}

export interface UsePlayerKeyboardOptions {
  playing: Ref<boolean>
  currentTime: Ref<number>
  volume: Ref<number>
  muted: Ref<boolean>
  rate: Ref<number>
  isPictureInPicture: Ref<boolean>
  supportsPictureInPicture: boolean
  isWebFullscreen: Ref<boolean>
  togglePlay: (value?: boolean) => boolean
  togglePictureInPicture: () => Promise<void | PictureInPictureWindow>
  toggleWebFullscreen: (value?: boolean) => boolean
  handleFullscreen: (mode: 'web' | 'native') => void
  showToast: (message: string) => void
  t: ComputedRef<I18nMessages>
}

export function usePlayerKeyboard(options: UsePlayerKeyboardOptions) {
  const {
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
  } = options

  const {
    space,
    arrowUp,
    arrowDown,
    arrowLeft,
    arrowRight,
    m,
    f,
    w,
    p,
    bracketLeft,
    bracketRight,
    escape,
  } = useMagicKeys()

  const activeElement = useActiveElement()
  const notUsingInput = computed(() =>
    activeElement.value?.tagName !== 'INPUT'
    && activeElement.value?.tagName !== 'TEXTAREA'
    && !(activeElement.value instanceof HTMLElement && activeElement.value.isContentEditable),
  )

  const shortcuts: ShortcutDef[] = [
    {
      label: 'Space',
      keys: space,
      description: () => t.value.playPause,
      action: () => {
        togglePlay()
        showToast(`${playing.value ? t.value.play : t.value.pause}`)
      },
    },
    {
      label: '←',
      keys: arrowLeft,
      description: () => t.value.backward,
      action: () => {
        currentTime.value -= 5
        showToast(t.value.backward)
      },
    },
    {
      label: '→',
      keys: arrowRight,
      description: () => t.value.forward,
      action: () => {
        currentTime.value += 5
        showToast(t.value.forward)
      },
    },
    {
      label: '↑',
      keys: arrowUp,
      description: () => t.value.volumeUp,
      action: () => {
        volume.value = Math.min(1, volume.value + 0.1)
        showToast(`${t.value.volume}: ${Math.round(volume.value * 100)}%`)
      },
    },
    {
      label: '↓',
      keys: arrowDown,
      description: () => t.value.volumeDown,
      action: () => {
        volume.value = Math.max(0, volume.value - 0.1)
        showToast(`${t.value.volume}: ${Math.round(volume.value * 100)}%`)
      },
    },
    {
      label: 'M',
      keys: m,
      description: () => t.value.muteUnmute,
      action: () => {
        muted.value = !muted.value
        showToast(muted.value ? t.value.mute : t.value.unmute)
      },
    },
    {
      label: 'W',
      keys: w,
      description: () => t.value.webFullscreen,
      action: () => handleFullscreen('web'),
    },
    {
      label: 'F',
      keys: f,
      description: () => t.value.fullscreen,
      action: () => handleFullscreen('native'),
    },
    {
      label: 'P',
      keys: p,
      description: () => t.value.pip,
      action: () => {
        if (supportsPictureInPicture) {
          togglePictureInPicture()
          showToast(isPictureInPicture.value ? t.value.exitPip : t.value.pip)
        }
      },
    },
    {
      label: '[',
      keys: bracketLeft,
      description: () => t.value.speedDown,
      action: () => {
        rate.value = Math.max(0.5, rate.value - 0.25)
        showToast(`${t.value.speed}: ${rate.value}x`)
      },
    },
    {
      label: ']',
      keys: bracketRight,
      description: () => t.value.speedUp,
      action: () => {
        rate.value = Math.min(3, rate.value + 0.25)
        showToast(`${t.value.speed}: ${rate.value}x`)
      },
    },
  ]

  shortcuts.forEach(({ keys, action }) => {
    whenever(logicAnd(keys, notUsingInput), action)
  })

  whenever(logicAnd(escape, notUsingInput), () => {
    if (isWebFullscreen.value) {
      toggleWebFullscreen()
      showToast(t.value.exitWebFullscreen)
    }
  })

  const keyboardShortcuts = computed(() => shortcuts.map(({ label, description }) => ({ key: label, description: description() })))

  return {
    keyboardShortcuts,
  }
}
