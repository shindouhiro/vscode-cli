import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createBackup, formatTimestamp, listExistingSyncTargets } from './backup'

let tempDir: string

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vscode-sync-backup-'))
})

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true })
})

describe('backup', () => {
  it('格式化备份时间戳', () => {
    expect(formatTimestamp(new Date(2026, 3, 30, 9, 8, 7))).toBe('20260430-090807')
  })

  it('只列出存在的同步目标文件', async () => {
    await fs.mkdir(path.join(tempDir, 'snippets'), { recursive: true })
    await fs.writeFile(path.join(tempDir, 'settings.json'), '{}')

    await expect(listExistingSyncTargets(tempDir)).resolves.toEqual(['settings.json'])
  })

  it('创建已有配置备份', async () => {
    await fs.mkdir(path.join(tempDir, 'snippets'), { recursive: true })
    await fs.writeFile(path.join(tempDir, 'settings.json'), '{"a":1}')
    await fs.writeFile(path.join(tempDir, 'snippets', 'global.code-snippets'), '{"b":1}')

    const result = await createBackup(tempDir, new Date(2026, 3, 30, 9, 8, 7))

    expect(result.files).toEqual(['settings.json', path.join('snippets', 'global.code-snippets')])
    expect(result.backupDir).toBe(path.join(tempDir, '.vscode-sync-backups', '20260430-090807'))
    await expect(fs.readFile(path.join(result.backupDir!, 'settings.json'), 'utf8')).resolves.toBe('{"a":1}')
  })
})
