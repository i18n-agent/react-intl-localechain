import { LocaleChainProvider } from 'react-intl-locale-chain'
import { FormattedMessage } from 'react-intl'

import en from './messages/en.json'
import pt from './messages/pt.json'
import ptBR from './messages/pt-BR.json'

const allMessages: Record<string, Record<string, string>> = {
  en,
  pt,
  'pt-BR': ptBR,
}

const loadMessages = (locale: string) => allMessages[locale] ?? {}

function TranslatedContent() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>react-intl-locale-chain Example</h1>
      <p>Locale: <strong>pt-BR</strong> | Default: <strong>en</strong></p>
      <p>Fallback chain: pt-BR → pt-PT (skipped) → pt → en</p>
      <hr />
      <table style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ccc' }}>Key</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ccc' }}>Value</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ccc' }}>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem' }}>greeting</td>
            <td style={{ padding: '0.5rem' }}><FormattedMessage id="greeting" /></td>
            <td style={{ padding: '0.5rem', color: '#888' }}>pt-BR</td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem' }}>farewell</td>
            <td style={{ padding: '0.5rem' }}><FormattedMessage id="farewell" /></td>
            <td style={{ padding: '0.5rem', color: '#888' }}>pt (fallback)</td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem' }}>welcome</td>
            <td style={{ padding: '0.5rem' }}><FormattedMessage id="welcome" /></td>
            <td style={{ padding: '0.5rem', color: '#888' }}>en (default)</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  console.log('[LocaleChain] Messages loaded:', { en, pt, 'pt-BR': ptBR })

  return (
    <LocaleChainProvider
      locale="pt-BR"
      defaultLocale="en"
      loadMessages={loadMessages}
      fallback={<div>Loading translations...</div>}
    >
      <TranslatedContent />
    </LocaleChainProvider>
  )
}
