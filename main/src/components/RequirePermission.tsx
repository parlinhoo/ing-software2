import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions.ts';
import { useAuth } from '../context/authContext.tsx';
import type { Permission } from '../auth/permissions.ts';

type Props = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

// Envuelve cualquier región (pantalla, sección, botón) que requiera un permiso.
// Si el usuario no tiene el permiso, renderiza el `fallback`. Si no se pasa
// fallback, muestra un mensaje genérico de "Sin acceso" con opción de cerrar sesión.
export function RequirePermission({ permission, children, fallback }: Props) {
  const { can } = usePermissions();
  const { logout } = useAuth();

  if (can(permission)) return <>{children}</>;

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Acceso restringido</h2>
      <p>Tu rol no tiene permiso para ver esta sección.</p>
      <button className="btn-primario" onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  );
}