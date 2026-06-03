"use client"

import dynamic from 'next/dynamic'

const MapaRecorrido = dynamic(() => import('./MapaRecorrido'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] rounded-xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Cargando mapa...</div>
})

export function MapaWrapper({ visitas }: { visitas: any[] }) {
  return <MapaRecorrido visitas={visitas} />
}
