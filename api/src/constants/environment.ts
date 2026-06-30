import * as dotenv from "dotenv";

// DOTENV_CONFIG_PATH lo setea el script dev:basic; override:true garantiza
// que el .env del proyecto siempre gane sobre variables de sistema.
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH ?? '.env',
  override: true,
});

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("ERROR FATAL: La variable de entorno JWT_SECRET no está definida.");
}

const environment = {
    API_PORT: process.env.API_PORT || "3000",
    JWT_SECRET: jwtSecret,
} as const

export default environment;