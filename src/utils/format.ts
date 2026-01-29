/**
 * Format Utilities
 * Contains formatting and transformation utilities
 */

/**
 * Highlight JSON string with HTML markup for syntax highlighting
 */
export function highlightJSON(json: string): string {
  if (!json) {
    return ''
  }

  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2)
  }

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = ''
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key'
        } else {
          cls = 'string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean'
      } else if (/null/.test(match)) {
        cls = 'null'
      } else {
        cls = 'number'
      }
      return `<span class="token ${cls}">${match}</span>`
    }
  )
}
