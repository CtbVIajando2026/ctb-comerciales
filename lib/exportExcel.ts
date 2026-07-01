import ExcelJS from 'exceljs';

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
  { key: 'fecha',                     header: 'Fecha',                     width: 20 },
  { key: 'Comercial',                 header: 'Comercial',                 width: 25 },
  { key: 'Categoría',                 header: 'Categoría',                 width: 30 },
  { key: 'Tipo',                      header: 'Tipo',                      width: 18 },
  { key: 'Nombre Agencia',            header: 'Nombre Agencia',            width: 30 },
  { key: 'Ciudad',                    header: 'Ciudad',                    width: 15 },
  { key: 'Estado',                    header: 'Estado',                    width: 14 },
  { key: 'Duracion',                  header: 'Duracion',                  width: 16 },
  { key: 'Observaciones',             header: 'Observaciones',             width: 50 },
  { key: 'alerta de lejania',         header: 'Alerta Lejanía',         width: 22 },
  { key: 'alerta de tiempo inactivo', header: 'Alerta Inactividad', width: 22 },
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
    } else if (act.includes('almuerzo') || act.includes('personal')) {
      categoria = 'Almuerzo / Personal';
    } else {
      categoria = 'Actividad Interna (Otras)';
    }
  } else {
    categoria = 'Gestión Comercial (Agencias)';
  }

  // Observaciones
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
  // HOJA 1: DASHBOARD ANALÍTICO (CRM VISUAL)
  // =========================================================================
  const dash = workbook.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  // Anchos de columna ampliados para CRM Visual
  dash.getColumn('A').width = 4;
  dash.getColumn('B').width = 30;
  dash.getColumn('C').width = 15;
  dash.getColumn('D').width = 15;
  dash.getColumn('E').width = 35;
  dash.getColumn('F').width = 4;
  dash.getColumn('G').width = 25;
  dash.getColumn('H').width = 15;
  dash.getColumn('I').width = 15;
  dash.getColumn('J').width = 15;

  // Título Principal
  let cleanTitle = filename.replace(/_/g, ' ')
  // Limpiar el timestamp final (ej: 17180000000)
  cleanTitle = cleanTitle.replace(/\s\d{12,14}$/, '')
  
  dash.mergeCells('B2:J3');
  const title = dash.getCell('B2');
  title.value = `DASHBOARD INTELIGENTE (CRM) - ${cleanTitle.toUpperCase()}`;
  title.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } }; // Azul oscuro profundo
  title.alignment = { vertical: 'middle', horizontal: 'center' };

  // Subtítulo Inteligente
  const comercialesNombres = Array.from(new Set(rows.map(r => r.Comercial).filter(c => c && c !== 'Desconocido')));
  const ciudadesNombres = Array.from(new Set(rows.map(r => r.Ciudad).filter(c => c && c !== 'Desconocido')));

  let dynamicSubtitle = "INFORME GENERAL (TODOS LOS COMERCIALES)";
  if (comercialesNombres.length === 1) {
    dynamicSubtitle = `COMERCIAL: ${comercialesNombres[0].toUpperCase()}`;
  } else if (ciudadesNombres.length === 1) {
    dynamicSubtitle = `INFORME GENERAL - CIUDAD: ${ciudadesNombres[0].toUpperCase()}`;
  }

  dash.mergeCells('B4:J4');
  const subtitle = dash.getCell('B4');
  subtitle.value = dynamicSubtitle;
  subtitle.font = { size: 14, bold: true, color: { argb: 'FF1A237E' } };
  subtitle.alignment = { vertical: 'middle', horizontal: 'center' };
  subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } }; // Azul muy clarito
  subtitle.border = { bottom: { style: 'medium', color: { argb: 'FF1A237E' } } };

  // Cálculos de Minutos por Categoría
  const minAgencias = rows.filter(r => r.Categoría === 'Gestión Comercial (Agencias)').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const minAdmin = rows.filter(r => r.Categoría === 'Trabajo Administrativo').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const minReuniones = rows.filter(r => r.Categoría === 'Reunión / Capacitación').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const minAlmuerzo = rows.filter(r => r.Categoría === 'Almuerzo / Personal').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);
  const minOtras = rows.filter(r => r.Categoría === 'Actividad Interna (Otras)').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0);

  const totalMins = minAgencias + minAdmin + minReuniones + minAlmuerzo + minOtras;
  const horasTotales = (totalMins / 60).toFixed(1);
  const productividad = totalMins > 0 ? ((minAgencias / totalMins) * 100).toFixed(1) : '0.0';

  const totalAlertas = rows.filter(r => r['alerta de lejania'].startsWith('Sí') || r['alerta de tiempo inactivo'].startsWith('Sí')).length;

  const getListLabel = (count: number, names: string[]) => {
    if (count === 0) return '0';
    if (count === 1) return names[0];
    const maxShow = 3;
    const shown = names.slice(0, maxShow).join(', ');
    return `${count} (${shown}${count > maxShow ? ', ...' : ''})`;
  };

  // --- BLOQUE 1: RESUMEN EJECUTIVO (KPIs) ---
  dash.getCell('B5').value = 'Total Registros:';
  dash.getCell('B5').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('C5').value = rows.length;
  dash.getCell('C5').font = { bold: true, size: 14 };

  dash.getCell('D5').value = 'Horas Invertidas:';
  dash.getCell('D5').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('E5').value = `${horasTotales} hrs`;
  dash.getCell('E5').font = { bold: true, size: 14 };

  dash.getCell('G5').value = '% Productividad:';
  dash.getCell('G5').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('H5').value = `${productividad} %`;
  dash.getCell('H5').font = { bold: true, size: 14, color: { argb: 'FF2E7D32' } };

  dash.getCell('B6').value = 'Comerciales:';
  dash.getCell('B6').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('C6').value = getListLabel(comercialesNombres.length, comercialesNombres);

  dash.getCell('D6').value = 'Ciudades Abarcadas:';
  dash.getCell('D6').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('E6').value = getListLabel(ciudadesNombres.length, ciudadesNombres);

  dash.getCell('G6').value = 'Alertas Detectadas:';
  dash.getCell('G6').font = { bold: true, color: { argb: 'FFCC0000' } };
  dash.getCell('H6').value = totalAlertas;
  dash.getCell('H6').font = { bold: true, color: { argb: 'FFCC0000' }, size: 14 };

  // --- BLOQUE 2: DISTRIBUCIÓN DEL TIEMPO ---
  dash.mergeCells('B8:E8');
  dash.getCell('B8').value = 'DISTRIBUCIÓN DEL TIEMPO (MINUTOS)';
  dash.getCell('B8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('B8').alignment = { vertical: 'middle', horizontal: 'center' };

  ['Categoría', 'Minutos', '% del Tiempo', 'Gráfico Visual'].forEach((h, i) => {
    const col = ['B', 'C', 'D', 'E'][i];
    const cell = dash.getCell(`${col}9`);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  const categoriasData = [
    { name: 'Gestión Comercial (Agencias)', mins: minAgencias },
    { name: 'Trabajo Administrativo', mins: minAdmin },
    { name: 'Reunión / Capacitación', mins: minReuniones },
    { name: 'Almuerzo / Personal', mins: minAlmuerzo },
    { name: 'Otras Actividades', mins: minOtras }
  ];

  categoriasData.forEach((cat, index) => {
    const row = 10 + index;
    dash.getCell(`B${row}`).value = cat.name;
    dash.getCell(`C${row}`).value = cat.mins;
    const pct = totalMins > 0 ? (cat.mins / totalMins) * 100 : 0;
    dash.getCell(`D${row}`).value = pct / 100;
    dash.getCell(`D${row}`).numFmt = '0.0%';
    dash.getCell(`E${row}`).value = pct;
    dash.getCell(`E${row}`).numFmt = ';;;'; // ocultar el número para dejar solo la barra
  });

  dash.addConditionalFormatting({
    ref: 'E10:E14',
    rules: [
      {
        type: 'dataBar',
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 100 }],
        gradient: false,
        color: { argb: 'FF5A8DEE' }, // Azul
        showValue: false
      } as any
    ]
  });

  // --- BLOQUE 3: RENDIMIENTO POR CIUDAD (Columna Izquierda) ---
  dash.mergeCells('B16:E16');
  dash.getCell('B16').value = 'DISTRIBUCIÓN POR CIUDADES';
  dash.getCell('B16').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('B16').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00838F' } }; // Teal oscuro
  dash.getCell('B16').alignment = { vertical: 'middle', horizontal: 'center' };

  ['Ciudad', 'Minutos', 'N° Visitas', 'Promedio (min)'].forEach((h, i) => {
    const col = ['B', 'C', 'D', 'E'][i];
    const cell = dash.getCell(`${col}17`);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  const ciudadesMap: Record<string, { mins: number, count: number }> = {};
  rows.forEach(r => {
    const c = r.Ciudad;
    if (!ciudadesMap[c]) ciudadesMap[c] = { mins: 0, count: 0 };
    ciudadesMap[c].mins += parseDuracion(r.Duracion);
    ciudadesMap[c].count += 1;
  });

  const topCiudades = Object.entries(ciudadesMap).sort((a, b) => b[1].mins - a[1].mins).slice(0, 5);
  topCiudades.forEach(([cName, data], index) => {
    const row = 18 + index;
    dash.getCell(`B${row}`).value = cName;
    dash.getCell(`C${row}`).value = data.mins;
    dash.getCell(`D${row}`).value = data.count;
    dash.getCell(`E${row}`).value = Math.round(data.mins / data.count);
  });

  // --- BLOQUE 4: REPORTE DE AGENCIAS (Columna Derecha) ---
  dash.mergeCells('G8:J8');
  dash.getCell('G8').value = 'REPORTE DE AGENCIAS VISITADAS';
  dash.getCell('G8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('G8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('G8').alignment = { vertical: 'middle', horizontal: 'center' };

  ['Agencia', 'Minutos', 'N° Visitas', 'Promedio (min)'].forEach((h, i) => {
    const col = ['G', 'H', 'I', 'J'][i];
    const cell = dash.getCell(`${col}9`);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  const agenciasMap: Record<string, { mins: number, count: number }> = {};
  rows.filter(r => r.Tipo === 'Visita Agencia').forEach(r => {
    const nombre = r['Nombre Agencia'];
    if (!agenciasMap[nombre]) agenciasMap[nombre] = { mins: 0, count: 0 };
    agenciasMap[nombre].mins += parseDuracion(r.Duracion);
    agenciasMap[nombre].count += 1;
  });

  const topAgencias = Object.entries(agenciasMap).sort((a, b) => b[1].mins - a[1].mins);
  topAgencias.forEach(([nombre, data], index) => {
    const row = 10 + index;
    dash.getCell(`G${row}`).value = nombre;
    dash.getCell(`H${row}`).value = data.mins;
    dash.getCell(`I${row}`).value = data.count;
    dash.getCell(`J${row}`).value = Math.round(data.mins / data.count);
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

  // Habilitar Filtros Inteligentes (AutoFilter)
  ws.autoFilter = 'A1:K1';

  rows.forEach((row, i) => {
    const excelRow = ws.addRow(row);
    excelRow.height = 18;
    const bgColor = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
    
    // Verificar si la fila completa tiene alguna alerta
    const alertaLej = String(row['alerta de lejania'] || '');
    const alertaInact = String(row['alerta de tiempo inactivo'] || '');
    const hasAlert = alertaLej.startsWith('Sí') || alertaInact.startsWith('Sí');

    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', wrapText: false };
      
      // Si hay alerta, poner toda la letra de la fila en rojo
      if (hasAlert) {
        cell.font = { size: 10, bold: true, color: { argb: 'FFCC0000' } };
      } else {
        cell.font = { size: 10 };
      }

      // Observaciones a la izquierda
      if (colNumber === 9) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
    });
  });

  const lastCol = String.fromCharCode(64 + COLUMN_DEFS.length);
  ws.autoFilter = `A1:${lastCol}1`;

  // === SUMATORIAS INTELIGENTES AL FINAL DE LA BASE DE DATOS ===
  const totalRowStart = rows.length + 3;
  
  const formatMinsStr = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} hrs ${m} mins`;
  };

  const countAgencias = rows.filter(r => r.Categoría === 'Gestión Comercial (Agencias)').length;
  const countAdmin = rows.filter(r => r.Categoría === 'Trabajo Administrativo').length;
  const countReuniones = rows.filter(r => r.Categoría === 'Reunión / Capacitación').length;
  const countAlmuerzo = rows.filter(r => r.Categoría === 'Almuerzo / Personal').length;
  const countOtras = rows.filter(r => r.Categoría === 'Actividad Interna (Otras)').length;
  const countActividades = countAdmin + countReuniones + countAlmuerzo + countOtras;

  const addTotalRow = (rowNum: number, label: string, value: string, isBold: boolean = false, fontColor?: string) => {
    ws.mergeCells(`A${rowNum}:G${rowNum}`);
    const lblCell = ws.getCell(`A${rowNum}`);
    lblCell.value = label;
    lblCell.alignment = { horizontal: 'right', vertical: 'middle' };
    lblCell.font = { bold: isBold, size: isBold ? 11 : 10, color: fontColor ? { argb: fontColor } : undefined };
    
    const valCell = ws.getCell(`H${rowNum}`);
    valCell.value = value;
    valCell.font = { bold: isBold, size: isBold ? 11 : 10, color: fontColor ? { argb: fontColor } : undefined };
    valCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Si es negrita (Totales generales), agregar un fondo o borde
    if (isBold) {
      lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      lblCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      valCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    }
  };

  const countInactividad = rows.filter(r => String(r['alerta de tiempo inactivo'] || '').startsWith('Sí')).length;
  const countLejania = rows.filter(r => String(r['alerta de lejania'] || '').startsWith('Sí')).length;

  addTotalRow(totalRowStart, `TOTAL VISITAS COMERCIALES (${countAgencias} visitas):`, formatMinsStr(minAgencias));
  addTotalRow(totalRowStart + 1, `TOTAL TRABAJOS ADMINISTRATIVOS (${countAdmin} act.):`, formatMinsStr(minAdmin));
  addTotalRow(totalRowStart + 2, `TOTAL REUNIONES / CAPACITACIONES (${countReuniones} act.):`, formatMinsStr(minReuniones));
  addTotalRow(totalRowStart + 3, `TOTAL ALMUERZO / PERSONAL (${countAlmuerzo} act.):`, formatMinsStr(minAlmuerzo));
  addTotalRow(totalRowStart + 4, `TOTAL ACTIVIDADES EXTRAS (${countOtras} act.):`, formatMinsStr(minOtras));
  addTotalRow(totalRowStart + 5, `GRAN TOTAL DE TIEMPO REGISTRADO (${countAgencias + countActividades} registros):`, formatMinsStr(totalMins), true);
  
  addTotalRow(totalRowStart + 6, `TOTAL ALERTAS DE INACTIVIDAD (VISITAS > 1 HORA):`, `${countInactividad} novedades`, true, 'FFCC0000');
  addTotalRow(totalRowStart + 7, `TOTAL ALERTAS POR DISTANCIA (FUERA DE AGENCIA):`, `${countLejania} novedades`, true, 'FFCC0000');


  // Convertir a blob nativamente
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
