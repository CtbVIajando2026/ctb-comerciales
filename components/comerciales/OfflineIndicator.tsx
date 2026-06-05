"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center sticky top-0 z-50 animate-in slide-in-from-top">
      <WifiOff className="w-3.5 h-3.5 mr-2 animate-pulse" />
      Sin conexión. Las visitas se guardarán localmente.
    </div>
  )
}
