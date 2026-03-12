package validator

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/nexora-erp/nexora/internal/pkg/response"
)

var validate = validator.New()

func DecodeAndValidate(r *http.Request, dst interface{}) []response.ValidationError {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return []response.ValidationError{{Field: "body", Message: "unable to read request body"}}
	}
	defer r.Body.Close()

	if err := json.Unmarshal(body, dst); err != nil {
		return []response.ValidationError{{Field: "body", Message: "invalid JSON"}}
	}

	if err := validate.Struct(dst); err != nil {
		return translateErrors(err)
	}

	return nil
}

func translateErrors(err error) []response.ValidationError {
	var errors []response.ValidationError

	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return []response.ValidationError{{Field: "unknown", Message: err.Error()}}
	}

	for _, e := range validationErrors {
		errors = append(errors, response.ValidationError{
			Field:   toSnakeCase(e.Field()),
			Message: msgForTag(e),
		})
	}

	return errors
}

func msgForTag(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "este campo es requerido"
	case "email":
		return "email inválido"
	case "min":
		return "debe tener al menos " + e.Param() + " caracteres"
	case "max":
		return "no puede tener más de " + e.Param() + " caracteres"
	case "gte":
		return "debe ser mayor o igual a " + e.Param()
	case "lte":
		return "debe ser menor o igual a " + e.Param()
	default:
		return "valor inválido"
	}
}

func toSnakeCase(s string) string {
	var result []byte
	for i, c := range s {
		if c >= 'A' && c <= 'Z' {
			if i > 0 {
				result = append(result, '_')
			}
			result = append(result, byte(c+32))
		} else {
			result = append(result, byte(c))
		}
	}
	return string(result)
}
