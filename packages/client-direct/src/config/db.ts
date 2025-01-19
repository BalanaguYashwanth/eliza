import { DataSource } from "typeorm";
import { Agent } from "../models/agent";
import { AgentWallet } from "../models/agent_wallet";
import { User } from "../models/user";
import ENV_CONFIG from "./env";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: ENV_CONFIG.DB_URL,
    entities: [Agent, AgentWallet, User],
    synchronize: false,
    logging: process.env.NODE_ENV !== "production",
    ssl: {
        rejectUnauthorized: false,
    },
    migrations: ["src/migrations/*.ts"],
});
