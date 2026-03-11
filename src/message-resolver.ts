import {
  defaultFallbacks,
  mergeFallbacks,
} from './fallback-map'
import type {
  Messages,
  FallbackMap,
  LoadMessages,
  LocaleChainConfig,
} from './types'

export interface ResolveOptions {
  locale: string
  chain: string[]
  defaultLocale: string
  loadMessages: LoadMessages
}

export function deepMerge(target: Messages, source: Messages): Messages {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Messages, source[key] as Messages)
    } else {
      result[key] = source[key]
    }
  }

  return result
}

/**
 * Build deduplicated load order: defaultLocale (base) -> chain (low to high priority) -> locale (highest).
 */
export function buildLoadOrder({
  locale,
  chain,
  defaultLocale,
}: Pick<ResolveOptions, 'locale' | 'chain' | 'defaultLocale'>): string[] {
  const seen = new Set<string>()
  const loadOrder: string[] = []

  for (const l of [defaultLocale, ...chain.slice().reverse(), locale]) {
    if (!seen.has(l)) {
      seen.add(l)
      loadOrder.push(l)
    }
  }

  return loadOrder
}

/**
 * Async resolution — loads all locales in parallel via Promise.allSettled,
 * then deep-merges in load order.
 */
export async function resolveMessages(opts: ResolveOptions): Promise<Messages> {
  const loadOrder = buildLoadOrder(opts)

  const results = await Promise.allSettled(
    loadOrder.map(async (l) => opts.loadMessages(l))
  )

  let merged: Messages = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      merged = deepMerge(merged, result.value)
    }
    // Rejected = silent skip (missing locale files are expected)
  }

  return merged
}

/**
 * Sync resolution — attempts to resolve all locales synchronously.
 * Returns Messages if ALL loadMessages calls return non-Promise values.
 * Returns null if any call returns a Promise (caller should use async path).
 */
export function resolveMessagesSync(opts: ResolveOptions): Messages | null {
  const loadOrder = buildLoadOrder(opts)
  let result: Messages = {}

  for (const l of loadOrder) {
    try {
      const messages = opts.loadMessages(l)
      if (messages && typeof (messages as any).then === 'function') {
        return null // async detected, bail out
      }
      result = deepMerge(result, messages as Messages)
    } catch {
      // Silent skip
    }
  }

  return result
}

/**
 * Resolve effective fallback map from config, then resolve messages.
 * Pure utility — no React dependency.
 */
export async function mergeMessagesFromChain(
  config: LocaleChainConfig
): Promise<Messages> {
  const { locale, defaultLocale, loadMessages } = config

  let effectiveFallbacks: FallbackMap

  if (config.fallbacks) {
    effectiveFallbacks =
      config.mergeDefaults === false
        ? config.fallbacks
        : mergeFallbacks(defaultFallbacks, config.fallbacks)
  } else if (config.overrides) {
    effectiveFallbacks = mergeFallbacks(defaultFallbacks, config.overrides)
  } else {
    effectiveFallbacks = defaultFallbacks
  }

  const chain = effectiveFallbacks[locale] || []

  return resolveMessages({ locale, chain, defaultLocale, loadMessages })
}
