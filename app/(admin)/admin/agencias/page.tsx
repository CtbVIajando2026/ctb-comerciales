import { createClient } from '@/lib/supabase/server'
import { Building2, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AgenciasPage() {
  const supabase = await createClient()

  const { data: agencias } = await supabase
    .from('agencias')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-primary" />
            Agencias Globales
          </h1>
          <p className="text-muted-foreground mt-1">
            Directorio maestro de agencias registradas en el sistema.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {(!agencias || agencias.length === 0) ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay agencias registradas en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase font-black border-b border-border">
                <tr>
                  <th className="px-4 py-4">Agencia</th>
                  <th className="px-4 py-4">Ciudad / Zona</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agencias.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{a.nombre}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.direccion || 'Sin dirección'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-muted-foreground">
                      {a.ciudad || 'N/A'} - {a.zona || 'Global'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${a.activa ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {a.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
