import type { WritableComputedRef } from 'vue'
import type { Preference } from '../type'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

const STORAGE_KEY = 'dan-player-preference'

function createDefaultPreference(): Preference {
  return {
    commentShadow: 'shadow',
    commentWeight: 300,
    commentHeight: 100,
    commentOpacity: 80,
    commentSize: 26,
    commentSpeed: 0.5,
    commentOffset: 0,
    commentLimit: 0,
    commentMode: 'adaptive',
    showComment: true,
    subtitleSize: 24,
    subtitleColor: 'white',
    subtitleOpacity: 100,
    subtitleStyle: 'none',
    subtitleBgOpacity: 20,
  }
}

const defaultValue = createDefaultPreference()
const preference = useLocalStorage<Preference>(STORAGE_KEY, defaultValue)

const stored = preference.value as unknown as Record<string, unknown>
Object.keys(defaultValue).forEach((key) => {
  if (stored[key] === undefined) {
    stored[key] = defaultValue[key as keyof Preference]
  }
})

// 不用 toRefs(preference.value)：
// useLocalStorage 在收到 storage 事件时会把 preference.value 替换成一个新 parse 出来的对象，
// toRefs 绑定的是调用瞬间的那个对象引用，替换后就失效了。
// computed 每次读取都重新访问当前 preference.value[key]，所以即使对象被替换也能保持同步。
function createPreferenceRef<K extends keyof Preference>(key: K) {
  return computed<Preference[K]>({
    get: () => preference.value[key],
    set: (val) => {
      preference.value[key] = val
    },
  })
}

type PreferenceRefs = {
  [K in keyof Preference]: WritableComputedRef<Preference[K]>
}

export function usePreference(): PreferenceRefs {
  return Object.fromEntries(
    (Object.keys(defaultValue) as Array<keyof Preference>).map(key => [key, createPreferenceRef(key)]),
  ) as PreferenceRefs
}
