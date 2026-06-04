import { obtenerDatosHistoricosAdmin } from "@/app/(admin)/adminActions"
import { RankingClient } from "@/components/shared/RankingClient"

export const dynamic = 'force-dynamic'

export default async function ComercialesRankingPage() {
  const datos = await obtenerDatosHistoricosAdmin()

  return (
    <div className="p-4 bg-muted/10 min-h-screen">
      <RankingClient datos={datos} />
    </div>
  )
}
