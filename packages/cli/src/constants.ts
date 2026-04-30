import type { EditorId } from './types'

export const DEFAULT_SOURCE = 'https://github.com/antfu/vscode-settings/tree/main/.vscode'

export const REMOTE_FILES = [
  'settings.json',
  'global.code-snippets',
  'extensions.json',
] as const

export const EDITOR_COMMANDS: Record<EditorId, string> = {
  'antigravity': 'antigravity',
  'code': 'code',
  'code-insiders': 'code-insiders',
  'cursor': 'cursor',
  'vscodium': 'codium',
}
