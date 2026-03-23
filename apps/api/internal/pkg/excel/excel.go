package excel

import (
	"bytes"

	"github.com/xuri/excelize/v2"
)

// GenerateExcel creates an Excel file from headers and rows.
// Returns a buffer with the .xlsx content.
func GenerateExcel(sheetName string, headers []string, rows [][]string) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := sheetName
	f.SetSheetName("Sheet1", sheet)

	// Header style (bold, teal background)
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "#FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#134E4A"}},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})

	// Write headers
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	// Write data
	for r, row := range rows {
		for c, val := range row {
			cell, _ := excelize.CoordinatesToCellName(c+1, r+2)
			f.SetCellValue(sheet, cell, val)
		}
	}

	// Auto-fit columns (approximate)
	for i := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth(sheet, col, col, 18)
	}

	buf := &bytes.Buffer{}
	if err := f.Write(buf); err != nil {
		return nil, err
	}
	return buf, nil
}
