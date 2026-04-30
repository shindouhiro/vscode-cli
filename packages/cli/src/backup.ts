import type { BackupResult } from './types'
import { promises as fs } from 'node:fs'

import path from 'node:path'

const BACKUP_FILES = [
  'settings.json',
  path.join('snippets', 'global.code-snippets'),
]

export async function listExistingSyncTargets(userDir: string): Promise<string[]> {
  const existing = await Promise.all(BACKUP_FILES.map(async (relativePath) => {
    const filePath = path.join(userDir, relativePath)

    try {
      await fs.access(filePath)
      return relativePath
    }
    catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT')
        return undefined

      throw error
    }
  }))

  return existing.filter(Boolean) as string[]
}

export async function createBackup(userDir: string, now = new Date()): Promise<BackupResult> {
  const files = await listExistingSyncTargets(userDir)

  if (!files.length)
    return { files: [] }

  const backupDir = path.join(userDir, '.vscode-sync-backups', formatTimestamp(now))
  await fs.mkdir(backupDir, { recursive: true })

  await Promise.all(files.map(async (relativePath) => {
    const sourcePath = path.join(userDir, relativePath)
    const targetPath = path.join(backupDir, relativePath)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.copyFile(sourcePath, targetPath)
  }))

  return {
    backupDir,
    files,
  }
}

export function formatTimestamp(date: Date): string {
  const pad = (value: number): string => value.toString().padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
