export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  readingMinutes: number
}

export function getTextStats(input: string): TextStats {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      characters: input.length,
      charactersNoSpaces: input.replace(/\s/g, '').length,
      words: 0,
      lines: input ? input.split(/\r\n|\r|\n/).length : 0,
      paragraphs: 0,
      readingMinutes: 0,
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length
  const lines = input.split(/\r\n|\r|\n/).length
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .filter((block) => block.trim().length > 0).length

  return {
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/g, '').length,
    words,
    lines,
    paragraphs,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  }
}

export type CaseTransformKind =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab'

const SMALL_TITLE_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'di',
  'dan',
  'dari',
  'for',
  'in',
  'ke',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'yang',
])

function splitIdentifierWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function transformTextCase(
  input: string,
  kind: CaseTransformKind,
): string {
  switch (kind) {
    case 'upper':
      return input.toUpperCase()

    case 'lower':
      return input.toLowerCase()

    case 'title':
      return input
        .toLowerCase()
        .replace(/\b([a-z\u00C0-\u024F']+)\b/gi, (word, _group, offset) => {
          const lower = word.toLowerCase()
          if (offset > 0 && SMALL_TITLE_WORDS.has(lower)) {
            return lower
          }
          return lower.charAt(0).toUpperCase() + lower.slice(1)
        })

    case 'sentence':
      return input
        .toLowerCase()
        .replace(/(^\s*[a-z\u00C0-\u024F]|[.!?]\s+[a-z\u00C0-\u024F])/g, (m) =>
          m.toUpperCase(),
        )

    case 'camel':
      return input
        .split(/\r?\n/)
        .map((line) => {
          const words = splitIdentifierWords(line)
          return words
            .map((word, index) => {
              const lower = word.toLowerCase()
              if (index === 0) return lower
              return lower.charAt(0).toUpperCase() + lower.slice(1)
            })
            .join('')
        })
        .join('\n')

    case 'snake':
      return input
        .split(/\r?\n/)
        .map((line) =>
          splitIdentifierWords(line)
            .map((word) => word.toLowerCase())
            .join('_'),
        )
        .join('\n')

    case 'kebab':
      return input
        .split(/\r?\n/)
        .map((line) =>
          splitIdentifierWords(line)
            .map((word) => word.toLowerCase())
            .join('-'),
        )
        .join('\n')
  }
}

export function unwrapPdfLineBreaks(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/-\n(?=[a-z\u00C0-\u024F])/gi, '')
    .replace(/([^\n])\n(?!\n)/g, '$1 ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function collapseExtraSpaces(input: string): string {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function removeEmptyLines(input: string): string {
  return input
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join('\n')
}

export function deduplicateLines(input: string): string {
  const seen = new Set<string>()
  const result: string[] = []

  for (const line of input.split(/\r?\n/)) {
    if (!seen.has(line)) {
      seen.add(line)
      result.push(line)
    }
  }

  return result.join('\n')
}

export function sortLines(input: string, descending = false): string {
  const lines = input.split(/\r?\n/)
  lines.sort((a, b) =>
    descending ? b.localeCompare(a) : a.localeCompare(b),
  )
  return lines.join('\n')
}

export interface JsonFormatResult {
  valid: boolean
  formatted: string
  error: string | null
  keyCount: number
}

function countJsonNodes(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countJsonNodes(item), 1)
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>)
    return entries.reduce<number>(
      (sum, item) => sum + countJsonNodes(item),
      entries.length,
    )
  }

  return 0
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const sorted: Record<string, unknown> = {}

    for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortJsonKeys(record[key])
    }

    return sorted
  }

  return value
}

export function formatJsonText(
  input: string,
  options: {
    indent: number | 'tab'
    minify?: boolean
    sortKeys?: boolean
  },
): JsonFormatResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      valid: false,
      formatted: '',
      error: null,
      keyCount: 0,
    }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    const normalized = options.sortKeys ? sortJsonKeys(parsed) : parsed
    const space = options.minify
      ? undefined
      : options.indent === 'tab'
        ? '\t'
        : options.indent

    return {
      valid: true,
      formatted: JSON.stringify(normalized, null, space),
      error: null,
      keyCount: countJsonNodes(parsed),
    }
  } catch (caught) {
    return {
      valid: false,
      formatted: '',
      error:
        caught instanceof Error
          ? caught.message
          : 'Invalid JSON syntax.',
      keyCount: 0,
    }
  }
}

export type DiffLineType = 'equal' | 'added' | 'removed'

export interface DiffLine {
  type: DiffLineType
  text: string
  leftLine: number | null
  rightLine: number | null
}

export function computeLineDiff(
  originalText: string,
  modifiedText: string,
): DiffLine[] {
  const a = originalText.split(/\r?\n/)
  const b = modifiedText.split(/\r?\n/)
  const n = a.length
  const m = b.length

  if (n * m > 250_000) {
    // Fallback linear diff for huge inputs to avoid blocking main thread
    const maxLen = Math.max(n, m)
    const lines: DiffLine[] = []
    for (let i = 0; i < maxLen; i++) {
      if (i < n && i < m && a[i] === b[i]) {
        lines.push({
          type: 'equal',
          text: a[i],
          leftLine: i + 1,
          rightLine: i + 1,
        })
      } else {
        if (i < n) {
          lines.push({
            type: 'removed',
            text: a[i],
            leftLine: i + 1,
            rightLine: null,
          })
        }
        if (i < m) {
          lines.push({
            type: 'added',
            text: b[i],
            leftLine: null,
            rightLine: i + 1,
          })
        }
      }
    }
    return lines
  }

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1]
      }
    }
  }

  const result: DiffLine[] = []
  let i = 0
  let j = 0

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({
        type: 'equal',
        text: a[i],
        leftLine: i + 1,
        rightLine: j + 1,
      })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({
        type: 'removed',
        text: a[i],
        leftLine: i + 1,
        rightLine: null,
      })
      i++
    } else {
      result.push({
        type: 'added',
        text: b[j],
        leftLine: null,
        rightLine: j + 1,
      })
      j++
    }
  }

  while (i < n) {
    result.push({
      type: 'removed',
      text: a[i],
      leftLine: i + 1,
      rightLine: null,
    })
    i++
  }

  while (j < m) {
    result.push({
      type: 'added',
      text: b[j],
      leftLine: null,
      rightLine: j + 1,
    })
    j++
  }

  return result
}
