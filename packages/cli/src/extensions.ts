import type { CommandRunner, ExtensionInstallResult, JsonObject } from './types'
import { spawn } from 'node:child_process'

export const runCommand: CommandRunner = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', reject)
    child.on('close', code => resolve({
      code: code ?? 1,
      stdout,
      stderr,
    }))
  })
}

export function getRecommendedExtensions(extensionsJson: JsonObject): string[] {
  const recommendations = extensionsJson.recommendations

  if (!Array.isArray(recommendations))
    return []

  return recommendations.filter((item): item is string => typeof item === 'string')
}

export async function installExtensions(
  extensionIds: string[],
  command: string,
  options: { dryRun?: boolean, runner?: CommandRunner } = {},
): Promise<ExtensionInstallResult[]> {
  if (options.dryRun) {
    return extensionIds.map(id => ({
      id,
      status: 'skipped',
      message: 'dry-run',
    }))
  }

  const runner = options.runner ?? runCommand
  const results: ExtensionInstallResult[] = []
  const installedBefore = await listInstalledExtensions(command, runner)

  for (const id of extensionIds) {
    if (isExtensionInstalled(installedBefore, id)) {
      results.push({
        id,
        status: 'skipped',
        message: '已安装',
      })
      continue
    }

    try {
      const result = await runner(command, ['--install-extension', id])
      const output = joinOutput(result.stderr, result.stdout)

      if (result.code === 0) {
        results.push({
          id,
          status: 'installed',
        })
        continue
      }

      const installedAfter = await listInstalledExtensions(command, runner)

      results.push(classifyFailedInstall(id, output || `退出码 ${result.code}`, installedAfter))
    }
    catch (error) {
      results.push({
        id,
        status: 'failed',
        message: summarizeInstallError(error instanceof Error ? error.message : String(error)),
      })
    }
  }

  return results
}

export async function listInstalledExtensions(command: string, runner: CommandRunner): Promise<Set<string>> {
  try {
    const result = await runner(command, ['--list-extensions'])
    const output = joinOutput(result.stdout, result.stderr)

    if (result.code !== 0)
      return new Set()

    return new Set(output
      .split(/\r?\n/)
      .map(line => line.trim().toLowerCase())
      .filter(line => /^[\w-]+\.[\w.-]+$/.test(line)))
  }
  catch {
    return new Set()
  }
}

function classifyFailedInstall(id: string, output: string, installedExtensions: Set<string>): ExtensionInstallResult {
  if (isExtensionInstalled(installedExtensions, id)) {
    return {
      id,
      status: 'installed',
      message: '安装后已存在；编辑器 CLI 返回了非零退出码',
    }
  }

  if (/extension '.+' not found/i.test(output)) {
    return {
      id,
      status: 'unavailable',
      message: '当前编辑器扩展市场未找到该扩展',
    }
  }

  return {
    id,
    status: 'failed',
    message: summarizeInstallError(output),
  }
}

function isExtensionInstalled(installedExtensions: Set<string>, id: string): boolean {
  return installedExtensions.has(id.toLowerCase())
}

function joinOutput(...chunks: string[]): string {
  return chunks.filter(Boolean).join('\n').trim()
}

function summarizeInstallError(output: string): string {
  const lines = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const fatalLine = lines.find(line => /^FATAL ERROR:/i.test(line))
  const abortLine = lines.find(line => /Abort trap/i.test(line))
  const dependencyLine = lines.find(line => /\[createInstance\]/.test(line))
  const failedLine = lines.find(line => /^Failed Installing Extensions:/i.test(line))
  const firstUsefulLine = lines.find(line =>
    !/^[-\s]+$/.test(line)
    && !/^(?:\d+:|at\s|-----|\/Applications\/)/.test(line))

  return [
    dependencyLine,
    fatalLine,
    abortLine,
    failedLine,
    firstUsefulLine,
  ]
    .filter(Boolean)
    .filter((line, index, array) => array.indexOf(line) === index)
    .slice(0, 3)
    .join('；') || '未知错误'
}
