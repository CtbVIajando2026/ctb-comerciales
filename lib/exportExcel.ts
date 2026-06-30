import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExcelRow {
  fecha: string;
  Categoría: string;
  Tipo: string;
  'Nombre Agencia': string;
  Comercial: string;
  Ciudad: string;
  Estado: string;
  Duracion: string;
  Observaciones: string;
  'alerta de lejania': string;
  'alerta de tiempo inactivo': string;
}

const COLUMN_DEFS: { key: keyof ExcelRow; header: string; width: number }[] = [
  { key: 'fecha',                     header: 'fecha',                     width: 20 },
  { key: 'Categoría',                 header: 'Categoría',                 width: 30 },
  { key: 'Tipo',                      header: 'Tipo',                      width: 18 },
  { key: 'Nombre Agencia',            header: 'Nombre Agencia',            width: 30 },
  { key: 'Comercial',                 header: 'Comercial',                 width: 25 },
  { key: 'Ciudad',                    header: 'Ciudad',                    width: 15 },
  { key: 'Estado',                    header: 'Estado',                    width: 14 },
  { key: 'Duracion',                  header: 'Duracion',                  width: 16 },
  { key: 'Observaciones',             header: 'Observaciones',             width: 50 },
  { key: 'alerta de lejania',         header: 'alerta de lejania',         width: 22 },
  { key: 'alerta de tiempo inactivo', header: 'alerta de tiempo inactivo', width: 22 },
];

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

  // Categoría
  let categoria = '';
  if (v.es_actividad) {
    const act = (v.titulo_actividad || '').toLowerCase();
    const obs = (v.observaciones || '').toLowerCase();
    if (act.includes('administrati') || obs.includes('administrati') || act.includes('oficina')) {
      categoria = 'Trabajo Administrativo';
    } else if (act.includes('reunion') || act.includes('capacita')) {
      categoria = 'Reunión / Capacitación';
    } else {
      categoria = 'Actividad Interna (Otras)';
    }
  } else {
    categoria = 'Gestión Comercial (Agencias)';
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
  observaciones = observaciones.replace(/\n|\r/g, ' ').trim();

  const nombre = v.es_actividad
    ? v.titulo_actividad || 'Actividad'
    : v.agenciaNombre || v.agencias?.nombre || 'Agencia';

  const fecha = new Date(v.hora_checkin || v.created_at).toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  let alertaLejania = 'No';
  if (v.alerta_fraude_checkin) {
    alertaLejania = `Sí (${Math.round(v.distancia_checkin_metros || 0)} m)`;
  }

  const alertaInactividad = mins > 60 ? `Sí (${mins} min)` : 'No';

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

  const comercial = v.usuarios?.nombre || v.usuario?.nombre || v.usuarioNombre || v.comercialNombre || 'Desconocido';
  const ciudad = v.agencias?.ciudad || v.usuarios?.zona || v.usuario?.zona || v.ciudad || v.zona || 'Desconocido';

  return {
    fecha: fecha,
    Categoría: categoria,
    Tipo: v.es_actividad ? 'Actividad Interna' : 'Visita Agencia',
    'Nombre Agencia': nombre,
    Comercial: comercial,
    Ciudad: ciudad,
    Estado: v.estado || '',
    Duracion: duracionStr,
    Observaciones: observaciones,
    'alerta de lejania': alertaLejania,
    'alerta de tiempo inactivo': alertaInactividad,
  };
}

function parseDuracion(d: string): number {
  if (!d) return 0;
  if (d.includes(':')) {
    const parts = d.replace('m', '').split(':');
    return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
  } else {
    return parseInt(d.replace('m', '') || '0');
  }
}

