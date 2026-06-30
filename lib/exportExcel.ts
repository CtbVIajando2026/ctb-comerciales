import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Estructura canónica de una fila de visita/actividad para exportar.
 * El orden de las propiedades aquí define el orden de las columnas en el Excel.
 */
export interface ExcelRow {
  fecha: string;
  Tipo: string;
  'Nombre Agencia': string;
  Estado: string;
  Duracion: string;
  Observaciones: string;
  'alerta de lejania': string;
  'alerta de tiempo inactivo': string;
}

/**
 * Definición de las columnas: clave (debe coincidir con la propiedad del objeto),
 * encabezado visible y ancho de columna en caracteres.
 */
const COLUMN_DEFS: { key: keyof ExcelRow; header: string; width: number }[] = [
  { key: 'fecha',                     header: 'fecha',                     width: 20 },
  { key: 'Tipo',                      header: 'Tipo',                      width: 18 },
  { key: 'Nombre Agencia',            header: 'Nombre Agencia',            width: 30 },
  { key: 'Estado',                    header: 'Estado',                    width: 14 },
  { key: 'Duracion',                  header: 'Duracion',                  width: 16 },
  { key: 'Observaciones',             header: 'Observaciones',             width: 50 },
  { key: 'alerta de lejania',         header: 'alerta de lejania',         width: 22 },
  { key: 'alerta de tiempo inactivo', header: 'alerta de tiempo inactivo', width: 22 },
];

/**
 * Construye una fila estructurada a partir de los datos raw de la base de datos.
 * Esta función centraliza la lógica de mapeo para todos los componentes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildExcelRow(v: any): ExcelRow {
  let mins = 0;
  if (v.hora_checkin && v.hora_checkout) {
    mins = Math.max(
      0,
      Math.floor(
        (new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000
      )
    );
  }

  // Observaciones: unificar temas + texto libre + observaciones en una sola línea
  let observaciones = '';
  if (v.es_actividad) {
    observaciones = v.observaciones || '';
  } else {
    const temas =
      v.temas && v.temas.length > 0
        ? v.temas.join(', ') + (v.temas_texto_libre ? `: ${v.temas_texto_libre}` : '')
        : v.observaciones || '';
    observaciones = temas;
  }
  // Quitar saltos de línea para que la celda no se expanda
  observaciones = observaciones.replace(/\n|\r/g, ' ').trim();

  // Nombre visible: agencia o título de actividad
  const nombre = v.es_actividad
    ? v.titulo_actividad || 'Actividad'
    : v.agenciaNombre || v.agencias?.nombre || 'Agencia';

  // Fecha legible
  const fecha = new Date(v.hora_checkin || v.created_at).toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Alerta de lejanía
  let alertaLejania = 'No';
  if (v.alerta_fraude_checkin) {
    alertaLejania = `Sí (${Math.round(v.distancia_checkin_metros || 0)} m)`;
  }

  // Alerta de inactividad (visita > 60 min)
  const alertaInactividad = mins > 60 ? `Sí (${mins} min)` : 'No';

  // Formato de duración "1:20m"
  let duracionStr = '0m';
  if (mins > 0) {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      duracionStr = `${h}:${m.toString().padStart(2, '0')}m`;
    } else {
      duracionStr = `${mins}m`;
    }
  }

  return {
    fecha: fecha,
    Tipo: v.es_actividad ? 'Actividad Interna' : 'Visita Agencia',
    'Nombre Agencia': nombre,
    Estado: v.estado || '',
    Duracion: duracionStr,
    Observaciones: observaciones,
    'alerta de lejania': alertaLejania,
    'alerta de tiempo inactivo': alertaInactividad,
  };
}

/**
 * Genera y descarga un archivo .xlsx completo con:
 *  - Cabeceras rojas (fondo rojo, texto blanco, negrita, centradas).
 *  - Filtros automáticos en cada columna.
 *  - Todas las filas con texto wrap desactivado (una línea).
 *  - Fila de resumen al final con totales.
 */
export async function exportToExcel(rows: ExcelRow[], filename: string) {
  if (rows.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CTB Comerciales';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Visitas', {
    views: [{ state: 'frozen', ySplit: 1 }], // Congelar la fila de encabezados
  });

  // 1. Definir columnas
  ws.columns = COLUMN_DEFS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  // 2. Estilo de la fila de encabezados (fila 1)
  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC0000' }, // Rojo oscuro (más elegante que FF0000 puro)
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: false,
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF990000' } },
    };
  });

  // 3. Agregar filas de datos
  rows.forEach((row, i) => {
    const excelRow = ws.addRow(row);
    excelRow.height = 18;

    // Alternar color de fondo para legibilidad
    const bgColor = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      };
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.font = { size: 10 };

      // Columna Duración: centrar y alinear a la derecha
      if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };
      }
      // Columna Observaciones: alinear a la izquierda
      if (colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      }
      // Alertas: colorear en rojo si hay alerta
      if (colNumber >= 7) {
        const val = String(cell.value || '');
        if (val.startsWith('Sí')) {
          cell.font = { size: 10, bold: true, color: { argb: 'FFCC0000' } };
        }
      }
    });
  });

  // 4. Fila de resumen / totales
  const totalVisitasAgencias = rows.filter((r) => r.Tipo === 'Visita Agencia').length;
  const totalActividades = rows.filter((r) => r.Tipo === 'Actividad Interna').length;
  // Calculamos los minutos parseando el string (ej. "1:20m" o "45m")
  const totalMinutos = rows.reduce((acc, r) => {
    let m = 0;
    const d = r.Duracion;
    if (d.includes(':')) {
      const parts = d.replace('m', '').split(':');
      m = parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
    } else {
      m = parseInt(d.replace('m', '') || '0');
    }
    return acc + m;
  }, 0);
  const totalAlertasLejania = rows.filter((r) => r['alerta de lejania'].startsWith('Sí')).length;
  const totalAlertasInactividad = rows.filter((r) =>
    r['alerta de tiempo inactivo'].startsWith('Sí')
  ).length;

  // Fila vacía de separación
  const sepRow = ws.addRow({});
  sepRow.height = 8;

  // Fila de totales
  const summaryRow = ws.addRow({
    fecha: 'RESUMEN TOTAL',
    Tipo: `Agencias: ${totalVisitasAgencias}`,
    'Nombre Agencia': `Actividades: ${totalActividades}`,
    Estado: `Total registros: ${rows.length}`,
    Duracion: `${totalMinutos}m`,
    Observaciones: `Prom. duración: ${rows.length > 0 ? Math.round(totalMinutos / rows.length) : 0} min/visita`,
    'alerta de lejania': `Alertas lejanía: ${totalAlertasLejania}`,
    'alerta de tiempo inactivo': `Alertas inactividad: ${totalAlertasInactividad}`,
  });
  summaryRow.height = 22;
  summaryRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' }, // Azul oscuro corporativo
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 10,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  });

  // 5. Auto-filter en la fila de encabezados (permite filtrar por cualquier columna)
  const lastCol = String.fromCharCode(64 + COLUMN_DEFS.length); // ej. 'H' para 8 columnas
  ws.autoFilter = `A1:${lastCol}1`;

  // 6. Generar y descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${filename}.xlsx`);
}
