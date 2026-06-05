export type HelloResponse = {
  message: string
}

export async function getHello(): Promise<HelloResponse> {
  const response = await fetch('/api/hello')
  if (!response.ok) {
    throw new Error('Failed to load greeting')
  }

  return response.json() as Promise<HelloResponse>
}
