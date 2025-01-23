import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
} from "typeorm";
import { CHAIN_TYPE, WALLET_TYPE, OWNER_TYPE } from "../config/constantTypes";

@Entity("wallet")
export class Wallet extends BaseEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    pk: bigint;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_address: string;

    @Column({ type: "text", nullable: true })
    wallet_name: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "int", nullable: false, default: CHAIN_TYPE.SOLANA })
    chain_type: CHAIN_TYPE;

    @Column({ type: "int", nullable: false, default: WALLET_TYPE.TURNKEY })
    wallet_type: WALLET_TYPE;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_id: string;

    // `owner_id` column to reference the agent/user ID
    @Column({ type: "bigint", nullable: false })
    owner_fk: bigint;

    // `owner_type` column to specify whether the wallet belongs to an agent or user
    @Column({ type: "int", nullable: false })
    owner_type: OWNER_TYPE;
}
