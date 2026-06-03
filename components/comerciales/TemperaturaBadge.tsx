import { Badge } from "@/components/ui/badge"

interface TemperaturaBadgeProps {
  temperatura: 'activa' | 'tibia' | 'fria' | string
}

export function TemperaturaBadge({ temperatura }: TemperaturaBadgeProps) {
  const colorMap: Record<string, string> = {
    activa: "bg-[var(--temp-activa)] hover:bg-[var(--temp-activa)]",
    tibia: "bg-[var(--temp-tibia)] hover:bg-[var(--temp-tibia)] text-black",
    fria: "bg-[var(--temp-fria)] hover:bg-[var(--temp-fria)]"
  }

  const labelMap: Record<string, string> = {
    activa: "Activa",
    tibia: "Tibia",
    fria: "Fría"
  }

  const color = colorMap[temperatura] || "bg-muted text-muted-foreground"
  const label = labelMap[temperatura] || "Sin Datos"

  return (
    <Badge className={`${color} border-none`}>
      {label}
    </Badge>
  )
}
