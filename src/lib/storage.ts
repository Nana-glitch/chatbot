import { supabase } from './supabase'

const BUCKET = 'attachments'

function sanitizeStorageSegment(input: string): string {
  const name = input.normalize('NFKD')
  const ascii = name.replace(/[^\x20-\x7E]/g, '_')
  const safe = ascii
    .replace(/[\/\\]/g, '_')
    .replace(/[\u0000-\u001F\u007F]/g, '_')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return safe || 'file'
}

export async function uploadFile(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const safeName = sanitizeStorageSegment(filename)
  const path = `${userId}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  return path
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)

  if (error) throw new Error(`Failed to get URL: ${error.message}`)

  return data.signedUrl
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) throw new Error(`Delete failed: ${error.message}`)
}