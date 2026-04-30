import type { RemoteFiles } from './types'
import { promises as fs } from 'node:fs'
import os from 'node:os'

import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applySync } from './sync'

let tempDir: string

const remoteFiles: RemoteFiles = {
  'settings.json': `{
    // 远程值覆盖同名本地值
    "editor.tabSize": 2,
    "workbench.colorTheme": "Vitesse Dark",
  }`,
  'global.code-snippets': `{
    "remote-snippet": {
      "prefix": "rs",
      "body": ["remote"]
    }
  }`,
  'extensions.json': `{
    "recommendations": [
      "antfu.vite",
      "Vue.volar"
    ]
  }`,
}

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vscode-sync-'))
})

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true })
})

describe('applySync', () => {
  it('合并配置、创建备份并安装扩展', async () => {
    await fs.mkdir(path.join(tempDir, 'snippets'), { recursive: true })
    await fs.writeFile(path.join(tempDir, 'settings.json'), `{
      "editor.tabSize": 4,
      "local.only": true
    }`)
    await fs.writeFile(path.join(tempDir, 'snippets', 'global.code-snippets'), `{
      "local-snippet": {
        "prefix": "ls",
        "body": ["local"]
      }
    }`)

    const installed: string[] = []
    const result = await applySync({
      source: 'https://example.com/.vscode',
      editor: 'code',
      userDir: tempDir,
    }, {
      fetchFiles: async () => remoteFiles,
      now: new Date(2026, 3, 30, 9, 8, 7),
      runner: async (_command, args) => {
        if (args[0] === '--install-extension')
          installed.push(args[1])
        return { code: 0, stdout: '', stderr: '' }
      },
    })

    const settings = JSON.parse(await fs.readFile(path.join(tempDir, 'settings.json'), 'utf8'))
    const snippets = JSON.parse(await fs.readFile(path.join(tempDir, 'snippets', 'global.code-snippets'), 'utf8'))

    expect(settings).toMatchObject({
      'editor.tabSize': 2,
      'local.only': true,
      'workbench.colorTheme': 'Vitesse Dark',
    })
    expect(snippets).toHaveProperty('local-snippet')
    expect(snippets).toHaveProperty('remote-snippet')
    expect(result.backup.backupDir).toBe(path.join(tempDir, '.vscode-sync-backups', '20260430-090807'))
    expect(installed).toEqual(['antfu.vite', 'Vue.volar'])
  })

  it('dry-run 不写入文件且只返回计划', async () => {
    const result = await applySync({
      source: 'https://example.com/.vscode',
      editor: 'code',
      userDir: tempDir,
      dryRun: true,
    }, {
      fetchFiles: async () => remoteFiles,
    })

    await expect(fs.access(path.join(tempDir, 'settings.json'))).rejects.toMatchObject({ code: 'ENOENT' })
    expect(result.dryRun).toBe(true)
    expect(result.extensionResults).toEqual([
      { id: 'antfu.vite', status: 'skipped', message: 'dry-run' },
      { id: 'Vue.volar', status: 'skipped', message: 'dry-run' },
    ])
  })

  it('扩展安装失败时记录失败项但保留已写入配置', async () => {
    const result = await applySync({
      source: 'https://example.com/.vscode',
      editor: 'code',
      userDir: tempDir,
    }, {
      fetchFiles: async () => remoteFiles,
      runner: async (_command, args) => ({
        code: args[1] === 'Vue.volar' ? 1 : 0,
        stdout: '',
        stderr: args[1] === 'Vue.volar' ? '安装失败' : '',
      }),
    })

    await expect(fs.access(path.join(tempDir, 'settings.json'))).resolves.toBeUndefined()
    expect(result.extensionResults).toEqual([
      { id: 'antfu.vite', status: 'installed', message: undefined },
      { id: 'Vue.volar', status: 'failed', message: '安装失败' },
    ])
  })
})
