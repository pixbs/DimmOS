'use client'

import {
  toast,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useLocale,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { useCallback, useState } from 'react'

type AiGenerateFieldButtonProps = {
  readOnly?: boolean
}

function getLocaleCode(locale: unknown): string | undefined {
  if (!locale) return undefined
  if (typeof locale === 'string') return locale
  if (typeof locale === 'object' && 'code' in locale && typeof locale.code === 'string') {
    return locale.code
  }
  return undefined
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      errors?: Array<{ message?: string }>
      message?: string
    }
    return data.errors?.[0]?.message || data.message || 'AI generation failed'
  } catch {
    return 'AI generation failed'
  }
}

export function AiGenerateFieldButton({ readOnly }: AiGenerateFieldButtonProps) {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const docInfo = useDocumentInfo()
  const locale = useLocale()
  const { getData } = useForm()
  const { disabled, path, setValue, value } = useField<string>()
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = useCallback(async () => {
    if (readOnly || disabled || isGenerating) return

    setError(null)
    setIsGenerating(true)

    try {
      const endpoint = formatAdminURL({
        apiRoute: api,
        path: '/ai/generate-field',
      })
      const response = await fetch(endpoint, {
        body: JSON.stringify({
          collectionSlug: docInfo.collectionSlug,
          currentValue: value,
          doc: getData(),
          fieldPath: path,
          globalSlug: docInfo.globalSlug,
          id: docInfo.id,
          locale: getLocaleCode(locale),
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      const data = (await response.json()) as { result?: string }
      setValue(data.result || '')
      toast.success('Generated content')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'AI generation failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }, [
    api,
    disabled,
    docInfo.collectionSlug,
    docInfo.globalSlug,
    docInfo.id,
    getData,
    isGenerating,
    locale,
    path,
    readOnly,
    setValue,
    value,
  ])

  return (
    <div className="ai-generate-field">
      <button
        aria-label="Generate field content"
        className="ai-generate-field__button"
        disabled={readOnly || disabled || isGenerating}
        onClick={() => {
          void generate()
        }}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="ai-generate-field__icon"
          focusable="false"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2.75 13.88 8l5.37 1.75-5.37 1.75L12 16.75l-1.88-5.25-5.37-1.75L10.12 8 12 2.75Zm6.5 10.5.95 2.65 2.8.85-2.8.85-.95 2.65-.95-2.65-2.8-.85 2.8-.85.95-2.65ZM6.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"
            fill="currentColor"
          />
        </svg>
        <span>{isGenerating ? 'Generating' : 'Generate'}</span>
      </button>
      <span aria-live="polite" className="ai-generate-field__status" role="status">
        {isGenerating ? 'Generating content' : ''}
      </span>
      {error ? (
        <span className="ai-generate-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

