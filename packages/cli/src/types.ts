export type EditorId = 'antigravity' | 'code' | 'code-insiders' | 'cursor' | 'vscodium'

export type RemoteFileName = 'settings.json' | 'global.code-snippets' | 'extensions.json'

export type JsonObject = Record<string, unknown>

export interface RemoteFiles {
  'settings.json': string
  'global.code-snippets': string
  'extensions.json': string
}

export interface SyncConfig {
  editor?: EditorId
  source?: string
}

export interface ApplySyncOptions {
  source: string
  editor: EditorId
  userDir?: string
  dryRun?: boolean
}

export interface CommandRunner {
  (command: string, args: string[]): Promise<{ code: number, stderr: string, stdout: string }>
}

export interface ExtensionInstallResult {
  id: string
  status: 'failed' | 'installed' | 'skipped' | 'unavailable'
  message?: string
}

export interface BackupResult {
  backupDir?: string
  files: string[]
}

export interface SyncResult {
  source: string
  userDir: string
  backup: BackupResult
  settingsKeys: string[]
  snippetKeys: string[]
  extensionResults: ExtensionInstallResult[]
  dryRun: boolean
}
