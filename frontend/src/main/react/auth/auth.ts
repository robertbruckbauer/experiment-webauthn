import Keycloak from 'keycloak-js'

export type ParsedToken = {
  preferred_username?: string
  sub?: string
  [claim: string]: unknown
}

export type AuthClient = {
  init: () => Promise<void>
  isAuthenticated: () => boolean
  login: () => Promise<void>
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
  const keycloak = new Keycloak({
    url: requiredEnv('VITE_KEYCLOAK_URL'),
    realm: requiredEnv('VITE_KEYCLOAK_REALM'),
    clientId: requiredEnv('VITE_KEYCLOAK_CLIENT_ID'),
  })

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
    login: async () => {
      await keycloak.login({
        redirectUri: window.location.href,
      })
    },
    logout: async () => {
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
