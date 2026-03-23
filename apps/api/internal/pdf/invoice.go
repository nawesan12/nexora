package pdf

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/go-pdf/fpdf"
)

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

// InvoiceData holds every field needed to render an Argentine fiscal invoice.
type InvoiceData struct {
	CompanyName    string
	CompanyCUIT    string
	CompanyIVA     string
	CompanyAddress string
	CompanyPhone   string
	CompanyEmail   string
	FooterText     string

	Tipo          string // "FACTURA", "NOTA_CREDITO", "NOTA_DEBITO", "RECIBO"
	Letra         string // "A", "B", "C"
	Numero        string // "0001-00000001"
	Estado        string
	FechaEmision  string
	CondicionPago string

	ClienteNombre  string
	ClienteCUIT    string
	ClienteIVA     string
	ClienteAddress string

	Items          []InvoiceItem
	Subtotal       float64
	DescuentoMonto float64
	BaseImponible  float64
	Impuestos      []InvoiceTax
	TotalImpuestos float64
	Total          float64

	CAE         string
	FechaVtoCae string
	Observaciones string
}

// InvoiceItem represents a single line item.
type InvoiceItem struct {
	Codigo              string
	Nombre              string
	Unidad              string
	Cantidad            float64
	PrecioUnitario      float64
	DescuentoPorcentaje float64
	Subtotal            float64
}

// InvoiceTax represents one tax line (e.g. IVA 21%).
type InvoiceTax struct {
	Nombre        string
	Porcentaje    float64
	BaseImponible float64
	Monto         float64
}

// ──────────────────────────────────────────────
// Colors
// ──────────────────────────────────────────────

// Brand: Deep Teal #134E4A  →  r19 g78 b74
// Accent: Amber  #D97706   →  r217 g119 b6

const (
	tealR, tealG, tealB       = 19, 78, 74
	amberR, amberG, amberB    = 217, 119, 6
	lightGrayR, lightGrayG, lightGrayB = 245, 245, 245
	altRowR, altRowG, altRowB = 248, 248, 248
)

// ──────────────────────────────────────────────
// Currency formatting  (Argentine style)
// ──────────────────────────────────────────────

// formatMoney returns an Argentine-style money string: "$1.234,56".
func formatMoney(f float64) string {
	negative := f < 0
	if negative {
		f = -f
	}

	// Split integer and decimal parts (2 decimal places).
	intPart := int64(f)
	decPart := int64((f - float64(intPart) + 0.005) * 100) // round
	if decPart >= 100 {
		intPart++
		decPart -= 100
	}

	// Format integer with dot as thousands separator.
	raw := fmt.Sprintf("%d", intPart)
	var sb strings.Builder
	for i, ch := range raw {
		if i > 0 && (len(raw)-i)%3 == 0 {
			sb.WriteByte('.')
		}
		sb.WriteRune(ch)
	}

	sign := ""
	if negative {
		sign = "-"
	}
	return fmt.Sprintf("%s$%s,%02d", sign, sb.String(), decPart)
}

// tipoLabel returns a human-readable label for the document type.
func tipoLabel(tipo string) string {
	switch tipo {
	case "FACTURA":
		return "FACTURA"
	case "NOTA_CREDITO":
		return "NOTA DE CREDITO"
	case "NOTA_DEBITO":
		return "NOTA DE DEBITO"
	case "RECIBO":
		return "RECIBO"
	default:
		return tipo
	}
}

// ──────────────────────────────────────────────
// A4 Invoice PDF
// ──────────────────────────────────────────────

// GenerateInvoicePDF renders a full A4-size Argentine invoice and returns the
// PDF contents in a bytes.Buffer.
func GenerateInvoicePDF(data InvoiceData) (*bytes.Buffer, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 15)

	renderInvoicePage(pdf, data)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("pdf generation failed: %w", err)
	}
	return &buf, nil
}

// GenerateBatchPDF renders multiple invoices into a single PDF, one per page.
func GenerateBatchPDF(invoices []InvoiceData) (*bytes.Buffer, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 15)

	for _, data := range invoices {
		renderInvoicePage(pdf, data)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("batch pdf generation failed: %w", err)
	}
	return &buf, nil
}

