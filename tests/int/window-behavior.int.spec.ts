import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const windowIds: number[] = []
const articleIds: number[] = []
const formIds: number[] = []

describe('Window behavior fields', () => {
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

  describe('Windows collection', () => {
    it('applies default values: collapsible=true, expandable=false, resizable=true', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Default Behavior Window',
          slug: 'test-win-behavior-defaults',
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(true)
      expect(doc.windowExpandable).toBe(false)
      expect(doc.windowResizable).toBe(true)
    })

    it('persists windowCollapsible: false', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Non-collapsible Window',
          slug: 'test-win-behavior-no-collapse',
          windowCollapsible: false,
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(false)
    })

    it('persists windowExpandable: true', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Expandable Window',
          slug: 'test-win-behavior-expandable',
          windowExpandable: true,
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowExpandable).toBe(true)
    })

    it('persists windowResizable: false', async () => {
      const doc = await payload.create({
        collection: 'windows',
        data: {
          title: 'Non-resizable Window',
          slug: 'test-win-behavior-no-resize',
          windowResizable: false,
        },
        overrideAccess: true,
      })
      windowIds.push(doc.id)
      expect(doc.windowResizable).toBe(false)
    })

    it('updates behavior fields independently of content', async () => {
      const created = await payload.create({
        collection: 'windows',
        data: {
          title: 'Behavior Update Window',
          slug: 'test-win-behavior-update',
          windowCollapsible: true,
          windowExpandable: false,
          windowResizable: true,
        },
        overrideAccess: true,
      })
      windowIds.push(created.id)

      const updated = await payload.update({
        collection: 'windows',
        id: created.id,
        data: { windowExpandable: true, windowResizable: false },
        overrideAccess: true,
      })
      expect(updated.windowCollapsible).toBe(true)
      expect(updated.windowExpandable).toBe(true)
      expect(updated.windowResizable).toBe(false)
    })
  })

  describe('Articles collection', () => {
    it('applies default values: collapsible=true, expandable=false, resizable=true', async () => {
      const doc = await payload.create({
        collection: 'articles',
        data: {
          title: 'Default Behavior Article',
          slug: 'test-art-behavior-defaults',
          type: 'case-study',
        },
        overrideAccess: true,
      })
      articleIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(true)
      expect(doc.windowExpandable).toBe(false)
      expect(doc.windowResizable).toBe(true)
    })

    it('persists all three behavior fields on an article', async () => {
      const doc = await payload.create({
        collection: 'articles',
        data: {
          title: 'Full Behavior Article',
          slug: 'test-art-behavior-full',
          type: 'service',
          windowCollapsible: false,
          windowExpandable: true,
          windowResizable: false,
        },
        overrideAccess: true,
      })
      articleIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(false)
      expect(doc.windowExpandable).toBe(true)
      expect(doc.windowResizable).toBe(false)
    })
  })

  describe('Forms collection', () => {
    // form-builder plugin requires a valid lexical confirmationMessage when confirmationType='message' (default)
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

    it('applies default values: collapsible=true, expandable=false, resizable=true', async () => {
      const doc = await payload.create({
        collection: 'forms',
        data: {
          title: 'Default Behavior Form',
          slug: 'test-form-behavior-defaults',
          confirmationMessage: minimalConfirmationMessage,
        },
        overrideAccess: true,
      })
      formIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(true)
      expect(doc.windowExpandable).toBe(false)
      expect(doc.windowResizable).toBe(true)
    })

    it('persists all three behavior fields on a form', async () => {
      const doc = await payload.create({
        collection: 'forms',
        data: {
          title: 'Full Behavior Form',
          slug: 'test-form-behavior-full',
          confirmationMessage: minimalConfirmationMessage,
          windowCollapsible: false,
          windowExpandable: true,
          windowResizable: false,
        },
        overrideAccess: true,
      })
      formIds.push(doc.id)
      expect(doc.windowCollapsible).toBe(false)
      expect(doc.windowExpandable).toBe(true)
      expect(doc.windowResizable).toBe(false)
    })
  })
})
