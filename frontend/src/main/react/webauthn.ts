const TEXT_ENCODER = new TextEncoder()

function randomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length)
  crypto.getRandomValues(buffer)
  return buffer
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return asArrayBuffer(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

function ensureSupported(): void {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    throw new Error('WebAuthn is not supported in this browser.')
  }
}

const CREDENTIAL_ID_STORAGE_KEY = 'webauthn-demo-credential-id'

function createUserId(username: string): ArrayBuffer {
  return asArrayBuffer(TEXT_ENCODER.encode(username.trim().slice(0, 64)))
}

export type WebAuthnResult = {
  id: string
  type: string
  clientDataJSON: string
}

export type WebAuthnClient = {
  register: (username: string) => Promise<WebAuthnResult>
  authenticate: () => Promise<WebAuthnResult>
}

export const webAuthnClient: WebAuthnClient = {
  register: async (username: string) => {
    ensureSupported()

    const normalizedUsername = username.trim()
    if (!normalizedUsername) {
      throw new Error('Username is required.')
    }

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: asArrayBuffer(randomBytes(32)),
      rp: { name: 'experiment-webauthn' },
      user: {
        id: createUserId(normalizedUsername),
        name: normalizedUsername,
        displayName: normalizedUsername,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    }

    const credential = await navigator.credentials.create({ publicKey })
    if (!credential || !('rawId' in credential) || !('response' in credential)) {
      throw new Error('Passkey registration was cancelled.')
    }

    const publicKeyCredential = credential as PublicKeyCredential
    localStorage.setItem(
      CREDENTIAL_ID_STORAGE_KEY,
      toBase64Url(publicKeyCredential.rawId),
    )

    const response = publicKeyCredential.response as AuthenticatorAttestationResponse
    return {
      id: publicKeyCredential.id,
      type: publicKeyCredential.type,
      clientDataJSON: toBase64Url(response.clientDataJSON),
    }
  },

  authenticate: async () => {
    ensureSupported()

    const storedCredentialId = localStorage.getItem(CREDENTIAL_ID_STORAGE_KEY)
    const allowCredentials = storedCredentialId
      ? [{ id: fromBase64Url(storedCredentialId), type: 'public-key' as const }]
      : undefined

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: asArrayBuffer(randomBytes(32)),
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials,
    }

    const assertion = await navigator.credentials.get({ publicKey })
    if (!assertion || !('response' in assertion)) {
      throw new Error('Passkey authentication was cancelled.')
    }

    const publicKeyCredential = assertion as PublicKeyCredential
    const response = publicKeyCredential.response as AuthenticatorAssertionResponse
    return {
      id: publicKeyCredential.id,
      type: publicKeyCredential.type,
      clientDataJSON: toBase64Url(response.clientDataJSON),
    }
  },
}
