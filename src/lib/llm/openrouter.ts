import OpenAI from 'openai'
import { LLMMessage } from '@/types'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
})

export async function streamOpenRouter(
  model: string,
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<ReadableStream<string>> {
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: [
      {
        role: 'system',
        content: systemPrompt ?? 'You are a helpful assistant.',
      },
      ...messages,
    ],
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            controller.enqueue(text)
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

export async function generateChatTitleOpenRouter(options: {
  model: string
  userText: string
  assistantText: string
}): Promise<string> {
  const { model, userText, assistantText } = options

  const res = await client.chat.completions.create({
    model,
    stream: false,
    max_tokens: 24,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'Generate a short chat title (3-6 words). ' +
          'Use the language of the conversation. ' +
          'No quotes, no punctuation at the end. Return title only.',
      },
      {
        role: 'user',
        content:
          `User message:\n${userText}\n\n` +
          `Assistant reply:\n${assistantText}\n\n` +
          'Title:',
      },
    ],
  })

  const raw = res.choices?.[0]?.message?.content ?? ''
  return raw.replace(/\s+/g, ' ').trim()
}

