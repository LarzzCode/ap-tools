export type ToolCategory =
  | 'image'
  | 'links'
  | 'media'
  | 'pdf'
  | 'text'

export type ToolRuntime =
  | 'browser'
  | 'local-service'

export interface ToolGuideContent {
  overviewId: string
  overviewEn: string
  stepsId: string[]
  stepsEn: string[]
  tipsId: string[]
  tipsEn: string[]
}

export interface Tool {
  id: string
  name: string
  nameId: string
  description: string
  descriptionId: string
  category: ToolCategory
  runtime: ToolRuntime
  path: string
  keywords: string[]
  featured?: boolean
  /**
   * ISO timestamp when this tool batch was published to GitHub.
   * The "NEW" badge is shown only for the latest batch AND expires after 3 days.
   */
  addedAt?: string
  guide: ToolGuideContent
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function isToolNew(
  tool: Tool,
  allTools: Tool[],
  nowMs: number = Date.now(),
): boolean {
  if (!tool.addedAt) return false
  const toolTime = Date.parse(tool.addedAt)
  if (!Number.isFinite(toolTime)) return false

  let latestBatchTime = 0
  for (const item of allTools) {
    if (item.addedAt) {
      const parsed = Date.parse(item.addedAt)
      if (Number.isFinite(parsed) && parsed > latestBatchTime) {
        latestBatchTime = parsed
      }
    }
  }

  // Only tools belonging to the most recently uploaded batch keep the NEW badge
  if (toolTime < latestBatchTime) {
    return false
  }

  // Expires 3 days after upload timestamp
  const elapsed = nowMs - toolTime
  return elapsed <= THREE_DAYS_MS
}