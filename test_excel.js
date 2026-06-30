const ExcelJS = require('exceljs');
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Test');
ws.columns = [
  { header: 'A', key: 'a' },
  { header: 'B', key: 'b' }
];
const rowObj = { a: 'Hello', b: 'World' };
const excelRow = ws.addRow(rowObj);
const hasAlert = true;
excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
  if (hasAlert) {
    cell.font = { size: 10, bold: true, color: { argb: 'FFCC0000' } };
  } else {
    cell.font = { size: 10 };
  }
});
wb.xlsx.writeFile('test.xlsx').then(() => console.log('Done'));
