import { useAuth } from '../context/authContext.tsx';
import { hasPermission, type Permission, type Role } from '../auth/permissions.ts';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role?.name as Role | undefined;

  return {
    role,
    can: (permission: Permission) => hasPermission(role, permission),
  };
}