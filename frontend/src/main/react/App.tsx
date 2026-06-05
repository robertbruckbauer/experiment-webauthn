import { useEffect, useState } from 'react'
import type { AuthClient, ParsedToken } from './auth/auth'
import { getAuthClient } from './auth/auth'
import { getHello, type HelloResponse } from './api'
import type { WebAuthnClient } from './webauthn'
import { webAuthnClient } from './webauthn'

type AppProps = {
  authClient?: AuthClient
  helloLoader?: (accessToken: string) => Promise<HelloResponse>
  passkeyClient?: WebAuthnClient
}

export function App({
  authClient = getAuthClient(),
  helloLoader = getHello,
  passkeyClient = webAuthnClient,
}: AppProps) {
  const [backendMessage, setBackendMessage] = useState('Loading...')
  const [jwtClaims, setJwtClaims] = useState<ParsedToken>()
  const [apiResponse, setApiResponse] = useState<HelloResponse>()
  const [error, setError] = useState<string>()
  const [username, setUsername] = useState('alice')
  const [passkeyMessage, setPasskeyMessage] = useState<string>()

  useEffect(() => {
    let stopped = false

    const load = async () => {
      try {
        await authClient.init()
        if (!authClient.isAuthenticated()) {
          await authClient.login()
          return
        }

        await authClient.refresh(30)
        const accessToken = authClient.getAccessToken()
        if (!accessToken) {
          throw new Error('Missing access token')
        }

        const response = await helloLoader(accessToken)
        if (!stopped) {
          setBackendMessage(response.message)
          setApiResponse(response)
          setJwtClaims(authClient.getParsedToken())
          setError(undefined)
        }
      } catch (caughtError) {
        if (!stopped) {
          setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed')
          setBackendMessage('Hello World')
        }
      }
    }

    void load()
    const intervalId = window.setInterval(() => {
      void authClient.refresh(30)
    }, 20000)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
    }
  }, [authClient, helloLoader])

  const registerPasskey = async () => {
    try {
      const result = await passkeyClient.register(username)
      setPasskeyMessage(`Registered passkey: ${result.id}`)
    } catch (caughtError) {
      setPasskeyMessage(caughtError instanceof Error ? caughtError.message : 'Passkey registration failed')
    }
  }

  const authenticateWithPasskey = async () => {
    try {
      const result = await passkeyClient.authenticate()
      setPasskeyMessage(`Authenticated with passkey: ${result.id}`)
    } catch (caughtError) {
      setPasskeyMessage(caughtError instanceof Error ? caughtError.message : 'Passkey authentication failed')
    }
  }

  return (
    <main>
      <h1>Hello World</h1>
      <p>{backendMessage}</p>
      <section>
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
        <button type="button" onClick={() => void registerPasskey()}>
          Register → create a new passkey
        </button>
        <button type="button" onClick={() => void authenticateWithPasskey()}>
          Authenticate → use that passkey to log in
        </button>
        {passkeyMessage ? <p>{passkeyMessage}</p> : null}
      </section>
      {error ? <p>{error}</p> : null}
      {jwtClaims ? <pre>{JSON.stringify(jwtClaims, null, 2)}</pre> : null}
      {apiResponse ? <pre>{JSON.stringify(apiResponse, null, 2)}</pre> : null}
    </main>
  )
}
