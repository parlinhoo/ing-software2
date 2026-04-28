export type IncidentTypes = "verbal"|"physical"|"harassment"|"discrimination"|"other";

export type Severity = "mild"|"severe"|"verysevere";

export type IncidentRole = "aggresor"|"victim"|"witness";

export type IncidentActor = {
    name: string,
    role: IncidentRole,
}

export type IncidentStatus = "open"|"following"|"closed";

export type InterventionType = "citation"|"derivation"|"tutor_reunion"|"other";