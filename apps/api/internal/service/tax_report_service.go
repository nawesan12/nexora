package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaxReportService struct {
	db *pgxpool.Pool
}

func NewTaxReportService(db *pgxpool.Pool) *TaxReportService {
	return &TaxReportService{db: db}
}

// --- DTOs ---

type LibroIVAVentasEntry struct {
	Fecha         string  `json:"fecha"`
	Tipo          string  `json:"tipo"`
	Letra         string  `json:"letra"`
	Numero        string  `json:"numero"`
	ClienteNombre string  `json:"cliente_nombre"`
	ClienteCUIT   string  `json:"cliente_cuit"`
	NetoGravado   float64 `json:"neto_gravado"`
	IVA21         float64 `json:"iva_21"`
	IVA105        float64 `json:"iva_10_5"`
	IVA27         float64 `json:"iva_27"`
	Percepciones  float64 `json:"percepciones"`
	Total         float64 `json:"total"`
}

type LibroIVAComprasEntry struct {
	Fecha           string  `json:"fecha"`
	Tipo            string  `json:"tipo"`
	Numero          string  `json:"numero"`
	ProveedorNombre string  `json:"proveedor_nombre"`
	ProveedorCUIT   string  `json:"proveedor_cuit"`
	NetoGravado     float64 `json:"neto_gravado"`
	IVA21           float64 `json:"iva_21"`
	IVA105          float64 `json:"iva_10_5"`
	IVA27           float64 `json:"iva_27"`
	Retenciones     float64 `json:"retenciones"`
	Total           float64 `json:"total"`
}

type ResumenIIBBEntry struct {
	Tipo   string  `json:"tipo"`
	Nombre string  `json:"nombre"`
	Monto  float64 `json:"monto"`
}

type ResumenRetencionesEntry struct {
	Tipo     string  `json:"tipo"`
	Cantidad int     `json:"cantidad"`
	Total    float64 `json:"total"`
}

// --- Methods ---

// LibroIVAVentas returns the sales IVA book for a given period (YYYY-MM).
// It queries comprobantes joined with clientes, then parses the impuestos JSONB
// column to extract per-alicuota IVA amounts.
func (s *TaxReportService) LibroIVAVentas(ctx context.Context, userID pgtype.UUID, periodo string) ([]LibroIVAVentasEntry, error) {
	startDate := periodo + "-01"

	query := `
		SELECT
			c.fecha_emision,
			c.tipo::TEXT,
			c.letra::TEXT,
			c.numero,
			cl.nombre AS cliente_nombre,
			COALESCE(cl.cuit, '') AS cliente_cuit,
			c.base_imponible,
			c.impuestos,
			c.total
		FROM comprobantes c
		JOIN clientes cl ON cl.id = c.cliente_id
		WHERE c.usuario_id = $1
		  AND c.estado = 'EMITIDO'
		  AND c.active = true
		  AND c.fecha_emision >= $2::date
		  AND c.fecha_emision < ($2::date + INTERVAL '1 month')
		ORDER BY c.fecha_emision, c.numero
	`

	rows, err := s.db.Query(ctx, query, userID, startDate)
	if err != nil {
		return nil, fmt.Errorf("libro iva ventas query: %w", err)
	}
	defer rows.Close()

	var entries []LibroIVAVentasEntry
	for rows.Next() {
		var (
			fecha         pgtype.Date
			tipo          string
			letra         string
			numero        string
			clienteNombre string
			clienteCUIT   string
			baseImponible pgtype.Numeric
			impuestos     []byte
			total         pgtype.Numeric
		)

		if err := rows.Scan(&fecha, &tipo, &letra, &numero, &clienteNombre, &clienteCUIT, &baseImponible, &impuestos, &total); err != nil {
			return nil, fmt.Errorf("libro iva ventas scan: %w", err)
		}

		iva21, iva105, iva27, percepciones := parseImpuestosJSON(impuestos)

		entries = append(entries, LibroIVAVentasEntry{
			Fecha:         dateFromPg(fecha),
			Tipo:          tipo,
			Letra:         letra,
			Numero:        numero,
			ClienteNombre: clienteNombre,
			ClienteCUIT:   clienteCUIT,
			NetoGravado:   floatFromNumeric(baseImponible),
			IVA21:         iva21,
			IVA105:        iva105,
			IVA27:         iva27,
			Percepciones:  percepciones,
			Total:         floatFromNumeric(total),
		})
	}

	if entries == nil {
		entries = []LibroIVAVentasEntry{}
	}
	return entries, nil
}

