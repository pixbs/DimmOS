import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookMocks = vi.hoisted(() => {
  const setValue = vi.fn()
  const getData = vi.fn()
  const toastError = vi.fn()
  const toastSuccess = vi.fn()

  return {
    docInfo: {
      collectionSlug: 'windows',
      globalSlug: undefined,
      id: 7,
    },
    field: {
      disabled: false,
      path: 'title',
      setValue,
      value: 'Old title',
    },
    getData,
    setValue,
    toastError,
    toastSuccess,
  }
})

vi.mock('@payloadcms/ui', () => ({
  toast: {
    error: hookMocks.toastError,
    success: hookMocks.toastSuccess,
  },
  useConfig: () => ({
    config: {
      routes: {
        api: '/api',
      },
    },
  }),
  useDocumentInfo: () => hookMocks.docInfo,
  useField: () => hookMocks.field,
  useForm: () => ({
    getData: hookMocks.getData,
  }),
  useLocale: () => 'en',
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ apiRoute, path }: { apiRoute: string; path: string }) => `${apiRoute}${path}`,
}))

import { AiGenerateFieldButton } from '@/components/admin/ai-generate-field-button'

describe('AiGenerateFieldButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hookMocks.field.disabled = false
    hookMocks.field.path = 'title'
    hookMocks.field.value = 'Old title'
    hookMocks.getData.mockReturnValue({ title: 'Old title' })
  })

  it('sends document context and replaces the field value with generated text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: 'Generated title' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<AiGenerateFieldButton />)
    fireEvent.click(screen.getByRole('button', { name: /generate field content/i }))

    await waitFor(() => {
      expect(hookMocks.setValue).toHaveBeenCalledWith('Generated title')
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/generate-field')
    expect(init.credentials).toBe('include')
    expect(JSON.parse(init.body)).toEqual({
      collectionSlug: 'windows',
      currentValue: 'Old title',
      doc: { title: 'Old title' },
      fieldPath: 'title',
      id: 7,
      locale: 'en',
    })
    expect(hookMocks.toastSuccess).toHaveBeenCalledWith('Generated content')
  })

  it('exposes an accessible loading state while generation is pending', async () => {
    let resolveFetch: (response: Response) => void = () => {}
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<AiGenerateFieldButton />)
    const button = screen.getByRole('button', { name: /generate field content/i })
    fireEvent.click(button)

    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toBe('Generating content')

    resolveFetch(
      new Response(JSON.stringify({ result: 'Generated title' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    await waitFor(() => {
      expect(hookMocks.setValue).toHaveBeenCalledWith('Generated title')
    })
  })

  it('renders an accessible error when generation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errors: [{ message: 'Field is not configured' }] }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }),
      ),
    )

    render(<AiGenerateFieldButton />)
    fireEvent.click(screen.getByRole('button', { name: /generate field content/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Field is not configured')
    })
    expect(hookMocks.toastError).toHaveBeenCalledWith('Field is not configured')
  })
})

