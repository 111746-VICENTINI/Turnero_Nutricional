//el back no tiene enum
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretaria',
  PROFESSIONAL: 'Profesional'
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
