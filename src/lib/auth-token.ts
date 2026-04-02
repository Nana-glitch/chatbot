export const AUTH_TOKEN_STORAGE_KEY = 'sb_access_token'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (!token) localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  else localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

