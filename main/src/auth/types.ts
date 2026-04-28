export type Action = 
    "create-incident"|"edit-incident"|"delete-incident"|"set-incident-state"|
    "add-intervention"|"edit-intervention"|"add-positive-remark"|"get-student-history"|
    "view-dashboard"|"edit-incident-types"|"edit-case-states"|"edit-users";

export type UserRole = "teacher"|"inspector"|"orientator"|"directive"|"admin";

export type User = {
    username: string,
    password: string,
    role: UserRole,
};