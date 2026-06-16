"use client"

import { useEffect } from "react"
import { cerrarVisita, iniciarVisita } from "@/app/(comerciales)/actions"
import { toast } from "sonner"

export function OfflineSyncProvider() {
  useEffect(() => {
    // Escuchar cuando el navegador recupera la conexión
    const handleOnline = async () => {
      await syncOfflineQueue()
    }

    window.addEventListener("online", handleOnline)
    
    // Intentar sincronizar cuando el componente se monta (por si se recargó la página y ya hay internet)
    if (navigator.onLine) {
      syncOfflineQueue()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  const syncOfflineQueue = async () => {
      // 1. SINCRONIZAR CHECK-INS
      try {
        const checkinQueueStr = localStorage.getItem("offline_checkins_queue")
        if (checkinQueueStr) {
          const checkinQueue = JSON.parse(checkinQueueStr)
          if (Array.isArray(checkinQueue) && checkinQueue.length > 0) {
            toast.info("Sincronizando nuevos Check-ins...")
            const remainingCheckins = []
            let syncedCheckins = 0
            
            for (const item of checkinQueue) {
              try {
                const res = await iniciarVisita({
                  agencia_id: item.agencia_id,
                  contacto_id: item.contacto_id,
                  gps_lat: item.gps_lat,
                  gps_lng: item.gps_lng,
                  timer_programado_min: item.timer_programado_min
                })
                if (res.success) {
                  syncedCheckins++
                } else {
                  console.error("Error sincronizando checkin offline:", res.error)
                  remainingCheckins.push(item)
                }
              } catch (e) {
                console.error("Error sincronizando checkin offline", e)
                remainingCheckins.push(item)
              }
            }
            
            if (remainingCheckins.length > 0) {
              localStorage.setItem("offline_checkins_queue", JSON.stringify(remainingCheckins))
            } else {
              localStorage.removeItem("offline_checkins_queue")
            }
            if (syncedCheckins > 0) {
              toast.success(`${syncedCheckins} visitas iniciadas sincronizadas.`)
            }
          }
        }
      } catch(e) {
        console.error("Error parseando checkins:", e)
      }

      // 2. SINCRONIZAR CHECK-OUTS
      const queueStr = localStorage.getItem("offline_visits_queue")
      if (!queueStr) return

      const queue = JSON.parse(queueStr)
      if (!Array.isArray(queue) || queue.length === 0) return

      toast.info("Conexión restaurada. Sincronizando datos de visitas...")

      const remainingQueue = []
      let syncedCount = 0

      for (const item of queue) {
        try {
          await cerrarVisita(item.visitaId, item.data)
          syncedCount++
        } catch (error) {
          console.error("Error al sincronizar visita", item.visitaId, error)
          remainingQueue.push(item) // Mantener en cola si falla por otra razón (ej. auth)
        }
      }

      if (remainingQueue.length > 0) {
        localStorage.setItem("offline_visits_queue", JSON.stringify(remainingQueue))
        if (syncedCount > 0) {
          toast.success(`${syncedCount} visitas cerradas sincronizadas. Quedan pendientes.`)
        }
      } else {
        localStorage.removeItem("offline_visits_queue")
        toast.success("¡Tus datos offline fueron sincronizados correctamente!")
        
        // Refresh para actualizar la UI del dashboard u otras páginas
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
  }

  return null // Es un provider "invisible"
}
