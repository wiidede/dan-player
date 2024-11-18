export interface ICommentCCL {
  text: string
  stime: number
  color: number
  mode: number
  size: number
}

export interface Preference {
  commentShadow: 'border' | 'shadow' | 'none'
  commentWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  commentHeight: 25 | 50 | 75 | 100
  commentOpacity: number
  commentSize: number
  commentSpeed: number
  commentOffset: number
  commentLimit: number
  showComment: boolean
}