// LibroIVACompras returns the purchases IVA book for a given period (YYYY-MM).
func (s *TaxReportService) LibroIVACompras(ctx context.Context, userID pgtype.UUID, periodo string) ([]LibroIVAComprasEntry, error) {
	startDate := periodo + "-01"

	query := `
		SELECT
			fp.fecha_emision,
			fp.tipo,
			fp.numero,
			p.razon_social AS proveedor_nombre,
			COALESCE(p.cuit, '') AS proveedor_cuit,
			fp.subtotal AS neto_gravado,
			fp.impuestos AS total_impuestos,
			fp.total,
			COALESCE((
				SELECT SUM(r.monto)
				FROM retenciones r
				WHERE r.entidad_tipo = 'PROVEEDOR'
				  AND r.entidad_id = fp.proveedor_id
				  AND r.periodo = $2
				  AND r.active = true
				  AND r.usuario_id = $1
			), 0) AS retenciones
		FROM facturas_proveedor fp
		JOIN proveedores p ON p.id = fp.proveedor_id
		WHERE fp.usuario_id = $1
		  AND fp.active = true
		  AND fp.fecha_emision >= $3::date
		  AND fp.fecha_emision < ($3::date + INTERVAL '1 month')
		ORDER BY fp.fecha_emision, fp.numero
	`

	rows, err := s.db.Query(ctx, query, userID, periodo, startDate)
	if err != nil {
		return nil, fmt.Errorf("libro iva compras query: %w", err)
	}
	defer rows.Close()

	var entries []LibroIVAComprasEntry
	for rows.Next() {
		var (
			fecha           pgtype.Date
			tipo            string
			numero          string
			proveedorNombre string
			proveedorCUIT   string
			netoGravado     pgtype.Numeric
			totalImpuestos  pgtype.Numeric
			total           pgtype.Numeric
			retenciones     pgtype.Numeric
		)

		if err := rows.Scan(&fecha, &tipo, &numero, &proveedorNombre, &proveedorCUIT, &netoGravado, &totalImpuestos, &total, &retenciones); err != nil {
			return nil, fmt.Errorf("libro iva compras scan: %w", err)
		}

		// For supplier invoices we don't have per-alicuota breakdown,
		// so we assign the total tax amount to IVA 21% by default.
		impTotal := floatFromNumeric(totalImpuestos)

		entries = append(entries, LibroIVAComprasEntry{
			Fecha:           dateFromPg(fecha),
			Tipo:            tipo,
			Numero:          numero,
			ProveedorNombre: proveedorNombre,
			ProveedorCUIT:   proveedorCUIT,
			NetoGravado:     floatFromNumeric(netoGravado),
			IVA21:           impTotal,
			IVA105:          0,
			IVA27:           0,
			Retenciones:     floatFromNumeric(retenciones),
			Total:           floatFromNumeric(total),
		})
	}

	if entries == nil {
		entries = []LibroIVAComprasEntry{}
	}
	return entries, nil
}

// ResumenIIBB returns a monthly IIBB summary, aggregating retenciones (tipo=IIBB)
// and percepciones (tipo=IIBB) for the given period.
func (s *TaxReportService) ResumenIIBB(ctx context.Context, userID pgtype.UUID, periodo string) ([]ResumenIIBBEntry, error) {
	query := `
		SELECT 'RETENCION' AS categoria, r.tipo AS nombre, SUM(r.monto) AS monto
		FROM retenciones r
		WHERE r.usuario_id = $1
		  AND r.tipo = 'IIBB'
		  AND r.periodo = $2
		  AND r.active = true
		  AND r.estado != 'ANULADA'
		GROUP BY r.tipo

		UNION ALL

		SELECT 'PERCEPCION' AS categoria, p.tipo AS nombre, SUM(p.monto) AS monto
		FROM percepciones p
		WHERE p.usuario_id = $1
		  AND p.tipo = 'IIBB'
		  AND p.periodo = $2
		  AND p.active = true
		GROUP BY p.tipo
		ORDER BY categoria
	`

	rows, err := s.db.Query(ctx, query, userID, periodo)
	if err != nil {
		return nil, fmt.Errorf("resumen iibb query: %w", err)
	}
	defer rows.Close()

	var entries []ResumenIIBBEntry
	for rows.Next() {
		var (
			tipo   string
			nombre string
			monto  pgtype.Numeric
		)
		if err := rows.Scan(&tipo, &nombre, &monto); err != nil {
			return nil, fmt.Errorf("resumen iibb scan: %w", err)
		}
		entries = append(entries, ResumenIIBBEntry{
			Tipo:   tipo,
			Nombre: nombre,
			Monto:  floatFromNumeric(monto),
		})
	}

	if entries == nil {
		entries = []ResumenIIBBEntry{}
	}
	return entries, nil
}

