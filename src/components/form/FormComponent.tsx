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

type FormField = {
  blockType: 'email' | 'text' | 'textarea'
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  isPreDefined?: boolean
  preDefinedValue?: string
}

type FormData = {
  id: string | number
  title: string
  fields?: FormField[]
}

export function FormComponent({ form }: { form: FormData }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [values, setValues] = useState<Record<string, string>>({})
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

  useEffect(() => {
    if (!siteKey) return

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    document.head.appendChild(script)

    const style = document.createElement('style')
    style.textContent = '.grecaptcha-badge{visibility:hidden!important}'
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(style)
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
      value: field.isPreDefined ? (field.preDefinedValue || '') : (values[field.name] || ''),
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full" noValidate={false}>
      {/* Row fields (email, text) */}
      {rowFields.map((field) => {
        const isDisabled = field.blockType === 'email' && field.isPreDefined
        const label = field.label || field.name
        return (
          <div key={field.name} className="flex items-center gap-4 px-4 py-3 border-t border-fg/10">
            <span className="text-fg/40 text-[0.9375rem] shrink-0 w-16">{label}:</span>
            {isDisabled ? (
              <span
                className="px-3 py-1 rounded-full text-[0.9375rem]"
                style={{ background: 'color-mix(in srgb, #e3465a 18%, #111111)', color: '#e3465a' }}
              >
                {field.preDefinedValue}
              </span>
            ) : (
              <input
                type={field.blockType === 'email' ? 'email' : 'text'}
                name={field.name}
                required={field.required}
                placeholder={field.placeholder || ''}
                value={values[field.name] || ''}
                onChange={(e) => setValue(field.name, e.target.value)}
                className="bg-transparent text-fg/60 placeholder:text-fg/20 outline-none flex-1 text-[0.9375rem]"
              />
            )}
          </div>
        )
      })}

      {/* Body textarea */}
      {bodyField && (
        <div className="flex-1 px-4 py-3 border-t border-fg/10">
          <textarea
            name={bodyField.name}
            required={bodyField.required}
            placeholder={bodyField.placeholder || ''}
            value={values[bodyField.name] || ''}
            onChange={(e) => setValue(bodyField.name, e.target.value)}
            className="bg-transparent text-fg/80 placeholder:text-fg/20 resize-none w-full h-full outline-none text-[0.9375rem] leading-relaxed"
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-8 pt-4 flex flex-col gap-4">
        <p className="text-fg/25 text-xs leading-relaxed">
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
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="w-full py-4 rounded-full font-medium text-white text-[0.9375rem] transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-default"
          style={{ background: '#e3465a' }}
        >
          {status === 'submitting' ? 'Sending…' : status === 'success' ? 'Sent!' : 'Send'}
        </button>
        {status === 'error' && (
          <p className="text-[#e3465a] text-sm text-center">Something went wrong. Please try again.</p>
        )}
      </div>
    </form>
  )
}
