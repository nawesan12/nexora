package pdf

import (
	"bytes"
	"fmt"

	"github.com/go-pdf/fpdf"
)

// RetencionCertificateData holds every field needed to render a retention certificate.
type RetencionCertificateData struct {
	// Company (agent of retention)
	CompanyName    string
	CompanyCUIT    string
	CompanyAddress string

	// Subject (retained party)
	SujetoNombre  string
	SujetoCUIT    string
	SujetoAddress string

	// Retention details
	NumeroCertificado string
	Tipo              string // GANANCIAS, IVA, IIBB, SUSS
	FechaRetencion    string
	Periodo           string
	BaseImponible     float64
	Alicuota          float64
	MontoRetenido     float64
}

// GenerateRetencionCertificate renders a simple A4 PDF retention certificate and
// returns the PDF contents in a bytes.Buffer.
func GenerateRetencionCertificate(data RetencionCertificateData) (*bytes.Buffer, error) {
	p := fpdf.New("P", "mm", "A4", "")
	p.SetMargins(15, 15, 15)
	p.SetAutoPageBreak(true, 20)
	p.AddPage()

	pageW, _ := p.GetPageSize()
	marginL, _, marginR, _ := p.GetMargins()
	usable := pageW - marginL - marginR

	// ── Header bar ──
	p.SetFillColor(tealR, tealG, tealB)
	p.Rect(marginL, p.GetY(), usable, 14, "F")
	p.SetFont("Helvetica", "B", 16)
	p.SetTextColor(255, 255, 255)
	p.SetXY(marginL, p.GetY()+2)
	p.CellFormat(usable, 10, utf8("CERTIFICADO DE RETENCION"), "", 0, "C", false, 0, "")
	p.Ln(18)

	// ── Certificate number & type ──
	p.SetTextColor(0, 0, 0)
	p.SetFont("Helvetica", "B", 11)
	p.CellFormat(usable/2, 7, utf8(fmt.Sprintf("Certificado N: %s", data.NumeroCertificado)), "", 0, "L", false, 0, "")
	p.CellFormat(usable/2, 7, utf8(fmt.Sprintf("Tipo: %s", tipoRetencionLabel(data.Tipo))), "", 0, "R", false, 0, "")
	p.Ln(10)

	// ── Agente de Retención (Company) ──
	sectionHeader(p, usable, "AGENTE DE RETENCION")
	p.SetFont("Helvetica", "", 10)
	p.SetTextColor(40, 40, 40)
	p.CellFormat(usable, 6, utf8(fmt.Sprintf("Razon Social: %s", data.CompanyName)), "", 2, "L", false, 0, "")
	p.CellFormat(usable, 6, utf8(fmt.Sprintf("CUIT: %s", data.CompanyCUIT)), "", 2, "L", false, 0, "")
	if data.CompanyAddress != "" {
		p.CellFormat(usable, 6, utf8(fmt.Sprintf("Domicilio: %s", data.CompanyAddress)), "", 2, "L", false, 0, "")
	}
	p.Ln(6)

	// ── Sujeto Retenido ──
	sectionHeader(p, usable, "SUJETO RETENIDO")
	p.SetFont("Helvetica", "", 10)
	p.SetTextColor(40, 40, 40)
	p.CellFormat(usable, 6, utf8(fmt.Sprintf("Nombre/Razon Social: %s", data.SujetoNombre)), "", 2, "L", false, 0, "")
	p.CellFormat(usable, 6, utf8(fmt.Sprintf("CUIT: %s", data.SujetoCUIT)), "", 2, "L", false, 0, "")
	if data.SujetoAddress != "" {
		p.CellFormat(usable, 6, utf8(fmt.Sprintf("Domicilio: %s", data.SujetoAddress)), "", 2, "L", false, 0, "")
	}
	p.Ln(6)

	// ── Detalle de la Retención ──
	sectionHeader(p, usable, "DETALLE DE LA RETENCION")
	p.Ln(2)

	// Table header
	colW := []float64{usable * 0.25, usable * 0.25, usable * 0.25, usable * 0.25}
	headers := []string{"Fecha", "Periodo", "Alicuota", ""}
	p.SetFont("Helvetica", "B", 9)
	p.SetFillColor(lightGrayR, lightGrayG, lightGrayB)
	p.SetTextColor(0, 0, 0)
	for i, h := range headers {
		p.CellFormat(colW[i], 7, utf8(h), "1", 0, "C", true, 0, "")
	}
	p.Ln(-1)

	// Table data row 1: Fecha, Periodo, Alicuota
	p.SetFont("Helvetica", "", 9)
	p.CellFormat(colW[0], 7, utf8(data.FechaRetencion), "1", 0, "C", false, 0, "")
	p.CellFormat(colW[1], 7, utf8(data.Periodo), "1", 0, "C", false, 0, "")
	p.CellFormat(colW[2], 7, utf8(fmt.Sprintf("%.2f%%", data.Alicuota)), "1", 0, "C", false, 0, "")
	p.CellFormat(colW[3], 7, "", "1", 0, "C", false, 0, "")
	p.Ln(-1)
	p.Ln(4)

	// Amounts table
	amtColW := []float64{usable * 0.5, usable * 0.5}
	amtRows := []struct {
		label string
		value float64
	}{
		{"Base Imponible", data.BaseImponible},
		{"Monto Retenido", data.MontoRetenido},
	}

	p.SetFont("Helvetica", "B", 9)
	p.SetFillColor(lightGrayR, lightGrayG, lightGrayB)
	p.CellFormat(amtColW[0], 7, utf8("Concepto"), "1", 0, "C", true, 0, "")
	p.CellFormat(amtColW[1], 7, utf8("Importe"), "1", 0, "C", true, 0, "")
	p.Ln(-1)

	p.SetFont("Helvetica", "", 10)
	for _, row := range amtRows {
		p.CellFormat(amtColW[0], 7, utf8(row.label), "1", 0, "L", false, 0, "")
		p.CellFormat(amtColW[1], 7, formatMoney(row.value), "1", 0, "R", false, 0, "")
		p.Ln(-1)
	}

	// Total row
	p.SetFont("Helvetica", "B", 11)
	p.SetFillColor(tealR, tealG, tealB)
	p.SetTextColor(255, 255, 255)
	p.CellFormat(amtColW[0], 8, utf8("TOTAL RETENIDO"), "1", 0, "L", true, 0, "")
	p.CellFormat(amtColW[1], 8, formatMoney(data.MontoRetenido), "1", 0, "R", true, 0, "")
	p.Ln(-1)

	// ── Footer ──
	p.SetY(-40)
	p.SetFont("Helvetica", "", 8)
	p.SetTextColor(120, 120, 120)
	p.CellFormat(usable, 5, utf8("Este certificado es valido como comprobante de retencion a los efectos fiscales correspondientes."), "", 2, "C", false, 0, "")

	if p.Err() {
		return nil, fmt.Errorf("pdf generation error: %w", p.Error())
	}

	var buf bytes.Buffer
	if err := p.Output(&buf); err != nil {
		return nil, fmt.Errorf("pdf output error: %w", err)
	}
	return &buf, nil
}

func sectionHeader(p *fpdf.Fpdf, usable float64, title string) {
	p.SetFont("Helvetica", "B", 10)
	p.SetFillColor(230, 230, 230)
	p.SetTextColor(tealR, tealG, tealB)
	p.CellFormat(usable, 7, utf8(title), "", 2, "L", true, 0, "")
	p.SetTextColor(0, 0, 0)
	p.Ln(2)
}

func tipoRetencionLabel(tipo string) string {
	switch tipo {
	case "GANANCIAS":
		return "Impuesto a las Ganancias"
	case "IVA":
		return "Impuesto al Valor Agregado"
	case "IIBB":
		return "Ingresos Brutos"
	case "SUSS":
		return "SUSS"
	default:
		return tipo
	}
}
