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
