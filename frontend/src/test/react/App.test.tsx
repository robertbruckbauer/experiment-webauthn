import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../main/react/App'

describe('App', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders hello world and authenticated backend data', async () => {
    const authClient = {
      init: vi.fn(async () => {}),
      isAuthenticated: vi.fn(() => true),
      login: vi.fn(async () => {}),
      logout: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
      getAccessToken: vi.fn(() => 'token'),
      getParsedToken: vi.fn(() => ({ preferred_username: 'alice', sub: 'subject-1' })),
    }
    const helloLoader = vi.fn(async () => ({
      message: 'Hello, alice!',
      subject: 'subject-1',
      issuer: 'http://localhost:8081/realms/webauthn',
      audience: ['backend-api'],
      expiresAt: '2026-01-01T00:00:00Z',
      tokenType: 'Bearer',
      authorities: ['ROLE_user'],
    }))

    render(<App authClient={authClient} helloLoader={helloLoader} />)

    expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(helloLoader).toHaveBeenCalledWith('token')
    })
    expect(screen.getAllByText(/Hello, alice!/i)).toHaveLength(2)
    expect(screen.getByText(/preferred_username/)).toBeInTheDocument()
  })

  it('registers and authenticates with passkey actions', async () => {
    const authClient = {
      init: vi.fn(async () => {}),
      isAuthenticated: vi.fn(() => true),
      login: vi.fn(async () => {}),
      logout: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
      getAccessToken: vi.fn(() => 'token'),
      getParsedToken: vi.fn(() => ({ preferred_username: 'alice', sub: 'subject-1' })),
    }
    const helloLoader = vi.fn(async () => ({
      message: 'Hello, alice!',
      subject: 'subject-1',
      issuer: 'http://localhost:8081/realms/webauthn',
      audience: ['backend-api'],
      expiresAt: '2026-01-01T00:00:00Z',
      tokenType: 'Bearer',
      authorities: ['ROLE_user'],
    }))
    const passkeyClient = {
      register: vi.fn(async () => ({ id: 'credential-123', type: 'public-key', clientDataJSON: 'abc' })),
      authenticate: vi.fn(async () => ({ id: 'credential-123', type: 'public-key', clientDataJSON: 'def' })),
    }

    render(<App authClient={authClient} helloLoader={helloLoader} passkeyClient={passkeyClient} />)

    fireEvent.click(screen.getByRole('button', { name: /register → create a new passkey/i }))
    await screen.findByText(/Registered passkey: credential-123/i)
    expect(passkeyClient.register).toHaveBeenCalledWith('alice')

    fireEvent.click(screen.getByRole('button', { name: /authenticate → use that passkey to log in/i }))
    await screen.findByText(/Authenticated with passkey: credential-123/i)
    expect(passkeyClient.authenticate).toHaveBeenCalled()
  })
})
