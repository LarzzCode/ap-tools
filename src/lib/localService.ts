import { url } from "inspector/promises"

export const LOCAL_SERVICE_URL =
  'http://127.0.0.1:8787'

export interface LocalServiceHealth {
  status: string
  service: string
  version: string
}

export type MediaFormatKind =
  | 'combined'
  | 'video'
  | 'audio'

export interface MediaFormat {
  format_id: string
  kind: MediaFormatKind

  ext: string | null

  width: number | null
  height: number | null
  fps: number | null

  filesize: number | null

  video_codec: string | null
  audio_codec: string | null

  audio_bitrate: number | null
  total_bitrate: number | null
}

export interface MediaAnalysis {
  id: string
  title: string

  webpage_url: string | null
  thumbnail: string | null

  channel: string | null
  channel_url: string | null

  duration: number | null

  formats: MediaFormat[]
}

export type MediaDownloadMode =
  | 'video'
  | 'audio'

export type MediaAudioFormat =
  | 'mp3'
  | 'm4a'

export interface MediaDownloadRequest {
  url: string
  mode: MediaDownloadMode

  quality?: number | null
  audio_format?: MediaAudioFormat
}

export interface MediaDownloadPrepared {
  download_id: string
  filename: string
  download_url: string
}

export async function prepareMediaDownload(
  payload: MediaDownloadRequest,
  signal?: AbortSignal,
): Promise<MediaDownloadPrepared> {
  const response = await fetch(
    `${LOCAL_SERVICE_URL}/media/download/prepare`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        url: payload.url,
        mode: payload.mode,
        quality:
          payload.mode === 'video'
            ? payload.quality ?? null
            : null,

        audio_format:
          payload.audio_format ?? 'mp3',
      }),

      signal,
    },
  )

  const data = (await response
    .json()
    .catch(() => null)) as
    | MediaDownloadPrepared
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const message =
      data &&
      'detail' in data &&
      typeof data.detail === 'string'
        ? data.detail
        : `Download preparation failed with status ${response.status}.`

    throw new Error(message)
  }

  if (
    !data ||
    !('download_url' in data)
  ) {
    throw new Error(
      'Local service returned an unexpected download response.',
    )
  }

  return data
}

export function getLocalDownloadUrl(
  downloadUrl: string,
) {
  return new URL(
    downloadUrl,
    LOCAL_SERVICE_URL,
  ).toString()
}

interface ApiErrorResponse {
  detail?: string
}

function createLocalRequest(
  path: string,
  init: RequestInit = {},
) {
  const url =
    `${LOCAL_SERVICE_URL}${path}`

  return new Request(url, {
    ...init,

    // Local Network Access.
    // Cast sementara karena DOM typings
    // browser/TS bisa berbeda versi.
    targetAddressSpace: 'loopback',
  } as RequestInit)
}

export async function checkLocalService(
  signal?: AbortSignal,
): Promise<LocalServiceHealth> {
  const request = createLocalRequest(
    '/media/analyze',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        url,
      }),

      signal,
    },
  )

  const response =
    await fetch(request)

  if (!response.ok) {
    throw new Error(
      `Local service returned ${response.status}.`,
    )
  }

  return response.json() as
    Promise<LocalServiceHealth>
}



export async function analyzeYouTubeMedia(
  url: string,
  signal?: AbortSignal,
): Promise<MediaAnalysis> {
  const response = await fetch(
    `${LOCAL_SERVICE_URL}/media/analyze`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        url,
      }),

      signal,
    },
  )

  const data = (await response
    .json()
    .catch(() => null)) as
    | MediaAnalysis
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const message =
      data &&
      'detail' in data &&
      typeof data.detail === 'string'
        ? data.detail
        : `Media analysis failed with status ${response.status}.`

    throw new Error(message)
  }

  if (!data || !('title' in data)) {
    throw new Error(
      'Local service returned an unexpected response.',
    )
  }

  return data
}



