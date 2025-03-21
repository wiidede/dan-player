[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

# Dan Player

<a href="https://dan.wiidede.space/" target="_blank" >
<img alt="Dan Player Logo" src="./playground/public/favicon.svg" width="100px" height="100px">
</a>

Dan Player 是一个基于 Vue 开发的弹幕播放器组件，支持MKV格式，支持ASS、SRT字幕
Dan Player is a bullet screen player component developed based on Vue, supporting MKV format, and supporting ASS, SRT subtitles.

## Features

- 基础功能：播放、控制
- 弹幕功能（基于Comment Core Library）
- 键盘快捷键
- 国际化，支持中文、英文已经自定义
- 支持 MKV 格式，读取srt、ass字幕 by [@wiidede/ebml](https://github.com/wiidede/ebml)
- ass字幕显示 by [ASS.js](https://github.com/weizhenye/ASS)

- Basic functions: play, control
- Danmaku feature (based on Comment Core Library)
- Keyboard shortcuts
- Internationalization, supports Chinese, English and customization
- Supports MKV format, reads srt, ass subtitles by [@wiidede/ebml](https://github.com/wiidede/ebml)
- ass subtitle display by [ASS.js](https://github.com/weizhenye/ASS)

## Demo

[Online Demo 在线演示](https://dan.wiidede.space)

## Quick Start

### 1. Installation

```bash
pnpm add @wiidede/dan-player
```

### 2. Usage in Vue

**In Single-File Components (SFC)**

```vue
<script setup lang="ts">
import DanPlayer from '@wiidede/dan-player'
import { ref } from 'vue'
import '@wiidede/dan-player/dist/index.css' // Import the component's stylesheet

const comments = ref([
  // Fill in your actual comment data here, following the format of ICommentCCL type
])
const additionalFunctions = ref(['loop', 'picture-in-picture'])
const locale = ref('en')
</script>

<template>
  <DanPlayer
    :comments="comments"
    autoplay-on-comment-load
    :additional-functions="additionalFunctions"
    :locale="locale"
  />
</template>
```

**Install Globally**

```ts
import DanPlayer from '@wiidede/dan-player'
// main.ts
import { createApp } from 'vue'
import '@wiidede/dan-player/dist/index.css'

const app = createApp(App)
app.component('DanPlayer', DanPlayer)
app.mount('#app')
```

```ts
declare module 'vue' {
  export interface GlobalComponents {
    DanPlayer: typeof import('dan-player')['default']
  }
}
```

unplugin-vue-components

```ts
import { DanPlayerResolver } from '@wiidede/dan-player/resolver'

// and then add `DanPlayerResolver()` into resolvers
```

## Props

| Name                  | Type                                 | Description                                                                                                                    | Default     |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| comments              | `ICommentCCL[]`                      | An array containing the comment data to be displayed as CCL.                                                                   | `undefined` |
| autoplayOnCommentLoad | `boolean`                            | A boolean flag indicating whether the video should automatically start playing once the comments are loaded.                   | `false`     |
| additionalFunctions   | `('loop' \| 'picture-in-picture')[]` | An array specifying additional functions to enable for the player, such as loop playback and Picture-in-Picture mode.          | `[]`        |
| locale                | `I18nLocale \| I18nMessages`         | The language setting for internationalization. It determines which language's text content will be displayed in the component. | `'en'`      |
| src                   | `string \| Blob`                     | The source URL or Blob object of the video to be played.                                                                       | `undefined` |

## Events

| Name          | Description                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onCommentLoad | This event is emitted when the comment data has been successfully loaded. Parent components can listen to this event to perform additional operations upon comment data availability. |

## Exposed Properties and Methods

The component exposes several properties and methods via `defineExpose` for external components to interact with and control the video player more precisely:

| Name                        | Type       | Description                                                                                                                     |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| playing                     | `boolean`  | Indicates whether the video is currently playing or paused.                                                                     |
| currentTime                 | `number`   | Represents the current playback time of the video in seconds.                                                                   |
| duration                    | `number`   | Holds the total duration of the video in seconds.                                                                               |
| (other relevant properties) | (types)    | (describe the types and purposes of other exposed properties like volume, muted, isPictureInPicture, etc., if applicable)       |
| togglePlay                  | `Function` | A method that can be called to toggle the play/pause state of the video.                                                        |
| (other relevant methods)    | (Function) | (describe the functionality of other exposed methods such as togglePictureInPicture, toggleFullscreen, etc., if there are more) |

## Styling Customization

与修改element-plus主题保持一致，不过只能修改颜色

## License

[MIT License](./LICENSE) © 2023-PRESENT [wiidede](https://github.com/wiidede)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@wiidede/dan-player?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@wiidede/dan-player
[npm-downloads-src]: https://img.shields.io/npm/dm/@wiidede/dan-player?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@wiidede/dan-player
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@wiidede/dan-player?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@wiidede/dan-player
[license-src]: https://img.shields.io/github/license/wiidede/dan-player.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/wiidede/dan-player/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@wiidede/dan-player
