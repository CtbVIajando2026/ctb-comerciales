import ExcelJS from 'exceljs';
import { calcularDistanciaMetros } from './geolocation';
import { calcularHorasMuertas } from './timeTracking';

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
  'Regalos Entregados': string;
  'Gastos ($)': number;
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
  { key: 'Regalos Entregados',        header: 'Regalos Entregados', width: 35 },
  { key: 'Gastos ($)',                header: 'Gastos ($)',         width: 15 },
];

function normalizeText(text: string): string {
  if (!text) return '';
  return text.trim().split(' ').filter(Boolean).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function formatToHHMM(totalMins: number): string {
  if (!totalMins || isNaN(totalMins)) return '0:00';
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

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
    } else if (act.includes('transporte') || act.includes('movilizaci')) {
      categoria = 'Transporte / Movilización';
    } else {
      categoria = 'Actividad Interna (Otras)';
    }
  } else {
    categoria = 'Gestión Comercial (Agencias)';
  }

  // Observaciones
  let observaciones = '';
  // Regalos dedicados
  let regalosEntregados = '';
  let gastosRealizados = 0;

  if (v.es_actividad) {
    observaciones = v.observaciones || '';
    if (v.titulo_actividad === 'Transporte / Movilización' && v.gps_lat && v.gps_lng && v.gps_lat_checkout && v.gps_lng_checkout) {
      const distMetros = calcularDistanciaMetros(v.gps_lat, v.gps_lng, v.gps_lat_checkout, v.gps_lng_checkout);
      const distKm = (distMetros / 1000).toFixed(2);
      observaciones = `Distancia recorrida: ${distKm} km. ` + observaciones;
    }
  } else {
    const temas =
      v.temas && v.temas.length > 0
        ? v.temas.join(', ') + (v.temas_texto_libre ? `: ${v.temas_texto_libre}` : '')
        : v.observaciones || '';
    observaciones = temas;
    
    // Extraer regalos
    if (v.registro_regalos && v.registro_regalos.length > 0) {
      const regalosArr = v.registro_regalos.map((r: any) => {
        if (r.tipo === 'souvenir') return `${r.cantidad}x ${r.descripcion}`;
        
        gastosRealizados += (r.costo ? parseFloat(r.costo) : 0);
        return `1x ${r.descripcion} ($${r.costo})`;
      });
      regalosEntregados = regalosArr.join(', ');
      observaciones += (observaciones ? ' | ' : '') + `🎁 Regalos: ${regalosEntregados}`;
    }
  }
  observaciones = observaciones.replace(/\n|\r/g, ' ').trim();

  const nombre = normalizeText(v.es_actividad
    ? v.titulo_actividad || 'Actividad'
    : v.agenciaNombre || v.agencias?.nombre || 'Agencia');

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

  const alertaInactividad = mins > 60 ? `Sí (${formatToHHMM(mins)})` : 'No';

  const duracionStr = formatToHHMM(mins);

  const comercial = normalizeText(v.usuarios?.nombre || v.usuario?.nombre || v.usuarioNombre || v.comercialNombre || 'Desconocido');
  const rawCiudad = v.agencias?.ciudad || v.usuarios?.zona || v.usuario?.zona || v.ciudad || v.zona || 'Desconocido';
  const ciudad = normalizeText(rawCiudad);

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
    'Regalos Entregados': regalosEntregados,
    'Gastos ($)': gastosRealizados,
  };
}

function parseDuracion(d: string): number {
  if (!d) return 0;
  if (d.includes(':')) {
    const parts = d.replace(/[a-zA-Z]/g, '').split(':');
    return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
  } else {
    return parseInt(d.replace(/[a-zA-Z]/g, '') || '0');
  }
}