// renderInvoicePage adds a new page to the PDF and renders one invoice.
func renderInvoicePage(pdf *fpdf.Fpdf, data InvoiceData) {
	pdf.AddPage()

	pageW, _ := pdf.GetPageSize()
	marginL, _, marginR, _ := pdf.GetMargins()
	usable := pageW - marginL - marginR // ~190mm

	// ── 1. Header row (split 50/50) ──────────────────────────────

	headerY := pdf.GetY()
	halfW := usable / 2

	// LEFT: company info
	pdf.SetFont("Helvetica", "B", 14)
	pdf.SetTextColor(tealR, tealG, tealB)
	pdf.SetXY(marginL, headerY)
	pdf.CellFormat(halfW, 7, utf8(data.CompanyName), "", 2, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(60, 60, 60)
	pdf.CellFormat(halfW, 5, utf8(fmt.Sprintf("CUIT: %s", data.CompanyCUIT)), "", 2, "L", false, 0, "")
	pdf.CellFormat(halfW, 5, utf8(fmt.Sprintf("Cond. IVA: %s", data.CompanyIVA)), "", 2, "L", false, 0, "")
	pdf.CellFormat(halfW, 5, utf8(data.CompanyAddress), "", 2, "L", false, 0, "")
	if data.CompanyPhone != "" {
		pdf.CellFormat(halfW, 5, utf8(fmt.Sprintf("Tel: %s", data.CompanyPhone)), "", 2, "L", false, 0, "")
	}
	if data.CompanyEmail != "" {
		pdf.CellFormat(halfW, 5, utf8(data.CompanyEmail), "", 2, "L", false, 0, "")
	}
	leftEndY := pdf.GetY()

	// RIGHT: invoice type box
	rightX := marginL + halfW
	boxW := halfW
	boxH := 38.0

	// Outer border
	pdf.SetDrawColor(tealR, tealG, tealB)
	pdf.SetLineWidth(0.6)
	pdf.Rect(rightX, headerY, boxW, boxH, "D")

	// Large letter centered
	pdf.SetFont("Helvetica", "B", 28)
	pdf.SetTextColor(tealR, tealG, tealB)
	letterH := 16.0
	pdf.SetXY(rightX, headerY+2)
	pdf.CellFormat(boxW, letterH, data.Letra, "", 2, "C", false, 0, "")

	// Tipo label
	pdf.SetFont("Helvetica", "B", 11)
	pdf.SetXY(rightX, headerY+2+letterH)
	pdf.CellFormat(boxW, 6, utf8(tipoLabel(data.Tipo)), "", 2, "C", false, 0, "")

	// Numero
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetTextColor(60, 60, 60)
	pdf.SetXY(rightX, headerY+2+letterH+7)
	pdf.CellFormat(boxW, 6, utf8(fmt.Sprintf("N %s", data.Numero)), "", 2, "C", false, 0, "")

	endHeaderY := leftEndY
	if headerY+boxH > endHeaderY {
		endHeaderY = headerY + boxH
	}
	pdf.SetY(endHeaderY + 3)

	// ── 2. Date row ──────────────────────────────────────────────

	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(40, 40, 40)
	dateY := pdf.GetY()
	pdf.SetXY(marginL, dateY)
	pdf.CellFormat(halfW, 6, utf8(fmt.Sprintf("Fecha de Emision: %s", data.FechaEmision)), "", 0, "L", false, 0, "")
	pdf.SetXY(marginL+halfW, dateY)
	pdf.CellFormat(halfW, 6, utf8(fmt.Sprintf("Condicion de Pago: %s", data.CondicionPago)), "", 0, "R", false, 0, "")
	pdf.Ln(8)

	// ── 3. Client box ────────────────────────────────────────────

	pdf.SetFillColor(lightGrayR, lightGrayG, lightGrayB)
	clientY := pdf.GetY()
	clientH := 22.0
	pdf.Rect(marginL, clientY, usable, clientH, "F")

	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetTextColor(40, 40, 40)
	pdf.SetXY(marginL+2, clientY+2)
	pdf.CellFormat(90, 5, utf8(fmt.Sprintf("Nombre / Razon Social: %s", data.ClienteNombre)), "", 2, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(90, 5, utf8(fmt.Sprintf("CUIT: %s", data.ClienteCUIT)), "", 2, "L", false, 0, "")

	pdf.SetXY(marginL+halfW, clientY+2)
	pdf.CellFormat(90, 5, utf8(fmt.Sprintf("Cond. IVA: %s", data.ClienteIVA)), "", 2, "L", false, 0, "")
	pdf.CellFormat(90, 5, utf8(fmt.Sprintf("Domicilio: %s", data.ClienteAddress)), "", 2, "L", false, 0, "")

	pdf.SetY(clientY + clientH + 4)

	// ── 4. Items table ───────────────────────────────────────────

	colW := []float64{20, 60, 20, 20, 25, 15, 30} // total = 190
	headers := []string{"Codigo", "Descripcion", "Cant.", "Unidad", "P.Unit", "Dto%", "Subtotal"}
	aligns := []string{"L", "L", "R", "C", "R", "R", "R"}

	// Header row
	pdf.SetFillColor(tealR, tealG, tealB)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 8)
	for i, h := range headers {
		pdf.CellFormat(colW[i], 7, h, "", 0, aligns[i], true, 0, "")
	}
	pdf.Ln(-1)

	// Data rows
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(40, 40, 40)
	for idx, item := range data.Items {
		if idx%2 == 1 {
			pdf.SetFillColor(altRowR, altRowG, altRowB)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		fill := true
		pdf.CellFormat(colW[0], 6, utf8(item.Codigo), "", 0, "L", fill, 0, "")
		pdf.CellFormat(colW[1], 6, utf8(truncate(item.Nombre, 38)), "", 0, "L", fill, 0, "")
		pdf.CellFormat(colW[2], 6, fmtQty(item.Cantidad), "", 0, "R", fill, 0, "")
		pdf.CellFormat(colW[3], 6, utf8(item.Unidad), "", 0, "C", fill, 0, "")
		pdf.CellFormat(colW[4], 6, formatMoney(item.PrecioUnitario), "", 0, "R", fill, 0, "")
		pdf.CellFormat(colW[5], 6, fmtPct(item.DescuentoPorcentaje), "", 0, "R", fill, 0, "")
		pdf.CellFormat(colW[6], 6, formatMoney(item.Subtotal), "", 0, "R", fill, 0, "")
		pdf.Ln(-1)
	}
	pdf.Ln(3)

	// ── 5. Tax breakdown (right-aligned) ─────────────────────────

	taxColX := marginL + usable - 80
	taxLabelW := 50.0
	taxValueW := 30.0

	if len(data.Impuestos) > 0 {
		pdf.SetFont("Helvetica", "", 8)
		pdf.SetTextColor(60, 60, 60)
		for _, tax := range data.Impuestos {
			label := fmt.Sprintf("%s %.0f%%:", tax.Nombre, tax.Porcentaje)
			pdf.SetX(taxColX)
			pdf.CellFormat(taxLabelW, 5, utf8(label), "", 0, "R", false, 0, "")
			pdf.CellFormat(taxValueW, 5, formatMoney(tax.Monto), "", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
		pdf.Ln(2)
	}

	// ── 6. Totals box ────────────────────────────────────────────

	totalsX := marginL + usable - 80
	totalsW := 80.0
	totalsY := pdf.GetY()

	pdf.SetDrawColor(tealR, tealG, tealB)
	pdf.SetLineWidth(0.4)

	// Calculate box height based on content rows.
	rowH := 6.0
	rows := 4 // subtotal, descuento, base imponible, impuestos
	totalRowH := 8.0
	boxPad := 3.0
	totalsBoxH := boxPad + float64(rows)*rowH + totalRowH + boxPad
	pdf.Rect(totalsX, totalsY, totalsW, totalsBoxH, "D")

	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(40, 40, 40)
	curY := totalsY + boxPad

	writeTotalLine := func(label, value string, bold bool) {
		if bold {
			pdf.SetFont("Helvetica", "B", 11)
		} else {
			pdf.SetFont("Helvetica", "", 9)
		}
		pdf.SetXY(totalsX+3, curY)
		pdf.CellFormat(taxLabelW-6, rowH, utf8(label), "", 0, "R", false, 0, "")
		pdf.CellFormat(taxValueW, rowH, value, "", 0, "R", false, 0, "")
		if bold {
			curY += totalRowH
		} else {
			curY += rowH
		}
	}

	writeTotalLine("Subtotal:", formatMoney(data.Subtotal), false)
	writeTotalLine("Descuento:", formatMoney(data.DescuentoMonto), false)
	writeTotalLine("Base Imponible:", formatMoney(data.BaseImponible), false)
	writeTotalLine("Impuestos:", formatMoney(data.TotalImpuestos), false)
	pdf.SetTextColor(tealR, tealG, tealB)
	writeTotalLine("TOTAL:", formatMoney(data.Total), true)

	pdf.SetY(totalsY + totalsBoxH + 5)

	// ── 7. CAE section ───────────────────────────────────────────

	if data.CAE != "" {
		pdf.SetDrawColor(200, 200, 200)
		pdf.SetLineWidth(0.2)
		pdf.Line(marginL, pdf.GetY(), marginL+usable, pdf.GetY())
		pdf.Ln(3)

		pdf.SetFont("Helvetica", "B", 9)
		pdf.SetTextColor(40, 40, 40)
		pdf.CellFormat(usable, 5, utf8(fmt.Sprintf("CAE: %s", data.CAE)), "", 2, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 9)
		pdf.CellFormat(usable, 5, utf8(fmt.Sprintf("Fecha Vto. CAE: %s", data.FechaVtoCae)), "", 2, "L", false, 0, "")

		// Barcode (Code 128 text representation)
		pdf.Ln(2)
		pdf.SetFont("Courier", "", 10)
		pdf.CellFormat(usable, 6, utf8(fmt.Sprintf("|||  %s  |||", data.CAE)), "", 2, "C", false, 0, "")
		pdf.Ln(2)
	}

	// ── 8. Observaciones ─────────────────────────────────────────

	if data.Observaciones != "" {
		pdf.SetFont("Helvetica", "I", 8)
		pdf.SetTextColor(100, 100, 100)
		pdf.MultiCell(usable, 4, utf8(data.Observaciones), "", "L", false)
		pdf.Ln(2)
	}

	// ── 9. Footer ────────────────────────────────────────────────

	if data.FooterText != "" {
		pdf.SetFont("Helvetica", "", 7)
		pdf.SetTextColor(150, 150, 150)
		pdf.MultiCell(usable, 4, utf8(data.FooterText), "", "C", false)
	}

}

// ──────────────────────────────────────────────
// Ticket (thermal printer) PDF – 58 mm width
// ──────────────────────────────────────────────

// GenerateTicketPDF renders a narrow thermal-printer-style receipt.
// Page width is 58mm; printable area ~50mm.
func GenerateTicketPDF(data InvoiceData) (*bytes.Buffer, error) {
	pdf := fpdf.NewCustom(&fpdf.InitType{
		OrientationStr: "P",
		UnitStr:        "mm",
		Size:           fpdf.SizeType{Wd: 58, Ht: 200},
	})
	pdf.SetMargins(4, 4, 4)
	pdf.SetAutoPageBreak(true, 4)
	pdf.AddPage()

	w := 50.0 // printable width

	separator := func() {
		pdf.SetFont("Courier", "", 7)
		pdf.SetTextColor(100, 100, 100)
		pdf.CellFormat(w, 4, strings.Repeat("-", 30), "", 2, "C", false, 0, "")
	}

	// Company name
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetTextColor(tealR, tealG, tealB)
	pdf.CellFormat(w, 5, utf8(data.CompanyName), "", 2, "C", false, 0, "")

	// Company CUIT
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(60, 60, 60)
	pdf.CellFormat(w, 4, utf8(fmt.Sprintf("CUIT: %s", data.CompanyCUIT)), "", 2, "C", false, 0, "")

	separator()

	// Tipo + Letra + Numero
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(40, 40, 40)
	pdf.CellFormat(w, 5, utf8(fmt.Sprintf("%s %s", tipoLabel(data.Tipo), data.Letra)), "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 7)
	pdf.CellFormat(w, 4, utf8(fmt.Sprintf("N %s", data.Numero)), "", 2, "C", false, 0, "")

	// Date
	pdf.CellFormat(w, 4, utf8(data.FechaEmision), "", 2, "C", false, 0, "")

	separator()

	// Items
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(40, 40, 40)
	for _, item := range data.Items {
		pdf.CellFormat(w, 4, utf8(truncate(item.Nombre, 30)), "", 2, "L", false, 0, "")
		detail := fmt.Sprintf("  %s x %s = %s", fmtQty(item.Cantidad), formatMoney(item.PrecioUnitario), formatMoney(item.Subtotal))
		pdf.CellFormat(w, 4, utf8(detail), "", 2, "L", false, 0, "")
	}

	separator()

	// Total
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetTextColor(tealR, tealG, tealB)
	pdf.CellFormat(w, 6, utf8(fmt.Sprintf("TOTAL: %s", formatMoney(data.Total))), "", 2, "R", false, 0, "")

	// CAE
	if data.CAE != "" {
		separator()
		pdf.SetFont("Helvetica", "", 6)
		pdf.SetTextColor(80, 80, 80)
		pdf.CellFormat(w, 4, utf8(fmt.Sprintf("CAE: %s", data.CAE)), "", 2, "L", false, 0, "")
		pdf.CellFormat(w, 4, utf8(fmt.Sprintf("Vto: %s", data.FechaVtoCae)), "", 2, "L", false, 0, "")
	}

	pdf.Ln(2)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("ticket pdf generation failed: %w", err)
	}
	return &buf, nil
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// utf8 is a pass-through; fpdf handles UTF-8 for built-in fonts with
// latin characters. For full Unicode support an external font would be
// registered. Argentine invoices use Latin-1 characters which work fine.
func utf8(s string) string {
	return s
}

// truncate shortens a string to maxLen characters, appending "..." if needed.
func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen-3]) + "..."
}

// fmtQty formats a quantity (avoids trailing zeros for whole numbers).
func fmtQty(q float64) string {
	if q == float64(int64(q)) {
		return fmt.Sprintf("%d", int64(q))
	}
	return fmt.Sprintf("%.2f", q)
}

// fmtPct formats a percentage for display.
func fmtPct(p float64) string {
	if p == 0 {
		return "-"
	}
	if p == float64(int64(p)) {
		return fmt.Sprintf("%d%%", int64(p))
	}
	return fmt.Sprintf("%.1f%%", p)
}
