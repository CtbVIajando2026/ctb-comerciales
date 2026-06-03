'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button 
      onClick={handleLogout} 
      className="p-2 bg-muted rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-sm"
      title="Cerrar sesión"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
