import * as dotenv from "dotenv";

dotenv.config();

const environment = {
    API_PORT: process.env.API_PORT || "3000",    
} as const

export default environment;