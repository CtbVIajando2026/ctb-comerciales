-- Agrega la columna para rastrear si ya se envió la notificación de Telegram de visita larga
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS alerta_larga_enviada BOOLEAN DEFAULT false;
