-- Tabla para registrar las alertas de inactividad enviadas y evitar duplicados
CREATE TABLE IF NOT EXISTS public.alertas_inactividad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercial_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    inicio_inactividad TIMESTAMP WITH TIME ZONE NOT NULL,
    notificado_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_comercial_fecha_inactividad UNIQUE (comercial_id, fecha, inicio_inactividad)
);

-- Habilitar RLS
ALTER TABLE public.alertas_inactividad ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Admins pueden ver todas las alertas de inactividad" 
ON public.alertas_inactividad 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_perfil
    WHERE usuarios_perfil.id = auth.uid() 
    AND usuarios_perfil.rol = 'admin'
  )
);

CREATE POLICY "Admins pueden insertar alertas de inactividad" 
ON public.alertas_inactividad 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios_perfil
    WHERE usuarios_perfil.id = auth.uid() 
    AND usuarios_perfil.rol = 'admin'
  )
);
