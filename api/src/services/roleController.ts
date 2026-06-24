/*
export function getActionDescription(act: Action): string {
    switch (act) {
        case "create-incident": return "Registrar incidente.";
        case "edit-incident": return "Editar incidente.";
        case "delete-incident": return "Eliminar incidente.";
        case "set-incident-state": return "Gestionar estado de incidente.";
        case "add-intervention": return "Registrar intervención.";
        case "edit-intervention": return "Editar intervención.";
        case "add-positive-remark": return "Registrar anotación positiva.";
        case "get-student-history": return "Consultar historial del estudiante.";
        case "view-dashboard": return "Visualizar monitor de convivencia.";
        case "edit-incident-types": return "Configurar tipos de incidente.";
        case "edit-case-states": return "Administrar estados de casos.";
        case "edit-users": return "Gestionar cuentas.";
    }
}

export function getRoleActions(role: UserRole): Action[] {
    switch (role) {
        case "teacher":// Docente
            return ["create-incident", "edit-incident", "delete-incident", "add-positive-remark", "get-student-history"];
        case "inspector": // Inspector
            return ["create-incident", "edit-incident", "delete-incident"];
        case "orientator": // Orientador
            return ["add-intervention", "edit-intervention", "set-incident-state", "view-dashboard", "get-student-history"];
        case "directive": // Equipo Directivo
            return ["get-student-history", "view-dashboard"];
        case "admin": // Administrador
            return ["edit-users", "edit-incident-types", "edit-case-states"];
    }
}
*/