#!/usr/bin/env node
import type { EditorId, SyncResult } from './types'
import process from 'node:process'
import readline from 'node:readline/promises'
import { cac } from 'cac'
import pc from 'picocolors'
import { readConfig, writeConfig } from './config'
import { DEFAULT_SOURCE } from './constants'
import { formatEditor, normalizeEditor, SELECTABLE_EDITORS } from './editors'
import { applySync } from './sync'

const cli = cac('vscode-sync')

cli
  .command('apply', '同步远程 VS Code 配置到本地编辑器')
  .option('--source <url>', '远程 .vscode 地址')
  .option('--editor <editor>', '目标编辑器：vscode、antigravity、cursor')
  .option('--user-dir <path>', '手动指定编辑器 User 配置目录')
  .option('--dry-run', '只展示计划，不写入文件或安装扩展')
  .action(options => runSafely(async () => {
    const config = await readConfig()
    const editor = await resolveApplyEditor(options.editor, config.editor)
    const source = options.source ?? config.source ?? DEFAULT_SOURCE

    const result = await applySync({
      source,
      editor,
      userDir: options.userDir,
      dryRun: options.dryRun,
    })

    printResult(result)

    if (result.extensionResults.some(item => item.status === 'failed'))
      process.exitCode = 1
  }))

cli
  .command('config set source <url>', '持久化默认远程 .vscode 地址')
  .action((url: string) => runSafely(async () => {
    const config = await readConfig()
    await writeConfig({
      ...config,
      source: url,
    })
    console.log(`${pc.green('已保存来源：')} ${url}`)
  }))

cli
  .command('config set editor <editor>', '持久化默认目标编辑器')
  .action((editor: string) => runSafely(async () => {
    const config = await readConfig()
    const normalizedEditor = normalizeEditor(editor)
    await writeConfig({
      ...config,
      editor: normalizedEditor,
    })
    console.log(`${pc.green('已保存编辑器：')} ${formatEditor(normalizedEditor)}`)
  }))

cli
  .command('config get editor', '读取当前持久化目标编辑器')
  .action(() => runSafely(async () => {
    const config = await readConfig()
    console.log(formatEditor(config.editor ?? 'code'))
  }))

cli
  .command('config get source', '读取当前持久化远程 .vscode 地址')
  .action(() => runSafely(async () => {
    const config = await readConfig()
    console.log(config.source ?? DEFAULT_SOURCE)
  }))

cli.help()
cli.version('0.1.0')

cli.parse()

if (!cli.matchedCommand)
  cli.outputHelp()

function runSafely(action: () => Promise<void>): void {
  action().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(pc.red(message))
    process.exitCode = 1
  })
}

function printResult(result: SyncResult): void {
  const verb = result.dryRun ? '预览完成' : '同步完成'
  console.log(pc.bold(pc.green(verb)))
  console.log(`${pc.dim('来源：')} ${result.source}`)
  console.log(`${pc.dim('目标：')} ${result.userDir}`)

  if (result.dryRun) {
    console.log(`${pc.dim('将备份：')} ${result.backup.files.length ? result.backup.files.join(', ') : '无已有文件'}`)
  }
  else if (result.backup.backupDir) {
    console.log(`${pc.dim('备份：')} ${result.backup.backupDir}`)
  }
  else {
    console.log(`${pc.dim('备份：')} 无已有文件`)
  }

  console.log(`${pc.dim('设置项：')} ${result.settingsKeys.length}`)
  console.log(`${pc.dim('代码片段：')} ${result.snippetKeys.length}`)
  printExtensionSummary(result)
}

function printExtensionSummary(result: SyncResult): void {
  const installed = result.extensionResults.filter(item => item.status === 'installed')
  const skipped = result.extensionResults.filter(item => item.status === 'skipped')
  const unavailable = result.extensionResults.filter(item => item.status === 'unavailable')
  const failed = result.extensionResults.filter(item => item.status === 'failed')

  if (result.dryRun) {
    console.log(`${pc.dim('将安装扩展：')} ${skipped.length}`)
    return
  }

  console.log(`${pc.dim('扩展安装：')} ${installed.length} 成功，${skipped.length} 已跳过，${unavailable.length} 不可用，${failed.length} 失败`)

  for (const item of unavailable)
    console.log(`${pc.yellow('不可用')} ${item.id}: ${item.message ?? '当前编辑器扩展市场未找到该扩展'}`)

  for (const item of failed)
    console.log(`${pc.red('失败')} ${item.id}: ${item.message ?? '未知错误'}`)
}

async function resolveApplyEditor(optionEditor?: string, configEditor?: EditorId): Promise<EditorId> {
  if (optionEditor)
    return normalizeEditor(optionEditor)

  if (!process.stdin.isTTY || !process.stdout.isTTY)
    return configEditor ?? 'code'

  return promptEditor(configEditor ?? 'code')
}

async function promptEditor(defaultEditor: EditorId): Promise<EditorId> {
  const safeDefaultEditor = SELECTABLE_EDITORS.some(editor => editor.id === defaultEditor)
    ? defaultEditor
    : 'code'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    console.log(pc.bold('请选择目标编辑器：'))

    for (const [index, editor] of SELECTABLE_EDITORS.entries()) {
      const suffix = editor.id === safeDefaultEditor ? pc.dim(' 默认') : ''
      console.log(`  ${index + 1}. ${editor.label}${suffix}`)
    }

    const answer = await rl.question(`输入序号或名称 [${formatEditor(safeDefaultEditor)}]: `)
    const trimmedAnswer = answer.trim()

    if (!trimmedAnswer)
      return safeDefaultEditor

    return normalizeEditor(trimmedAnswer)
  }
  finally {
    rl.close()
  }
}
