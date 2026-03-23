package cuit

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrInvalidLength = errors.New("CUIT debe tener 11 digitos")
	ErrInvalidDigit  = errors.New("CUIT contiene caracteres no numericos")
	ErrCheckDigit    = errors.New("CUIT invalido: digito verificador incorrecto")
)

var weights = [10]int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}

// Validate checks that a CUIT/CUIL string is valid using the modulo-11 algorithm.
// Accepts formats: XXXXXXXXXXX, XX-XXXXXXXX-X, or XXXXXXXXXX-X.
func Validate(cuit string) error {
	if cuit == "" {
		return nil // empty is allowed (optional field)
	}

	clean := strings.ReplaceAll(cuit, "-", "")
	if len(clean) != 11 {
		return ErrInvalidLength
	}

	digits := make([]int, 11)
	for i, c := range clean {
		if c < '0' || c > '9' {
			return ErrInvalidDigit
		}
		digits[i] = int(c - '0')
	}

	sum := 0
	for i := 0; i < 10; i++ {
		sum += digits[i] * weights[i]
	}

	remainder := sum % 11
	var expected int
	switch remainder {
	case 0:
		expected = 0
	case 1:
		expected = 9
	default:
		expected = 11 - remainder
	}

	if digits[10] != expected {
		return fmt.Errorf("%w (esperado %d, recibido %d)", ErrCheckDigit, expected, digits[10])
	}

	return nil
}

// Format returns a CUIT in XX-XXXXXXXX-X format.
func Format(cuit string) string {
	clean := strings.ReplaceAll(cuit, "-", "")
	if len(clean) != 11 {
		return cuit
	}
	return clean[:2] + "-" + clean[2:10] + "-" + clean[10:]
}
