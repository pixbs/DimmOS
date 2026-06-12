import { getPayload } from 'payload'
import config from '@payload-config'
import { FormComponent } from './FormComponent'

interface FormProps {
  formId: string | number
}

// Embed a form anywhere by its Payload ID
export async function Form({ formId }: FormProps) {
  const payload = await getPayload({ config })

  const form = await payload.findByID({
    collection: 'forms',
    id: formId,
    depth: 1,
    overrideAccess: false,
  })

  if (!form) return null

  return <FormComponent form={form as any} />
}
