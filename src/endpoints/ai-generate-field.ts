import Anthropic from '@anthropic-ai/sdk'
import { APIError, type Endpoint, type Field } from 'payload'

import {
  DEFAULT_ANTHROPIC_MODEL,
  findAiGenerationField,
  sanitizeAiContext,
  type AiGenerationFieldInfo,
} from '@/fields/ai-generation'

type AiGenerateFieldRequest = {
  collectionSlug?: string
  currentValue?: unknown
  doc?: unknown
  fieldPath?: string
  globalSlug?: string
  id?: number | string
  locale?: string
}

type GenerateFieldTextInput = {
  collectionSlug?: string
  currentValue: unknown
  doc: unknown
  field: AiGenerationFieldInfo
  globalSlug?: string
  id?: number | string
  locale?: string
}

type GenerateFieldText = (input: GenerateFieldTextInput) => Promise<string>

function parseRequestBody(body: unknown): AiGenerateFieldRequest {
  if (!body || typeof body !== 'object') {
    throw new APIError('Request body is required', 400)
  }

  const data = body as AiGenerateFieldRequest

  if (!data.fieldPath || typeof data.fieldPath !== 'string') {
    throw new APIError('fieldPath is required', 400)
  }

  if (!data.collectionSlug && !data.globalSlug) {
    throw new APIError('collectionSlug or globalSlug is required', 400)
  }

  if (data.collectionSlug && data.globalSlug) {
    throw new APIError('Provide either collectionSlug or globalSlug, not both', 400)
  }

  return data
}

function resolveEntityFields(args: {
  collectionSlug?: string
  fieldsConfig: {
    collections?: Array<{ fields: Field[]; slug: string }>
    globals?: Array<{ fields: Field[]; slug: string }>
  }
  globalSlug?: string
}): Field[] {
  if (args.collectionSlug) {
    const collection = args.fieldsConfig.collections?.find(
      (candidate) => candidate.slug === args.collectionSlug,
    )

    if (!collection) {
      throw new APIError('Collection not found', 404)
    }

    return collection.fields
  }

  const global = args.fieldsConfig.globals?.find((candidate) => candidate.slug === args.globalSlug)

  if (!global) {
    throw new APIError('Global not found', 404)
  }

  return global.fields
}

function getMaxTokens(field: AiGenerationFieldInfo): number {
  const defaultTokens = field.type === 'textarea' ? 700 : 220
  const requested = field.maxOutputTokens ?? defaultTokens
  return Math.min(Math.max(requested, 64), 2000)
}

export function buildGenerateFieldPrompt(input: GenerateFieldTextInput): string {
  return JSON.stringify(
    {
      currentValue: input.currentValue,
      documentContext: sanitizeAiContext(input.doc),
      entity: {
        collectionSlug: input.collectionSlug,
        globalSlug: input.globalSlug,
        id: input.id,
        locale: input.locale,
      },
      field: {
        description: input.field.description,
        instruction: input.field.instruction,
        label: input.field.label,
        path: input.field.path,
        placeholder: input.field.placeholder,
        type: input.field.type,
      },
    },
    null,
    2,
  )
}

export async function generateClaudeFieldText(input: GenerateFieldTextInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new APIError('Anthropic API key is not configured', 503)
  }

  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    max_tokens: getMaxTokens(input.field),
    messages: [
      {
        content: buildGenerateFieldPrompt(input),
        role: 'user',
      },
    ],
    model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    system:
      'You generate replacement copy for a single Payload CMS field. Use the full document context, the field label, placeholder, description, and any field instruction. Return only the generated field value as plain text. Do not include explanations, markdown fences, labels, or surrounding quotes.',
  })

  const result = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!result) {
    throw new APIError('Claude returned an empty response', 502)
  }

  return result
}

export function createAiGenerateFieldEndpoint(generateText: GenerateFieldText = generateClaudeFieldText): Endpoint {
  return {
    handler: async (req) => {
      if (!req.user) {
        throw new APIError('Unauthorized', 401)
      }

      if (typeof req.json !== 'function') {
        throw new APIError('JSON request body is required', 400)
      }

      const body = parseRequestBody(await req.json())
      const fieldPath = body.fieldPath

      if (!fieldPath) {
        throw new APIError('fieldPath is required', 400)
      }

      const doc = body.doc ?? {}
      const fields = resolveEntityFields({
        collectionSlug: body.collectionSlug,
        fieldsConfig: req.payload.config,
        globalSlug: body.globalSlug,
      })
      const field = findAiGenerationField({
        data: doc,
        fields,
        path: fieldPath,
      })

      if (!field) {
        throw new APIError('Field is not configured for AI generation', 400)
      }

      try {
        const result = await generateText({
          collectionSlug: body.collectionSlug,
          currentValue: body.currentValue,
          doc,
          field,
          globalSlug: body.globalSlug,
          id: body.id,
          locale: body.locale,
        })

        return Response.json({ result })
      } catch (error) {
        if (error instanceof APIError) {
          throw error
        }

        req.payload.logger.error({ err: error }, 'AI field generation failed')
        throw new APIError('AI generation failed', 502)
      }
    },
    method: 'post',
    path: '/ai/generate-field',
  }
}

export const aiGenerateFieldEndpoint = createAiGenerateFieldEndpoint()
