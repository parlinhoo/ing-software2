type UserRole = "teacher"|"inspector"|"orientator"|"directive"|"admin"

type User = {
    username: string,
    password: string,
    role: UserRole,
}

const users: User[] = [
    { username: "teacher", password: "1234", role: "teacher" },
    { username: "inspector", password: "1234", role: "inspector" },
    { username: "orientator", password: "1234", role: "orientator" },
    { username: "directive", password: "1234", role: "directive" },
    { username: "admin", password: "1234", role: "admin" },
]

export function authenticate(name: string, password: string) {
    const isInUsers = users.find((value: User) => (name === value.username && password === value.password));
    return isInUsers?.role;
}