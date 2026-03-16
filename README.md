# react-intl-locale-chain

[![npm version](https://img.shields.io/npm/v/react-intl-locale-chain)](https://www.npmjs.com/package/react-intl-locale-chain)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Smart locale fallback chains for react-intl — because pt-BR users deserve pt-PT, not English.

## The Problem

react-intl falls back directly to `defaultMessage` or the message ID when a translation key is missing. There is no intermediate locale fallback.

**Example:** Your app has `pt-PT` translations but no `pt-BR` messages file. A Brazilian Portuguese user sees English (or raw message IDs) instead of the perfectly good `pt-PT` translations.

The same thing happens with `es-MX` -> `es`, `fr-CA` -> `fr`, `de-AT` -> `de`, and every other regional variant.

Your users see English when a perfectly good translation exists in a sibling locale.

## The Solution

Drop-in replacement for `IntlProvider`. Zero changes to your existing react-intl components.

`LocaleChainProvider` wraps `IntlProvider` and automatically deep-merges messages from a configurable fallback chain before passing them to react-intl.

## Installation

```bash
npm install react-intl-locale-chain
# or
pnpm add react-intl-locale-chain
# or
yarn add react-intl-locale-chain
```

**Peer dependencies:** `react >= 16.8` and `react-intl >= 5.0.0`

## Quick Start

```tsx
import { LocaleChainProvider } from 'react-intl-locale-chain';

function App() {
  return (
    <LocaleChainProvider
      locale="pt-BR"
      defaultLocale="en"
      loadMessages={(locale) => import(`./messages/${locale}.json`).then(m => m.default)}
      fallback={<div>Loading...</div>}
    >
      <YourApp />
    </LocaleChainProvider>
  );
}
```

All default fallback chains are active. A `pt-BR` user will now see `pt-PT` translations when `pt-BR` keys are missing.

## Custom Configuration

### Default (zero config)

```tsx
<LocaleChainProvider
  locale="pt-BR"
  defaultLocale="en"
  loadMessages={loadMessages}
/>
```

Uses all built-in fallback chains. Covers Chinese, Portuguese, Spanish, French, German, Italian, Dutch, English, Arabic, Norwegian, and Malay regional variants.

### With overrides (merge with defaults)

```tsx
// Override specific chains while keeping all defaults
<LocaleChainProvider
  locale="pt-BR"
  defaultLocale="en"
  loadMessages={loadMessages}
  overrides={{ 'pt-BR': ['pt'] }}  // skip pt-PT, go straight to pt
/>
```

Your overrides replace matching keys in the default map. All other defaults remain.

### Full custom (replace defaults)

```tsx
// Full control — only use your chains
<LocaleChainProvider
  locale="pt-BR"
  defaultLocale="en"
  loadMessages={loadMessages}
  fallbacks={{
    'pt-BR': ['pt-PT', 'pt'],
    'es-MX': ['es-419', 'es']
  }}
  mergeDefaults={false}
/>
```

Only the chains you specify will be active. No defaults.

## Advanced: Pure Utility

For advanced setups where you manage your own `IntlProvider`, use the pure merge function:

```tsx
import { mergeMessagesFromChain } from 'react-intl-locale-chain';
import { IntlProvider } from 'react-intl';

// In your setup code (works in Server Components too)
const messages = await mergeMessagesFromChain({
  locale: 'pt-BR',
  defaultLocale: 'en',
  loadMessages: (locale) => fetch(`/api/messages/${locale}`).then(r => r.json()),
});

// Pass merged messages to vanilla IntlProvider
<IntlProvider locale="pt-BR" messages={messages}>
  <App />
</IntlProvider>
```

## API Reference

### `LocaleChainProvider`

A React component that wraps react-intl's `IntlProvider` and deep-merges messages from a configurable fallback chain.

```tsx
<LocaleChainProvider
  locale="pt-BR"
  defaultLocale="en"
  loadMessages={(locale) => import(`./messages/${locale}.json`).then(m => m.default)}
  fallback={<div>Loading...</div>}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locale` | `string` | *required* | The active locale |
| `defaultLocale` | `string` | *required* | Base locale loaded first (lowest priority) |
| `loadMessages` | `(locale: string) => Messages \| Promise<Messages>` | *required* | Function to load messages for a locale |
| `overrides` | `FallbackMap` | `undefined` | Custom fallback chains merged with defaults |
| `fallbacks` | `FallbackMap` | `undefined` | Custom fallback chains (use with `mergeDefaults`) |
| `mergeDefaults` | `boolean` | `true` | Whether to merge custom fallbacks with built-in defaults |
| `fallback` | `React.ReactNode` | `null` | Content shown while async messages are loading |
| `children` | `React.ReactNode` | *required* | Your app content |

All other props are passed through to react-intl's `IntlProvider`.

### `mergeMessagesFromChain(config)`

Pure async utility for resolving and merging messages outside of React (e.g., in Server Components or setup code).

```ts
const messages = await mergeMessagesFromChain({
  locale: 'pt-BR',
  defaultLocale: 'en',
  loadMessages: (locale) => fetch(`/api/messages/${locale}`).then(r => r.json()),
})
```

### `deepMerge(target, source)`

Recursively deep-merges two message objects. Source values override target values.

### `defaultFallbacks`

The built-in `FallbackMap` constant containing all default locale chains.

### `mergeFallbacks(defaults, overrides)`

Utility function that merges two `FallbackMap` objects. Overrides replace matching keys from defaults.

## Default Fallback Map

### Chinese

| Locale | Fallback Chain |
|--------|---------------|
| zh-Hant-HK | zh-Hant-TW -> zh-Hant -> (default locale) |
| zh-Hant-MO | zh-Hant-HK -> zh-Hant-TW -> zh-Hant -> (default locale) |
| zh-Hant-TW | zh-Hant -> (default locale) |
| zh-Hans-SG | zh-Hans -> (default locale) |
| zh-Hans-MY | zh-Hans -> (default locale) |

### Portuguese

| Locale | Fallback Chain |
|--------|---------------|
| pt-BR | pt-PT -> pt -> (default locale) |
| pt-PT | pt -> (default locale) |
| pt-AO | pt-PT -> pt -> (default locale) |
| pt-MZ | pt-PT -> pt -> (default locale) |

### Spanish

| Locale | Fallback Chain |
|--------|---------------|
| es-419 | es -> (default locale) |
| es-MX | es-419 -> es -> (default locale) |
| es-AR | es-419 -> es -> (default locale) |
| es-CO | es-419 -> es -> (default locale) |
| es-CL | es-419 -> es -> (default locale) |
| es-PE | es-419 -> es -> (default locale) |
| es-VE | es-419 -> es -> (default locale) |
| es-EC | es-419 -> es -> (default locale) |
| es-GT | es-419 -> es -> (default locale) |
| es-CU | es-419 -> es -> (default locale) |
| es-BO | es-419 -> es -> (default locale) |
| es-DO | es-419 -> es -> (default locale) |
| es-HN | es-419 -> es -> (default locale) |
| es-PY | es-419 -> es -> (default locale) |
| es-SV | es-419 -> es -> (default locale) |
| es-NI | es-419 -> es -> (default locale) |
| es-CR | es-419 -> es -> (default locale) |
| es-PA | es-419 -> es -> (default locale) |
| es-UY | es-419 -> es -> (default locale) |
| es-PR | es-419 -> es -> (default locale) |

### French

| Locale | Fallback Chain |
|--------|---------------|
| fr-CA | fr -> (default locale) |
| fr-BE | fr -> (default locale) |
| fr-CH | fr -> (default locale) |
| fr-LU | fr -> (default locale) |
| fr-MC | fr -> (default locale) |
| fr-SN | fr -> (default locale) |
| fr-CI | fr -> (default locale) |
| fr-ML | fr -> (default locale) |
| fr-CM | fr -> (default locale) |
| fr-MG | fr -> (default locale) |
| fr-CD | fr -> (default locale) |

### German

| Locale | Fallback Chain |
|--------|---------------|
| de-AT | de -> (default locale) |
| de-CH | de -> (default locale) |
| de-LU | de -> (default locale) |
| de-LI | de -> (default locale) |

### Italian

| Locale | Fallback Chain |
|--------|---------------|
| it-CH | it -> (default locale) |

### Dutch

| Locale | Fallback Chain |
|--------|---------------|
| nl-BE | nl -> (default locale) |

### English

| Locale | Fallback Chain |
|--------|---------------|
| en-GB | en -> (default locale) |
| en-AU | en-GB -> en -> (default locale) |
| en-NZ | en-AU -> en-GB -> en -> (default locale) |
| en-IN | en-GB -> en -> (default locale) |
| en-CA | en -> (default locale) |
| en-ZA | en-GB -> en -> (default locale) |
| en-IE | en-GB -> en -> (default locale) |
| en-SG | en-GB -> en -> (default locale) |

### Arabic

| Locale | Fallback Chain |
|--------|---------------|
| ar-SA | ar -> (default locale) |
| ar-EG | ar -> (default locale) |
| ar-AE | ar -> (default locale) |
| ar-MA | ar -> (default locale) |
| ar-DZ | ar -> (default locale) |
| ar-IQ | ar -> (default locale) |
| ar-KW | ar -> (default locale) |
| ar-QA | ar -> (default locale) |
| ar-BH | ar -> (default locale) |
| ar-OM | ar -> (default locale) |
| ar-JO | ar -> (default locale) |
| ar-LB | ar -> (default locale) |
| ar-TN | ar -> (default locale) |
| ar-LY | ar -> (default locale) |
| ar-SD | ar -> (default locale) |
| ar-YE | ar -> (default locale) |

### Norwegian

| Locale | Fallback Chain |
|--------|---------------|
| nb | no -> (default locale) |
| nn | nb -> no -> (default locale) |

### Malay

| Locale | Fallback Chain |
|--------|---------------|
| ms-MY | ms -> (default locale) |
| ms-SG | ms -> (default locale) |
| ms-BN | ms -> (default locale) |

## How It Works

1. `LocaleChainProvider` wraps react-intl's `IntlProvider`.
2. When rendered, it resolves the fallback chain for the requested locale.
3. It calls your `loadMessages` function for each locale in the chain (in parallel for async loaders).
4. Messages are deep-merged in priority order: default locale (base) -> chain locales -> requested locale (highest priority).
5. If `loadMessages` throws for any chain locale (e.g., file doesn't exist), it silently skips that locale and continues.
6. The merged messages are passed to `IntlProvider`, which sees a complete message object with no missing keys.

## FAQ

**Performance impact?**
Minimal. The fallback map is resolved once via `useMemo`. Message loading for async loaders happens in parallel (`Promise.allSettled`). Deep merge is fast for typical message objects.

**Does it work with nested message keys?**
Yes. Deep merge is recursive — it walks all nesting levels. If `pt-BR` has `common.save` but not `common.cancel`, `common.cancel` will be filled from the next locale in the chain.

**What if my `loadMessages` is synchronous?**
Fully supported. If `loadMessages` returns plain objects (not Promises), `LocaleChainProvider` renders immediately with no loading flash. The sync path is detected automatically.

**What if my `loadMessages` is async?**
Also fully supported. `LocaleChainProvider` shows the `fallback` prop (or `null`) until messages resolve. Dynamic `import()`, `fetch()` — all work.

**Can I load messages from a CMS or API?**
Yes. `loadMessages` is just a function — it can load from anywhere:

```tsx
<LocaleChainProvider
  locale="pt-BR"
  defaultLocale="en"
  loadMessages={async (locale) => {
    const res = await fetch(`https://my-cms.com/messages/${locale}`)
    return res.json()
  }}
/>
```

**What if a chain locale doesn't have a messages file?**
It's silently skipped. The chain continues to the next locale. This is by design — you don't need message files for every locale in every chain.

**react-intl version compatibility?**
Works with react-intl v5+ and v6+.

**React 19 / Server Components?**
`LocaleChainProvider` uses `useState` and `useEffect`, so it's a client component. For Server Component architectures, use `mergeMessagesFromChain()` in a Server Component and pass the result to vanilla `IntlProvider`.

**Should `loadMessages` be a stable reference?**
Yes. Like any function prop in React, define it outside the component or wrap in `useCallback` to avoid unnecessary re-resolution:

```tsx
// Good — stable reference
const loadMessages = (locale: string) =>
  import(`./messages/${locale}.json`).then(m => m.default);

function App() {
  return (
    <LocaleChainProvider loadMessages={loadMessages} ... />
  );
}
```

**Should `fallbacks` and `overrides` props be stable references?**
Yes, like any object prop in React. Define them outside the component or wrap in `useMemo` to avoid unnecessary re-resolution:

```tsx
// Good — stable reference
const myOverrides = { 'pt-BR': ['pt'] };

function App() {
  return (
    <LocaleChainProvider overrides={myOverrides} ... />
  );
}
```

## Example

A minimal example app is included in the [`example/`](./example/) directory. It demonstrates the locale chain resolving three keys for `pt-BR`, showing fallback from `pt-BR -> pt -> en`.

```bash
cd example && pnpm install && pnpm dev
```

See [`example/README.md`](./example/README.md) for full setup instructions.

## Contributing

- Open issues for bugs or feature requests.
- PRs welcome, especially for adding new locale fallback chains.
- Run `npm test` before submitting.

## License

MIT License - see [LICENSE](LICENSE) file.

Built by [i18nagent.ai](https://i18nagent.ai)
