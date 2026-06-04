import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"

interface MetaBarProps {
  realizadas: number
  meta: number
  justificado: boolean
  actividades?: number
  esFinDeSemana?: boolean
}

export function MetaBar({ realizadas, meta, justificado, actividades = 0, esFinDeSemana = false }: MetaBarProps) {
  if (justificado) {
    return (
      <div className="w-full flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
        <CheckCircle2 className="text-success w-5 h-5" />
        <span className="text-sm font-medium">Día justificado</span>
      </div>
    )
  }

  if (esFinDeSemana && realizadas === 0 && actividades === 0) {
    return (
      <div className="w-full text-center p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm font-bold text-foreground">¡Es Fin de Semana!</p>
        <p className="text-xs text-muted-foreground mt-1">Puedes registrar visitas o actividades extra si lo necesitas.</p>
      </div>
    )
  }

  const porcentaje = meta > 0 ? Math.min(100, (realizadas / meta) * 100) : 100
  
  let colorClass = "bg-error"
  let textColorClass = "text-error"
  
  if (porcentaje >= 100) {
    colorClass = "bg-success"
    textColorClass = "text-success"
  } else if (porcentaje >= 66) {
    colorClass = "bg-success/70" // Un verde claro
    textColorClass = "text-success/90"
  } else if (porcentaje >= 33) {
    colorClass = "bg-warning"
    textColorClass = "text-warning"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end mb-1">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
            {esFinDeSemana ? 'LABORES EXTRA (FIN DE SEMANA)' : 'META DEL DÍA'}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-black">
              {realizadas} 
              {!esFinDeSemana && meta > 0 && <><span className="text-2xl text-muted-foreground/50 mx-1">/</span><span className="text-3xl">{meta}</span></>}
            </p>
            
            {esFinDeSemana ? (
              <span className="text-xs font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-md uppercase tracking-wider">
                ¡Extra!
              </span>
            ) : !meta ? (
              <span className="text-xs font-bold bg-success/20 text-success px-2.5 py-1 rounded-md uppercase tracking-wider">
                Meta Libre
              </span>
            ) : porcentaje < 100 ? (
              <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-md text-muted-foreground uppercase tracking-wider">
                Te faltan: {meta - realizadas}
              </span>
            ) : (
              <span className="text-xs font-bold bg-success/20 text-success px-2.5 py-1 rounded-md uppercase tracking-wider">
                ¡Meta cumplida!
              </span>
            )}
          </div>
        </div>
      </div>
      
      {!esFinDeSemana && (
        <Progress value={porcentaje} className="h-3 rounded-full" indicatorClassName={colorClass} />
      )}

      {actividades > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actividades Registradas</p>
          </div>
          <p className="text-sm font-black">{actividades}</p>
        </div>
      )}
    </div>
  )
}
