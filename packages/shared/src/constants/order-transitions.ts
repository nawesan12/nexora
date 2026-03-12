import { EstadoPedido } from "./order-status";
import type { Rol } from "./roles";

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  [EstadoPedido.PENDIENTE_APROBACION]: [
    EstadoPedido.EN_EVALUACION,
    EstadoPedido.APROBADO,
    EstadoPedido.RECHAZADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.EN_EVALUACION]: [
    EstadoPedido.APROBADO,
    EstadoPedido.RECHAZADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.APROBADO]: [
    EstadoPedido.APROBADO_REPARTIDOR,
    EstadoPedido.EN_CONSOLIDACION,
    EstadoPedido.EN_PREPARACION,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.APROBADO_REPARTIDOR]: [
    EstadoPedido.EN_CONSOLIDACION,
    EstadoPedido.EN_PREPARACION,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.EN_CONSOLIDACION]: [
    EstadoPedido.EN_PREPARACION,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.EN_PREPARACION]: [
    EstadoPedido.LISTO_PARA_ENVIO,
    EstadoPedido.PENDIENTE_ABASTECIMIENTO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.PENDIENTE_ABASTECIMIENTO]: [
    EstadoPedido.ABASTECIDO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.ABASTECIDO]: [
    EstadoPedido.EN_PREPARACION,
  ],
  [EstadoPedido.LISTO_PARA_ENVIO]: [
    EstadoPedido.ENVIADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.ENVIADO]: [
    EstadoPedido.ENTREGADO,
    EstadoPedido.ENTREGADO_PARCIALMENTE,
    EstadoPedido.NO_ENTREGADO,
    EstadoPedido.RECLAMADO,
  ],
  [EstadoPedido.ENTREGADO_PARCIALMENTE]: [
    EstadoPedido.ENTREGADO,
    EstadoPedido.NO_ENTREGADO,
    EstadoPedido.RECLAMADO,
  ],
  [EstadoPedido.NO_ENTREGADO]: [
    EstadoPedido.ENVIADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.RECLAMADO]: [
    EstadoPedido.ENVIADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.ENTREGADO]: [],
  [EstadoPedido.CANCELADO]: [],
  [EstadoPedido.RECHAZADO]: [],
};

export const STATE_ROLE_AUTHORIZATION: Record<string, Rol[]> = {
  [EstadoPedido.EN_EVALUACION]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS"],
  [EstadoPedido.APROBADO]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS"],
  [EstadoPedido.APROBADO_REPARTIDOR]: ["ADMIN", "REPARTIDOR"],
  [EstadoPedido.RECHAZADO]: ["ADMIN", "SUPERVISOR", "JEFE_VENTAS"],
  [EstadoPedido.EN_CONSOLIDACION]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
  [EstadoPedido.EN_PREPARACION]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
  [EstadoPedido.PENDIENTE_ABASTECIMIENTO]: ["ADMIN", "DEPOSITO"],
  [EstadoPedido.ABASTECIDO]: ["ADMIN", "DEPOSITO"],
  [EstadoPedido.LISTO_PARA_ENVIO]: ["ADMIN", "DEPOSITO"],
  [EstadoPedido.ENVIADO]: ["ADMIN", "DEPOSITO", "REPARTIDOR"],
  [EstadoPedido.ENTREGADO]: ["ADMIN", "REPARTIDOR"],
  [EstadoPedido.ENTREGADO_PARCIALMENTE]: ["ADMIN", "REPARTIDOR"],
  [EstadoPedido.NO_ENTREGADO]: ["ADMIN", "REPARTIDOR"],
  [EstadoPedido.RECLAMADO]: ["ADMIN", "SUPERVISOR", "VENDEDOR", "VENDEDOR_CALLE"],
  [EstadoPedido.CANCELADO]: ["ADMIN", "SUPERVISOR"],
};

export function canTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleTransitionTo(role: Rol, targetState: string): boolean {
  return STATE_ROLE_AUTHORIZATION[targetState]?.includes(role) ?? false;
}

export function getAvailableTransitions(currentState: string, role: Rol): string[] {
  const transitions = ORDER_TRANSITIONS[currentState] || [];
  return transitions.filter((state) => canRoleTransitionTo(role, state));
}
