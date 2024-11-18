import type { ComponentResolver } from 'unplugin-vue-components'

export interface VueCompStarterResolverOptions {
  /**
   * The name of the component. It should always CapitalCase
   *
   * @default 'DanPlayer'
   */
  name?: string
}

export function VueCompStarterResolver(option: VueCompStarterResolverOptions = {}): ComponentResolver {
  option = {
    name: 'DanPlayer',
    ...option,
  }

  return {
    type: 'component',
    resolve: (name: string) => {
      if (name === option.name) {
        return {
          name: 'DanPlayer',
          as: name,
          from: 'dan-player',
          sideEffects: 'dan-player/style.css',
        }
      }
    },
  }
}
