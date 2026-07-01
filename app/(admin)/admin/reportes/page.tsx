import { ReportesInteligentesClient } from "@/components/admin/ReportesInteligentesClient"

export const dynamic = 'force-dynamic'

export default function AdminReportesPage() {
  return (
    <div className="pb-20 md:pb-0">
      <ReportesInteligentesClient />
    </div>
  )
}
