-- Create gamification table
CREATE TABLE public.comercial_gamificacion (
    comercial_id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    puntos_mes_actual INTEGER NOT NULL DEFAULT 0,
    xp_total INTEGER NOT NULL DEFAULT 0,
    racha_dias INTEGER NOT NULL DEFAULT 0,
    ultima_visita_fecha DATE,
    insignias JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.comercial_gamificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden leer todas las puntuaciones"
    ON public.comercial_gamificacion FOR SELECT
    TO authenticated
    USING (true);

-- Insert record for all existing comerciales
INSERT INTO public.comercial_gamificacion (comercial_id)
SELECT id FROM public.usuarios WHERE rol = 'comercial'
ON CONFLICT (comercial_id) DO NOTHING;
