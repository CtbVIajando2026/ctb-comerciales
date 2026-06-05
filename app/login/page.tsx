'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Forzar el cierre del teclado móvil desenfocando todos los campos
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    const inputs = e.currentTarget.querySelectorAll('input')
    inputs.forEach(input => input.blur())

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Obtener el rol del usuario
      const { data: usuario, error: dbError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', data.user.id)
        .single()

      if (dbError) {
        setError("Error al verificar perfil de usuario.")
        setLoading(false)
        return
      }

      const rol = usuario?.rol

      // Timeout de 300ms para asegurar el cierre completo del teclado y reajuste del viewport
      setTimeout(() => {
        if (rol === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/comerciales/dashboard'
        }
      }, 300)
    } else {
      setError("No se pudo iniciar sesión.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CTB Viajando</CardTitle>
          <CardDescription>Ingresa al Módulo de Comerciales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="juan@ctb.com.ec" 
                required 
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="h-12"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium border border-destructive/20">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-12 text-base mt-2" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
