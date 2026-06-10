'use client'

import { useEffect } from 'react'
import { actualizarUbicacionTiempoReal } from '@/app/(comerciales)/actions'

export function LiveLocationTracker() {
  useEffect(() => {
    const enviarUbicacion = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords
        await actualizarUbicacionTiempoReal(latitude, longitude)
      } catch (err) {
        console.error("Error enviando ubicación en tiempo real:", err)
      }
    }

    const solicitarUbicacion = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          enviarUbicacion,
          (err) => {
            console.error("Error al obtener geolocalización para tracking:", err)
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      }
    }

    // Ping inicial inmediato
    solicitarUbicacion()

    // Ping cada 15 minutos (15 * 60 * 1000 ms)
    const interval = setInterval(solicitarUbicacion, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
