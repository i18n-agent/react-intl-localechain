import { describe, it, expect, vi } from 'vitest'
import {
  deepMerge,
  buildLoadOrder,
  resolveMessages,
  resolveMessagesSync,
  mergeMessagesFromChain,
} from '../src/message-resolver'

const enMessages = {
  common: { save: 'Save', cancel: 'Cancel', delete: 'Delete' },
  profile: { title: 'Profile', bio: 'Biography' },
}
const ptMessages = {
  common: { save: 'Guardar', cancel: 'Cancelar' },
  profile: { title: 'Perfil' },
}
const ptBRMessages = {
  common: { save: 'Salvar' },
}

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------
describe('deepMerge', () => {
  it('merges flat objects', () => {
    const target = { a: '1', b: '2' }
    const source = { c: '3' }
    expect(deepMerge(target, source)).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('source overrides target for same key', () => {
    const target = { a: '1', b: '2' }
    const source = { b: 'overridden' }
    expect(deepMerge(target, source)).toEqual({ a: '1', b: 'overridden' })
  })

  it('recursively merges nested objects', () => {
    const result = deepMerge(enMessages, ptMessages)
    expect(result).toEqual({
      common: { save: 'Guardar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('handles deeply nested objects', () => {
    const target = { a: { b: { c: '1', d: '2' } } }
    const source = { a: { b: { c: 'overridden' } } }
    expect(deepMerge(target, source)).toEqual({
      a: { b: { c: 'overridden', d: '2' } },
    })
  })

  it('does not merge arrays (source wins)', () => {
    const target = { tags: ['a', 'b'] }
    const source = { tags: ['c'] }
    expect(deepMerge(target, source)).toEqual({ tags: ['c'] })
  })

  it('does not mutate inputs', () => {
    const target = { common: { save: 'Save' } }
    const source = { common: { save: 'Guardar' } }
    const targetCopy = JSON.parse(JSON.stringify(target))
    const sourceCopy = JSON.parse(JSON.stringify(source))
    deepMerge(target, source)
    expect(target).toEqual(targetCopy)
    expect(source).toEqual(sourceCopy)
  })
})

// ---------------------------------------------------------------------------
// buildLoadOrder
// ---------------------------------------------------------------------------
describe('buildLoadOrder', () => {
  it('builds correct order: defaultLocale -> chain reversed -> locale', () => {
    const order = buildLoadOrder({
      locale: 'pt-BR',
      chain: ['pt-PT', 'pt'],
      defaultLocale: 'en',
    })
    // chain reversed: ['pt', 'pt-PT']
    expect(order).toEqual(['en', 'pt', 'pt-PT', 'pt-BR'])
  })

  it('deduplicates when locale equals defaultLocale', () => {
    const order = buildLoadOrder({
      locale: 'en',
      chain: [],
      defaultLocale: 'en',
    })
    expect(order).toEqual(['en'])
  })

  it('deduplicates when chain contains defaultLocale', () => {
    const order = buildLoadOrder({
      locale: 'pt-BR',
      chain: ['en'],
      defaultLocale: 'en',
    })
    expect(order).toEqual(['en', 'pt-BR'])
  })
})

// ---------------------------------------------------------------------------
// resolveMessages (async)
// ---------------------------------------------------------------------------
describe('resolveMessages', () => {
  it('merges chain messages with correct priority order (pt-BR > pt > en)', async () => {
    const loadMessages = (locale: string) => {
      const map: Record<string, Record<string, any>> = {
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
      }
      return map[locale] ?? {}
    }

    const result = await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('silently skips locales that fail to load', async () => {
    const loadMessages = (locale: string) => {
      if (locale === 'pt') throw new Error('File not found')
      const map: Record<string, Record<string, any>> = {
        en: enMessages,
        'pt-BR': ptBRMessages,
      }
      return map[locale] ?? {}
    }

    const result = await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancel', delete: 'Delete' },
      profile: { title: 'Profile', bio: 'Biography' },
    })
  })

  it('returns only default locale messages when all chain locales fail', async () => {
    const loadMessages = (locale: string) => {
      if (locale === 'pt') throw new Error('File not found')
      if (locale === 'pt-BR') throw new Error('File not found')
      const map: Record<string, Record<string, any>> = { en: enMessages }
      return map[locale] ?? {}
    }

    const result = await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual(enMessages)
  })

  it('handles async loadMessages', async () => {
    const loadMessages = async (locale: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const map: Record<string, Record<string, any>> = {
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
      }
      return map[locale] ?? {}
    }

    const result = await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('does not duplicate defaultLocale in loading order (call count check)', async () => {
    const loadMessages = vi.fn((locale: string) => {
      const map: Record<string, Record<string, any>> = { en: enMessages }
      return map[locale] ?? {}
    })

    await resolveMessages({
      locale: 'en',
      chain: ['en'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(loadMessages).toHaveBeenCalledTimes(1)
  })

  it('returns empty object when defaultLocale also fails', async () => {
    const loadMessages = (_locale: string) => {
      throw new Error('All locales fail')
    }

    const result = await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({})
  })

  it('loads locales in parallel (not sequentially)', async () => {
    const callOrder: string[] = []
    const loadMessages = async (locale: string) => {
      callOrder.push(`start:${locale}`)
      await new Promise((resolve) => setTimeout(resolve, 50))
      callOrder.push(`end:${locale}`)
      return { [locale]: true }
    }

    await resolveMessages({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    // All starts should come before any end (parallel loading)
    const startIndices = callOrder
      .map((c, i) => (c.startsWith('start:') ? i : -1))
      .filter((i) => i >= 0)
    const endIndices = callOrder
      .map((c, i) => (c.startsWith('end:') ? i : -1))
      .filter((i) => i >= 0)
    const maxStart = Math.max(...startIndices)
    const minEnd = Math.min(...endIndices)
    expect(maxStart).toBeLessThan(minEnd)
  })
})

// ---------------------------------------------------------------------------
// resolveMessagesSync
// ---------------------------------------------------------------------------
describe('resolveMessagesSync', () => {
  it('resolves sync loadMessages and returns merged messages', () => {
    const loadMessages = (locale: string) => {
      const map: Record<string, Record<string, any>> = {
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
      }
      return map[locale] ?? {}
    }

    const result = resolveMessagesSync({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('returns null when loadMessages returns a Promise', () => {
    const loadMessages = (locale: string) => {
      return Promise.resolve({ [locale]: 'value' })
    }

    const result = resolveMessagesSync({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toBeNull()
  })

  it('returns null when any locale in chain returns a Promise', () => {
    const loadMessages = (locale: string) => {
      if (locale === 'pt') return Promise.resolve(ptMessages)
      return { [locale]: 'sync' }
    }

    const result = resolveMessagesSync({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toBeNull()
  })

  it('silently skips locales that throw', () => {
    const loadMessages = (locale: string) => {
      if (locale === 'pt') throw new Error('Not found')
      const map: Record<string, Record<string, any>> = {
        en: enMessages,
        'pt-BR': ptBRMessages,
      }
      return map[locale] ?? {}
    }

    const result = resolveMessagesSync({
      locale: 'pt-BR',
      chain: ['pt'],
      defaultLocale: 'en',
      loadMessages,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancel', delete: 'Delete' },
      profile: { title: 'Profile', bio: 'Biography' },
    })
  })
})

// ---------------------------------------------------------------------------
// mergeMessagesFromChain
// ---------------------------------------------------------------------------
describe('mergeMessagesFromChain', () => {
  const syncLoader = (locale: string) => {
    const map: Record<string, Record<string, any>> = {
      en: enMessages,
      pt: ptMessages,
      'pt-BR': ptBRMessages,
    }
    return map[locale] ?? {}
  }

  it('mode 1: zero-config uses default fallback chains', async () => {
    const result = await mergeMessagesFromChain({
      locale: 'pt-BR',
      defaultLocale: 'en',
      loadMessages: syncLoader,
    })

    // Default chain for pt-BR: ['pt-PT', 'pt']
    // pt-PT returns {} (not in map), pt overlays en, pt-BR overlays pt
    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('mode 2: overrides merge with defaults', async () => {
    const result = await mergeMessagesFromChain({
      locale: 'pt-BR',
      defaultLocale: 'en',
      loadMessages: syncLoader,
      overrides: { 'pt-BR': ['pt'] },
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('mode 3: full custom with mergeDefaults false', async () => {
    const result = await mergeMessagesFromChain({
      locale: 'pt-BR',
      defaultLocale: 'en',
      loadMessages: syncLoader,
      fallbacks: { 'pt-BR': ['pt'] },
      mergeDefaults: false,
    })

    expect(result).toEqual({
      common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
      profile: { title: 'Perfil', bio: 'Biography' },
    })
  })

  it('mode 3: locale not in custom fallbacks has no chain', async () => {
    const result = await mergeMessagesFromChain({
      locale: 'fr-CA',
      defaultLocale: 'en',
      loadMessages: syncLoader,
      fallbacks: { 'pt-BR': ['pt'] },
      mergeDefaults: false,
    })

    // fr-CA not in custom fallbacks, chain is [], only en + fr-CA (which returns {})
    expect(result).toEqual(enMessages)
  })
})
