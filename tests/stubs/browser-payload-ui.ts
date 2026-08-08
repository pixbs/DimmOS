type PayloadUiState = {
  disabled: boolean
  document: { collectionSlug?: string; globalSlug?: string; id?: number | string }
  fieldPath: string
  fieldValue: string
  formData: Record<string, unknown>
  locale: string
  setValues: string[]
  toasts: { errors: string[]; successes: string[] }
}

const defaults = (): PayloadUiState => ({
  disabled: false,
  document: { collectionSlug: 'articles', id: 42 },
  fieldPath: 'meta.description',
  fieldValue: 'Existing summary',
  formData: { title: 'Existing title', content: [] },
  locale: 'en',
  setValues: [],
  toasts: { errors: [], successes: [] },
})

export const payloadUiState: PayloadUiState = defaults()

export function resetPayloadUiState() {
  Object.assign(payloadUiState, defaults())
}

export const toast = {
  error(message: string) {
    payloadUiState.toasts.errors.push(message)
  },
  success(message: string) {
    payloadUiState.toasts.successes.push(message)
  },
}

export function useConfig() {
  return { config: { routes: { api: '/api' } } }
}

export function useDocumentInfo() {
  return payloadUiState.document
}

export function useField<T>() {
  return {
    disabled: payloadUiState.disabled,
    path: payloadUiState.fieldPath,
    setValue(value: T) {
      payloadUiState.setValues.push(String(value))
    },
    value: payloadUiState.fieldValue as T,
  }
}

export function useForm() {
  return { getData: () => payloadUiState.formData }
}

export function useLocale() {
  return { code: payloadUiState.locale }
}
