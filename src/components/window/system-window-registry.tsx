'use client'

import type { ComponentType, CSSProperties } from 'react'
import type { SystemWindowKey } from '@/lib/window-state'
import {
  CookieNoticeSystemWindow,
  CookiePreferencesSystemWindow,
  DisplayOptionsSystemWindow,
  type SystemWindowRendererProps,
} from './system-windows'

export type SystemWindowRegistryEntry = {
  title: string
  icon: string
  color: string
  defaultPosition: { x: number; y: number; w?: number; h?: number }
  zIndexPriority: number
  behavior: {
    collapsible: boolean
    expandable: boolean
    resizable: boolean
  }
  attributes?: Record<`data-${string}`, string>
  style?: CSSProperties
  render: ComponentType<SystemWindowRendererProps>
}

export const systemWindowRegistry: Record<SystemWindowKey, SystemWindowRegistryEntry> = {
  'cookie-notice': {
    title: 'Cookie Notice',
    icon: 'ri-shield-check-fill',
    color: '#F22F57',
    defaultPosition: { x: -1, y: 20, w: 420 },
    zIndexPriority: 240,
    behavior: { collapsible: false, expandable: false, resizable: false },
    attributes: { 'data-cookie-banner': '', 'data-system-window-key': 'cookie-notice' },
    style: { height: 'auto', maxHeight: 'calc(100vh - var(--header-height) - 40px)' },
    render: CookieNoticeSystemWindow,
  },
  'cookie-preferences': {
    title: 'Cookie Preferences',
    icon: 'ri-shield-keyhole-fill',
    color: '#F22F57',
    defaultPosition: { x: 96, y: 56, w: 640, h: 620 },
    zIndexPriority: 220,
    behavior: { collapsible: true, expandable: true, resizable: true },
    attributes: { 'data-cookie-preferences-window': '', 'data-system-window-key': 'cookie-preferences' },
    render: CookiePreferencesSystemWindow,
  },
  'display-options': {
    title: 'Display Options',
    icon: 'ri-settings-3-fill',
    color: '#4A9EFF',
    defaultPosition: { x: -1, y: 56, w: 380, h: 220 },
    zIndexPriority: 190,
    behavior: { collapsible: true, expandable: false, resizable: false },
    attributes: { 'data-display-options-window': '', 'data-system-window-key': 'display-options' },
    render: DisplayOptionsSystemWindow,
  },
}