// ResumenRetenciones returns a summary of all retentions grouped by type for the given period.
func (s *TaxReportService) ResumenRetenciones(ctx context.Context, userID pgtype.UUID, periodo string) ([]ResumenRetencionesEntry, error) {
	query := `
		SELECT r.tipo, COUNT(*) AS cantidad, SUM(r.monto) AS total
		FROM retenciones r
		WHERE r.usuario_id = $1
		  AND r.periodo = $2
		  AND r.active = true
		  AND r.estado != 'ANULADA'
		GROUP BY r.tipo
		ORDER BY r.tipo
	`

	rows, err := s.db.Query(ctx, query, userID, periodo)
	if err != nil {
		return nil, fmt.Errorf("resumen retenciones query: %w", err)
	}
	defer rows.Close()

	var entries []ResumenRetencionesEntry
	for rows.Next() {
		var (
			tipo     string
			cantidad int
			total    pgtype.Numeric
		)
		if err := rows.Scan(&tipo, &cantidad, &total); err != nil {
			return nil, fmt.Errorf("resumen retenciones scan: %w", err)
		}
		entries = append(entries, ResumenRetencionesEntry{
			Tipo:     tipo,
			Cantidad: cantidad,
			Total:    floatFromNumeric(total),
		})
	}

	if entries == nil {
		entries = []ResumenRetencionesEntry{}
	}
	return entries, nil
}

// --- CITI Export ---

// ExportCITIVentas generates the CITI Ventas fixed-width text file for AFIP.
// Each line represents one comprobante formatted per CITI specification.
func (s *TaxReportService) ExportCITIVentas(ctx context.Context, userID pgtype.UUID, periodo string) ([]byte, error) {
	startDate := periodo + "-01"

	query := `
		SELECT
			c.tipo::TEXT,
			c.letra::TEXT,
			c.numero,
			c.fecha_emision,
			COALESCE(cl.cuit, '') AS cliente_cuit,
			COALESCE(cl.dni, '') AS cliente_dni,
			cl.nombre AS cliente_nombre,
			cl.condicion_iva::TEXT AS cliente_condicion_iva,
			c.base_imponible,
			c.impuestos,
			c.total,
			COALESCE(c.subtotal - c.base_imponible, 0) AS no_gravado
		FROM comprobantes c
		JOIN clientes cl ON cl.id = c.cliente_id
		WHERE c.usuario_id = $1
		  AND c.estado = 'EMITIDO'
		  AND c.active = true
		  AND c.fecha_emision >= $2::date
		  AND c.fecha_emision < ($2::date + INTERVAL '1 month')
		ORDER BY c.fecha_emision, c.numero
	`

	rows, err := s.db.Query(ctx, query, userID, startDate)
	if err != nil {
		return nil, fmt.Errorf("citi ventas query: %w", err)
	}
	defer rows.Close()

	var buf bytes.Buffer
	for rows.Next() {
		var (
			tipo            string
			letra           string
			numero          string
			fechaEmision    pgtype.Date
			clienteCUIT     string
			clienteDNI      string
			clienteNombre   string
			clienteCondIVA  string
			baseImponible   pgtype.Numeric
			impuestos       []byte
			total           pgtype.Numeric
			noGravado       pgtype.Numeric
		)

		if err := rows.Scan(&tipo, &letra, &numero, &fechaEmision, &clienteCUIT,
			&clienteDNI, &clienteNombre, &clienteCondIVA, &baseImponible,
			&impuestos, &total, &noGravado); err != nil {
			return nil, fmt.Errorf("citi ventas scan: %w", err)
		}

		tipoComp := citiTipoComprobante(tipo, letra)
		puntoVenta, numComp := citiParseNumero(numero)
		fechaStr := citiFormatDate(fechaEmision)
		tipoDoc, numDoc := citiDocumentoCliente(clienteCUIT, clienteDNI, clienteCondIVA)
		nombre := citiPadRight(clienteNombre, 30)
		iva21, iva105, iva27, _ := parseImpuestosJSON(impuestos)

		totalCents := citiAmount(floatFromNumeric(total), 15)
		noGravadoCents := citiAmount(floatFromNumeric(noGravado), 15)
		exentoCents := citiAmount(0, 15) // Exemptions tracked separately if needed
		iva21Cents := citiAmount(iva21, 15)
		iva105Cents := citiAmount(iva105, 15)
		iva27Cents := citiAmount(iva27, 15)

		line := fmt.Sprintf("%s%s%s%s%s%s%s%s%s%s%s%s%s\n",
			tipoComp, puntoVenta, numComp, fechaStr,
			tipoDoc, numDoc, nombre,
			totalCents, noGravadoCents, exentoCents,
			iva21Cents, iva105Cents, iva27Cents,
		)
		buf.WriteString(line)
	}

	return buf.Bytes(), nil
}

