export type ToolCategory =
  | 'image'
  | 'links'
  | 'media'
  | 'pdf'
  | 'text'

export type ToolRuntime =
  | 'browser'
  | 'local-service'

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  runtime: ToolRuntime
  path: string
  keywords: string[]
  featured?: boolean
}