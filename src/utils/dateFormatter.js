/**
 * MiFinanza - Helper de Formato de Fechas (Venezuela)
 * Convierte formatos de fecha SQLite / ISO a formato de fecha venezolano.
 */

// Meses en español
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Días de la semana en español
const DIAS = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
];

/**
 * Parsea una cadena de fecha de SQLite (YYYY-MM-DD HH:mm:ss o ISO) a objeto Date local
 * @param {string|Date|number} sqliteDate - Fecha recibida de SQLite
 * @returns {Date|null}
 */
function parseSQLiteDate(sqliteDate) {
  if (!sqliteDate) return null;
  if (sqliteDate instanceof Date) return sqliteDate;

  // Si es un número (timestamp en ms o segundos)
  if (typeof sqliteDate === 'number') {
    return new Date(sqliteDate);
  }

  if (typeof sqliteDate === 'string') {
    // Si viene en formato SQLite 'YYYY-MM-DD HH:mm:ss', reemplazar espacio por 'T' y añadir 'Z' para tratarlo como UTC
    let formattedStr = sqliteDate;
    if (sqliteDate.includes(' ') && !sqliteDate.includes('T')) {
      formattedStr = sqliteDate.replace(' ', 'T') + 'Z';
    }
    const d = new Date(formattedStr);
    return isNaN(d.getTime()) ? new Date(sqliteDate) : d;
  }

  return null;
}

/**
 * Formatea una fecha de SQLite a formato corto venezolano (DD/MM/YYYY o DD/MM/YYYY hh:mm A)
 * @param {string|Date|number} sqliteDate - Fecha proveniente de SQLite
 * @param {boolean} includeTime - Si se incluye la hora en el resultado (por defecto true)
 * @returns {string} Ejemplo: "22/07/2026 02:30 PM" o "22/07/2026"
 */
export function formatDateShortVE(sqliteDate, includeTime = true) {
  const date = parseSQLiteDate(sqliteDate);
  if (!date || isNaN(date.getTime())) return 'Fecha no disponible';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // La hora '0' pasa a ser '12'
  const hoursStr = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Formatea una fecha de SQLite a formato largo venezolano
 * @param {string|Date|number} sqliteDate - Fecha proveniente de SQLite
 * @param {boolean} includeTime - Si se incluye la hora en el resultado (por defecto true)
 * @returns {string} Ejemplo: "22 de julio de 2026, 02:30 PM"
 */
export function formatDateLongVE(sqliteDate, includeTime = true) {
  const date = parseSQLiteDate(sqliteDate);
  if (!date || isNaN(date.getTime())) return 'Fecha no disponible';

  const day = date.getDate();
  const monthName = MESES[date.getMonth()];
  const year = date.getFullYear();

  if (!includeTime) {
    return `${day} de ${monthName} de ${year}`;
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${day} de ${monthName} de ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Formatea una fecha con el nombre del día (Ej: "Miércoles, 22 de julio de 2026")
 * @param {string|Date|number} sqliteDate 
 * @returns {string}
 */
export function formatDateFullVE(sqliteDate) {
  const date = parseSQLiteDate(sqliteDate);
  if (!date || isNaN(date.getTime())) return 'Fecha no disponible';

  const dayName = DIAS[date.getDay()];
  const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const day = date.getDate();
  const monthName = MESES[date.getMonth()];
  const year = date.getFullYear();

  return `${dayNameCapitalized}, ${day} de ${monthName} de ${year}`;
}

export default {
  formatDateShortVE,
  formatDateLongVE,
  formatDateFullVE,
};
