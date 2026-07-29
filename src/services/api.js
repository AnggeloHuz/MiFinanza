import { updateTasaCambio, getHistorialTasasCambio } from '../database/database';

const API_URL = 'https://open.er-api.com/v6/latest/USD';

/**
 * Obtiene las tasas de cambio desde la API y las actualiza en la base de datos local.
 * Descarga USD->VES y calcula EUR->VES.
 */
export async function syncExchangeRates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.rates) {
      const rateVES = data.rates.VES;
      const rateEUR = data.rates.EUR;
      
      if (rateVES) {
        // Formatear la fecha actual a DD/MM/YYYY
        const hoy = new Date();
        const d = String(hoy.getDate()).padStart(2, '0');
        const m = String(hoy.getMonth() + 1).padStart(2, '0');
        const a = hoy.getFullYear();
        const fechaActual = `${d}/${m}/${a}`;

        // Guardar USD -> VES
        await updateTasaCambio('USD', 'VES', rateVES, fechaActual);
        
        // Calcular y Guardar EUR -> VES
        // Si 1 USD = rateVES VES y 1 USD = rateEUR EUR
        // Entonces 1 EUR = rateVES / rateEUR VES
        if (rateEUR && rateEUR > 0) {
          const eurToVes = rateVES / rateEUR;
          await updateTasaCambio('EUR', 'VES', eurToVes, fechaActual);
        }
        
        console.log('[API] Tasas de cambio actualizadas correctamente.');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[API] Error al sincronizar tasas de cambio:', error);
    return false;
  }
}

/**
 * Auto-completa el historial de tasas de cambio (hasta X días atrás)
 * utilizando una API pública que permite consultas históricas sin costo.
 */
export async function syncHistoricalRatesBackfill(days = 30) {
  try {
    const historial = await getHistorialTasasCambio();
    // Crear un Set con las fechas que ya existen en la base de datos local
    const existingDates = new Set(historial.map(h => h.fecha_actualizacion));
    
    const hoy = new Date();
    const tasks = [];
    
    for (let i = 0; i <= days; i++) {
      const pastDate = new Date(hoy);
      pastDate.setDate(hoy.getDate() - i);
      
      const d = String(pastDate.getDate()).padStart(2, '0');
      const m = String(pastDate.getMonth() + 1).padStart(2, '0');
      const a = pastDate.getFullYear();
      
      const fechaLocal = `${d}/${m}/${a}`; // Formato guardado en BD
      const fechaAPI = `${a}-${m}-${d}`; // Formato YYYY-MM-DD para consultar la API
      
      // Si no existe la fecha, preparamos la consulta
      if (!existingDates.has(fechaLocal)) {
        tasks.push((async () => {
          try {
            const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${fechaAPI}/v1/currencies/usd.json`);
            if (res.ok) {
              const data = await res.json();
              const rateVES = data.usd?.ves;
              const rateEUR = data.usd?.eur; // euros que equivalen a 1 USD
              
              if (rateVES) {
                await updateTasaCambio('USD', 'VES', rateVES, fechaLocal);
                if (rateEUR && rateEUR > 0) {
                  const eurToVes = rateVES / rateEUR;
                  await updateTasaCambio('EUR', 'VES', eurToVes, fechaLocal);
                }
              }
            }
          } catch (e) {
            console.log(`[API] Info: No hay datos para ${fechaAPI} o falló conexión.`);
          }
        })());
      }
    }
    
    if (tasks.length > 0) {
      console.log(`[API] Auto-completando ${tasks.length} días de historial de tasas en 2do plano...`);
      // Esperamos que terminen todas las consultas sin detener si alguna falla
      await Promise.allSettled(tasks);
      console.log(`[API] Auto-completado de historial finalizado.`);
    }
    
  } catch (error) {
    console.error('[API] Error en el backfill de historial:', error);
  }
}
