'use client'

import { WindowScaffold } from './window-scaffold'
import { footerButtonClass } from './footer-button'
import { useCookieConsent } from '@/components/cookie-banner/context'
import { useDisplayOptions } from '@/components/display-options'
import { CookiePreferencesForm } from '@/app/(frontend)/(pages)/cookie-preferences/CookiePreferencesForm'
import type { SystemWindowKey } from '@/lib/window-state'
import type { SystemWindowData } from './system-window-types'

export type SystemWindowRendererProps = {
  data: SystemWindowData
  close: () => void
  openSystem: (key: SystemWindowKey) => void
}

const ALL_COOKIE_CATEGORIES = ['essential', 'functional', 'analytics', 'marketing']

export function CookieNoticeSystemWindow({ data, close, openSystem }: SystemWindowRendererProps) {
  const { saveConsent } = useCookieConsent()

  async function save(categories: string[]) {
    await saveConsent(categories)
    close()
  }

  return (
    <WindowScaffold
      footer={
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                close()
                openSystem('cookie-preferences')
              }}
              className={footerButtonClass('secondary', 'flex-1')}
            >
              Configure
            </button>
            <button
              type="button"
              onClick={() => save(['essential'])}
              className={footerButtonClass('secondary', 'flex-1')}
            >
              Reject
            </button>
          </div>
          <button
            type="button"
            onClick={() => save(ALL_COOKIE_CATEGORIES)}
            className={footerButtonClass('primary', 'w-full')}
          >
            Accept All
          </button>
        </>
      }
    >
      <div className="px-6 pt-2 pb-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-fg">{data.cookieSettings.title ?? 'Cookie Notice'}</h2>
        <div className="flex flex-col gap-3 text-fg/70 text-sm">
          <p>{data.cookieSettings.description}</p>
        </div>
      </div>
    </WindowScaffold>
  )
}

export function CookiePreferencesSystemWindow({ data, close }: SystemWindowRendererProps) {
  return (
    <CookiePreferencesForm
      services={data.cookieServices}
      settings={data.cookieSettings}
      onSaved={close}
    />
  )
}

export function DisplayOptionsSystemWindow(_props: SystemWindowRendererProps) {
  const { cursorMode, setCursorMode } = useDisplayOptions()
  const useWebsiteCursor = cursorMode === 'website'

  return (
    <WindowScaffold>
      <div className="flex h-full flex-col justify-center gap-4 px-5">
        <div className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-fg">Website cursor</span>
            <span className="text-xs text-fg/45">{useWebsiteCursor ? 'Enabled' : 'System cursor'}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Use website cursor"
            aria-checked={useWebsiteCursor}
            onClick={() => setCursorMode(useWebsiteCursor ? 'system' : 'website')}
            className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
              useWebsiteCursor ? 'bg-brand' : 'bg-fg/25'
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-fg shadow-sm transition-transform duration-200 ${
                useWebsiteCursor ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </WindowScaffold>
  )
}
