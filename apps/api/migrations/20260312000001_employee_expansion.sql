-- New enums
CREATE TYPE estado_empleado AS ENUM ('ACTIVO', 'LICENCIA', 'DESVINCULADO');
CREATE TYPE tipo_contrato AS ENUM ('RELACION_DEPENDENCIA', 'MONOTRIBUTO', 'EVENTUAL');

-- Add 13 columns to empleados
ALTER TABLE empleados
  ADD COLUMN telefono VARCHAR(30),
  ADD COLUMN fecha_ingreso DATE,
  ADD COLUMN fecha_egreso DATE,
  ADD COLUMN estado estado_empleado NOT NULL DEFAULT 'ACTIVO',
  ADD COLUMN dni VARCHAR(15),
  ADD COLUMN direccion TEXT,
  ADD COLUMN salario_base NUMERIC(14,2),
  ADD COLUMN observaciones TEXT,
  ADD COLUMN tipo_contrato tipo_contrato NOT NULL DEFAULT 'RELACION_DEPENDENCIA',
  ADD COLUMN obra_social VARCHAR(100),
  ADD COLUMN numero_legajo VARCHAR(20),
  ADD COLUMN banco VARCHAR(100),
  ADD COLUMN cbu VARCHAR(30);

-- Indexes
CREATE INDEX idx_empleados_estado ON empleados(estado);
CREATE INDEX idx_empleados_dni ON empleados(dni);
CREATE INDEX idx_empleados_numero_legajo ON empleados(numero_legajo);
