import { useEffect, useState } from 'react'
import type { AuthClient, ParsedToken } from './auth/auth'
import { getAuthClient } from './auth/auth'
import { getHello, type HelloResponse } from './api'

type AppProps = {
  authClient?: AuthClient
  helloLoader?: (accessToken: string) => Promise<HelloResponse>
}

export function App({ authClient = getAuthClient(), helloLoader = getHello }: AppProps) {
  const [backendMessage, setBackendMessage] = useState('Loading...')
  const [jwtClaims, setJwtClaims] = useState<ParsedToken>()
  const [apiResponse, setApiResponse] = useState<HelloResponse>()
  const [error, setError] = useState<string>()

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

  return (
    <main>
      <h1>Hello World</h1>
      <p>{backendMessage}</p>
      {error ? <p>{error}</p> : null}
      {jwtClaims ? <pre>{JSON.stringify(jwtClaims, null, 2)}</pre> : null}
      {apiResponse ? <pre>{JSON.stringify(apiResponse, null, 2)}</pre> : null}
    </main>
  )
}
