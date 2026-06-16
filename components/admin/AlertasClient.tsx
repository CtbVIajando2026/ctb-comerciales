'use client'

import { useState, useMemo } from 'react'
import { ShieldAlert, Clock, User, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Input } from '@/components/ui/input'

const ITEMS_PER_PAGE = 10

export function AlertasClient({ alertasIniciales }: { alertasIniciales: any[] }) {
  const [search, setSearch] = useState('')
  const [tipoAlerta, setTipoAlerta] = useState<string>('todas')
  const [page, setPage] = useState(1)

  const alertasFiltradas = useMemo(() => {
    const searchLower = search.toLowerCase()
    return alertasIniciales.filter(v => {
      const comercial = v.usuarios?.nombre?.toLowerCase() || ''
      const zona = v.usuarios?.zona?.toLowerCase() || ''
      const agencia = v.agencias?.nombre?.toLowerCase() || ''
      const fechaStr = format(parseISO(v.created_at), 'dd MMM yyyy', { locale: es }).toLowerCase()
      
      const matchSearch = !search ||
             comercial.includes(searchLower) ||
             zona.includes(searchLower) ||
             agencia.includes(searchLower) ||
             fechaStr.includes(searchLower)

      const matchTipo = 
        tipoAlerta === 'todas' ? true :
        tipoAlerta === 'checkin' ? v.alerta_fraude_checkin === true :
        tipoAlerta === 'checkout' ? v.alerta_fraude_checkout === true : true

      return matchSearch && matchTipo
    })
  }, [alertasIniciales, search, tipoAlerta])

  const totalPages = Math.max(1, Math.ceil(alertasFiltradas.length / ITEMS_PER_PAGE))
  const paginatedAlertas = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return alertasFiltradas.slice(start, start + ITEMS_PER_PAGE)
  }, [alertasFiltradas, page])

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider flex items-center">
          <ShieldAlert className="w-3 h-3 mr-2 text-destructive" />
          Registro de Alertas ({alertasFiltradas.length})
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={tipoAlerta} 
            onChange={(e) => { setTipoAlerta(e.target.value); setPage(1); }}
            className="h-8 text-xs rounded-lg border border-border bg-background px-2"
          >
            <option value="todas">Todos los desvíos</option>
            <option value="checkin">Check-In Lejano</option>
            <option value="checkout">Check-Out Lejano</option>
          </select>
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar por comercial, agencia, fecha..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              className="pl-8 h-8 text-xs rounded-lg w-full bg-background" 
            />
          </div>
        </div>
      </div>

      {(!alertasFiltradas || alertasFiltradas.length === 0) ? (
        <div className="p-12 text-center flex flex-col items-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <p className="font-bold text-lg text-foreground">Todo en orden</p>
          <p className="text-sm">No se encontraron desvíos de GPS con los criterios actuales.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase font-black bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Comercial</th>
                <th className="px-4 py-3">Agencia</th>
                <th className="px-4 py-3">Tipo de Alerta</th>
                <th className="px-4 py-3">Desvío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedAlertas.map((v: any) => (
                <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground text-xs">
                      {format(parseISO(v.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                      <Clock className="w-3 h-3 mr-1" />
                      {v.hora_checkin ? format(parseISO(v.hora_checkin), 'HH:mm') : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold flex items-center text-xs">
                      <User className="w-3 h-3 mr-1.5 text-muted-foreground" />
                      {v.usuarios?.nombre}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">
                      Zona: {v.usuarios?.zona || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground text-xs">
                      {v.agencias?.nombre}
                    </div>
                    <div className="text-[9px] text-muted-foreground line-clamp-1 max-w-[200px]">
                      {v.agencias?.direccion || 'Sin dirección registrada'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {v.alerta_fraude_checkin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive w-fit uppercase tracking-wider">
                          Check-IN Lejano
                        </span>
                      )}
                      {v.alerta_fraude_checkout && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 w-fit uppercase tracking-wider">
                          Check-OUT Lejano
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold text-muted-foreground">
                      {v.alerta_fraude_checkin && v.distancia_checkin_metros ? (
                        <div>IN: ~{Math.round(v.distancia_checkin_metros)}m</div>
                      ) : null}
                      {v.alerta_fraude_checkout && v.distancia_checkout_metros ? (
                        <div>OUT: ~{Math.round(v.distancia_checkout_metros)}m</div>
                      ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Pág {page} de {totalPages}
          </span>
          <div className="flex space-x-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
