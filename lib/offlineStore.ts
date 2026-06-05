import { v4 as uuidv4 } from 'uuid'

export type OfflineActionType = 'CHECKIN' | 'CHECKOUT' | 'NUEVA_AGENCIA' | 'VISITA_INTERNA'

export interface OfflineAction {
  id: string // ID interno de la cola
  type: OfflineActionType
  payload: any
  timestamp: number
  tempId?: string // Usado para asociar un check-in offline con su check-out offline
}

const STORAGE_KEY = 'ctb_offline_queue'

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading offline queue', error)
    return []
  }
}

export function saveOfflineQueue(queue: OfflineAction[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    // Despachar un evento para que la UI (indicador) pueda reaccionar al cambio
    window.dispatchEvent(new Event('offlineQueueUpdated'))
  } catch (error) {
    console.error('Error saving offline queue', error)
  }
}

export function addToOfflineQueue(type: OfflineActionType, payload: any, tempId?: string) {
  const queue = getOfflineQueue()
  const newAction: OfflineAction = {
    id: uuidv4(),
    type,
    payload,
    timestamp: Date.now(),
    tempId
  }
  queue.push(newAction)
  saveOfflineQueue(queue)
  return newAction
}

export function removeFromOfflineQueue(id: string) {
  const queue = getOfflineQueue()
  const filtered = queue.filter(item => item.id !== id)
  saveOfflineQueue(filtered)
}

export function updatePayloadInQueue(id: string, newPayload: any) {
  const queue = getOfflineQueue()
  const updated = queue.map(item => item.id === id ? { ...item, payload: newPayload } : item)
  saveOfflineQueue(updated)
}

export function isOnline(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return true
}
