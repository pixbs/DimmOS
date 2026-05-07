import type { CollectionBeforeChangeHook } from 'payload'

export const verifyRecaptchaHook: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create') return data

  const submissionData: { field: string; value: string }[] = data.submissionData || []
  const tokenIndex = submissionData.findIndex((e) => e.field === 'recaptchaToken')
  const token = submissionData[tokenIndex]?.value

  if (tokenIndex !== -1) submissionData.splice(tokenIndex, 1)

  if (!token) throw new Error('reCAPTCHA token missing')

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  })
  const result: { success: boolean; score: number } = await res.json()

  if (!result.success || result.score < 0.5) {
    throw new Error('reCAPTCHA verification failed')
  }

  return { ...data, submissionData }
}
