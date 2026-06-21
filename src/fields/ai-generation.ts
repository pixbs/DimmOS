import type { Block, Field } from 'payload'

export const AI_GENERATE_FIELD_COMPONENT =
  '/components/admin/ai-generate-field-button#AiGenerateFieldButton'

export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6'

export type AiGenerationOptions = {
  instruction?: string
  maxOutputTokens?: number
}

export type AiGenerationFieldInfo = {
  description?: string
  field: Field
  instruction?: string
  label: string
  maxOutputTokens?: number
  path: string
  placeholder?: string
  type: 'text' | 'textarea'
}

type FieldWithName = Field & { name: string }

type FieldWithAiGeneration = Field & {
  custom?: {
    aiGeneration?: AiGenerationOptions & { enabled: true }
  }
}

type TraversalState = {
  data: unknown
  fields: Field[]
  pathSegments: string[]
  traversedPath: string[]
}

type ContainerField = Field & { fields: Field[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isFieldWithName(field: Field): field is FieldWithName {
  return 'name' in field && typeof field.name === 'string'
}

function isContainerField(field: Field): field is ContainerField {
  return 'fields' in field && Array.isArray(field.fields)
}

function getValueAtSegment(data: unknown, segment: string): unknown {
  if (Array.isArray(data)) {
    const index = Number(segment)
    return Number.isInteger(index) ? data[index] : undefined
  }

  if (isRecord(data)) {
    return data[segment]
  }

  return undefined
}

function getFieldCustom(field: Field): Record<string, unknown> {
  const custom = 'custom' in field ? field.custom : undefined
  return isRecord(custom) ? custom : {}
}

function getAiGenerationOptions(field: Field): (AiGenerationOptions & { enabled: true }) | null {
  const aiGeneration = getFieldCustom(field).aiGeneration

  if (!isRecord(aiGeneration) || aiGeneration.enabled !== true) {
    return null
  }

  return aiGeneration as AiGenerationOptions & { enabled: true }
}

function stringifyStaticText(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      const text = stringifyStaticText(item)
      if (text) return text
    }
  }

  return undefined
}

function humanizeFieldName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getFieldLabel(field: FieldWithName): string {
  if ('label' in field && field.label !== false) {
    const label = stringifyStaticText(field.label)
    if (label) return label
  }

  return humanizeFieldName(field.name)
}

function getAdminText(field: Field, key: 'description' | 'placeholder'): string | undefined {
  const admin =
    'admin' in field && isRecord(field.admin) ? (field.admin as Record<string, unknown>) : undefined
  return stringifyStaticText(admin?.[key])
}

function isNumericSegment(segment: string | undefined): segment is string {
  return typeof segment === 'string' && /^\d+$/.test(segment)
}

function getBlockFields(blocks: Block[], rowData: unknown): Field[] | null {
  const blockType = isRecord(rowData) ? rowData.blockType : undefined

  if (typeof blockType !== 'string') {
    return null
  }

  const block = blocks.find((candidate) => candidate.slug === blockType)
  return block?.fields ?? null
}

function findInFields(state: TraversalState): AiGenerationFieldInfo | null {
  for (const field of state.fields) {
    const match = findInField(field, state)
    if (match) return match
  }

  return null
}

function findInField(field: Field, state: TraversalState): AiGenerationFieldInfo | null {
  const [segment, nextSegment] = state.pathSegments

  if (field.type === 'tabs') {
    for (const tab of field.tabs) {
      const tabName = 'name' in tab && typeof tab.name === 'string' ? tab.name : undefined
      const nextState =
        tabName && segment === tabName
          ? {
              ...state,
              data: getValueAtSegment(state.data, tabName),
              pathSegments: state.pathSegments.slice(1),
              traversedPath: [...state.traversedPath, tabName],
            }
          : state

      const match = findInFields({ ...nextState, fields: tab.fields })
      if (match) return match
    }

    return null
  }

  if (field.type === 'blocks' && isFieldWithName(field) && segment === field.name) {
    if (!isNumericSegment(nextSegment)) return null

    const fieldData = getValueAtSegment(state.data, field.name)
    const rowData = getValueAtSegment(fieldData, nextSegment)
    const blockFields = getBlockFields(field.blocks as Block[], rowData)
    if (!blockFields) return null

    return findInFields({
      data: rowData,
      fields: blockFields,
      pathSegments: state.pathSegments.slice(2),
      traversedPath: [...state.traversedPath, field.name, nextSegment],
    })
  }

  if (field.type === 'array' && isFieldWithName(field) && segment === field.name) {
    if (!isNumericSegment(nextSegment)) return null

    const fieldData = getValueAtSegment(state.data, field.name)
    const rowData = getValueAtSegment(fieldData, nextSegment)

    return findInFields({
      data: rowData,
      fields: field.fields,
      pathSegments: state.pathSegments.slice(2),
      traversedPath: [...state.traversedPath, field.name, nextSegment],
    })
  }

  if (field.type === 'group' && isFieldWithName(field) && segment === field.name) {
    return findInFields({
      data: getValueAtSegment(state.data, field.name),
      fields: field.fields,
      pathSegments: state.pathSegments.slice(1),
      traversedPath: [...state.traversedPath, field.name],
    })
  }

  if (isContainerField(field) && field.type !== 'array' && field.type !== 'group') {
    const match = findInFields({ ...state, fields: field.fields })
    if (match) return match
  }

  if (!isFieldWithName(field) || segment !== field.name || state.pathSegments.length !== 1) {
    return null
  }

  const options = getAiGenerationOptions(field)
  if (!options || (field.type !== 'text' && field.type !== 'textarea')) {
    return null
  }

  return {
    description: getAdminText(field, 'description'),
    field,
    instruction: options.instruction,
    label: getFieldLabel(field),
    maxOutputTokens: options.maxOutputTokens,
    path: [...state.traversedPath, field.name].join('.'),
    placeholder: getAdminText(field, 'placeholder'),
    type: field.type,
  }
}

export function findAiGenerationField(args: {
  data: unknown
  fields: Field[]
  path: string
}): AiGenerationFieldInfo | null {
  const pathSegments = args.path.split('.').filter(Boolean)
  if (pathSegments.length === 0) return null

  return findInFields({
    data: args.data,
    fields: args.fields,
    pathSegments,
    traversedPath: [],
  })
}

export function sanitizeAiContext(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[Max depth reached]'

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}...` : value
  }

  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined'
  ) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeAiContext(item, depth + 1))
  }

  if (!isRecord(value)) {
    return String(value)
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(value).slice(0, 100)) {
    if (/password|secret|token|api[-_]?key|authorization|cookie|recaptcha/i.test(key)) {
      sanitized[key] = '[Redacted]'
      continue
    }

    sanitized[key] = sanitizeAiContext(item, depth + 1)
  }

  return sanitized
}

export function withAiGeneration<TField extends Field>(
  field: TField,
  options: AiGenerationOptions = {},
): TField {
  if (field.type !== 'text' && field.type !== 'textarea') {
    throw new Error(`AI generation can only be attached to text or textarea fields, got "${field.type}"`)
  }

  const admin = 'admin' in field && isRecord(field.admin) ? field.admin : {}
  const components = isRecord(admin.components) ? admin.components : {}
  const custom = getFieldCustom(field)

  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...components,
        afterInput: {
          clientProps: {
            instruction: options.instruction,
          },
          path: AI_GENERATE_FIELD_COMPONENT,
        },
      },
    },
    custom: {
      ...custom,
      aiGeneration: {
        ...options,
        enabled: true,
      },
    },
  } as TField
}
