import { useState, useEffect, useMemo } from 'react'
import { IntlProvider } from 'react-intl'
import { defaultFallbacks, mergeFallbacks } from './fallback-map'
import { resolveMessages, resolveMessagesSync } from './message-resolver'
import type { Messages, LocaleChainProviderProps } from './types'

export function LocaleChainProvider({
  locale,
  defaultLocale,
  loadMessages,
  overrides,
  fallbacks: fallbacksProp,
  mergeDefaults: mergeDefaultsProp,
  children,
  fallback = null,
  ...intlProviderProps
}: LocaleChainProviderProps) {
  // Resolve effective fallback map (memoized on prop references)
  const effectiveFallbacks = useMemo(() => {
    if (fallbacksProp) {
      return mergeDefaultsProp === false
        ? fallbacksProp
        : mergeFallbacks(defaultFallbacks, fallbacksProp)
    }
    if (overrides) {
      return mergeFallbacks(defaultFallbacks, overrides)
    }
    return defaultFallbacks
  }, [fallbacksProp, overrides, mergeDefaultsProp])

  const chain = useMemo(
    () => effectiveFallbacks[locale] || [],
    [effectiveFallbacks, locale]
  )

  // Try sync initialization to avoid loading flash
  const [state, setState] = useState<{
    messages: Messages | null
    loading: boolean
    resolvedLocale: string | null
  }>(() => {
    try {
      const result = resolveMessagesSync({
        locale,
        chain,
        defaultLocale,
        loadMessages,
      })
      if (result !== null) {
        return { messages: result, loading: false, resolvedLocale: locale }
      }
    } catch {
      // fall through to async
    }
    return { messages: null, loading: true, resolvedLocale: null }
  })

  // Async path: resolve when locale/chain changes or sync init failed
  useEffect(() => {
    // Try sync resolution first (avoids loading flash on locale change for sync loaders)
    try {
      const syncResult = resolveMessagesSync({
        locale,
        chain,
        defaultLocale,
        loadMessages,
      })
      if (syncResult !== null) {
        setState({ messages: syncResult, loading: false, resolvedLocale: locale })
        return
      }
    } catch {
      // fall through to async
    }

    // Async path
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    resolveMessages({ locale, chain, defaultLocale, loadMessages }).then(
      (merged) => {
        if (!cancelled) {
          setState({ messages: merged, loading: false, resolvedLocale: locale })
        }
      },
      () => {
        if (!cancelled) {
          setState({ messages: {}, loading: false, resolvedLocale: locale })
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [locale, defaultLocale, loadMessages, chain])

  if (state.loading || state.messages === null) {
    return <>{fallback}</>
  }

  return (
    <IntlProvider
      locale={locale}
      messages={state.messages}
      defaultLocale={defaultLocale}
      {...intlProviderProps}
    >
      {children}
    </IntlProvider>
  )
}
