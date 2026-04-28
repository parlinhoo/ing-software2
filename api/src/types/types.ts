export type UserRole = "teacher"|"inspector"|"orientator"|"directive"|"admin"

export type User = {
    username: string,
    password: string,
    role: UserRole,
}
