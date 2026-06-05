import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../main/react/App'

describe('App', () => {
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
})
