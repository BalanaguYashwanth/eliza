import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
import { CHAIN_TYPE } from "../config/constantTypes";

@Entity("user")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    pk: bigint;

    @Column({ nullable: false, unique: true })
    fid: number;

    @Column({ type: "int", nullable: false, default: CHAIN_TYPE.SOLANA })
    chain_type: CHAIN_TYPE;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}