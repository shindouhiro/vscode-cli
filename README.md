# vscode-sync

一个用于同步 VS Code 用户配置的 TypeScript CLI。

默认来源是 `https://github.com/antfu/vscode-settings/tree/main/.vscode`，会拉取并同步：

- `settings.json`
- `global.code-snippets`
- `extensions.json`
 
## 安装

```bash
# 全局安装
npm install -g @shindou/vscode-sync

# 或者直接使用 npx 运行
npx @shindou/vscode-sync apply
```

## 命令

```bash
vscode-sync apply
vscode-sync apply --source <url>
vscode-sync apply --editor vscode|antigravity|cursor
vscode-sync apply --user-dir <path>
vscode-sync apply --dry-run
vscode-sync config set source <url>
vscode-sync config get source
vscode-sync config set editor antigravity
vscode-sync config get editor
```

不传 `--editor` 时会弹出编辑器选择，选项为 `VS Code`、`Antigravity`、`Cursor`。

`settings.json` 和 `global.code-snippets` 会按顶层 key 合并，远程同名 key 覆盖本地，本地独有 key 保留。写入前会把已有文件备份到目标 User 目录下的 `.vscode-sync-backups/<timestamp>/`。
