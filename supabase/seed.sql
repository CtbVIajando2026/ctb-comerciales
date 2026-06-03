-- IMPORTANTE: Corre este script SOLO DESPUÉS de haber insertado a tu usuario comercial
-- en la tabla "usuarios" y de haberle asignado una meta en "metas_comerciales".

-- 1. Insertar Agencias de Prueba
INSERT INTO agencias (id, nombre, direccion, zona, ciudad, gps_lat_referencia, gps_lng_referencia, temperatura)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Travel Experiences Quito', 'Av. Naciones Unidas y Shyris', 'Norte', 'Quito', -0.1772, -78.4796, 'activa'),
  ('a2222222-2222-2222-2222-222222222222', 'Mundo Turismo Plus', 'Av. Amazonas y Colón', 'Centro', 'Quito', -0.2014, -78.4905, 'tibia'),
  ('a3333333-3333-3333-3333-333333333333', 'Viajes del Sol Cumbayá', 'Centro Comercial Scala', 'Valles', 'Quito', -0.2052, -78.4357, 'fria'),
  ('a4444444-4444-4444-4444-444444444444', 'Ecuador Travel Experts', 'Av. 6 de Diciembre y Orellana', 'Norte', 'Quito', -0.1932, -78.4841, 'activa'),
  ('a5555555-5555-5555-5555-555555555555', 'Rutas Escondidas', 'Calle La Ronda', 'Sur', 'Quito', -0.2245, -78.5148, 'tibia')
ON CONFLICT DO NOTHING;

-- 2. Insertar Contactos de Prueba
INSERT INTO agencia_contactos (id, agencia_id, nombre, cargo)
VALUES
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'María Augusta', 'Gerente General'),
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'Juan Pérez', 'Asesor de Ventas'),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'Carlos Ruiz', 'Dueño'),
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', 'Ana Lucía', 'Ejecutiva de Cuentas'),
  (gen_random_uuid(), 'a4444444-4444-4444-4444-444444444444', 'Diego Torres', 'Gerente Comercial')
ON CONFLICT DO NOTHING;

-- 3. Insertar Ventas Ficticias (Asegúrate de cambiar el comercial_id por tu UUID real después)
-- INSERT INTO ventas (total, estado, agencia, comercial_id)
-- VALUES
--   (1500.00, 'ganada', 'Travel Experiences Quito', 'TU-UUID-AQUI'),
--   (3250.50, 'ganada', 'Viajes del Sol Cumbayá', 'TU-UUID-AQUI'),
--   (850.00, 'ganada', 'Mundo Turismo Plus', 'TU-UUID-AQUI');

-- NOTA PARA EL USUARIO:
-- Para las ventas, quita el comentario de las últimas líneas y reemplaza 'TU-UUID-AQUI'
-- con el UUID real de tu cuenta en la tabla auth.users para que puedas ver el cálculo de bonos en el dashboard.
