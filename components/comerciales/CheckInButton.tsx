"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"

interface CheckInButtonProps {
  onCheckIn: () => Promise<void>
  disabled?: boolean
}

export function CheckInButton({ onCheckIn, disabled }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onCheckIn()
    setLoading(false)
  }

  return (
    <Button 
      onClick={handleConfirm}
      disabled={disabled || loading}
      className="w-full h-16 text-lg rounded-2xl shadow-lg shadow-primary/20 bg-success hover:bg-success/90 text-white"
    >
      {loading ? (
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
      ) : (
        <CheckCircle2 className="w-6 h-6 mr-2" /> 
      )}
      {loading ? "INICIANDO..." : "INICIAR VISITA"}
    </Button>
  )
}
