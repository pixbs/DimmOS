export type WindowBehaviorConfig = {
  collapsible: boolean
  expandable: boolean
  resizable: boolean
}

export function extractBehavior(doc: {
  windowCollapsible?: boolean | null
  windowExpandable?: boolean | null
  windowResizable?: boolean | null
}): WindowBehaviorConfig {
  return {
    collapsible: doc.windowCollapsible !== false,
    expandable: doc.windowExpandable === true,
    resizable: doc.windowResizable !== false,
  }
}
