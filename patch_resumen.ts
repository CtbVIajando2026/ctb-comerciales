const fs = require('fs');

let content = fs.readFileSync('lib/exportExcel.ts', 'utf8');

const target = `  // Escribir el buffer`;

const addition = `
    // =========================================================================
    // 4. NUEVA PESTAÑA: RESUMEN DIARIO
    // =========================================================================
    const resumenWs = workbook.addWorksheet('Resumen Diario', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    resumenWs.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Comercial', key: 'comercial', width: 25 },
      { header: 'N° Visitas', key: 'num_visitas', width: 15 },
      { header: 'T. Visitas (hrs)', key: 't_visitas', width: 18 },
      { header: 'N° Actividades', key: 'num_actividades', width: 18 },
      { header: 'T. Actividades (hrs)', key: 't_actividades', width: 20 },
      { header: 'Almuerzo (Sí/No)', key: 'almuerzo', width: 18 },
      { header: 'Alertas Inact.', key: 'alertas_inact', width: 18 },
      { header: 'T. Inactividad (hrs)', key: 't_inactividad', width: 20 },
      { header: 'Alertas F. de Sitio', key: 'alertas_sitio', width: 20 },
    ];

    const hRowRes = resumenWs.getRow(1);
    hRowRes.height = 22;
    hRowRes.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let globalNumVisitas = 0;
    let globalTVisitas = 0;
    let globalNumAct = 0;
    let globalTAct = 0;
    let globalAlertasInact = 0;
    let globalTInact = 0;
    let globalAlertasSitio = 0;
    let globalAlmuerzosOk = 0;

    Object.entries(agrupado).sort((a, b) => b[0].localeCompare(a[0])).forEach(([key, visitasDelDia]) => {
      const [fechaISO, comercialNombre] = key.split(':::');
      
      let numVisitas = 0;
      let tVisitas = 0;
      let numActividades = 0;
      let tActividades = 0;
      let almuerzo = 'No';
      let alertasSitio = 0;

      visitasDelDia.forEach(v => {
        const isAct = !!v.es_actividad;
        
        const actLower = (v.titulo_actividad || '').toLowerCase();
        const obsLower = (v.observaciones || '').toLowerCase();
        const isAlmuerzo = actLower.includes('almuerzo') || actLower.includes('personal') || obsLower.includes('almuerzo');
        if (isAlmuerzo) almuerzo = 'Sí';

        if (v.check_lejano) alertasSitio++;

        if (v.hora_checkin && v.hora_checkout) {
          const m = (new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000;
          if (m > 0) {
            if (isAct) {
              if (!isAlmuerzo) {
                 numActividades++;
                 tActividades += m;
              }
            } else {
              numVisitas++;
              tVisitas += m;
            }
          }
        }
      });

      const minMuertos = calcularHorasMuertas(visitasDelDia, fechaISO, 15);
      
      let alertasInact = 0;
      const completadas = visitasDelDia.filter(v => v.hora_checkin && v.hora_checkout).map(v => ({in: new Date(v.hora_checkin).getTime(), out: new Date(v.hora_checkout).getTime()})).sort((a, b) => a.in - b.in);
      
      let cursor = new Date(\`\${fechaISO}T09:00:00-05:00\`).getTime();
      let finAnalisis = new Date(\`\${fechaISO}T18:00:00-05:00\`).getTime();
      const ahora = new Date().getTime();
      if (fechaISO === new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) && ahora < finAnalisis) {
        finAnalisis = ahora;
      }
      
      for (const v of completadas) {
        if (v.in > cursor) {
          const gapEnd = Math.min(v.in, finAnalisis);
          if (gapEnd > cursor) {
             const m = (gapEnd - cursor)/60000;
             if (m >= 15) alertasInact++;
          }
        }
        cursor = Math.max(cursor, v.out);
      }
      if (cursor < finAnalisis && (finAnalisis - cursor)/60000 >= 15) {
        alertasInact++;
      }

      resumenWs.addRow({
        fecha: fechaISO,
        comercial: comercialNombre,
        num_visitas: numVisitas,
        t_visitas: formatToHHMM(tVisitas),
        num_actividades: numActividades,
        t_actividades: formatToHHMM(tActividades),
        almuerzo: almuerzo === 'Sí' ? '✅ Sí' : '❌ No',
        alertas_inact: alertasInact,
        t_inactividad: formatToHHMM(minMuertos),
        alertas_sitio: alertasSitio
      });

      globalNumVisitas += numVisitas;
      globalTVisitas += tVisitas;
      globalNumAct += numActividades;
      globalTAct += tActividades;
      globalAlertasInact += alertasInact;
      globalTInact += minMuertos;
      globalAlertasSitio += alertasSitio;
      if (almuerzo === 'Sí') globalAlmuerzosOk++;
    });

    const addResumenTotal = (rowNum: number, label: string, value: string, fontColor?: string) => {
      resumenWs.mergeCells(\`A\${rowNum}:H\${rowNum}\`);
      const lblCell = resumenWs.getCell(\`A\${rowNum}\`);
      lblCell.value = label;
      lblCell.alignment = { horizontal: 'right', vertical: 'middle' };
      lblCell.font = { bold: true, size: 11, color: fontColor ? { argb: fontColor } : undefined };
      lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      lblCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      
      const valCell = resumenWs.getCell(\`I\${rowNum}\`);
      valCell.value = value;
      valCell.font = { bold: true, size: 12, color: fontColor ? { argb: fontColor } : undefined };
      valCell.alignment = { horizontal: 'left', vertical: 'middle' };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      valCell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      
      resumenWs.mergeCells(\`I\${rowNum}:J\${rowNum}\`);
    };

    const resTot = Object.keys(agrupado).length + 3;
    addResumenTotal(resTot, 'TOTAL VISITAS:', \`\${globalNumVisitas} visitas\`);
    addResumenTotal(resTot + 1, 'TOTAL TIEMPO EN VISITAS:', formatToHHMM(globalTVisitas), 'FF2E7D32');
    addResumenTotal(resTot + 2, 'TOTAL ACTIVIDADES VARIAS:', \`\${globalNumAct} actividades\`);
    addResumenTotal(resTot + 3, 'TOTAL TIEMPO EN ACTIVIDADES VARIAS:', formatToHHMM(globalTAct), 'FF2E7D32');
    addResumenTotal(resTot + 4, 'ALMUERZOS REGISTRADOS:', \`\${globalAlmuerzosOk} días\`);
    addResumenTotal(resTot + 5, 'TOTAL ALERTAS INACTIVIDAD:', \`\${globalAlertasInact} alertas\`, 'FFCC0000');
    addResumenTotal(resTot + 6, 'TOTAL HORAS INACTIVIDAD:', formatToHHMM(globalTInact), 'FFCC0000');
    addResumenTotal(resTot + 7, 'TOTAL ALERTAS FUERA DE SITIO (Check Lejano):', \`\${globalAlertasSitio} alertas\`, 'FFCC0000');
`;

content = content.replace(target, addition + "\n  " + target);

fs.writeFileSync('lib/exportExcel.ts', content);
