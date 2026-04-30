import { describe, expect, it } from 'vitest'

import { formatEditor, normalizeEditor, SELECTABLE_EDITORS } from './editors'

describe('editors', () => {
  it('交互选择项只暴露 VS Code、Antigravity、Cursor', () => {
    expect(SELECTABLE_EDITORS.map(editor => editor.label)).toEqual([
      'VS Code',
      'Antigravity',
      'Cursor',
    ])
  })

  it('把 vscode 和 code 映射到 VS Code 内部 ID', () => {
    expect(normalizeEditor('vscode')).toBe('code')
    expect(normalizeEditor('code')).toBe('code')
    expect(normalizeEditor('1')).toBe('code')
  })

  it('把 Antigravity 和 Cursor 选项映射到内部 ID', () => {
    expect(normalizeEditor('2')).toBe('antigravity')
    expect(normalizeEditor('antigravity')).toBe('antigravity')
    expect(normalizeEditor('3')).toBe('cursor')
    expect(normalizeEditor('cursor')).toBe('cursor')
  })

  it('格式化 VS Code 显示名称', () => {
    expect(formatEditor('code')).toBe('vscode')
    expect(formatEditor('antigravity')).toBe('antigravity')
  })
})
