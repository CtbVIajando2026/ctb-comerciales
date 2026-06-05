'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { Building2, Clock, User, ShieldAlert, Timer, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { differenceInMinutes } from 'date-fns'

// ─────────────────────────────────────────
// Haversine distance helper
// ─────────────────────────────────────────
const getDistanceText = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'
}

// ─────────────────────────────────────────
// Live timer component for open visits
// ─────────────────────────────────────────
const LivePopupTimer = ({ horaCheckin }: { horaCheckin: string }) => {
  const [mins, setMins] = useState(differenceInMinutes(new Date(), new Date(horaCheckin)))
  useEffect(() => {
    const interval = setInterval(() => setMins(differenceInMinutes(new Date(), new Date(horaCheckin))), 10000)
    return () => clearInterval(interval)
  }, [horaCheckin])
  return (
    <p className="text-[10px] font-bold flex items-center bg-blue-500/10 px-2 py-1 rounded text-blue-600 mt-1 border border-blue-500/20">
      <Timer className="w-3 h-3 mr-1 animate-pulse" />
      Lleva allí: {mins} min
    </p>
  )
}

// ─────────────────────────────────────────
// Custom marker icon
// ─────────────────────────────────────────
// Custom marker icon (numbered sequence dot)
// ─────────────────────────────────────────
const createIcon = (color: string, esActividad: boolean, label?: number, nombre?: string) => {
  const firstName = nombre ? nombre.split(' ')[0] : ''
  const showNameTag = label === 1 && firstName

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position:relative; width: 28px; height: 28px;">
        ${showNameTag ? `
          <div style="
            position: absolute;
            bottom: 34px;
            left: 50%;
            transform: translateX(-50%);
            background-color: white;
            color: ${color};
            font-size: 10px;
            font-weight: 900;
            padding: 2px 8px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            white-space: nowrap;
            border: 1.5px solid ${color};
            z-index: 20;
          ">${firstName}</div>
          <div style="
            position: absolute;
            bottom: 29px;
            left: 50%;
            transform: translateX(-50%);
            width: 0; 
            height: 0; 
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${color};
            z-index: 20;
          "></div>
        ` : ''}
        <div style="
          position: absolute;
          top: 0; left: 0;
          background-color: ${color};
          width: 28px; height: 28px;
          border-radius: ${esActividad ? '7px' : '50%'};
          border: 2.5px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 900; font-size: 12px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          z-index: 10;
        ">${label ?? ''}</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

// ─────────────────────────────────────────
// Cluster icon — looks like a STACKED GROUP BADGE
// Visually VERY different from individual numbered markers
// ─────────────────────────────────────────
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `
      <div style="position:relative; width:46px; height:36px;">
        <!-- Shadow stack layers -->
        <div style="
          position:absolute; bottom:0; left:50%; transform:translateX(-50%);
          width:38px; height:26px; border-radius:20px;
          background: rgba(99,102,241,0.25);
          border: 2px solid rgba(99,102,241,0.4);
        "></div>
        <div style="
          position:absolute; bottom:4px; left:50%; transform:translateX(-50%);
          width:42px; height:28px; border-radius:20px;
          background: rgba(99,102,241,0.4);
          border: 2px solid rgba(99,102,241,0.5);
        "></div>
        <!-- Main pill badge -->
        <div style="
          position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
          width:46px; height:30px; border-radius:20px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          border: 2.5px solid white;
          box-shadow: 0 4px 12px rgba(99,102,241,0.6);
          display:flex; align-items:center; justify-content:center; gap:3px;
          color:white; font-weight:900; font-size:13px;
          animation: clusterPulse 2.5s ease-in-out infinite;
        ">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="white" opacity="0.85">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          ${count}
        </div>
      </div>
    `,
    className: 'cluster-icon',
    iconSize: L.point(46, 44, true),
    iconAnchor: [23, 44],
  })
}

// ─────────────────────────────────────────

// Auto-fitBounds after map is ready
// ─────────────────────────────────────────
function FitBoundsAll({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length === 0) return

    const apply = () => {
      map.invalidateSize()
      if (positions.length === 1) {
        map.setView(positions[0], 14, { animate: true })
      } else {
        map.fitBounds(L.latLngBounds(positions), {
          padding: [60, 60],
          maxZoom: 14,
          animate: true,
        })
      }
    }

    const t = setTimeout(apply, 250)
    return () => clearTimeout(t)
  }, [positions, map])

  return null
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [-1.8312, -78.1834]
const DEFAULT_ZOOM = 7
const ROUTE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#0ea5e9']

interface MapaGlobalProps { visitas: any[] }

