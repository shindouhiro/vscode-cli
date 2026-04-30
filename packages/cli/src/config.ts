import type { SyncConfig } from './types'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { parseJsoncObject, stringifyJsonObject } from './jsonc'

export function getConfigFilePath(env: NodeJS.ProcessEnv = process.env, home: string = os.homedir()): string {
  const configHome = env.XDG_CONFIG_HOME || path.join(home, '.config')
  return path.join(configHome, 'vscode-sync', 'config.json')
}

export async function readConfig(configPath = getConfigFilePath()): Promise<SyncConfig> {
  try {
    const content = await fs.readFile(configPath, 'utf8')
    return parseJsoncObject(content, configPath) as SyncConfig
  }
  catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT')
      return {}

    throw error
  }
}

export async function writeConfig(config: SyncConfig, configPath = getConfigFilePath()): Promise<void> {
  await fs.mkdir(path.dirname(configPath), { recursive: true })
  await fs.writeFile(configPath, stringifyJsonObject(config), 'utf8')
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
