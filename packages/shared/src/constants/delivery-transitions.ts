import { EstadoReparto } from "./enums";
import type { Rol } from "./roles";

export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  [EstadoReparto.PLANIFICADO]: [
    EstadoReparto.EN_CURSO,
    EstadoReparto.CANCELADO,
  ],
  [EstadoReparto.EN_CURSO]: [
    EstadoReparto.FINALIZADO,
    EstadoReparto.CANCELADO,
  ],
  [EstadoReparto.FINALIZADO]: [],
  [EstadoReparto.CANCELADO]: [],
};

export const DELIVERY_STATE_ROLE_AUTHORIZATION: Record<string, Rol[]> = {
  [EstadoReparto.EN_CURSO]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS", "REPARTIDOR"],
  [EstadoReparto.FINALIZADO]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS", "REPARTIDOR"],
  [EstadoReparto.CANCELADO]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS"],
};

export function canDeliveryTransition(from: string, to: string): boolean {
  return DELIVERY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleTransitionDelivery(role: Rol, targetState: string): boolean {
  return DELIVERY_STATE_ROLE_AUTHORIZATION[targetState]?.includes(role) ?? false;
}
