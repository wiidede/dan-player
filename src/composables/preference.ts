import type { Preference } from '../type'
import { toRefs, useLocalStorage } from '@vueuse/core'

export function usePreference() {
  const defaultValue: Preference = {
    commentShadow: 'shadow',
    commentWeight: 300,
    commentHeight: 100,
    commentOpacity: 33,
    commentSize: 36,
    commentSpeed: 0.5,
    commentOffset: 0,
    commentLimit: 0,
    showComment: true,
  }

  // Old settings
  const oldValue = localStorage.getItem('dan-player-settings')
  if (oldValue)
    localStorage.removeItem('dan-player-settings')

  const preference = useLocalStorage<Preference>('dan-player-preference', Object.assign(oldValue ? JSON.parse(oldValue) : {}, defaultValue))

  return toRefs(preference)
}
