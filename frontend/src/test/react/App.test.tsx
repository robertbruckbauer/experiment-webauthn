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
      login: vi.fn(async (email: string) => {
        void email
      }),
      enrollPasskey: vi.fn(async (email: string) => {
        void email
      }),
      logout: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
      getAccessToken: vi.fn(() => 'token'),
      getParsedToken: vi.fn(() => ({ preferred_username: 'alice', email: 'alice@example.com', sub: 'subject-1' })),
    }
    const helloLoader = vi.fn(async () => ({
      message: 'Hello, alice!',
      subject: 'subject-1',
      preferredUsername: 'alice',
      email: 'alice@example.com',
      issuer: 'http://localhost:8081/realms/webauthn',
      audience: ['backend-api'],
      expiresAt: '2026-01-01T00:00:00Z',
      tokenType: 'Bearer',
      roles: ['ROLE_user'],
      scopes: ['profile', 'email'],
      authorities: ['ROLE_user'],
    }))

    render(<App authClient={authClient} helloLoader={helloLoader} />)

    expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(helloLoader).toHaveBeenCalledWith('token')
    })
    expect(screen.getAllByText(/Hello, alice!/i)).toHaveLength(2)
    expect(screen.getByText(/Login state:/i)).toHaveTextContent(/Logged in/i)
    expect(screen.getByText(/Credentials/i)).toBeInTheDocument()
    expect(screen.getByText(/E-mail: alice@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/preferred_username/)).toBeInTheDocument()
  })

  it('uses email to trigger keycloak login, passkey registration, and logout', async () => {
    const authClient = {
      init: vi.fn(async () => {}),
      isAuthenticated: vi.fn(() => false),
      login: vi.fn(async (email: string) => {
        void email
      }),
      enrollPasskey: vi.fn(async (email: string) => {
        void email
      }),
      logout: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
      getAccessToken: vi.fn(() => 'token'),
      getParsedToken: vi.fn(() => ({ preferred_username: 'alice', sub: 'subject-1' })),
    }
    const helloLoader = vi.fn()

    render(<App authClient={authClient} helloLoader={helloLoader} />)

    await screen.findByText(/Not logged in/i)
    expect(helloLoader).not.toHaveBeenCalled()

    const loginButton = screen.getByRole('button', { name: /authenticate/i })
    const registerButton = screen.getByRole('button', { name: /register/i })
    expect(loginButton).toBeDisabled()
    expect(registerButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/e-mail address/i), { target: { value: 'alice@example.com' } })
    expect(loginButton).not.toBeDisabled()
    expect(registerButton).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /authenticate/i }))
    expect(authClient.login).toHaveBeenCalledWith('alice@example.com')

    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    expect(authClient.enrollPasskey).toHaveBeenCalledWith('alice@example.com')
    expect(screen.getByText(/Login state:/i)).toHaveTextContent(/Logged out/i)
    expect(screen.getByRole('button', { name: /logout and remove passkey/i })).toBeDisabled()

    const loggedInAuthClient = {
      ...authClient,
      isAuthenticated: vi.fn(() => true),
      getParsedToken: vi.fn(() => ({ preferred_username: 'alice', email: 'alice@example.com', sub: 'subject-1' })),
    }
    const loggedInHelloLoader = vi.fn(async () => ({
      message: 'Hello, alice!',
      subject: 'subject-1',
      preferredUsername: 'alice',
      email: 'alice@example.com',
      issuer: 'http://localhost:8081/realms/webauthn',
      audience: ['backend-api'],
      expiresAt: '2026-01-01T00:00:00Z',
      tokenType: 'Bearer',
      roles: ['ROLE_user'],
      scopes: ['profile', 'email'],
      authorities: ['ROLE_user'],
    }))

    cleanup()
    render(<App authClient={loggedInAuthClient} helloLoader={loggedInHelloLoader} />)
    await waitFor(() => expect(loggedInHelloLoader).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /logout and remove passkey/i }))
    expect(authClient.logout).toHaveBeenCalled()
  })
})
