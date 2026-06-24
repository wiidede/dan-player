# Repository Guidelines

## Project Structure & Module Organization

This package is a Vue 3 component library for danmaku video playback. Main source lives in `src/`: `DanPlayer.vue` is the entry component, `components/` holds UI pieces, `composables/` contains player logic, `constants/` and `type.ts` define shared values and types, and `workers/` contains the MKV extraction worker. Styles and static icons live in `src/styles/` and `src/assets/`. The local demo app is in `playground/`, and production output is generated into `dist/`.

## Build, Test, and Development Commands

Use `pnpm` (workspace lockfile is committed).

- `pnpm dev` - run the playground in play mode for interactive component work.
- `pnpm dev:pkg` - run the playground against the package-oriented Vite setup.
- `pnpm build` - build the library into `dist/`.
- `pnpm build:play` - build both the library and the playground site.
- `pnpm lint` - run ESLint with Antfu and UnoCSS rules.
- `pnpm typecheck` - run `vue-tsc --noEmit`.
- `pnpm test` - run Vitest.
- `pnpm preview` - preview the built playground locally.

## Coding Style & Naming Conventions

Follow the existing Vue 3 + TypeScript style with `<script setup>`. Use 2-space indentation, keep files ESM-only, and prefer composables for reusable behavior. Name Vue components in PascalCase (`CommentSender.vue`), composables in camelCase with a `use` prefix (`useDanmu.ts`), and constants in focused domain files under `src/constants/`. Linting is enforced by [`eslint.config.js`](/Users/wangziyu/github/dan-player/eslint.config.js); run `pnpm lint` before opening a PR.

## Testing Guidelines

Vitest is configured as the test runner. Place new tests near the feature they cover or under a colocated `__tests__` folder, and name them `*.test.ts`. Prefer focused unit tests for composables, parsing helpers, and player interactions. At minimum, contributors should run `pnpm test`, `pnpm lint`, and `pnpm typecheck` before submitting changes.

## Commit & Pull Request Guidelines

Recent history follows short conventional-style messages such as `fix: show volume break ui`, `docs: update readme`, and `chore: update dep`. Keep commits small and use prefixes like `fix:`, `feat:`, `docs:`, or `chore:`. PRs should include a brief summary, testing notes, and screenshots or short recordings for UI/playground changes. Link related issues when applicable.

## CI & Release Notes

GitHub Actions runs linting, build, and type-check jobs on pushes and pull requests to `main`. Releases also rely on `pnpm release`, which chains lint, typecheck, build, and `bumpp`. Avoid changing release or workflow files unless the delivery process itself is part of the task.
