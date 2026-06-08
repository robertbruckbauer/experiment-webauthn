import Keycloak from 'keycloak-js'

export type ParsedToken = {
  preferred_username?: string
  email?: string
  sub?: string
  [claim: string]: unknown
}

export type AuthClient = {
  init: () => Promise<void>
  isAuthenticated: () => boolean
  login: (email: string) => Promise<void>
  enrollPasskey: (email: string) => Promise<void>
  logout: () => Promise<void>
  refresh: (minValiditySeconds: number) => Promise<void>
  getAccessToken: () => string | undefined
  getParsedToken: () => ParsedToken | undefined
}

function requiredEnv(name: string): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function createKeycloakAuthClient(): AuthClient {
  const keycloakUrl = requiredEnv('VITE_KEYCLOAK_URL')
  const keycloakRealm = requiredEnv('VITE_KEYCLOAK_REALM')
  const keycloak = new Keycloak({
    url: keycloakUrl,
    realm: keycloakRealm,
    clientId: requiredEnv('VITE_KEYCLOAK_CLIENT_ID'),
  })
  const accountCredentialsEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/account/credentials`

  async function removePasskeyCredentials(): Promise<void> {
    if (!keycloak.token) {
      return
    }

    const credentialsResponse = await fetch(accountCredentialsEndpoint, {
      headers: {
        Authorization: 'Bearer ' + keycloak.token,
      },
    })
    if (!credentialsResponse.ok) {
      return
    }

    const credentials = (await credentialsResponse.json()) as Array<{
      id: string
      type: string
    }>
    const passkeyCredentials = credentials.filter((credential) =>
      credential.type === 'webauthn' || credential.type === 'webauthn-passwordless',
    )

    await Promise.all(
      passkeyCredentials.map((credential) =>
        fetch(`${accountCredentialsEndpoint}/${encodeURIComponent(credential.id)}`, {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + keycloak.token,
          },
        }),
      ),
    )
  }

  return {
    init: async () => {
      await keycloak.init({
        checkLoginIframe: false,
        flow: 'standard',
        onLoad: 'check-sso',
        pkceMethod: 'S256',
      })
    },
    isAuthenticated: () => Boolean(keycloak.authenticated),
    login: async (email: string) => {
      await keycloak.login({
        loginHint: email.trim(),
        redirectUri: window.location.href,
      })
    },
    enrollPasskey: async (email: string) => {
      await keycloak.login({
        loginHint: email.trim(),
        redirectUri: window.location.href,
        action: 'webauthn-register-passwordless',
      })
    },
    logout: async () => {
      await removePasskeyCredentials()
      await keycloak.logout({
        redirectUri: window.location.origin,
      })
    },
    refresh: async (minValiditySeconds: number) => {
      await keycloak.updateToken(minValiditySeconds)
    },
    getAccessToken: () => keycloak.token,
    getParsedToken: () => keycloak.tokenParsed as ParsedToken | undefined,
  }
}

let defaultAuthClient: AuthClient | undefined

export function getAuthClient(): AuthClient {
  if (!defaultAuthClient) {
    defaultAuthClient = createKeycloakAuthClient()
  }
  return defaultAuthClient
}
