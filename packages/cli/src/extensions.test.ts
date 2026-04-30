import type { CommandRunner } from './types'

import { describe, expect, it } from 'vitest'
import { installExtensions, listInstalledExtensions } from './extensions'

describe('extensions', () => {
  it('解析已安装扩展列表并忽略 Antigravity 噪声', async () => {
    const runner: CommandRunner = async () => ({
      code: 0,
      stderr: '[createInstance] extensionManagementService depends on antigravityAnalytics which is NOT registered.\n',
      stdout: 'antfu.slidev\nVue.volar\n',
    })

    await expect(listInstalledExtensions('antigravity', runner)).resolves.toEqual(new Set([
      'antfu.slidev',
      'vue.volar',
    ]))
  })

  it('已安装扩展直接跳过', async () => {
    const calls: string[][] = []
    const runner: CommandRunner = async (_command, args) => {
      calls.push(args)

      return {
        code: 0,
        stderr: '',
        stdout: args[0] === '--list-extensions' ? 'antfu.slidev\n' : '',
      }
    }

    await expect(installExtensions(['antfu.slidev'], 'antigravity', { runner })).resolves.toEqual([
      { id: 'antfu.slidev', status: 'skipped', message: '已安装' },
    ])
    expect(calls).toEqual([['--list-extensions']])
  })

  it('安装命令崩溃但扩展最终存在时算成功', async () => {
    let listCount = 0
    const runner: CommandRunner = async (_command, args) => {
      if (args[0] === '--list-extensions') {
        listCount += 1
        return {
          code: 0,
          stderr: '',
          stdout: listCount === 1 ? '' : 'antfu.slidev\n',
        }
      }

      return {
        code: 134,
        stdout: '',
        stderr: '[createInstance] extensionManagementService depends on antigravityAnalytics which is NOT registered.\nFATAL ERROR: v8::ToLocalChecked Empty MaybeLocal\n',
      }
    }

    await expect(installExtensions(['antfu.slidev'], 'antigravity', { runner })).resolves.toEqual([
      { id: 'antfu.slidev', status: 'installed', message: '安装后已存在；编辑器 CLI 返回了非零退出码' },
    ])
  })

  it('扩展市场找不到时归类为不可用', async () => {
    const runner: CommandRunner = async (_command, args) => {
      if (args[0] === '--list-extensions') {
        return {
          code: 0,
          stderr: '',
          stdout: '',
        }
      }

      return {
        code: 1,
        stdout: '',
        stderr: `Extension 'mpontus.tab-cycle' not found.
Failed Installing Extensions: mpontus.tab-cycle
`,
      }
    }

    await expect(installExtensions(['mpontus.tab-cycle'], 'antigravity', { runner })).resolves.toEqual([
      { id: 'mpontus.tab-cycle', status: 'unavailable', message: '当前编辑器扩展市场未找到该扩展' },
    ])
  })
})
