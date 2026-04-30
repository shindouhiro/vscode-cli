import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { getDefaultUserDir, getEditorCommand } from './paths'

describe('paths', () => {
  it('解析 macOS VS Code 默认 User 目录', () => {
    expect(getDefaultUserDir('code', 'darwin', {}, '/Users/me'))
      .toBe(path.join('/Users/me', 'Library', 'Application Support', 'Code', 'User'))
  })

  it('解析 Cursor 默认 User 目录', () => {
    expect(getDefaultUserDir('cursor', 'darwin', {}, '/Users/me'))
      .toBe(path.join('/Users/me', 'Library', 'Application Support', 'Cursor', 'User'))
  })

  it('解析 Antigravity 默认 User 目录', () => {
    expect(getDefaultUserDir('antigravity', 'darwin', {}, '/Users/me'))
      .toBe(path.join('/Users/me', 'Library', 'Application Support', 'Antigravity', 'User'))
  })

  it('解析 Linux XDG 配置目录', () => {
    expect(getDefaultUserDir('vscodium', 'linux', { XDG_CONFIG_HOME: '/tmp/config' }, '/home/me'))
      .toBe(path.join('/tmp/config', 'VSCodium', 'User'))
  })

  it('解析编辑器命令', () => {
    expect(getEditorCommand('code')).toBe('code')
    expect(getEditorCommand('vscodium')).toBe('codium')
  })

  it('优先使用 macOS app 内置 Antigravity CLI', () => {
    expect(getEditorCommand('antigravity', 'darwin', '/Users/me', filePath => filePath === '/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity'))
      .toBe('/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity')
  })

  it('找不到 app 内置 CLI 时回退到命令名', () => {
    expect(getEditorCommand('antigravity', 'darwin', '/Users/me', () => false))
      .toBe('antigravity')
  })
})
