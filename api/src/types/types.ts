export type UserRole = "teacher"|"inspector"|"orientator"|"directive"|"admin"

export type User = {
    username: string,
    password: string,
    role: UserRole,
}

export type Severity = "mild" | "severe" | "very_severe"

export type Actor = {
  name: string,
  role: "aggressor" | "victim" | "witness",
}

export type Incident = {
  incidentId: number,
  incidentType: string,
  severity: Severity,
  actors: Actor[],
  date: string,
  place: string,
  description: string,
}