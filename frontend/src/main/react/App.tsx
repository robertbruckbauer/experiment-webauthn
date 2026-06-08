import { useEffect, useState } from 'react'
import type { AuthClient, ParsedToken } from './auth/auth'
import { getAuthClient } from './auth/auth'
import { getHello, type HelloResponse } from './api'

type AppProps = {
  authClient?: AuthClient
  helloLoader?: (accessToken: string) => Promise<HelloResponse>
}

export function App({
  authClient = getAuthClient(),
  helloLoader = getHello,
}: AppProps) {
  const [backendMessage, setBackendMessage] = useState('Loading...')
  const [loginState, setLoginState] = useState<'logged-in' | 'logged-out'>('logged-out')
  const [email, setEmail] = useState('')
  const [jwtClaims, setJwtClaims] = useState<ParsedToken>()
  const [apiResponse, setApiResponse] = useState<HelloResponse>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let stopped = false

    const load = async () => {
      try {
        await authClient.init()
        if (!authClient.isAuthenticated()) {
          if (!stopped) {
            setLoginState('logged-out')
            setJwtClaims(undefined)
            setApiResponse(undefined)
            setBackendMessage('Not logged in. Use Keycloak login to continue.')
          }
          return
        }

        await authClient.refresh(30)
        const accessToken = authClient.getAccessToken()
        if (!accessToken) {
          throw new Error('Missing access token')
        }

        const response = await helloLoader(accessToken)
        if (!stopped) {
          setLoginState('logged-in')
          setBackendMessage(response.message)
          setApiResponse(response)
          setJwtClaims(authClient.getParsedToken())
          setError(undefined)
        }
      } catch (caughtError) {
        if (!stopped) {
          setLoginState('logged-out')
          setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed')
          setBackendMessage('Hello World')
        }
      }
    }

    void load()
    const intervalId = window.setInterval(() => {
      if (authClient.isAuthenticated()) {
        void authClient.refresh(30)
      }
    }, 20000)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
    }
  }, [authClient, helloLoader])

  const normalizedEmail = email.trim()

  const authenticate = async () => {
    try {
      await authClient.login(normalizedEmail)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed')
    }
  }

  const enrollPasskey = async () => {
    try {
      await authClient.enrollPasskey(normalizedEmail)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Passkey registration failed')
    }
  }

  const logout = async () => {
    try {
      await authClient.logout()
      setLoginState('logged-out')
      setJwtClaims(undefined)
      setApiResponse(undefined)
      setBackendMessage('Not logged in. Use Keycloak login to continue.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Logout failed')
    }
  }

  return (
    <main>
      <h1>Hello World</h1>
      <p>
        Login state: <strong>{loginState === 'logged-in' ? 'Logged in' : 'Logged out'}</strong>
      </p>
      <p>{backendMessage}</p>
      <section>
        <label htmlFor="input-email">E-mail address</label>
        <input
          id="input-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example_username"
          autoComplete="username webauthn"
        />
        <button id="register-button" type="button" onClick={() => void enrollPasskey()} disabled={!normalizedEmail}>
          Register
        </button>
        <button id="login-button" type="button" onClick={() => void authenticate()} disabled={!normalizedEmail}>
          Authenticate
        </button>
        <button type="button" onClick={() => void logout()} disabled={loginState !== 'logged-in'}>
          Logout and remove passkey
        </button>
      </section>
      {loginState === 'logged-in' && apiResponse ? (
        <section>
          <h2>Credentials</h2>
          <ul>
            <li>Subject: {apiResponse.subject}</li>
            <li>Preferred username: {apiResponse.preferredUsername ?? jwtClaims?.preferred_username ?? 'n/a'}</li>
            <li>E-mail: {apiResponse.email ?? jwtClaims?.email ?? 'n/a'}</li>
            <li>Roles: {apiResponse.roles.join(', ') || 'none'}</li>
            <li>Scopes: {apiResponse.scopes.join(', ') || 'none'}</li>
          </ul>
        </section>
      ) : null}
      {error ? <p>{error}</p> : null}
      {jwtClaims ? <pre>{JSON.stringify(jwtClaims, null, 2)}</pre> : null}
      {apiResponse ? <pre>{JSON.stringify(apiResponse, null, 2)}</pre> : null}
    </main>
  )
}
