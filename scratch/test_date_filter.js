const fechaEspecifica = "2026-06-09";
const created_at = "2026-06-09T15:00:31.808084+00:00";

const fecha = new Date(created_at);
const targetDate = new Date(`${fechaEspecifica}T00:00:00`);

console.log("fecha (local):", fecha.toString());
console.log("targetDate (local):", targetDate.toString());

const match1 = 
  fecha.getDate() === targetDate.getDate() &&
  fecha.getMonth() === targetDate.getMonth() &&
  fecha.getFullYear() === targetDate.getFullYear();

console.log("Method 1 (current code) match:", match1);

// Let's check with string formatting
const year = fecha.getFullYear();
const month = String(fecha.getMonth() + 1).padStart(2, '0');
const day = String(fecha.getDate()).padStart(2, '0');
const localDateStr = `${year}-${month}-${day}`;

console.log("localDateStr:", localDateStr);
const match2 = localDateStr === fechaEspecifica;
console.log("Method 2 (robust string) match:", match2);
