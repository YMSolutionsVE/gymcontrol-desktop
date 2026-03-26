import { useEffect, useState, useCallback, useRef } from 'react'

var INITIAL_STATE = {
  status: 'idle',
  availableVersion: null,
  releaseNotes: [],
  releaseDate: null,
  percent: 0,
  transferred: 0,
  total: 0,
  bytesPerSecond: 0,
  errorMessage: null
}

export function useAutoUpdate() {
  var ref = useRef(INITIAL_STATE)
  var _s = useState(INITIAL_STATE)
  var state = _s[0]
  var setState = _s[1]

  var update = useCallback(function (partial) {
    var next = Object.assign({}, ref.current, partial)
    ref.current = next
    setState(next)
  }, [])

  useEffect(function () {
    if (!window.electronAPI || !window.electronAPI.onUpdateEvent) return

    var unsubscribe = window.electronAPI.onUpdateEvent(function (payload) {
      var s = payload.status
      var d = payload.data || {}

      if (s === 'checking') {
        update({ status: 'checking', errorMessage: null })
      } else if (s === 'available') {
        update({
          status: 'available',
          availableVersion: d.version || null,
          releaseNotes: d.releaseNotes || [],
          releaseDate: d.releaseDate || null,
          errorMessage: null
        })
      } else if (s === 'not-available') {
        update({ status: 'up-to-date', errorMessage: null })
      } else if (s === 'progress') {
        update({
          status: 'downloading',
          percent: d.percent || 0,
          transferred: d.transferred || 0,
          total: d.total || 0,
          bytesPerSecond: d.bytesPerSecond || 0
        })
      } else if (s === 'downloaded') {
        update({ status: 'ready', percent: 100 })
      } else if (s === 'error') {
        update({ status: 'error', errorMessage: d.message || 'Error desconocido' })
      }
    })

    return unsubscribe
  }, [update])

  var checkForUpdates = useCallback(function () {
    if (!window.electronAPI || !window.electronAPI.checkForUpdates) return
    update({ status: 'checking', errorMessage: null })
    window.electronAPI.checkForUpdates()
  }, [update])

  var downloadUpdate = useCallback(function () {
    if (!window.electronAPI || !window.electronAPI.downloadUpdate) return
    update({ status: 'downloading', percent: 0 })
    window.electronAPI.downloadUpdate()
  }, [update])

  var installUpdate = useCallback(function () {
    if (!window.electronAPI || !window.electronAPI.installUpdate) return
    update({ status: 'installing' })
    window.electronAPI.installUpdate()
  }, [update])

  return {
    status: state.status,
    availableVersion: state.availableVersion,
    releaseNotes: state.releaseNotes,
    releaseDate: state.releaseDate,
    percent: state.percent,
    transferred: state.transferred,
    total: state.total,
    bytesPerSecond: state.bytesPerSecond,
    errorMessage: state.errorMessage,
    checkForUpdates: checkForUpdates,
    downloadUpdate: downloadUpdate,
    installUpdate: installUpdate
  }
}