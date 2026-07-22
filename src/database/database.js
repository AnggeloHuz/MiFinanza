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
 * Inicializa la base de datos: crea tablas e inserta datos semilla.
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

  // Crear tabla de billeteras
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS billeteras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      moneda TEXT NOT NULL,
      moneda_abreviatura TEXT NOT NULL,
      codigo TEXT NOT NULL DEFAULT 'Sin código',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Crear tabla de tipos de movimiento
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tipos_movimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      ['admin', 'admin123', 'administrador']
    );
    console.log('[DB] Usuario semilla "admin" creado exitosamente');
  }

  console.log('[DB] Base de datos inicializada correctamente');
}

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
 * El rol siempre será 'usuario' (solo admin tiene rol 'administrador').
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
 * Obtiene todos los usuarios registrados en la base de datos.
 * @returns {Array} Lista de usuarios
 */
export async function getAllUsers() {
  const database = await getDB();
  const users = await database.getAllAsync(
    'SELECT id, usuario, rol, created_at FROM users ORDER BY id DESC'
  );
  return users || [];
}

/**
 * Elimina un usuario de la base de datos por su ID.
 * @param {number} userId - ID del usuario a eliminar
 * @returns {Object} Resultado de la operación
 */
export async function deleteUser(userId) {
  const database = await getDB();
  
  // Evitar eliminar al admin base si es necesario, aunque la validación se hace en UI
  const user = await database.getFirstAsync('SELECT rol FROM users WHERE id = ?', [userId]);
  if (user && user.rol === 'administrador') {
    return { success: false, message: 'No se puede eliminar a un administrador principal.' };
  }
  
  await database.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  return { success: true, message: 'Usuario eliminado exitosamente.' };
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
// BILLETERAS - CRUD
// ============================================================

/**
 * Crea una nueva billetera en la base de datos.
 * @param {string} nombre - Nombre de la billetera
 * @param {string} moneda - Nombre completo de la moneda
 * @param {string} monedaAbreviatura - Abreviatura (VES, USD, EUR)
 * @param {string} codigo - Código bancario o 'Sin código'
 * @returns {Object} Resultado con success y message
 */
export async function createBilletera(nombre, moneda, monedaAbreviatura, codigo) {
  const database = await getDB();

  const result = await database.runAsync(
    'INSERT INTO billeteras (nombre, moneda, moneda_abreviatura, codigo) VALUES (?, ?, ?, ?)',
    [nombre, moneda, monedaAbreviatura, codigo || 'Sin código']
  );

  console.log('[DB] Nueva billetera creada:', nombre);
  return {
    success: true,
    message: 'Billetera creada exitosamente.',
    billeteraId: result.lastInsertRowId,
  };
}

/**
 * Obtiene todas las billeteras registradas.
 * @returns {Array} Lista de billeteras
 */
export async function getAllBilleteras() {
  const database = await getDB();
  const billeteras = await database.getAllAsync(
    'SELECT id, nombre, moneda, moneda_abreviatura, codigo, created_at FROM billeteras ORDER BY id DESC'
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
 * @returns {Object} Resultado de la operación
 */
export async function updateBilletera(billeteraId, nombre, moneda, monedaAbreviatura, codigo) {
  const database = await getDB();

  await database.runAsync(
    'UPDATE billeteras SET nombre = ?, moneda = ?, moneda_abreviatura = ?, codigo = ? WHERE id = ?',
    [nombre, moneda, monedaAbreviatura, codigo || 'Sin código', billeteraId]
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

  // A futuro aquí se borrarán movimientos y datos asociados
  // await database.runAsync('DELETE FROM movimientos WHERE billetera_id = ?', [billeteraId]);

  await database.runAsync('DELETE FROM billeteras WHERE id = ?', [billeteraId]);
  return { success: true, message: 'Billetera eliminada exitosamente.' };
}

// ============================================================
// TIPOS DE MOVIMIENTO - CRUD
// ============================================================

/**
 * Crea un nuevo tipo de movimiento.
 * @param {string} tipo - 'Ingreso' o 'Egreso'
 * @param {string} nombre - Nombre del tipo de movimiento
 * @returns {Object} Resultado con success y message
 */
export async function createTipoMovimiento(tipo, nombre) {
  const database = await getDB();

  const result = await database.runAsync(
    'INSERT INTO tipos_movimiento (tipo, nombre) VALUES (?, ?)',
    [tipo, nombre]
  );

  console.log('[DB] Nuevo tipo de movimiento creado:', nombre);
  return {
    success: true,
    message: 'Tipo de movimiento creado exitosamente.',
    tipoMovimientoId: result.lastInsertRowId,
  };
}

/**
 * Obtiene todos los tipos de movimiento.
 * @returns {Array} Lista de tipos de movimiento
 */
export async function getAllTiposMovimiento() {
  const database = await getDB();
  const tipos = await database.getAllAsync(
    'SELECT id, tipo, nombre, created_at FROM tipos_movimiento ORDER BY id DESC'
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
