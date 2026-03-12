import DOMPurify from 'dompurify'

const SVG_ALLOWED_TAGS = [
  'svg', 'g', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'clipPath', 'mask', 'use', 'symbol', 'linearGradient',
  'radialGradient', 'stop', 'pattern', 'image', 'foreignObject', 'switch', 'a',
  'animate', 'animateTransform', 'animateMotion', 'set', 'mpath', 'desc', 'title'
]

const SVG_ALLOWED_ATTR = [
  'viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'transform', 'translate', 'rotate', 'scale', 'skewX', 'skewY',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'opacity', 'fill-opacity', 'stroke-opacity',
  'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor',
  'id', 'class', 'clip-path', 'mask', 'href', 'xlink:href',
  'preserveAspectRatio', 'xmlns', 'xmlns:xlink',
  'gradientUnits', 'gradientTransform', 'spreadMethod',
  'offset', 'stop-color', 'stop-opacity',
  'patternUnits', 'patternTransform',
  'filter', 'filterUnits',
  'style', 'color', 'display', 'visibility',
  'dominant-baseline', 'alignment-baseline'
]

export function sanitizeSvg(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(svgString, {
    ALLOWED_TAGS: SVG_ALLOWED_TAGS,
    ALLOWED_ATTR: SVG_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_URI_SAFE_ATTR: ['xlink:href'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  })
}

export function sanitizeHtml(htmlString: string, options?: {
  allowedTags?: string[]
  allowedAttr?: string[]
}): string {
  if (!htmlString || typeof htmlString !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(htmlString, {
    ALLOWED_TAGS: options?.allowedTags,
    ALLOWED_ATTR: options?.allowedAttr,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  })
}

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
