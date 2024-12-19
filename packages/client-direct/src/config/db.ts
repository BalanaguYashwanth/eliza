import { DataSource } from "typeorm";
import { User } from "../models/users";
import { Agent } from "../models/agents";
import ENV_CONFIG from "./env";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: ENV_CONFIG.DB_URL,
    entities: [
     User,
     Agent
    ],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    ssl: {
      rejectUnauthorized: false
    },
    migrations: [
     'src/migrations/*.ts'
    ],
  });
