package service

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
)

func ExportToCSV(headers []string, rows [][]string) io.Reader {
	var buf bytes.Buffer
	// UTF-8 BOM for Excel compatibility
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(&buf)
	w.Write(headers)
	for _, row := range rows {
		w.Write(row)
	}
	w.Flush()
	return &buf
}

func FormatFloat(f float64) string {
	return fmt.Sprintf("%.2f", f)
}

func FormatInt(n int64) string {
	return fmt.Sprintf("%d", n)
}
