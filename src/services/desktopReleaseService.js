import appPackage from '../../package.json'

const UPDATE_MANIFEST_URL = import.meta.env.VITE_DESKTOP_UPDATE_MANIFEST_URL
  || 'https://app.gymcontrol.ymsolutions.online/releases/desktop/stable.json'

const FALLBACK_VERSION = appPackage.version

const normalizeVersion = (version) =>
  String(version || '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map(part => parseInt(part, 10) || 0)

export const compareVersions = (left, right) => {
  const leftParts = normalizeVersion(left)
  const rightParts = normalizeVersion(right)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] || 0
    const rightValue = rightParts[index] || 0

    if (leftValue > rightValue) return 1
    if (leftValue < rightValue) return -1
  }

  return 0
}

export const getCurrentDesktopVersion = () =>
  window?.electronAPI?.appVersion || FALLBACK_VERSION

export const openUpdateLink = async (url) => {
  if (!url) return

  if (window?.electronAPI?.openExternal) {
    await window.electronAPI.openExternal(url)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export const fetchDesktopReleaseManifest = async () => {
  const response = await fetch(UPDATE_MANIFEST_URL, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Manifest no disponible (${response.status})`)
  }

  const data = await response.json()
  if (!data?.version) {
    throw new Error('El manifest no incluye version.')
  }

  return data
}
