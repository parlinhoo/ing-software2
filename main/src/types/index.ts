
export type UserRole = "teacher"|"inspector"|"orientator"|"directive"|"admin";

export type User = {
    username: string,
    password: string,
    role: UserRole,
};

export type IncidentTypes = "verbal"|"physical"|"harassment"|"discrimination"|"other";

export type Severity = "mild"|"severe"|"verysevere";

export type IncidentRole = "aggressor"|"victim"|"witness"|"participant";

export type IncidentActor = {
    name: string,
    role: IncidentRole,
}

export type IncidentStatus = "open"|"following"|"closed";

export type InterventionType = "citation"|"derivation"|"tutor_reunion"|"other";
