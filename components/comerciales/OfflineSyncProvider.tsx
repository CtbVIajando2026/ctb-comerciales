"use client"

import { useEffect } from "react"
import { cerrarVisita } from "@/app/(comerciales)/actions"
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
    try {
      const queueStr = localStorage.getItem("offline_visits_queue")
      if (!queueStr) return

      const queue = JSON.parse(queueStr)
      if (!Array.isArray(queue) || queue.length === 0) return

      toast.info("Conexión restaurada. Sincronizando visitas...")

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
          toast.success(`${syncedCount} visitas sincronizadas. Quedan pendientes.`)
        }
      } else {
        localStorage.removeItem("offline_visits_queue")
        toast.success("¡Todas tus visitas offline fueron sincronizadas correctamente!")
        
        // Refresh para actualizar la UI del dashboard u otras páginas
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (e) {
      console.error("Error parseando la cola offline:", e)
    }
  }

  return null // Es un provider "invisible"
}
