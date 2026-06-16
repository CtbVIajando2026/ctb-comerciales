"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { differenceInMinutes } from 'date-fns'

// Supabase timestamps come without 'Z' suffix - this ensures correct UTC parsing on all browsers/devices
const parseUTC = (dateStr: string): Date => {
  if (!dateStr) return new Date()
  // If already has timezone info (Z, +, -) don't modify
  if (/[Z+]/.test(dateStr) || (dateStr.includes('-') && dateStr.lastIndexOf('-') > 7)) return new Date(dateStr)
  return new Date(dateStr + 'Z')
}

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Haversine distance
const getDistanceText = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180; 
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; 
  
  if (d > 1000) return (d / 1000).toFixed(1) + ' km';
  return Math.round(d) + ' m';
}

const LivePopupTimer = ({ horaCheckin }: { horaCheckin: string }) => {
  const [mins, setMins] = useState(differenceInMinutes(new Date(), parseUTC(horaCheckin)))

  useEffect(() => {
    const interval = setInterval(() => {
      setMins(differenceInMinutes(new Date(), parseUTC(horaCheckin)))
    }, 10000)
    return () => clearInterval(interval)
  }, [horaCheckin])

  return (
    <div className="flex justify-between pt-1 border-t mt-1">
      <span className="text-muted-foreground font-medium">Lleva allí:</span> 
      <span className="font-bold text-blue-600 animate-pulse">{mins} min</span>
    </div>
  )
}

// Custom DivIcon for numbered markers with color based on duration
const createNumberedIcon = (num: number, colorHex: string, esActividad: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${colorHex};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: ${esActividad ? '8px' : '50%'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        border: 2px solid white;
      ">
        ${num}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Component to auto-fit bounds - waits for map to be fully ready
function SetBoundsMap({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (positions.length === 0) return

    // Wait for the map container to fully initialize before fitting bounds
    const applyBounds = () => {
      map.invalidateSize() // Force map to recalculate its container size

      if (positions.length === 1) {
        // Single point: just center on it at a reasonable zoom
        map.setView(positions[0], 15, { animate: true })
      } else {
        // Multiple points: fit all of them with padding so none gets cut off
        const bounds = L.latLngBounds(positions)
        map.fitBounds(bounds, {
          padding: [60, 60],  // Generous padding so no point is cut off
          maxZoom: 15,        // Don't zoom in too much if points are very close
          animate: true,
        })
      }
    }

    // Small delay to ensure the DOM and tile layer are ready
    const timer = setTimeout(applyBounds, 200)
    return () => clearTimeout(timer)
  }, [positions, map])

  return null
}



interface MapaRecorridoProps {
  visitas: any[]
}

export default function MapaRecorrido({ visitas }: MapaRecorridoProps) {
  // Sort by time (ascending) to draw the correct route
  const ordenadas = [...visitas].sort(
    (a, b) => parseUTC(a.hora_checkin).getTime() - parseUTC(b.hora_checkin).getTime()
  )

  // Jitter points that are in the exact same location so they don't overlap
  const applyJitter = (arr: any[]) => {
    const counts = new Map<string, number>();
    return arr.map(v => {
      if (!v.gps_lat || !v.gps_lng) return v;
      const key = `${Number(v.gps_lat).toFixed(4)},${Number(v.gps_lng).toFixed(4)}`;
      const count = counts.get(key) || 0;
      counts.set(key, count + 1);
      
      if (count > 0) {
        const radius = 0.0002 * Math.ceil(count / 8);
        const angle = count * (Math.PI / 4); // 45 degrees apart
        return {
          ...v,
          gps_lat: Number(v.gps_lat) + radius * Math.cos(angle),
          gps_lng: Number(v.gps_lng) + radius * Math.sin(angle)
        }
      }
      return { ...v, gps_lat: Number(v.gps_lat), gps_lng: Number(v.gps_lng) }
    })
  }

  // Filter out those without GPS and apply jitter to prevent overlap
  const conGPS = applyJitter(ordenadas.filter(v => v.gps_lat && v.gps_lng))

  const positions: [number, number][] = conGPS.map(v => [v.gps_lat, v.gps_lng])

  if (conGPS.length === 0) {
    return (
      <div className="bg-card w-full h-[400px] rounded-xl border border-border flex items-center justify-center p-6 text-center">
        <p className="text-muted-foreground font-medium">No hay coordenadas GPS guardadas para estas visitas.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-sm z-0 relative">
      <MapContainer 
        center={positions[0]} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw the line connecting the visits */}
        {positions.length > 1 && (
          <Polyline positions={positions} color="#3b82f6" weight={3} dashArray="5, 10" />
        )}

        {/* Draw markers */}
        {conGPS.map((v, index) => {
          let mins = 0
          if (v.hora_checkin && v.hora_checkout) {
            mins = Math.floor((parseUTC(v.hora_checkout).getTime() - parseUTC(v.hora_checkin).getTime()) / 60000)
          }

          let colorHex = '#3b82f6' // Default blue si está en curso
          let etiquetaTiempo = 'En Curso'
          
          if (v.hora_checkout) {
            etiquetaTiempo = `${mins} min`
            if (mins < 30) colorHex = '#22c55e' // Verde (Normal: < 30)
            else if (mins <= 45) colorHex = '#eab308' // Amarillo (Larga: 30-45)
            else colorHex = '#ef4444' // Rojo (Especial: > 45)
          }

          return (
            <Marker 
              key={v.id} 
              position={[v.gps_lat, v.gps_lng]} 
              icon={createNumberedIcon(index + 1, colorHex, v.es_actividad)}
            >
              <Popup>
                <div className="font-bold text-sm mb-2 border-b pb-1">
                  {v.es_actividad ? v.titulo_actividad : v.agenciaNombre}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between w-40">
                    <span className="text-muted-foreground">Llegada:</span> 
                     <span className="font-medium">{parseUTC(v.hora_checkin).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {v.hora_checkout && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salida:</span> 
                       <span className="font-medium">{parseUTC(v.hora_checkout).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {v.hora_checkout ? (
                    <div className="flex justify-between pt-1 border-t mt-1">
                      <span className="text-muted-foreground">Duración:</span> 
                      <span className="font-bold" style={{ color: colorHex }}>{etiquetaTiempo}</span>
                    </div>
                  ) : (
                    <LivePopupTimer horaCheckin={v.hora_checkin} />
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Draw distances between points */}
        {conGPS.map((v, index) => {
          if (index === 0) return null;
          const prev = conGPS[index - 1];
          const midLat = (v.gps_lat + prev.gps_lat) / 2;
          const midLng = (v.gps_lng + prev.gps_lng) / 2;
          const distText = getDistanceText(prev.gps_lat, prev.gps_lng, v.gps_lat, v.gps_lng);
          
          const distanceIcon = L.divIcon({
            className: 'distance-badge-icon',
            html: `<div style="
              background-color: white;
              color: #3b82f6;
              font-size: 9px;
              font-weight: 900;
              padding: 2px 6px;
              border-radius: 12px;
              border: 1px solid #3b82f6;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
              white-space: nowrap;
              text-align: center;
              line-height: 1;
            ">${distText}</div>`,
            iconSize: [40, 16],
            iconAnchor: [20, 8],
          });

          return (
            <Marker key={`dist-${index}`} position={[midLat, midLng]} icon={distanceIcon} interactive={false} />
          );
        })}

        {/* Auto fit bounds */}
        <SetBoundsMap positions={positions} />
      </MapContainer>
    </div>
  )
}
