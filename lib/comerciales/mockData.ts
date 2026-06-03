export const mockAgencias = [
  { id: '1', nombre: 'Agencia Sol', direccion: 'Av. Amazonas N24-03', zona: 'Norte', activa: true, temperatura: 'activa' },
  { id: '2', nombre: 'Agencia Luna', direccion: 'Av. 6 de Diciembre', zona: 'Centro', activa: true, temperatura: 'tibia' },
  { id: '3', nombre: 'Agencia Plus', direccion: 'Av. Shyris', zona: 'Norte', activa: true, temperatura: 'fria' },
  { id: '4', nombre: 'Agencia Star', direccion: 'Cumbayá', zona: 'Valle', activa: true, temperatura: 'activa' },
]

export const mockContactos = [
  { id: '1', agencia_id: '1', nombre: 'María González', cargo: 'Gerente', activo: true },
  { id: '2', agencia_id: '1', nombre: 'Juan Pérez', cargo: 'Ventas', activo: true },
  { id: '3', agencia_id: '2', nombre: 'Ana Torres', cargo: 'Dueña', activo: true },
]

export const TEMAS_VISITA = [
  'Presentación de destino nuevo',
  'Seguimiento de cotización pendiente',
  'Entrega de material físico',
  'Capacitación de producto',
  'Visita de cortesía / relación comercial',
  'Captación de agencia nueva',
  'Resolución de problema o queja',
  'Cierre de venta en conjunto con operativo',
  'Presentación de promoción o temporada',
]

export const mockVisitasHoy = [
  {
    id: 'v1',
    agenciaNombre: 'Agencia Sol',
    hora_checkin: '2026-05-20T09:15:00-05:00',
    hora_checkout: '2026-05-20T10:02:00-05:00',
    duracion: '47 min',
    estado: 'completada'
  },
  {
    id: 'v2',
    agenciaNombre: 'Agencia Luna',
    hora_checkin: '2026-05-20T10:45:00-05:00',
    hora_checkout: '2026-05-20T11:30:00-05:00',
    duracion: '45 min',
    estado: 'completada'
  },
  {
    id: 'v3',
    agenciaNombre: 'Agencia Star',
    hora_checkin: '2026-05-20T14:00:00-05:00',
    hora_checkout: null,
    duracion: null,
    estado: 'abierta'
  }
]

export const mockCumplimiento = {
  visitasHoy: 2,
  meta: 5,
  cumplida: false,
  justificado: false,
  porcentaje: 40
}

export const mockRecordatorios = [
  { id: 'r1', texto: 'Llamar a Agencia XYZ — quedaste el martes 21' },
  { id: 'r2', texto: 'Enviar proforma a Agencia ABC' }
]

export const mockVentasVinculadas = {
  cantidad: 4,
  monto: 4648,
  bonoPendiente: 62
}
