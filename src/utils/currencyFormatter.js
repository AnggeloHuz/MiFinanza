/**
 * Transforma un número al formato de moneda venezolano (entero o decimal).
 * Usa el punto (.) para los separadores de miles y la coma (,) para los decimales.
 * 
 * @param {number|string} amount - El monto a formatear
 * @param {boolean} showDecimals - Si debe forzar la visualización de 2 decimales (por defecto true)
 * @returns {string} El monto formateado
 */
export function formatCurrencyVE(amount, showDecimals = true) {
  if (amount === null || amount === undefined) return showDecimals ? '0,00' : '0';
  
  const num = Number(amount);
  
  if (isNaN(num)) return showDecimals ? '0,00' : '0';
  
  // 'de-DE' es el locale de Alemania, que utiliza '.' para miles y ',' para decimales,
  // que es exactamente el mismo formato usado en Venezuela.
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
}
