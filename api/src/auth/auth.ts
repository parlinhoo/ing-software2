import { User, UserRole } from "../types/types";

const users: User[] = [
    { username: "teacher", password: "1234", role: "teacher" },
    { username: "inspector", password: "1234", role: "inspector" },
    { username: "orientator", password: "1234", role: "orientator" },
    { username: "directive", password: "1234", role: "directive" },
    { username: "admin", password: "1234", role: "admin" },
]

export function authenticate(username: string, password: string): UserRole|undefined {
    const found = users.find((value: User) => {
        return value.username === username && value.password === password;
    })    
    
    return found?.role
}