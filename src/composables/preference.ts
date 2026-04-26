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
    subtitleSize: 24,
    subtitleColor: 'white',
    subtitleOpacity: 100,
    subtitleStyle: 'none',
    subtitleBgOpacity: 20,
  }

  const preference = useLocalStorage<Preference>('dan-player-preference', defaultValue)

  const stored = preference.value as unknown as Record<string, unknown>
  Object.keys(defaultValue).forEach((key) => {
    if (stored[key] === undefined) {
      stored[key] = defaultValue[key as keyof Preference]
    }
  })

  return toRefs(preference)
}
