import * as dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("ERROR FATAL: La variable de entorno JWT_SECRET no está definida.");
}

const environment = {
    API_PORT: process.env.API_PORT || "3000",
    JWT_SECRET: jwtSecret,
} as const

export default environment;