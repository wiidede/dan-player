export const commentShadowMap = {
  border: '#000 1px 0 1px, #000 0 1px 1px, #000 0 -1px 1px, #000 -1px 0 1px',
  shadow: 'black 0.1em 0.1em 0.2em',
  none: '0',
} as const
export const commentShadowList = Object.keys(commentShadowMap) as (keyof typeof commentShadowMap)[]
export const commentShadowLabelMap = {
  border: '描边',
  shadow: '阴影',
  none: '无',
} as const
