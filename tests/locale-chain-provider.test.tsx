import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { useIntl } from 'react-intl'
import { LocaleChainProvider } from '../src/locale-chain-provider'

// Helper component that reads messages from react-intl context
function MessageDisplay({ id }: { id: string }) {
  const intl = useIntl()
  return <span data-testid={id}>{intl.formatMessage({ id })}</span>
}

const enMessages = {
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'profile.title': 'Profile',
}
const ptMessages = {
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
}
const ptBRMessages = {
  'common.save': 'Salvar',
}

const syncLoader = (locale: string) => {
  const map: Record<string, Record<string, string>> = {
    en: enMessages,
    pt: ptMessages,
    'pt-BR': ptBRMessages,
  }
  const msgs = map[locale]
  if (!msgs) throw new Error(`No messages for ${locale}`)
  return msgs
}

const asyncLoader = async (locale: string) => {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return syncLoader(locale)
}

describe('LocaleChainProvider', () => {
  it('renders children with merged messages (sync)', () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={syncLoader}
      >
        <MessageDisplay id="common.save" />
        <MessageDisplay id="common.cancel" />
        <MessageDisplay id="profile.title" />
      </LocaleChainProvider>
    )

    // pt-BR has 'Salvar', pt has 'Cancelar', en has 'Profile'
    expect(screen.getByTestId('common.save')).toHaveTextContent('Salvar')
    expect(screen.getByTestId('common.cancel')).toHaveTextContent('Cancelar')
    expect(screen.getByTestId('profile.title')).toHaveTextContent('Profile')
  })

  it('renders immediately with sync loadMessages (no loading flash)', () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={syncLoader}
        fallback={<span data-testid="loading">Loading...</span>}
      >
        <span data-testid="content">Content</span>
      </LocaleChainProvider>
    )

    // Should render content immediately, not loading
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
  })

  it('shows fallback during async loading', async () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={asyncLoader}
        fallback={<span data-testid="loading">Loading...</span>}
      >
        <MessageDisplay id="common.save" />
      </LocaleChainProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // After async resolves, should show content
    await waitFor(() => {
      expect(screen.getByTestId('common.save')).toHaveTextContent('Salvar')
    })
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
  })

  it('shows null fallback by default for async', async () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={asyncLoader}
      >
        <span data-testid="content">Content</span>
      </LocaleChainProvider>
    )

    // Initially empty
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()

    // After resolve, content appears
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('mode 2: overrides merge with defaults', () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={syncLoader}
        overrides={{ 'pt-BR': ['pt'] }}
      >
        <MessageDisplay id="common.save" />
        <MessageDisplay id="common.cancel" />
      </LocaleChainProvider>
    )

    expect(screen.getByTestId('common.save')).toHaveTextContent('Salvar')
    expect(screen.getByTestId('common.cancel')).toHaveTextContent('Cancelar')
  })

  it('mode 3: full custom fallbacks with mergeDefaults false', () => {
    render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={syncLoader}
        fallbacks={{ 'pt-BR': ['pt'] }}
        mergeDefaults={false}
      >
        <MessageDisplay id="common.save" />
        <MessageDisplay id="common.cancel" />
      </LocaleChainProvider>
    )

    expect(screen.getByTestId('common.save')).toHaveTextContent('Salvar')
    expect(screen.getByTestId('common.cancel')).toHaveTextContent('Cancelar')
  })

  it('passes through IntlProvider props', () => {
    const onError = vi.fn()

    render(
      <LocaleChainProvider
        locale="en"
        defaultLocale="en"
        loadMessages={syncLoader}
        onError={onError}
      >
        <MessageDisplay id="nonexistent.key" />
      </LocaleChainProvider>
    )

    // react-intl should call onError for the missing key
    expect(onError).toHaveBeenCalled()
  })

  it('re-resolves on locale change (sync — no loading flash)', () => {
    const { rerender } = render(
      <LocaleChainProvider
        locale="en"
        defaultLocale="en"
        loadMessages={syncLoader}
      >
        <MessageDisplay id="common.save" />
      </LocaleChainProvider>
    )

    expect(screen.getByTestId('common.save')).toHaveTextContent('Save')

    rerender(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={syncLoader}
      >
        <MessageDisplay id="common.save" />
      </LocaleChainProvider>
    )

    // Sync loader — should resolve immediately, no waitFor needed
    expect(screen.getByTestId('common.save')).toHaveTextContent('Salvar')
  })

  it('handles race condition on rapid locale changes', async () => {
    let resolveFirst: (() => void) | null = null
    let resolveSecond: (() => void) | null = null

    const slowLoader = (locale: string) => {
      if (locale === 'pt-BR') {
        return new Promise<Record<string, string>>((resolve) => {
          resolveFirst = () => resolve(ptBRMessages)
        })
      }
      if (locale === 'pt') {
        return new Promise<Record<string, string>>((resolve) => {
          resolveSecond = () => resolve(ptMessages)
        })
      }
      return enMessages
    }

    const { rerender } = render(
      <LocaleChainProvider
        locale="pt-BR"
        defaultLocale="en"
        loadMessages={slowLoader}
        fallbacks={{ 'pt-BR': [], pt: [] }}
        mergeDefaults={false}
        fallback={<span data-testid="loading">Loading</span>}
      >
        <MessageDisplay id="common.save" />
      </LocaleChainProvider>
    )

    // Quickly switch to 'pt' before 'pt-BR' resolves
    rerender(
      <LocaleChainProvider
        locale="pt"
        defaultLocale="en"
        loadMessages={slowLoader}
        fallbacks={{ 'pt-BR': [], pt: [] }}
        mergeDefaults={false}
        fallback={<span data-testid="loading">Loading</span>}
      >
        <MessageDisplay id="common.save" />
      </LocaleChainProvider>
    )

    // Resolve pt-BR first (stale) — should be ignored
    await act(async () => {
      resolveFirst?.()
    })

    // Still loading because pt hasn't resolved
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Resolve pt (current)
    await act(async () => {
      resolveSecond?.()
    })

    await waitFor(() => {
      expect(screen.getByTestId('common.save')).toHaveTextContent('Guardar')
    })
  })
})
