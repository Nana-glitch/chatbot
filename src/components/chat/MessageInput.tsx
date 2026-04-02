'use client'

import { useState, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AttachmentPreview } from './AttachmentPreview'
import { SendHorizontalIcon, PaperclipIcon, LoaderIcon } from 'lucide-react'

interface PendingAttachment {
  id: string
  filename: string
  type: 'image' | 'pdf' | 'doc'
  url?: string | null
  extractedTextChars?: number
}

interface MessageInputProps {
  onSend: (content: string, attachmentIds: string[]) => Promise<boolean>
  isStreaming: boolean
  disabled?: boolean
  attachmentsDisabled?: boolean
  onAttachmentsDisabledClick?: () => void
}

export function MessageInput({
  onSend,
  isStreaming,
  disabled,
  attachmentsDisabled = false,
  onAttachmentsDisabledClick,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(file: File) {
    if (attachmentsDisabled) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        let details = 'Upload failed'
        try {
          const data = await res.json()
          if (data?.error) details = String(data.error)
        } catch {
        }
        throw new Error(details)
      }

      const data = await res.json()
      setAttachments((prev) => [
        ...prev,
        {
          id: data.id,
          filename: data.filename,
          type: data.type,
          url: data.url ?? null,
          extractedTextChars:
            typeof data.extractedTextChars === 'number' ? data.extractedTextChars : undefined,
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (attachmentsDisabled) {
        const items = Array.from(e.clipboardData.items)
        const imageItem = items.find((item) => item.type.startsWith('image/'))
        if (imageItem) {
          e.preventDefault()
          onAttachmentsDisabledClick?.()
        }
        return
      }
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find((item) => item.type.startsWith('image/'))
      if (imageItem) {
        const file = imageItem.getAsFile()
        if (file) handleFileUpload(file)
      }
    },
    [attachmentsDisabled, onAttachmentsDisabledClick]
  )

  async function handleSend() {
    if (!content.trim() || isStreaming) return
    const ok = await onSend(content.trim(), attachments.map((a) => a.id))
    if (ok) {
      setContent('')
      setAttachments([])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div
      suppressHydrationWarning
      className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-[0_-10px_30px_rgba(20,30,60,0.08)]"
    >
      <div className="max-w-3xl mx-auto p-4">
        <AttachmentPreview
          attachments={attachments}
          onRemove={(id) =>
            setAttachments((prev) => prev.filter((a) => a.id !== id))
          }
        />

        <div className="flex gap-2 items-end mt-2 rounded-2xl border bg-background px-2 py-2 shadow-[0_10px_30px_rgba(20,30,60,0.10)] focus-within:ring-2 focus-within:ring-ring transition-shadow">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
              e.target.value = ''
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            onClick={() => {
              if (attachmentsDisabled) {
                onAttachmentsDisabledClick?.()
                return
              }
              fileInputRef.current?.click()
            }}
            disabled={isUploading || isStreaming}
          >
            {isUploading ? (
              <LoaderIcon size={16} className="animate-spin" />
            ) : (
              <PaperclipIcon size={16} />
            )}
          </Button>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Message... (Shift+Enter for new line)"
            className="min-h-[44px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 px-2"
            rows={1}
            disabled={disabled}
          />

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl transition-transform active:scale-[0.98]"
            onClick={handleSend}
            disabled={!content.trim() || isStreaming || disabled}
          >
            {isStreaming ? (
              <LoaderIcon size={16} className="animate-spin" />
            ) : (
              <SendHorizontalIcon size={16} />
            )}
          </Button>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-destructive text-center">
            {uploadError}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center mt-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}