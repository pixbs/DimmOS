import type { Field } from 'payload'

export function createShortcutFields(defaultIcon: string): Field[] {
  return [
    { name: 'showShortcut', type: 'checkbox', defaultValue: false },
    { name: 'shortcutName', type: 'text' },
    { name: 'shortcutIcon', type: 'text', defaultValue: defaultIcon },
    {
      name: 'shortcutOrder',
      type: 'number',
      admin: {
        description:
          'Controls position across all shortcuts. Lower = earlier. Leave blank to append.',
      },
    },
  ]
}
