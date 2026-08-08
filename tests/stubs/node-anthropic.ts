export const anthropicState: {
  calls: unknown[]
  error: unknown
  response: { content: Array<{ type: string; text?: string }> }
} = {
  calls: [],
  error: null,
  response: { content: [{ type: 'text', text: 'Controlled response' }] },
}

export function resetAnthropicState() {
  anthropicState.calls = []
  anthropicState.error = null
  anthropicState.response = { content: [{ type: 'text', text: 'Controlled response' }] }
}

export default class Anthropic {
  messages = {
    create: async (input: unknown) => {
      anthropicState.calls.push(input)
      if (anthropicState.error) throw anthropicState.error
      return anthropicState.response
    },
  }
}
