package service

import "fmt"

var orderTransitions = map[string][]string{
	"PENDIENTE_APROBACION":     {"EN_EVALUACION", "APROBADO", "RECHAZADO", "CANCELADO"},
	"EN_EVALUACION":            {"APROBADO", "RECHAZADO", "CANCELADO"},
	"APROBADO":                 {"APROBADO_REPARTIDOR", "EN_CONSOLIDACION", "EN_PREPARACION", "CANCELADO"},
	"APROBADO_REPARTIDOR":      {"EN_CONSOLIDACION", "EN_PREPARACION", "CANCELADO"},
	"EN_CONSOLIDACION":         {"EN_PREPARACION", "CANCELADO"},
	"EN_PREPARACION":           {"LISTO_PARA_ENVIO", "PENDIENTE_ABASTECIMIENTO", "CANCELADO"},
	"PENDIENTE_ABASTECIMIENTO": {"ABASTECIDO", "CANCELADO"},
	"ABASTECIDO":               {"EN_PREPARACION"},
	"LISTO_PARA_ENVIO":         {"ENVIADO", "CANCELADO"},
	"ENVIADO":                  {"ENTREGADO", "ENTREGADO_PARCIALMENTE", "NO_ENTREGADO", "RECLAMADO"},
	"ENTREGADO_PARCIALMENTE":   {"ENTREGADO", "NO_ENTREGADO", "RECLAMADO"},
	"NO_ENTREGADO":             {"ENVIADO", "CANCELADO"},
	"RECLAMADO":                {"ENVIADO", "CANCELADO"},
	"ENTREGADO":                {},
	"CANCELADO":                {},
	"RECHAZADO":                {},
}

var stateRoleAuth = map[string][]string{
	"EN_EVALUACION":            {"ADMIN", "SUPERVISOR", "JEFE_VENTAS"},
	"APROBADO":                 {"ADMIN", "SUPERVISOR", "JEFE_VENTAS"},
	"APROBADO_REPARTIDOR":      {"ADMIN", "REPARTIDOR"},
	"RECHAZADO":                {"ADMIN", "SUPERVISOR", "JEFE_VENTAS"},
	"EN_CONSOLIDACION":         {"ADMIN", "SUPERVISOR", "DEPOSITO"},
	"EN_PREPARACION":           {"ADMIN", "SUPERVISOR", "DEPOSITO"},
	"PENDIENTE_ABASTECIMIENTO": {"ADMIN", "DEPOSITO"},
	"ABASTECIDO":               {"ADMIN", "DEPOSITO"},
	"LISTO_PARA_ENVIO":         {"ADMIN", "DEPOSITO"},
	"ENVIADO":                  {"ADMIN", "DEPOSITO", "REPARTIDOR"},
	"ENTREGADO":                {"ADMIN", "REPARTIDOR"},
	"ENTREGADO_PARCIALMENTE":   {"ADMIN", "REPARTIDOR"},
	"NO_ENTREGADO":             {"ADMIN", "REPARTIDOR"},
	"RECLAMADO":                {"ADMIN", "SUPERVISOR", "VENDEDOR", "VENDEDOR_CALLE"},
	"CANCELADO":                {"ADMIN", "SUPERVISOR"},
}

// Post-approval states where stock has been decremented
var postApprovalStates = map[string]bool{
	"APROBADO": true, "APROBADO_REPARTIDOR": true,
	"EN_CONSOLIDACION": true, "EN_PREPARACION": true,
	"LISTO_PARA_ENVIO": true, "ENVIADO": true,
	"ENTREGADO": true, "ENTREGADO_PARCIALMENTE": true,
	"PENDIENTE_ABASTECIMIENTO": true, "ABASTECIDO": true,
	"NO_ENTREGADO": true, "RECLAMADO": true,
}

func canTransition(from, to string) bool {
	allowed, ok := orderTransitions[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

func canRoleTransitionTo(role, targetState string) bool {
	roles, ok := stateRoleAuth[targetState]
	if !ok {
		return false
	}
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

func isPostApprovalState(state string) bool {
	return postApprovalStates[state]
}

func validateTransition(from, to, role string) error {
	if !canTransition(from, to) {
		return fmt.Errorf("%w: %s → %s", ErrInvalidTransition, from, to)
	}
	if !canRoleTransitionTo(role, to) {
		return fmt.Errorf("%w: role %s cannot transition to %s", ErrUnauthorizedTransition, role, to)
	}
	return nil
}
