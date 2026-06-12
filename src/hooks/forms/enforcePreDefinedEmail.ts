import type { CollectionBeforeChangeHook } from 'payload'

type SubmissionEntry = { field: string; value: string }

export const enforcePreDefinedEmailHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data

  const form = await req.payload.findByID({
    collection: 'forms',
    id: data.form,
    depth: 0,
    req,
  })

  if (!form?.fields) return data

  for (const field of form.fields) {
    if (field.blockType === 'email' && field.isPreDefined && field.defaultValue) {
      const entry = ((data.submissionData ?? []) as SubmissionEntry[]).find(
        (e) => e.field === field.name,
      )
      if (entry) entry.value = field.defaultValue
    }
  }

  return data
}
