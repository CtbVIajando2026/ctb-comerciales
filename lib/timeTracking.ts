export interface VisitaBasica {
  hora_checkin: string;
  hora_checkout: string | null;
}

/**
 * Calcula los minutos de "Horas Muertas" en una jornada laboral (09:00 a 18:00)
 * para un día específico (lunes a viernes).
 *
 * Solo suma huecos que sean mayores o iguales a `toleranciaMinutos` (por defecto 15 min).
 */
export function calcularHorasMuertas(
  visitas: VisitaBasica[],
  fechaISO: string, // YYYY-MM-DD
  toleranciaMinutos: number = 15
): number {
  const d = new Date(`${fechaISO}T12:00:00-05:00`); // Mediodía para asegurar el día correcto en EC
  const diaSemana = d.getDay();
  // Si es sábado (6) o domingo (0), no hay horas muertas
  if (diaSemana === 0 || diaSemana === 6) {
    return 0;
  }

  const inicioJornada = new Date(`${fechaISO}T09:00:00-05:00`).getTime();
  const finJornada = new Date(`${fechaISO}T18:00:00-05:00`).getTime();
  
  // Usamos la hora actual para calcular hasta qué momento evaluar si es el día de hoy
  const ahoraStr = new Date().toLocaleString("en-US", {timeZone: "America/Guayaquil"});
  const ahora = new Date(ahoraStr).getTime();
  const fechaHoyISO = new Date(ahoraStr).toISOString().split('T')[0];

  let finAnalisis = finJornada;
  // Si es el día de hoy y todavía no son las 18:00, solo calculamos las horas muertas hasta AHORA
  if (fechaISO === fechaHoyISO && ahora < finJornada) {
    // Si todavía no empieza la jornada, 0 horas muertas
    if (ahora <= inicioJornada) return 0;
    finAnalisis = ahora;
  } else if (fechaISO === fechaHoyISO && ahora >= finJornada) {
    finAnalisis = finJornada;
  }

  // Filtrar y ordenar visitas por checkin
  const completadas = visitas
    .filter(v => v.hora_checkin && v.hora_checkout)
    .map(v => ({
      in: new Date(v.hora_checkin).getTime(),
      out: new Date(v.hora_checkout!).getTime()
    }))
    .sort((a, b) => a.in - b.in);

  let totalMinutosMuertos = 0;
  let cursor = inicioJornada;

  for (const v of completadas) {
    // Si la visita empezó después de nuestro cursor, hay un gap
    if (v.in > cursor) {
      // El gap solo cuenta si está dentro del horario laboral
      const gapStart = cursor;
      const gapEnd = Math.min(v.in, finAnalisis);
      
      if (gapEnd > gapStart) {
        const gapMinutos = (gapEnd - gapStart) / 60000;
        if (gapMinutos >= toleranciaMinutos) {
          totalMinutosMuertos += gapMinutos;
        }
      }
    }
    // Mover el cursor al final de esta visita
    // (Aseguramos que el cursor no retroceda si hay visitas solapadas)
    cursor = Math.max(cursor, v.out);
  }

  // Comprobar el gap final desde la última visita hasta el fin de análisis
  if (cursor < finAnalisis) {
    const gapFinalMinutos = (finAnalisis - cursor) / 60000;
    if (gapFinalMinutos >= toleranciaMinutos) {
      totalMinutosMuertos += gapFinalMinutos;
    }
  }

  return Math.floor(totalMinutosMuertos);
}
