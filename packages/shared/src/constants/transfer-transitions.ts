import { EstadoTransferencia } from "./enums";
import type { Rol } from "./roles";

export const TRANSFER_TRANSITIONS: Record<string, string[]> = {
  [EstadoTransferencia.PENDIENTE]: [
    EstadoTransferencia.APROBADA,
    EstadoTransferencia.CANCELADA,
  ],
  [EstadoTransferencia.APROBADA]: [
    EstadoTransferencia.EN_TRANSITO,
    EstadoTransferencia.CANCELADA,
  ],
  [EstadoTransferencia.EN_TRANSITO]: [
    EstadoTransferencia.COMPLETADA,
    EstadoTransferencia.CANCELADA,
  ],
  [EstadoTransferencia.COMPLETADA]: [],
  [EstadoTransferencia.CANCELADA]: [],
};

export const TRANSFER_STATE_ROLE_AUTHORIZATION: Record<string, Rol[]> = {
  [EstadoTransferencia.APROBADA]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
  [EstadoTransferencia.EN_TRANSITO]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
  [EstadoTransferencia.COMPLETADA]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
  [EstadoTransferencia.CANCELADA]: ["ADMIN", "SUPERVISOR", "DEPOSITO"],
};

export function canTransferTransition(from: string, to: string): boolean {
  return TRANSFER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleTransitionTransfer(role: Rol, targetState: string): boolean {
  return TRANSFER_STATE_ROLE_AUTHORIZATION[targetState]?.includes(role) ?? false;
}
