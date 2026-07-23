/**
 * MiFinanza - Database Module (SQLite)
 * Maneja la conexión y operaciones con la base de datos local.
 */
import * as SQLite from 'expo-sqlite';

let db = null;

/**
 * Obtiene la instancia de la base de datos.
 * Si no existe, la abre de forma asíncrona.
 */
export async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('mifinanza.db');
  }
  return db;
}

/**
 * Inicializa la base de datos: crea tablas, migra esquema y datos semilla.
 */
export async function initDatabase() {
  const database = await getDB();

  // Crear tabla de usuarios
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuario',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Crear tabla de billeteras (con user_id)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS billeteras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 0,
      nombre TEXT NOT NULL,
      moneda TEXT NOT NULL,
      moneda_abreviatura TEXT NOT NULL,
      codigo TEXT NOT NULL DEFAULT 'Sin código',
      balance REAL DEFAULT 0.00,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Crear tabla de tipos de movimiento (con user_id)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tipos_movimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 0,
      tipo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Crear tabla de movimientos
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      billetera_id INTEGER NOT NULL,
      tipo_movimiento_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (billetera_id) REFERENCES billeteras(id),
      FOREIGN KEY (tipo_movimiento_id) REFERENCES tipos_movimiento(id)
    );
  `);

  // Insertar usuario semilla si no existe
  const existingUser = await database.getFirstAsync(
    'SELECT id FROM users WHERE usuario = ?',
    ['admin']
  );

  if (!existingUser) {
    await database.runAsync(
      'INSERT INTO users (usuario, contrasena, rol) VALUES (?, ?, ?)',
      ['admin', 'admin123', 'usuario']
    );
    console.log('[DB] Usuario semilla "admin" creado exitosamente');
  }

  // Migrar rol de admin existente a 'usuario'
  await database.runAsync(
    "UPDATE users SET rol = 'usuario' WHERE rol = 'administrador'"
  );

  // Migrar datos existentes sin user_id al usuario admin
  await migrateOrphanedData(database);

  console.log('[DB] Base de datos inicializada correctamente');
}

/**
 * Migra billeteras y tipos_movimiento sin user_id al usuario "admin".
 * Solo afecta registros con user_id = 0 (datos antiguos).
 */
async function migrateOrphanedData(database) {
  const adminUser = await database.getFirstAsync(
    'SELECT id FROM users WHERE usuario = ?',
    ['admin']
  );

  if (!adminUser) return;

  const adminId = adminUser.id;

  // Agregar columna user_id si no existe (migración para tablas creadas sin ella)
  try {
    await database.execAsync('ALTER TABLE billeteras ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    // La columna ya existe, ignorar
  }

  // Agregar columna balance si no existe (migración)
  try {
    await database.execAsync('ALTER TABLE billeteras ADD COLUMN balance REAL DEFAULT 0.00;');
    console.log('[DB] Columna balance agregada exitosamente.');
  } catch (e) {
    console.log('[DB] Columna balance ya existe o error:', e);
  }

  try {
    await database.execAsync('ALTER TABLE tipos_movimiento ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    // La columna ya existe, ignorar
  }

  // Asignar registros huérfanos (user_id = 0) al usuario admin
  await database.runAsync(
    'UPDATE billeteras SET user_id = ? WHERE user_id = 0',
    [adminId]
  );
  await database.runAsync(
    'UPDATE tipos_movimiento SET user_id = ? WHERE user_id = 0',
    [adminId]
  );

  console.log('[DB] Datos huérfanos migrados al usuario admin (id:', adminId, ')');
}

// ============================================================
// USUARIOS
// ============================================================

/**
 * Valida las credenciales de un usuario contra la base de datos.
 * @param {string} usuario - Nombre de usuario
 * @param {string} contrasena - Contraseña
 * @returns {Object|null} Datos del usuario si es válido, null si no
 */
export async function validateUser(usuario, contrasena) {
  const database = await getDB();

  const user = await database.getFirstAsync(
    'SELECT id, usuario, rol FROM users WHERE usuario = ? AND contrasena = ?',
    [usuario, contrasena]
  );

  return user || null;
}

/**
 * Obtiene un usuario por su nombre de usuario.
 * @param {string} usuario - Nombre de usuario
 * @returns {Object|null} Datos del usuario o null
 */
export async function getUserByUsername(usuario) {
  const database = await getDB();

  const user = await database.getFirstAsync(
    'SELECT id, usuario, rol FROM users WHERE usuario = ?',
    [usuario]
  );

  return user || null;
}

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {string} usuario - Nombre de usuario
 * @param {string} contrasena - Contraseña
 * @returns {Object} Resultado con success y message
 */
export async function createUser(usuario, contrasena) {
  const database = await getDB();

  // Verificar si el usuario ya existe
  const existing = await database.getFirstAsync(
    'SELECT id FROM users WHERE usuario = ?',
    [usuario]
  );

  if (existing) {
    return { success: false, message: 'El nombre de usuario ya está en uso.' };
  }

  // Crear el usuario con rol fijo 'usuario'
  const result = await database.runAsync(
    'INSERT INTO users (usuario, contrasena, rol) VALUES (?, ?, ?)',
    [usuario, contrasena, 'usuario']
  );

  console.log('[DB] Nuevo usuario creado:', usuario);
  return {
    success: true,
    message: 'Usuario registrado exitosamente.',
    userId: result.lastInsertRowId,
  };
}

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} userId - ID del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object} Resultado de la operación
 */
export async function updateUserPassword(userId, newPassword) {
  const database = await getDB();

  await database.runAsync(
    'UPDATE users SET contrasena = ? WHERE id = ?',
    [newPassword, userId]
  );

  return { success: true, message: 'Contraseña actualizada exitosamente.' };
}

// ============================================================
// BILLETERAS - CRUD (filtradas por user_id)
// ============================================================

/**
 * Crea una nueva billetera asociada a un usuario.
 * @param {number} userId - ID del usuario propietario
 * @param {string} nombre - Nombre de la billetera
 * @param {string} moneda - Nombre completo de la moneda
 * @param {string} monedaAbreviatura - Abreviatura (VES, USD, EUR)
 * @param {string} codigo - Código bancario o 'Sin código'
 * @param {number} balance - Saldo inicial de la billetera
 * @returns {Object} Resultado con success y message
 */
export async function createBilletera(userId, nombre, moneda, monedaAbreviatura, codigo, balance = 0.00) {
  const database = await getDB();

  const result = await database.runAsync(
    'INSERT INTO billeteras (user_id, nombre, moneda, moneda_abreviatura, codigo, balance) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, nombre, moneda, monedaAbreviatura, codigo || 'Sin código', balance]
  );

  console.log('[DB] Nueva billetera creada:', nombre);
  return {
    success: true,
    message: 'Billetera creada exitosamente.',
    billeteraId: result.lastInsertRowId,
  };
}

/**
 * Obtiene todas las billeteras de un usuario.
 * @param {number} userId - ID del usuario
 * @returns {Array} Lista de billeteras del usuario
 */
export async function getAllBilleteras(userId) {
  const database = await getDB();
  const billeteras = await database.getAllAsync(
    'SELECT id, user_id, nombre, moneda, moneda_abreviatura, codigo, balance, created_at FROM billeteras WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  return billeteras || [];
}

/**
 * Actualiza una billetera existente.
 * @param {number} billeteraId - ID de la billetera
 * @param {string} nombre - Nuevo nombre
 * @param {string} moneda - Nueva moneda
 * @param {string} monedaAbreviatura - Nueva abreviatura
 * @param {string} codigo - Nuevo código
 * @param {number} balance - Nuevo balance
 * @returns {Object} Resultado de la operación
 */
export async function updateBilletera(billeteraId, nombre, moneda, monedaAbreviatura, codigo, balance) {
  const database = await getDB();

  await database.runAsync(
    'UPDATE billeteras SET nombre = ?, moneda = ?, moneda_abreviatura = ?, codigo = ?, balance = ? WHERE id = ?',
    [nombre, moneda, monedaAbreviatura, codigo || 'Sin código', balance, billeteraId]
  );

  return { success: true, message: 'Billetera actualizada exitosamente.' };
}

/**
 * Elimina una billetera y todos los datos asociados a ella.
 * @param {number} billeteraId - ID de la billetera a eliminar
 * @returns {Object} Resultado de la operación
 */
export async function deleteBilletera(billeteraId) {
  const database = await getDB();

  await database.runAsync('DELETE FROM movimientos WHERE billetera_id = ?', [billeteraId]);
  await database.runAsync('DELETE FROM billeteras WHERE id = ?', [billeteraId]);
  return { success: true, message: 'Billetera eliminada exitosamente.' };
}

// ============================================================
// TIPOS DE MOVIMIENTO - CRUD (filtrados por user_id)
// ============================================================

/**
 * Crea un nuevo tipo de movimiento asociado a un usuario.
 * @param {number} userId - ID del usuario propietario
 * @param {string} tipo - 'Ingreso' o 'Egreso'
 * @param {string} nombre - Nombre del tipo de movimiento
 * @returns {Object} Resultado con success y message
 */
export async function createTipoMovimiento(userId, tipo, nombre) {
  const database = await getDB();

  const result = await database.runAsync(
    'INSERT INTO tipos_movimiento (user_id, tipo, nombre) VALUES (?, ?, ?)',
    [userId, tipo, nombre]
  );

  console.log('[DB] Nuevo tipo de movimiento creado:', nombre);
  return {
    success: true,
    message: 'Tipo de movimiento creado exitosamente.',
    tipoMovimientoId: result.lastInsertRowId,
  };
}

/**
 * Obtiene todos los tipos de movimiento de un usuario.
 * @param {number} userId - ID del usuario
 * @returns {Array} Lista de tipos de movimiento del usuario
 */
export async function getAllTiposMovimiento(userId) {
  const database = await getDB();
  const tipos = await database.getAllAsync(
    'SELECT id, user_id, tipo, nombre, created_at FROM tipos_movimiento WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  return tipos || [];
}

/**
 * Actualiza un tipo de movimiento existente.
 * @param {number} tipoId - ID del tipo de movimiento
 * @param {string} tipo - 'Ingreso' o 'Egreso'
 * @param {string} nombre - Nuevo nombre
 * @returns {Object} Resultado de la operación
 */
export async function updateTipoMovimiento(tipoId, tipo, nombre) {
  const database = await getDB();

  await database.runAsync(
    'UPDATE tipos_movimiento SET tipo = ?, nombre = ? WHERE id = ?',
    [tipo, nombre, tipoId]
  );

  return { success: true, message: 'Tipo de movimiento actualizado exitosamente.' };
}

/**
 * Elimina un tipo de movimiento sin borrar datos asociados.
 * @param {number} tipoId - ID del tipo de movimiento a eliminar
 * @returns {Object} Resultado de la operación
 */
export async function deleteTipoMovimiento(tipoId) {
  const database = await getDB();

  await database.runAsync('DELETE FROM tipos_movimiento WHERE id = ?', [tipoId]);
  return { success: true, message: 'Tipo de movimiento eliminado exitosamente.' };
}

// ============================================================
// MOVIMIENTOS REALES - CRUD (filtrados por user_id)
// ============================================================

/**
 * Crea un movimiento y afecta el balance de la billetera.
 */
export async function createMovimiento(userId, billeteraId, tipoMovimientoId, monto, descripcion, fecha) {
  const database = await getDB();

  const billetera = await database.getFirstAsync('SELECT id, balance FROM billeteras WHERE id = ? AND user_id = ?', [billeteraId, userId]);
  if (!billetera) return { success: false, message: 'La billetera seleccionada no existe o no es válida.' };

  const tipoObj = await database.getFirstAsync('SELECT id, tipo FROM tipos_movimiento WHERE id = ? AND user_id = ?', [tipoMovimientoId, userId]);
  if (!tipoObj) return { success: false, message: 'El tipo de movimiento seleccionado no existe.' };

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) return { success: false, message: 'El monto debe ser mayor a cero.' };

  let nuevoBalance = billetera.balance;

  if (tipoObj.tipo === 'Ingreso') {
    nuevoBalance += montoNum;
  } else if (tipoObj.tipo === 'Egreso') {
    nuevoBalance -= montoNum;
    if (nuevoBalance < 0) {
      return { success: false, message: 'No tienes fondos suficientes en esta billetera. El balance no puede quedar en negativo.' };
    }
  }

  try {
    await database.runAsync('UPDATE billeteras SET balance = ? WHERE id = ?', [nuevoBalance, billeteraId]);
    await database.runAsync(
      'INSERT INTO movimientos (user_id, billetera_id, tipo_movimiento_id, monto, descripcion, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, billeteraId, tipoMovimientoId, montoNum, descripcion || '', fecha]
    );

    return { success: true, message: 'Movimiento registrado exitosamente.' };
  } catch (e) {
    console.error('[DB] Error al registrar movimiento:', e);
    return { success: false, message: 'Ocurrió un error al guardar el movimiento.' };
  }
}

/**
 * Elimina un movimiento y restaura el balance de la billetera.
 */
export async function deleteMovimiento(movimientoId, userId) {
  const database = await getDB();

  const mov = await database.getFirstAsync(
    'SELECT m.id, m.monto, m.billetera_id, m.tipo_movimiento_id, t.tipo FROM movimientos m JOIN tipos_movimiento t ON m.tipo_movimiento_id = t.id WHERE m.id = ? AND m.user_id = ?',
    [movimientoId, userId]
  );

  if (!mov) return { success: false, message: 'Movimiento no encontrado.' };

  const billetera = await database.getFirstAsync('SELECT id, balance FROM billeteras WHERE id = ?', [mov.billetera_id]);

  if (!billetera) {
    // Si por alguna razón la billetera no existe, solo borramos el movimiento sin restaurar.
    await database.runAsync('DELETE FROM movimientos WHERE id = ?', [movimientoId]);
    return { success: true, message: 'Movimiento eliminado correctamente.' };
  }

  let nuevoBalance = billetera.balance;

  if (mov.tipo === 'Ingreso') {
    nuevoBalance -= mov.monto;
    if (nuevoBalance < 0) {
      return { success: false, message: 'No se puede eliminar este ingreso porque el balance de la billetera asociada quedaría por debajo de cero.' };
    }
  } else if (mov.tipo === 'Egreso') {
    nuevoBalance += mov.monto;
  }

  try {
    await database.runAsync('UPDATE billeteras SET balance = ? WHERE id = ?', [nuevoBalance, billetera.id]);
    await database.runAsync('DELETE FROM movimientos WHERE id = ?', [movimientoId]);
    return { success: true, message: 'Movimiento eliminado y balance de billetera restaurado.' };
  } catch (e) {
    console.error('[DB] Error al eliminar movimiento:', e);
    return { success: false, message: 'Error interno al intentar eliminar.' };
  }
}

/**
 * Obtiene todos los movimientos formateados.
 */
export async function getAllMovimientos(userId) {
  const database = await getDB();
  const query = `
    SELECT 
      m.id, m.monto, m.descripcion, m.fecha, m.created_at,
      b.nombre as billetera_nombre, b.moneda_abreviatura as moneda,
      t.nombre as tipo_nombre, t.tipo as categoria
    FROM movimientos m
    JOIN billeteras b ON m.billetera_id = b.id
    JOIN tipos_movimiento t ON m.tipo_movimiento_id = t.id
    WHERE m.user_id = ?
    ORDER BY m.fecha DESC, m.id DESC
  `;
  const movs = await database.getAllAsync(query, [userId]);
  return movs || [];
}
