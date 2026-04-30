import type { JsonObject } from './types'

import { promises as fs } from 'node:fs'

import { parse, printParseErrorCode } from 'jsonc-parser'

export function parseJsoncObject(content: string, label: string): JsonObject {
  const errors: Parameters<typeof parse>[1] = []
  const value = parse(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  })

  if (errors.length) {
    const details = errors
      .map(error => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(', ')
    throw new Error(`${label} 不是有效 JSONC：${details}`)
  }

  if (!isJsonObject(value))
    throw new TypeError(`${label} 必须是 JSON 对象`)

  return value
}

export async function readJsoncObjectFile(filePath: string): Promise<JsonObject> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return parseJsoncObject(content, filePath)
  }
  catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT')
      return {}

    throw error
  }
}

export function mergeTopLevel(local: JsonObject, remote: JsonObject): JsonObject {
  return {
    ...local,
    ...remote,
  }
}

export function stringifyJsonObject(value: JsonObject): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
