'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface AuthGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinueAsGuest?: () => void
  title?: string
  description?: string
}

export function AuthGateModal({
  open,
  onOpenChange,
  onContinueAsGuest,
  title = 'Sign in to continue',
  description = 'Create an account to save chats, upload files, and remove limits. You can also continue as a guest (up to 3 questions).',
}: AuthGateModalProps) {
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/40 motion-reduce:animate-none animate-in fade-in duration-150"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative w-[min(92vw,420px)] rounded-xl border bg-background shadow-lg motion-reduce:animate-none animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              onClick={() => router.push('/login')}
              className="w-full justify-center"
            >
              Sign in
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/register')}
              className="w-full justify-center"
            >
              Create account
            </Button>
            {onContinueAsGuest && (
              <Button
                variant="ghost"
                onClick={() => {
                  onOpenChange(false)
                  onContinueAsGuest()
                }}
                className="w-full justify-center"
              >
                Continue as guest
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

