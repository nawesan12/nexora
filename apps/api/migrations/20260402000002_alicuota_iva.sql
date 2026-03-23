CREATE TYPE alicuota_iva AS ENUM ('0', '2.5', '5', '10.5', '21', '27', 'EXENTO', 'NO_GRAVADO');
ALTER TABLE productos ADD COLUMN alicuota_iva alicuota_iva NOT NULL DEFAULT '21';
ALTER TABLE detalle_pedidos ADD COLUMN alicuota_iva alicuota_iva DEFAULT '21';
ALTER TABLE detalle_comprobantes ADD COLUMN alicuota_iva alicuota_iva DEFAULT '21';
