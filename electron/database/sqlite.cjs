// PREPARACIÓN - No se conecta aún a la app
// Este archivo define la estructura para SQLite local

const DB_SCHEMA = `
  CREATE TABLE IF NOT EXISTS socios_local (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    cedula TEXT UNIQUE NOT NULL,
    telefono TEXT,
    plan_actual TEXT DEFAULT 'mensual',
    fecha_vencimiento TEXT,
    es_cortesia INTEGER DEFAULT 0,
    nota_cortesia TEXT,
    activo INTEGER DEFAULT 1,
    synced INTEGER DEFAULT 0,
    last_modified TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pagos_local (
    id TEXT PRIMARY KEY,
    socio_id TEXT NOT NULL,
    monto_usd REAL DEFAULT 0,
    monto_bs REAL DEFAULT 0,
    metodo TEXT DEFAULT 'efectivo',
    referencia TEXT,
    fecha_pago TEXT,
    synced INTEGER DEFAULT 0,
    last_modified TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS asistencias_local (
    id TEXT PRIMARY KEY,
    socio_id TEXT NOT NULL,
    fecha_hora TEXT,
    synced INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  );
`

const saveSocioLocal = (db, socio) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO socios_local
    (id, nombre, cedula, telefono, plan_actual, fecha_vencimiento, es_cortesia, nota_cortesia, activo, synced, last_modified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `)

  stmt.run(
    socio.id || crypto.randomUUID(),
    socio.nombre,
    socio.cedula,
    socio.telefono,
    socio.plan_actual,
    socio.fecha_vencimiento,
    socio.es_cortesia ? 1 : 0,
    socio.nota_cortesia,
    socio.activo ? 1 : 0
  )
}

const getPendingSync = (db) => {
  return db.prepare('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC').all()
}

const markAsSynced = (db, id) => {
  db.prepare('UPDATE sync_queue SET synced = 1 WHERE id = ?').run(id)
}

module.exports = {
  DB_SCHEMA,
  saveSocioLocal,
  getPendingSync,
  markAsSynced
}