export async function exportToExcel(rows: ExcelRow[], filename: string, rawVisitas?: any[]) {
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
  dash.getColumn('C').width = 18;
  dash.getColumn('D').width = 16;
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

  const countInactividad = rows.filter(r => String(r['alerta de tiempo inactivo'] || '').startsWith('Sí')).length;
  const countLejania = rows.filter(r => String(r['alerta de lejania'] || '').startsWith('Sí')).length;
  const totalAgenciasUnicas = Array.from(new Set(rows.filter(r => r.Tipo === 'Visita Agencia').map(r => r['Nombre Agencia']))).length;

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

  dash.getCell('G6').value = 'Alertas Inactividad:';
  dash.getCell('G6').font = { bold: true, color: { argb: 'FFCC0000' } };
  dash.getCell('H6').value = countInactividad;
  dash.getCell('H6').font = { bold: true, color: { argb: 'FFCC0000' }, size: 14 };

  dash.getCell('B7').value = 'Total Agencias:';
  dash.getCell('B7').font = { bold: true, color: { argb: 'FF555555' } };
  dash.getCell('C7').value = totalAgenciasUnicas;
  dash.getCell('C7').font = { bold: true, size: 14 };

  dash.getCell('G7').value = 'Alertas GPS (Dist):';
  dash.getCell('G7').font = { bold: true, color: { argb: 'FFCC0000' } };
  dash.getCell('H7').value = countLejania;
  dash.getCell('H7').font = { bold: true, color: { argb: 'FFCC0000' }, size: 14 };

  // --- BLOQUE 2: DISTRIBUCIÓN DEL TIEMPO ---
  dash.mergeCells('B8:E8');
  dash.getCell('B8').value = 'DISTRIBUCIÓN DEL TIEMPO';
  dash.getCell('B8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('B8').alignment = { vertical: 'middle', horizontal: 'center' };

  ['Categoría', 'Duración (hh:mm)', '% del Tiempo', 'Gráfico Visual'].forEach((h, i) => {
    const col = ['B', 'C', 'D', 'E'][i];
    const cell = dash.getCell(`${col}9`);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
  });

  const categoriasData = [
    { name: 'Gestión Comercial (Agencias)', mins: minAgencias },
    { name: 'Trabajo Administrativo', mins: minAdmin },
    { name: 'Transporte / Movilización', mins: rows.filter(r => r.Categoría === 'Transporte / Movilización').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0) },
    { name: 'Reunión / Capacitación', mins: minReuniones },
    { name: 'Almuerzo / Personal', mins: minAlmuerzo },
    { name: 'Otras Actividades', mins: minOtras }
  ];

  categoriasData.forEach((cat, index) => {
    const row = 10 + index;
    dash.getCell(`B${row}`).value = cat.name;
    dash.getCell(`C${row}`).value = formatToHHMM(cat.mins);
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

  ['Ciudad', 'Duración', 'N° Visitas', 'Promedio'].forEach((h, i) => {
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
    dash.getCell(`C${row}`).value = formatToHHMM(data.mins);
    dash.getCell(`D${row}`).value = data.count;
    dash.getCell(`E${row}`).value = formatToHHMM(Math.round(data.mins / data.count));
  });

  // --- BLOQUE 4: REPORTE DE AGENCIAS (Columna Derecha) ---
  dash.mergeCells('G8:J8');
  dash.getCell('G8').value = 'REPORTE DE AGENCIAS VISITADAS';
  dash.getCell('G8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dash.getCell('G8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  dash.getCell('G8').alignment = { vertical: 'middle', horizontal: 'center' };

  ['Agencia', 'Duración', 'N° Visitas', 'Promedio'].forEach((h, i) => {
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
    dash.getCell(`H${row}`).value = formatToHHMM(data.mins);
    dash.getCell(`I${row}`).value = data.count;
    dash.getCell(`J${row}`).value = formatToHHMM(Math.round(data.mins / data.count));
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
    return formatToHHMM(mins);
  };

  const countAgencias = rows.filter(r => r.Categoría === 'Gestión Comercial (Agencias)').length;
  const countAdmin = rows.filter(r => r.Categoría === 'Trabajo Administrativo').length;
  const countTransporte = rows.filter(r => r.Categoría === 'Transporte / Movilización').length;
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



  addTotalRow(totalRowStart, `TOTAL VISITAS COMERCIALES (${countAgencias} visitas):`, formatMinsStr(minAgencias));
  addTotalRow(totalRowStart + 1, `TOTAL TRABAJOS ADMINISTRATIVOS (${countAdmin} act.):`, formatMinsStr(minAdmin));
  addTotalRow(totalRowStart + 2, `TOTAL REUNIONES / CAPACITACIONES (${countReuniones} act.):`, formatMinsStr(minReuniones));
  addTotalRow(totalRowStart + 3, `TOTAL ALMUERZO / PERSONAL (${countAlmuerzo} act.):`, formatMinsStr(minAlmuerzo));
  addTotalRow(totalRowStart + 4, `TOTAL TRANSPORTE / MOVILIZACIÓN (${countTransporte} act.):`, formatMinsStr(rows.filter(r => r.Categoría === 'Transporte / Movilización').reduce((acc, r) => acc + parseDuracion(r.Duracion), 0)));
  addTotalRow(totalRowStart + 5, `TOTAL ACTIVIDADES EXTRAS (${countOtras} act.):`, formatMinsStr(minOtras));
  addTotalRow(totalRowStart + 6, `GRAN TOTAL DE TIEMPO REGISTRADO (${countAgencias + countActividades + countTransporte} registros):`, formatMinsStr(totalMins), true);
  
  addTotalRow(totalRowStart + 7, `TOTAL ALERTAS DE INACTIVIDAD (VISITAS > 1 HORA):`, `${countInactividad} novedades`, true, 'FFCC0000');
  addTotalRow(totalRowStart + 8, `TOTAL ALERTAS POR DISTANCIA (FUERA DE AGENCIA):`, `${countLejania} novedades`, true, 'FFCC0000');

  // Add sum of expenses
  const totalGastos = rows.reduce((acc, r) => acc + (Number(r['Gastos ($)']) || 0), 0);
  addTotalRow(totalRowStart + 9, `TOTAL INVERSIÓN EN GASTOS Y REGALOS:`, `$${totalGastos.toFixed(2)}`, true, 'FF2E7D32');


  // Convertir a blob nativamente
  // =========================================================================
  // HOJA 3: AUDITORÍA DE JORNADAS (HORAS MUERTAS)
  // =========================================================================
  if (rawVisitas && rawVisitas.length > 0) {
    const auditoriaWs = workbook.addWorksheet('Auditoría de Jornadas', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    auditoriaWs.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Comercial', key: 'comercial', width: 25 },
      { header: 'Resumen de Jornada (Lectura Humana)', key: 'evaluacion', width: 85 },
      { header: '1er Check-in', key: 'primer', width: 15 },
      { header: 'Último Check-out', key: 'ultimo', width: 18 },
      { header: 'Tiempo Trabajado', key: 'activo', width: 18 },
      { header: 'Inactividad (hrs)', key: 'muertas', width: 18 },
      { header: '¿Almuerzo?', key: 'almuerzo', width: 15 },
    ];

    const hRow = auditoriaWs.getRow(1);
    hRow.height = 22;
    hRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Agrupar visitas por Fecha (YYYY-MM-DD) y por Comercial ID (o Nombre)
    const agrupado: Record<string, any[]> = {};
    rawVisitas.forEach(v => {
      if (!v.hora_checkin) return;
      const d = new Date(v.hora_checkin);
      // Usar fecha local
      const fechaISO = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const comercialNombre = (v.usuarios?.nombre || v.usuario?.nombre || v.usuarioNombre || v.comercialNombre || 'Desconocido').trim();
      const key = `${fechaISO}:::${comercialNombre}`;
      if (!agrupado[key]) agrupado[key] = [];
      agrupado[key].push(v);
    });

    let totalJornadas = 0;
    let globalTotalMinsActivos = 0;
    let globalTotalMinsAlmuerzo = 0;
    let globalTotalMinsMuertos = 0;
    let globalAtrasos = 0;
    let globalSalidasPronto = 0;
    let globalAlmuerzosOmitidos = 0;

    Object.entries(agrupado).sort((a, b) => b[0].localeCompare(a[0])).forEach(([key, visitasDelDia]) => {
      // (Rest of the loop remains unchanged except we need to add globalTotalMinsAlmuerzo logic)
      // I will do this in the next replacement chunk where the loop ends.

      const [fechaISO, comercialNombre] = key.split(':::');
      
      const dDate = new Date(`${fechaISO}T12:00:00-05:00`);
      const diaSem = dDate.getDay();
      // Ignorar fines de semana para la auditoría (si no queremos penalizarlos por no trabajar en domingo)
      // O podemos dejarlos, pero el calculo da 0 horas muertas
      
      const minMuertos = calcularHorasMuertas(visitasDelDia, fechaISO, 15);
      
      // Encontrar primer y ultimo
      const completadas = visitasDelDia.filter(v => v.hora_checkin && v.hora_checkout).sort((a, b) => new Date(a.hora_checkin).getTime() - new Date(b.hora_checkin).getTime());
      
      let primer = 'N/A';
      let ultimo = 'N/A';
      let totalMinsActivos = 0;
      let totalMinsAlmuerzo = 0;
      let registroAlmuerzo = 'No';

      if (completadas.length > 0) {
        primer = new Date(completadas[0].hora_checkin).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        ultimo = new Date(completadas[completadas.length - 1].hora_checkout!).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
      }

      visitasDelDia.forEach(v => {
        const act = (v.titulo_actividad || '').toLowerCase();
        const obs = (v.observaciones || '').toLowerCase();
        const isAlmuerzo = act.includes('almuerzo') || act.includes('personal') || obs.includes('almuerzo');

        if (v.hora_checkin && v.hora_checkout) {
          const m = (new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000;
          if (m > 0) {
            if (isAlmuerzo) {
              totalMinsAlmuerzo += m;
            } else {
              totalMinsActivos += m;
            }
          }
        }
        
        if (isAlmuerzo) {
          registroAlmuerzo = '✅ Sí';
        }
      });

      // --- EVALUACIÓN AUTOMÁTICA DIDÁCTICA ---
      let evaluacion = '';
      
      if (primer !== 'N/A' && ultimo !== 'N/A') {
        evaluacion += `• Jornada de ${primer} a ${ultimo}.\n`;
      } else if (primer !== 'N/A') {
        evaluacion += `• Inició jornada a las ${primer} pero no cerró la última visita.\n`;
      } else {
        evaluacion += `• No hay un inicio de jornada claro.\n`;
      }

      evaluacion += `• Registró ${formatToHHMM(totalMinsActivos)} hrs de trabajo en la app. `;

      if (minMuertos > 60) {
        evaluacion += `⚠️ Dejó un rastro de ${formatToHHMM(minMuertos)} hrs MUERTAS (inactividad injustificada entre registros).\n`;
      } else if (minMuertos > 0) {
        evaluacion += `Tuvo ${formatToHHMM(minMuertos)} hrs de inactividad aceptable.\n`;
      } else {
        evaluacion += `No dejó tiempos muertos (Óptimo).\n`;
      }

      if (registroAlmuerzo === '✅ Sí') {
         evaluacion += `• Justificó ${formatToHHMM(totalMinsAlmuerzo)} hrs de almuerzo/personal.\n`;
      }

      let isAtraso = false;
      let isSalidaPronto = false;

      let alertas = [];
      if (primer !== 'N/A') {
        const horaPrimer = parseInt(primer.split(':')[0]);
        const isPM = primer.toLowerCase().includes('p');
        const h24Primer = (horaPrimer === 12 ? (isPM ? 12 : 0) : horaPrimer + (isPM ? 12 : 0));
        const minPrimer = parseInt(primer.split(':')[1]);
        if (h24Primer > 9 || (h24Primer === 9 && minPrimer > 30)) {
          alertas.push(`Inició jornada tarde`);
          isAtraso = true;
        }
      }

      if (ultimo !== 'N/A') {
        const horaUltimo = parseInt(ultimo.split(':')[0]);
        const isPMUltimo = ultimo.toLowerCase().includes('p');
        const h24Ultimo = (horaUltimo === 12 ? (isPMUltimo ? 12 : 0) : horaUltimo + (isPMUltimo ? 12 : 0));
        const minUltimo = parseInt(ultimo.split(':')[1]);
        if (h24Ultimo < 17 || (h24Ultimo === 17 && minUltimo < 30)) {
          alertas.push(`Terminó jornada temprano`);
          isSalidaPronto = true;
        }
      }

      totalJornadas++;
      globalTotalMinsActivos += totalMinsActivos;
      globalTotalMinsAlmuerzo += totalMinsAlmuerzo;
      globalTotalMinsMuertos += minMuertos;
      if (isAtraso) globalAtrasos++;
      if (isSalidaPronto) globalSalidasPronto++;
      if (registroAlmuerzo === 'No') globalAlmuerzosOmitidos++;

      if (registroAlmuerzo === 'No') alertas.push(`No registró Almuerzo`);

      if (alertas.length > 0) {
        evaluacion += `• Observaciones: ${alertas.join(' / ')}.`;
      } else {
        evaluacion += `• Observaciones: Cumplió horario regular (9am a 6pm) y almorzó.`;
      }

      const muertasStr = minMuertos > 60 ? `⚠️ ${formatToHHMM(minMuertos)}` : formatToHHMM(minMuertos);
      const almuerzoStr = registroAlmuerzo === 'No' ? '❌ No' : registroAlmuerzo;

      const row = auditoriaWs.addRow({
        fecha: fechaISO,
        comercial: comercialNombre,
        evaluacion: evaluacion.trim(),
        primer,
        ultimo,
        activo: formatToHHMM(totalMinsActivos),
        muertas: muertasStr,
        almuerzo: almuerzoStr
      });
      
      // Autoajustar altura para el texto multilineal
      row.height = 70;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });

      // Pintar rojo si hay horas muertas considerables (ej > 1h)
      if (minMuertos > 60) {
        row.getCell('muertas').font = { color: { argb: 'FFCC0000' }, bold: true };
      }
      if (registroAlmuerzo === 'No') {
        row.getCell('almuerzo').font = { color: { argb: 'FFCC0000' }, bold: true };
      }
      
      if (alertas.length > 0 || minMuertos > 60) {
        row.getCell('evaluacion').font = { color: { argb: 'FFCC0000' } };
      } else {
        row.getCell('evaluacion').font = { color: { argb: 'FF2E7D32' } };
      }
    });

    // --- AGREGAR SUMATORIAS Y RESUMEN GENERAL AL FINAL ---
    const totalRowStart2 = Object.keys(agrupado).length + 3;

    const addTotalRow2 = (rowNum: number, label: string, value: string, isBold: boolean = false, fontColor?: string) => {
      auditoriaWs.mergeCells(`A${rowNum}:G${rowNum}`);
      const lblCell = auditoriaWs.getCell(`A${rowNum}`);
      lblCell.value = label;
      lblCell.alignment = { horizontal: 'right', vertical: 'middle' };
      lblCell.font = { bold: isBold, size: isBold ? 11 : 10, color: fontColor ? { argb: fontColor } : undefined };
      
      const valCell = auditoriaWs.getCell(`H${rowNum}`);
      valCell.value = value;
      valCell.font = { bold: isBold, size: isBold ? 12 : 11, color: fontColor ? { argb: fontColor } : undefined };
      valCell.alignment = { horizontal: 'left', vertical: 'middle' };

      if (isBold) {
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        lblCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
        valCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      }
    };

    // Calcular horas esperadas (8 horas = 480 minutos laborables por cada jornada)
    const expectedMins = totalJornadas * 480;

    addTotalRow2(totalRowStart2, `TOTAL JORNADAS EVALUADAS:`, `${totalJornadas}`, true);
    addTotalRow2(totalRowStart2 + 1, `HORAS LABORABLES ESPERADAS (8 hrs/día justificadas):`, formatToHHMM(expectedMins), true);
    addTotalRow2(totalRowStart2 + 2, `TIEMPO EFECTIVO DE TRABAJO (Solo Visitas/Gestión):`, formatToHHMM(globalTotalMinsActivos), true, 'FF2E7D32');
    addTotalRow2(totalRowStart2 + 3, `TIEMPO JUSTIFICADO EN ALMUERZO (Registrado):`, formatToHHMM(globalTotalMinsAlmuerzo), true, 'FF2E7D32');
    addTotalRow2(totalRowStart2 + 4, `TOTAL ALMUERZOS OMITIDOS (No registrados):`, `${globalAlmuerzosOmitidos} veces`, true, 'FFCC0000');
    addTotalRow2(totalRowStart2 + 5, `TOTAL HORAS DE INACTIVIDAD (Tiempos muertos INJUSTIFICADOS):`, formatToHHMM(globalTotalMinsMuertos), true, 'FFCC0000');
    addTotalRow2(totalRowStart2 + 6, `TOTAL DE ATRASOS (Check-in tardío):`, `${globalAtrasos} veces`, true, 'FFCC0000');
    addTotalRow2(totalRowStart2 + 7, `TOTAL DE SALIDAS TEMPRANAS (Check-out pronto):`, `${globalSalidasPronto} veces`, true, 'FFCC0000');
  }

  // =========================================================================
  // 4. PESTAÑA: CONTROL DIARIO DE VISITAS (RESUMEN GERENCIAL)
  // =========================================================================
  if (rawVisitas && rawVisitas.length > 0) {

    // ── Agrupamos raw por fecha + comercial ──────────────────────────────────
    const agrupado2: Record<string, any[]> = {};
    rawVisitas.forEach(v => {
      if (!v.hora_checkin) return;
      const fechaISO = new Date(v.hora_checkin).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const comercialNombre = (v.usuarios?.nombre || v.usuario?.nombre || v.usuarioNombre || v.comercialNombre || 'Desconocido').trim();
      const key = `${fechaISO}|||${comercialNombre}`;
      if (!agrupado2[key]) agrupado2[key] = [];
      agrupado2[key].push(v);
    });

    // ── Función de clasificación de categoría (igual que buildExcelRow) ──────
    const clasificar = (v: any): string => {
      if (!v.es_actividad) return 'agencia';
      const act = (v.titulo_actividad || '').toLowerCase();
      const obs = (v.observaciones || '').toLowerCase();
      if (act.includes('administrati') || obs.includes('administrati') || act.includes('oficina')) return 'admin';
      if (act.includes('almuerzo') || act.includes('personal') || obs.includes('almuerzo')) return 'almuerzo';
      if (act.includes('transporte') || act.includes('movilizaci')) return 'transporte';
      if (act.includes('reunion') || act.includes('capacita')) return 'reunion';
      return 'otro';
    };

    // ── Calcular filas de detalle ─────────────────────────────────────────────
    interface ResumenDiaRow {
      fechaISO: string;
      comercial: string;
      visitas: number;
      tVisitasMins: number;
      admin: number;
      tAdminMins: number;
      transporte: number;
      tTransporteMins: number;
      almuerzo: number;
      tAlmuerzoMins: number;
      reunion: number;
      tReunionMins: number;
      otro: number;
      tOtroMins: number;
      totalRegistros: number;
      alertasLejania: number;
      alertasInact: number;
      tInactMins: number;
    }

    const detalles: ResumenDiaRow[] = [];

    Object.entries(agrupado2).sort((a, b) => b[0].localeCompare(a[0])).forEach(([key, visitasDelDia]) => {
      const [fechaISO, comercialNombre] = key.split('|||');
      const r: ResumenDiaRow = {
        fechaISO, comercial: comercialNombre,
        visitas: 0, tVisitasMins: 0,
        admin: 0, tAdminMins: 0,
        transporte: 0, tTransporteMins: 0,
        almuerzo: 0, tAlmuerzoMins: 0,
        reunion: 0, tReunionMins: 0,
        otro: 0, tOtroMins: 0,
        totalRegistros: 0, alertasLejania: 0, alertasInact: 0, tInactMins: 0,
      };

      visitasDelDia.forEach(v => {
        const cat = clasificar(v);
        r.totalRegistros++;
        if (v.alerta_fraude_checkin) r.alertasLejania++;

        if (v.hora_checkin && v.hora_checkout) {
          const mins = Math.max(0, (new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000);
          if (mins > 60) r.alertasInact++;
          switch (cat) {
            case 'agencia':   r.visitas++;    r.tVisitasMins    += mins; break;
            case 'admin':     r.admin++;      r.tAdminMins      += mins; break;
            case 'transporte':r.transporte++; r.tTransporteMins += mins; break;
            case 'almuerzo':  r.almuerzo++;   r.tAlmuerzoMins   += mins; break;
            case 'reunion':   r.reunion++;    r.tReunionMins    += mins; break;
            default:          r.otro++;       r.tOtroMins       += mins; break;
          }
        } else {
          // Registro sin checkout (checkin only)
          switch (cat) {
            case 'agencia':    r.visitas++;    break;
            case 'admin':      r.admin++;      break;
            case 'transporte': r.transporte++; break;
            case 'almuerzo':   r.almuerzo++;   break;
            case 'reunion':    r.reunion++;    break;
            default:           r.otro++;       break;
          }
        }
      });

      r.tInactMins = calcularHorasMuertas(visitasDelDia, fechaISO, 15);
      detalles.push(r);
    });

    // ── Crear la hoja ─────────────────────────────────────────────────────────
    const controlWs = workbook.addWorksheet('Control Diario de Visitas', {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 3 }]
    });

    // Anchos de columna
    const colWidths = [4, 14, 24, 10, 14, 10, 14, 10, 14, 10, 14, 10, 14, 10, 14, 12, 10, 14];
    colWidths.forEach((w, i) => { controlWs.getColumn(i + 1).width = w; });

    // ── FILA 1: Título grande ──────────────────────────────────────────────────
    controlWs.mergeCells('B1:R1');
    const titleCell = controlWs.getCell('B1');
    titleCell.value = '📋  CONTROL DIARIO DE VISITAS COMERCIALES';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    controlWs.getRow(1).height = 36;

    // ── FILA 2: Sub-título / leyenda de grupos ────────────────────────────────
    controlWs.mergeCells('B2:R2');
    const subCell = controlWs.getCell('B2');
    subCell.value = `Resumen diario agrupado por comercial — Generado: ${new Date().toLocaleString('es-EC')}`;
    subCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    controlWs.getRow(2).height = 20;

    // ── FILA 3: Encabezados de columnas ────────────────────────────────────────
    const headers = [
      '', 'Fecha', 'Comercial',
      'Nº Visitas\nAgencias', 'Tiempo\nVisitas',
      'Nº Trabaj.\nAdministrativos', 'Tiempo\nAdministrativo',
      'Nº\nTransporte', 'Tiempo\nTransporte',
      'Nº\nAlmuerzo', 'Tiempo\nAlmuerzo',
      'Nº\nOtros', 'Tiempo\nOtros',
      'TOTAL\nREGISTROS', 'TOTAL\nACTIVIDADES',
      'Alertas\nLejanía', 'Alertas\nInact.', 'T. Inactividad'
    ];

    const headerColors: Record<number, string> = {
      3: 'FF1A237E',  // Fecha
      4: 'FF1A237E',  // Comercial
      5: 'FF1B5E20',  // Visitas agencias
      6: 'FF1B5E20',
      7: 'FF0D47A1',  // Admin
      8: 'FF0D47A1',
      9: 'FF4A148C',  // Transporte
      10:'FF4A148C',
      11:'FFE65100',  // Almuerzo
      12:'FFE65100',
      13:'FF37474F',  // Otros
      14:'FF37474F',
      15:'FF880E4F',  // Totales
      16:'FF880E4F',
      17:'FFCC0000',  // Alertas
      18:'FFCC0000',
      19:'FFCC0000',
    };

    const hRow3 = controlWs.getRow(3);
    hRow3.height = 46;
    headers.forEach((h, i) => {
      const cell = hRow3.getCell(i + 1);
      cell.value = h;
      const argb = headerColors[i + 1] || 'FF0F172A';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
    });

    // ── Totales globales acumulados ─────────────────────────────────────────
    let gVisitas = 0, gTVis = 0, gAdmin = 0, gTAdmin = 0, gTrans = 0, gTTrans = 0;
    let gAlm = 0, gTAlm = 0, gReun = 0, gTReun = 0, gOtro = 0, gTOtro = 0;
    let gTotal = 0, gLejania = 0, gInact = 0, gTInact = 0;

    // ── Rellenar filas de datos ─────────────────────────────────────────────
    detalles.forEach((d, index) => {
      const rowNum = index + 4; // Start after 3 header rows
      const exRow = controlWs.getRow(rowNum);
      exRow.height = 18;

      // Alternar color de fila
      const bgEven = 'FFFAFAFA';
      const bgOdd  = 'FFE8F5E9'; // verde muy suave para visitas
      const bg = index % 2 === 0 ? bgEven : bgOdd;

      const setCellData = (colNum: number, value: string | number, bold = false, fontColor?: string, bgOverride?: string) => {
        const cell = exRow.getCell(colNum);
        cell.value = value;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgOverride || bg } };
        cell.font = { size: 10, bold, color: fontColor ? { argb: fontColor } : undefined };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        cell.border = { right: { style: 'hair', color: { argb: 'FFCCCCCC' } } };
      };

      // Formatear fecha bonita
      const parts = d.fechaISO.split('-');
      const fechaBonita = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d.fechaISO;

      setCellData(1, '');
      setCellData(2, fechaBonita, true);
      setCellData(3, d.comercial, true);

      // Visitas agencias (verde)
      setCellData(4, d.visitas, d.visitas > 0, d.visitas > 0 ? 'FF1B5E20' : 'FF999999', d.visitas > 0 ? 'FFE8F5E9' : undefined);
      setCellData(5, d.tVisitasMins > 0 ? formatToHHMM(d.tVisitasMins) : '-', false, 'FF1B5E20');

      // Trabajo administrativo (azul)
      setCellData(6, d.admin, d.admin > 0, d.admin > 0 ? 'FF0D47A1' : 'FF999999', d.admin > 0 ? 'FFE3F2FD' : undefined);
      setCellData(7, d.tAdminMins > 0 ? formatToHHMM(d.tAdminMins) : '-', false, 'FF0D47A1');

      // Transporte (morado)
      setCellData(8, d.transporte, d.transporte > 0, d.transporte > 0 ? 'FF4A148C' : 'FF999999', d.transporte > 0 ? 'FFF3E5F5' : undefined);
      setCellData(9, d.tTransporteMins > 0 ? formatToHHMM(d.tTransporteMins) : '-', false, 'FF4A148C');

      // Almuerzo (naranja)
      setCellData(10, d.almuerzo > 0 ? '✅ ' + d.almuerzo : 0, d.almuerzo > 0, d.almuerzo > 0 ? 'FFE65100' : 'FFCC0000', d.almuerzo > 0 ? 'FFFFF3E0' : 'FFFFEBEE');
      setCellData(11, d.tAlmuerzoMins > 0 ? formatToHHMM(d.tAlmuerzoMins) : '-', false, 'FFE65100');

      // Otros (gris oscuro)
      setCellData(12, d.otro + d.reunion, (d.otro + d.reunion) > 0, 'FF37474F');
      setCellData(13, (d.tOtroMins + d.tReunionMins) > 0 ? formatToHHMM(d.tOtroMins + d.tReunionMins) : '-', false, 'FF37474F');

      // TOTAL REGISTROS (destacado magenta oscuro)
      const totalActs = d.admin + d.transporte + d.almuerzo + d.reunion + d.otro;
      setCellData(14, d.totalRegistros, true, 'FFFFFFFF', 'FF880E4F');
      setCellData(15, totalActs, true, 'FFFFFFFF', 'FF880E4F');

      // Alertas (rojo)
      setCellData(16, d.alertasLejania > 0 ? `⚠️ ${d.alertasLejania}` : '—', d.alertasLejania > 0, d.alertasLejania > 0 ? 'FFCC0000' : 'FF999999');
      setCellData(17, d.alertasInact > 0 ? `⚠️ ${d.alertasInact}` : '—', d.alertasInact > 0, d.alertasInact > 0 ? 'FFCC0000' : 'FF999999');
      setCellData(18, d.tInactMins > 0 ? formatToHHMM(d.tInactMins) : '—', d.tInactMins > 60, d.tInactMins > 60 ? 'FFCC0000' : 'FF999999');

      // Acumular globales
      gVisitas += d.visitas; gTVis   += d.tVisitasMins;
      gAdmin   += d.admin;   gTAdmin += d.tAdminMins;
      gTrans   += d.transporte; gTTrans += d.tTransporteMins;
      gAlm     += d.almuerzo;   gTAlm   += d.tAlmuerzoMins;
      gReun    += d.reunion;    gTReun  += d.tReunionMins;
      gOtro    += d.otro;       gTOtro  += d.tOtroMins;
      gTotal   += d.totalRegistros;
      gLejania += d.alertasLejania;
      gInact   += d.alertasInact;
      gTInact  += d.tInactMins;
    });

    // ── FILA DE TOTALES GENERALES ─────────────────────────────────────────────
    const totalRowNum = detalles.length + 4;
    const totRow = controlWs.getRow(totalRowNum);
    totRow.height = 26;

    const totBg = 'FF0F172A';
    const totFg = 'FFFFFFFF';
    const totData: (string | number)[] = [
      '', 'TOTALES GENERALES', '',
      gVisitas, formatToHHMM(gTVis),
      gAdmin, formatToHHMM(gTAdmin),
      gTrans, formatToHHMM(gTTrans),
      gAlm, formatToHHMM(gTAlm),
      gReun + gOtro, formatToHHMM(gTReun + gTOtro),
      gTotal, gAdmin + gTrans + gAlm + gReun + gOtro,
      gLejania, gInact, formatToHHMM(gTInact)
    ];
    totData.forEach((v, i) => {
      const cell = totRow.getCell(i + 1);
      cell.value = v;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totBg } };
      cell.font = { bold: true, size: 11, color: { argb: totFg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    controlWs.mergeCells(`B${totalRowNum}:C${totalRowNum}`);

    // ── BLOQUE RESUMEN FINAL (debajo de totales) ─────────────────────────────
    const addCtrlTotal = (rowNum: number, label: string, value: string | number, colorArgb?: string) => {
      controlWs.mergeCells(`B${rowNum}:M${rowNum}`);
      const lbl = controlWs.getCell(`B${rowNum}`);
      lbl.value = label;
      lbl.alignment = { horizontal: 'right', vertical: 'middle' };
      lbl.font = { bold: true, size: 11, color: colorArgb ? { argb: colorArgb } : undefined };
      lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      lbl.border = { top: { style: 'thin' }, bottom: { style: 'double' } };

      controlWs.mergeCells(`N${rowNum}:R${rowNum}`);
      const val = controlWs.getCell(`N${rowNum}`);
      val.value = value;
      val.font = { bold: true, size: 13, color: colorArgb ? { argb: colorArgb } : undefined };
      val.alignment = { horizontal: 'left', vertical: 'middle' };
      val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      val.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      controlWs.getRow(rowNum).height = 22;
    };

    const sumStart = totalRowNum + 2;
    addCtrlTotal(sumStart,      '📊  DÍAS / JORNADAS CON ACTIVIDAD REGISTRADA:',  `${detalles.length} filas`);
    addCtrlTotal(sumStart + 1,  '🏢  TOTAL VISITAS A AGENCIAS (registros):',        `${gVisitas} visitas`,   'FF1B5E20');
    addCtrlTotal(sumStart + 2,  '⏱️  TIEMPO TOTAL EN VISITAS AGENCIAS:',            formatToHHMM(gTVis),     'FF1B5E20');
    addCtrlTotal(sumStart + 3,  '🗂️  TOTAL TRABAJOS ADMINISTRATIVOS (registros):', `${gAdmin} registros`,   'FF0D47A1');
    addCtrlTotal(sumStart + 4,  '⏱️  TIEMPO TOTAL ADMINISTRATIVO:',                 formatToHHMM(gTAdmin),   'FF0D47A1');
    addCtrlTotal(sumStart + 5,  '🚗  TOTAL TRANSPORTES / MOVILIZACIONES:',          `${gTrans} registros`,   'FF4A148C');
    addCtrlTotal(sumStart + 6,  '⏱️  TIEMPO TOTAL EN TRANSPORTE:',                  formatToHHMM(gTTrans),   'FF4A148C');
    addCtrlTotal(sumStart + 7,  '🍽️  TOTAL ALMUERZOS REGISTRADOS:',                `${gAlm} registros`,    'FFE65100');
    addCtrlTotal(sumStart + 8,  '⏱️  TIEMPO TOTAL EN ALMUERZO / PERSONAL:',         formatToHHMM(gTAlm),    'FFE65100');
    addCtrlTotal(sumStart + 9,  '📌  TOTAL OTROS (Reuniones + Extras):',            `${gReun + gOtro} registros`, 'FF37474F');
    addCtrlTotal(sumStart + 10, '📋  GRAN TOTAL DE REGISTROS EN EL PERÍODO:',       `${gTotal} registros`,   'FF0F172A');
    addCtrlTotal(sumStart + 11, '⚠️  ALERTAS DE LEJANÍA (GPS fuera de sitio):',    `${gLejania} alertas`,   'FFCC0000');
    addCtrlTotal(sumStart + 12, '⚠️  ALERTAS DE INACTIVIDAD (>1 hora):',           `${gInact} alertas`,     'FFCC0000');
    addCtrlTotal(sumStart + 13, '🕐  TIEMPO TOTAL DE INACTIVIDAD (tiempos muertos):', formatToHHMM(gTInact), 'FFCC0000');

  }

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
