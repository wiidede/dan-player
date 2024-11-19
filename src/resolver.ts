import type { ComponentResolver } from 'unplugin-vue-components'

export interface DanPlayerResolverOptions {
  /**
   * The name of the component. It should always CapitalCase
   *
   * @default 'DanPlayer'
   */
  name?: string
}

export function DanPlayerResolver(option: DanPlayerResolverOptions = {}): ComponentResolver {
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
          from: '@wiidede/dan-player',
          sideEffects: '@wiidede/dan-player/style.css',
        }
      }
    },
  }
}
