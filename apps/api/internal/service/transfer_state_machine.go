package service

var transferTransitions = map[string][]string{
	"PENDIENTE":   {"APROBADA", "CANCELADA"},
	"APROBADA":    {"EN_TRANSITO", "CANCELADA"},
	"EN_TRANSITO": {"COMPLETADA", "CANCELADA"},
	"COMPLETADA":  {},
	"CANCELADA":   {},
}

var transferStateRoles = map[string][]string{
	"APROBADA":    {"ADMIN", "ENCARGADO", "ENCARGADO_DEPOSITO"},
	"EN_TRANSITO": {"ADMIN", "ENCARGADO", "ENCARGADO_DEPOSITO"},
	"COMPLETADA":  {"ADMIN", "ENCARGADO", "ENCARGADO_DEPOSITO"},
	"CANCELADA":   {"ADMIN", "ENCARGADO", "ENCARGADO_DEPOSITO"},
}

func canTransferTransition(from, to string) bool {
	targets, ok := transferTransitions[from]
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

func canRoleTransferTo(role, target string) bool {
	if role == "ADMIN" {
		return true
	}
	roles, ok := transferStateRoles[target]
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
