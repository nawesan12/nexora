package service

var deliveryTransitions = map[string][]string{
	"PLANIFICADO": {"EN_CURSO", "CANCELADO"},
	"EN_CURSO":    {"FINALIZADO", "CANCELADO"},
	"FINALIZADO":  {},
	"CANCELADO":   {},
}

var deliveryStateRoles = map[string][]string{
	"EN_CURSO":   {"ADMIN", "ENCARGADO", "ENCARGADO_DE_CALLE", "REPARTIDOR"},
	"FINALIZADO": {"ADMIN", "ENCARGADO", "ENCARGADO_DE_CALLE", "REPARTIDOR"},
	"CANCELADO":  {"ADMIN", "ENCARGADO", "ENCARGADO_DE_CALLE"},
}

func canDeliveryTransition(from, to string) bool {
	targets, ok := deliveryTransitions[from]
	if !ok {
		return false
	}
	for _, t := range targets {
		if t == to {
			return true
		}
	}
	return false
}

func canRoleDeliveryTo(role, target string) bool {
	if role == "ADMIN" {
		return true
	}
	roles, ok := deliveryStateRoles[target]
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
