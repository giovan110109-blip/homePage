/**
 * 格式化文件大小
 * @param size 字节数
 * @param digits 保留小数位
 */
export function formatFileSize(size: number, digits = 2): string {
  if (isNaN(size) || size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const idx = Math.floor(Math.log(size) / Math.log(1024));
  const val = size / Math.pow(1024, idx);
  return `${val.toFixed(digits)} ${units[idx]}`;
}
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
