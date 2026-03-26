/* 
  DEPRECATED — Auto-update ahora se maneja via useAutoUpdate + electron-updater.
  Este hook se mantiene solo por compatibilidad. No se usa en SystemStatusBanners.
*/

import { useState } from 'react'

export function useDesktopUpdateNotice() {
  var _s = useState(null)
  return {
    updateNotice: _s[0],
    dismissUpdateNotice: function () {},
    openUpdateDownload: function () {}
  }
}