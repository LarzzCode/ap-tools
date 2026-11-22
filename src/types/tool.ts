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
  guide: ToolGuideContent
}