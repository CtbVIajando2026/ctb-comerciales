import { obtenerDetalleAgencia } from "@/app/(comerciales)/actions_agencias"
import { AgenciaDetalleClient } from "@/components/comerciales/AgenciaDetalleClient"
import { redirect } from "next/navigation"

export default async function AgenciaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const agencia = await obtenerDetalleAgencia(id)

  if (!agencia) {
    redirect('/comerciales/agencias')
  }

  return <AgenciaDetalleClient dataInicial={agencia} />
}
