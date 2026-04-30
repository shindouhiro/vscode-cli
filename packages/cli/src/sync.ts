import type { ApplySyncOptions, CommandRunner, RemoteFiles, SyncResult } from './types'
import { promises as fs } from 'node:fs'

import path from 'node:path'
import { createBackup, listExistingSyncTargets } from './backup'
import { getRecommendedExtensions, installExtensions } from './extensions'
import { mergeTopLevel, parseJsoncObject, readJsoncObjectFile, stringifyJsonObject } from './jsonc'
import { getDefaultUserDir, getEditorCommand } from './paths'
import { fetchRemoteFiles } from './source'

export interface ApplySyncDeps {
  fetchFiles?: (source: string) => Promise<RemoteFiles>
  runner?: CommandRunner
  now?: Date
}

export async function applySync(options: ApplySyncOptions, deps: ApplySyncDeps = {}): Promise<SyncResult> {
  const userDir = options.userDir ?? getDefaultUserDir(options.editor)
  const fetchFiles = deps.fetchFiles ?? fetchRemoteFiles
  const remoteFiles = await fetchFiles(options.source)

  const remoteSettings = parseJsoncObject(remoteFiles['settings.json'], '远程 settings.json')
  const remoteSnippets = parseJsoncObject(remoteFiles['global.code-snippets'], '远程 global.code-snippets')
  const remoteExtensions = parseJsoncObject(remoteFiles['extensions.json'], '远程 extensions.json')

  const localSettingsPath = path.join(userDir, 'settings.json')
  const localSnippetsPath = path.join(userDir, 'snippets', 'global.code-snippets')
  const localSettings = await readJsoncObjectFile(localSettingsPath)
  const localSnippets = await readJsoncObjectFile(localSnippetsPath)

  const mergedSettings = mergeTopLevel(localSettings, remoteSettings)
  const mergedSnippets = mergeTopLevel(localSnippets, remoteSnippets)
  const extensionIds = getRecommendedExtensions(remoteExtensions)

  if (options.dryRun) {
    return {
      source: options.source,
      userDir,
      backup: {
        files: await listExistingSyncTargets(userDir),
      },
      settingsKeys: Object.keys(remoteSettings),
      snippetKeys: Object.keys(remoteSnippets),
      extensionResults: await installExtensions(extensionIds, getEditorCommand(options.editor), { dryRun: true }),
      dryRun: true,
    }
  }

  await fs.mkdir(path.join(userDir, 'snippets'), { recursive: true })
  const backup = await createBackup(userDir, deps.now)

  await Promise.all([
    fs.writeFile(localSettingsPath, stringifyJsonObject(mergedSettings), 'utf8'),
    fs.writeFile(localSnippetsPath, stringifyJsonObject(mergedSnippets), 'utf8'),
  ])

  const extensionResults = await installExtensions(extensionIds, getEditorCommand(options.editor), {
    runner: deps.runner,
  })

  return {
    source: options.source,
    userDir,
    backup,
    settingsKeys: Object.keys(remoteSettings),
    snippetKeys: Object.keys(remoteSnippets),
    extensionResults,
    dryRun: false,
  }
}
