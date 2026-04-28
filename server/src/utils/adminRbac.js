const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : ''

const normalizePath = (value) => {
  const path = normalizeString(value)

  if (!path) {
    return ''
  }

  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}

const normalizeAction = (action, fallbackSort = 0) => {
  if (!action || typeof action !== 'object') {
    return null
  }

  const key = normalizeString(action.key || action.code || action.value)
  if (!key) {
    return null
  }

  return {
    key,
    name: normalizeString(action.name || action.label) || key,
    description: normalizeString(action.description),
    sort: Number(action.sort) || fallbackSort,
    status: action.status === 'inactive' ? 'inactive' : 'active',
  }
}

const getMenuActionDefinitions = (menu) => {
  if (!menu || typeof menu !== 'object') {
    return []
  }

  const explicitActions = Array.isArray(menu.actions)
    ? menu.actions
    : Array.isArray(menu.buttons)
      ? menu.buttons
      : []
  const actionMap = new Map()

  ;
  [...explicitActions].forEach((action, index) => {
    const normalized = normalizeAction(action, index)
    if (normalized && !actionMap.has(normalized.key)) {
      actionMap.set(normalized.key, normalized)
    }
  })

  return Array.from(actionMap.values()).sort((left, right) => {
    if (left.sort !== right.sort) {
      return left.sort - right.sort
    }

    return left.name.localeCompare(right.name, 'zh-CN')
  })
}

const buildActionOwnerMap = (menus) => {
  const actionOwnerMap = new Map()

  ;(menus || []).forEach((menu) => {
    const menuId = menu?._id ? String(menu._id) : normalizeString(menu?.id)
    if (!menuId) {
      return
    }

    getMenuActionDefinitions(menu).forEach((action) => {
      if (!actionOwnerMap.has(action.key)) {
        actionOwnerMap.set(action.key, {
          menuId,
          action,
        })
      }
    })
  })

  return actionOwnerMap
}

const normalizeActionKeys = (value) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((item) => normalizeString(item))
            .filter(Boolean),
        ),
      )
    : []

const collectRoleActionKeys = (roles) => {
  const actionKeySet = new Set()

  ;(roles || []).forEach((role) => {
    const actionOwnerMap = buildActionOwnerMap(role?.menuIds)

    normalizeActionKeys(role?.actionKeys).forEach((key) => {
      if (actionOwnerMap.has(key)) {
        actionKeySet.add(key)
      }
    })
  })

  return Array.from(actionKeySet)
}

module.exports = {
  buildActionOwnerMap,
  collectRoleActionKeys,
  getMenuActionDefinitions,
  normalizeActionKeys,
}
