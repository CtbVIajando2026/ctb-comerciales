import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, MapPin, Phone, ShieldAlert, Target, User, Edit2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminComercialesPage() {
  const supabase = await createClient()

  // Eliminamos metas_comerciales temporalmente del join por si está causando el error vacío
  const { data: comerciales, error } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error cargando comerciales:", error)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Equipo</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Administra tus usuarios.</p>
        </div>
        <Link 
          href="/admin/comerciales/nuevo"
          className="bg-primary hover:bg-primary/90 text-white rounded-full md:rounded-xl shadow-lg flex items-center justify-center px-4 py-3 md:py-2 text-sm font-bold transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Crear Usuario</span>
        </Link>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!comerciales || comerciales.length === 0 ? (
          <div className="col-span-full bg-card p-12 text-center rounded-2xl border border-border">
            <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Aún no hay usuarios</h3>
            <p className="text-muted-foreground mt-1">Crea el primer usuario para empezar.</p>
            {error && <p className="text-destructive mt-4 text-xs">{error.message}</p>}
          </div>
        ) : (
          comerciales.map((user) => {
            const isAdmin = user.rol === 'admin'
            
            return (
              <div key={user.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Banda de color superior según rol */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isAdmin ? 'bg-primary' : 'bg-secondary'}`} />
                
                <div className="flex justify-between items-start mt-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary-foreground'}`}>
                      {user.nombre_completo?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground line-clamp-1">{user.nombre_completo}</h3>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                        {user.rol}
                      </span>
                    </div>
                  </div>
                  
                  {user.activo ? (
                    <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)] mt-2" title="Activo" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-destructive mt-2" title="Inactivo" />
                  )}
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-3 shrink-0" />
                    <span className="truncate">{user.telefono || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-3 shrink-0" />
                    <span className="truncate font-medium">{user.ciudad_zona || 'Global'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex gap-2">
                  <Link 
                    href={`/admin/comerciales/${user.id}/editar`}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                    Editar
                  </Link>
                  {!isAdmin && (
                    <Link 
                      href={`/admin/comerciales/${user.id}/metricas`}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <Target className="w-3.5 h-3.5 mr-2" />
                      Métricas
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
