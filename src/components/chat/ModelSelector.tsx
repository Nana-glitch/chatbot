'use client'

import { LLM_MODELS } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const allModels = Object.entries(LLM_MODELS)
  const currentModel = allModels
    .flatMap(([, models]) => models)
    .find((m) => m.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs h-7 px-3 rounded-md border border-input bg-background hover:bg-accent active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {currentModel?.name ?? value}
        <ChevronDownIcon size={12} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {allModels.map(([provider, models]) => (
          <div key={provider}>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground capitalize">
              {provider}
            </div>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onChange(model.id)}
                className={
                  value === model.id
                    ? 'bg-accent font-medium relative pl-8'
                    : 'relative pl-8'
                }
              >
                {value === model.id && (
                  <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center text-muted-foreground">
                    <CheckIcon size={14} />
                  </span>
                )}
                {model.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}