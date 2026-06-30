const ExcelJS = require('exceljs');

async function run() {
  const workbook = new ExcelJS.Workbook();
  const dash = workbook.addWorksheet('Dash');
  dash.getCell('A1').value = 'Hello';
  dash.addConditionalFormatting({
    ref: 'E10:E11',
    rules: [
      {
        type: 'dataBar',
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 100 }],
        color: { argb: 'FF5A8DEE' }, // Azul
        showValue: false
      }
    ]
  });
  
  const buf = await workbook.xlsx.writeBuffer();
  console.log("Buffer size:", buf.length);
}
run().catch(console.error);
