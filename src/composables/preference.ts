import type { Preference } from '../type'
import { toRefs, useLocalStorage } from '@vueuse/core'

export function usePreference() {
  const defaultValue: Preference = {
    commentShadow: 'shadow',
    commentWeight: 300,
    commentHeight: 100,
    commentOpacity: 80,
    commentSize: 26,
    commentSpeed: 0.5,
    commentOffset: 0,
    commentLimit: 0,
    showComment: true,
  }

  const preference = useLocalStorage<Preference>('dan-player-preference', defaultValue)

  return toRefs(preference)
}
