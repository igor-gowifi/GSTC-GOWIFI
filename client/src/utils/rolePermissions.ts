/**
 * Role-based access control utilities
 * Defines which roles can access which pages/features
 */

export type UserRole = 'analista' | 'admin' | 'adminmaster';

export const rolePermissions: Record<UserRole, string[]> = {
  analista: [
    'dashboard',
    'solicitacoes',
    'nova-solicitacao',
    'perfil',
  ],
  admin: [
    'dashboard',
    'tecnicos',
    'solicitacoes',
    'nova-solicitacao',
    'consulta',
    'console',
    'usuarios',
    'historico-equipamentos',
    'perfil',
  ],
  adminmaster: [
    'dashboard',
    'tecnicos',
    'solicitacoes',
    'nova-solicitacao',
    'consulta',
    'console',
    'usuarios',
    'historico-equipamentos',
    'perfil',
  ],
};

export function canAccessPage(userRole: UserRole | undefined, page: string): boolean {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(page) ?? false;
}

export function canEditSolicitacaoTecnico(userRole: UserRole | undefined): boolean {
  // Only admin and adminmaster can edit technician in solicitacao
  return userRole === 'admin' || userRole === 'adminmaster';
}

export function canViewFaturamento(userRole: UserRole | undefined): boolean {
  // Only admin and adminmaster can view faturamento
  return userRole === 'admin' || userRole === 'adminmaster';
}

export function canAccessConsole(userRole: UserRole | undefined): boolean {
  // Only admin and adminmaster can access console
  return userRole === 'admin' || userRole === 'adminmaster';
}

export function canManageUsers(userRole: UserRole | undefined): boolean {
  // Only admin and adminmaster can manage users
  return userRole === 'admin' || userRole === 'adminmaster';
}

export function canViewAdminMasterActions(userRole: UserRole | undefined): boolean {
  // Only adminmaster can see adminmaster-specific actions in console
  return userRole === 'adminmaster';
}
