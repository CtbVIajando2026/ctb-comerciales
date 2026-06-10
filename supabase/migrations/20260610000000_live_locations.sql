-- Tabla para almacenar la última ubicación en tiempo real de los comerciales (actualizada cada 15 min)
CREATE TABLE comercial_ubicaciones_live (
  comercial_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  gps_lat DECIMAL(10, 8) NOT NULL,
  gps_lng DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE comercial_ubicaciones_live ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
CREATE POLICY "comerciales_upsert_propia_ubicacion" ON comercial_ubicaciones_live 
  FOR ALL USING (comercial_id = auth.uid()) 
  WITH CHECK (comercial_id = auth.uid());

CREATE POLICY "admins_ven_ubicaciones" ON comercial_ubicaciones_live 
  FOR SELECT USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');
