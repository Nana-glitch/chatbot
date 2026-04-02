import mammoth from 'mammoth'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const mod: any = await import('pdf-parse')
  const pdfParse = mod?.default ?? mod
  const data = await pdfParse(buffer)
  return data.text.trim()
}

export async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

export async function extractText(
  buffer: Buffer,
  type: 'pdf' | 'doc'
): Promise<string> {
  if (type === 'pdf') return extractTextFromPDF(buffer)
  if (type === 'doc') return extractTextFromDOC(buffer)
  return ''
}

export function getFileType(filename: string): 'image' | 'pdf' | 'doc' | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext ?? '')) return 'doc'
  return null
}