export async function exportToExcel(rows: ExcelRow[], filename: string) {
  if (rows.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CTB Comerciales';
  workbook.created = new Date();

  // =========================================================================
  // HOJA 1: DASHBOARD ANALÍTICO
  // =========================================================================
  const dash = workbook.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  // Anchos de columna para el dashboard
  dash.getColumn('A').width = 4;
  dash.getColumn('B').width = 40;
  dash.getColumn('C').width = 25;
  dash.getColumn('D').width = 15;
  dash.getColumn('E').width = 40;
  dash.getColumn('F').width = 4;

  // Título
  dash.mergeCells('B2:E3');
  const title = dash.getCell('B2');
  title.value = 'DASHBOARD INTELIGENTE DE VISITAS Y ACTIVIDADES';
  title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };

  // Cálculos Globales
  const totalVisitas = rows.filter(r => r.Tipo === 'Visita Agencia').length;
  const totalActividades = rows.filter(r => r.Tipo === 'Actividad Interna').length;
  
  const minAgencias = rows.filter(r => r.Tipo === 'Visita Agencia').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const minActividades = rows.filter(r => r.Tipo === 'Actividad Interna').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const totalMins = minAgencias + minActividades;
  const horasTotales = (totalMins / 60).toFixed(1);

  const totalAlertas = rows.filter(r => r['alerta de lejania'].startsWith('Sí') || r['alerta de tiempo inactivo'].startsWith('Sí')).length;

  // KPIs
  dash.getCell('B5').value = 'Total Registros:';
  dash.getCell('B5').font = { bold: true };
  dash.getCell('C5').value = rows.length;
  
  dash.getCell('D5').value = 'Horas Invertidas:';
  dash.getCell('D5').font = { bold: true };
  dash.getCell('E5').value = `${horasTotales} hrs`;

  dash.getCell('B6').value = 'Alertas Detectadas:';
  dash.getCell('B6').font = { bold: true, color: { argb: 'FFCC0000' } };
  dash.getCell('C6').value = totalAlertas;

  // Distribución del Tiempo
  dash.mergeCells('B8:E8');
  dash.getCell('B8').value = 'DISTRIBUCIÓN DEL TIEMPO (MINUTOS)';
  dash.getCell('B8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('B8').alignment = { vertical: 'middle', horizontal: 'center' };

  // Tabla
  const headersDash = ['Categoría', 'Minutos', '% del Tiempo', 'Gráfico Visual'];
  ['B', 'C', 'D', 'E'].forEach((col, i) => {
    const cell = dash.getCell(`${col}9`);
    cell.value = headersDash[i];
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  dash.getCell('B10').value = 'Gestión Comercial (Agencias)';
  dash.getCell('C10').value = minAgencias;
  const pctAgencias = totalMins > 0 ? (minAgencias / totalMins) * 100 : 0;
  dash.getCell('D10').value = pctAgencias / 100; // formato %
  dash.getCell('E10').value = pctAgencias; // Para data bar

  dash.getCell('B11').value = 'Actividades Internas (Oficina/Otros)';
  dash.getCell('C11').value = minActividades;
  const pctActividades = totalMins > 0 ? (minActividades / totalMins) * 100 : 0;
  dash.getCell('D11').value = pctActividades / 100; // formato %
  dash.getCell('E11').value = pctActividades; // Para data bar

  dash.getCell('D10').numFmt = '0.0%';
  dash.getCell('D11').numFmt = '0.0%';
  
  // Ocultar número en el gráfico
  dash.getCell('E10').numFmt = ';;;';
  dash.getCell('E11').numFmt = ';;;';

  dash.addConditionalFormatting({
    ref: 'E10:E11',
    rules: [
      {
        type: 'dataBar',
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 100 }],
        gradient: false,
        color: { argb: 'FF5A8DEE' }, // Azul
        showValue: false
      } as any // exceljs types might be slightly incomplete for dataBar
    ]
  });

  // Top 5 Agencias
  dash.mergeCells('B14:E14');
  dash.getCell('B14').value = 'TOP 5 AGENCIAS MÁS VISITADAS (Por Tiempo)';
  dash.getCell('B14').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('B14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('B14').alignment = { vertical: 'middle', horizontal: 'center' };

  ['B', 'C', 'D', 'E'].forEach((col, i) => {
    const cell = dash.getCell(`${col}15`);
    cell.value = ['Agencia', 'Minutos', 'N° Visitas', 'Promedio (min/visita)'][i];
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  // Calcular top 5
  const agenciasMap: Record<string, { mins: number, count: number }> = {};
  rows.filter(r => r.Tipo === 'Visita Agencia').forEach(r => {
    const nombre = r['Nombre Agencia'];
    if (!agenciasMap[nombre]) agenciasMap[nombre] = { mins: 0, count: 0 };
    agenciasMap[nombre].mins += parseDuracion(r.Duracion);
    agenciasMap[nombre].count += 1;
  });

  const topAgencias = Object.entries(agenciasMap)
    .sort((a, b) => b[1].mins - a[1].mins)
    .slice(0, 5);

  let rowIdx = 16;
  topAgencias.forEach(([nombre, data]) => {
    dash.getCell(`B${rowIdx}`).value = nombre;
    dash.getCell(`C${rowIdx}`).value = data.mins;
    dash.getCell(`D${rowIdx}`).value = data.count;
    dash.getCell(`E${rowIdx}`).value = Math.round(data.mins / data.count);
    rowIdx++;
  });


  // =========================================================================
  // HOJA 2: BASE DE DATOS
  // =========================================================================
  const ws = workbook.addWorksheet('Base de Datos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = COLUMN_DEFS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF990000' } } };
  });

  rows.forEach((row, i) => {
    const excelRow = ws.addRow(row);
    excelRow.height = 18;
    const bgColor = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
    
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.font = { size: 10 };

      // Observaciones a la izquierda
      if (colNumber === 7) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      
      // Alertas
      if (colNumber >= 8) {
        const val = String(cell.value || '');
        if (val.startsWith('Sí')) cell.font = { size: 10, bold: true, color: { argb: 'FFCC0000' } };
      }
    });
  });

  const lastCol = String.fromCharCode(64 + COLUMN_DEFS.length);
  ws.autoFilter = `A1:${lastCol}1`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${filename}.xlsx`);
}
