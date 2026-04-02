import { LLMMessage } from '@/types'
import { streamOpenRouter } from './openrouter'

export type LLMModel = {
  provider: 'openrouter'
  model: string
}

export function getProviderFromModel(modelId: string): LLMModel {
  if (modelId.includes('/')) {
    return { provider: 'openrouter', model: modelId }
  }
  return { provider: 'openrouter', model: 'deepseek/deepseek-chat' }
}

export async function createLLMStream(
  modelId: string,
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<ReadableStream<string>> {
  const { provider, model } = getProviderFromModel(modelId)

  switch (provider) {
    case 'openrouter':
      return streamOpenRouter(model, messages, systemPrompt)
    default:
      return streamOpenRouter('deepseek/deepseek-chat', messages, systemPrompt)
  }
}