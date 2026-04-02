import { Buffer } from 'buffer'

type OcrResult = {
  text: string
  engine: 'ocrspace'
}

function isProbablyImageMime(mime: string) {
  return /^image\/(png|jpe?g|webp|gif)$/i.test(mime)
}

function isPdfMime(mime: string) {
  return mime === 'application/pdf'
}

export async function ocrIfConfigured(options: {
  buffer: Buffer
  mimeType: string
  filename?: string
}): Promise<OcrResult | null> {
  const key = process.env.OCR_SPACE_API_KEY
  if (!key) return null

  const { buffer, mimeType } = options
  if (!isProbablyImageMime(mimeType) && !isPdfMime(mimeType)) return null

  const form = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  form.append('file', blob, options.filename ?? 'file')
  form.append('language', 'rus+eng')
  form.append('isOverlayRequired', 'false')
  form.append('OCREngine', '2')
  form.append('detectOrientation', 'true')
  if (isPdfMime(mimeType)) form.append('page', '1')

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      apikey: key,
    },
    body: form as any,
  })

  if (!res.ok) return null
  const data: any = await res.json().catch(() => null)
  if (!data) return null
  if (data.IsErroredOnProcessing) return null

  const parsed = Array.isArray(data.ParsedResults) ? data.ParsedResults : []
  const text = parsed
    .map((r: any) => String(r?.ParsedText ?? '').trim())
    .filter(Boolean)
    .join('\n\n')

  if (!text) return null
  return { text, engine: 'ocrspace' }
}

