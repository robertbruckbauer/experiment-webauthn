export type HelloResponse = {
  message: string
  subject: string
  preferredUsername?: string
  email?: string
  issuer: string
  audience: string[]
  expiresAt: string
  tokenType: string
  roles: string[]
  scopes: string[]
  authorities: string[]
}

export async function getHello(accessToken: string): Promise<HelloResponse> {
  const response = await fetch('/api/hello', {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to load greeting')
  }

  return response.json() as Promise<HelloResponse>
}
