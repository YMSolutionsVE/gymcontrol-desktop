// PREPARACIÓN - Lógica de sincronización futura
// Este archivo será implementado cuando se integre SQLite

/*
FLUJO DE SINCRONIZACIÓN PLANIFICADO:

1. App detecta que hay internet (useOnlineStatus)
2. Revisa sync_queue por registros con synced = 0
3. Por cada registro pendiente:
   a. Lee la acción (INSERT, UPDATE, DELETE)
   b. Lee la tabla destino
   c. Envía a Supabase
   d. Si exitoso: marca synced = 1
   e. Si falla: deja synced = 0 para reintentar

4. Después de sincronizar pendientes:
   a. Descarga datos nuevos de Supabase
   b. Actualiza tablas locales
   c. Marca todo como synced = 1

CONFLICTOS:
   - Si un registro fue modificado local y remotamente
   - Gana la versión más reciente (last_modified)
   - Se puede implementar merge manual en futuro
*/

const syncToCloud = async (db, supabase) => {
  // Pendiente de implementación
  console.log('Sync: pendiente de implementar')
}

const syncFromCloud = async (db, supabase) => {
  // Pendiente de implementación
  console.log('Sync: pendiente de implementar')
}

module.exports = {
  syncToCloud,
  syncFromCloud
}