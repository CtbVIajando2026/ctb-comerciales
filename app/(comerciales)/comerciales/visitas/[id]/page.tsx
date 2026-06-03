import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VisitaDetalleClient } from "./VisitaDetalleClient"
import { VisitaResumenClient } from "@/components/comerciales/VisitaResumenClient"
import { obtenerCatalogoRegalos } from "@/app/(comerciales)/actions"

export default async function VisitaActivaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetching the current visit
  const { data: visita } = await supabase
    .from('visitas')
    .select(`
      *,
      agencia:agencias(nombre)
    `)
    .eq('id', id)
    .eq('comercial_id', user.id)
    .single()

  if (!visita) {
    return <div className="p-4">Visita no encontrada</div>
  }

  if (visita.estado === 'completada') {
    return <VisitaResumenClient visita={visita} />
  }

  const catalogoRegalos = await obtenerCatalogoRegalos()

  return <VisitaDetalleClient visita={visita} catalogoRegalos={catalogoRegalos} />
}
