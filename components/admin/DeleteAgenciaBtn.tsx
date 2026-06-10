"use client"

import { Trash2 } from "lucide-react"
import { eliminarAgenciaAdmin } from "@/app/(admin)/adminActions"

export function DeleteAgenciaBtn({ id }: { id: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm("¿Seguro que deseas eliminar esta agencia de prueba? Se perderá para siempre.")) {
          await eliminarAgenciaAdmin(id)
          window.location.reload()
        }
      }}
      className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors ml-2"
      title="Eliminar agencia"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
