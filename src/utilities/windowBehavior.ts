export type WindowBehaviorConfig = {
  collapsible: boolean
  expandable: boolean
  resizable: boolean
  displaySearch: boolean
  displayViewToggle: boolean
  defaultView: 'grid' | 'table'
  displayHistory: boolean
}

export function extractBehavior(doc: {
  windowCollapsible?: boolean | null
  windowExpandable?: boolean | null
  windowResizable?: boolean | null
  windowDisplaySearch?: boolean | null
  windowDisplayViewToggle?: boolean | null
  windowDefaultView?: string | null
  windowDisplayHistory?: boolean | null
}): WindowBehaviorConfig {
  return {
    collapsible: doc.windowCollapsible !== false,
    expandable: doc.windowExpandable === true,
    resizable: doc.windowResizable !== false,
    displaySearch: doc.windowDisplaySearch === true,
    displayViewToggle: doc.windowDisplayViewToggle === true,
    defaultView: doc.windowDefaultView === 'table' ? 'table' : 'grid',
    displayHistory: doc.windowDisplayHistory === true,
  }
}
