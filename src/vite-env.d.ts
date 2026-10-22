/// <reference types="vite/client" />

declare const __BUILD_INFO__: {
  version: string
  commit: string
  branch: string
  context: string
  pullRequest: string | null
  deployId: string | null
  builtAt: string
}
