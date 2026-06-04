import { obtenerDetalleAgencia } from "@/app/(comerciales)/actions_agencias"
import { AgenciaDetalleClient } from "@/components/comerciales/AgenciaDetalleClient"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminAgenciaDetallePage({ params }: { params: { id: string } }) {
  const data = await obtenerDetalleAgencia(params.id)
  
  if (!data) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto h-full overflow-y-auto">
      <AgenciaDetalleClient dataInicial={data} backUrl="/admin/agencias" />
    </div>
  )
}
