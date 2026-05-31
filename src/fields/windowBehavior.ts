import type { Field } from 'payload'

export const windowBehaviorFields: Field[] = [
  {
    name: 'windowCollapsible',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      description: 'Show minimize button in the title bar (default: on). Uncheck to hide it.',
    },
  },
  {
    name: 'windowExpandable',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: 'Show full-screen expand button in the title bar (default: off).',
    },
  },
  {
    name: 'windowResizable',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      description: 'Allow the window to be resized by dragging its edges (default: on).',
    },
  },
]
