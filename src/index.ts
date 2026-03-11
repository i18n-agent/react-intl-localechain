// Components
export { LocaleChainProvider } from './locale-chain-provider'

// Utility functions
export { mergeMessagesFromChain, deepMerge } from './message-resolver'

// Fallback map
export { defaultFallbacks, mergeFallbacks } from './fallback-map'

// Types
export type {
  LocaleChainProviderProps,
  LocaleChainConfig,
  FallbackMap,
  Messages,
  LoadMessages,
  IntlProviderPassthroughProps,
} from './types'
