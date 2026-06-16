"use client"

import { useEffect, useState, useRef } from "react"
import { getOfflineQueue, removeFromOfflineQueue, OfflineAction } from "@/lib/offlineStore"
import { iniciarVisita, cerrarVisita, iniciarActividad } from "@/app/(comerciales)/actions"
import { crearAgenciaRapida } from "@/app/(comerciales)/actions_agencias"
import { toast } from "sonner"

export function OfflineSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Escuchar cambios en la red
    const handleOnline = () => {
      console.log('Conexión recuperada. Iniciando sincronización...')
      // Un pequeño retraso para asegurar que la conexión es estable
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(syncQueue, 3000)
    }

    // Escuchar el evento personalizado de actualización para sincronizar si ya estamos online
    const handleQueueUpdate = () => {
      if (navigator.onLine && !isSyncing) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = setTimeout(syncQueue, 1000)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offlineQueueUpdated', handleQueueUpdate)

    // Intento inicial al cargar (si quedó algo colgado de una sesión anterior)
    if (navigator.onLine) {
      syncQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offlineQueueUpdated', handleQueueUpdate)
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [])

  const syncQueue = async () => {
    if (isSyncing) return
    
    const queue = getOfflineQueue()
    if (queue.length === 0) return

    setIsSyncing(true)
    const idMap: Record<string, string> = {} // tempId -> realId
    let fallos = 0
    let exito = 0

    // Procesar en orden cronológico
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp)

    for (const action of sortedQueue) {
      try {
        let payload = { ...action.payload }

        // Si es Checkout, revisar si el visitaId es un ID temporal que ya fue sincronizado
        if (action.type === 'CHECKOUT') {
          if (idMap[payload.visitaId]) {
            payload.visitaId = idMap[payload.visitaId]
          }
        }

        switch (action.type) {
          case 'CHECKIN':
            const res = await iniciarVisita(payload)
            if (res.success && res.data) {
              if (action.tempId && res.data.id) {
                idMap[action.tempId] = res.data.id
              }
            } else {
              throw new Error(res.error || "Error al sincronizar visita")
            }
            break
            
          case 'CHECKOUT':
            await cerrarVisita(payload.visitaId, payload.data)
            break
            
          case 'NUEVA_AGENCIA':
            await crearAgenciaRapida(payload)
            break
            
          case 'VISITA_INTERNA':
            await iniciarActividad(payload.titulo, payload.solicitante, payload.gps_lat, payload.gps_lng)
            break
        }

        // Si tuvo éxito, lo quitamos de la cola
        removeFromOfflineQueue(action.id)
        exito++
        
      } catch (error: any) {
        console.error(`Error procesando acción ${action.type}:`, error)
        // Si el error dice "Ya tienes una visita en curso", igual lo quitamos para no atorar la cola?
        // En este diseño básico, dejamos que el error mantenga el item en la cola para reintento
        // excepto si es un error fatal de validación. Por simplicidad, aumentamos contadores.
        fallos++
      }
    }

    setIsSyncing(false)

    if (exito > 0) {
      toast.success('Sincronización Completada', {
        description: `Se han sincronizado ${exito} registros que estaban pendientes.`
      })
    }
    
    if (fallos > 0) {
      toast.error('Sincronización Parcial', {
        description: `Hubo problemas sincronizando ${fallos} registros. Se reintentará más tarde.`
      })
    }
  }

  return null // Es un componente invisible
}
