export interface I18nMessages {
  play: string
  pause: string
  mute: string
  unmute: string
  fullscreen: string
  exitFullscreen: string
  pip: string
  exitPip: string
  speed: string
  volume: string
  currentTime: string
  duration: string
  resolution: string
  networkState: string
  videoInfo: string
  playerInfo: string
  keyboardShortcuts: string
  version: string
  author: string
  commentStyle: string
  // Keyboard shortcuts descriptions
  playPause: string
  backward: string
  forward: string
  volumeUp: string
  volumeDown: string
  muteUnmute: string
  speedDown: string
  speedUp: string
  // Comment Style additional translations
  notTransparent: string
  displayArea: string
  barrageSpeed: string
  fontSize: string
  barrageWeight: string
  sameScreenNumber: string
  barrageShadow: string
  barrageOffset: string
  border: string
  shadow: string
  none: string
}

export type I18nLocale = 'en' | 'zh'

const en: I18nMessages = {
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',
  pip: 'Picture in Picture',
  exitPip: 'Exit Picture in Picture',
  speed: 'Speed',
  volume: 'Volume',
  currentTime: 'Current Time',
  duration: 'Duration',
  resolution: 'Resolution',
  networkState: 'Network State',
  videoInfo: 'Video Information',
  playerInfo: 'Player Information',
  keyboardShortcuts: 'Keyboard Shortcuts',
  version: 'Version',
  author: 'Author',
  commentStyle: 'Comment Style',
  // Keyboard shortcuts descriptions
  playPause: 'Play/Pause',
  backward: 'Backward 5s',
  forward: 'Forward 5s',
  volumeUp: 'Volume Up',
  volumeDown: 'Volume Down',
  muteUnmute: 'Mute/Unmute',
  speedDown: 'Speed -0.25x',
  speedUp: 'Speed +0.25x',
  // Comment Style additional translations
  notTransparent: 'Opacity',
  displayArea: 'Display Area',
  barrageSpeed: 'Barrage Speed',
  fontSize: 'Font Size',
  barrageWeight: 'Font Weight',
  sameScreenNumber: 'Comments Number',
  barrageShadow: 'Comment Shadow',
  barrageOffset: 'Comment Offset',
  border: 'Border',
  shadow: 'Shadow',
  none: 'None',
}

const zh: I18nMessages = {
  play: '播放',
  pause: '暂停',
  mute: '静音',
  unmute: '取消静音',
  fullscreen: '全屏',
  exitFullscreen: '退出全屏',
  pip: '画中画',
  exitPip: '退出画中画',
  speed: '速度',
  volume: '音量',
  currentTime: '当前时间',
  duration: '总时长',
  resolution: '分辨率',
  networkState: '网络状态',
  videoInfo: '视频信息',
  playerInfo: '播放器信息',
  keyboardShortcuts: '键盘快捷键',
  version: '版本',
  author: '作者',
  commentStyle: '弹幕样式',
  // Keyboard shortcuts descriptions
  playPause: '播放/暂停',
  backward: '后退5秒',
  forward: '前进5秒',
  volumeUp: '增加音量',
  volumeDown: '降低音量',
  muteUnmute: '静音/取消静音',
  speedDown: '速度 -0.25x',
  speedUp: '速度 +0.25x',
  // Comment Style additional translations
  notTransparent: '不透明度',
  displayArea: '显示区域',
  barrageSpeed: '弹幕速度',
  fontSize: '字体大小',
  barrageWeight: '弹幕字重',
  sameScreenNumber: '同屏数量',
  barrageShadow: '弹幕阴影',
  barrageOffset: '弹幕偏移',
  border: '描边',
  shadow: '阴影',
  none: '无',
}

const messages: Record<I18nLocale, I18nMessages> = {
  en,
  zh,
}

export function useI18n(locale: MaybeRefOrGetter<I18nLocale | I18nMessages>) {
  const t = computed(() => {
    const lo = toValue(locale)
    if (typeof lo === 'string')
      return messages[lo]
    return lo
  })

  return {
    t,
  }
}
