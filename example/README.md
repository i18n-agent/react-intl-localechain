# react-intl-locale-chain Example

Minimal Vite + React app demonstrating locale fallback chains.

## Setup

```bash
cd example
pnpm install
pnpm run dev
```

## What it demonstrates

Locale is set to `pt-BR` with default locale `en`. The fallback chain is:

```
pt-BR -> pt-PT (skipped, no file) -> pt -> en
```

Three translation keys show the chain in action:

| Key       | Value                    | Source            |
|-----------|--------------------------|-------------------|
| greeting  | Oi                       | pt-BR             |
| farewell  | Adeus                    | pt (fallback)     |
| welcome   | Welcome to LocaleChain   | en (default)      |
