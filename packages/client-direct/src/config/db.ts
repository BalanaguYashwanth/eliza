import { DataSource } from "typeorm";
import { FarcasterAccount } from "../models/farcaster_account";
import { User } from "../models/user";
import { Token } from "../models/token";
import { Wallet } from "../models/wallet";
import ENV_CONFIG from "./env";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: ENV_CONFIG.DB_URL,
    entities: [FarcasterAccount, Wallet, User, Token],
    synchronize: false,
    logging: process.env.NODE_ENV !== "production",
    ssl: {
        rejectUnauthorized: false,
    },
    migrations: ["src/migrations/*.ts"],
});
