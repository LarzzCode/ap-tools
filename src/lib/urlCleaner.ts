const TRACKING_EXACT_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'igsh',
  'si',
  'feature',
  'ref',
  'ref_src',
  'ref_url',
  's',
  't',
  'spm',
  'scm',
  'aff_id',
  'affiliate_id',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'oly_anon_id',
  'oly_enc_id',
  'vero_id',
  'wickedid',
  'yclid',
  'rb_clickid',
  'trk',
  'tracking_id',
  'source',
  'src',
  'share_id',
])

const TRACKING_PREFIXES = [
  'utm_',
  'ga_',
  'hsa_',
  'pk_',
  'mtm_',
  'icid',
  '__twitter',
]

function isTrackingParam(paramName: string): boolean {
  const lower = paramName.toLowerCase()

  if (TRACKING_EXACT_PARAMS.has(lower)) {
    return true
  }

  return TRACKING_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

export interface CleanedUrlResult {
  original: string
  cleaned: string
  removedParams: Array<{ key: string; value: string }>
  keptParams: Array<{ key: string; value: string }>
  valid: boolean
  error?: string
}

export function cleanTrackingUrl(
  rawUrl: string,
  options: {
    stripAllQuery?: boolean
    stripHash?: boolean
  } = {},
): CleanedUrlResult {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    return {
      original: rawUrl,
      cleaned: '',
      removedParams: [],
      keptParams: [],
      valid: false,
    }
  }

  const normalizedInput = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const parsed = new URL(normalizedInput)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        original: trimmed,
        cleaned: trimmed,
        removedParams: [],
        keptParams: [],
        valid: false,
        error: 'Only http:// and https:// URLs are supported.',
      }
    }

    const removedParams: Array<{ key: string; value: string }> = []
    const keptParams: Array<{ key: string; value: string }> = []
    const nextSearch = new URLSearchParams()

    parsed.searchParams.forEach((value, key) => {
      if (options.stripAllQuery || isTrackingParam(key)) {
        removedParams.push({ key, value })
      } else {
        keptParams.push({ key, value })
        nextSearch.append(key, value)
      }
    })

    const nextQueryString = nextSearch.toString()
    parsed.search = nextQueryString ? `?${nextQueryString}` : ''

    if (options.stripHash) {
      parsed.hash = ''
    }

    return {
      original: trimmed,
      cleaned: parsed.toString(),
      removedParams,
      keptParams,
      valid: true,
    }
  } catch {
    return {
      original: trimmed,
      cleaned: trimmed,
      removedParams: [],
      keptParams: [],
      valid: false,
      error: 'Enter a valid web link (for example https://example.com/?utm_source=test).',
    }
  }
}