// ExportCITICompras generates the CITI Compras fixed-width text file for AFIP.
func (s *TaxReportService) ExportCITICompras(ctx context.Context, userID pgtype.UUID, periodo string) ([]byte, error) {
	startDate := periodo + "-01"

	query := `
		SELECT
			fp.tipo,
			fp.numero,
			fp.fecha_emision,
			COALESCE(p.cuit, '') AS proveedor_cuit,
			p.razon_social AS proveedor_nombre,
			fp.subtotal AS neto_gravado,
			fp.impuestos AS total_impuestos,
			fp.total,
			COALESCE((
				SELECT SUM(r.monto)
				FROM retenciones r
				WHERE r.entidad_tipo = 'PROVEEDOR'
				  AND r.entidad_id = fp.proveedor_id
				  AND r.periodo = $2
				  AND r.active = true
				  AND r.usuario_id = $1
			), 0) AS retenciones
		FROM facturas_proveedor fp
		JOIN proveedores p ON p.id = fp.proveedor_id
		WHERE fp.usuario_id = $1
		  AND fp.active = true
		  AND fp.fecha_emision >= $3::date
		  AND fp.fecha_emision < ($3::date + INTERVAL '1 month')
		ORDER BY fp.fecha_emision, fp.numero
	`

	rows, err := s.db.Query(ctx, query, userID, periodo, startDate)
	if err != nil {
		return nil, fmt.Errorf("citi compras query: %w", err)
	}
	defer rows.Close()

	var buf bytes.Buffer
	for rows.Next() {
		var (
			tipo            string
			numero          string
			fechaEmision    pgtype.Date
			proveedorCUIT   string
			proveedorNombre string
			netoGravado     pgtype.Numeric
			totalImpuestos  pgtype.Numeric
			total           pgtype.Numeric
			retenciones     pgtype.Numeric
		)

		if err := rows.Scan(&tipo, &numero, &fechaEmision, &proveedorCUIT,
			&proveedorNombre, &netoGravado, &totalImpuestos, &total, &retenciones); err != nil {
			return nil, fmt.Errorf("citi compras scan: %w", err)
		}

		// For purchases, tipo already contains the type description
		tipoComp := citiTipoComprobanteCompra(tipo)
		puntoVenta, numComp := citiParseNumero(numero)
		fechaStr := citiFormatDate(fechaEmision)
		tipoDoc := "80" // Suppliers always have CUIT
		numDoc := citiPadLeft(proveedorCUIT, 20)
		nombre := citiPadRight(proveedorNombre, 30)
		impTotal := floatFromNumeric(totalImpuestos)

		totalCents := citiAmount(floatFromNumeric(total), 15)
		noGravadoCents := citiAmount(0, 15)
		exentoCents := citiAmount(0, 15)
		iva21Cents := citiAmount(impTotal, 15) // Assign all tax to 21% by default
		iva105Cents := citiAmount(0, 15)
		iva27Cents := citiAmount(0, 15)

		line := fmt.Sprintf("%s%s%s%s%s%s%s%s%s%s%s%s%s\n",
			tipoComp, puntoVenta, numComp, fechaStr,
			tipoDoc, numDoc, nombre,
			totalCents, noGravadoCents, exentoCents,
			iva21Cents, iva105Cents, iva27Cents,
		)
		buf.WriteString(line)
	}

	return buf.Bytes(), nil
}

// --- CITI Helper functions ---

