var FALLBACK_VERSION = '2.1.0'

var normalizeVersion = function (version) {
  return String(version || '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map(function (part) { return parseInt(part, 10) || 0 })
}

export var compareVersions = function (left, right) {
  var leftParts = normalizeVersion(left)
  var rightParts = normalizeVersion(right)
  var maxLength = Math.max(leftParts.length, rightParts.length)

  for (var i = 0; i < maxLength; i++) {
    var leftValue = leftParts[i] || 0
    var rightValue = rightParts[i] || 0
    if (leftValue > rightValue) return 1
    if (leftValue < rightValue) return -1
  }
  return 0
}

export var getCurrentDesktopVersion = function () {
  if (window && window.electronAPI && window.electronAPI.appVersion) {
    return window.electronAPI.appVersion
  }
  return FALLBACK_VERSION
}

export var openUpdateLink = function (url) {
  if (!url) return Promise.resolve()

  if (window && window.electronAPI && window.electronAPI.openExternal) {
    return window.electronAPI.openExternal(url)
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  return Promise.resolve()
}