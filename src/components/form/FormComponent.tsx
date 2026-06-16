'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

import { footerButtonClass } from '@/components/window/footer-button'
import type { Form } from '@/payload-types'

type FormFieldBlock = NonNullable<Form['fields']>[number]

function isLockedEmail(field: FormFieldBlock): boolean {
  return field.blockType === 'email' && field.isPreDefined === true
}

export function FormComponent({ form }: { form: Form }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [values, setValues] = useState<Record<string, string>>({})
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

  useEffect(() => {
    if (!siteKey) return

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [siteKey])

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting' || status === 'success') return
    setStatus('submitting')

    const submissionData = (form.fields || []).map((field) => ({
      field: field.name,
      value: isLockedEmail(field) ? field.defaultValue || '' : values[field.name] || '',
    }))

    if (siteKey && window.grecaptcha) {
      try {
        const token = await new Promise<string>((resolve, reject) => {
          window.grecaptcha.ready(async () => {
            try {
              resolve(await window.grecaptcha.execute(siteKey, { action: 'submit' }))
            } catch (err) {
              reject(err)
            }
          })
        })
        submissionData.push({ field: 'recaptchaToken', value: token })
      } catch {
        setStatus('error')
        return
      }
    }

    try {
      const res = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: form.id, submissionData }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const rowFields = (form.fields || []).filter((f) => f.blockType !== 'textarea')
  const bodyField = (form.fields || []).find((f) => f.blockType === 'textarea')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full gap-2" noValidate={false}>
      {/* Dark content box — the only scrolling region */}
      <div className="win-scroll flex-1 overflow-auto min-h-0 bg-bg rounded-2xl flex flex-col">
        {/* Row fields (email, text) */}
        {rowFields.map((field) => {
          const isDisabled = isLockedEmail(field)
          const label = field.label || field.name
          return (
            <div key={field.name} className="flex items-center gap-4 px-4 py-3 border-b border-fg/10">
              <span className="text-fg/40 text-[0.9375rem] shrink-0 w-16">{label}:</span>
              {isDisabled ? (
                <span className="px-3 py-1 rounded-lg text-xs text-brand bg-brand/10">
                  {field.defaultValue ?? ''}
                </span>
              ) : (
                <input
                  type={field.blockType === 'email' ? 'email' : 'text'}
                  name={field.name}
                  required={field.required ?? undefined}
                  placeholder={field.placeholder || ''}
                  value={values[field.name] || ''}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  className="bg-transparent text-fg placeholder:text-fg/50 outline-none flex-1 text-sm"
                />
              )}
            </div>
          )
        })}

        {/* Body textarea */}
        {bodyField && (
          <div className="flex-1 px-4 py-3">
            <textarea
              name={bodyField.name}
              required={bodyField.required ?? undefined}
              placeholder={bodyField.placeholder || ''}
              value={values[bodyField.name] || ''}
              onChange={(e) => setValue(bodyField.name, e.target.value)}
              className="bg-transparent text-fg placeholder:text-fg/50 resize-none w-full h-full outline-none text-sm"
            />
          </div>
        )}

        {/* reCAPTCHA notice — last item inside the content box */}
        <p className="shrink-0 px-4 pt-4 pb-5 text-fg/25 text-xs">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      </div>

      {/* Footer — Send button on the rim; stays above the mobile keyboard */}
      <div
        data-window-footer=""
        className="shrink-0 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className={footerButtonClass('primary', 'w-full')}
        >
          {status === 'submitting' ? 'Sending…' : status === 'success' ? 'Sent!' : 'Send'}
        </button>
        {status === 'error' && (
          <p className="text-brand text-sm text-center">Something went wrong. Please try again.</p>
        )}
      </div>
    </form>
  )
}