// citiTipoComprobante maps internal tipo + letra to AFIP CITI tipo code (3 digits).
func citiTipoComprobante(tipo, letra string) string {
	key := tipo + "_" + letra
	codes := map[string]string{
		"FACTURA_A":      "001",
		"FACTURA_B":      "006",
		"FACTURA_C":      "011",
		"NOTA_CREDITO_A": "003",
		"NOTA_CREDITO_B": "008",
		"NOTA_CREDITO_C": "013",
		"NOTA_DEBITO_A":  "002",
		"NOTA_DEBITO_B":  "007",
		"NOTA_DEBITO_C":  "012",
	}
	if code, ok := codes[key]; ok {
		return code
	}
	return "001" // default to Factura A
}

// citiTipoComprobanteCompra maps supplier invoice type to AFIP CITI code.
func citiTipoComprobanteCompra(tipo string) string {
	codes := map[string]string{
		"FACTURA_A":      "001",
		"FACTURA_B":      "006",
		"FACTURA_C":      "011",
		"NOTA_CREDITO_A": "003",
		"NOTA_CREDITO_B": "008",
		"NOTA_DEBITO_A":  "002",
		"NOTA_DEBITO_B":  "007",
	}
	if code, ok := codes[tipo]; ok {
		return code
	}
	return "001"
}

// citiParseNumero splits "0001-00000042" into punto de venta (5 digits) and numero (20 digits).
func citiParseNumero(numero string) (string, string) {
	parts := strings.SplitN(numero, "-", 2)
	if len(parts) == 2 {
		return citiPadLeft(parts[0], 5), citiPadLeft(parts[1], 20)
	}
	return citiPadLeft("1", 5), citiPadLeft(numero, 20)
}

// citiFormatDate formats a pgtype.Date as YYYYMMDD.
func citiFormatDate(d pgtype.Date) string {
	if d.Valid {
		return d.Time.Format("20060102")
	}
	return "00000000"
}

// citiDocumentoCliente determines tipo_documento and numero_documento for CITI.
// Returns (tipoDoc 2 chars, numDoc 20 chars zero-padded).
func citiDocumentoCliente(cuit, dni, condicionIVA string) (string, string) {
	if cuit != "" {
		return "80", citiPadLeft(cuit, 20) // 80 = CUIT
	}
	if dni != "" {
		return "96", citiPadLeft(dni, 20) // 96 = DNI
	}
	if condicionIVA == "CONSUMIDOR_FINAL" {
		return "99", citiPadLeft("0", 20) // 99 = Sin identificar
	}
	return "99", citiPadLeft("0", 20)
}

// citiAmount converts a float to a fixed-width integer string with implicit 2 decimal places.
// e.g., 1234.56 -> "000000000123456" (width 15)
func citiAmount(amount float64, width int) string {
	cents := int64(math.Round(amount * 100))
	if cents < 0 {
		cents = -cents
	}
	return fmt.Sprintf("%0*d", width, cents)
}

// citiPadRight pads a string with spaces on the right to the specified width.
func citiPadRight(s string, width int) string {
	if len(s) >= width {
		return s[:width]
	}
	return s + strings.Repeat(" ", width-len(s))
}

// citiPadLeft pads a string with zeros on the left to the specified width.
func citiPadLeft(s string, width int) string {
	if len(s) >= width {
		return s[len(s)-width:]
	}
	return strings.Repeat("0", width-len(s)) + s
}

// parseImpuestosJSON extracts IVA amounts from the comprobantes.impuestos JSONB column.
// Expected format: [{"nombre":"IVA 21%","porcentaje":21,"monto":100.50}, ...]
func parseImpuestosJSON(data []byte) (iva21, iva105, iva27, percepciones float64) {
	// Simple JSON array parsing without importing encoding/json at this level.
	// The impuestos column stores an array of tax objects.
	type taxEntry struct {
		Nombre     string  `json:"nombre"`
		Porcentaje float64 `json:"porcentaje"`
		Monto      float64 `json:"monto"`
	}

	var taxes []taxEntry
	if err := json.Unmarshal(data, &taxes); err != nil {
		return 0, 0, 0, 0
	}

	for _, t := range taxes {
		switch {
		case t.Porcentaje == 21:
			iva21 += t.Monto
		case t.Porcentaje == 10.5:
			iva105 += t.Monto
		case t.Porcentaje == 27:
			iva27 += t.Monto
		default:
			// Treat other taxes as percepciones
			percepciones += t.Monto
		}
	}
	return
}
