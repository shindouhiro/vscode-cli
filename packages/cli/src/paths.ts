import type { EditorId } from './types'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { EDITOR_COMMANDS } from './constants'

export function getEditorCommand(
  editor: EditorId,
  platform: NodeJS.Platform = process.platform,
  home: string = os.homedir(),
  fileExists: (filePath: string) => boolean = existsSync,
): string {
  if (platform === 'darwin') {
    const command = getDarwinCommandCandidates(editor, home).find(candidate => fileExists(candidate))

    if (command)
      return command
  }

  return EDITOR_COMMANDS[editor]
}

export function getDefaultUserDir(
  editor: EditorId,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  home: string = os.homedir(),
): string {
  if (platform === 'darwin')
    return path.join(home, 'Library', 'Application Support', getDarwinAppDir(editor), 'User')

  if (platform === 'win32') {
    const appData = env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return path.join(appData, getWindowsAppDir(editor), 'User')
  }

  const configHome = env.XDG_CONFIG_HOME || path.join(home, '.config')
  return path.join(configHome, getLinuxAppDir(editor), 'User')
}

function getDarwinAppDir(editor: EditorId): string {
  const dirs: Record<EditorId, string> = {
    'antigravity': 'Antigravity',
    'code': 'Code',
    'code-insiders': 'Code - Insiders',
    'cursor': 'Cursor',
    'vscodium': 'VSCodium',
  }

  return dirs[editor]
}

function getWindowsAppDir(editor: EditorId): string {
  const dirs: Record<EditorId, string> = {
    'antigravity': 'Antigravity',
    'code': 'Code',
    'code-insiders': 'Code - Insiders',
    'cursor': 'Cursor',
    'vscodium': 'VSCodium',
  }

  return dirs[editor]
}

function getLinuxAppDir(editor: EditorId): string {
  const dirs: Record<EditorId, string> = {
    'antigravity': 'Antigravity',
    'code': 'Code',
    'code-insiders': 'Code - Insiders',
    'cursor': 'Cursor',
    'vscodium': 'VSCodium',
  }

  return dirs[editor]
}

function getDarwinCommandCandidates(editor: EditorId, home: string): string[] {
  const appNames: Record<EditorId, string> = {
    'antigravity': 'Antigravity.app',
    'code': 'Visual Studio Code.app',
    'code-insiders': 'Visual Studio Code - Insiders.app',
    'cursor': 'Cursor.app',
    'vscodium': 'VSCodium.app',
  }
  const binNames: Record<EditorId, string> = {
    'antigravity': 'antigravity',
    'code': 'code',
    'code-insiders': 'code-insiders',
    'cursor': 'cursor',
    'vscodium': 'codium',
  }
  const relativePath = path.join('Contents', 'Resources', 'app', 'bin', binNames[editor])

  return [
    path.join('/Applications', appNames[editor], relativePath),
    path.join(home, 'Applications', appNames[editor], relativePath),
  ]
}
