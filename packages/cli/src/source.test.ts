import { describe, expect, it } from 'vitest'

import { resolveRemoteFileUrl } from './source'

describe('resolveRemoteFileUrl', () => {
  it('把 GitHub tree 目录地址转换为 raw 文件地址', () => {
    expect(resolveRemoteFileUrl(
      'https://github.com/antfu/vscode-settings/tree/main/.vscode',
      'settings.json',
    )).toBe('https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode/settings.json')
  })

  it('把 GitHub blob 文件地址转换为同目录 raw 文件地址', () => {
    expect(resolveRemoteFileUrl(
      'https://github.com/antfu/vscode-settings/blob/main/.vscode/settings.json',
      'global.code-snippets',
    )).toBe('https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode/global.code-snippets')
  })

  it('支持 raw GitHub 目录地址', () => {
    expect(resolveRemoteFileUrl(
      'https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode',
      'extensions.json',
    )).toBe('https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode/extensions.json')
  })

  it('支持 raw GitHub 文件地址', () => {
    expect(resolveRemoteFileUrl(
      'https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode/settings.json',
      'extensions.json',
    )).toBe('https://raw.githubusercontent.com/antfu/vscode-settings/main/.vscode/extensions.json')
  })
})
