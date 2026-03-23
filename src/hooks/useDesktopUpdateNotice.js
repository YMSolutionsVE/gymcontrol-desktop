import { useEffect, useState } from 'react'
import {
  compareVersions,
  fetchDesktopReleaseManifest,
  getCurrentDesktopVersion,
  openUpdateLink,
} from '../services/desktopReleaseService'

const DISMISSED_VERSION_KEY = 'gc-dismissed-update-version'

export function useDesktopUpdateNotice() {
  const [updateNotice, setUpdateNotice] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadUpdate = async () => {
      if (!window?.electronAPI?.isElectron) return

      try {
        const manifest = await fetchDesktopReleaseManifest()
        const currentVersion = getCurrentDesktopVersion()
        const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY)

        if (compareVersions(manifest.version, currentVersion) <= 0) {
          return
        }

        if (!manifest.required && dismissedVersion === manifest.version) {
          return
        }

        if (cancelled) return

        setUpdateNotice({
          currentVersion,
          availableVersion: manifest.version,
          required: Boolean(manifest.required),
          title: manifest.title || `Nueva version disponible: ${manifest.version}`,
          message: manifest.message || 'Hay una nueva version del desktop lista para descargar.',
          notes: Array.isArray(manifest.notes) ? manifest.notes : [],
          downloadUrl: manifest.downloadUrl || '',
          publishedAt: manifest.publishedAt || null,
        })
      } catch {
        if (!cancelled) {
          setUpdateNotice(null)
        }
      }
    }

    loadUpdate()

    return () => {
      cancelled = true
    }
  }, [])

  const dismissUpdateNotice = () => {
    if (!updateNotice) return
    localStorage.setItem(DISMISSED_VERSION_KEY, updateNotice.availableVersion)
    setUpdateNotice(null)
  }

  const openUpdateDownload = async () => {
    if (!updateNotice?.downloadUrl) return
    await openUpdateLink(updateNotice.downloadUrl)
  }

  return {
    updateNotice,
    dismissUpdateNotice,
    openUpdateDownload,
  }
}
