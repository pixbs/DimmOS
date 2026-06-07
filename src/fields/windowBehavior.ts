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
  {
    name: 'windowDisplaySearch',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: 'Show a search bar in the window toolbar. Sections that support search (e.g. article lists) will filter their content.',
    },
  },
  {
    name: 'windowDisplayViewToggle',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: 'Show grid / table view toggle buttons in the toolbar.',
    },
  },
  {
    name: 'windowDefaultView',
    type: 'select',
    defaultValue: 'grid',
    options: [
      { label: 'Grid', value: 'grid' },
      { label: 'Table', value: 'table' },
    ],
    admin: {
      description: 'Initial layout when the window is opened.',
      condition: (data) => Boolean(data?.windowDisplayViewToggle),
    },
  },
  {
    name: 'windowDisplayHistory',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: 'Allow back / forward navigation within the window. Links that would open a new window will instead navigate in-place and build a per-window history.',
    },
  },
]
