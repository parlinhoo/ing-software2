import * as dotenv from "dotenv";

dotenv.config();

const environment = {
    API_URL: process.env.API_URL || "http://localhost:3000",    
} as const

export default environment;
