import type { IntlConfig } from 'react-intl'

export type Messages = Record<string, any>

export type FallbackMap = Record<string, string[]>

export type LoadMessages = (locale: string) => Messages | Promise<Messages>

export interface LocaleChainConfig {
  locale: string
  defaultLocale: string
  loadMessages: LoadMessages
  overrides?: FallbackMap
  fallbacks?: FallbackMap
  mergeDefaults?: boolean
}

/**
 * Derive IntlProvider props from react-intl's own types for forward compatibility.
 * We control locale, messages, and defaultLocale — pass everything else through.
 */
export type IntlProviderPassthroughProps = Omit<
  Partial<IntlConfig>,
  'locale' | 'messages' | 'defaultLocale'
>

export interface LocaleChainProviderProps
  extends LocaleChainConfig,
    IntlProviderPassthroughProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
