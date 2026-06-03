'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Target, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { crearComercialAdmin } from '@/app/(admin)/adminActions'

export default function NuevoComercialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      password_temporal: formData.get('password') as string,
      telefono: formData.get('telefono') as string,
      ciudad: formData.get('ciudad') as string,
      rol: formData.get('rol') as string,
      metaDiaria: parseInt(formData.get('meta') as string, 10) || 5,
    }

    try {
      await crearComercialAdmin(data)
      toast.success("Comercial creado", { description: "La cuenta se ha configurado exitosamente." })
      router.push('/admin/comerciales')
    } catch (error: any) {
      console.error(error)
      toast.error("Error al crear cuenta", { description: error.message || "Verifica los datos e intenta de nuevo." })
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/comerciales" className="inline-flex items-center justify-center size-10 rounded-xl border border-border bg-background hover:bg-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Crear Nuevo Comercial</h1>
          <p className="text-muted-foreground text-sm">Configura la cuenta y las metas iniciales del vendedor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-border pb-2">Datos de Acceso</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                Correo Electrónico
              </label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="ejemplo@empresa.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2 text-muted-foreground" />
                Rol en el Sistema
              </label>
              <select
                name="rol"
                required
                defaultValue="comercial"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="comercial">Comercial (App de Visitas)</option>
                <option value="admin">Administrador (Acceso Total)</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium flex items-center">
                <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
                Contraseña Inicial
              </label>
              <input 
                name="password"
                type="text" 
                required
                minLength={6}
                placeholder="Contraseña segura"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-border pb-2 mt-8">Perfil Profesional</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              Nombre Completo
            </label>
            <input 
              name="nombre"
              type="text" 
              required
              placeholder="Ej. Juan Pérez"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                Teléfono Celular
              </label>
              <input 
                name="telefono"
                type="tel" 
                placeholder="099..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                Oficina / Ciudad Asignada
              </label>
              <select
                name="ciudad"
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecciona una oficina...</option>
                <option value="Quito">Quito</option>
                <option value="Guayaquil">Guayaquil</option>
                <option value="Cuenca">Cuenca</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-border pb-2 mt-8">Metas y KPIs</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2 text-muted-foreground" />
              Meta de Visitas Diarias
            </label>
            <input 
              name="meta"
              type="number" 
              min="1"
              required
              defaultValue="5"
              className="w-full md:w-1/3 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[11px] text-muted-foreground">Esta meta activará la gamificación y recompensas visuales del comercial.</p>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
          >
            {loading ? "Creando Cuenta..." : "Guardar y Activar Comercial"}
          </Button>
        </div>
      </form>
    </div>
  )
}
