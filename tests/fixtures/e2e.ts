import { getPayload } from 'payload'

import config from '../../src/payload.config'

export const E2E_CONSENT_VERSION = 'e2e-v1'

function lexicalDocument(text: string) {
  return {
    root: {
      type: 'root' as const,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text }],
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

const payload = await getPayload({ config })

try {
  await payload.updateGlobal({
    slug: 'cookie-settings',
    data: {
      title: 'Privacy choices',
      description: 'Control optional services without changing essential site behavior.',
      consentVersion: E2E_CONSENT_VERSION,
    },
    overrideAccess: true,
  })

  await Promise.all([
    payload.create({
      collection: 'articles',
      data: {
        title: 'Alpha Project',
        type: 'case-study',
        slug: 'e2e-alpha',
        year: 2026,
        shortcutIcon: 'ri-rocket-fill',
        content: [
          {
            blockType: 'hero',
            title: 'Alpha delivery',
            description: 'A production journey through the portfolio content system.',
          },
          {
            blockType: 'summary',
            leftTitle: 'Challenge',
            leftBody: 'Make complex work understandable.',
            rightTitle: 'Outcome',
            rightBody: 'A consistent system built from real product behavior.',
          },
          {
            blockType: 'stats',
            stats: [{ value: '42%', label: 'Faster delivery' }],
          },
          {
            blockType: 'description',
            title: 'Measured approach',
            body: lexicalDocument('The team validated each stage with users and production data.'),
          },
          {
            blockType: 'sectionTitle',
            title: 'Selected outcome',
            description: 'A maintainable experience with clear interaction contracts.',
          },
        ],
      },
      overrideAccess: true,
    }),
    payload.create({
      collection: 'articles',
      data: {
        title: 'Beta Project',
        type: 'case-study',
        slug: 'e2e-beta',
        year: 2025,
        shortcutIcon: 'ri-shapes-fill',
        content: [
          {
            blockType: 'hero',
            title: 'Beta system',
            description: 'A second project used to validate filtering and view changes.',
          },
        ],
      },
      overrideAccess: true,
    }),
  ])

  await Promise.all([
    payload.create({
      collection: 'windows',
      data: {
        title: 'Core Workspace',
        slug: 'e2e-workspace',
        showShortcut: true,
        shortcutName: 'Workspace',
        shortcutIcon: 'ri-window-fill',
        shortcutOrder: 1,
        windowCollapsible: true,
        windowExpandable: true,
        windowResizable: true,
        windowDisplaySearch: true,
        windowDisplayViewToggle: true,
        windowDefaultView: 'grid',
        windowDisplayHistory: true,
        content: [
          {
            blockType: 'richText',
            content: lexicalDocument('Workspace content rendered from Payload.'),
          },
          {
            blockType: 'articleList',
            heading: 'Core Projects',
            types: ['case-study'],
            sortField: 'title',
            sortDirection: 'asc',
            limit: 10,
          },
        ],
        buttons: [
          {
            label: 'Open notes',
            target: 'internal',
            slug: 'e2e-notes',
            style: 'secondary',
          },
        ],
      },
      overrideAccess: true,
    }),
    payload.create({
      collection: 'windows',
      data: {
        title: 'Reference Notes',
        slug: 'e2e-notes',
        showShortcut: true,
        shortcutName: 'Notes',
        shortcutIcon: 'ri-sticky-note-fill',
        shortcutOrder: 2,
        windowCollapsible: true,
        windowExpandable: false,
        windowResizable: true,
        content: [
          {
            blockType: 'richText',
            content: lexicalDocument(
              'Reference notes remain available in a second managed window.',
            ),
          },
        ],
      },
      overrideAccess: true,
    }),
    payload.create({
      collection: 'windows',
      data: {
        title: 'Desktop Welcome',
        slug: 'e2e-startup-desktop',
        showShortcut: false,
        windowOpenOnStartup: true,
        windowStartupViewports: ['desktop'],
        windowStartupOrder: 1,
        content: [
          {
            blockType: 'welcomeIntro',
            title: 'Desktop ready',
            role: 'Startup contract',
            descriptor: 'Opened once for the desktop session.',
          },
        ],
      },
      overrideAccess: true,
    }),
    payload.create({
      collection: 'windows',
      data: {
        title: 'Mobile Welcome',
        slug: 'e2e-startup-mobile',
        showShortcut: false,
        windowOpenOnStartup: true,
        windowStartupViewports: ['mobile'],
        windowStartupOrder: 1,
        content: [
          {
            blockType: 'welcomeIntro',
            title: 'Mobile ready',
            role: 'Startup contract',
            descriptor: 'Opened once for the mobile session.',
          },
        ],
      },
      overrideAccess: true,
    }),
    payload.create({
      collection: 'windows',
      data: {
        title: 'About DimmOS',
        slug: 'about',
        showShortcut: false,
        content: [
          {
            blockType: 'richText',
            content: lexicalDocument('DimmOS is an interactive portfolio workspace.'),
          },
        ],
      },
      overrideAccess: true,
    }),
  ])

  console.log('Deterministic E2E content seeded.')
} catch (error) {
  console.error('Failed to seed deterministic E2E content.', error)
  process.exitCode = 1
} finally {
  const database = payload.db as typeof payload.db & {
    pool?: { end: () => Promise<void> }
  }
  await payload.destroy()
  void database.pool?.end()
}

process.exit(process.exitCode ?? 0)
