import type { ComponentResolver } from 'unplugin-vue-components'

export interface VueCompStarterResolverOptions {
  /**
   * The name of the component. It should always CapitalCase
   *
   * @default 'VComp'
   */
  name?: string
}

export function VueCompStarterResolver(option: VueCompStarterResolverOptions = {}): ComponentResolver {
  option = {
    name: 'VComp',
    ...option,
  }

  return {
    type: 'component',
    resolve: (name: string) => {
      if (name === option.name) {
        return {
          name: 'Comp',
          as: name,
          from: 'vue-comp-starter',
          sideEffects: 'vue-comp-starter/style.css',
        }
      }
    },
  }
}
