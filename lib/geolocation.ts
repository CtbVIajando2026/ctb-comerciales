export async function obtenerCoordenadasActuales(): Promise<{ lat: number, lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error("Geolocalización no soportada en este navegador."))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Debes permitir el acceso a tu ubicación GPS para continuar."))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error("La información de ubicación no está disponible."))
            break
          case error.TIMEOUT:
            reject(new Error("La solicitud para obtener tu ubicación ha caducado."))
            break
          default:
            reject(new Error("Ha ocurrido un error desconocido al obtener el GPS."))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas
 * usando la fórmula de Haversine.
 */
export function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0
  }
  
  const radlat1 = (Math.PI * lat1) / 180
  const radlat2 = (Math.PI * lat2) / 180
  const theta = lon1 - lon2
  const radtheta = (Math.PI * theta) / 180
  
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  if (dist > 1) {
    dist = 1
  }
  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  dist = dist * 60 * 1.1515 // Distancia en millas
  
  // Convertir a Metros (1 milla = 1609.344 metros)
  return dist * 1609.344
}
