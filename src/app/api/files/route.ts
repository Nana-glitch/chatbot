import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { getSignedUrl, uploadFile } from '@/lib/storage'
import { extractText, getFileType } from '@/lib/document-parser'
import { ocrIfConfigured } from '@/lib/ocr'

async function getUserFromRequest(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const messageId = formData.get('messageId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB.' },
        { status: 400 }
      )
    }

    const fileType = getFileType(file.name)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const storagePath = await uploadFile(
      user.id,
      file.name,
      buffer,
      file.type
    )

    let extractedText: string | undefined
    if (fileType === 'pdf' || fileType === 'doc') {
      extractedText = await extractText(buffer, fileType)
    }
    if (!extractedText?.trim()) {
      const ocr = await ocrIfConfigured({
        buffer,
        mimeType: file.type,
        filename: file.name,
      })
      if (ocr?.text) extractedText = ocr.text
    }

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        message_id: messageId ?? null,
        user_id: user.id,
        type: fileType,
        storage_path: storagePath,
        filename: file.name,
        size_bytes: file.size,
        extracted_text: extractedText ?? null,
      })
      .select()
      .single()

    if (error) throw error

    let url: string | null = null
    if (data?.type === 'image' && data?.storage_path) {
      try {
        url = await getSignedUrl(String(data.storage_path))
      } catch {
        url = null
      }
    }

    const extractedTextChars =
      typeof data?.extracted_text === 'string' ? data.extracted_text.length : 0

    return NextResponse.json({ ...data, url, extractedTextChars }, { status: 201 })
  } catch (err) {
    console.error('Files API error:', err)
    const message =
      (err as any)?.message ??
      (err as any)?.error?.message ??
      'Server error'
    return NextResponse.json({ error: String(message) }, { status: 500 })
  }
}