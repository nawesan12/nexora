-- Link notas de credito/debito to original comprobante
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS comprobante_origen_id UUID REFERENCES comprobantes(id);
