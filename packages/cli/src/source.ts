import type { RemoteFileName, RemoteFiles } from './types'

import path from 'node:path'
import { REMOTE_FILES } from './constants'

export function resolveRemoteFileUrl(source: string, file: RemoteFileName): string {
  const url = new URL(source)

  if (url.hostname === 'raw.githubusercontent.com')
    return resolveRawGithubUrl(url, file)

  if (url.hostname === 'github.com')
    return resolveGithubPageUrl(url, file)

  return appendRemoteFile(url, file)
}

export async function fetchRemoteFiles(source: string): Promise<RemoteFiles> {
  const entries = await Promise.all(REMOTE_FILES.map(async (file) => {
    const url = resolveRemoteFileUrl(source, file)
    const response = await fetch(url)

    if (!response.ok)
      throw new Error(`拉取 ${file} 失败：${response.status} ${response.statusText}`)

    return [file, await response.text()] as const
  }))

  return Object.fromEntries(entries) as RemoteFiles
}

function resolveRawGithubUrl(url: URL, file: RemoteFileName): string {
  const pathname = withoutKnownFile(url.pathname)
  url.pathname = joinUrlPath(pathname, file)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function resolveGithubPageUrl(url: URL, file: RemoteFileName): string {
  const segments = url.pathname.split('/').filter(Boolean)
  const markerIndex = segments.findIndex(segment => segment === 'tree' || segment === 'blob')

  if (segments.length < 4 || markerIndex < 2)
    throw new Error(`不支持的 GitHub 地址：${url.toString()}`)

  const [owner, repo] = segments
  const branch = segments[markerIndex + 1]
  const sourcePath = segments.slice(markerIndex + 2)
  const directoryPath = segments[markerIndex] === 'blob'
    ? stripKnownFile(sourcePath)
    : sourcePath

  const rawUrl = new URL('https://raw.githubusercontent.com')
  rawUrl.pathname = joinUrlPath('/', owner, repo, branch, ...directoryPath, file)
  return rawUrl.toString()
}

function appendRemoteFile(url: URL, file: RemoteFileName): string {
  url.pathname = joinUrlPath(withoutKnownFile(url.pathname), file)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function withoutKnownFile(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  return joinUrlPath('/', ...stripKnownFile(segments))
}

function stripKnownFile(segments: string[]): string[] {
  const basename = segments.at(-1)

  if (basename && REMOTE_FILES.includes(basename as RemoteFileName))
    return segments.slice(0, -1)

  return segments
}

function joinUrlPath(...parts: string[]): string {
  const joined = path.posix.join(...parts.filter(Boolean))
  return joined.startsWith('/') ? joined : `/${joined}`
}
