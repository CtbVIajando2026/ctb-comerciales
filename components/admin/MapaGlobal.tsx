'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Building2, Clock, User, ShieldAlert, Timer, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { differenceInMinutes } from 'date-fns'

// Iconos personalizados
const LivePopupTimer = ({ horaCheckin }: { horaCheckin: string }) => {
  const [mins, setMins] = useState(differenceInMinutes(new Date(), new Date(horaCheckin)))

  useEffect(() => {
    const interval = setInterval(() => {
      setMins(differenceInMinutes(new Date(), new Date(horaCheckin)))
    }, 10000)
    return () => clearInterval(interval)
  }, [horaCheckin])

  return (
    <p className="text-[10px] font-bold flex items-center bg-blue-500/10 px-2 py-1 rounded text-blue-600 mt-1 border border-blue-500/20">
      <Timer className="w-3 h-3 mr-1 animate-pulse" />
      Lleva allí: {mins} min
    </p>
  )
}

const createIcon = (color: string, esActividad: boolean, label?: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: ${esActividad ? '6px' : '50%'};
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        font-size: 11px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        position: relative;
        z-index: 10;
        animation: pulse 2s infinite;
      ">${label ? label : ''}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

// Centro por defecto: Ecuador
const DEFAULT_CENTER: [number, number] = [-1.8312, -78.1834]
const DEFAULT_ZOOM = 7

interface MapaGlobalProps {
  visitas: any[]
}

export default function MapaGlobal({ visitas }: MapaGlobalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-full h-full bg-muted animate-pulse rounded-2xl" />

  // Filtrar solo las que tienen GPS válido
  const visitasConGps = visitas.filter(v => v.gps_lat && v.gps_lng)

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-border relative z-0 shadow-sm">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(0,0,0,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
      `}} />
      <MapContainer 
        center={visitasConGps.length > 0 ? [visitasConGps[0].gps_lat, visitasConGps[0].gps_lng] : DEFAULT_CENTER} 
        zoom={visitasConGps.length > 0 ? 12 : DEFAULT_ZOOM} 
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {visitasConGps.map((v, index) => {
          const esFraude = v.alerta_fraude_checkin || v.alerta_fraude_checkout
          const esActiva = v.estado === 'abierta'
          
          let color = esFraude ? '#ef4444' : (esActiva ? '#3b82f6' : '#10b981')
          let icon = createIcon(color, v.es_actividad, index + 1)

          return (
            <Marker 
              key={v.id} 
              position={[v.gps_lat, v.gps_lng]} 
              icon={icon}
            >
              <Popup className="rounded-xl">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center mb-2 border-b border-border pb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight text-foreground">
                        {v.usuarios?.nombre || 'Comercial'}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {esActiva ? 'En Ruta' : 'Completado'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold flex items-start text-foreground">
                      <Building2 className="w-3 h-3 mr-2 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-2">{v.es_actividad ? v.titulo_actividad : v.agencias?.nombre}</span>
                    </p>
                    <p className="text-xs flex items-center text-muted-foreground">
                      <Clock className="w-3 h-3 mr-2" />
                      Llegada: {new Date(v.hora_checkin).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {esActiva ? (
                      <LivePopupTimer horaCheckin={v.hora_checkin} />
                    ) : v.hora_checkout ? (
                      <p className="text-[10px] font-bold flex items-center bg-muted/50 px-2 py-1 rounded text-foreground mt-1">
                        <Timer className="w-3 h-3 mr-1 text-primary" />
                        Tiempo: {differenceInMinutes(new Date(v.hora_checkout), new Date(v.hora_checkin))} min
                      </p>
                    ) : null}
                    {esFraude && (
                      <p className="text-[10px] font-bold text-destructive flex items-center bg-destructive/10 px-2 py-1 rounded mt-2">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Alerta de Lejanía Detectada
                      </p>
                    )}
                    
                    {!v.es_actividad && v.agencia_id && (
                      <Link href={`/admin/agencias/${v.agencia_id}`} className="flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 rounded-xl mt-3 transition-colors">
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        Ver Perfil Completo
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
