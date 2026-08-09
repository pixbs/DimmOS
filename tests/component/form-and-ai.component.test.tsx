import type { Form } from '@/payload-types'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'

import { AiGenerateFieldButton } from '@/components/admin/ai-generate-field-button'
import { FormComponent } from '@/components/form/FormComponent'
import { browserWorker } from '../mocks/browser'
import { payloadUiState, resetPayloadUiState } from '../stubs/browser-payload-ui'

const contactForm = {
  id: 7,
  title: 'Contact',
  fields: [
    {
      blockType: 'email',
      name: 'email',
      label: 'Email',
      placeholder: 'you@example.test',
      required: true,
    },
    {
      blockType: 'text',
      name: 'subject',
      label: 'Subject',
      placeholder: 'Project subject',
      required: true,
    },
    {
      blockType: 'textarea',
      name: 'message',
      label: 'Message',
      placeholder: 'Tell me about the project',
      required: true,
    },
  ],
} as Form

describe('form submission', () => {
  it('submits authored fields at the network boundary and exposes success', async () => {
    let requestBody: unknown
    browserWorker.use(
      http.post('*/api/form-submissions', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 91 }, { status: 201 })
      }),
    )
    const screen = await render(<FormComponent form={contactForm} />)

    await screen.getByPlaceholder('you@example.test').fill('person@example.test')
    await screen.getByPlaceholder('Project subject').fill('New identity')
    await screen.getByPlaceholder('Tell me about the project').fill('A real product brief.')
    await screen.getByRole('button', { name: 'Send' }).click()

    await expect.element(screen.getByRole('button', { name: 'Sent!' })).toBeDisabled()
    expect(requestBody).toEqual({
      form: 7,
      submissionData: [
        { field: 'email', value: 'person@example.test' },
        { field: 'subject', value: 'New identity' },
        { field: 'message', value: 'A real product brief.' },
      ],
    })
  })

  it('keeps valid user input available and reports a controlled API failure', async () => {
    browserWorker.use(
      http.post('*/api/form-submissions', () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 503 }),
      ),
    )
    const screen = await render(<FormComponent form={contactForm} />)
    const subject = screen.getByPlaceholder('Project subject')
    await screen.getByPlaceholder('you@example.test').fill('person@example.test')
    await subject.fill('Keep this value')
    await screen.getByPlaceholder('Tell me about the project').fill('A complete request.')
    await screen.getByRole('button', { name: 'Send' }).click()

    await expect.element(screen.getByText('Something went wrong. Please try again.')).toBeVisible()
    await expect.element(subject).toHaveValue('Keep this value')
    await expect.element(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
  })
})

describe('AI field generation', () => {
  beforeEach(() => {
    resetPayloadUiState()
  })
  it('sends document context, exposes pending state, and applies the generated value', async () => {
    let requestBody: unknown
    let releaseResponse!: () => void
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    browserWorker.use(
      http.post('*/api/ai/generate-field', async ({ request }) => {
        requestBody = await request.json()
        await gate
        return HttpResponse.json({ result: 'A generated summary' })
      }),
    )
    const screen = await render(<AiGenerateFieldButton />)

    await screen.getByRole('button', { name: 'Generate field content' }).click()
    await expect.element(screen.getByRole('status')).toHaveTextContent('Generating content')
    await expect.element(screen.getByRole('button', { name: 'Generate field content' })).toBeDisabled()
    releaseResponse()

    await expect.poll(() => payloadUiState.setValues).toEqual(['A generated summary'])
    expect(payloadUiState.toasts.successes).toEqual(['Generated content'])
    expect(requestBody).toEqual({
      collectionSlug: 'articles',
      currentValue: 'Existing summary',
      doc: { title: 'Existing title', content: [] },
      fieldPath: 'meta.description',
      id: 42,
      locale: 'en',
    })
  })

  it('shows the server error and keeps the current field value unchanged', async () => {
    browserWorker.use(
      http.post('*/api/ai/generate-field', () =>
        HttpResponse.json({ errors: [{ message: 'Provider unavailable' }] }, { status: 503 }),
      ),
    )
    const screen = await render(<AiGenerateFieldButton />)
    await screen.getByRole('button', { name: 'Generate field content' }).click()

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Provider unavailable')
    expect(payloadUiState.toasts.errors).toEqual(['Provider unavailable'])
    expect(payloadUiState.setValues).toEqual([])
  })

  it('honors read-only fields without issuing a request', async () => {
    const request = vi.fn()
    browserWorker.use(
      http.post('*/api/ai/generate-field', () => {
        request()
        return HttpResponse.json({ result: 'Should not happen' })
      }),
    )
    const screen = await render(<AiGenerateFieldButton readOnly />)

    await expect.element(screen.getByRole('button', { name: 'Generate field content' })).toBeDisabled()
    expect(request).not.toHaveBeenCalled()
    await cleanup()
  })
})
