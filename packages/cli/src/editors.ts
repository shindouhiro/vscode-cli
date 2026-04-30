import type { EditorId } from './types'

export interface SelectableEditor {
  id: EditorId
  label: string
  aliases: string[]
}

export const SELECTABLE_EDITORS: SelectableEditor[] = [
  {
    id: 'code',
    label: 'VS Code',
    aliases: ['1', 'vscode', 'vs-code', 'code'],
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    aliases: ['2', 'antigravity'],
  },
  {
    id: 'cursor',
    label: 'Cursor',
    aliases: ['3', 'cursor'],
  },
]

export const SUPPORTED_EDITOR_ALIASES = [
  ...SELECTABLE_EDITORS.flatMap(editor => editor.aliases),
  'code-insiders',
  'vscodium',
] as const

export function normalizeEditor(editor: string): EditorId {
  const normalized = editor.trim().toLowerCase()
  const selectable = SELECTABLE_EDITORS.find(item => item.aliases.includes(normalized))

  if (selectable)
    return selectable.id

  if (normalized === 'code-insiders' || normalized === 'vscodium')
    return normalized

  throw new Error(`不支持的编辑器：${editor}`)
}

export function formatEditor(editor: EditorId): string {
  if (editor === 'code')
    return 'vscode'

  return editor
}
