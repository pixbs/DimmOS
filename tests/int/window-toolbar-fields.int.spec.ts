import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { extractBehavior } from '@/utilities/windowBehavior'

let payload: Payload
const windowIds: number[] = []
const articleIds: number[] = []
const formIds: number[] = []

const minimalConfirmationMessage = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Thank you.', version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
}

describe('Window toolbar fields', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of windowIds) {
      await payload.delete({ collection: 'windows', id, overrideAccess: true })
    }
    for (const id of articleIds) {
      await payload.delete({ collection: 'articles', id, overrideAccess: true })
    }
    for (const id of formIds) {
      await payload.delete({ collection: 'forms', id, overrideAccess: true })
    }
  })

  describe('extractBehavior — toolbar defaults', () => {
    it('returns all toolbar flags as false when doc has no toolbar fields', () => {
      const result = extractBehavior({})
      expect(result.displaySearch).toBe(false)
      expect(result.displayViewToggle).toBe(false)
      expect(result.defaultView).toBe('grid')
      expect(result.displayHistory).toBe(false)
    })

    it('maps displaySearch: true', () => {
      expect(extractBehavior({ windowDisplaySearch: true }).displaySearch).toBe(true)
    })

    it('maps displayViewToggle: true and defaultView: table', () => {
      const result = extractBehavior({ windowDisplayViewToggle: true, windowDefaultView: 'table' })
      expect(result.displayViewToggle).toBe(true)
      expect(result.defaultView).toBe('table')
    })

    it('maps defaultView: grid explicitly', () => {
      expect(extractBehavior({ windowDisplayViewToggle: true, windowDefaultView: 'grid' }).defaultView).toBe('grid')
    })

    it('maps displayHistory: true', () => {
      expect(extractBehavior({ windowDisplayHistory: true }).displayHistory).toBe(true)
    })

    it('preserves existing behavior fields alongside new toolbar fields', () => {
      const result = extractBehavior({
        windowCollapsible: false,
        windowExpandable: true,
        windowResizable: false,
        windowDisplaySearch: true,
        windowDisplayViewToggle: true,
        windowDefaultView: 'table',
        windowDisplayHistory: true,
      })
      expect(result.collapsible).toBe(false)
      expect(result.expandable).toBe(true)
      expect(result.resizable).toBe(false)
      expect(result.displaySearch).toBe(true)
      expect(result.displayViewToggle).toBe(true)
      expect(result.defaultView).toBe('table')
      expect(result.displayHistory).toBe(true)
    })
  })

  describe('Windows collection — toolbar fields', () => {
    it('applies toolbar defaults: displaySearch=false, displayViewToggle=false, defaultView=grid, displayHistory=false', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Toolbar Defaults Window',
          slug: 'test-toolbar-win-defaults',
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(false)
      expect(doc.windowDisplayViewToggle).toBe(false)
      expect(doc.windowDefaultView).toBe('grid')
      expect(doc.windowDisplayHistory).toBe(false)
    })

    it('persists all toolbar fields set to enabled', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Full Toolbar Window',
          slug: 'test-toolbar-win-full',
          windowDisplaySearch: true,
          windowDisplayViewToggle: true,
          windowDefaultView: 'table',
          windowDisplayHistory: true,
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(true)
      expect(doc.windowDisplayViewToggle).toBe(true)
      expect(doc.windowDefaultView).toBe('table')
      expect(doc.windowDisplayHistory).toBe(true)
    })

    it('extractBehavior on a persisted window doc includes toolbar flags', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Behavior Extract Window',
          slug: 'test-toolbar-win-extract',
          windowDisplaySearch: true,
          windowDisplayHistory: true,
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      const behavior = extractBehavior(doc)
      expect(behavior.displaySearch).toBe(true)
      expect(behavior.displayHistory).toBe(true)
      expect(behavior.displayViewToggle).toBe(false)
      expect(behavior.defaultView).toBe('grid')
    })
  })

  describe('Articles collection — toolbar fields', () => {
    it('applies toolbar defaults', async () => {
      const doc = await payload.create({
        collection: 'articles',
        data: {
          title: 'Toolbar Defaults Article',
          slug: 'test-toolbar-art-defaults',
          type: 'case-study',
        },
        overrideAccess: true,
      })
      articleIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(false)
      expect(doc.windowDisplayViewToggle).toBe(false)
      expect(doc.windowDefaultView).toBe('grid')
      expect(doc.windowDisplayHistory).toBe(false)
    })

    it('persists toolbar fields on an article', async () => {
      const doc = await payload.create({
        collection: 'articles',
        data: {
          title: 'Full Toolbar Article',
          slug: 'test-toolbar-art-full',
          type: 'service',
          windowDisplaySearch: true,
          windowDisplayViewToggle: true,
          windowDefaultView: 'grid',
          windowDisplayHistory: true,
        },
        overrideAccess: true,
      })
      articleIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(true)
      expect(doc.windowDisplayViewToggle).toBe(true)
      expect(doc.windowDefaultView).toBe('grid')
      expect(doc.windowDisplayHistory).toBe(true)
    })
  })

  describe('Forms collection — toolbar fields', () => {
    it('applies toolbar defaults', async () => {
      const doc = await payload.create({
        collection: 'forms',
        data: {
          title: 'Toolbar Defaults Form',
          slug: 'test-toolbar-form-defaults',
          confirmationMessage: minimalConfirmationMessage,
        },
        overrideAccess: true,
      })
      formIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(false)
      expect(doc.windowDisplayViewToggle).toBe(false)
      expect(doc.windowDefaultView).toBe('grid')
      expect(doc.windowDisplayHistory).toBe(false)
    })

    it('persists toolbar fields on a form', async () => {
      const doc = await payload.create({
        collection: 'forms',
        data: {
          title: 'Full Toolbar Form',
          slug: 'test-toolbar-form-full',
          confirmationMessage: minimalConfirmationMessage,
          windowDisplaySearch: true,
          windowDisplayHistory: true,
        },
        overrideAccess: true,
      })
      formIds.push(doc.id)
      expect(doc.windowDisplaySearch).toBe(true)
      expect(doc.windowDisplayHistory).toBe(true)
    })
  })
})
