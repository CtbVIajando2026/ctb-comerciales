-- 1. TABLA USUARIOS (NUEVA, PARA SISTEMA STANDALONE)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'comercial', 'operativo')),
  zona TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_pueden_ver_su_perfil" ON usuarios FOR SELECT USING (id = auth.uid());
CREATE POLICY "admins_ven_todo" ON usuarios FOR SELECT USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

-- 2. TABLA VENTAS (Dummy para soportar las vinculaciones del dashboard comercial)
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total DECIMAL(10, 2) NOT NULL,
  estado TEXT DEFAULT 'ganada',
  agencia TEXT,
  comercial_id UUID REFERENCES usuarios(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA AGENCIAS
CREATE TABLE agencias (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                  TEXT NOT NULL,
  direccion               TEXT,
  gps_lat_registro        DECIMAL(10, 8),
  gps_lng_registro        DECIMAL(11, 8),
  gps_lat_referencia      DECIMAL(10, 8),
  gps_lng_referencia      DECIMAL(11, 8),
  gps_referencia_fuente   TEXT DEFAULT NULL,
  zona                    TEXT,
  telefono                TEXT,
  email                   TEXT,
  ciudad                  TEXT DEFAULT 'Quito',
  activa                  BOOLEAN DEFAULT true,
  registrada_por          UUID REFERENCES usuarios(id),
  captada_por_comercial   BOOLEAN DEFAULT false,
  comercial_captador_id   UUID REFERENCES usuarios(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agencias_nombre ON agencias USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_agencias_zona ON agencias(zona);
CREATE INDEX idx_agencias_activa ON agencias(activa);

ALTER TABLE agencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_ven_agencias" ON agencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "todos_crean_agencias" ON agencias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "todos_editan_agencias" ON agencias FOR UPDATE TO authenticated USING (true);

-- 4. TABLA AGENCIA_CONTACTOS
CREATE TABLE agencia_contactos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id    UUID REFERENCES agencias(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  cargo         TEXT,
  telefono      TEXT,
  email         TEXT,
  activo        BOOLEAN DEFAULT true,
  agregado_por  UUID REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contactos_agencia ON agencia_contactos(agencia_id);
CREATE INDEX idx_contactos_activo ON agencia_contactos(activo);

ALTER TABLE agencia_contactos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_ven_contactos" ON agencia_contactos FOR SELECT TO authenticated USING (true);
CREATE POLICY "todos_crean_contactos" ON agencia_contactos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "todos_editan_contactos" ON agencia_contactos FOR UPDATE TO authenticated USING (true);

-- 5. TABLA VISITAS
CREATE TABLE visitas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercial_id          UUID REFERENCES usuarios(id) NOT NULL,
  agencia_id            UUID REFERENCES agencias(id) NOT NULL,
  contacto_id           UUID REFERENCES agencia_contactos(id),
  hora_checkin          TIMESTAMPTZ DEFAULT now(),
  hora_checkout         TIMESTAMPTZ,
  gps_lat               DECIMAL(10, 8),
  gps_lng               DECIMAL(11, 8),
  gps_lat_checkout      DECIMAL(10, 8),
  gps_lng_checkout      DECIMAL(11, 8),
  dist_checkin_agencia_m  DECIMAL(10, 2),
  dist_checkout_checkin_m DECIMAL(10, 2),
  alerta_ubicacion      TEXT DEFAULT NULL,
  aprendio_coords_agencia BOOLEAN DEFAULT false,
  timer_programado_min  INTEGER DEFAULT NULL,
  timer_notificado      BOOLEAN DEFAULT false,
  temas                 TEXT[],
  temas_texto_libre     TEXT,
  observaciones         TEXT,
  proximo_paso          TEXT,
  proximo_paso_fecha    DATE,
  contacto_nombre_libre TEXT,
  editado               BOOLEAN DEFAULT false,
  editado_at            TIMESTAMPTZ,
  editado_campos        JSONB,
  estado                TEXT DEFAULT 'abierta',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visitas_comercial ON visitas(comercial_id);
CREATE INDEX idx_visitas_agencia ON visitas(agencia_id);
CREATE INDEX idx_visitas_fecha ON visitas(created_at);
CREATE INDEX idx_visitas_estado ON visitas(estado);

ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comercial_ve_sus_visitas" ON visitas FOR SELECT USING (comercial_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');
CREATE POLICY "comercial_crea_visitas" ON visitas FOR INSERT WITH CHECK (comercial_id = auth.uid());
CREATE POLICY "comercial_edita_visita" ON visitas FOR UPDATE USING (comercial_id = auth.uid());

-- 6. TABLA METAS COMERCIALES
CREATE TABLE metas_comerciales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercial_id    UUID REFERENCES usuarios(id) NOT NULL UNIQUE,
  visitas_diarias INTEGER NOT NULL DEFAULT 5,
  activa          BOOLEAN DEFAULT true,
  creada_por      UUID REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE metas_comerciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comercial_ve_su_meta" ON metas_comerciales FOR SELECT USING (comercial_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');
CREATE POLICY "admin_gestiona_metas" ON metas_comerciales FOR ALL USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

-- 7. TABLA JUSTIFICACIONES COMERCIALES
CREATE TABLE justificaciones_comerciales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercial_id      UUID REFERENCES usuarios(id) NOT NULL,
  fecha             DATE NOT NULL,
  tipo              TEXT NOT NULL,
  descripcion       TEXT,
  quita_meta        BOOLEAN DEFAULT true,
  horas_afectadas   DECIMAL(4,1),
  estado            TEXT DEFAULT 'pendiente',
  aprobada_por      UUID REFERENCES usuarios(id),
  aprobada_at       TIMESTAMPTZ,
  comentario_admin  TEXT,
  creada_por_rol    TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comercial_id, fecha, tipo)
);

ALTER TABLE justificaciones_comerciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comercial_ve_sus_justif" ON justificaciones_comerciales FOR SELECT USING (comercial_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');
CREATE POLICY "comercial_crea_justif" ON justificaciones_comerciales FOR INSERT WITH CHECK (comercial_id = auth.uid());
CREATE POLICY "admin_aprueba_justif" ON justificaciones_comerciales FOR UPDATE USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

-- 8. TABLA AGENCIA_GPS_HISTORIAL
CREATE TABLE agencia_gps_historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID REFERENCES agencias(id) ON DELETE CASCADE,
  gps_lat     DECIMAL(10,8),
  gps_lng     DECIMAL(11,8),
  fuente      TEXT,
  comercial_id UUID REFERENCES usuarios(id),
  visita_id   UUID REFERENCES visitas(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- 9. TRIGGERS

-- Trigger para proteger hora_checkin y hora_checkout
CREATE OR REPLACE FUNCTION proteger_horas_visita()
RETURNS TRIGGER AS $$
BEGIN
  -- hora_checkin: solo se puede setear una vez
  IF OLD.hora_checkin IS NOT NULL AND NEW.hora_checkin != OLD.hora_checkin THEN
    NEW.hora_checkin := OLD.hora_checkin;
  END IF;
  -- hora_checkout: el servidor aplica now() en el cierre
  IF NEW.estado = 'completada' AND OLD.estado = 'abierta' THEN
    NEW.hora_checkout := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_proteger_horas
BEFORE UPDATE ON visitas
FOR EACH ROW EXECUTE FUNCTION proteger_horas_visita();


-- Trigger GPS Haversine
CREATE OR REPLACE FUNCTION calcular_verificacion_gps()
RETURNS TRIGGER AS $$
DECLARE
  agencia_lat     DECIMAL(10,8);
  agencia_lng     DECIMAL(11,8);
  dist_checkin    DECIMAL(10,2) := NULL;
  dist_checkout   DECIMAL(10,2) := NULL;
  nueva_alerta    TEXT := NULL;
  R               CONSTANT FLOAT := 6371000;
  alerta_checkin  BOOLEAN := false;
  alerta_checkout BOOLEAN := false;
BEGIN
  -- CHECK-IN
  IF NEW.gps_lat IS NOT NULL AND NEW.gps_lng IS NOT NULL THEN
    SELECT gps_lat_referencia, gps_lng_referencia
    INTO agencia_lat, agencia_lng
    FROM agencias WHERE id = NEW.agencia_id;

    IF agencia_lat IS NOT NULL THEN
      dist_checkin := ROUND(CAST(
        R * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS(NEW.gps_lat - agencia_lat) / 2), 2) +
          COS(RADIANS(agencia_lat)) * COS(RADIANS(NEW.gps_lat)) *
          POWER(SIN(RADIANS(NEW.gps_lng - agencia_lng) / 2), 2)
        ))
      AS DECIMAL), 2);
      NEW.dist_checkin_agencia_m := dist_checkin;
    ELSE
      -- Aprender
      UPDATE agencias
      SET
        gps_lat_referencia    = NEW.gps_lat,
        gps_lng_referencia    = NEW.gps_lng,
        gps_referencia_fuente = 'visita_auto',
        updated_at            = now()
      WHERE id = NEW.agencia_id;

      NEW.aprendio_coords_agencia := true;
      NEW.dist_checkin_agencia_m  := 0;
    END IF;
  END IF;

  -- CHECK-OUT
  IF NEW.estado = 'completada' AND OLD.estado = 'abierta'
     AND NEW.gps_lat_checkout IS NOT NULL
     AND NEW.gps_lat IS NOT NULL THEN

    dist_checkout := ROUND(CAST(
      R * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(NEW.gps_lat_checkout - NEW.gps_lat) / 2), 2) +
        COS(RADIANS(NEW.gps_lat)) * COS(RADIANS(NEW.gps_lat_checkout)) *
        POWER(SIN(RADIANS(NEW.gps_lng_checkout - NEW.gps_lng) / 2), 2)
      ))
    AS DECIMAL), 2);
    NEW.dist_checkout_checkin_m := dist_checkout;
  END IF;

  -- ALERTAS
  alerta_checkin := (NEW.dist_checkin_agencia_m IS NOT NULL AND NEW.dist_checkin_agencia_m > 300 AND NEW.aprendio_coords_agencia = false);
  alerta_checkout := (NEW.dist_checkout_checkin_m IS NOT NULL AND NEW.dist_checkout_checkin_m > 500);

  IF alerta_checkin AND alerta_checkout THEN
    nueva_alerta := 'ambos';
  ELSIF alerta_checkin THEN
    nueva_alerta := 'checkin_lejano';
  ELSIF alerta_checkout THEN
    nueva_alerta := 'checkout_lejano';
  END IF;
  NEW.alerta_ubicacion := nueva_alerta;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_verificacion_gps
BEFORE INSERT OR UPDATE ON visitas
FOR EACH ROW EXECUTE FUNCTION calcular_verificacion_gps();
