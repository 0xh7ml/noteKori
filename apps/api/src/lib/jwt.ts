import type { Env } from './db'

// JWT payload structure
export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// Create JWT token
export async function createToken(userId: string, email: string, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload: JWTPayload = {
    userId,
    email,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`

  const signature = await sign(data, secret)
  return `${data}.${signature}`
}

// Verify JWT token
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const data = `${encodedHeader}.${encodedPayload}`

    // Verify signature
    const expectedSignature = await sign(data, secret)
    if (signature !== expectedSignature) return null

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch (error) {
    return null
  }
}

// Helper: HMAC SHA-256 signature
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(data)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
}

// Helper: Base64 URL encode
function base64UrlEncode(str: string): string {
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Helper: Base64 URL decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}