export default function MapaGlobal({ visitas }: MapaGlobalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-full h-full bg-muted animate-pulse rounded-2xl" />

  const visitasConGps = visitas.filter(v => v.gps_lat && v.gps_lng)
  const allPositions: [number, number][] = visitasConGps.map(v => [v.gps_lat, v.gps_lng])

  // Group by comercial to draw individual routes
  const visitasPorComercial = visitasConGps.reduce((acc: any, v: any) => {
    const id = v.comercial_id || v.usuarios?.nombre || 'desconocido'
    if (!acc[id]) acc[id] = []
    acc[id].push(v)
    return acc
  }, {})

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-border relative z-0 shadow-sm">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes clusterPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 4px 22px rgba(99,102,241,0.75); }
        }
        .leaflet-cluster-anim .leaflet-marker-icon,
        .leaflet-cluster-anim .leaflet-marker-shadow {
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
        }
      ` }} />

      <MapContainer
        center={allPositions.length > 0 ? allPositions[0] : DEFAULT_CENTER}
        zoom={allPositions.length > 0 ? 12 : DEFAULT_ZOOM}
        className="w-full h-full"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Auto-fit all GPS points */}
        <FitBoundsAll positions={allPositions} />

        {/* ─── CLUSTERED MARKERS ─── */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          showCoverageOnHover={false}
          animate
        >
          {Object.keys(visitasPorComercial).flatMap((comercialId) => {
            const rutas = visitasPorComercial[comercialId].sort(
              (a: any, b: any) => new Date(a.hora_checkin).getTime() - new Date(b.hora_checkin).getTime()
            )

            return rutas.map((v: any, index: number) => {
              const esFraude = v.alerta_fraude_checkin || v.alerta_fraude_checkout
              const esActiva = v.estado === 'abierta'
              const color = esFraude ? '#ef4444' : (esActiva ? '#3b82f6' : '#10b981')

              return (
                <Marker
                  key={v.id}
                  position={[v.gps_lat, v.gps_lng]}
                  icon={createIcon(color, v.es_actividad, index + 1, v.usuarios?.nombre)}
                >
                  <Popup className="rounded-xl">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center mb-2 border-b border-slate-200 pb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight text-slate-800">{v.usuarios?.nombre || 'Comercial'}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {esActiva ? 'En Ruta' : 'Completado'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold flex items-start text-slate-800">
                        <Building2 className="w-3 h-3 mr-2 mt-0.5 text-primary shrink-0" />
                        <span className="line-clamp-2">{v.es_actividad ? v.titulo_actividad : v.agencias?.nombre}</span>
                      </p>
                      <p className="text-xs flex items-center text-slate-500">
                        <Clock className="w-3 h-3 mr-2" />
                        Llegada: {new Date(v.hora_checkin).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {esActiva ? (
                        <LivePopupTimer horaCheckin={v.hora_checkin} />
                      ) : v.hora_checkout ? (
                        <p className="text-[10px] font-bold flex items-center bg-slate-100 px-2 py-1 rounded text-slate-700 mt-1">
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
                        <Link
                          href={`/admin/agencias/${v.agencia_id}`}
                          className="flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 rounded-xl mt-3 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1.5" />
                          Ver Perfil Completo
                        </Link>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })
        })}
        </MarkerClusterGroup>

        {/* ─── ROUTE LINES & DISTANCE LABELS (outside cluster) ─── */}
        {Object.keys(visitasPorComercial).map((comercialId, i) => {
          const rutas = visitasPorComercial[comercialId].sort(
            (a: any, b: any) => new Date(a.hora_checkin).getTime() - new Date(b.hora_checkin).getTime()
          )
          const positions: [number, number][] = rutas.map((v: any) => [v.gps_lat, v.gps_lng])
          const routeColor = ROUTE_COLORS[i % ROUTE_COLORS.length]

          return (
            <div key={`ruta-${comercialId}`}>
              {rutas.map((v: any, index: number) => {
                if (index === 0) return null
                const prev = rutas[index - 1]
                
                const segmentPositions: [number, number][] = [
                  [prev.gps_lat, prev.gps_lng],
                  [v.gps_lat, v.gps_lng]
                ]

                const distMeters = L.latLng(prev.gps_lat, prev.gps_lng).distanceTo(L.latLng(v.gps_lat, v.gps_lng))
                
                let segmentColor = '#10b981' // Green (< 1km)
                if (distMeters >= 5000) segmentColor = '#ef4444' // Red (>= 5km)
                else if (distMeters >= 1000) segmentColor = '#f59e0b' // Yellow (1-5km)

                const midLat = (v.gps_lat + prev.gps_lat) / 2
                const midLng = (v.gps_lng + prev.gps_lng) / 2
                const distText = getDistanceText(prev.gps_lat, prev.gps_lng, v.gps_lat, v.gps_lng)
                
                const distIcon = L.divIcon({
                  className: 'distance-badge-icon',
                  html: `<div style="
                    background:${segmentColor}; color:white;
                    font-size:9px; font-weight:800;
                    padding:1.5px 5px; border-radius:4px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.3);
                    white-space:nowrap; text-align:center; line-height:1;
                    opacity: 0.9;
                  ">${distText}</div>`,
                  iconSize: [36, 14],
                  iconAnchor: [18, 7],
                })
                
                return [
                  <Polyline key={`poly-${comercialId}-${index}`} positions={segmentPositions} color={segmentColor} weight={3} dashArray="4, 6" opacity={0.85} />,
                  <Marker key={`dist-${comercialId}-${index}`} position={[midLat, midLng]} icon={distIcon} interactive={false} />
                ]
              })}
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}
