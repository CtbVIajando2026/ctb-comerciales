-- Migración para registro_regalos
CREATE TABLE registro_regalos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercial_id UUID REFERENCES usuarios(id) NOT NULL,
  agencia_id UUID REFERENCES agencias(id) NOT NULL,
  visita_id UUID REFERENCES visitas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('souvenir', 'comida', 'otro')),
  descripcion TEXT NOT NULL,
  cantidad INTEGER,
  costo DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_registro_regalos_comercial ON registro_regalos(comercial_id);
CREATE INDEX idx_registro_regalos_agencia ON registro_regalos(agencia_id);
CREATE INDEX idx_registro_regalos_fecha ON registro_regalos(created_at);

ALTER TABLE registro_regalos ENABLE ROW LEVEL SECURITY;

-- Comerciales ven sus propios registros, admins ven todos
CREATE POLICY "comercial_ve_sus_regalos" ON registro_regalos 
  FOR SELECT USING (comercial_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

-- Comerciales crean sus registros
CREATE POLICY "comercial_crea_regalos" ON registro_regalos 
  FOR INSERT WITH CHECK (comercial_id = auth.uid());

-- Permitir actualización si hace falta
CREATE POLICY "comercial_edita_regalos" ON registro_regalos 
  FOR UPDATE USING (comercial_id = auth.uid());
